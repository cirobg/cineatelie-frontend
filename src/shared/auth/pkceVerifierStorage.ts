/**
 * A `supabase-js` storage adapter that persists ONLY the PKCE code verifier, and only in
 * `sessionStorage` — never a session or refresh token. Needed regardless of
 * `persistSession: false`: the verifier must survive a real full-page navigation to Google
 * and back (frontend spec §8, "Gotcha"), which no in-memory value can do, so *something*
 * must be written to browser storage no matter what the session-persistence setting says.
 *
 * Filters by key suffix (`-code-verifier`) — the stable pattern supabase-js itself uses
 * (`${storageKey}-code-verifier`) — rather than hardcoding the project-specific storage key.
 * Every other key is a deliberate no-op: even though `persistSession: false` should already
 * stop supabase-js writing a session, this is the second, independent line of defence the
 * spec asks for — a session/refresh token must never reach any Storage, full stop.
 */
function isCodeVerifierKey(key: string): boolean {
  return key.endsWith("-code-verifier");
}

export const pkceVerifierOnlyStorage = {
  getItem(key: string): string | null {
    return isCodeVerifierKey(key) ? sessionStorage.getItem(key) : null;
  },
  setItem(key: string, value: string): void {
    if (isCodeVerifierKey(key)) {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem(key: string): void {
    if (isCodeVerifierKey(key)) {
      sessionStorage.removeItem(key);
    }
  },
};
