# AI workflow note

> **Before submitting:** this note describes how the code was produced. Edit it so it reflects *your* process. Add what you reviewed, changed, or tested yourself, and remove anything that isn't true for you. Reviewers will ask about it in the walkthrough.

## Tools used

- **Claude (claude.ai, with a code-execution sandbox):** planned scope, generated the codebase, and ran builds, tests, a real Postgres database, and a headless browser to verify behavior.
- _Add any others you used (Cursor, Copilot, ChatGPT, …)._

## Where AI materially sped things up

- **Scaffolding:** the API routes, schema, seed script, and editor wiring were produced in one pass instead of hours of boilerplate.
- **Test matrix:** the full owner/editor/viewer/stranger × action table in `tests/access.test.ts` was quick to enumerate exhaustively.
- **Verification loop:** the assistant ran `tsc`, Vitest, a production build, a `curl` script covering every sharing and error path against a real Postgres, and a Playwright flow (edit → reload → share → switch user → confirm read-only), then fixed what failed.

## AI output that was changed or rejected

These came up during the build session:

- **ORM choice reversed:** the first version used Prisma. It couldn't download its engine binaries in the build environment, so the data layer was rewritten with plain `pg` and explicit SQL. That's simpler for three tables and removes a deploy-time dependency.
- **CSS bug found through screenshots:** a specificity conflict (`.doc-body p { margin: 0 }` overriding the block-spacing rule) removed the gap under headings. The tests didn't catch it; reviewing a screenshot and checking computed styles in the browser did.
- **Share dialog re-fetching:** the dialog's effect depended on an inline `onClose` callback, so every autosave re-render in the parent refetched the share list and stole focus from the input. Fixed by holding the callback in a ref.
- **Access response codes:** I chose 404 rather than 403 for users with no access, so the app doesn't confirm that a document exists.
- _Add your own: anything you rewrote, simplified, or rejected after reading the code._

## How correctness and quality were verified

- **Automated:** 28 Vitest tests covering permissions, route handlers (401/403/404, sanitization, validation), and file conversion including XSS stripping.
- **End-to-end against real Postgres:** scripted HTTP checks of create → save → reopen, share → access → role enforcement → revoke, import of `.md`, `.txt`, and a real `.docx`, and rejection of unsupported types.
- **Browser:** a Playwright run through the main flow with no console errors, plus desktop and mobile screenshots reviewed by eye.
- **Security review of generated code:** confirmed every route calls `requireUser` and `loadDocumentFor` before touching data, and that content is sanitized on write, not only on import.
- _Add your manual testing on the deployed build._
