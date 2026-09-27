import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "../httpClient";
import { useSessionStore } from "../../auth/session";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  useSessionStore.setState({
    accessToken: null,
    me: null,
    activeTenant: null,
    permissions: [],
  });
});

describe("apiFetch headers", () => {
  it("attaches Authorization and X-Tenant-Id when the session has both", async () => {
    useSessionStore.setState({
      accessToken: "token-123",
      activeTenant: { tenant_id: "tenant-abc" } as never,
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/me");

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("X-Tenant-Id")).toBe("tenant-abc");
  });

  it("omits X-Tenant-Id when skipTenantHeader is set, even with an active tenant", async () => {
    useSessionStore.setState({
      accessToken: "token-123",
      activeTenant: { tenant_id: "tenant-abc" } as never,
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/me", { skipTenantHeader: true });

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("X-Tenant-Id")).toBeNull();
  });
});

describe("apiFetch success and error parsing", () => {
  it("returns the parsed body on a 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { hello: "world" })));

    const result = await apiFetch<{ hello: string }>("/me");

    expect(result).toEqual({ hello: "world" });
  });

  it("returns undefined on a 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const result = await apiFetch("/auth/logout", { method: "POST" });

    expect(result).toBeUndefined();
  });

  it("throws ApiError carrying the envelope's code and message on a non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(403, {
          error: { code: "tenant_forbidden", message: "Sem acesso.", details: [], request_id: "r1" },
        }),
      ),
    );

    let error: ApiError | undefined;
    try {
      await apiFetch("/me");
    } catch (caught) {
      error = caught as ApiError;
    }

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.code).toBe("tenant_forbidden");
    expect(error?.status).toBe(403);
    expect(error?.requestId).toBe("r1");
  });
});

describe("apiFetch 401 refresh-and-retry", () => {
  it("refreshes once and retries the original request on a 401", async () => {
    const fetchMock = vi
      .fn()
      // 1: original request -> 401
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "unauthenticated" } }))
      // 2: POST /auth/refresh -> new access token
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "new-token" }))
      // 3: retried original request -> succeeds
      .mockResolvedValueOnce(jsonResponse(200, { data: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ data: string }>("/me");

    expect(result).toEqual({ data: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(useSessionStore.getState().accessToken).toBe("new-token");
    // The retried call must carry the freshly refreshed token, not the old (missing) one.
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer new-token");
  });

  it("clears the session and throws unauthenticated when the refresh itself fails", async () => {
    useSessionStore.setState({ accessToken: "stale-token" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "unauthenticated" } }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    let error: ApiError | undefined;
    try {
      await apiFetch("/me");
    } catch (caught) {
      error = caught as ApiError;
    }

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.code).toBe("unauthenticated");
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it("serialises concurrent 401s through a single refresh call (no thundering herd)", async () => {
    let refreshCalls = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse(200, { access_token: "new-token" }));
      }
      // Every non-refresh call 401s once; after the token becomes "new-token" it succeeds.
      const state = useSessionStore.getState();
      if (state.accessToken === "new-token") {
        return Promise.resolve(jsonResponse(200, { ok: true }));
      }
      return Promise.resolve(jsonResponse(401, { error: { code: "unauthenticated" } }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);

    expect(refreshCalls).toBe(1);
  });
});
