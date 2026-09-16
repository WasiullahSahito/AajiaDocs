# Architecture note

## What I prioritized

The brief rewards depth in a few areas over broad coverage, so I aimed for a slice that works end to end with correct access control:

1. **An editing loop that feels trustworthy.** Autosave with a visible state (saving, saved, error with retry), no lost edits when navigating away, and formatting that survives a reload.
2. **Sharing that is actually enforced.** Every read and write goes through one permission function on the server. The UI hides controls a user can't use, but it is never the thing that protects the data.
3. **Safe handling of user content.** Shared documents render one user's HTML in another user's browser, so everything stored is sanitized against an allowlist.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 15 (App Router) + TypeScript | One repo and one deploy for UI and API; server components read data directly |
| Editor | TipTap 2 (ProseMirror) | Headless, solid rich-text core; the required formatting comes built in |
| Database | Postgres via `pg` and hand-written SQL | Three tables with simple queries. No ORM codegen or engine binaries, and it runs on any free Postgres (Neon, Supabase, Docker) |
| Validation | Zod | Request schemas return readable error messages |
| Tests | Vitest | Fast, TypeScript-native, no setup |

I started with Prisma and switched to `pg`. Prisma needs to download engine binaries at install time, which failed in my build environment. With three tables, an ORM wasn't adding much, and all SQL now lives in `lib/repo.ts`.

## Key decisions

**Storage format: sanitized HTML.** TipTap can store either JSON or HTML. I chose HTML because file imports (Markdown via `marked`, `.docx` via `mammoth`) already produce HTML, so there's a single format and a single sanitizer (`lib/sanitize.ts`) applied on every write. The allowlist matches the editor's schema. If the editor gained features like tables or links, the allowlist would need to change with it, which is the main cost of this choice.

**Access control in one place.** `lib/access.ts` maps roles to allowed actions:

| Role | read | edit | share | delete |
| --- | --- | --- | --- | --- |
| owner | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | | |
| viewer | ✓ | | | |

`loadDocumentFor(id, user, action)` is the only path routes and pages use to reach a document. Users with no access get **404**, so the app doesn't reveal that a document exists. Users who can see a document but lack the permission get **403**.

**Autosave instead of a Save button.** Edits are debounced at 800 ms, and title and content changes are merged into one PATCH. Only one request is in flight at a time, so saves can't race and overwrite each other. Failed changes are kept and retried.

**Import creates a new document.** This is the most common real-world case ("I have notes, make them a doc") and avoids merge questions. Uploads are capped at 4 MB because Vercel functions reject request bodies over about 4.5 MB.

**Mocked auth.** The session cookie holds a seeded user id (httpOnly, SameSite=Lax). This keeps reviewer setup instant, but it is **not secure**: anyone could forge the cookie. In production I'd replace `lib/auth.ts` with a real provider (Auth.js or Clerk) and signed sessions. Because only that file knows how the current user is found, nothing else would need to change.

## What I cut, and why

| Cut | Reason |
| --- | --- |
| Real-time co-editing | Needs CRDTs (Yjs) plus a WebSocket service. Too much for the timebox to do well. Right now the last write wins if two editors type at the same moment. |
| Comments, suggestions, version history | Each is a feature in its own right; I spent that time on permission correctness and upload handling |
| Real authentication | The brief allows mocked users; the auth boundary is isolated so it can be swapped later |
| Inviting people without accounts | Sharing requires an existing account, so there's no email or invite flow |
| Images, links, tables in documents | They broaden the sanitizer and import surface; the required formatting set is covered |

The one stretch item I included is **role-based sharing (viewer/editor)**, because it fell naturally out of the permission design.

## What I'd build next (2–4 hours)

1. **Conflict safety:** send `updatedAt` with each save and reject stale writes with a "this document changed" prompt. This is a cheap step toward real collaboration.
2. **Real-time presence:** show who else has the document open, via polling or a hosted service like Liveblocks.
3. **Export to Markdown and PDF.**
4. **An end-to-end Playwright test** of the share flow in CI. I ran this flow manually with Playwright during development but didn't commit it as a test.
