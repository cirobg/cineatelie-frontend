/**
 * The only file that may import `@supabase/supabase-js` (enforced by the
 * `no-restricted-imports` rule in `.oxlintrc.json`, added in this same commit — ADR-006,
 * frontend spec §8). Everything else in the app depends on `AuthClient`, never on this.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../lib/env";
import { pkceVerifierOnlyStorage } from "./pkceVerifierStorage";
import type { AuthClient, ProviderTokens } from "./types";

function createSupabaseClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      // persistSession must stay TRUE. With false, supabase-js ignores the storage passed
      // below and keeps the PKCE verifier in memory, which the redirect to Google discards
      // (verified against the SDK, see pkceStorageWiring.test.ts). Session and refresh tokens
      // are still never persisted: pkceVerifierOnlyStorage refuses every key except the
      // verifier, and autoRefreshToken is off, so the tokens go to POST /auth/exchange and
      // nothing else (ADR-006).
      persistSession: true,
      // Puts a flow id on the callback URL so each callback is matched to its own verifier.
      // Without it, two pending sign-ins (a retry, or two tabs) leave the callback guessing
      // which verifier belongs to its code, and Supabase rejects the mismatch as "invalid
      // flow state". Experimental in supabase-js, but it is the SDK's own fix for this case.
      experimental: { appendPkceFlowIdToRedirects: true },
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      storage: pkceVerifierOnlyStorage,
    },
  });
}

export class SupabaseAuthClient implements AuthClient {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = createSupabaseClient()) {
    this.client = client;
  }

  async signIn(): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: env.oauthRedirectUrl },
    });
    if (error) {
      throw error;
    }
  }

  async handleCallback(): Promise<ProviderTokens> {
    const { data, error } = await this.client.auth.exchangeCodeForSession(window.location.href);
    if (error) {
      throw error;
    }
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async signOut(): Promise<void> {
    // scope: "local" only clears this client's own in-memory/verifier-storage state -- no
    // network call to Supabase (ADR-006: "the SPA never talks to Supabase again"). Revoking
    // the session at the provider is our own backend's POST /auth/logout, called separately.
    await this.client.auth.signOut({ scope: "local" });
  }
}
