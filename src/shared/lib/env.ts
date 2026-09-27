/**
 * Typed, fail-fast access to `import.meta.env` (architecture doc Appendix A.2). Reading a
 * required variable that's missing throws immediately at the call site rather than letting
 * `undefined` drift silently into a `fetch()` URL or a `supabase-js` client config.
 */

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return requireEnv("VITE_SUPABASE_URL");
  },
  get supabasePublishableKey(): string {
    return requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  },
  get oauthRedirectUrl(): string {
    return requireEnv("VITE_OAUTH_REDIRECT_URL");
  },
  get apiBaseUrl(): string {
    return requireEnv("VITE_API_BASE_URL");
  },
};
