# Project Status

Last updated: 2026-08-02 (database seeded, enquiries endpoint, legacy assets removed)

This is a living snapshot of what's actually built and working, verified by
reading the code — not aspirational. Update it whenever a feature moves
between Missing/Partial/Done, not on every commit. For *why* things are the
way they are, see `decisions.md`. For the full technical decision trail with
rationale, see `docs/architecture.md`, `docs/api.md`, `docs/ui-ux.md` — this
file is a summary/index, not a replacement for those.

## Customer-facing pages

| Page | Status | Data source | Backend-connected |
|---|---|---|---|
| Home (`/`) | Done | Hardcoded — `lib/garments.ts`, `lib/process.ts` | No |
| Catalogue (`/catalogue`) | Done | Hardcoded — `lib/garments.ts` | No |
| Category (`/catalogue/[category]`) | Done | Hardcoded — `lib/garments.ts` | No |
| Item detail (`/catalogue/[category]/[item]`) | Done | Hardcoded — `lib/garments.ts` | No |
| About (`/about`) | Done | Static JSX | No |
| Contact (`/contact`) | Done | WhatsApp link: real. Enquiry form: **real `POST /api/enquiries`** | Yes |
| FAQ (`/faq`) | Done | Real — fetches `GET /api/faqs` (`lib/faq-data.ts`) | Yes |
| Appointment (`/appointment`) | Done | WhatsApp link: real. Booking form: **real `POST /api/appointments`** | Yes |

## Transactional flow

| Capability | Status |
|---|---|
| Order submission | Missing — no `Order` model, no code anywhere |
| Custom design request | Missing — no `CustomRequest` model. (Note: the contact form's `custom-request` subject captures intent as a message only, not a structured request.) |
| Consultation/appointment submission | **Done** — `POST /api/appointments` (public, rate-limited), `GET /api/appointments` (admin-guarded). Verified end-to-end against the real database. |
| Payment/deposit collection | Missing — no Paystack integration anywhere |
| Order status tracking | Missing — no order entity to track |

## Backend (`apps/api/src`)

| Module | Status | Auth |
|---|---|---|
| `health.controller.ts` | Done | None (appropriate — public health check) |
| `shop-settings/` | Done | GET public, **PUT now guarded by `AdminAuthGuard`** |
| `faq/` | Done — GET only, no writes | None needed (read-only public content, no write endpoints exist to guard) |
| `auth/` | Done — login/logout, session cookie, rate-limited | `POST /api/auth/login` public, `POST /api/auth/logout` admin |
| `appointments/` | Done | `POST` public + rate-limited, `GET` **admin-guarded** |
| `enquiries/` | Done | `POST` public + rate-limited, `GET` **admin-guarded** |
| `prisma/` | Done (infra, not a route) | N/A |

No Order or CustomRequest modules exist yet. No `apps/admin` dashboard yet
(auth backend is built; nothing consumes it as a UI yet).

## Admin dashboard

**Does not exist.** No `apps/admin`. The auth backend (login/logout, session
cookie, guard) is built and already protects `PUT /api/shop-settings`, but
there is still no UI for a non-technical person to use it.

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
4. Neither `ShopSettings` nor `Faq` has Row-Level Security enabled, and `apps/api` connects as the Postgres superuser rather than a scoped role — real Supabase best practices, not yet applied. Needs a live Supabase connection to actually implement. See `docs/architecture.md` 2026-08-02 entry.
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

**No admin UI exists for any of this data.** Appointments and enquiries can
be submitted by customers and read by an authenticated admin over the API,
but there is still no `apps/admin`, and no endpoint yet to confirm/decline an
appointment or mark an enquiry replied. Submissions currently accumulate with
no workflow to act on them.

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
