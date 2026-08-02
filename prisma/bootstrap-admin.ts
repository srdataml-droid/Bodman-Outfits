import * as path from "path";
import { config as loadEnv } from "dotenv";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Resolve .env from this file's location, NOT the current working directory.
// `pnpm --filter @atelier-haute/api run bootstrap-admin` executes with
// cwd = apps/api, where no .env exists — a bare `import "dotenv/config"`
// silently loads nothing there, leaving DATABASE_URL undefined. The pg
// adapter then falls back to libpq defaults (the OS user against a local
// socket) and fails with a misleading "DatabaseAccessDenied" auth error
// rather than anything pointing at the real cause.
loadEnv({ path: path.resolve(__dirname, "../.env") });

// One-time (but safe to re-run) creation of the first Admin account.
//
// Deliberately does not invent credentials: reads ADMIN_BOOTSTRAP_EMAIL and
// ADMIN_BOOTSTRAP_PASSWORD from the environment and fails loudly if either is
// missing, per AGENTS.md's ".ENV" boundary — this script never reads or
// edits `.env` itself; the owner adds these two vars there, this script only
// reads them via process.env at run time like every other credential in
// this repo. Upserts by email, so re-running after changing the env value
// updates the existing admin's password hash instead of erroring on a
// duplicate.
async function main(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing ADMIN_BOOTSTRAP_EMAIL and/or ADMIN_BOOTSTRAP_PASSWORD.\n" +
        "Add both to .env, then re-run: pnpm --filter @atelier-haute/api run bootstrap-admin\n" +
        "(This script deliberately does not invent or default these values.)",
    );
    process.exit(1);
  }

  // Fail honestly on a missing connection string. Without this, the pg
  // adapter falls back to libpq defaults and reports an auth error that
  // looks like a credentials problem instead of a configuration one.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set — cannot reach the database.\n" +
        "Expected it in the repo-root .env file.",
    );
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  await prisma.$disconnect();
  console.log(`Admin account ready: ${admin.email}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
