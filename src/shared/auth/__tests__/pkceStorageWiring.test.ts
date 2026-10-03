import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Regression test for the real SDK behaviour, not a mock of it: with persistSession: false,
// supabase-js ignores the storage it is given and keeps the PKCE verifier in memory, which a
// full-page redirect to Google throws away. With persistSession: true the given storage is the
// one used, so the verifier survives the round trip.
function spyStorage() {
  const store = new Map<string, string>();
  return {
    setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    removeItem: vi.fn((key: string) => void store.delete(key)),
  };
}

function clientWith(persistSession: boolean, storage: ReturnType<typeof spyStorage>) {
  return createClient("https://test-project.supabase.co", "sb_publishable_test", {
    auth: { persistSession, autoRefreshToken: false, detectSessionInUrl: false, flowType: "pkce", storage },
  });
}

describe("supabase-js PKCE verifier storage wiring", () => {
  it("writes the verifier to the supplied storage when persistSession is true", async () => {
    const storage = spyStorage();
    const client = clientWith(true, storage);

    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/auth/callback", skipBrowserRedirect: true },
    });

    const verifierWrites = storage.setItem.mock.calls.filter(([key]) => key.endsWith("-code-verifier"));
    expect(verifierWrites.length).toBeGreaterThan(0);
  });

  it("does NOT use the supplied storage when persistSession is false (the bug this guards against)", async () => {
    const storage = spyStorage();
    const client = clientWith(false, storage);

    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/auth/callback", skipBrowserRedirect: true },
    });

    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
