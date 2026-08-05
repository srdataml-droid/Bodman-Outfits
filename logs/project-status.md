# Project Status

Last updated: 2026-08-05 (shop details confirmed, published and verified on the
rendered pages — see `docs/shop-details-rollout.md`; admin dashboard record
corrected, nine screens listed below; direct connection on 5432 unreachable)

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
7. ~~`ShopSettings` still has **0 rows**.~~ Resolved. The singleton row exists and is fully populated as of 2026-08-04; `GET` and `PUT` both work. `Faq` holds four rows.

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

8. ~~**Real shop details still unconfirmed**~~ Resolved 2026-08-04/05. The
   owner confirmed address, opening hours, phone, email, WhatsApp, pricing
   note and deposit percentage. All are stored, rendered and verified on the
   rendered pages. Full record in `docs/shop-details-rollout.md`.

   That work also fixed a real bug: the fields had **no public consumer at
   all**. `/contact` carried hardcoded prose saying the address and hours
   were "still being finalized", so no admin save could ever have shown up.
   Nothing was wrong with the write path.
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

~~`ShopSettings.pricingNote` is still not rendered anywhere on the public
site.~~ Resolved 2026-08-04 — it now renders under the FAQ price list. Note
it overlaps with `PRICING_QUALIFIER` in `lib/garments.ts`, which already ends
"and is negotiable on larger orders"; both are the owner's copy, but only
`pricingNote` is editable without a deploy.

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

## Added 2026-08-05

### Catalogue: casuals and corporate are one outfit each
Reversed the earlier shirt/trouser split. `casual-shirt`/`casual-trousers` and
`corporate-shirt`/`corporate-trousers` became `casual-full` ("Casual Outfit")
and `corporate-full` ("Corporate Outfit"). The split contradicted the pricing:
both lines are priced per COMPLETE OUTFIT, so listing a shirt alone under a
₦90,000 line invited the exact misreading `priceUnitDetail` exists to prevent.

The split lived **only** in `lib/garments.ts` — both category pages are
data-driven via `getGarmentsByCategory` — so no page rebuild was needed. Copy
on the category and item pages that described "the pieces below" was rewritten,
since it now described a list that no longer exists.

**Image consequence:** `casual-full-*` and `corporate-full-*` (4 files) do not
exist yet. `shirt-*` and `trousers-*` are now orphaned. Full naming contract is
in `docs/catalogue-images.md`.

### Favorites (device-local)
`lib/favorites.ts` (localStorage via `useSyncExternalStore`),
`components/favorite-button.tsx`, `components/saved-list.tsx`, `/saved`, and a
"Saved" nav entry. Keyed by `category/slug`, **not** a generated id, so
favorites survive the later move of garments into the database.

The device-only limitation is stated in the UI (`FAVORITES_SCOPE_NOTE`) on the
saved page in both empty and populated states, because there is no account
system and a customer would otherwise assume the list follows them.

### Price → booking, never checkout
Prices on the category and item pages are now links to
`/appointment?category=…&garment=…`. **No payment trigger anywhere** — the real
figure is only agreed after a fitting. Slugs are resolved against the catalogue
**server-side** in `app/appointment/page.tsx`, so an unknown or hand-edited slug
prefills nothing rather than echoing attacker-supplied text into the form.
Verified: an injected `<script>` in the query produced 0 live script elements
and an empty notes field.

### FAQ
New row `individual-pieces` (sortOrder 5): single shirts and trousers can still
be made to order even though the catalogue lists outfits. Applied to both
`prisma/seed.ts` and the live database.

### Verified end-to-end
Favorite toggle updates `aria-pressed` and the accessible name; two favorites
persisted across a full reload; `/saved` rendered both with booking links
carrying the garment; booking prefill selected the right category and filled
the note; FAQ entry rendered. `apps/web` typechecks clean.

### NOT built this session, and why
- **Garment database model + admin CRUD.** Blocked: `prisma migrate` needs port
  5432, which is unreachable. Garments remain in `lib/garments.ts`.
- **Paystack payment flow.** Blocked: the only key in `.env` is
  **`sk_live_`**, and the brief was explicit that all work happens against test
  keys first. Nothing was built and the live key was never used. Needs an
  `sk_test_` key.
- **WhatsApp payment notification.** No WhatsApp API exists in this project (no
  Business API token, no Twilio) — only Resend email. A real WhatsApp message
  is not currently possible; a `wa.me` link inside an email is.

## Known blockers / open items (2026-08-04)

1. **Notification recipient is unset.** Nothing will be emailed until
   `NOTIFICATION_EMAIL` is configured. Needs an address from the owner.
2. **Notification sender is unset.** `NOTIFICATION_FROM` on a Resend-verified
   domain is needed before production.
3. **The success path of email sending is unverified.** The failure path is
   verified; a real send was never made because there is no recipient.
4. ~~**Two live FAQ rows still carry the old "policies pending" wording.**~~
   Resolved 2026-08-04. `deposit-and-payment` and `alterations-policy` updated
   in place to the seed wording, verified byte-exact against `prisma/seed.ts`.
   Only `answer` had drifted; question, category and `sortOrder` already
   matched. `updatedAt` was set explicitly, because it is `@updatedAt` in the
   schema and therefore client-maintained — raw SQL does not touch it.

   **Root cause, still present:** `prisma/seed.ts` upserts FAQs with
   `update: {}`, so re-running the seed never corrects an existing row. The
   seed can create the FAQ set but can never fix it. Editing the seed file
   alone will silently do nothing to a populated database — change the rows
   through `/admin/faqs` or SQL, or change the upsert.
5. ~~**A test enquiry row exists in the production database.**~~ Deleted
   2026-08-04 (`cmsef1n6d0000npijcfq1kxwa`, "Claude Test (delete me)"). It was
   the only row in `Enquiry`; the table is now empty, which is correct — no
   real customer enquiry has ever been submitted.
6. **New: the direct database connection on port 5432 is unreachable.** The
   pooler on **6543** works and served all of the above. `prisma migrate` and
   anything using `directUrl` go to 5432 and currently fail with `P1001`; DNS
   resolves and the TCP port accepts, so this is the database side, not the
   network. **No migration can be applied until this is resolved.** Not
   investigated further — flagged, not acted on.
7. **Unreferenced home imagery still present.** The twelve
   `apps/web/public/images/home/*.jpg` files (4.0 MB) remain unreferenced.
   Deliberately left in place 2026-08-04 at the owner's instruction: flagged,
   no urgency, do not delete without asking.
