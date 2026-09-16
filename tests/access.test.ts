import { describe, expect, it } from "vitest";
import { can, resolveRole, type AccessSubject } from "@/lib/access";

const doc: AccessSubject = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "editor" },
    { userId: "carol", role: "viewer" },
  ],
};

describe("resolveRole", () => {
  it("identifies the owner, editors, viewers and strangers", () => {
    expect(resolveRole("alice", doc)).toBe("owner");
    expect(resolveRole("bob", doc)).toBe("editor");
    expect(resolveRole("carol", doc)).toBe("viewer");
    expect(resolveRole("mallory", doc)).toBeNull();
    expect(resolveRole(null, doc)).toBeNull();
  });
});

describe("can", () => {
  it.each([
    ["owner", "read", true], ["owner", "edit", true], ["owner", "share", true], ["owner", "delete", true],
    ["editor", "read", true], ["editor", "edit", true], ["editor", "share", false], ["editor", "delete", false],
    ["viewer", "read", true], ["viewer", "edit", false], ["viewer", "share", false], ["viewer", "delete", false],
  ] as const)("%s can %s → %s", (role, action, expected) => {
    expect(can(role, action)).toBe(expected);
  });

  it("denies everything when there is no role", () => {
    expect(can(null, "read")).toBe(false);
  });
});
