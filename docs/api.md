# API

Purpose: Specify the platform's interfaces, including authentication, endpoints, request and response contracts, error handling, versioning, and integration guidance.

## Approved Contract Addition — Shop WhatsApp Contact

`ShopSettings` includes a `whatsappNumber` field. The value is public display
content and is editable only through the existing protected shop-settings
update endpoint.

```ts
interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  cityCountry: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  pricingNote: string;
  depositPercentage: number;
}
```

- `GET /api/shop-settings` (public) returns `whatsappNumber` with the other
  public display fields.
- `PUT /api/shop-settings` (admin) accepts `whatsappNumber` as a partial
  settings update.
- The initial database seed value is `+234 706 131 3517`.
- API responses never include authentication secrets, password hashes, or
  payment/AI credentials.

**Implemented** (`apps/api/src/shop-settings/`), matching this interface
exactly — `ShopSettingsService.toDto()` explicitly rebuilds the response
object field-by-field so internal columns (`id`, `createdAt`, `updatedAt`)
can never leak into the public shape. `ShopSettings` is a single-row table
keyed by a fixed singleton id (`"singleton"`, defined in both
`shop-settings.service.ts` and `prisma/seed.ts` — keep them in sync if either
changes). Seeded via `prisma db seed` with the confirmed WhatsApp number and
the other confirmed facts (`shopName`, `cityCountry`); every field that is
unconfirmed per Business Requirements (address, hours, pricing, deposit
percentage) is seeded empty/zero rather than with an invented value —
`depositPercentage: 0` is a schema-required placeholder, not a confirmed
"no deposit" policy.

**Resolved 2026-08-02 — `PUT /api/shop-settings` now requires Admin auth.**
`AdminAuthGuard` (see "Admin Authentication" below) is applied to the PUT
route. `GET` stays public/unauthenticated (public display content). The
former open-write exposure is closed; see the Admin Authentication section
for how the guard works.

**Infrastructure note — Prisma v7 generator choice:** the schema uses
`provider = "prisma-client-js"` (the legacy generator), not the newer
`provider = "prisma-client"` generally recommended for Prisma 7 SQL setups.
The newer generator emits raw ESM source (`import.meta.url`) that crashes
under this repo's CommonJS `apps/api` — both a real `tsc` build and `ts-node`
fail with `ReferenceError: exports is not defined in ES module scope`. The
legacy generator emits pre-compiled CJS-compatible output and works
correctly with driver adapters (`@prisma/adapter-pg`) under Prisma 7.
Revisit only alongside a deliberate decision to migrate `apps/api` to ESM —
don't switch generators back without solving that first.

**Infrastructure note — dev runner switched from `tsx` to `ts-node` +
`nodemon`:** `apps/api`'s original `dev` script (`tsx watch src/main.ts`)
silently failed to emit `emitDecoratorMetadata` (esbuild-based tools don't
support it), which broke NestJS constructor injection for any provider
beyond `HealthController` (which had none). This went unnoticed until this
build's first constructor-injected service. Confirmed via
`Reflect.getMetadata("design:paramtypes", ...)` returning `undefined` under
`tsx` and the correct class reference under `ts-node`. `apps/api/package.json`
now runs `nodemon --watch src --ext ts --exec "ts-node src/main.ts"` for
`dev`. The `start` script (`node dist/main.js`, real `tsc` build) was
already correct and needed no change. `tsx` remains appropriate for
`prisma/seed.ts` (a one-shot script with no NestJS decorators).

## Approved Contract Addition — Public FAQ Content

`Faq` is a list, not a singleton — customer-facing, database-managed content
per AGENTS.md, matching `FaqEntry` in `apps/web/lib/faq-data.ts`.

```ts
interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
}
```

- `GET /api/faqs` (public) — returns all FAQs ordered by `sortOrder`.
- No write endpoints yet. See scope decision below.

**Implemented** (`apps/api/src/faq/`), same structure as
`shop-settings/` — `FaqService.toDto()` explicitly rebuilds each row so
`createdAt`/`updatedAt` never leak into the public shape. `id` uses normal
`cuid()` generation (list, not a singleton). Seeded via `prisma db seed`
with the 4 entries migrated verbatim from `apps/web/lib/faq-data.ts` (the
former hard-coded source) — content unchanged, only the storage location
moved. Every seeded answer already states plainly where a policy (turnaround,
deposit, alterations) is still pending owner confirmation, same honesty
standard as ShopSettings.

**Scope decision — no POST/PUT/DELETE endpoints:** unlike ShopSettings PUT,
Admin FAQ management (create/edit/delete/reorder) was **not** built even in
stubbed-unauthenticated form. Two reasons, both explained in a comment in
`faq.controller.ts`:

1. No Admin auth exists (same gap as ShopSettings), so any write endpoint
   here would be just as open — and unlike ShopSettings PUT, nothing calls
   it yet (no `apps/admin` exists), so shipping it open would add a second
   entry to the deployment-blocker list below for zero functional gain.
2. Unlike ShopSettings, there is no already-approved request/response
   contract for FAQ writes (single vs. bulk update, hard vs. soft delete,
   how reordering works). Building it now would mean inventing an
   unapproved API shape, not just leaving an approved one unauthenticated.

Build the write endpoints alongside real Admin auth, as one piece of work,
not before it.

**⚠️ DEPLOYMENT BLOCKER LIST (cumulative):**

1. ~~`PUT /api/shop-settings` — open, unauthenticated write endpoint.~~
   Resolved 2026-08-02 — see "Admin Authentication" below.
2. ~~Appointment form simulated.~~ Resolved 2026-08-02 (real `POST
   /api/appointments`). ~~Contact enquiry form simulated.~~ Resolved
   2026-08-02 (real `POST /api/enquiries`). **Still absent:** FAQ write
   endpoints and every admin mutation (confirm/decline an appointment, mark
   an enquiry replied). These are missing-feature gaps, not live exposures.
   Now that Admin auth exists they can be built and guarded the same way as
   `PUT /api/shop-settings` whenever that work is picked up.

No open, unauthenticated write endpoints remain as of 2026-08-02.

## Approved Contract Addition — Admin Authentication

The only authenticated role in this platform (AGENTS.md — Confirmed Product
Policies): real email+password login, hashed password, session cookie. No
PIN or hard-coded bypass.

```ts
interface LoginRequest {
  email: string;
  password: string;
}
```

- `POST /api/auth/login` (public) — validates credentials against `Admin`,
  creates a server-side session, and sets an httpOnly session cookie
  (`admin_session`). Returns `{ email }` only — never the password hash or
  the raw session token in the response body (the token lives solely in the
  cookie). Rate-limited to 5 attempts per 60 seconds per IP
  (`@nestjs/throttler`), tighter than the global default (100/60s).
  Responds `401` with the same generic "Invalid email or password" message
  whether the email doesn't exist or the password is wrong — never reveals
  which, and runs a real bcrypt comparison against a dummy hash on an
  unknown email so response timing doesn't leak the difference either.
- `POST /api/auth/logout` (admin) — deletes the current session server-side
  and clears the cookie.
- `AdminAuthGuard` (`apps/api/src/auth/admin-auth.guard.ts`) — reads the
  `admin_session` cookie, looks up its SHA-256 hash against the
  `AdminSession` table (never the raw token — see `docs/database.md`),
  rejects if missing/expired, and attaches `{ id, email }` to the request.
  Apply via `@UseGuards(AdminAuthGuard)` on any route that needs Admin auth,
  exactly as done on `ShopSettingsController.updateShopSettings`.
- Session cookie: httpOnly, `sameSite: "lax"`, `secure` in production only,
  7-day expiry, matching `AdminSession.expiresAt`. `sameSite: "lax"` assumes
  the admin frontend and this API share a registrable domain — revisit to
  `"none"` (+ `secure`) only if a production deploy ever puts them on
  genuinely different registrable domains. See `apps/api/src/auth/session-cookie.ts`.
- Password hashing: `bcryptjs`, cost factor 12 for new admins (bootstrap
  script) — chosen over the native `bcrypt` package to avoid a native
  build step in this environment.
- **Bootstrap:** no admin account is seeded with invented credentials. Run
  `pnpm --filter @atelier-haute/api run bootstrap-admin` after adding
  `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to `.env` yourself
  (the owner's real choice, not something I can generate). The script
  (`prisma/bootstrap-admin.ts`) upserts by email, so it's safe to re-run
  after rotating the password.

**Not yet built:** password reset/change flow, login attempt lockout beyond
the per-IP rate limit, session listing/revocation UI, audit logging of admin
actions. None of these block closing the deployment blocker above; revisit
if/when `apps/admin` is built.

## Approved Contract Addition — Appointment Requests

Defined 2026-08-02. **The field list is derived strictly from what
`apps/web/components/appointment-form.tsx` already collects** — no fields
were invented on top of the existing form.

```ts
// POST /api/appointments  (public)
interface CreateAppointmentRequest {
  name: string;           // required, 1..120
  phone: string;          // required, 1..40
  email?: string;         // optional, valid email, <=200; "" is treated as absent
  preferredDate: string;  // required, "YYYY-MM-DD", must be a real calendar date
  preferredTime: "morning" | "afternoon" | "evening";
  category: "suits" | "corporate" | "casual" | "not-sure";
  notes?: string;         // optional, <=2000; "" is treated as absent
}

// 201 response — deliberately minimal
interface AppointmentReceipt {
  id: string;
  status: "pending";
}

// GET /api/appointments  (admin only)
interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;  // "YYYY-MM-DD", same calendar day submitted
  preferredTime: "morning" | "afternoon" | "evening";
  category: string;
  notes: string | null;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;      // ISO 8601
}
```

- `POST /api/appointments` — **public and unauthenticated by design.**
  Customers never have accounts (AGENTS.md — Confirmed Product Policies).
  Rate-limited to **5 submissions per minute per IP**, the same limit as
  login. Not tighter deliberately: Nigerian mobile carriers commonly NAT
  many users behind one address, so an aggressive per-IP limit would block
  real customers to stop a spammer who can rotate addresses anyway. Volume
  abuse is separately bounded by the field length caps above.
- `GET /api/appointments` — **admin only**, guarded by `AdminAuthGuard`.
  These rows contain customer names, phone numbers and email addresses;
  this endpoint must never ship unguarded. Returns newest-first, capped at
  **200 rows** (no pagination contract yet — add one if that cap is ever
  reached rather than silently truncating more).
- `status` is **never** accepted from client input. It is server-assigned as
  `pending`, per the confirmed policy that "Fitting-session booking is a
  customer request, not a live calendar. Admin confirms or proposes an
  alternative." No endpoint to change it exists yet — that belongs with
  `apps/admin` (see "Not yet built" below).
- `preferredDate` is a **calendar day**, stored as a Postgres `DATE` and
  serialised back as `YYYY-MM-DD`. It is deliberately not a timestamp: the
  customer picks a day, not an instant, and a timestamp would both invent
  precision they never gave and risk a timezone shifting the date by a day.
- Validation rejects dates that are well-formed but not real (e.g.
  `2026-02-31`), which naive `Date` parsing would silently roll forward.

**Open question for the owner (not decided unilaterally):** past dates are
currently **accepted**. Rejecting them looks obvious, but it is a business
rule rather than input validation (same-day requests, timezone edges), and
AGENTS.md forbids silently choosing business rules. Flagged rather than
implemented.

**Frontend wiring:** `apps/web/components/appointment-form.tsx` now performs
a real `POST` (the previous `setTimeout` simulation and its `TODO` are
gone), via `apps/web/lib/appointments.ts`. It posts **directly from the
browser** rather than through a Next.js route handler, so the API's per-IP
rate limiter sees the real client address — proxying would make every
submission appear to originate from the single web-server address and turn
a per-IP limit into a global one. Failures are surfaced distinctly
(validation / rate-limited / unavailable) rather than as one generic error,
and the form is never cleared on failure, so a customer is never left
believing a request was sent that the atelier did not receive.

**Deployment requirement:** `NEXT_PUBLIC_API_URL` must be set for any real
deployment of `apps/web`. It falls back to `http://localhost:4000` for local
development, matching the existing convention in `lib/shop-settings.ts` and
`lib/faq-data.ts`.

**Not yet built:** admin endpoints to confirm/decline an appointment
(`PATCH /api/appointments/:id`), customer-facing lookup of a submitted
request, and any notification (email/WhatsApp) on submission. All of these
need either `apps/admin` or an owner decision on notification channels.

## Approved Contract Addition — Contact Enquiries

Built 2026-08-02, as a **separate entity from Appointment**. The two forms
collect different required fields and mean different things: an appointment
is a scheduling request with a confirm/decline workflow, an enquiry is a
message awaiting a reply. Sharing one table would have required making three
required appointment fields nullable and would have left neither form's
contract enforced by the schema.

| | Appointment form | Enquiry form |
|---|---|---|
| `preferredDate` / `preferredTime` / `category` | required | not collected |
| `subject` | not collected | required |
| `message` | not collected (optional `notes`) | required |
| `email` | optional | **required** |
| `phone` | **required** | optional |

```ts
// POST /api/enquiries  (public)
interface CreateEnquiryRequest {
  name: string;     // required, 1..120
  email: string;    // required, valid email, <=200
  phone?: string;   // optional, <=40; "" treated as absent
  subject: "bespoke" | "fitting" | "custom-request" | "general";
  message: string;  // required, 1..5000
}

// 201 response
interface EnquiryReceipt { id: string; status: "unread" }

// GET /api/enquiries  (admin only)
interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "unread" | "replied";
  createdAt: string;  // ISO 8601
}
```

- `POST /api/enquiries` — **public and unauthenticated by design**, since
  customers have no accounts. Rate-limited to 5 per minute per IP, matching
  appointments and login, and loose for the same carrier-NAT reason.
- `GET /api/enquiries` — **admin only**, guarded by `AdminAuthGuard`. Rows
  contain names, emails, phone numbers and free-text messages. Newest-first,
  capped at 200 rows (no pagination contract yet).
- `status` is never accepted from client input. Only two states exist
  (`unread`, `replied`) because that is all the confirmed behaviour needs; no
  triage or archival workflow was invented.
- `subject` is stored as a plain String rather than a Postgres enum. The wire
  value `custom-request` contains a hyphen, which is not a legal Postgres
  enum identifier, so a native enum would need `@map` plus a two-way
  translation layer to gain a second copy of a constraint Zod already
  enforces at the boundary.

**Frontend wiring:** `apps/web/components/enquiry-form.tsx` performs a real
`POST` (the `setTimeout` simulation is gone) via `apps/web/lib/enquiries.ts`,
posting directly from the browser so the rate limiter sees the real client
IP. Failures are surfaced distinctly (validation / rate-limited /
unavailable) and the form is never cleared on failure.

**Not yet built:** an admin endpoint to mark an enquiry replied
(`PATCH /api/enquiries/:id`), and any notification on submission. Both need
`apps/admin` or an owner decision on notification channels.
