# Deployment: Vercel (web) + Railway (API)

Written 2026-08-05, when the hosts were chosen. Supersedes the host-selection
discussion in `deployment-readiness.md`, which stays as the rationale.

> **⚠️ The domain was never supplied.** The brief said `Domain: [your chosen
> domain]`, i.e. the placeholder was not filled in. Everywhere below,
> **`YOURDOMAIN.com` is a placeholder you must substitute.** Nothing in the
> committed config files contains a domain, so the substitution is confined to
> the environment variables in this document.

| Piece | Host | Address |
|---|---|---|
| Customer site + admin UI (`apps/web`) | Vercel | `https://YOURDOMAIN.com` |
| API (`apps/api`) | Railway | `https://api.YOURDOMAIN.com` |

The admin dashboard is **not** a separate deployment. It lives at
`YOURDOMAIN.com/admin`, inside the Next.js app.

---

## 1. Config committed

| File | Purpose |
|---|---|
| `vercel.json` | Builds only `apps/web` from the monorepo root |
| `railway.json` | Builds only `apps/api`, starts `apps/api/dist/main.js` |

Two code changes were needed to make a first deploy possible at all:

**`apps/api` build now runs `prisma generate`.** This was a hard build
blocker: `generated/prisma` is gitignored and **untracked (0 files in git)**,
while `apps/api/src/prisma/prisma.service.ts` imports from it. The old build
script was `tsc` alone, so a fresh clone on Railway would have failed to
compile with an unresolved import. Verified fixed: the build now emits both
`generated/prisma/client.js` and `apps/api/dist/main.js`.

**`main.ts` now binds `0.0.0.0` explicitly.** A container platform routes to
the container's external interface; a process on loopback only would pass its
own startup log and then fail every health check.

`prisma generate` is deliberately **not** a root `postinstall`. It hard-fails
without `DIRECT_URL` (`PrismaConfigEnvError`), which would break the Vercel
build, and Vercel has no reason to hold a database credential — `apps/web`
never imports the Prisma client. Verified.

### Vercel dashboard settings

- **Root Directory:** repository root (not `apps/web`) — `vercel.json` does the
  filtering. Leave "Include files outside root directory" enabled.
- Framework preset: Next.js (already declared in `vercel.json`).
- Domain: `YOURDOMAIN.com`.

### Railway dashboard settings

- Railway reads `railway.json` automatically.
- Do **not** set a start command in the dashboard; it would override the file.
- Domain: `api.YOURDOMAIN.com`.
- `PORT` is injected by Railway — do not set it yourself.

---

## 2. Environment variables

Cross-referenced against every `process.env` reference in the codebase,
including the dynamic `process.env[name]` lookup in `PrismaService` that a
plain grep for `process.env.X` misses.

### Railway — API

| Variable | Required | Value | If missing |
|---|---|---|---|
| `DATABASE_URL_PUBLIC` | **Yes** | pooler `:6543`, role `atelier_api_public` | **Process refuses to boot.** Deliberate — no fallback to `DATABASE_URL`, because that role holds BYPASSRLS |
| `DATABASE_URL_ADMIN` | **Yes** | pooler `:6543`, role `atelier_api_admin` | **Process refuses to boot** |
| `DIRECT_URL` | **Yes** | direct `:5432` | **Build fails** at `prisma generate`. Needs the var *defined*, not a reachable server — generate does not connect |
| `NODE_ENV` | **Yes** | `production` | Session cookie is issued **without `secure`**. Login still works, but the cookie can travel unencrypted |
| `WEB_ORIGIN` | **Yes** | `https://YOURDOMAIN.com` | CORS falls back to `http://localhost:3000` → **every browser call from the real site is blocked**. Also breaks notification deep links |
| `RESEND_API_KEY` | For email | already held | Notifications silently disabled (warned at boot) |
| `NOTIFICATION_EMAIL` | For email | the owner's address | **Nothing is emailed.** Currently unset |
| `NOTIFICATION_FROM` | For email | address on a Resend-verified domain | Falls back to `onboarding@resend.dev`, which only delivers to the Resend account owner |
| `PORT` | No | — | Railway injects it |
| `DATABASE_URL` | No | — | Migrations/seed only, run locally. Not read at runtime |
| `ADMIN_BOOTSTRAP_EMAIL` | No | — | Only for `bootstrap-admin`. An admin already exists. It *is* the fallback for `NOTIFICATION_EMAIL`, but set that explicitly instead |
| `ADMIN_BOOTSTRAP_PASSWORD` | No | — | Only for `bootstrap-admin`. **Do not set in production** |
| `PAYSTACK_SECRET_KEY` | **No — omit** | — | Payment is not built. The key in local `.env` is a **live** key; do not carry it to Railway |

### Vercel — web

| Variable | Required | Value | If missing |
|---|---|---|---|
| `API_URL` | **Yes** | `https://api.YOURDOMAIN.com` | Server-rendered fetches (shop settings, FAQ) hit `localhost:4000` and fail. Contact details, hours and FAQs vanish — `getShopSettings` returns `null` on failure by design |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.YOURDOMAIN.com` | Browser fetches fail: appointment form, custom-request form, **and the whole admin dashboard** |

Both are needed and they are **not** interchangeable. `API_URL` is server-only
and never enters the browser bundle; `NEXT_PUBLIC_API_URL` is inlined at build
time and is public. Same value, different exposure.

**Vercel needs no database credentials.** `apps/web` never imports Prisma.

> Because `NEXT_PUBLIC_API_URL` is inlined **at build time**, changing it in
> the dashboard does nothing until you redeploy.

---

## 3. Session cookie — correct as-is for this setup

`apps/api/src/auth/session-cookie.ts` issues:

```
httpOnly: true
secure:   NODE_ENV === "production"
sameSite: "lax"
path:     "/"
(no domain attribute)
```

**This is right for `YOURDOMAIN.com` + `api.YOURDOMAIN.com`, and no change is
needed.** Why:

- The two hosts share the registrable domain `YOURDOMAIN.com`, so a call from
  the site to the API is **same-site** (cross-*origin*, but same-*site*).
  `SameSite=Lax` permits same-site `fetch`. This is exactly the arrangement
  `deployment-readiness.md` warned had to be arranged deliberately — a
  `*.vercel.app` frontend calling a `*.up.railway.app` API would have been
  cross-site and the cookie would have been dropped silently.
- **Do not add a `domain` attribute.** Without one the cookie is *host-only*
  for `api.YOURDOMAIN.com`, which is the tighter and correct scope. Setting
  `domain=.YOURDOMAIN.com` would broadcast the admin session to every present
  and future subdomain for no benefit.
- `sameSite: "none"` is **not** needed here, and would be a downgrade.

Already correct elsewhere, verified in code:

- `main.ts` sets CORS `origin: WEB_ORIGIN` with `credentials: true` — a
  specific origin, not `*`, which is mandatory for credentialed CORS.
- `apps/web/lib/admin-api.ts` sends `credentials: "include"` on every admin
  call.

**Two things that will bite:**

1. `NODE_ENV=production` must be set on Railway or the cookie ships without
   `secure`.
2. **Admin login will not work on Vercel preview deployments.** A preview URL
   is `*.vercel.app`, which is cross-site to `api.YOURDOMAIN.com`, so the
   session cookie is dropped. Previews of public pages are fine; test admin
   only on the real domain.

---

## 4. Go-live checklist

Run in order. Each step's failure points at a different cause.

**Infrastructure**
- [ ] `https://api.YOURDOMAIN.com/health` returns OK
- [ ] `https://YOURDOMAIN.com` loads with images and styling
- [ ] Both are HTTPS with valid certificates
- [ ] Railway logs show **no** boot warning about `DATABASE_URL_PUBLIC`/`_ADMIN`

**Public data path** (proves `API_URL` and the public DB role)
- [ ] `/contact` shows the address, all three hours rows, phone and email
- [ ] `/faq` shows five questions including "Can you make just a shirt…"
- [ ] `/catalogue` and a garment page render images
- [ ] The WhatsApp button uses `+2348023770833`

**Public write path** (proves `NEXT_PUBLIC_API_URL` and CORS)
- [ ] Submit the appointment form → success message, no CORS error in console
- [ ] The row appears in `/admin/appointments`
- [ ] Submit the contact enquiry form → success
- [ ] Submit a custom request → success

**Admin session** (proves the cookie)
- [ ] Log in at `https://YOURDOMAIN.com/admin/login`
- [ ] **Reload the page — you stay logged in.** This is the single most
      important check; failure here means the cookie is being dropped
- [ ] DevTools → Application → Cookies: `admin_session` on `api.YOURDOMAIN.com`
      with `HttpOnly` **and `Secure`** both ticked
- [ ] Edit a shop setting, save, confirm it reaches the public page (allow
      **up to 5 minutes** — `revalidate: 300`; this is not a failed save)
- [ ] Log out, confirm `/admin/appointments` bounces to login

**Notifications**
- [ ] Submit a test appointment → the owner receives an email
- [ ] The email's link opens the right record in the dashboard
- [ ] **Delete the test rows afterwards**

---

## 5. What is still left

### Blocking a *complete* launch

1. **Direct database connection (port 5432) is unreachable.** `prisma migrate`
   cannot run. The schema already deployed is fine, so this does not block
   *this* deploy, but no schema change can ship until it is fixed. Possibly a
   paused Supabase project. `DIRECT_URL` must still be *set* on Railway for
   `prisma generate`.
2. **Notification recipient/sender unset.** `NOTIFICATION_EMAIL` and
   `NOTIFICATION_FROM` have never been set, and the email success path has
   **never once been exercised** — only the failure path is verified.
3. **Four catalogue images are generated stand-ins**, not real photography
   (`casual-full-*`, `corporate-full-*`). Every other catalogue image is also
   a design-system placeholder, not a photograph of a real garment.

### Built but not deployable yet

4. **Payments.** Not started. The only Paystack key present is **live**
   (`sk_live_`); an `sk_test_` key is required first. Before going live later:
   business verification complete and settlement account decided.
5. **Garment admin CRUD.** Garments are still a static file
   (`apps/web/lib/garments.ts`). The DB model needs a migration, blocked by (1).

### Known gaps, not blockers

6. **No customer order tracking.** Admin-side only. Needs a decision on
   whether a phone number alone should identify a customer.
7. **No customer checkout.** Orders are created admin-side from an accepted
   request.
8. **No image upload.** Admin would type a path; upload is a separate feature.
9. **No WhatsApp API.** Only Resend email exists. A real WhatsApp message is
   not currently possible — a `wa.me` link inside an email is.
10. **Mobile/tablet unverified for recent work.** The favorites, price-link and
    contact-card changes were checked at 1280px only; the 375/768 checks the
    frontend skill requires were not completed.
11. **31 orphaned image files** (~4.4 MB) still in `public/images/`.
12. **`prisma/seed.ts` upserts with `update: {}`** — it can create rows but
    never correct them. Any FAQ copy change must also be applied to the live
    database by hand.
13. **No CI, no automated tests, no error monitoring** anywhere in the repo.
14. **No backup policy** for the Supabase database.
