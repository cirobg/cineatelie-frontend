/**
 * "A page reload keeps the user signed in" (implementation plan, M1 "Done when") — the
 * access token lives only in memory (frontend spec §8), so it's gone after any reload. What
 * survives is the HTTP-only refresh cookie; this re-establishes a session from it alone, by
 * calling `/auth/refresh` before the app decides whether to show `/login`.
 *
 * A refresh failure (no cookie, or an expired one) is the ordinary "not logged in" state for
 * a first-time visitor, not an application error — resolves `false`, not a thrown error.
 */
import { apiFetch, refreshAccessToken } from "../lib/httpClient";
import type { MePayload, PermissionsResponse } from "../lib/apiTypes";
import { useSessionStore } from "./session";

export async function bootstrapSession(): Promise<boolean> {
  let accessToken: string;
  try {
    accessToken = await refreshAccessToken();
  } catch {
    return false;
  }

  const me = await apiFetch<MePayload>("/me", { skipTenantHeader: true });
  useSessionStore.getState().setSession({ accessToken, me });

  if (useSessionStore.getState().activeTenant) {
    const { permissions } = await apiFetch<PermissionsResponse>("/me/permissions");
    useSessionStore.getState().setPermissions(permissions);
  }

  return true;
}
