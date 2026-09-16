export function pgConfig(databaseUrl: string): {
  connectionString: string;
  ssl: false | { rejectUnauthorized: boolean };
};
