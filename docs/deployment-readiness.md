# Deployment Readiness

Purpose: lay out hosting options and their real tradeoffs, inventory the
environment variables each application needs, and state plainly what must be
true before a first deploy. **No host has been chosen and no host-specific
configuration has been written.** That decision is the owner's.

Written 2026-08-03.

---

## The one constraint that should drive the decision

**The database is in `eu-west-1` (Ireland).** That is measurable from the
connection host, `aws-0-eu-west-1.pooler.supabase.com`.

A single API request performs several database round-trips (session lookup,
then the query itself, sometimes a transaction). A single page view performs
one API round-trip. So **API-to-database latency is multiplied and
customer-to-API latency is not.** Putting the API far from Ireland to be
closer to Lagos would make things slower, not faster.

Practical conclusion: host the API in or near `eu-west-1` (Dublin, London or
Frankfurt). For customers in Nigeria, European hosting is already the
conventional choice and is what the existing Supabase region assumes. If that
region assumption is wrong for the business, the right move is to relocate
the *database* first and pick hosting to match, not the reverse.

---

## Frontend: `apps/web` (Next.js)

Vercel is the obvious fit and there is little genuine debate: it is the
first-party host for Next.js, the App Router features in use are supported
without configuration, and the free tier covers a site at this traffic level.
Choose a European region to sit near the API.

The only reason to look elsewhere is if you want everything on one host to
keep billing and operations in one place, in which case the API host below
can usually serve the frontend too.

---

## Backend: `apps/api` (NestJS) — the real decision

NestJS is a long-running server, not a set of functions. Prisma holds a
connection pool and NestJS builds a dependency-injection container at boot,
so **serverless is a poor fit**: every cold start rebuilds the container and
re-establishes connections. Prefer an always-on container.

| Option | Cost (realistic) | Cold starts | Proximity to `eu-west-1` | Complexity |
|---|---|---|---|---|
| **Railway** | Usage-based, roughly $5/mo at this size. No free tier. | None (always-on) | EU West region available | Lowest. Detects the monorepo, deploys from git, environment variables in a UI. |
| **Render** | Free tier exists but **spins down after inactivity**, giving ~50s cold starts. Always-on is $7/mo. | None on paid, severe on free | Frankfurt | Low. Similar to Railway. The free tier is not usable for a real business site. |
| **Fly.io** | ~$3–5/mo for a shared-CPU machine | None once warm; machines can auto-stop if configured | Dublin region available, so it can sit essentially next to the database | Medium. Requires a Dockerfile and `fly.toml`, and you manage machine sizing and scaling yourself. |
| **Container elsewhere** (DigitalOcean App Platform, AWS Lightsail/ECS, Hetzner) | $5–15/mo depending | None | Full control | Highest. You own the build pipeline, TLS, health checks, log aggregation and updates. |

**If optimising for least operational work:** Railway. **If optimising for
cost and lowest database latency, and a Dockerfile is acceptable:** Fly.io in
Dublin. **Render's free tier should not be used** for anything customer-facing
here, because a 50-second cold start on the first visit of the day is worse
than most people expect.

Whichever is chosen, the API needs a persistent process, not a function
runtime, and the `start` script (`node dist/main.js`, from a real `tsc`
build) is already correct for that.

---

## ⚠️ Cookie domains: the thing most likely to break the first deploy

Admin login uses an httpOnly cookie with `sameSite: "lax"`
(`apps/api/src/auth/session-cookie.ts`).

`lax` only sends the cookie when the API and the site share a **registrable
domain**. Deploying to, say, `atelier.vercel.app` for the frontend and
`atelier.up.railway.app` for the API puts them on *different* registrable
domains, so **the browser will not send the session cookie and admin login
will silently fail**, even though every request individually looks correct.

Two ways to resolve it, and the choice should be made before first deploy:

1. **Preferred — share an apex domain.** Serve the site from
   `atelierhaute.com` and the API from `api.atelierhaute.com`. `lax` then
   works unchanged and remains the safer setting.
2. **Otherwise — switch to `sameSite: "none"` with `secure: true`.** This
   permits cross-site cookies and requires HTTPS. It is a deliberate
   loosening and should be paired with a strict CORS origin allowlist, which
   `main.ts` already reads from `WEB_ORIGIN`.

This is called out here because it produces a confusing failure: everything
returns 200 except the admin area, which behaves as though the password is
wrong.

---

## Environment variables

### `apps/api`

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL_PUBLIC` | **Yes** | Pooled, `atelier_api_public`. Used by every unauthenticated path. The API will not start without it. |
| `DATABASE_URL_ADMIN` | **Yes** | Pooled, `atelier_api_admin`. Used by every guarded path. The API will not start without it. |
| `DATABASE_URL` | Yes | Pooled, `postgres` (holds BYPASSRLS). **No longer used by the running API.** Still used by seeds and `bootstrap-admin`. |
| `DIRECT_URL` | Yes | Direct connection, port 5432. Used by migrations only. Already set locally. |
| `PORT` | Host usually injects | Defaults to 4000. |
| `WEB_ORIGIN` | **Yes in production** | CORS allowlist. Defaults to `http://localhost:3000`, which is wrong in production and will block the real frontend. |
| `NODE_ENV` | **Yes in production** | Must be `production`, otherwise the session cookie is issued without the `secure` flag. |

### `apps/web`

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes in production** | Browser-visible; used by the appointment and enquiry forms. Falls back to `http://localhost:4000`, which will fail in production. |
| `API_URL` | **Yes in production** | Server-side only; used for shop settings and FAQ fetches during rendering. Same fallback problem. |

### One-time, not runtime

| Variable | Notes |
|---|---|
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` | Only needed to create the first admin. Already done. Do not set these permanently in production. |

### Not yet needed

`OLLAMA_API_KEY` (the AI concierge is unbuilt) and any Paystack keys
(payments are blocked on pricing decisions). `.env` currently contains several
third-party keys unrelated to anything built; **none of them should be copied
into a production environment** just because they exist locally.

---

## Scoped database roles — ADOPTED 2026-08-03

The two-role split described below is **implemented and in use**. Both roles
exist, neither holds BYPASSRLS, and `apps/api` refuses to start without both
connection strings. What follows is kept as reference for recreating them.


Role creation is deliberately not a migration file: migrations are committed
to git and these statements contain passwords. The **grants and policies**
that go with them *are* in migrations
(`20260803000000_enable_rls` and `20260803010000_scoped_role_policies`), so
only the two `CREATE ROLE` lines need running by hand.

Two gotchas worth knowing if you ever recreate these:

- Supabase's pooler expects the username as `<role>.<project-ref>`, not the
  bare role name.
- Generate passwords as hex (`openssl rand -hex 24`). A base64 password can
  contain `/`, `+` or `=`, which break URL parsing unless percent-encoded.

```sql
-- Public-surface role: exactly what an anonymous visitor's request needs.
CREATE ROLE atelier_api_public LOGIN PASSWORD 'choose-a-strong-password';
GRANT USAGE ON SCHEMA public TO atelier_api_public;
GRANT SELECT ON "ShopSettings", "Faq" TO atelier_api_public;
GRANT INSERT ON "Appointment", "Enquiry" TO atelier_api_public;

-- Admin-surface role: the authenticated dashboard's needs.
CREATE ROLE atelier_api_admin LOGIN PASSWORD 'choose-a-different-strong-password';
GRANT USAGE ON SCHEMA public TO atelier_api_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "ShopSettings", "Faq", "Appointment", "Enquiry" TO atelier_api_admin;
GRANT SELECT, UPDATE ON "Admin" TO atelier_api_admin;
GRANT SELECT, INSERT, DELETE ON "AdminSession" TO atelier_api_admin;

-- Neither role gets BYPASSRLS, so the policies added in
-- 20260803000000_enable_rls actually apply to both.
```

Adopting this also requires `PrismaService` to hold two clients and select
between them per request, which is an application change, not just
configuration.

---

## Pre-deploy checklist

Ordered. Items above the line are genuine blockers.

- [ ] **Decide the domain strategy** and resolve the cookie issue above.
- [ ] **Set `WEB_ORIGIN`, `NODE_ENV=production`, `NEXT_PUBLIC_API_URL` and
      `API_URL`.** Every one of these has a localhost default that fails
      quietly rather than loudly.
- [ ] **Build an admin dashboard.** Until one exists, the business cannot
      read an appointment or reply to an enquiry without `curl`. Submissions
      accumulate with no way to act on them.
- [ ] **Confirm the real shop details** (address, opening hours, phone,
      email, pricing note, deposit percentage). These are deliberately empty
      in the database and the site is honest about it, but a public launch
      with no address or opening hours is a business decision, not a bug.
- [ ] Run `prisma migrate deploy` against production as part of the deploy.

Below the line, not blocking:

- [ ] Replace placeholder imagery with real photography (checklist in
      `logs/decisions.md`).
- [x] ~~Adopt the scoped database roles above.~~ Done 2026-08-03.
- [ ] Decide whether appointment/enquiry submissions should trigger a
      notification, and by what channel. Nothing notifies anyone today.
- [ ] Add automated tests. `AGENTS.md` asks for Vitest and Playwright; there
      are currently none, and every verification to date has been manual.

## Explicitly still blocked, by decision not by engineering

- **Payments and checkout.** No pricing or deposit policy exists, so there is
  nothing to charge. Paystack integration stays unbuilt.
- **Published turnaround times.** Unconfirmed, and the FAQ says so honestly.
- **The AI concierge.** Permitted provider is fixed (Ollama Cloud) but the
  feature is unbuilt and unscoped.

---

## Backups — actual situation, 2026-08-05

Checked against Supabase's published policy rather than assumed. **The answer
depends entirely on which plan this project is on, which needs a look at the
dashboard — this session has no access to it.**

| Plan | Automatic daily backups | Retention |
|---|---|---|
| **Free** | **None.** Supabase's own guidance is that free projects "regularly export their data using the Supabase CLI `db dump` command and maintain off-site backups" | — |
| Pro | Yes | last 7 days |
| Team | Yes | last 14 days |
| Enterprise | Yes | up to 30 days |

Point-in-time recovery is **not included on any tier**. It is a paid add-on for
Pro/Team/Enterprise: roughly **$100/mo for 7 days**, $200/mo for 14, $400/mo
for 28 — and it additionally requires at least a Small compute add-on. For a
database currently holding twelve rows of real content, PITR is not
proportionate and is **not recommended yet**.

**→ Action: check Settings → Subscription in the Supabase dashboard.** If it
says Free, there are no backups at all and the section below is not optional.

### If the project is on Free: the manual path, tested

A `pg_dump` was run against this database on 2026-08-05 and **it works**:

```
pg_dump "$DIRECT_URL" --no-owner --no-acl -f backup.sql
```

- Exit 0, **192 KB**, 44 tables, all `COPY` data blocks present, `Garment`
  included. Local `pg_dump` is 18.3 and had no version objection.
- The whole database is **11 MB**, so a dump is trivially cheap to take and
  store. There is no scale argument for putting this off.
- Use `DIRECT_URL` (session mode, 5432), not the 6543 pooler.

To automate it, the smallest thing that works is a scheduled GitHub Actions
job on a cron running that command and uploading the artefact, with
`DIRECT_URL` as a repository secret. That is a genuine credential in CI, which
is why the existing `ci.yml` deliberately uses a fake one — a backup workflow
should be a **separate** workflow with its own secret, not an extra step in
the build.

**Not built.** No backup automation exists in this repo today.

### What a dump contains — handle it accordingly

The dump includes the `Admin` table (bcrypt password hash) and `AdminSession`
rows. It is a credential-bearing artefact: it must not be committed, attached
to an issue, or stored anywhere the source is not already trusted. The test
dump taken today was written to a temporary scratch directory and deleted.
