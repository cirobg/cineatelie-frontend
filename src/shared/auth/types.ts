/**
 * The one auth seam (ADR-006, frontend spec §8): login, the OAuth callback and sign-out go
 * through this interface, never through `supabase-js` directly. `SupabaseAuthClient` is the
 * only implementation today; moving to Keycloak/Ory later is a new adapter, not a rewrite.
 */

/** What `handleCallback()` hands back — the *provider's* tokens, not ours. The caller sends
 * these to `POST /auth/exchange`; nothing in this module talks to our own backend. */
export interface ProviderTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthClient {
  /** Starts the OAuth round trip. Navigates the browser away (to the provider); callers should
   * not expect code after this to run in the same page load. Production uses Google only;
   * `github` exists for the dev-only provider test. */
  signIn(provider?: "google" | "github"): Promise<void>;

  /** Called on `/auth/callback` once Google has redirected back through Supabase. Completes
   * the PKCE exchange and returns the provider tokens for `POST /auth/exchange`. */
  handleCallback(): Promise<ProviderTokens>;

  /** Local-only cleanup (no network call to the provider — ADR-006: "the SPA never talks to
   * Supabase again" after exchange). Revoking the session at the provider is our own
   * backend's `POST /auth/logout`, called separately. */
  signOut(): Promise<void>;
}
