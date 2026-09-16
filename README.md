# Ajaia Docs

A lightweight collaborative document editor: create and format documents in the browser, import files, and share documents with other users as editors or viewers.

**Live demo:** _add your Vercel URL here_

## Demo accounts

Auth is mocked. The sign-in page lists seeded accounts, and you choose one to sign in.

| Name | Email | Seeded data |
| --- | --- | --- |
| Alice Chen | alice@ajaia.test | Owns "Q3 planning notes" (shared with Bob as editor); can view Bob's "Team handbook" |
| Bob Patel | bob@ajaia.test | Owns "Team handbook"; can edit Alice's "Q3 planning notes" |
| Carol Diaz | carol@ajaia.test | No documents, so you can share one with her from scratch |

**Two-minute sharing check:** sign in as Alice → open "Q3 planning notes" → **Share** → add `carol@ajaia.test` as *Can view* → **Switch account** → sign in as Carol → the document appears under "Shared with me" and opens read-only.

## Features

- **Documents:** create, rename (click the title), edit, and delete (owner only). Changes autosave about 0.8 s after you stop typing, with a visible save status, a retry on failure, and a warning if you close the tab with unsaved changes.
- **Rich text:** normal text, headings 1–3, bold, italic, underline, bulleted and numbered lists, undo/redo, and the standard keyboard shortcuts.
- **File import:** **Import file** turns a `.txt`, `.md`, or `.docx` file (up to 4 MB) into a new editable document. Other file types are rejected with a clear message.
- **Sharing:** every document has one owner. The owner can grant access by email as *Can edit* or *Can view*, change roles, and remove access. The dashboard separates "My documents" from "Shared with me".
- **Persistence:** Postgres stores documents, formatting (as sanitized HTML), and shares.

## Run locally

Requirements: Node 20+ and either Docker or any Postgres database.

```bash
npm install
cp .env.example .env          # default points at the docker-compose database
docker compose up -d          # starts Postgres 16 on localhost:5432
npm run db:setup              # creates tables + seeds demo data (safe to re-run)
npm run dev                   # http://localhost:3000
```

Without Docker, create a free Postgres database on [Neon](https://neon.tech) and paste its connection string into `.env` as `DATABASE_URL`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the automated tests (Vitest, no database needed) |
| `npm run typecheck` | TypeScript check |
| `npm run build && npm start` | Production build and server |
| `npm run db:setup` | Create the schema and seed demo users/documents |

## Deploy (Vercel + Neon, both free)

1. Create a Neon project and copy the **pooled** connection string.
2. Run `DATABASE_URL="<neon url>" npm run db:setup` once from your machine.
3. Push this repo to GitHub, import it in Vercel, and add `DATABASE_URL` as an environment variable.
4. Deploy. No build settings need to change.

## Tests

`npm test` runs 28 tests in three files:

- `tests/access.test.ts` covers the permission matrix (owner / editor / viewer / stranger × read / edit / share / delete).
- `tests/documents-api.test.ts` calls the real route handlers with the data layer mocked. It checks 401 when signed out, 404 for users the document isn't shared with, 403 when a viewer tries to edit or an editor tries to delete, that saved HTML is sanitized, and that validation errors are handled.
- `tests/import.test.ts` covers conversion of Markdown and text, stripping of `<script>` and event handlers from imports, and rejection of unsupported, empty, or corrupt files.

## Project layout

```
app/                  Next.js App Router pages and API routes
  api/documents/...   REST endpoints (CRUD, shares, import)
components/           Client UI (editor, toolbar, share dialog, dashboard actions)
lib/
  access.ts           Permission rules (pure functions)
  documents.ts        Load a document + enforce an action
  repo.ts             All SQL
  import.ts           File → sanitized HTML conversion
  sanitize.ts         HTML allowlist
  validation.ts       Zod request schemas
db/schema.sql         Database schema
scripts/db-setup.mjs  Schema + seed
tests/                Vitest suites
docs/screenshots/     UI screenshots
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and [AI_WORKFLOW.md](AI_WORKFLOW.md) for how AI tools were used.

## Troubleshooting

- **`database "ajaia_docs" does not exist`:** create a database with that name in the Neon console (Databases → New database), or change the name at the end of `DATABASE_URL` to `neondb`.
- **Connection timeout on Neon:** free projects sleep when idle. Wait a few seconds and retry.
- **SSL certificate errors with other hosts** (for example, Supabase's pooler): set `DATABASE_SSL_NO_VERIFY=true` in `.env`.
- **`DATABASE_URL is not set`:** `.env` must sit next to `package.json`. On Windows, check that it wasn't saved as `.env.txt`.
