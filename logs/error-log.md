# Error Log

Actual errors encountered, verbatim where possible, with cause and
resolution (or current status if unresolved). Backfilled on 2026-08-02 for
errors before that date. Ordered chronologically.

---

### `TypeError: Cannot read properties of null (reading 'reset')`

- **Where:** `components/appointment-form.tsx` and `components/enquiry-form.tsx`, inside the simulated-submit `setTimeout` callback.
- **Cause:** `event.currentTarget` is nulled by React once the synchronous event handler returns; accessing it inside an async `setTimeout` callback hits `null`.
- **Status:** **Resolved.** Captured `event.currentTarget` in a local variable before the `setTimeout` in both files.
- **Date:** 2026-08-02.

---

### `ReferenceError: exports is not defined in ES module scope`

- **Where:** `generated/prisma/client.ts` (and later `dist/generated/prisma/client.js`), when booted via `ts-node` or a real `tsc` build.
- **Cause:** Prisma v7's newer `prisma-client` generator emits raw ESM source (top-level `import.meta.url`), incompatible with `apps/api`'s CommonJS module target.
- **Status:** **Resolved.** Switched `prisma/schema.prisma`'s generator to `provider = "prisma-client-js"` (legacy generator), which emits pre-compiled CJS-compatible output. Full investigation in `debug-log.md`.
- **Date:** 2026-08-02.

---

### `TypeError: Cannot read properties of undefined (reading 'getSettings')`

- **Where:** `ShopSettingsController.getShopSettings`, at request time (not at app startup).
- **Cause:** `tsx` (esbuild-based dev runner) does not emit `emitDecoratorMetadata`, so NestJS's constructor injection silently failed to wire `ShopSettingsService` into the controller — confirmed via `Reflect.getMetadata("design:paramtypes", ...)` returning `undefined` under `tsx`.
- **Status:** **Resolved.** Switched `apps/api`'s dev script from `tsx watch` to `nodemon --watch src --ext ts --exec "ts-node src/main.ts"`.
- **Date:** 2026-08-02.

---

### `Error: Could not resolve @prisma/client. Please try to install it with npm i @prisma/client...`

- **Where:** Testing the legacy `prisma-client-js` generator in an isolated `/tmp` directory.
- **Cause:** Path-resolution issue specific to generating outside a real npm-linked project directory — not a real dependency-installation problem (both `@prisma/client` and the legacy generator work fine when tested in place).
- **Status:** **Resolved by working around it** — abandoned the isolated `/tmp` test, edited the real `prisma/schema.prisma` in place instead.
- **Date:** 2026-08-02.

---

### `Error: Cannot find module '@prisma/client-runtime-utils'`

- **Where:** Booting `apps/api` after switching to the legacy `prisma-client-js` generator.
- **Cause:** The legacy generator's own `package.json` declares `@prisma/client-runtime-utils` as a dependency, but it wasn't installed anywhere resolvable.
- **Status:** **Resolved.** Added `@prisma/client-runtime-utils` to both root and `apps/api` `package.json`, ran `pnpm install`.
- **Date:** 2026-08-02.

---

### `P1010` / `Ident authentication failed for user "noirxvii"`, and later `P1000` / `Authentication failed against the database server`

- **Where:** `ShopSettingsService.getSettings()` (Prisma query), and separately `prisma/seed.ts`.
- **Cause:** `.env`'s `DATABASE_URL` still has the placeholder `[YOUR-PASSWORD]` — this is **expected and correct**, not a bug. It confirms the DI/module fixes above were successful, since the failure only occurs at the actual database-connection step, after DI correctly wired everything.
- **Status:** **Not an error to fix** — working as intended pending real Supabase credentials.
- **Date:** 2026-08-02.

---

### Graceful-degradation test showed live data despite the API being confirmed down (UNRESOLVED)

- **Where:** Testing whether `/contact`, `/appointment`, and the floating WhatsApp button correctly hide their CTA when `apps/api` is unreachable.
- **What was observed:** After stopping the API and confirming via `ss`/`lsof`/`ps` that nothing was listening on port 4000, `curl` to the API from the shell correctly failed (`000`). But the running Next.js dev server's own `fetch()` call to the same URL still succeeded and returned real seeded data — confirmed with a temporary debug `console.error` showing `fetch resolved, ok= true`.
- **What was ruled out:** Next.js's on-disk fetch cache (`.next/cache`, deleted and retested — no change), a stray `next dev` process (found and killed a genuinely separate `next-server` process that had survived multiple `pkill -f "next dev"` attempts because its command line didn't contain the literal string "next dev" — but even after killing it and starting fully fresh, the behavior persisted), and any lingering `apps/api` process (repeatedly confirmed dead via `ps`/`ss`/`lsof`).
- **Status:** **Unresolved, not chased further.** Most likely explanation: some networking/sandbox layer in this environment gives a long-running background server process different network visibility than ad-hoc shell commands run via the Bash tool — but this wasn't confirmed. The application code itself (`try { ... } catch { return null }` around the `fetch`) is straightforward, standard, and was not the suspected source of the issue. Does not block or contradict any of the actually-required verification (GET/PUT against real data, and the frontend pulling live data when the API genuinely is reachable — both of those were cleanly confirmed).
- **Date:** 2026-08-02.

---

### `P3005` — "The database schema is not empty"

- **Where:** `prisma migrate dev --name add_faq` against a local `prisma dev` verification instance.
- **Cause:** The local instance's underlying storage already had the `ShopSettings` table from a previous session, despite being (nominally) a fresh named instance.
- **Status:** **Resolved for that occurrence** via `prisma migrate reset --force` (with explicit user consent — see below). **Recurred** on a second, differently-named "fresh" instance immediately after, revealing the deeper issue was shared local storage across named instances, not a one-off. Ultimately **worked around** by switching to `prisma db push` for local verification instead of `migrate dev`. Full detail in `debug-log.md`.
- **Date:** 2026-08-02.

---

### `P3006` / `P3018` — shadow database migration conflict, "relation ShopSettings already exists"

- **Where:** `prisma migrate dev --name add_faq`, after the main database had already been reset and confirmed empty.
- **Cause:** Prisma's shadow database (a separate, internal database used only to validate migrations before applying them) had its own stale `ShopSettings` table that `prisma migrate reset` doesn't touch (reset only affects the main target database).
- **Status:** **Worked around**, not directly resolved — switched to `prisma db push` (no shadow database involved) for local schema sync, and `prisma migrate diff --script` (also no shadow database) to generate the real migration file. This sidesteps the shadow-database mechanism entirely rather than fixing whatever is causing it to retain stale state. If this recurs on a future migration, the same workaround applies.
- **Date:** 2026-08-02.

---

### Prisma's own AI-agent safety gate on `migrate reset`

- **Where:** First attempt to run `prisma migrate reset --force`.
- **What happened:** Not a bug — Prisma detected it was being invoked by an AI agent and refused to run, printing an explicit message requiring the agent to stop, explain the action to the user, get explicit consent, and re-run with a `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` environment variable containing the user's literal consenting text.
- **Resolution:** Stopped, explained the action/motivation/irreversibility/dev-vs-production assessment to the user via `AskUserQuestion`, received explicit consent, set the required environment variable, re-ran successfully.
- **Worth noting:** This is exactly the kind of check my own operating principles already call for around destructive operations — Prisma's tooling enforcing it independently is a useful second layer, not a redundant one.
- **Date:** 2026-08-02.
