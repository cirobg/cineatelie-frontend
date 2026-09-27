import { describe, expect, it } from "vitest";
import { hasPermission } from "../permissions";

describe("hasPermission", () => {
  it("always allows 'authenticated', regardless of the permission list", () => {
    expect(hasPermission([], "authenticated")).toBe(true);
  });

  it("allows a specific permission code present in the list", () => {
    expect(hasPermission(["quotes:read", "clients:read"], "quotes:read")).toBe(true);
  });

  it("denies a permission code absent from the list", () => {
    expect(hasPermission(["quotes:read"], "settings:write")).toBe(false);
  });

  it("denies everything on an empty permission list, except 'authenticated'", () => {
    expect(hasPermission([], "dashboard:read")).toBe(false);
  });
});
