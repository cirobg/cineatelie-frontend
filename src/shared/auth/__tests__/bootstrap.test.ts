import { beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapSession } from "../bootstrap";
import { useSessionStore } from "../session";
import { apiFetch, refreshAccessToken } from "../../lib/httpClient";

vi.mock("../../lib/httpClient", () => ({
  apiFetch: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.setState({ accessToken: null, me: null, activeTenant: null, permissions: [] });
});

describe("bootstrapSession", () => {
  it("resolves false without touching the session when there is no valid refresh cookie", async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("refresh failed with status 401"));

    const result = await bootstrapSession();

    expect(result).toBe(false);
    expect(apiFetch).not.toHaveBeenCalled();
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it("re-establishes the session and permissions from a valid refresh cookie", async () => {
    const me = {
      user_id: "u1",
      email: "a@example.com",
      full_name: "A",
      avatar_url: null,
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      tenants: [
        {
          tenant_id: "t1",
          slug: "atelie-a",
          trade_name: "Ateliê A",
          logo_url: null,
          role_code: "owner",
          is_default: true,
          plan_code: "trial",
          subscription_active: true,
        },
      ],
    };
    vi.mocked(refreshAccessToken).mockResolvedValue("fresh-token");
    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path === "/me") return me;
      if (path === "/me/permissions") return { permissions: ["dashboard:read", "quotes:read"] };
      throw new Error(`unexpected path ${path}`);
    });

    const result = await bootstrapSession();

    expect(result).toBe(true);
    const state = useSessionStore.getState();
    expect(state.accessToken).toBe("fresh-token");
    expect(state.activeTenant?.tenant_id).toBe("t1");
    expect(state.permissions).toEqual(["dashboard:read", "quotes:read"]);
  });
});
