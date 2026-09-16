import { Pool } from "pg";
import { pgConfig } from "@/lib/pg-config.mjs";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

/** Lazily created so builds and tests never need a database. */
export function db(): Pool {
  if (!globalForPg.pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForPg.pgPool = new Pool({ ...pgConfig(url), max: 5 });
  }
  return globalForPg.pgPool;
}
