# Submission

**Live app:** _your Vercel URL_
**Walkthrough video:** see `VIDEO_URL.txt`
**Demo accounts:** alice@ajaia.test, bob@ajaia.test, carol@ajaia.test (choose one on the sign-in page; no password)

## Included

| Item | Location |
| --- | --- |
| Source code | `app/`, `components/`, `lib/`, `db/`, `scripts/` |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Automated tests | `tests/` (run `npm test`) |
| Walkthrough video link | `VIDEO_URL.txt` |
| Screenshots | `docs/screenshots/` |
| Local database | `docker-compose.yml`, `.env.example` |

## Status

**Working end to end:** create, rename, edit, autosave, reopen, and delete documents; bold, italic, underline, H1–H3, bulleted and numbered lists; `.txt`/`.md`/`.docx` import into a new document; sharing by email with editor or viewer roles, role changes, and revoking access; owned vs. shared dashboard; server-enforced permissions; persistence in Postgres.

**Intentionally not built:** real-time co-editing (last write wins), real authentication, comments, version history, export. See `ARCHITECTURE.md` for the reasoning.

**Next with 2–4 more hours:** stale-write detection on save, presence indicators, Markdown/PDF export, and a committed Playwright end-to-end test.
