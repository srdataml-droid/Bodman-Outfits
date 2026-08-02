# Permission / Clarification Requests Log

Every time I've stopped to ask before proceeding — either because a decision
was genuinely yours to make (business/content/scope) or because an action
needed explicit confirmation. Backfilled on 2026-08-02 for requests before
that date. Does not include routine tool-permission prompts (e.g. "allow
this Bash command?") handled by the CLI's own permission system — only
substantive questions I raised myself.

---

### 2026-08-01 — Home/Catalogue category conflict

**Asked:** How to handle Native Wear/Bridal/Lounge Wear categories on
Home/Catalogue, given the atelier-frontend skill says menswear-only
(Suits/Corporate/Casual) but "keep existing design/content" was also
requested — a direct contradiction.

**Options given:** Switch to Suits/Corporate/Casual · Keep current
categories as-is · Keep current but flag as placeholder.

**Answer:** Switch to Suits/Corporate/Casual.

---

### 2026-08-01 — Contact page: WhatsApp number source

**Asked:** `docs/business-requirements.md` says the WhatsApp URL must come
from a `ShopSettings` API setting, not be hard-coded — but no such endpoint
existed yet (`apps/api` only had a health check). How to handle the number
for this build?

**Options given:** Hard-code with a `TODO` for now · Build the minimal
`ShopSettings` endpoint now.

**Answer:** Hard-code with a `TODO` for now.

---

### 2026-08-01 — Contact page: floating WhatsApp button scope

**Asked:** `docs/ui-ux.md` also specifies a sitewide floating "Chat with
us" button (a second entry point beyond the inline one on `/contact`).
Include it now, or scope this task to `/contact` only?

**Options given:** Contact page only, for now · Add the global floating
button too.

**Answer:** Contact page only, for now. *(The floating button was then
built in a separate, explicitly-requested follow-up task the same day.)*

---

### 2026-08-01 — About page: "Hands Behind the Work" team section

**Asked:** The Stitch mockup profiles three named individuals with
fabricated bios, tenure claims, and AI-generated photos — none real. How to
handle this section?

**Options given:** Keep the section, drop all names/photos (generic
version) · Omit the section entirely.

**Answer:** Omit the section entirely.

---

### 2026-08-02 — ShopSettings backend: PUT endpoint auth protection

**Asked:** `docs/api.md` specs `PUT /api/shop-settings` as admin-only, but
`apps/api` has zero auth implemented anywhere. AGENTS.md also forbids a
PIN-only or hard-coded bypass as a shortcut. How should the PUT endpoint be
protected in this pass?

**Options given:** Leave it open, flag clearly · Build minimal real auth
now.

**Answer:** Leave it open, flagged clearly — plus an explicit instruction to
add a deployment-blocker note to `docs/api.md` distinguishing this from the
softer FAQ/Appointment `TODO`s, since it's a live exposure, not a missing
feature.

---

### 2026-08-02 — ShopSettings backend: database connection for verification

**Asked:** The Prisma schema was empty and `.env`'s `DATABASE_URL` still had
the placeholder `[YOUR-PASSWORD]` — no live database to verify against. How
to handle this for real GET/PUT verification?

**Options given:** User provides a real connection string · User
provisions one themselves and shares it · Skip live verification for now.

**Answer:** Skip live verification for this pass. `.env` was to stay as the
placeholder — not to be prompted for or expected. *(Live verification was
later done anyway, in the very next task, using a genuinely local/temporary
`prisma dev` database rather than the real Supabase credentials — see
`debug-log.md`. This didn't contradict the original answer since it never
touched the real `.env` or required real credentials.)*

---

### 2026-08-02 — This logging setup: file location, backfill scope, granularity

**Asked:** Where should the new project-status/permission/debug/error/
decisions files live; should they backfill history or start fresh; how
granular should the ongoing logs be.

**Options given:** `docs/` alongside existing docs vs. a new `/logs` folder
· start fresh vs. backfill · notable-events-only vs. exhaustive logging.

**Answer:** New `/logs` folder · backfill as much as reconstructable ·
notable events only.

---

### 2026-08-02 — FAQ backend: destructive `prisma migrate reset` consent

**Asked:** Explicit consent to run `prisma migrate reset --force` against
the local `faq-verify` verification database, per Prisma's own built-in
AI-agent safety gate (it refused to run without this). Explained the exact
command, the motivation (stale schema blocking the new migration), that
it's irreversibly destructive, and that this was confirmed to be a local
disposable instance, never connected to real Supabase or `.env`.

**Options given:** Proceed with the reset · tear down and start a
brand-new instance instead · hold off on live verification for this pass.

**Answer:** Yes, proceed with the reset. *(Also asked to install a skill
package in the same turn — see below.)*

---

### 2026-08-02 — Install `supabase/agent-skills`

**Asked:** Whether to actually run `npx skills add supabase/agent-skills`
(the user had pasted the bare command without stating intent, same pattern
as two earlier messages showing `claude` CLI flags that turned out to just
be shown for explanation, not execution).

**Options given:** Yes, install it now · no, just explaining it was enough.

**Answer:** Yes, install it now. Installed two skills (`supabase`,
`supabase-postgres-best-practices`) into `.agents/skills/`, symlinked for
Claude Code.
