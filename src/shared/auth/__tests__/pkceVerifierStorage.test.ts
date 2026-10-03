import { beforeEach, describe, expect, it, vi } from "vitest";
import { pkceVerifierOnlyStorage } from "../pkceVerifierStorage";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

// vite.config.ts runs tests under environment: "node", which has no sessionStorage global --
// stubbed per test so this file doesn't need to switch the whole suite to a jsdom environment
// just for these three tests.
beforeEach(() => {
  vi.stubGlobal("sessionStorage", createMemoryStorage());
});

describe("pkceVerifierOnlyStorage", () => {
  it("persists a key ending in -code-verifier", () => {
    pkceVerifierOnlyStorage.setItem("sb-project-ref-auth-token-code-verifier", "verifier-value");

    expect(pkceVerifierOnlyStorage.getItem("sb-project-ref-auth-token-code-verifier")).toBe(
      "verifier-value",
    );
  });

  it("refuses to persist a session/token key -- the second guard beyond persistSession: false", () => {
    pkceVerifierOnlyStorage.setItem("sb-project-ref-auth-token", "session-json-with-tokens");

    expect(pkceVerifierOnlyStorage.getItem("sb-project-ref-auth-token")).toBeNull();
    // Not merely filtered on read: it was never written to the underlying storage at all.
    expect(sessionStorage.getItem("sb-project-ref-auth-token")).toBeNull();
  });

  it("removeItem only clears a code-verifier key, silently ignoring anything else", () => {
    sessionStorage.setItem("some-other-key", "untouched");
    pkceVerifierOnlyStorage.setItem("x-code-verifier", "value");

    pkceVerifierOnlyStorage.removeItem("some-other-key");
    pkceVerifierOnlyStorage.removeItem("x-code-verifier");

    expect(sessionStorage.getItem("some-other-key")).toBe("untouched");
    expect(sessionStorage.getItem("x-code-verifier")).toBeNull();
  });
});
