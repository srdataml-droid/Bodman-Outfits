# Project Status

Last updated: 2026-08-04 (admin dashboard record corrected — nine screens exist and are listed below)

This is a living snapshot of what's actually built and working, verified by
reading the code — not aspirational. Update it whenever a feature moves
between Missing/Partial/Done, not on every commit. For *why* things are the
way they are, see `decisions.md`. For the full technical decision trail with
rationale, see `docs/architecture.md`, `docs/api.md`, `docs/ui-ux.md` — this
file is a summary/index, not a replacement for those.

## Customer-facing pages

| Page | Status | Data source | Backend-connected |
|---|---|---|---|
| Home (`/`) | Done | Hardcoded — `lib/garments.ts`, `lib/process.ts`. Hero is now a five-line category carousel. | No |
| Catalogue (`/catalogue`) | Done | Hardcoded — `lib/garments.ts` | No |
| Category (`/catalogue/[category]`) | Done | Five lines: suits, agbada, kaftan, casuals, corporate. Agbada/kaftan list no pieces yet and say so. | No |
| Item detail (`/catalogue/[category]/[item]`) | Done | Hardcoded — `lib/garments.ts` | No |
| About / Heritage (`/about`) | Done | Static JSX. Copy pass 2026-08-03: em-dashes removed, five lines named, fabricated-brand image replaced. | No |
| Contact (`/contact`) | Done | WhatsApp link: real. Enquiry form: **real `POST /api/enquiries`** | Yes |
| FAQ (`/faq`) | Done | Real — fetches `GET /api/faqs` (`lib/faq-data.ts`) | Yes |
| Appointment (`/appointment`) | Done | WhatsApp link: real. Booking form: **real `POST /api/appointments`** | Yes |

## Transactional flow

| Capability | Status |
|---|---|
| Order submission | **Partial** — model, admin endpoints and dashboard exist; orders are created from an accepted request. No customer checkout, blocked on pricing. |
| Custom design request | **Done** — public `POST /api/custom-requests`, admin review queue with accept/decline-with-reason, public form at `/custom-request`. Image upload omitted pending a storage decision. |
| Consultation/appointment submission | **Done** — `POST /api/appointments` (public, rate-limited), `GET /api/appointments` (admin-guarded). Verified end-to-end against the real database. |
| Payment/deposit collection | Missing — no Paystack integration anywhere |
| Order status tracking | Admin-side done. **Customer lookup not built** — needs a decision on what customers may see and whether a phone number alone identifies them. See `docs/api.md`. |

## Backend (`apps/api/src`)

| Module | Status | Auth |
|---|---|---|
| `health.controller.ts` | Done | None (appropriate — public health check) |
| `shop-settings/` | Done | GET public, **PUT now guarded by `AdminAuthGuard`** |
| `faq/` | Done — full CRUD | `GET` public; `POST`/`PUT :id`/`DELETE :id` **admin-guarded** |
| `auth/` | Done — login/logout, session cookie, rate-limited | `POST /api/auth/login` public, `POST /api/auth/logout` admin |
| `appointments/` | Done | `POST` public + rate-limited, `GET`/`PATCH :id` **admin-guarded** |
| `enquiries/` | Done | `POST` public + rate-limited, `GET`/`PATCH :id` **admin-guarded** |
| `custom-requests/` | Done | `POST` public + rate-limited, `GET`/`PATCH` **admin-guarded** |
| `orders/` | Done | **entirely admin-guarded**, no public route |
| `prisma/` | Done (infra, not a route) | N/A |

Every module above exists, including `orders/` and `custom-requests/`. All of
them are consumed by the admin dashboard described below.

## Admin dashboard

**Exists and is built.** It lives at `apps/web/app/admin/` — inside the
existing web app, **not** as a separate `apps/admin` package. That is worth
noting because earlier entries in this file (and in `docs/`) refer to a
planned `apps/admin` that was never created; the route group replaced it.

Nine screens:

| Route | Screen | What it does |
|---|---|---|
| `/admin` | Index | Not a screen — redirects into the dashboard |
| `/admin/login` | Login | Email + password, renders outside the auth shell to avoid a redirect loop |
| `/admin/appointments` | Appointments | Fitting requests, newest first; status changes via `PATCH /api/appointments/:id` |
| `/admin/enquiries` | Enquiries | Contact-page messages; mark replied via `PATCH /api/enquiries/:id` |
| `/admin/custom-requests` | Custom requests | Review queue, accept or decline-with-reason |
| `/admin/orders` | Orders | List, create from an accepted request, edit total/deposit/currency/notes |
| `/admin/faqs` | FAQs | Full CRUD against the guarded FAQ endpoints |
| `/admin/shop-settings` | Shop settings | Edits the values that feed the public site |
| `/admin/account` | Account | Change password, change email, view current session |

Shared infrastructure lives in `apps/web/components/admin/`:
`admin-shell.tsx` (the authenticated shell — one place decides "session is
gone, go to login"), `record-screen.tsx` (the generic list/detail/status
screen that `appointments` and `enquiries` are both thin wrappers over),
`admin-ui.tsx`, and `use-focus-param.ts` (reads the `?focus=<id>` deep link
that notification emails point at, selects that row and scrolls to it).

**Not verified in a browser.** The screens typecheck clean and the endpoints
they call are verified, but the dashboard itself has not been click-tested
end-to-end against the real database this session.

## Auth

**Implemented 2026-08-02** — real email+password login (`apps/api/src/auth/`).
`Admin` (bcrypt password hash) and `AdminSession` (SHA-256 session-token
hash, 7-day expiry) Prisma models. `AdminAuthGuard` protects
`PUT /api/shop-settings`; `POST /api/auth/login` is rate-limited to 5
attempts/60s/IP. No admin account is seeded with invented credentials — see
`prisma/bootstrap-admin.ts` (requires the owner to add
`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` to `.env` themselves).
**Migration applied to the real Supabase database** 2026-08-02, after
explicit go-ahead. **A real admin account exists** (`samuelirenikase@gmail.com`;
credentials in the gitignored `docs/admin-access.local.md`), and the whole
flow is **verified working end-to-end against the real database** — login,
httpOnly session cookie, guard rejection without it, server-side session
revocation on logout, and 429 rate limiting after 5 attempts/60s. Full test
table in `logs/decisions.md`. Contract detail in `docs/api.md`,
`docs/database.md`, `docs/architecture.md`.

## Infrastructure

| Item | Status |
|---|---|
| Database | Real Supabase credentials present in `.env` as of 2026-08-02. Confirmed live and reachable (`prisma migrate deploy`). |
| Migrations | All four migrations (`add_shop_settings`, `add_faq`, `add_admin_auth`, `add_appointments`) are applied to the real Supabase database. The first two were **already applied** to the real Supabase database — discovered 2026-08-02 via `prisma migrate deploy` reporting "No pending migrations to apply," not something applied by me this session. Schema (tables) exists; **both tables are empty, 0 rows** (verified via `$queryRaw`/`count()`). No seed data has been run against the real database. |
| Deployment config | Missing — no Vercel/Railway/Docker config anywhere. |

## Known blockers (see `docs/api.md` for full detail)

1. ~~`PUT /api/shop-settings` has no auth guard.~~ Resolved 2026-08-02 — guarded by `AdminAuthGuard`.
2. ~~Appointment form is frontend-only.~~ Resolved 2026-08-02 — real `POST /api/appointments`, the `TODO` is gone. ~~FAQ~~ — resolved 2026-08-02. **Still open: the contact enquiry form remains simulated** and needs its own endpoint (see `docs/api.md`).
3. `.env` contains several live-looking third-party API keys in plaintext (Resend, Google, OpenAI, Groq, Grok, OpenRouter, DeepSeek) — flagged for awareness, not something I've acted on.
4. ~~No RLS anywhere.~~ Resolved 2026-08-03, and it was worse than recorded: `anon`/`authenticated` held full SELECT/INSERT/UPDATE/DELETE/TRUNCATE on **every** table including `Admin` password hashes, with PostgREST live on the public internet. Grants revoked, default privileges fixed so future migrations cannot re-grant, RLS enabled and forced, policies added. Verified with nine hostile probes as `anon`, all blocked. ~~**Remaining:** RLS does not constrain `apps/api` itself.~~ **Resolved 2026-08-03** — the two-role split is implemented. `apps/api` now connects as `atelier_api_public` for unauthenticated paths and `atelier_api_admin` for guarded ones; neither holds BYPASSRLS, so policies genuinely apply. Verified with 20 database probes, a 16-check API regression, and a deliberate miswiring test proving a misrouted admin read fails loudly with zero rows leaked.
5. ~~Admin/AdminSession migration not yet applied to the real Supabase database.~~ Resolved 2026-08-02 — `prisma migrate deploy` applied `20260802210000_add_admin_auth` after explicit go-ahead. Verified `Admin`/`AdminSession` exist with 0 rows on the real database.
6. ~~No admin account exists yet.~~ Resolved 2026-08-02 — real admin account created for `samuelirenikase@gmail.com`, credentials in the gitignored `docs/admin-access.local.md`. Auth verified end-to-end against the real database.
7. **New:** `ShopSettings` still has **0 rows** on the real database, so `PUT /api/shop-settings` returns a bare 500 (`P2025`, no row to update) even when correctly authenticated, and `GET` returns 500 too. Seeding it is a business decision (which real shop details to publish) — see `docs/business-requirements.md` for which values are still unconfirmed. `Faq` is likewise empty (`GET /api/faqs` returns `[]`).

## Home page / visual system (2026-08-02)

- **Process narrative** (`components/process-narrative.tsx`, `lib/process.ts`)
  is now the home page's primary storytelling section: six stages
  (Measuring, Cutting, Sewing, Fitting, Pressing, On the form) alternating
  down a centre rule, handing off into the catalogue. Replaced the previous
  three-step "THE PROCESS" grid.
- **Garment hover mechanic** (`components/garment-figure.tsx`): crossfades a
  flat/detail shot into an on-form shot on hover **and** keyboard focus.
  Image pairs live in the data model (`lib/garments.ts`), so real two-shot
  photography swaps in as a data change.
- **Scroll reveals** (`components/scroll-reveal.tsx`): IntersectionObserver
  plus CSS, no motion library. Three independent reveal paths plus a
  `<noscript>` fallback, so content can never be permanently invisible.
- **All imagery is design-system placeholder**, not photography and not
  stock. Full generation checklist (paths, dimensions, what each should
  depict) is in `logs/decisions.md` under the image-generation entry.

## Known blockers / open items (continued)

~~**No admin UI exists for any of this data.**~~ Resolved — the dashboard at
`apps/web/app/admin/` reads and acts on all of it, and the status endpoints
(`PATCH /api/appointments/:id`, `PATCH /api/enquiries/:id`) exist. Submissions
no longer accumulate without a workflow.

Two caveats that are **not** bugs but do limit the workflow: confirming an
appointment or marking an enquiry replied **records your decision only — it
does not notify the customer.** Both screens say so in their own description
text. Contacting the customer is still manual.

8. **Real shop details still unconfirmed** and therefore still empty in the
   database: address, opening hours, phone, email, pricing note, deposit
   percentage. These are business facts pending the owner, not bugs.
9. ~~Contact enquiry form simulated.~~ Resolved 2026-08-02 — real
   `POST /api/enquiries`, built as its own entity. Contract in `docs/api.md`.
10. ~~Unreferenced off-brand catalogue imagery.~~ Deleted 2026-08-02 (4.4 MB).
    **Still outstanding:** the twelve `apps/web/public/images/home/*.jpg`
    files (4.0 MB) are also unreferenced; reported but not deleted, as they
    were outside the approved scope.
11. **Motion not visually verified.** Structure, layout, reveal state and
    final computed styles were verified in a real browser, but the animation
    itself could not be: IntersectionObserver never fired and CSS transitions
    stayed pinned at their start values in that automated Chrome context,
    including for a freshly created visible element. Worth one human look on
    a normal browser.

## Added 2026-08-03

- **Admin self-service auth**: `POST /api/auth/change-password`,
  `POST /api/auth/change-email`, `GET /api/auth/me`. Guarded, rate-limited,
  both mutations require the current password. Password change revokes all
  other sessions and keeps the caller's. Verified end-to-end (10 checks);
  credentials restored to documented values afterwards.
- **Deployment readiness** written up in `docs/deployment-readiness.md`:
  hosting tradeoffs, full environment-variable inventory, pre-deploy
  checklist, and the scoped-role SQL. No host chosen, no host-specific config
  written.

### Requested 2026-08-03 — all three since delivered

- ~~**Admin dashboard UI** and the FAQ write endpoints it would consume.~~
  Done. Nine screens at `apps/web/app/admin/`, and `faq/` now has guarded
  `POST`/`PUT :id`/`DELETE :id`. The business no longer needs `curl` to read
  an appointment or reply to an enquiry.
- ~~**CustomRequest module.**~~ Done — `apps/api/src/custom-requests/`, with
  the review queue at `/admin/custom-requests`.
- ~~**Order model.**~~ Done — `apps/api/src/orders/`, migration
  `20260803020000_add_custom_requests_and_orders`, admin screen at
  `/admin/orders`. Customer-facing checkout is still absent (blocked on
  pricing and payments), so this is the admin half only.

## Added 2026-08-04

### Pricing (live in code, not yet in the database)
Five confirmed starting prices, all minimums, all rendered as "From ₦X":
Kaftan 25,000 · Suits 70,000 · Agbada 70,000 (per item);
Casuals 90,000 · Corporate 120,000 (per COMPLETE OUTFIT, shirt + trousers).

Source of truth is `apps/web/lib/garments.ts` on the existing `Category`
type. There was no per-category pricing model to reuse: `ShopSettings` has a
single free-text `pricingNote` and a `depositPercentage`, nothing per line.
Formatting goes through `formatStartingPrice` / `priceUnitLabel` /
`priceUnitDetail` so "From" and the item-vs-outfit qualifier cannot be
dropped at a call site.

Rendered on: hero carousel (including the accessible name), `/catalogue`
cards, `/catalogue/[category]` header, `/catalogue/[category]/[item]`, and
the `/faq` price list. Verified against built HTML: every naira figure on
every page is preceded by "From", and no bare figure exists anywhere.

`ShopSettings.pricingNote` remains admin-editable and **is still not rendered
anywhere on the public site**. Unchanged by this work, flagged as an
opportunity rather than acted on.

### Email notifications (built, partially verified)
`apps/api/src/notifications/` sends a plain-text alert to the owner when an
Appointment, Enquiry or CustomRequest is submitted. `resend@^6.18.1` added to
`apps/api`. Emails deep-link to `/admin/<list>?focus=<id>`; the admin screens
read that parameter, select the row and scroll to it.

**Configuration required before this works in production:**
- `NOTIFICATION_EMAIL` — **not currently set, and nothing sends without it.**
  `ADMIN_BOOTSTRAP_EMAIL` is the documented fallback but is also absent from
  the API's runtime environment, so the fallback does not save this.
- `NOTIFICATION_FROM` — not set. Falls back to `onboarding@resend.dev`,
  Resend's shared test sender, which only delivers to the address owning the
  Resend account. Needs an address on a verified domain.
- `RESEND_API_KEY` — confirmed present.

### Staggered heading reveal
`apps/web/components/stagger-text.tsx`. Word-by-word fade and rise on four
headings: the hero, the signature-garments heading, the process heading and
the closing call to action. Same IntersectionObserver geometry and failsafe
as `ScrollReveal`, no new scroll system, no library.

## Known blockers / open items (2026-08-04)

1. **Notification recipient is unset.** Nothing will be emailed until
   `NOTIFICATION_EMAIL` is configured. Needs an address from the owner.
2. **Notification sender is unset.** `NOTIFICATION_FROM` on a Resend-verified
   domain is needed before production.
3. **The success path of email sending is unverified.** The failure path is
   verified; a real send was never made because there is no recipient.
4. **Two live FAQ rows still carry the old "policies pending" wording.** The
   seed file was rewritten on 2026-08-04 but the database was not; the rows
   written on 2026-08-02 are unchanged. Owner can edit them in the admin app.
5. **A test enquiry row exists in the production database**, id
   `cmsef1n6d0000npijcfq1kxwa`, name "Claude Test (delete me)". Created
   deliberately to verify the notification failure path. Safe to delete.
