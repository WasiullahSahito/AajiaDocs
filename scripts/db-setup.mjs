// Creates tables (idempotent) and seeds demo users + documents.
// Usage: DATABASE_URL=... npm run db:setup
import { readFileSync } from "node:fs";
import pg from "pg";
import { pgConfig } from "../lib/pg-config.mjs";

try { process.loadEnvFile?.(".env"); } catch {}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const client = new pg.Client({ ...pgConfig(process.env.DATABASE_URL), connectionTimeoutMillis: 15000 });

const users = [
  ["user_alice", "alice@ajaia.test", "Alice Chen"],
  ["user_bob", "bob@ajaia.test", "Bob Patel"],
  ["user_carol", "carol@ajaia.test", "Carol Diaz"],
];

const docs = [
  [
    "doc_welcome",
    "Q3 planning notes",
    "user_alice",
    "<h1>Q3 planning notes</h1><p>Owned by <strong>Alice</strong> and shared with <em>Bob</em> as an editor.</p><h2>Priorities</h2><ul><li><p>Ship the onboarding revamp</p></li><li><p>Reduce the support ticket backlog</p></li></ul><h2>Open questions</h2><ol><li><p>Do we need a <u>second</u> design review?</p></li><li><p>Who owns the launch checklist?</p></li></ol>",
  ],
  [
    "doc_handbook",
    "Team handbook",
    "user_bob",
    "<h1>Team handbook</h1><p>Owned by Bob. Alice has <strong>view-only</strong> access, so the editor is locked for her.</p>",
  ],
];

const shares = [
  ["doc_welcome", "user_bob", "editor"],
  ["doc_handbook", "user_alice", "viewer"],
];

try {
  await client.connect();
} catch (err) {
  console.error("Could not connect to the database: " + err.message);
  if (/does not exist/.test(err.message)) {
    console.error("Create that database in your Neon project (Databases → New database), or change the name in DATABASE_URL to neondb.");
  }
  process.exit(1);
}
try {
  await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  for (const u of users) {
    await client.query(
      "INSERT INTO users (id, email, name) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name",
      u,
    );
  }
  for (const d of docs) {
    await client.query(
      "INSERT INTO documents (id, title, owner_id, content) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
      d,
    );
  }
  for (const s of shares) {
    await client.query(
      "INSERT INTO document_shares (document_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
      s,
    );
  }
  console.log("Database ready. Seeded users: " + users.map((u) => u[1]).join(", "));
} finally {
  await client.end();
}
