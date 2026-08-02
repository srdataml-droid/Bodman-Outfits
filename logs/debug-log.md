# Debug Log

Step-by-step records of non-trivial debugging sessions — what was tried, in
what order, and what each step revealed. Only notable investigations get an
entry here, not routine typechecks/builds that passed cleanly. Backfilled on
2026-08-02 from conversation history for sessions before that date.

---

## 2026-08-01 — Responsive verification tooling instability (Home/Catalogue build)

**Context:** Verifying pages at 375/768/1280px using `mcp__claude-in-chrome`.

**Steps taken:**
1. Tried `resize_window` on the browser tab to hit exact breakpoints (375,
   768, 1280px).
2. Found the window manager kept snapping the window back to a different
   size (500px minimum observed, then reverting to 1536px unpredictably) —
   confirmed via `window.innerWidth` checks after each resize attempt.
3. Switched approach: injected an `<iframe>` into the page at a fixed pixel
   width/height (`position:fixed`), and navigated the iframe's own `src` —
   since an iframe's internal CSS viewport is governed by the iframe
   element's own dimensions, independent of the outer browser window size.
4. This worked reliably for width-based breakpoint testing for the rest of
   the project.
5. Separately hit: `scrollTo()` calls inside iframes appeared to do nothing
   — root cause was `html { scroll-behavior: smooth }` in `globals.css`
   causing the scroll to animate rather than jump, and reads happening
   before the animation finished. Fixed by using
   `scrollTo({..., behavior: 'instant'})` in verification scripts.
6. Also hit intermittent tab corruption (an outer tab would end up at
   `chrome-error://chromewebdata/` after cross-navigating an iframe inside
   an async script) and CDP timeouts (`Page.captureScreenshot` timing out
   after 30s on a "frozen" renderer that wasn't actually frozen — retrying
   the same call usually succeeded). Workaround: when a tab misbehaves
   repeatedly, close it and open a fresh one rather than debugging the
   stuck state.

**Outcome:** Iframe-injection + `behavior:'instant'` scrolling became the
standard verification technique for every subsequent page build in this
project.

---

## 2026-08-02 — Appointment form: silent crash on every submission

**Context:** Built `components/appointment-form.tsx` with a simulated
submit (`setTimeout` then show a success state). Checked browser console
errors as part of verification (a habit from the previous session's
tooling-instability debugging) and found one.

**Steps taken:**
1. Submitted the form via a scripted DOM interaction, checked
   `read_console_messages` afterward.
2. Found `TypeError: Cannot read properties of null (reading 'reset')`
   thrown from inside the `setTimeout` callback.
3. Traced it to `event.currentTarget.reset()` being called asynchronously —
   React nulls `SyntheticEvent.currentTarget` once the synchronous handler
   returns, so by the time the `setTimeout` callback ran, `currentTarget`
   was `null`.
4. Checked `components/enquiry-form.tsx` (built in an earlier session) for
   the same pattern — found it, identical bug, silently present since the
   Contact page was built.
5. Fixed both by capturing the form element in a local variable
   (`const form = event.currentTarget;`) before the `setTimeout`, and
   calling `.reset()` on that captured reference instead.
6. Re-tested both forms' submissions with console-error checks — clean on
   both.

**Why it went unnoticed originally:** The UI still *appeared* to work —
`setStatus("sent")` ran and committed before the throw, so the success view
rendered correctly despite the trailing crash. Only checking the console
caught it.

**Outcome:** Both forms fixed. Lesson carried forward: always check browser
console errors after form-submission tests, not just the visible UI state.

---

## 2026-08-02 — ShopSettings backend: Prisma v7 generator + NestJS DI, two compounding bugs

**Context:** First `apps/api` feature using both Prisma and real NestJS
constructor injection. Neither had been exercised before (schema was empty;
`HealthController` had no injected dependencies).

**Step 1 — initial generator setup:**
- Loaded the `prisma-database-setup` skill, which recommends
  `provider = "prisma-client"` (the newer v7 generator) with an explicit
  `output` path, plus a `prisma.config.ts` for the datasource URL.
- Applied this. `prisma generate` succeeded with no errors.

**Step 2 — first boot attempt (`tsx watch src/main.ts`, the pre-existing dev script):**
- App booted, health endpoint worked.
- `GET /api/shop-settings` returned `500`.
- Checked server log: `TypeError: Cannot read properties of undefined
  (reading 'getSettings')` inside `ShopSettingsController.getShopSettings`.
  `this.shopSettingsService` was `undefined` despite Nest logging
  "ShopSettingsModule dependencies initialized" successfully at startup.

**Step 3 — isolating the DI failure:**
- Wrote a throwaway script:
  `Reflect.getMetadata("design:paramtypes", ShopSettingsController)` run
  under `tsx` — returned `undefined`.
- Confirmed: `tsx` (esbuild-based) does not emit `emitDecoratorMetadata`,
  which NestJS's reflection-based constructor injection requires. This is a
  known esbuild limitation, not something specific to this code.

**Step 4 — tried `ts-node` as a DI-correct replacement:**
- `npx ts-node src/main.ts` crashed immediately:
  `ReferenceError: exports is not defined in ES module scope`, inside the
  generated Prisma client's `client.ts`, which used top-level
  `import.meta.url` (ESM-only syntax).
- Also tried a real `tsc -p tsconfig.build.json` build + `node dist/main.js`
  — same crash, same root cause (real `tsc` respects the CommonJS module
  target and can't emit valid output for `import.meta.url`).
- Along the way, a stale `dist/` folder from an earlier, unrelated build
  caused a confusing false negative (was accidentally testing old compiled
  output) — resolved by `rm -rf dist` before rebuilding.

**Step 5 — testing whether the legacy generator avoids the ESM problem:**
- Temporarily generated a client into `/tmp` using
  `provider = "prisma-client-js"` to test in isolation — hit an unrelated
  "Could not resolve @prisma/client" path-resolution error specific to
  testing outside a real npm-linked directory. Abandoned that approach.
- Instead edited the *real* `prisma/schema.prisma` in place to
  `provider = "prisma-client-js"`, regenerated, and grepped the output for
  `import.meta` — zero matches. Output was now pre-compiled `.js`/`.d.ts`,
  not raw `.ts` source.
- Checked `index.d.ts` for the driver-adapter constructor signature —
  confirmed `new PrismaClient({ adapter })` with `PrismaPg` still works
  identically under the legacy generator in v7. No code changes needed to
  `PrismaService`.

**Step 6 — re-testing both runners against the legacy-generator output:**
- `tsx watch` — booted fine, but the DI bug was unrelated to Prisma and
  still present (confirmed independently — two separate bugs, not one).
- `ts-node src/main.ts` — booted fine, hit a *new* error:
  `Cannot find module '@prisma/client-runtime-utils'` — a transitive
  dependency the legacy generator's own `package.json` declares but that
  wasn't installed. Added it to both root and `apps/api` `package.json`,
  ran `pnpm install`.
- Re-ran `ts-node src/main.ts` — booted clean, `GET /api/shop-settings`
  reached `ShopSettingsService.getSettings()` correctly (confirmed via
  server log showing a real Prisma query attempt) and failed only with
  `P1010` / `Ident authentication failed for user "noirxvii"` — the
  expected outcome given `.env`'s placeholder `DATABASE_URL`.

**Step 7 — finalizing the dev script:**
- Confirmed `ts-node src/main.ts` works without a redundant
  `-r reflect-metadata` flag (main.ts already imports it first).
- Needed a watch wrapper to replace `tsx watch`'s auto-restart convenience.
  Tried `ts-node-dev` — worked, but pulled in deprecated transitive
  packages (`inflight`, old `rimraf`/`glob`). Switched to `nodemon` +
  `ts-node` instead — clean install, no deprecation warnings.
- Updated `apps/api/package.json`'s `dev` script accordingly. Re-verified
  full boot + `GET`/`PUT` request cycle one more time end-to-end.

**Step 8 — real production build path:**
- Re-ran the real `tsc` build + `node dist/main.js` against the
  legacy-generator output — booted clean, reached the same expected
  `P1010` DB-credential boundary. Confirmed both the dev path (`ts-node` +
  `nodemon`) and the production path (`tsc` + `node`) now work correctly.

**Outcome:** Two independent, pre-existing infrastructure bugs found and
fixed (generator choice, dev runner choice) — documented in
`docs/api.md` and `docs/architecture.md` so they aren't silently
re-broken later.

---

## 2026-08-02 — Live verification against a real (local, temporary) database

**Context:** User's task asked to verify `GET` returns seeded data and
`PUT` updates it — but `.env`'s `DATABASE_URL` was intentionally left as a
placeholder (per an earlier explicit decision to skip live-DB work in that
pass).

**Steps taken:**
1. Used `npx prisma dev --detach` — a genuinely local, on-machine,
   no-account-required Postgres-compatible database (confirmed via the
   `prisma-cli` skill's `dev.md` reference before using it, specifically to
   avoid the "don't create external accounts" constraint).
2. Ran `prisma migrate dev` and `prisma db seed` against this local
   instance's connection string, passed as a shell-only `DATABASE_URL`
   override — never written into the real `.env` file.
3. Started `apps/api` with that same override, hit `GET`/`PUT
   /api/shop-settings` for real — both worked, `PUT` persisted correctly on
   re-fetch, Zod validation correctly rejected a malformed body with `400`.
4. Started `apps/web` pointed at this real API, confirmed `/contact`,
   `/appointment`, and the floating button all rendered the real fetched
   WhatsApp number.
5. Attempted to verify the *graceful-degradation* path (API down → pages
   still render, just without the WhatsApp CTA) — this part did **not**
   verify cleanly. See `error-log.md` for the specific mystery encountered
   and why it was left unresolved rather than chased further.
6. Cleaned up: killed all test server processes, ran
   `npx prisma dev rm atelier-verify --force` to remove the temporary local
   database, confirmed `.env` was never modified.

**Outcome:** Core requested verification (GET/PUT against real seeded data,
frontend pulling live data) fully confirmed. The degradation-path test was
inconclusive due to an environment quirk, reported honestly rather than
claimed as verified.

---

## 2026-08-02 — FAQ backend: local Prisma dev shadow-database persistence

**Context:** Building the second Prisma-backed feature (`Faq` model),
following the exact ShopSettings pattern. Mid-task, `schema.prisma` and
`prisma.config.ts` were both externally modified (schema.prisma briefly had
invalid `url`/`directUrl` added to the datasource block — since
auto-corrected; `prisma.config.ts` was restructured to use `DIRECT_URL` for
migrations instead of `DATABASE_URL`, and lost its `seed` command in the
process, restored separately). Newly-installed Supabase skills
(`supabase`, `supabase-postgres-best-practices`) became available partway
through.

**Steps taken:**
1. `prisma generate` + schema validation — clean, as expected.
2. Started a local `prisma dev --name faq-verify --detach` instance for
   verification (same pattern as the ShopSettings session).
3. `prisma migrate dev --name add_faq` failed: `P3005` — "database schema
   is not empty." Unexpected for a fresh named instance.
4. Asked the user for explicit consent to run `prisma migrate reset
   --force` (Prisma's own tooling requires this for an AI agent before
   running a destructive reset command — it detected the agent context and
   refused to proceed without it). Received consent.
5. Set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` per Prisma's
   documented mechanism and ran the reset — succeeded, existing
   ShopSettings migration reapplied cleanly to the now-empty database.
6. Retried `prisma migrate dev --name add_faq` — new error this time:
   `P3006`/`P3018`, a *shadow database* (a separate, internal database
   Prisma uses to validate migrations before applying them) already had a
   `ShopSettings` table, causing a conflict. `migrate reset` only resets
   the main database, not the shadow database.
7. Tried tearing down the instance entirely (`prisma dev rm faq-verify`)
   and creating a differently-named fresh one (`faq-verify-2`) — got
   assigned the exact same port (51214) as before, and hit the exact same
   `P3005` "schema not empty" error immediately, before even reaching the
   shadow-database step. This confirmed the issue wasn't really about
   instance naming — something in this environment's local `prisma dev`
   setup persists data across nominally-separate named instances.
8. Ran `migrate reset --force` again on this new instance (same already-
   granted consent covering the general action on this class of disposable
   local database) — succeeded again.
9. Retried `migrate dev --name add_faq` immediately after — hit the
   identical shadow-database `P3018` error again. Concluded further resets
   wouldn't fix a problem in a *different* database (the shadow one) that
   reset doesn't touch, and stopped trying variations of the same approach.
10. Switched strategy entirely: ran `prisma db push` (directly syncs the
    schema to the target database, no shadow database involved at all) —
    succeeded immediately, `Faq` table created.
11. For the actual committed migration file (needed for eventual real
    deployment, not just local testing), used
    `prisma migrate diff --from-schema <copy of schema without Faq model>
    --to-schema prisma/schema.prisma --script` — a pure schema-to-schema
    diff that also doesn't touch any database, shadow or otherwise. This
    produced the exact `CREATE TABLE "Faq" (...)` SQL, tool-generated, not
    hand-typed.
12. Wrote that SQL into a manually-created migration folder
    (`prisma/migrations/20260802040000_add_faq/`), then ran
    `prisma migrate resolve --applied 20260802040000_add_faq` to mark it as
    applied in the database's migration-history table (since the table
    already existed via `db push`, re-applying it would have failed).
13. `prisma migrate status` confirmed clean: both migrations tracked,
    schema up to date.
14. Regenerated the client, seeded (after restoring the `seed` config lost
    in the earlier external edit to `prisma.config.ts`), started
    `apps/api` against this database, and confirmed `GET /api/faqs` and
    the frontend `/faq` page both correctly returned/rendered the 4 seeded
    entries. Confirmed `POST`/`DELETE` correctly 404 (not implemented).

**Outcome:** FAQ backend fully verified locally. A real, tool-generated
migration file exists for eventual application to production. The
shadow-database persistence issue is logged as a known environment quirk
in `docs/architecture.md`, with the working-around technique
(`db push` + `migrate diff --script` + `migrate resolve --applied`)
documented for reuse if it recurs on a future migration.

---

## 2026-08-02 — `DatabaseAccessDenied` on admin bootstrap: `apps/api` never loaded `.env`

**Context:** Creating the first real Admin account after the
`add_admin_auth` migration was applied. `pnpm --filter @atelier-haute/api
run bootstrap-admin` failed with Prisma `P1010` /
`DriverAdapterError: DatabaseAccessDenied` ("User was denied access on the
database"). The error strongly implied a credentials or Postgres
permissions problem. It was neither.

**Steps taken:**
1. Re-ran the bootstrap command — failed identically. Reproducible, so not
   the intermittent Supabase cold-start `P1001` seen earlier the same day.
2. Hypothesised a permissions difference between the pooled `DATABASE_URL`
   and the direct `DIRECT_URL` (migrations via `DIRECT_URL` had just
   succeeded in creating tables, and a read via `DATABASE_URL` had also
   succeeded, so "reads work, writes denied" seemed plausible).
3. Wrote a throwaway diagnostic probing **both** URLs: printed
   `current_user`/`session_user` and attempted SELECT, INSERT and DELETE on
   `Admin`. Deliberately never printed connection strings or passwords.
   Result: **both** URLs reported `current_user=postgres` and passed all
   three operations. So permissions were not the problem at all, and the
   two URLs differ only by port (`6543` pooled vs `5432` direct).
4. Narrowed to the one operation that had actually failed — `upsert` —
   suspecting a pgBouncer transaction-mode limitation on port 6543. Tested
   `upsert` (both create and update paths) on both URLs: **all passed.**
   So the query itself was fine too.
5. That left the only remaining difference between the failing command and
   the passing diagnostic: **the working directory.** The diagnostic ran
   from the repo root; `pnpm --filter` runs scripts with cwd =
   `apps/api`. Confirmed directly:
   `cd apps/api && npx tsx -e "require('dotenv/config'); console.log(!!process.env.DATABASE_URL)"`
   printed `false`.

**Root cause:** `import "dotenv/config"` resolves `.env` relative to the
**current working directory**, and there is no `.env` in `apps/api`. With
`DATABASE_URL` undefined, `new PrismaPg({ connectionString: undefined })`
falls back to libpq defaults — the OS user (`noirxvii`) against a local
socket — which fails authentication and surfaces as `DatabaseAccessDenied`.
The error pointed at credentials; the actual fault was configuration
loading. The documented invocation command could never have worked.

**Wider finding (worse than the original bug):** grepping for `dotenv`
across `apps/api` returned **nothing** — the NestJS API had no `.env`
loading of any kind. `PrismaService` reads `process.env.DATABASE_URL` in
its constructor, so *every* database-backed route was affected. Confirmed
empirically: booted the API and called `GET /api/faqs`, which returned
HTTP 500 with the same `DatabaseAccessDenied` in the logs, while
`GET /api/health` (no database access) returned 200. The API had never been
able to reach the real database at runtime; this went unnoticed because
prior verification was done through Prisma scripts run from the repo root,
never through the running API itself.

**Fix:** Both `prisma/bootstrap-admin.ts` and `apps/api/src/main.ts` now
resolve `.env` from the script's own location via
`dotenv`'s `path` option (`path.resolve(__dirname, ...)`) instead of relying
on cwd, so invocation directory no longer matters. `apps/api` gained
`dotenv` as an explicit dependency. `main.ts` uses
`../../../.env`, which resolves to the repo root from **both** `src/`
(ts-node) and `dist/` (compiled) since they sit at equal depth.
`bootstrap-admin.ts` additionally now fails with an explicit
"DATABASE_URL is not set" message rather than letting the adapter produce a
misleading auth error.

**Note on `dotenv` precedence:** `dotenv` does not overwrite variables
already present in the environment, so real deployment-provided env vars
still win over the `.env` file. Loading it unconditionally in `main.ts` is
therefore safe for production, not just local dev.

**Verified after fix:** `GET /api/faqs` → 200 `[]` (empty because the real
`Faq` table genuinely has 0 rows), and the full auth flow passed end to end
(see `logs/decisions.md`).
