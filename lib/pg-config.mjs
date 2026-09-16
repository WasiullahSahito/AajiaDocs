// Shared by the app (lib/db.ts) and scripts/db-setup.mjs.
// Hosted providers (Neon, Supabase) put SSL flags in the URL; node-postgres
// warns about some of them, so we strip them and configure SSL explicitly.
export function pgConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: isLocal ? false : { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== "true" },
  };
}
