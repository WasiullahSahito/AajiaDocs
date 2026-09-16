/**
 * Route-level tests: exercise the real handlers, validation and access
 * checks with the data layer and session mocked out.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
}));
vi.mock("@/lib/repo", () => ({
  findDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { DELETE, GET, PATCH } from "@/app/api/documents/[id]/route";
import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { deleteDocument, findDocument, updateDocument } from "@/lib/repo";

const users = {
  alice: { id: "alice", email: "alice@ajaia.test", name: "Alice" },
  bob: { id: "bob", email: "bob@ajaia.test", name: "Bob" },
  carol: { id: "carol", email: "carol@ajaia.test", name: "Carol" },
  mallory: { id: "mallory", email: "mallory@ajaia.test", name: "Mallory" },
};

const doc = {
  id: "doc1",
  title: "Plan",
  content: "<p>hi</p>",
  ownerId: "alice",
  ownerName: "Alice",
  updatedAt: new Date(),
  shares: [
    { userId: "bob", role: "editor" as const },
    { userId: "carol", role: "viewer" as const },
  ],
};

const ctx = { params: Promise.resolve({ id: "doc1" }) };
const signInAs = (u: (typeof users)[keyof typeof users]) => vi.mocked(requireUser).mockResolvedValue(u);
const patch = (body: unknown) =>
  PATCH(new Request("http://test/api/documents/doc1", { method: "PATCH", body: JSON.stringify(body) }), ctx);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(findDocument).mockResolvedValue(doc);
  vi.mocked(updateDocument).mockImplementation(async (_id, p) => ({ title: p.title ?? doc.title, updatedAt: new Date() }));
});

describe("GET /api/documents/:id", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(requireUser).mockRejectedValue(new HttpError(401, "Sign in to continue."));
    const res = await GET(new Request("http://test"), ctx);
    expect(res.status).toBe(401);
  });

  it("hides documents from users they aren't shared with (404)", async () => {
    signInAs(users.mallory);
    const res = await GET(new Request("http://test"), ctx);
    expect(res.status).toBe(404);
  });

  it("lets a shared viewer read and reports their role", async () => {
    signInAs(users.carol);
    const res = await GET(new Request("http://test"), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe("viewer");
  });
});

describe("PATCH /api/documents/:id", () => {
  it("forbids viewers from editing (403) and never writes", async () => {
    signInAs(users.carol);
    const res = await patch({ content: "<p>vandalism</p>" });
    expect(res.status).toBe(403);
    expect(updateDocument).not.toHaveBeenCalled();
  });

  it("lets editors save and sanitizes the stored HTML", async () => {
    signInAs(users.bob);
    const res = await patch({ content: '<p onclick="x()">ok<script>alert(1)</script></p>' });
    expect(res.status).toBe(200);
    expect(updateDocument).toHaveBeenCalledWith("doc1", { title: undefined, content: "<p>ok</p>" });
  });

  it("rejects an empty title with a 400 and a clear message", async () => {
    signInAs(users.alice);
    const res = await patch({ title: "   " });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/title/i);
  });

  it("rejects malformed JSON", async () => {
    signInAs(users.alice);
    const res = await PATCH(new Request("http://test", { method: "PATCH", body: "{nope" }), ctx);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/documents/:id", () => {
  it("only allows the owner to delete", async () => {
    signInAs(users.bob);
    expect((await DELETE(new Request("http://test"), ctx)).status).toBe(403);
    expect(deleteDocument).not.toHaveBeenCalled();

    signInAs(users.alice);
    expect((await DELETE(new Request("http://test"), ctx)).status).toBe(204);
    expect(deleteDocument).toHaveBeenCalledWith("doc1");
  });
});
