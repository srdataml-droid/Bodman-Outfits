# Architecture

Purpose: Describe the system's technical design, major components, boundaries, integrations, deployment model, and key architectural decisions.

## Decision Log

### 2026-07-28 — Archive migration boundary

The supplied Atelier Haute archive is an approved **migration source**, not a
runtime dependency or architecture exception.

- Rebuild selected web experiences in a Next.js/React application under
  `apps/`.
- Rebuild server-side capabilities in the REST-first NestJS API under `apps/`.
- Persist approved domain data in PostgreSQL through Prisma; validate external
  input with Zod.
- Do not bring Vite, Express, Bun/npm tooling, in-memory persistence,
  front-end mock API behavior, default credentials, or embedded third-party
  secrets into the production platform.
- Evaluate payment and AI integrations only after their business purpose,
  authorization model, data-handling rules, provider, and acceptance criteria
  are documented and approved.

See [archive-migration.md](archive-migration.md) for the implementation
inventory and migration constraints.

### 2026-07-29 — Single-tenant product boundary

The authoritative `files (1).zip` specification is approved. The platform
serves one tailoring business; it is not a SaaS product. Do not introduce
tenant data, tenant authorization, workspace switching, or craftsperson/staff
accounts. The only authenticated role is Admin. Customers use public,
unauthenticated flows and do not have accounts.

### 2026-08-02 — ShopSettings backend: generator, dev runner, and singleton pattern

First `apps/api` feature to use Prisma and real NestJS constructor injection;
surfaced two pre-existing, unexercised infrastructure gaps in the scaffold
(neither specific to ShopSettings — both would have blocked any future
Prisma-backed or DI-using feature). Full detail and reasoning in
`docs/api.md` under "Approved Contract Addition — Shop WhatsApp Contact"; summary:

- **Generator**: `prisma/schema.prisma` uses `provider = "prisma-client-js"`
  (legacy), not `"prisma-client"` (the generally-recommended Prisma 7
  generator). The newer one emits ESM-only source that crashes under this
  repo's CommonJS `apps/api`. Do not switch back without first deciding to
  migrate `apps/api` to ESM.
- **Dev runner**: `apps/api`'s `dev` script moved from `tsx watch` to
  `nodemon --watch src --ext ts --exec "ts-node src/main.ts"`. `tsx`
  (esbuild-based) does not emit `emitDecoratorMetadata`, which NestJS's
  constructor injection requires — confirmed via
  `Reflect.getMetadata("design:paramtypes", ...)` returning `undefined`
  under `tsx` versus the correct class reference under `ts-node`.
- **Prisma Client output location**: generated to `<repo-root>/generated/prisma`
  (matching a pre-existing `.gitignore` entry, so this was already the
  intended location, not a new choice). Not inside a shared `packages/`
  workspace member — `apps/api` is the only consumer today. Revisit if/when
  `apps/admin` also needs direct Prisma access; the smaller/simpler move
  then is likely a shared `packages/database` package re-exporting the
  generated client, rather than duplicating generation.
- **Singleton settings pattern**: `ShopSettings` is a single-row table with
  a fixed id (`"singleton"`) rather than a proper key-value settings store.
  Matches the fixed shape already documented in `docs/api.md`; revisit only
  if a second settings-like entity appears and a real key-value or
  multi-row model becomes worth the complexity.
- **PUT /api/shop-settings has no auth guard** — flagged as a deployment
  blocker (harder than a missing-feature gap) in `docs/api.md`, not a design
  decision made here. No Admin auth system exists in this repo yet.

### 2026-08-02 — FAQ backend: no write endpoints, and a local-tooling migration quirk

Second `apps/api` feature built on the ShopSettings pattern, same generator
and dev-runner setup (see above — both already fixed, no new infra issues
of that kind this time). Two things worth recording:

- **No POST/PUT/DELETE for FAQs**, unlike ShopSettings PUT. Full reasoning
  in `docs/api.md` — summary: no consumer exists yet (no `apps/admin`), and
  unlike ShopSettings there's no already-approved write contract to match,
  so shipping one now would mean inventing an unapproved shape on top of
  adding a second open write endpoint. Revisit alongside real Admin auth.
- **Local `prisma dev` shadow-database persistence quirk**: verifying this
  migration against a local instance repeatedly hit `P3005`/`P3018` errors
  from a stale shadow database that `prisma migrate reset` doesn't clear,
  even across differently-named `prisma dev` instances (same default port
  each time, suggesting shared underlying storage rather than true
  per-instance isolation in this environment). Worked around by using
  `prisma db push` (schema-sync only, no shadow database) for the local
  verification, and separately generating the real migration file via
  `prisma migrate diff --from-schema <prior-schema-copy> --to-schema
  prisma/schema.prisma --script` (pure schema-to-schema diff, also no
  shadow database needed) rather than letting `migrate dev` generate it.
  The resulting migration file
  (`prisma/migrations/20260802040000_add_faq/`) is identical to what
  `migrate dev` would have produced — verified by the tool's own diff
  output, not hand-typed. If this recurs on future migrations, the same
  workaround applies; it's a tooling quirk in this sandbox, not a schema or
  migration-history problem.

### 2026-08-02 — Admin authentication: bcryptjs, hashed session tokens, throttler

First auth system in the repo, closing the `PUT /api/shop-settings`
deployment blocker. Full contract in `docs/api.md` under "Admin
Authentication"; schema in `docs/database.md`. Notable implementation
choices:

- **`bcryptjs` over native `bcrypt`**: pure-JS, no native build step in this
  environment, and this app's login volume (single admin, low traffic)
  doesn't need `bcrypt`'s native-binding performance edge.
- **Session store is DB-backed, not JWT**: a `AdminSession` table storing
  only a SHA-256 hash of the token (never the raw token, mirroring how
  `passwordHash` is handled) makes sessions individually revocable
  (`logout` deletes the row) without needing a JWT blocklist. Simpler to
  reason about for a single-admin app than adding a JWT library and secret
  rotation story.
- **`@nestjs/throttler` for login rate limiting**: registered globally via
  `ThrottlerModule.forRoot` + `APP_GUARD` with a generous default
  (100 req/60s/IP) so it doesn't silently rate-limit unrelated endpoints,
  with `AuthController.login` overriding to 5/60s via `@Throttle` per
  AGENTS.md's explicit "rate-limits login attempts" requirement.
- **Generic 401 + dummy-hash timing**: login returns the same "Invalid email
  or password" message and runs a real `bcrypt.compare` against a
  precomputed dummy hash when the email doesn't exist, so neither the error
  message nor response timing reveals whether an email is registered.
- **`sameSite: "lax"` cookie, not `"none"`**: chosen because the admin
  frontend and this API are expected to share a registrable domain (true
  for local dev across ports, and for a typical same-apex production
  deploy). Flagged in `docs/api.md` as needing revisiting to `"none"` (+
  `secure`) only if that assumption changes.
- **Bootstrap script, not a seed**: unlike `ShopSettings`/`Faq` seeding,
  `prisma/bootstrap-admin.ts` deliberately does not create an admin with an
  invented email/password. It reads `ADMIN_BOOTSTRAP_EMAIL` /
  `ADMIN_BOOTSTRAP_PASSWORD` from `process.env` and fails loudly if either
  is missing — per AGENTS.md's `.env` boundary, real credentials are the
  owner's to supply, not mine to invent. The script itself never opens or
  edits `.env`.
- **Migration generated, not yet applied to the real database**: same
  no-shadow-database `prisma migrate diff` technique used for the FAQ
  migration produced `prisma/migrations/20260802210000_add_admin_auth/`.
  Running `prisma migrate deploy` against the live Supabase connection is
  left for an explicit go-ahead, consistent with how every other
  production-database touch in this project has been handled (see
  `logs/decisions.md`).

### 2026-08-02 — Environment loading is file-relative, not cwd-relative

`apps/api/src/main.ts` and `prisma/bootstrap-admin.ts` load the repo-root
`.env` via `dotenv`'s `path` option resolved from `__dirname`, **not** the
bare `import "dotenv/config"` used elsewhere.

**Why this matters:** `import "dotenv/config"` resolves `.env` against the
current working directory. `pnpm --filter <pkg> run <script>` executes with
cwd set to that package's directory (`apps/api`), which has no `.env`. The
result was a silent no-op: `DATABASE_URL` undefined, the pg driver adapter
falling back to libpq defaults (OS user against a local socket), and a
`DatabaseAccessDenied` error that pointed at credentials rather than
configuration. `apps/api` previously had *no* `.env` loading at all, so
every database-backed route failed at runtime — masked because all earlier
database verification ran Prisma scripts from the repo root rather than
exercising the running API. Full trail in `logs/debug-log.md`.

- `main.ts` uses `../../../.env`, which resolves to the repo root from both
  `src/` (ts-node) and `dist/` (compiled `node dist/main.js`) because the two
  sit at equal depth under `apps/api`. Verify this still holds if the build
  output location ever changes.
- `dotenv` does not overwrite variables already set in the environment, so
  deployment-provided env vars still take precedence — loading the file
  unconditionally is safe outside local dev.
- `prisma/seed.ts` keeps the plain `import "dotenv/config"` because Prisma
  invokes it from the repo root, where that resolves correctly. It would
  break under the same cwd conditions if ever invoked differently.

**Security follow-ups noted, not acted on** (surfaced by loading the newly
installed `supabase-postgres-best-practices` skill before this migration
work, per its own trigger conditions): (1) neither `ShopSettings` nor `Faq`
has Row-Level Security enabled — doesn't affect `apps/api`'s own access
(it connects directly via Prisma, not through Supabase's PostgREST layer),
but matters if these tables are ever exposed through Supabase's anon-key
REST API, which is on by default for the `public` schema. (2) `apps/api`
connects using the Postgres superuser role (`postgres`) rather than a
scoped least-privilege role — real Supabase best practice is a dedicated
role with only the grants the app needs. Both are real, both need a live
Supabase connection to actually implement (role creation, RLS policies),
and both are bigger/separate decisions from "add the Faq model" — logged
here rather than acted on unprompted. See `logs/decisions.md` for the same
entry in that log.
