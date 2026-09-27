/**
 * The one genuinely shared piece of client state (ADR-005: "the app has very little truly
 * global state: session, tenant..."). Zustand, not Context -- read outside React too (the
 * fetch wrapper needs the current token and tenant on every request without a hook).
 *
 * No tenant switcher in v1 (OI-09): `setSession` always resolves the `is_default` membership
 * (falling back to the first) and that's it for the whole session -- the `memberships` model
 * still supports several, only the switching UI is absent.
 */
import { create } from "zustand";
import type { MePayload, TenantMembership } from "../lib/apiTypes";

interface SessionState {
  accessToken: string | null;
  me: MePayload | null;
  activeTenant: TenantMembership | null;
  permissions: string[];
  setSession(params: { accessToken: string; me: MePayload }): void;
  setAccessToken(accessToken: string): void;
  setPermissions(permissions: string[]): void;
  clear(): void;
}

function pickActiveTenant(me: MePayload): TenantMembership | null {
  return me.tenants.find((t) => t.is_default) ?? me.tenants[0] ?? null;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  me: null,
  activeTenant: null,
  permissions: [],
  setSession: ({ accessToken, me }) =>
    set({ accessToken, me, activeTenant: pickActiveTenant(me) }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setPermissions: (permissions) => set({ permissions }),
  clear: () => set({ accessToken: null, me: null, activeTenant: null, permissions: [] }),
}));
