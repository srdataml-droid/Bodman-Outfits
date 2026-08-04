# Decisions Log

Chronological record of judgment calls made during this project, and why.
Backfilled from conversation history on 2026-08-02 — entries before that date
are best-effort reconstructions, not live-logged at the time, so treat exact
wording as approximate even where the substance is accurate. Going forward,
new entries get added as decisions happen.

This overlaps in places with `docs/architecture.md`'s own decision log
(which is scoped to technical/architectural decisions specifically). Where
both exist, `docs/architecture.md` has the authoritative full writeup;
entries here that duplicate it are summarized with a pointer, not
copy-pasted.

---

## 2026-08-01 — Home/Catalogue category restructure

**Decision:** Switched Home and Catalogue from the original Native
Wear/Formal Wear/Bridal/Lounge Wear categories to Suits/Corporate/Casual.

**Why:** The `atelier-frontend` skill explicitly states "menswear only... no
bridal, no native wear... do not build them even if old mockups suggest
otherwise." The existing content directly violated that. User confirmed the
skill's categories should win over the existing content when asked.

**Consequence:** `lib/garments.ts` created as the shared data source for
categories and items across Home, Catalogue, and the new dynamic
`/catalogue/[category]/[item]` routes.

---

## 2026-08-01 — Dropped `lounge-wear.png` and `native-wear.png`/`bridal.png` entirely

**Decision:** Standardized all placeholder catalogue imagery on
`formal-wear.png` only.

**Why:** `lounge-wear.png` depicts a woman — wrong gender entirely for a
menswear-only brand, a worse violation than the category mismatch that
prompted removing it. `native-wear.png`/`bridal.png` were off-category per
the decision above. `formal-wear.png` (despite a baked-in fictional
"Adebayo & Co." plaque) was the only genuinely on-brand asset available.

---

## 2026-08-01 — WhatsApp number: hard-code now, not build ShopSettings backend yet

**Decision:** Hard-coded the confirmed WhatsApp number
(`+234 706 131 3517`) in `lib/shop-settings.ts` with a `TODO`, instead of
building the `ShopSettings` API endpoint in the same pass as the Contact
page.

**Why:** User chose this explicitly over building the backend immediately,
to keep the Contact page task scoped to `apps/web`. Full context in
`docs/ui-ux.md` under "WhatsApp Contact Entry Points" (historical — this was
later reversed, see the 2026-08-02 entry below).

**Superseded:** 2026-08-02 — real `ShopSettings` backend was built and
`lib/shop-settings.ts` now fetches live data. The `TODO` is gone.

---

## 2026-08-01 — Floating WhatsApp button scoped to contact page's entry point only, then later expanded

**Decision:** First pass added only the inline WhatsApp card on `/contact`.
A **separate, explicit follow-up request** then added the sitewide floating
button (fixed bottom-right, in the root layout, self-hides on `/admin`
paths).

**Why:** `docs/ui-ux.md` specifies both entry points, but the user chose to
build them as two separate scoped passes rather than one, to keep each
change reviewable.

---

## 2026-08-01 — About page: omitted the "Hands Behind the Work" team section entirely

**Decision:** Did not build any version of the Stitch mockup's named-staff
profile section (Tunde Adeyemi, Amaka Nwosu, Kofi Mensah), not even a
genericized no-names version.

**Why:** Those three people are fabricated by the design mockup — fake
names, fake tenure claims ("Thirty years of..."), AI-generated photos. Also
in tension with AGENTS.md's line against building "craftsperson... profiles."
User was asked to choose between a generic version and omitting entirely;
chose to omit. Revisit once real team information exists.

**Also dropped in the same page:** the founding-story narrative (unconfirmed,
replaced with an honest "still being written" note) and the Aso Oke/heritage-
textile framing (coded toward native wear, which is out of scope per the
2026-08-01 category decision above).

---

## 2026-08-02 — FAQ placeholder content: honest gaps, not invented policy

**Decision:** 4 placeholder Q&As covering turnaround, measurements,
deposit/payment, and alterations — each one states plainly that the specific
number/policy is still pending owner confirmation, rather than inventing a
plausible-sounding answer.

**Why:** Real answers depend on pricing/policy decisions the business owner
hasn't made yet. Matches the same honesty standard already applied to
Contact (address/hours) and About (founding story).

---

## 2026-08-02 — `PUT /api/shop-settings` ships with no auth guard

**Decision:** Built the endpoint fully functional but completely
unauthenticated, with a loud in-code comment and a `docs/api.md` note
calling it a deployment blocker (explicitly a harder category than a
missing-feature `TODO`).

**Why:** No Admin auth system exists anywhere in the repo (no `User` model,
no login, no sessions). AGENTS.md explicitly forbids a PIN-only or
hard-coded bypass as a shortcut. Building *real* auth was judged out of
scope for a ShopSettings-focused pass — user was asked and chose "leave it
open, flag clearly" over "build minimal real auth now."

---

## 2026-08-02 — Prisma generator: `prisma-client-js` (legacy), not `prisma-client` (v7-recommended)

**Decision:** Used the older/legacy Prisma Client generator despite it not
being the generally-recommended choice for Prisma 7 SQL setups.

**Why:** Empirically, the newer `prisma-client` generator emits raw ESM
source (`import.meta.url`) that crashes under `apps/api`'s CommonJS setup —
confirmed via both a real `tsc` build and `ts-node` failing identically. The
legacy generator emits pre-compiled CJS-compatible output and still supports
driver adapters under v7. Full investigation in `debug-log.md`. Documented
in `docs/architecture.md` and `docs/api.md` so nobody "helpfully" switches
it back without first deciding to migrate `apps/api` to ESM.

---

## 2026-08-02 — Dev runner: `tsx` → `nodemon` + `ts-node`

**Decision:** Replaced `apps/api`'s dev script from `tsx watch` to
`nodemon --watch src --ext ts --exec "ts-node src/main.ts"`.

**Why:** `tsx` (esbuild-based) never emitted the `emitDecoratorMetadata`
NestJS needs for constructor injection — confirmed via
`Reflect.getMetadata("design:paramtypes", ...)` returning `undefined`. This
had silently never mattered before because `HealthController` had no
injected dependencies; `ShopSettingsController` was the first to need real
DI. `tsx` remains fine for `prisma/seed.ts` (no NestJS decorators there).
Rejected `ts-node-dev` as the watch wrapper due to deprecated transitive
dependencies; used `nodemon` instead.

---

## 2026-08-02 — ShopSettings seed values: real facts real, unconfirmed facts empty

**Decision:** Seeded `shopName`, `whatsappNumber`, `cityCountry`, and
`tagline` with real/already-approved values (the tagline reuses existing
approved footer copy). Seeded `phone`, `email`, `address`, `hoursWeekday`,
`hoursSaturday`, `hoursSunday`, `pricingNote` as empty strings, and
`depositPercentage` as `0` — explicitly documented as a schema-required
placeholder, not a claim that no deposit is required.

**Why:** Same honesty standard as every other placeholder-content decision
in this project. `depositPercentage: 0` specifically needed a comment
because, unlike an empty string, a `0` could be misread as an actual policy
statement if found without context.

---

## 2026-08-02 — Graceful degradation for WhatsApp links, not a thrown error

**Decision:** `getShopSettings()`/`getWhatsAppLink()` return `null` on any
fetch failure instead of throwing. All three call sites (root layout,
`/contact`, `/appointment`) conditionally omit their WhatsApp entry point
when the link is `null`, rather than crashing the page.

**Why:** A backend outage shouldn't take down pages (like Home) that don't
otherwise depend on this data. This was my own judgment call, not something
explicitly requested — flagged as such at the time since it wasn't verified
as cleanly as the rest of the ShopSettings work (see `debug-log.md` for the
verification difficulty encountered).

---

## 2026-08-02 — FAQ backend: GET-only, no write endpoints

**Decision:** Built `GET /api/faqs` only. Did not build even
stubbed-unauthenticated `POST`/`PUT`/`DELETE` endpoints, unlike ShopSettings
PUT.

**Why:** User explicitly handed me this call ("your call on which is less
risk"). Chose the lower-risk option: adding write endpoints would (a) add a
second open write endpoint to the deployment blocker list with zero
functional gain, since no consumer exists yet (no `apps/admin`), and
(b) require inventing an unapproved API contract shape (single vs. bulk
update, hard vs. soft delete, reordering semantics) — unlike ShopSettings,
where the write contract was already documented in `docs/api.md` before I
built it.

---

## 2026-08-02 — FAQ field naming: `sortOrder`, not `order`

**Decision:** Named the Prisma field `sortOrder` even though the task
description said "order (int, for display sequencing)."

**Why:** `order` is a reserved SQL keyword (used in `ORDER BY`) — while
Prisma would quote it safely, it's needless friction. More importantly,
`sortOrder` already exists as the established name in the frontend
`FaqEntry` type from the original hardcoded implementation, so matching it
avoids a field-name translation layer between the API and the frontend.
Treated as a minor implementation detail worth documenting, not one that
needed a stop-and-ask.

---

## 2026-08-02 — FAQ page: honest "unavailable" state, not an empty list, on fetch failure

**Decision:** `getFaqEntries()` returns `null` on fetch failure; the FAQ
page shows an explicit "FAQs aren't loading right now, contact us" message
rather than rendering `FaqList` with zero entries.

**Why:** An empty list would read as "there are no FAQs," which is a
different and more misleading claim than "the FAQs failed to load." This
diverges slightly from the ShopSettings pattern (where a failed WhatsApp
fetch just silently omits that one UI element) because FAQ content isn't a
supplementary element on this page — it's the entire point of it, so
silently showing nothing would be more misleading here than there.

---

## 2026-08-02 — Local Prisma dev database: reset with consent, then rebuilt from scratch

**Decision:** When `prisma migrate dev` for the new `Faq` model hit a
shadow-database error that `prisma migrate reset` didn't fully resolve
(see `debug-log.md` and `docs/architecture.md` for the technical detail),
switched strategy to `prisma db push` (schema sync, no shadow database) for
local verification, and hand-generated the real migration file via
`prisma migrate diff` (schema-to-schema, also no shadow database) instead
of continuing to fight `migrate dev`.

**Why:** `prisma migrate reset` is a destructive operation Prisma's own
tooling requires explicit user consent for before an AI agent can run it —
asked and received consent first (confirmed this was a disposable local
instance, never connected to real data). After receiving consent and still
hitting the same class of error on a second, differently-named "fresh"
instance, concluded this was a genuine local-tooling quirk (evidence:
identical port reused across differently-named instances, suggesting
shared underlying storage) rather than something more resets would fix,
and switched to a workaround that avoids the problematic mechanism
entirely rather than repeatedly re-asking for the same class of
destructive action.

---

## 2026-08-02 — Did not touch the newly-appeared real Supabase credentials in `.env`

**Decision:** Noticed during cleanup that `.env`'s `DATABASE_URL`/
`DIRECT_URL` now contain real-looking credentials (previously the
placeholder `[YOUR-PASSWORD]`) — did not attempt to apply migrations or run
any command against this real connection, and did not otherwise act on it
beyond noting the fact in `project-status.md` and flagging it back.

**Why:** I didn't add these credentials — they appeared during this
session via a source outside my own actions (same pattern as the
`schema.prisma`/`prisma.config.ts` external edits noted earlier this
session). Applying real migrations to what may now be a live, real
database is a materially bigger step than anything approved in this task
(which was scoped to local verification, matching the established
pattern), and deserves its own explicit go-ahead rather than being folded
into "finish the FAQ backend."

---

## 2026-08-02 — Ran `prisma migrate deploy` against the real Supabase database, after explicit go-ahead

**Decision:** User explicitly confirmed "Apply migrations" when asked (given the prior entry's flag). Ran `npx prisma migrate deploy` — the standard, non-destructive, production-safe command (applies only pending migrations, no shadow database, no reset). Result: **no pending migrations** — both `add_shop_settings` and `add_faq` were already recorded as applied in this database's `_prisma_migrations` table, not something I or this session did. Verified via `PrismaClient` + `@prisma/adapter-pg` (required for Prisma 7) that both `ShopSettings` and `Faq` tables exist but contain **0 rows** — schema is live, no data has been seeded against the real database.

**Why:** This directly touches the production Supabase connection for the first time in a new way, so it stayed in the "ask first" bucket per the user's autonomy guidance even though `migrate deploy` itself is a routine, safe operation. Did not run `db seed` or otherwise write data — seeding real/production content is a business decision (what real shop info and FAQs to publish), not mine to make unilaterally.

**Open question for the user:** who/what already applied these migrations, and whether the empty tables should now be seeded with real content (vs. staying empty until real data is ready).

**Resolved 2026-08-02 (later same day):** User's theory confirmed by file-mtime cross-check, not an external actor. Timeline: `prisma.config.ts` was last modified 05:57:26 (the Prisma 7 config fix), `.env` received its real credentials at 06:19 per the earlier directory listing — *after* that fix. A separate Claude Code prompt (written earlier in this project's history, not in this session's own `debug-log.md`) had step 4 read "re-run `npx prisma migrate deploy`" as part of troubleshooting the same config error. That step, run once `.env` already held live credentials, is almost certainly what actually applied the migrations for real — not a mystery actor, just an ordinary troubleshooting step landing on a database that had just gone from placeholder to real underneath it. No further action needed; logged here for the record.

---

## 2026-08-02 — Added folder-scope + `.env` boundary to `.claude/settings.json` and `AGENTS.md`

**Decision:** Extended `.claude/settings.json`'s `permissions.deny` with
`Edit(/home/noirxvii/**)` and `Read(/home/noirxvii/**)`, paired with a
narrower `allow` for `/home/noirxvii/Desktop/tailoring-platform/**`, per the
user's explicit request to fence autonomous work to the project folder.
Added the matching reasoning to `AGENTS.md` under a new "Boundaries for
Autonomous Work" section (this project uses `AGENTS.md`, not `CLAUDE.md`,
as its standing-instructions file, so it was added there instead of creating
a new file).

**Caveat flagged to the user, not resolved:** Could not empirically verify
that the broad-deny-plus-narrow-allow pattern actually resolves in the
allow's favor. A `Read` of `AGENTS.md` succeeded immediately after writing
the change, but that is not proof — `.claude/settings.json` did not exist
when this session started, so the settings watcher was very likely not
watching that directory yet, meaning the successful read may just reflect
the *old* (pre-change) bypass state rather than confirmation the new rule
resolved correctly. If Claude Code's permission engine treats `deny` as an
absolute override regardless of specificity (common in security-tool
design, and consistent with how the `.env` deny rule appeared to block even
unrelated `Bash` commands that merely referenced its path), the broad
`/home/noirxvii/**` deny could end up blocking the project itself, since the
project lives under that same path.

**Why left unresolved rather than fixed silently:** This needs a fresh
session (or another reload mechanism) to actually observe live behavior,
which isn't something achievable within the same running session. Flagged
back to the user rather than guessing at a "safer" rewrite, since getting
this wrong in either direction has real cost — over-permissive misses the
point of the ask, over-restrictive could silently break the ability to work
in the project at all.

**How to verify next session:** Try reading/editing an ordinary project
file (e.g. `AGENTS.md`) early on. If that fails, the broad deny is winning
and the config needs to move to `sandbox.filesystem.denyRead`/`denyWrite`
(paths outside the project) plus `sandbox.filesystem.allowRead`/`allowWrite`
(the project path) instead — that mechanism is documented to have
allow-overrides-deny semantics for overlapping paths, unlike the top-level
`permissions.allow`/`deny` lists — but it requires `sandbox.enabled: true`,
which is a heavier change (OS-level sandboxing, needs
`network.allowedDomains` configured for anything that talks to the network,
e.g. the Supabase pooler, npm/pnpm registries) than what was asked for here,
so it wasn't turned on unilaterally.

---

## 2026-08-02 — Built Admin authentication (login, session cookie, guard)

**Decision:** Built the full Admin auth system in one pass: `Admin` +
`AdminSession` Prisma models, `bcryptjs` password hashing,
`POST /api/auth/login` (rate-limited 5/60s/IP via `@nestjs/throttler`),
`POST /api/auth/logout`, `AdminAuthGuard` (SHA-256-hashed session token in
an httpOnly cookie), and applied the guard to the previously-open
`PUT /api/shop-settings`. Generated the migration file via the same
no-shadow-database `prisma migrate diff` technique used for `add_faq`, but
did **not** run `prisma migrate deploy` against the real Supabase database.

**Why:** This was chosen autonomously (user said "go with what's best, read
through the folder") rather than asked about, because it was the clearest,
most fully-specified next step available: AGENTS.md already mandates the
exact shape (real email+password, hashed password, session cookie, no PIN
bypass, rate-limited login attempts), and `docs/api.md`/`docs/architecture.md`
already flagged the open `PUT /api/shop-settings` endpoint as the single
loudest deployment blocker in the repo. No business decision was needed —
the policy was already confirmed, only the implementation was missing.
Stopped short of `migrate deploy` against the real database because that's
a production-connection action, and every prior instance of touching the
live Supabase connection in this project has been treated as needing its
own explicit go-ahead rather than folded into other work — see the entries
above this one.

**Also declined to seed/invent an admin account.** `prisma/bootstrap-admin.ts`
reads `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` from the
environment and fails loudly if either is missing, rather than generating a
placeholder admin login — real login credentials are a business/owner
decision, not mine to invent, per AGENTS.md's `.env` boundary.

**Open items for the user:**
1. ~~Apply the migration to the real Supabase database.~~ Done — see the
   entry immediately below.
2. Add `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to `.env`
   (I did not and will not touch `.env` myself), then run
   `pnpm --filter @atelier-haute/api run bootstrap-admin` once.

---

## 2026-08-02 — Ran `prisma migrate deploy` for `add_admin_auth`, after explicit go-ahead

**Decision:** User explicitly confirmed ("Run the migration" / "go ahead and
apply it") after being asked. Ran `npx prisma migrate deploy` from the repo
root — same non-destructive, production-safe command used for the two prior
migrations. Result: `20260802210000_add_admin_auth` applied cleanly (3
migrations total now recorded). Verified via a disposable script
(`PrismaClient` + `@prisma/adapter-pg`, deleted immediately after) that
`Admin` and `AdminSession` both exist with 0 rows, matching the same
verification pattern used for the FAQ migration.

**Note on execution:** The first `migrate deploy` attempt failed with
"Could not find Prisma Schema" because the shell's working directory had
drifted into `apps/api` from an earlier `tsc --noEmit` step in the same
session — not a real schema or connectivity problem. Re-ran with an
explicit `cd` to the repo root and it succeeded immediately.

**Follow-up connectivity investigation (user asked to confirm it wasn't a
recurring problem):** A separate, one-off `P1001` ("can't reach database
server") also showed up on the first `prisma migrate status` check run
afterward. Ran a raw TCP check (succeeded) plus five more consecutive
`prisma migrate status` calls — all five succeeded cleanly, and no failure
ever repeated back-to-back across the whole session (every `P1001` was the
first query after a gap, every retry immediately after succeeded). This
matches Supabase's free-tier auto-pause behavior: the database suspends
after inactivity and takes a few seconds to wake on the first connection,
so the first query after idle time can time out while everything
afterward is instant. Read as a cold-start characteristic of this specific
database, not a flaky or broken connection — no config change made in
response to it.

**Why:** Same reasoning as the two prior production-migration entries above
— this is the first time schema changes for `Admin`/`AdminSession` touch the
real database, so it stayed in the "ask first" bucket even though
`migrate deploy` itself is routine and idempotent.

**Resolved same day:** admin account created — see the entry below.

---

## 2026-08-02 — First real admin account created; credentials passed inline, not written to `.env`

**Decision:** User supplied the real admin email
(`samuelirenikase@gmail.com`) and asked me to generate a strong password and
document both. Generated a 24-character password via `openssl rand -base64
18` (~140 bits entropy, not human-chosen, not reused). Created the account
by passing `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` **inline for a
single command** rather than writing them into `.env`.

**Why inline instead of `.env`:** Three reasons, all pointing the same way.
(1) It keeps me clear of the AGENTS.md `.env` boundary entirely — I never
opened or edited that file. (2) The user had already said in the same
breath that they'd want to delete the two lines from `.env` after
bootstrapping anyway, so never writing them is strictly better than writing
then removing. (3) The password's only durable homes are now the bcrypt
hash in the database and the gitignored credentials file — not a plaintext
line sitting in `.env` indefinitely.

**Where the password is documented:** `docs/admin-access.local.md`, plus a
new `*.local.md` rule in `.gitignore`. Flagged explicitly in that file that
a password manager is the better long-term home. `docs/` was **not**
already gitignored, so without the new rule the password would have been
committed the moment this project becomes a git repository (it currently
is not one) — worth noting as the specific reason the rule was added rather
than assuming `.env`-style protection extended to `docs/`.

**Verified, not assumed:** confirmed via a throwaway script (deleted after
use) that the stored value is a real bcrypt hash, is *not* the plaintext
password, validates against the correct password, and rejects a wrong one.

---

## 2026-08-02 — Fixed `.env` loading in `apps/api` and the bootstrap script (cwd-relative → file-relative)

**Decision:** Changed both `prisma/bootstrap-admin.ts` and
`apps/api/src/main.ts` to resolve `.env` from the script's own location
(`path.resolve(__dirname, ...)`) rather than the current working directory,
and added `dotenv` as an explicit `apps/api` dependency.

**Why:** Bootstrapping the admin account failed with a misleading
`DatabaseAccessDenied` auth error. Full investigation in `debug-log.md`;
root cause was that `import "dotenv/config"` resolves `.env` against the
cwd, and `pnpm --filter` runs scripts from `apps/api`, which has no `.env`.
`DATABASE_URL` was therefore undefined and the pg adapter fell back to
libpq defaults. **The wider finding was worse than the original bug:**
`apps/api` had no `.env` loading of any kind, so every database-backed
route had always failed at runtime (`GET /api/faqs` → 500) — never noticed
because all prior database verification went through Prisma scripts run
from the repo root, never through the running API.

**Judged a routine, in-scope bug fix rather than something to ask about:**
it is a defect in code written this session, the fix is small and
reversible, and it follows the existing pattern (the same `dotenv` package
already used elsewhere in the repo). Logged rather than flagged, per the
autonomy-boundary agreement. `dotenv` does not overwrite already-present
environment variables, so this is safe in production, where real env vars
still take precedence over the file.

---

## 2026-08-02 — Admin auth verified end-to-end against the real database

**What was tested** (running API, real Supabase connection, real admin
account — not mocks, not just typechecks):

| # | Case | Expected | Actual |
|---|---|---|---|
| 1 | `PUT /api/shop-settings`, no cookie | 401 | 401 ✅ |
| 2 | Login, wrong password | 401, generic message | 401 "Invalid email or password" ✅ |
| 3 | Login, correct password | 200 + httpOnly cookie | 200, cookie set, `HttpOnly` flag present ✅ |
| 4 | `PUT /api/shop-settings`, with cookie | not 401 | 500 (guard passed — see below) ✅ |
| 5 | Logout with cookie | 200 | 200 ✅ |
| 6 | Logout again, revoked cookie | 401 | 401 ✅ |
| 7 | Rapid repeated logins | 429 after 5/60s | 429 ✅ |

**On case 4's 500:** the guard correctly allowed the request through (the
point of the test — it was not a 401); the *update* then failed with Prisma
`P2025` because the `ShopSettings` singleton row does not exist on the real
database (that table still has 0 rows — it has never been seeded in
production). Not an auth defect.

**Rough edge noted, not fixed:** `ShopSettingsService.updateSettings()` lets
`P2025` surface as a bare HTTP 500 "Internal server error", whereas
`getSettings()` throws an explanatory message for the same missing-row
condition. Left alone deliberately — the real resolution is seeding the
production row, which is a business decision (what real shop details to
publish), not a code fix to make unilaterally. Flagged to the user instead.

---

## 2026-08-02 — Appointments: separate endpoint for contact enquiries, not a shared one

**Decision:** Built `Appointment` + `POST /api/appointments` (public,
rate-limited) and `GET /api/appointments` (admin-guarded). Deliberately did
**not** wire `enquiry-form.tsx` on `/contact` to the same endpoint. It is
still simulated.

**Why:** The two forms collect genuinely different things. Appointment
requires `preferredDate`/`preferredTime`/`category`, which the enquiry form
does not collect at all; enquiry requires `subject`/`message`, which the
appointment form does not collect. They even disagree on which of
email/phone is required. Sharing a table would mean making three required
appointment fields nullable and adding two nullable enquiry fields,
producing a table where no row ever fills all columns and neither form's
contract is actually enforced by the schema. They are also semantically
different: an appointment is a scheduling request with a confirm/decline
workflow, an enquiry is a message awaiting a reply. Full comparison table
and a concrete proposed contract are in `docs/api.md`. Not built because,
unlike the appointment contract, this one was not delegated to me and would
mean inventing an unapproved API shape.

**Field list taken strictly from the existing form.** Nothing invented. The
one addition is server-side `status` (`pending`/`confirmed`/`declined`),
which is not a form field but is directly required by the confirmed policy
that "Fitting-session booking is a customer request, not a live calendar.
Admin confirms or proposes an alternative." `status` is never accepted from
client input.

**Open question flagged, not decided:** past dates are currently accepted.
Rejecting them looks obvious but is a business rule rather than input
validation, so it was flagged rather than silently chosen.

**Posts directly from the browser, not through a Next.js route handler.**
A server-side proxy would make every submission appear to come from the one
web-server address, silently converting the API's per-IP rate limit into a
global one that a single spammer could use to lock out all real customers.

---

## 2026-08-02 — Placeholder imagery: design-system, not licensed stock

**Decision:** Chose option (b), non-photographic placeholders generated from
the design system, over (a) licensed free-commercial stock.

**Why:** The process narrative is a direct claim about how *this* workshop
works. A stock photograph of a different workshop presented in that context
is a misleading placeholder in a way that an abstract one is not, and the
user's own brief already identified process imagery as the stronger
placeholder-compromise. Licensed stock would also need per-asset license
tracking for images destined to be deleted. The generated placeholders read
as cloth swatches, carry zero licensing risk, and cannot be mistaken for a
photograph, which keeps the "photography still pending" state honest and
visible rather than hidden.

**How they were made:** a throwaway Python/PIL script kept in the session
scratchpad, deliberately **not** committed. It is authoring tooling, not
project code, and adds no dependency to the repo. All 30 files total 119 KB.
Palette progresses from Tan toward Everglade across the six process stages
so the sequence reads as progression even before real photography exists.

**No image generation anywhere in the product.** No API call, no key, no
model download, per the out-of-band Colab pipeline.

### IMAGE GENERATION CHECKLIST (the actual deliverable for Colab)

Drop finished files at these exact paths to replace placeholders. Paths and
aspect ratios are already committed to in code, so this is a file drop, not
a code change. Dimensions are multiples of 64 for FLUX friendliness.

**Process narrative — HIGHEST PRIORITY. 1152x1536 (3:4 portrait).**
These carry a claim about this atelier specifically, so they matter more
than anything else on the site.

| Path | Should depict |
|---|---|
| `apps/web/public/images/process/01-measuring.png` | A tape measure in use on a person, close on hands and cloth. No faces needed. |
| `apps/web/public/images/process/02-cutting.png` | Shears cutting cloth on a bench, chalk marks visible. |
| `apps/web/public/images/process/03-sewing.png` | Machine or hand sewing, thread and needle in focus. |
| `apps/web/public/images/process/04-fitting.png` | A jacket being pinned on a wearer or a form, mid-adjustment. |
| `apps/web/public/images/process/05-pressing.png` | An iron and pressing cloth on a garment, steam if possible. |
| `apps/web/public/images/process/06-finished.png` | A completed garment on a dress form, clean and lit. This one also needs to visually hand off into the catalogue. |

**Garment pairs — 1024x1280 (4:5 portrait). Both halves of a pair MUST
share the aspect ratio or the hover crossfade will jump.**
`-flat` is the piece laid out or shot as detail; `-on-form` is the same
piece dressed on a form. Same garment, same lighting, same framing.

For each of these nine slugs, two files, `{slug}-flat.png` and
`{slug}-on-form.png`, in `apps/web/public/images/catalogue/`:
`navy-two-piece`, `charcoal-three-piece`, `ivory-wedding-suit`,
`tailored-blazer`, `flat-front-trouser`, `oxford-shirt`,
`linen-shirt`, `relaxed-chino`, `weekend-overshirt`.

**Category pairs — 1024x1280 (4:5), same pattern:**
`category-suits-{flat,on-form}.png`, `category-corporate-{flat,on-form}.png`,
`category-casual-{flat,on-form}.png`.

**Menswear only.** No womenswear, no bridal, no native/traditional wear.

**If a path changes**, edit `apps/web/lib/process.ts` and
`apps/web/lib/garments.ts` only. No component references an image path.

---

## 2026-08-02 — Scroll reveals hand-rolled, not GSAP (deviation from the frontend skill, flagged)

**Decision:** Built `ScrollReveal` on `IntersectionObserver` plus two CSS
properties, rather than adding GSAP, Motion and Lenis as the
`atelier-frontend` skill nominates for `apps/web`.

**Why:** The entire requirement is "fade and rise slightly, once." That is
a few lines of observer and two transitions. GSAP plus ScrollTrigger is
tens of kilobytes of JavaScript for that, which sits badly against both the
skill's own non-negotiable performance guardrail and the instruction to keep
this project light. Nothing here needs a timeline, easing curves beyond
CSS, or scrubbing.

**This is a real deviation from a stated skill instruction, so it is flagged
rather than buried.** If the hero video transition or the customize-modal
work later genuinely needs orchestration, GSAP/Motion can be added then, for
those, without retrofitting them here.

---

## 2026-08-02 — ScrollReveal failsafe: content must never stay invisible

**Decision:** `ScrollReveal` reveals content via three independent paths: an
immediate synchronous reveal if the element is already in the viewport at
mount, the `IntersectionObserver` callback, and a 3-second failsafe timer.
Reduced-motion users never get a hidden state at all (the hiding rule lives
inside a `prefers-reduced-motion: no-preference` query), and a `<noscript>`
rule forces visibility when JavaScript never runs.

**Why the failsafe specifically:** during browser verification,
`IntersectionObserver` was observed **never firing at all** in the automated
Chrome context, including on a freshly created, plainly visible,
fixed-position element and on `document.body`, while `requestAnimationFrame`
kept running. CSS transitions were stuck at their start values in the same
context (disabling the transition immediately produced the correct final
opacity, and `getAnimations()` returned an empty list). That is an
environment artifact rather than an application bug, and the same code
reached `data-reveal="shown"` on all twelve elements once the failsafe
existed.

The lesson taken from it is the real point: a design where text is hidden
until a callback arrives has a failure mode where the text is simply never
readable. Being unable to reproduce a normal browser here is exactly the
reason not to rely on the callback being the only path. Worst case the
animation is skipped; the alternative worst case is unreadable content.

**Not verified, and stated as such:** the actual motion (timing, easing,
the hover crossfade) could not be observed in this environment for the
reasons above. Structure, layout, reveal state and final styles were
verified; the feel of the animation was not.

---

## 2026-08-02 — FAQ copy: voice rewritten, facts untouched

**Decision:** Rewrote all four seeded FAQ answers for voice. Every fact is
unchanged, including which policies remain unsettled. No answer gained a
timeframe, price, percentage, or commitment that was not already there.

**Also removed every em-dash**, per instruction. Worth noting that three of
the four original answers contained one, so this was not limited to the
turnaround answer that was called out.

**Deliberately avoided in the rewrite:** any implication of staff size
("more hands"), since AGENTS.md forbids building staff or craftsperson
entities, and any hint of a turnaround range, which remains unconfirmed in
`docs/business-requirements.md`.

**Not published.** The copy lives in `prisma/seed.ts`; the real database's
`Faq` table is still empty, so none of it is live yet. Running
`prisma db seed` would also write the `ShopSettings` singleton, which is a
separate business decision about publishing shop identity that has been
asked about and not yet answered. Flagged rather than run.

---

## 2026-08-02 — Seeded the real database (approved), and what that did and did not publish

**Decision:** Ran `prisma db seed` against the real Supabase database on
explicit approval, framed by the user as fixing a live bug rather than
publishing business facts: `GET /api/shop-settings` was returning 500
because the singleton row did not exist.

**What is now live:** `shopName`, `whatsappNumber`, `cityCountry` and
`tagline` (all previously confirmed), plus the four rewritten FAQ entries.

**What deliberately stayed empty, and was verified afterwards rather than
assumed:** `phone`, `email`, `address`, `hoursWeekday`, `hoursSaturday`,
`hoursSunday`, `pricingNote` are all empty strings and `depositPercentage`
is `0`. Confirmed field by field with a throwaway script after seeding. The
seed uses `update: {}` on upsert, so re-running it will never overwrite a
value the owner later sets by hand.

**Verified through the running stack, not just the database:**
`GET /api/shop-settings` now returns 200 with real data, `GET /api/faqs`
returns the four rewritten answers, `/faq` renders them, and the WhatsApp
links now resolve to `wa.me/2347061313517` (they had been silently omitting
themselves while the fetch failed).

**Incidental fix found while verifying:** the FAQ page's own intro copy
contained two em-dashes. The earlier rewrite covered the seeded answers only,
not the page chrome around them.

---

## 2026-08-02 — Deleted legacy off-brand imagery, kept formal-wear.png

**Decision:** Deleted `bridal.png`, `lounge-wear.png` and `native-wear.png`
(4.4 MB). Confirmed zero references across all `.ts`/`.tsx`/`.css`/`.json`
sources before deleting, and re-ran the build afterwards.

**Kept `formal-wear.png`** despite it being from the same legacy set: it is
still referenced by `apps/web/app/about/page.tsx`. Deleting it would have
broken that page.

**Still present and unreferenced, not deleted:** the twelve
`apps/web/public/images/home/*.jpg` files (4.0 MB) are also referenced
nowhere. They were outside the scope of what was approved, so they were
reported rather than removed.

---

## 2026-08-02 — Enquiry endpoint built as its own entity

**Decision:** Built `Enquiry` + `POST /api/enquiries` (public,
rate-limited) and `GET /api/enquiries` (admin-guarded), separate from
`Appointment`, per the proposal previously recorded in `docs/api.md`.

**`subject` is a plain String, not a Postgres enum.** The existing form's
wire value `custom-request` contains a hyphen, which is not a legal Postgres
enum identifier. A native enum would therefore need `@map` plus a two-way
translation layer between the stored value and the wire value, and the only
thing gained over the Zod allowlist already guarding that boundary would be
a duplicate of the same constraint in a second place. Same conclusion as
`Appointment.category` for a different underlying reason, and both are
documented as such rather than left to look like an unexamined default.

**`status` has exactly two values** (`unread`, `replied`), because that is
all the confirmed behaviour requires. No triage, archival or priority
workflow was invented, and `status` is never accepted from client input.

**Verified end-to-end against the real database**, not only typechecked:
unauthenticated `GET` returns 401, public `POST` returns 201, a malformed
payload returns 400 naming all three invalid fields, the admin `GET` returns
the row with `phone: ""` correctly stored as `null` and the hyphenated
subject preserved, and the sixth rapid submission returns 429. All four
verification rows were deleted afterwards, leaving the table empty for real
customers.

---

## 2026-08-02 — Committed to a branch rather than directly to master

**Decision:** Created `feat/enquiries-and-seed` and committed the four
checkpoints there rather than onto `master`.

**Why:** Standing guidance is not to commit directly to a default branch.
The repository has no remote, so nothing here is published and merging is a
single command (`git checkout master && git merge feat/enquiries-and-seed`).
Flagged rather than done silently, since the request said "commit as you go"
without specifying a branch and the commits will not appear on `master`
until merged.

**Checked before the first commit, not assumed:** `.env` and
`docs/admin-access.local.md` are both matched by `.gitignore`, neither is
tracked, and neither appears anywhere in commit history.

---

## 2026-08-03 — RLS: closed a live public exposure, and why RLS still does not constrain the app

**Found by measuring, not by reading the earlier flag at face value.** The
standing note said "no RLS enabled, API connects as superuser." Both halves
turned out to be slightly wrong and the real situation was worse:

- `postgres` is **not** a superuser here, but it holds `rolbypassrls`, which
  has the same practical effect and additionally overrides `FORCE`.
- The actual exposure was not the missing RLS by itself. It was that
  Supabase's `anon` and `authenticated` roles held **full**
  SELECT/INSERT/UPDATE/DELETE/TRUNCATE on every table, including `Admin`
  password hashes and `AdminSession` tokens, with RLS off and PostgREST live
  on the public internet. The anon key is public by design.

**Decision:** revoke those grants outright rather than write permissive
policies for those roles. Nothing in this product uses PostgREST, so `anon`
and `authenticated` have no legitimate need for any access, and removing
access is a stronger and simpler statement than granting it conditionally.

**The part that is easy to miss:** Supabase sets DEFAULT PRIVILEGES on the
`public` schema, so the *next* Prisma migration that creates a table would
have re-granted everything automatically. `ALTER DEFAULT PRIVILEGES` is
included precisely so the fix does not silently undo itself the next time the
schema changes.

**Verified rather than asserted:** nine hostile probes run as `anon` inside
rolled-back transactions (read password hashes, read session tokens, read
customer PII from both tables, read shop settings, delete all appointments,
update shop settings, insert a rogue admin, truncate FAQs). All nine blocked.
Full API regression afterwards: public GET/POST, admin login, admin GET,
admin PUT, all unchanged.

**Stated plainly because the request asked for it:** RLS still does not
constrain `apps/api`, because it connects with a BYPASSRLS role. Enabling RLS
was worth doing regardless, since it is what blocks PostgREST and it makes the
configuration already-correct for the day the app stops bypassing. But the
honest headline is that the *grant revocation*, not the RLS, is what closed
the exposure today.

**Not fixed unilaterally, because it changes how the app connects:** the
deeper issue is that `apps/api` uses one database role for every request, and
whether a caller is an admin lives in an HTTP cookie that Postgres never
sees. A single scoped role would therefore need the union of all permissions
including customer PII reads, which is the very thing RLS would be trying to
restrict, and would look safer without being safer. Two options, tradeoffs,
and a recommendation (two roles, because its failure mode is a permission
error rather than silent full access) are written up in
`docs/architecture.md`. It needs new connection strings, so it needs an owner
decision and new `.env` variables rather than an edit from me.

---

## 2026-08-03 — Admin self-service credential changes

**Decision:** `POST /api/auth/change-password` and
`POST /api/auth/change-email`, both guarded and both rate-limited on the same
5/60s budget as login. Added `GET /api/auth/me` alongside them so a dashboard
can check session validity without probing a data endpoint.

**Current password is required even though the caller already holds a valid
session.** A session cookie proves "this browser was logged in at some point",
not "this is the account owner right now". Without the password check, a
stolen cookie or an unattended browser would be enough to change the password
and permanently lock the real owner out. The extra prompt is the difference
between losing a session and losing the account.

**Password change revokes every other session but keeps the caller's.**
If the reason for changing a password is that something leaked, leaving the
other sessions alive defeats the point. Keeping the caller's own session
means changing your password does not log you out of the screen you are
standing in front of. Email change deliberately revokes nothing, because it
does not invalidate the credential sessions were established against.

**12-character minimum treated as a security control, not a business
policy**, so it was set here rather than escalated as an owner decision. It
is above the NIST floor and below the length of the generated bootstrap
password, so it constrains nobody in practice.

**Verified end-to-end against the real database, ten checks:** wrong current
password rejected (401), too-short password rejected (400), unauthenticated
call rejected (401), correct change accepted (200), caller session still
valid (200), other device's session revoked (401), old password rejected at
login (401), new password accepted (401 -> 200), plus the equivalent
malformed/incorrect/correct sequence for email including `/me` reflecting the
new address.

**Credentials were then restored to the documented values** and that restore
was confirmed at the database level with `bcrypt.compare`, so
`docs/admin-access.local.md` remains accurate and nobody is locked out. The
temporary verification password no longer validates.

---

## 2026-08-03 — Two scoped database roles wired into the API

**Decision:** `PrismaService` now holds two clients. `publicDb` connects as
`atelier_api_public`, `adminDb` as `atelier_api_admin`. Neither role holds
BYPASSRLS, so for the first time the policies added in
`20260803000000_enable_rls` actually constrain the application rather than
being bypassed. Migrations and seeds continue to use `DIRECT_URL`/
`DATABASE_URL`, which is correct: schema changes legitimately need privileges
the running app should never have.

**Chosen per endpoint, not per service.** Several services span both levels
(`ShopSettingsService` serves a public GET and a guarded PUT;
`AppointmentsService` a public POST and a guarded GET), so the client is
selected at the individual call site by what the *endpoint* exposes. That
also gives a useful smell test: reaching for `adminDb` in an unguarded path
is a signal the endpoint should probably have been guarded.

**No fallback to `DATABASE_URL` when the scoped variables are missing.** The
convenient-looking default would mean a deployment with a typo'd variable
name silently running every request as the BYPASSRLS role, with nothing
appearing wrong. `PrismaService` refuses to start instead.

### Two problems this surfaced, both found by running it rather than reading it

**1. RLS deny-by-default is silent on SELECT.** The previous migration gave
`Admin` and `AdminSession` no policies at all, reasoning that nothing outside
a BYPASSRLS connection should read a password hash. Correct while the app
connected as `postgres`; wrong the moment it stopped, because the app itself
became a non-bypassing role. The symptom was not a permission error: under
RLS, a SELECT with no matching policy returns **zero rows**, so
`findUnique` returned `null` and login simply behaved as "no such account".
Worth remembering that RLS fails closed *quietly* on reads and loudly on
writes. Fixed by policies that name the roles explicitly, which is also more
precise than the untargeted policies written before the roles existed.

**2. `INSERT` alone is not enough for Prisma's `create()`.** Prisma issues
`INSERT ... RETURNING`, so it also needs SELECT on whatever comes back. The
lazy fix would be granting the public role plain SELECT on `Appointment` and
`Enquiry`, which would hand it every customer name, phone number and message
body and defeat the entire split. Instead: a **column-level** grant on
`(id, status)` only, paired with `select: { id: true, status: true }` in the
service so the RETURNING clause matches. A leaked public credential can now
learn that appointments exist and whether they are pending, and nothing about
who made them.

### Verification

- **20 database-level probes** across both roles, writes inside rolled-back
  transactions. Public role denied on: reading `Admin` hashes, reading
  `AdminSession` tokens, reading `Appointment`/`Enquiry` PII, updating shop
  settings, deleting appointments, deleting FAQs, inserting an admin,
  updating appointment status. Public role allowed on exactly its own job.
  Admin role allowed across the admin surface, and still **denied** deleting
  the `Admin` row.
- **Full API regression, 16 checks**, all identical to before the split:
  public GETs and POSTs, validation 400, all guarded routes 401 without a
  session, login (wrong and correct), `/me`, admin GETs, admin PUT, logout,
  and `/me` failing after logout.
- **The failure mode was proven, not asserted.** `listAppointments` was
  deliberately miswired to `publicDb`, the API restarted, and a correctly
  authenticated admin called `GET /api/appointments`. Result: HTTP 500 with
  `permission denied for table Appointment` in the log and **zero rows
  returned**. The miswiring was then reverted and the regression re-confirmed.
  That is the property worth having: a developer who forgets which client to
  use gets a loud error, not silent full access.

### Note for whoever adds the next feature

`atelier_api_admin` deliberately has no INSERT or DELETE on `Admin`. Adding a
second admin account from inside the running app will fail until that grant
and a matching policy are added. `prisma/bootstrap-admin.ts` still works
because it uses `DATABASE_URL`.

---

## 2026-08-03 — Rate limiting split by audience rather than raised

**Decision:** public write endpoints keep 5/60s per IP; admin-guarded routes
get 1200/60s. The global ceiling was **not** raised.

**Why:** anonymous submission is the spam surface, which is exactly where the
limit does its work. Admin traffic is bursty for a structural reason (one
navigation costs a session check plus the screen's data) but the caller has
already proved they hold the account. Raising one number would have loosened
protection where it matters to fix a problem that only exists where it does
not.

**One exclusion:** `change-password` and `change-email` stay on the tight
5/60s despite being guarded, because they accept a password and are still a
credential-guessing surface.

**Verified both directions:** 140 rapid authenticated `/me` calls produced
zero rejections (old ceiling was 100), while the sixth public POST in a
minute still returned 429.

---

## 2026-08-03 — CustomRequest and Order

Full contracts in `docs/api.md`. The judgement calls:

**Two deviations from the skill spec, both recorded.** Contact fields added
(the spec has no name or reply channel, which does not work for customers
without accounts). Reference image omitted entirely including the column,
because uploads need a storage decision that does not exist, and a column
with no way to populate it is a guess at the eventual shape.

**Custom requests deliberately not built on the shared RecordScreen.** It is
a queue, not a status list: oldest first, declining needs a typed reason
before the action is available, and an accepted request offers to become an
order. Bending the shared component around those would have made it worse for
the two screens it already serves.

**Orders carry no pricing and no assumed currency.** Defaulting to NGN was
tempting given Lagos, but it is an unconfirmed business fact and an amount in
an assumed currency is worse than no amount. Status lifecycle kept coarse
rather than inventing production stages nobody has described.

**Customer-facing order lookup skipped and flagged.** Approved in AGENTS.md,
but what a customer may see and whether a phone number alone identifies
someone are both undecided, and the second is a genuine enumeration risk
given how predictable Nigerian mobile prefixes are.

---

## 2026-08-03 — Verification of sections 4 and 5

**Backend, 17 checks against the real database:** unauthenticated GET and
PATCH rejected on both modules, public POST accepted, invalid payload
rejected, decline-without-reason rejected, accept clearing a stale decline
reason, `reviewedById` recorded, order creation rejected for an unknown
source id, pricing genuinely null on creation, Decimal precision surviving a
round trip, a three-decimal amount rejected, 404 on an unknown order.

**Browser, against the real database:** public page renders with no file
input, both new screens load real rows, the decline flow keeps its confirm
button disabled until a reason is typed, and the decline persisted with
reason and reviewer recorded. Order pricing edited through the UI
round-tripped into the table.

**One false negative worth recording:** a browser assertion reported the
decline had not taken effect. It had. The assertion had read a stale row
reference; the direct database read settled it. Checking the database rather
than trusting the DOM is what made the difference, and it is the reason the
standard is "verify at the data layer" rather than "verify what the screen
says".

**Both new screens were checked specifically for the `useSessionAwareError`
render-loop class of bug** by leaving each idle for six seconds and
confirming no rate-limit error appeared, which is exactly what that loop
produced last session.

All probe rows removed. Database back to its seeded state: four FAQs, one
shop settings row, everything else empty.

---

## 2026-08-03 — Catalogue restructured to five lines; agbada and kaftan added

**This supersedes the 2026-08-01 decision that removed native/traditional
wear**, and it resolves open item #1 in the `atelier-frontend` skill.

That skill says "menswear only... no native wear... do not build them even if
old mockups suggest otherwise", and separately lists "Native/traditional wear
status: unresolved, **pending owner confirmation**". The 2026-08-01 entry
removed those categories on the strength of the first line. The owner has now
asked for Agbada and Kaftan by name, with explicit routes, which is exactly
the confirmation the second line was waiting for. Recorded as a supersession
rather than applied silently, because reversing a documented decision without
saying so makes the log untrustworthy.

**New structure:** Suits, Agbada, Kaftan, Casuals, Corporate. `casual` also
became `casuals` to match the requested route, so `/catalogue/casual` now
404s.

**Casuals and Corporate are parent lines**, each holding a shirt and a
trouser, rather than single garments.

**Agbada and Kaftan have no individual pieces listed.** Rather than invent
garment names, cloths and descriptions for lines nobody has described, those
category pages say plainly that pieces are not listed yet and point at a
conversation. Same honesty standard as the empty shop settings.

**Ripple handled:** the category allowlists are validated server-side, so
`APPOINTMENT_CATEGORIES` and `CUSTOM_REQUEST_CATEGORIES` in the API, plus the
matching option lists in both public forms, were updated together. Leaving
them would have meant a customer selecting "Agbada" getting a 400 from a form
that offered it.

### OPEN QUESTION — shirt and trouser imagery, needs answering before photography

There is **one** shirt pair and **one** trouser pair, shared by both the
casuals and the corporate lines. If a casual shirt and a corporate shirt are
meant to be visually distinct garments (different cloth, cut, formality) then
this needs **four** pairs, not two:

| Path | Currently |
|---|---|
| `shirt-flat.png` / `shirt-on-form.png` | shared by casuals **and** corporate |
| `trousers-flat.png` / `trousers-on-form.png` | shared by casuals **and** corporate |

Splitting them later is a data change in `lib/garments.ts` only (swap
`sharedPair(...)` for `placeholderPair(...)` per garment), but the photography
has to be shot with the answer already known. Flagged rather than guessed.

**Also still needed:** real agbada and kaftan imagery. Both currently use
generated placeholders at
`category-agbada-{flat,on-form}.png` and `category-kaftan-{flat,on-form}.png`,
1024x1280 (4:5) like the rest of the catalogue set.

---

## 2026-08-03 — Hero carousel

**Scope:** replaced the home page hero's three-image process grid only. The
process narrative further down the page is untouched.

**`CAROUSEL_INTERVAL_MS = 5000`, named and exported.** This is navigation
rather than decoration, so the dwell time has to be long enough to read a
label and decide whether to click.

**Autoplay pauses on hover and on focus**, and after a manual advance it
pauses for 10 seconds and then **resumes** rather than switching off for good.
A carousel that stops permanently after one click has stopped being a
carousel; the goal is not to fight the user, only to get out of their way.

**Reduced motion disables autoplay entirely** rather than slowing it, leaving
a static first slide with working manual controls.

**Every slide is a real anchor**, so it works with a keyboard, middle-clicks
into a new tab, and is announced as a link. Only the active slide is tabbable
(`tabIndex={-1}` on the rest), so tabbing does not walk through four hidden
links. Arrow keys advance and reverse. Labels are always visible rather than
revealed on hover, because a control you cannot read until you touch it is
not a control.

### Verification

Measured in a real browser, not asserted:

- **Interval:** after a manual advance the carousel sat still for **15.2
  seconds** (the 10s pause, then the first tick 5s later; predicted 15000ms),
  and subsequent advances were **5000ms and 5000ms exactly**.
- **Sequence and wrap:** Corporate → Suits → Agbada → Kaftan → Casuals →
  Corporate → Suits, confirming it cycles all five and wraps.
- **Manual advance** wrapped slide 5 → 1 and paused autoplay as designed.
- **Keyboard:** ArrowRight advanced, ArrowLeft reversed, indicator buttons
  jumped directly, exactly one carried `aria-current`.
- **Label matches destination:** the visible label always equalled the slug of
  the tabbable link, so no slide can advertise one line and navigate to
  another.
- **Navigation:** clicking the active slide landed on `/catalogue/casuals`
  with the heading "Casuals".
- **Routes:** all five category pages return 200; agbada and kaftan render the
  honest empty state; casuals and corporate list two pieces each; the retired
  `/catalogue/casual` returns 404.

**One measurement artifact worth recording:** an early sampling run produced
ragged intervals (8799ms, 6513ms, 3487ms) that looked like a timing bug. They
were caused by my own synthetic hover and mouseleave events pausing and
resuming autoplay mid-measurement. A clean run with no pointer interference
gave exact 5000ms gaps. The lesson is the same one as the stale-row false
negative: check what the measurement itself is doing before believing it.

---

## 2026-08-03 — Heritage page: dashes removed, and a fabricated brand removed with them

**Dashes.** All eleven em-dashes on `/about` were removed, and the same sweep
was run across the rest of the site: contact, appointment, the two form
confirmations, and one admin hint. Every public page now renders zero
em-dashes and zero en-dashes.

They were rewritten rather than swapped for commas. An em-dash usually marks
a thought the sentence could not hold, so replacing the punctuation alone
leaves a sentence that still wants it. "The last details, buttons, seams, the
set of a collar, are where a garment holds up" is worse than the original;
splitting it into two sentences is better than both.

**Interpretation, flagged in case it is wrong:** this was read as no dashes
used as sentence punctuation. Hyphens inside compound words are untouched,
so "made-to-measure" and "three-piece" still read normally. Say if hyphens
were meant too.

**One em-dash deliberately kept:** `app/admin/orders/page.tsx` uses one in a
table cell as the "no value" marker. That is a typographic convention in a
data table rather than punctuation in a sentence, and it is admin-only.

### The bigger find: a fabricated business on the Heritage page

`/about` was illustrated with `formal-wear.png`, which carries a prominent
brass plaque reading **"ADEBAYO & CO. / LAGOS / BESPOKE TAILORS / EST.
1960"**.

That is a fabricated business name, a fabricated trade description and a
fabricated 1960 founding date, displayed on the one page whose entire job is
telling people who this house is. `logs/decisions.md` had recorded the plaque
back on 2026-08-01 and kept the image anyway as "the only genuinely on-brand
asset available", but that reasoning does not survive contact with the page
it ended up on: a heritage page invites the reader to believe exactly the
claim the plaque is making. Replaced with a design-system placeholder from
the current set.

That was also the last reference to `formal-wear.png` anywhere in the
codebase.

**Also corrected while in there:** the hero still described the house as
"suits, corporate wear, and casual pieces", which stopped being true when the
catalogue moved to five lines. It now names all five.

---

## 2026-08-03 — Business renamed to Bodman Outfits, and the name made database-driven

**The real business name is Bodman Outfits.** "Atelier Haute" was placeholder
branding that had never been confirmed. Casing confirmed by the owner as
title case.

**The rename exposed a standing gap rather than just needing find-and-replace.**
`ShopSettings.shopName` has existed in the database, seeded and Admin-editable,
since the ShopSettings work, but **nothing on the public site ever read it**.
All fifteen visible occurrences were hardcoded, directly against AGENTS.md:
"shop details... are database-managed, editable Admin content, not frontend
constants."

So the header, the footer and the browser tab title now read `shopName` from
the database. Renaming again is a change in the Admin dashboard, not a
deployment. The root layout already fetched shop settings for the WhatsApp
link, so this costs no extra round trip.

**`SHOP_NAME_FALLBACK` exists as a safety net, not a source of truth.** It
covers two cases only: the API being unreachable, and the per-page metadata
descriptions, which are static exports evaluated at build time and cannot
await a fetch. The constant is documented as such so nobody mistakes it for
the canonical value.

**The footer tagline is now database-driven too**, and is omitted entirely
rather than substituted when the API is unreachable. An invented tagline
would be worse than none.

**Live database updated** alongside the seed, and the unconfirmed fields were
re-checked afterwards: phone, email, address, hours and pricing note are all
still empty strings, deposit still 0. The rename touched the name only.

### The judgement call worth reviewing

The word "atelier" appeared in five more user-visible places that were not
the brand name itself: the About page title and eyebrow, an image alt, and
two catalogue section labels ("THE ATELIER EDIT", "THE ATELIER EXPERIENCE").

"Atelier" is a legitimate common noun for a tailoring workshop, so these were
not strictly wrong. But they read as an unfinished rename now that the brand
no longer contains the word. They were changed to "the house", which is the
voice the site had already established independently ("A member of the house
reads every enquiry", "Come to the house", "A Lagos house working in
menswear"), rather than inventing new brand language. The About page title
also became "Heritage", matching its own navigation label instead of echoing
the retired brand.

**Easy to revert** if "atelier" was wanted as a generic descriptor.

**Deliberately not renamed:** the npm workspace package names
(`@atelier-haute/web`, `@atelier-haute/api`) and the repository directory.
They are internal identifiers, invisible to customers, and renaming them
means lockfile churn and a broken `pnpm --filter` in every command in the
docs and logs for no user-facing benefit. Worth doing only if the repository
is ever renamed for other reasons.

---

## 2026-08-03 — Process clips: path convention, and a load guarantee that does not rely on a hint

**Path.** `public/videos/process/`, not `public/videos/`. The existing
convention is `public/images/<section>/`, already holding `catalogue/`,
`home/` and `process/`, so videos mirror it. The request listed the files as
`videos/01-measuring.mp4`; the extra `process/` segment is the difference,
and it decides whether the files are found. A `README.md` sits in the folder
as the drop checklist and so git tracks the directory at all, since git does
not track empty ones.

**Note on the brief:** it referred to "the earlier video task". There is no
earlier video task in this session's history, so nothing was assumed from it.
Everything built here comes from the requirements stated in this request,
which were complete on their own.

### The load guarantee

The requirement was zero network activity ahead of scroll, explicitly not
just `preload="none"`, because that attribute is a hint that browsers are
free to interpret loosely.

So the `<source>` element **is not rendered at all** until the observer
fires. A `<video>` with no source has nothing to fetch, which makes the
guarantee structural rather than advisory. `preload="none"` is kept as a
second layer for the window after the source appears, and it turned out to
be doing real work: see the verification below.

**No prefetch of the next stage**, deliberately. On a slow connection that
costs a beat before a clip starts and the poster covers it.

**Deliberately no failsafe timer, unlike `ScrollReveal` in this same
codebase.** That component reveals text and must never leave content
unreadable, so it gives up waiting and shows itself. Here the opposite holds:
a timer that loaded the video anyway would defeat the requirement outright.
If the observer never fires, the correct outcome is that the clip never loads
and the poster stays, which is a complete rendering of the stage.

**Reduced motion renders no `<video>` element at all**, so there is no
playback attempt and no request. The poster is the whole experience.

**A missing file degrades to the poster**, which is the same thing the page
showed before videos existed. The poster is rendered through `next/image`
underneath the video rather than as a raw `poster` attribute, so it is
optimised rather than shipping the full-size original.

### Verification, and what could not be verified

**Verified:**

- With the page fully loaded and parked at the top: **zero requests to
  `/videos/`**, zero `<source>` elements, six `<video>` elements mounted.
  Confirmed twice with network tracking active before the load.
- Server-rendered HTML contains **no `<video>` and no `<source>` elements**.
  The clip URLs appear only as inert props inside the RSC payload, which is
  data, not a fetchable element.
- When the observer does fire, the source is attached, the file is fetched
  (HTTP 206) and the element reaches `readyState 4`, confirmed directly on
  the first stage.
- `preload="none"` is genuinely load-bearing: in one run all six `<source>`
  elements were present but **only three files were actually fetched**,
  because the browser does not download a source it has not been asked to
  play.

**Not verified, stated plainly:** strict one-request-per-stage-as-you-reach-it
timing. IntersectionObserver delivery is intermittent in this automated
Chrome context, the same defect hit earlier this session. Callbacks stall and
then flush as a batch, so a run that should have loaded one clip per stage
instead showed all six sources appear at the first sample. That is a
measurement artifact of the harness, not eager loading by the component: the
same run began from a verified zero-request state and nothing loaded until
scrolling started.

**Worth one human check on a normal browser:** open the network panel, scroll
slowly through the six stages, and confirm requests arrive one at a time.
Everything structural is in place for that to be true; what could not be done
here is watch it happen cleanly.

## 2026-08-04 — Depth/motion on the process clips: full option comparison (research only, not yet implemented)

Asked to research the real range of options for adding depth/motion to the six
process clips before writing any code. No implementation has been done; this
entry records the comparison and the recommendation awaiting go-ahead.

### The six options, measured against this project

| Option | What it actually produces | Cost | Fit here |
|---|---|---|---|
| **Native CSS scroll-driven animations** (`animation-timeline: scroll()` / `view()`) | Any transform scrubbed against scroll or element-visibility progress: inner parallax, scale, opacity, and 3D transforms too. Runs **off the main thread**. | **0 bytes.** No runtime, no hydration, no scroll listener. | Chrome/Edge 115+, Safari 26+. **Firefox stable still has it behind `layout.css.scroll-driven-animations.enabled` as of FF 152 (June 2026)**; it is an Interop 2026 priority. ~82% global. Not Baseline. Degrades to *nothing happens*, which for a garnish is the correct failure. `@media (prefers-reduced-motion: no-preference)` wrapping gives a real static fallback with zero extra logic. |
| **CSS 3D transforms** (`perspective`, `rotateX/Y/Z`, `translateZ`, `preserve-3d`) | Genuine perspective projection of a flat plane. True 3D *space*, but the content stays a flat rectangle in it. | 0 bytes. | Universal support, years of Baseline. But it is only a *vocabulary* — something still has to drive it over scroll (a scroll-driven timeline, or JS). A static tilt with no driver reads as decoration for its own sake. |
| **Framer Motion / Motion** (`useScroll` + `useTransform`) | Same visual range as the above, driven by JS motion values that bypass React re-render. | ~30 kB gz full; ~15 kB with `LazyMotion`; the 4.6 kB figure requires `m` + a feature bundle that `useScroll`/`useTransform` largely negate. Main-thread rAF. | Ergonomic and `useReducedMotion` is built in. But it buys API convenience over ~15 lines of CSS, and this app currently ships **zero runtime dependencies beyond Next/React**. |
| **GSAP + ScrollTrigger** | The most control: scrub, pin, snap, timelines, 3D. Industry standard. | ~22–23 kB gz core + ~12 kB ScrollTrigger ≈ **34 kB gz**. Now fully free including ScrollTrigger. | Nominated by the frontend skill and already declined once for ScrollReveal (see 2026-08-02 entry). Nothing about "make the clips feel like they have depth" needs pinning or timeline sequencing. Declining it again is consistent, not a new deviation. |
| **React Three Fiber / Three.js** | True WebGL. For *video* it means a `VideoTexture` on a mesh — a flat plane in a real 3D scene. Actual dimensionality would need depth maps or displacement, which on live footage of a person and cloth produces melting/smearing artefacts. | **~150 kB+ gz** for three alone, plus R3F; three does not tree-shake well. Plus a GL context and decode→texture upload per clip, times six. | Wrong on every axis: weight, the "no tech demo" standard, mobile GPU/battery, and it does not even deliver more than CSS does for this content. Strong no. |
| **IntersectionObserver + manual transform** (what exists) | Discrete state changes at threshold crossings — reveal, play/pause. Scrubbing requires adding a rAF scroll handler. | 0 bytes; already written. | Already load-bearing here and correct for what it does. Extending it to per-frame scrub means main-thread scroll work on mobile, which is exactly the jank the native timelines exist to avoid. |

### The honest finding about "real 3D" on this specific footage

A video frame is already a photographic projection: the camera lens has
baked one perspective into the image. Rotating that rectangle in CSS
perspective adds a *second, contradictory* projection on top. On abstract UI
(cards, panels, text) that reads as depth, because those have no perspective
of their own to contradict. On a mannequin shot it does the opposite — the
garment's vertical seams and shoulder line skew, the eye reads "a photo
print being tilted," and the flatness of the image becomes *more* obvious,
not less. On the close-up craft shots (hands, needle, shears) it is worse:
the shallow depth of field already implies a plane, and tilting it makes the
blur fall in a direction the optics do not support.

Rule of thumb from this: at ~2° the tilt is subliminal and pointless; by ~6°
it visibly skews the garment and reads as a slide in a deck. There is no
useful window in between.

### Recommendation

**No library.** Native CSS scroll-driven animations, and specifically
**inner parallax, not rotation.**

The video sits at ~110% scale inside its existing fixed 3/4 frame and
translates a few percent on Y against scroll, scrubbed by `view()`. That
produces depth through the one cue that is honest about this content:
content moving at a different rate than the frame that crops it — the same
reason a window in a moving train reads as depth. Nothing about the image
geometry is altered. No shear, no second perspective, no distortion of the
garment. Optionally a 1.06 → 1.00 settle as the stage centres.

Cost: zero bytes, zero main-thread work, no new dependency, ~15 lines of
CSS plus one class in `process-stage-video.tsx`. Firefox users see the
current static crop until the flag flips; that is an absent garnish, not a
broken page. Reduced motion is a `@media (prefers-reduced-motion:
no-preference)` wrapper — the animation is never declared, so the fallback
is the genuinely static poster/clip already shipping, not a slowed-down
version of the effect.

Identical on mobile and desktop; nothing hover-dependent.

### Known implementation hazards, recorded now so they are not rediscovered

- The frame is `overflow-hidden rounded-2xl`. iOS Safari has a long-standing
  bug where a transformed/composited child escapes a rounded ancestor's
  clip. Needs a mask or an isolation layer, verified on real iOS.
- The stage frame is `aspect-[3/4]` — on a phone it is close to viewport
  height, which compresses `view()` progress badly. Needs an explicit
  `animation-range` rather than the default cover range.
- The parallax must animate a node *inside* the frame, not the `<li>`.
  `ScrollReveal` already transitions `transform` on the `<li>`; animating
  the same property on the same node would clobber the reveal.
- The `<video>` is opacity-cross-faded on `canplay`. The parallax has to
  apply to both the poster `<Image>` and the video, or the two will drift
  apart during that fade.

**Status: approved and implemented, same day.**

### What was built

`.process-parallax` in `apps/web/app/globals.css`: `scale: 1.12` plus a
`translate3d(0, -4%, 0)` → `translate3d(0, 4%, 0)` keyframe on
`animation-timeline: view()`. ±4% of a 1.12 layer stays inside the 6% of
overflow the scale creates per edge, so the frame never shows through.
Double-gated by `prefers-reduced-motion: no-preference` and
`@supports (animation-timeline: view())`; both gates fail to the same static
crop that shipped before.

In `process-stage-video.tsx` the poster and the clip were moved into **one
shared parallax layer** rather than being animated separately, so they cannot
drift apart during the `canplay` cross-fade — the one moment both are
visible. The `<li>` transform used by `ScrollReveal` is untouched. The frame
gained `[mask-image:radial-gradient(white,black)]` for the iOS Safari bug
where a composited child escapes a rounded ancestor's overflow clip.

No dependency added; `apps/web` still ships only Next and React. Typecheck
and `next build` both clean.

**Not verified here:** the effect on a real Chrome/Safari scroll, and the iOS
corner clip on real hardware. Both need a human look.

## 2026-08-04 — Parallax: a wrong diagnosis, corrected, and what is actually verified

Owner reported seeing no effect at all. Debugging in the automated Chrome
context produced **two false conclusions before a true one**, recorded here
because the failure mode will recur.

**False conclusion 1: "`overflow: hidden` makes the frame a scroll container,
so `view()` resolved against a box that never scrolls."** Plausible, and a
real gotcha in general, but *not what was happening here*. It was asserted
from readings of an element roughly 4600px below the fold, because
`scrollIntoView()` and `window.scrollTo()` are **silently no-ops** in this
harness: `scrollTop` stayed 0 throughout. Every "progress: null, transform:
none" reading simply meant "element is off screen".

A/B once real scrolling worked: `overflow: hidden` on the section, on the
frame, or on neither gave **identical progress (0.381)**. The `overflow-clip`
change was reverted. It fixed nothing.

**False conclusion 2:** mid-session readings after several rapid edits (all
six stages reporting progress 1, transform none) were **HMR-corrupted state**,
not real. Only readings taken after a full reload are trustworthy here.

**What is actually true.** Real wheel scroll works where programmatic scroll
does not. On a clean load, scrolled to the process section, all six stages
scrub with distinct per-stage progress and live transforms.

The **named** timeline is kept over an anonymous `view()` on measurement, not
theory: same element, same scroll position, anonymous `view()` gave progress
0.381 with computed `transform: none`, while `view-timeline-name` on the
frame gave progress 0.381 with `matrix(..., -9.64)`. The mechanism is
inferred in the CSS comment and labelled as inferred.

Amplitude raised from scale 1.12 / ±4% to **scale 1.16 / ±6%**, since the
original was tuned to be nearly subliminal and the owner could not see it.

**Not certified:** per-stage timing. Readings were inconsistent across runs in
this harness. Needs a human eye on a normal browser. Also still unknown
whether the owner is on Firefox, where the feature is flag-gated and the
effect is correctly absent.

---

## 2026-08-04 — FAQ: prices published, "policies pending" framing removed

**Owner instruction:** stop telling customers policies are still being made
(the admin app is where policies get written), and do not discourage
customers, because pricing *is* available.

**Prices, given by the owner, in Naira:** Kaftan 25,000; Suits 70,000;
Agbada 70,000; Casuals from 90,000; Corporate 120,000. These map one-to-one
onto the five catalogue lines in `apps/web/lib/garments.ts`.

Only Casuals was quoted as "upwards", so only Casuals reads "from". **Flagged
for confirmation:** whether the other four are starting figures too, and
whether Casuals at 90,000 really exceeds Suits at 70,000, which is unusual
enough to be worth a second look.

`apps/web/app/faq/page.tsx`: the grey "some answers are pending" notice is
replaced by a "What it costs" list, ordered lowest first so it opens on the
most approachable number, followed by a line that the final figure moves with
cloth and detail. Subtitle now reads "How we work, what it costs, and how to
begin."

`prisma/seed.ts`: the deposit answer and the alterations answer dropped the
"still being settled" framing. **Neither gained a fact** — no deposit amount,
no payment method, no alterations guarantee. They point at a conversation
instead of announcing an unfinished policy.

**Not published.** The seed rewrite does not touch the live database, whose
`Faq` rows were written on 2026-08-02. The two old answers are still live as
written. Fixing that is either an owner edit in the admin app, which is what
the owner pointed at, or an approved database write. Not run.

## 2026-08-04 — Pricing: one source, and a unit qualifier that cannot be dropped

**Checked before building, as instructed.** There was no per-category pricing
model to reuse. `ShopSettings` carries a single free-text `pricingNote` and a
`depositPercentage`; the five catalogue lines are not in the database at all,
they are `apps/web/lib/garments.ts`. So the prices went onto the existing
`Category` type in that file rather than into a new model or a stretched
singleton. `pricingNote` was left alone; it is still unrendered publicly.

**The decision that shaped everything else:** the item/outfit distinction is
modelled as data (`PriceUnit`), not written into prose at each call site.
Casuals at 90,000 sits directly beside Suits at 70,000 in the carousel and on
the catalogue index, and a bare figure there invites a customer to read
90,000 as the price of one shirt. Three formatters exist so a call site
cannot get this wrong: `formatStartingPrice` always prefixes "From",
`priceUnitLabel` gives the short qualifier for dense layouts, and
`priceUnitDetail` gives the full "shirt and trousers together, not either
piece on its own" for pages where someone is actually deciding.

The riskiest surface is `/catalogue/casuals` and `/catalogue/corporate`,
where the outfit price is followed by a grid of individually named pieces
("Casual Shirt", "Casual Trousers"). That grid reads exactly like per-item
pricing, so it gets an explicit contradiction above it. The single item pages
get the same treatment for the same reason.

**Deliberately not built:** any quantity discount logic. The copy says
pricing is negotiable on larger orders and names no structure, because none
has been decided.

**Also fixed:** the FAQ price list added earlier the same day kept its own
hand-written copy of the five figures and had already drifted, marking only
Casuals as a starting price. It now sorts a view of the shared data.

**Verified** against built HTML across all five category pages, both listing
pages, the item pages and the FAQ: every naira figure is preceded by "From",
and a search for a bare figure returns nothing.

---

## 2026-08-04 — Resend notifications: the failure path is the feature

**Fire-and-forget, enforced in the service rather than at the call site.**
`NotificationsService.notifyNewSubmission` never throws and never rejects:
every path ends in a log line and a resolved promise. That contract is what
makes `void this.notifications.notifyNewSubmission(...)` safe in the three
services instead of an unhandled rejection waiting to happen.

**A subtlety worth recording:** the Resend SDK reports API-level failures in
`result.error` rather than by throwing, so a try/catch alone would have
treated an expired key or an unverified sender as a successful send. Both the
returned-error branch and the thrown-error branch are handled.

**Email content is built from the submitted DTO, not re-read from the row.**
All three create paths write through `publicDb`, whose role holds a
column-level SELECT grant on `id` and `status` only. Re-reading the record
would have meant a second query on the elevated `adminDb` connection purely
to populate a notification, which is a privilege escalation for no gain.

**Recipient: `NOTIFICATION_EMAIL`, not `ADMIN_BOOTSTRAP_EMAIL`.** The task
left this to judgement. Starting the API revealed the answer rather than
settling it by taste: **`ADMIN_BOOTSTRAP_EMAIL` is not present in the API's
runtime environment at all**, so building on it would have meant
notifications that silently never send. It is kept as a fallback because it
costs nothing, but it is not the mechanism.

**Deep links** go to `/admin/<list>?focus=<id>`. There are no per-record
admin routes and inventing three of them was well beyond the ask, so the
existing list/detail screens learned to read the parameter, select that row
and scroll to it. Extracted to `useFocusParam` once there were two call sites
(the shared `RecordScreen`, and the bespoke custom-requests page). It is
one-shot on purpose: a deep link that re-selected its record on every refresh
would fight an admin who clicked something else.

`window.location.search` rather than `useSearchParams`, because the admin
screens are statically prerendered and the router hook would force a Suspense
boundary on every page that used it.

### Verified, and what was not

**Verified end to end:** with a deliberately broken `RESEND_API_KEY`, a
`POST /api/enquiries` returned **HTTP 201**, the row was created
(`cmsef1n6d0000npijcfq1kxwa`), and the service logged
`application_error: Unable to fetch data` without touching the response. That
is the guarantee the task actually cared about, and it holds.

**NOT verified: that an email arrives.** No send was ever attempted, because
there is no recipient configured and `ADMIN_BOOTSTRAP_EMAIL` is absent. The
address was not guessed. `NOTIFICATION_FROM` is also unset, so the sender
would currently be Resend's shared test address, which only delivers to the
Resend account owner. Both need setting before this works.

**A test row was created in the production database** to run the above. Id
and name recorded in project-status.md so it can be deleted.

**Process note:** an API was already listening on :4000. A broad `pkill`
was used at one point which could have caught it; it did not, confirmed by
PID and parent before continuing. Later cleanup targeted PIDs directly. The
lesson is the obvious one: no pattern-matched kills on a machine running the
owner's own server.

---

## 2026-08-04 — Staggered headings: four, not everywhere

Applied to exactly four headings: the hero, the signature-garments heading,
the process heading, and the closing call to action. **Not** applied to the
six process stage titles, which was tempting and would have been wrong:
repeating the effect six times down one column turns a considered detail into
a tic. Not applied to body copy or FAQ answers either, per the brief.

45ms between words. A seven-word heading finishes in about a third of a
second, which reads as the line settling rather than as an intro sequence.

**The screen reader guard is explicit, not hopeful.** Splitting a sentence
into per-word elements can make assistive tech announce it in fragments. The
container carries `aria-label` with the whole original string and every word
span is `aria-hidden`, so assistive tech reads the sentence and never sees
the split. Verified in built HTML: all four headings expose the full sentence
as their accessible name, across 29 aria-hidden word spans.

**Reduced motion returns the plain string in a plain element** with no spans,
no observer and no transition. The fallback is the real text, not a stilled
version of the effect.

**A bug caught during verification and fixed:** the split markup is
server-rendered already marked hidden, so with JavaScript disabled the
headings would have stayed at opacity 0 permanently. The existing `<noscript>`
rule covered `[data-reveal]` only; it now covers `[data-stagger-inner]` too.
Confirmed present in the built HTML.

**Not verified:** how the stagger actually feels at normal scroll speed. That
is a judgement call needing a human eye, and the automated browser context
in this session has already proved unreliable for scroll behaviour.

## 2026-08-04 — Stagger spacing bug, and extending the motion sitewide

**The bug, and it was mine.** The first staggered headings rendered as
`Clothcutfortheperson,notthemarket.` The space between words was a child of
the word's wrapper span, and that span is `display: inline-block` so it can
be transformed. **Whitespace at the end of an inline-block is trimmed**, so
every space vanished. Fixed by making the space a SIBLING of the word span
rather than a child, where it is ordinary inline whitespace: it renders at
the font's natural width and the line still wraps between words, which
`&nbsp;` would have broken. The two nested spans collapsed into one at the
same time, since the outer one existed only to hold that space.

**Extended on request.** `StaggerText` now also drives the h1 on catalogue,
category, item, FAQ, about, contact and appointment. Verified in built HTML
that each exposes its full sentence as the accessible name, including the
dynamic ones (`Casuals`, `Casual Shirt`).

**The garment grids were the real find.** Every page except home used
`catalogue-enter`, a **load-time** CSS animation with a staggered
`animationDelay`. That looks like a scroll effect on the first screen and is
nothing of the sort: cards below the fold finish animating before the reader
ever reaches them, so scrolling revealed already-settled content. The
category cards on `/catalogue` and the garment cards on
`/catalogue/[category]` now use `ScrollReveal` instead, so the clothes
actually arrange as you scroll.

Stagger resets per row (`index % 2` on the two-column index, `index % 3` on
the three-column grid) rather than accumulating down the list, so a long line
never ends on a card that waits most of a second to appear.

Page headers deliberately keep `catalogue-enter`: they are above the fold,
where a load-time entrance is the correct behaviour and a scroll trigger
would do nothing.
