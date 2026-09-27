import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthClient } from "../supabaseAuthClient";

// environment: "node" (vite.config.ts) has no `window` -- handleCallback reads
// window.location.href to hand the full callback URL to exchangeCodeForSession, so it needs
// at least this much of a browser global. A minimal stub rather than switching to jsdom,
// since nothing else in this suite needs a DOM.
beforeEach(() => {
  vi.stubGlobal("window", {
    location: { href: "https://test.example/auth/callback?code=abc123" },
  });
});

/** Only the shape SupabaseAuthClient actually calls -- injected via the constructor so this
 * suite never touches the real env vars or network, and never needs jsdom. */
function fakeSupabaseClient(overrides: Partial<SupabaseClient["auth"]> = {}): SupabaseClient {
  return {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      exchangeCodeForSession: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

describe("SupabaseAuthClient.signIn", () => {
  it("starts the Google OAuth flow with the configured redirect", async () => {
    const supabase = fakeSupabaseClient();
    const client = new SupabaseAuthClient(supabase);

    await client.signIn();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" }),
    );
  });

  it("throws when Supabase reports an error", async () => {
    const supabase = fakeSupabaseClient({
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }),
    });
    const client = new SupabaseAuthClient(supabase);

    await expect(client.signIn()).rejects.toThrow("boom");
  });
});

describe("SupabaseAuthClient.handleCallback", () => {
  it("returns the provider's access and refresh tokens from the session", async () => {
    const supabase = fakeSupabaseClient({
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: {
          session: { access_token: "provider-access", refresh_token: "provider-refresh" },
        },
        error: null,
      }),
    });
    const client = new SupabaseAuthClient(supabase);

    const tokens = await client.handleCallback();

    expect(tokens).toEqual({ accessToken: "provider-access", refreshToken: "provider-refresh" });
  });

  it("throws when the code exchange fails", async () => {
    const supabase = fakeSupabaseClient({
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: new Error("invalid code"),
      }),
    });
    const client = new SupabaseAuthClient(supabase);

    await expect(client.handleCallback()).rejects.toThrow("invalid code");
  });
});

describe("SupabaseAuthClient.signOut", () => {
  it("clears only local state -- never a network call to the provider (ADR-006)", async () => {
    const supabase = fakeSupabaseClient();
    const client = new SupabaseAuthClient(supabase);

    await client.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
