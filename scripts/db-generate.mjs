#!/usr/bin/env node
// Cross-platform wrapper: sets SKIP_ENV_VALIDATION before running drizzle-kit generate
import { execSync } from "child_process";

try {
  execSync("drizzle-kit generate", {
    stdio: "inherit",
    env: { ...process.env, SKIP_ENV_VALIDATION: "1" },
  });
} catch {
  // Silently exit OK during fresh install when DB env vars aren't set yet
  process.exit(0);
}
