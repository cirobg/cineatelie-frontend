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
      // The access/refresh tokens go to POST /auth/exchange and never touch storage again
      // (ADR-006) — persistSession/autoRefreshToken are off, and the custom storage below is
      // a second, independent guard that refuses to write anything but the PKCE verifier.
      persistSession: false,
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
