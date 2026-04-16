import { defineConfig } from "drizzle-kit";

// During postinstall SKIP_ENV_VALIDATION=1, so we read env directly
// to avoid the t3-env startup crash before .env exists
const dbUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/infernum";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  out: "migrations",
  dbCredentials: {
    url: dbUrl,
  },
  tablesFilter: ["kd_*"],
  verbose: true,
  strict: true,
});
