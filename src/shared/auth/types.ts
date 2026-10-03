/**
 * The one auth seam (ADR-006, frontend spec §8): login, the OAuth callback and sign-out go
 * through this interface, never through `supabase-js` directly. `SupabaseAuthClient` is the
 * only implementation today; moving to Keycloak/Ory later is a new adapter, not a rewrite.
 */

/** The *provider's* tokens, not ours. The caller sends them to `POST /auth/exchange`; nothing
 * in this module talks to our own backend. */
export interface ProviderTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthClient {
  /** Starts the Google round trip. Navigates the browser away; callers should not expect code
   * after this to run in the same page load. */
  signIn(): Promise<void>;

  /** Called on `/auth/callback` after Google has redirected back through Supabase. Reads the
   * tokens Supabase returned in the redirect and clears them from the address bar. */
  handleCallback(): Promise<ProviderTokens>;

  /** Local-only cleanup (no network call to the provider — ADR-006: "the SPA never talks to
   * Supabase again" after exchange). */
  signOut(): Promise<void>;
}
