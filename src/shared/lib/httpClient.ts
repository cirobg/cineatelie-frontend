/**
 * The fetch wrapper (implementation plan step 4; frontend spec §8): auth header, tenant
 * header, error-envelope parsing, single-flight refresh-and-retry on `401`. Temporary
 * hand-written client for the identity endpoints only, until `contract/openapi.json` and
 * codegen exist (M1 status doc, "Deliberately deferred") -- every other feature module will
 * eventually call through a generated client instead of this file directly.
 */
import { useSessionStore } from "../auth/session";
import { env } from "./env";
import type { ApiErrorBody, RefreshResponse } from "./apiTypes";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];
  readonly requestId: string | null;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.requestId = body.request_id;
  }
}

interface ApiFetchOptions extends RequestInit {
  /** `/me`, `/auth/*` take no tenant header -- everything else does. */
  skipTenantHeader?: boolean;
}

// Module-level, not per-call: concurrent 401s across independent components must share one
// refresh, or each fires its own POST /auth/refresh at once (frontend spec §8: "concurrent
// refreshes are serialised through a single in-flight promise to avoid a thundering herd").
let refreshInFlight: Promise<string> | null = null;

/** Exported for `shared/auth/bootstrap.ts` -- reused rather than duplicated, so there is
 * exactly one place that knows how to talk to `/auth/refresh`. */
export async function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include", // the HTTP-only refresh cookie, never read by JS
    });
    if (!response.ok) {
      throw new Error(`refresh failed with status ${response.status}`);
    }
    const body = (await response.json()) as RefreshResponse;
    useSessionStore.getState().setAccessToken(body.access_token);
    return body.access_token;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

const UNAUTHENTICATED_AFTER_REFRESH_FAILURE: ApiErrorBody = {
  code: "unauthenticated",
  message: "Sua sessão expirou. Faça login novamente.",
  details: [],
  request_id: null,
};

const MALFORMED_ERROR_RESPONSE: ApiErrorBody = {
  code: "unknown_error",
  message: "Ocorreu um erro inesperado. Tente novamente.",
  details: [],
  request_id: null,
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  isRetry = false,
): Promise<T> {
  const { skipTenantHeader, headers, ...rest } = options;
  const { accessToken, activeTenant } = useSessionStore.getState();

  const requestHeaders = new Headers(headers);
  if (rest.body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!skipTenantHeader && activeTenant) {
    requestHeaders.set("X-Tenant-Id", activeTenant.tenant_id);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: "include",
  });

  if (response.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
    } catch {
      useSessionStore.getState().clear();
      throw new ApiError(401, UNAUTHENTICATED_AFTER_REFRESH_FAILURE);
    }
    return apiFetch<T>(path, options, true);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error ?? MALFORMED_ERROR_RESPONSE);
  }

  return payload as T;
}
