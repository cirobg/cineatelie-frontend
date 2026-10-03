/**
 * The only file that may import `@supabase/supabase-js` (enforced by the
 * `no-restricted-imports` rule in `.oxlintrc.json`, frontend spec §8). Everything else in the
 * app depends on `AuthClient`, never on this.
 *
 * Implicit flow, not PKCE: PKCE failed on this project because Supabase lost the server-side
 * record of each login flow (see the M1 status doc). Implicit needs no such record: Supabase
 * returns the tokens directly in the redirect. The trade-off is that they pass through the URL
 * for a moment, so the URL is cleared immediately. Recorded in ADR-006; revisit when the PKCE
 * question is answered.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../lib/env";
import type { AuthClient, ProviderTokens } from "./types";

function createSupabaseClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Reads the provider tokens from the hash Supabase appends to the redirect. Pure, so it can be
 * tested without a browser. Throws if Supabase reported an error or omitted either token. */
export function parseImplicitCallbackHash(hash: string): ProviderTokens {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const reported = params.get("error_description") ?? params.get("error");
  if (reported) {
    throw new Error(reported);
  }
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    throw new Error("callback did not include the login tokens");
  }
  return { accessToken, refreshToken };
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
    const hash = window.location.hash;
    // Clear the tokens from the address bar before anything else can read or log them.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return parseImplicitCallbackHash(hash);
  }

  async signOut(): Promise<void> {
    // Local only: no network call to Supabase (ADR-006). Revoking the session at the provider
    // is our own backend's POST /auth/logout, called separately.
    await this.client.auth.signOut({ scope: "local" });
  }
}
