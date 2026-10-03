import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseImplicitCallbackHash, SupabaseAuthClient } from "../supabaseAuthClient";

/** Only the shape SupabaseAuthClient calls, injected via the constructor: no env vars, no
 * network, no DOM. */
function fakeSupabaseClient(overrides: Partial<SupabaseClient["auth"]> = {}): SupabaseClient {
  return {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

describe("SupabaseAuthClient.signIn", () => {
  it("starts the Google OAuth flow", async () => {
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

describe("SupabaseAuthClient.signOut", () => {
  it("clears only local state, never a network call to the provider (ADR-006)", async () => {
    const supabase = fakeSupabaseClient();
    const client = new SupabaseAuthClient(supabase);

    await client.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("parseImplicitCallbackHash", () => {
  it("returns the provider tokens from the redirect hash", () => {
    const tokens = parseImplicitCallbackHash(
      "#access_token=at-123&refresh_token=rt-456&expires_in=3600&token_type=bearer",
    );

    expect(tokens).toEqual({ accessToken: "at-123", refreshToken: "rt-456" });
  });

  it("accepts the hash without its leading #", () => {
    const tokens = parseImplicitCallbackHash("access_token=at&refresh_token=rt");

    expect(tokens.accessToken).toBe("at");
  });

  it("throws the reported error when Supabase redirects with one", () => {
    expect(() =>
      parseImplicitCallbackHash("#error=access_denied&error_description=user+cancelled"),
    ).toThrow("user cancelled");
  });

  it("throws when either token is missing", () => {
    expect(() => parseImplicitCallbackHash("#access_token=at")).toThrow(
      "callback did not include the login tokens",
    );
  });
});
