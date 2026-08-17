# Production readiness — what is measured, and what to do about it

Compiled 2026-08-17, after connecting Render and measuring the live stack.
Everything below has a number behind it. Where something is a judgement rather
than a measurement, it says so.

---

## What is already right

Worth stating, so effort does not go where it is not needed.

- **The API is up and the health check works.** `/api/health` returns
  `{"status":"ok"}`. Latest Render deploy `live`, auto-deploying from `main`,
  builds in about 90 seconds. Three deploys today, all green.
- **The admin is properly protected.** `AdminAuthGuard` validates a session
  cookie server-side and throws `UnauthorizedException`. An unauthenticated
  request to `/admin/garments` leaks **no** garment data — the page renders a
  shell and the API refuses.
- **No horizontal overflow anywhere**, public or admin, at 320/360/390/414/768/
  1280px.
- **The database is fine.** 9 migrations applied, seeded, and all ten garment
  image paths match the files on disk.
- **The reveal animations already have a no-JavaScript fallback** — an inline
  rule forcing `[data-reveal]` and `[data-stagger-word]` to `opacity: 1`.

---

## Tier 1 — it is not production until these are done

### 1. The first visitor waits twelve seconds

Measured against the live service:

| state | total | connect |
|---|---|---|
| cold | **12.36s** | 11.45s |
| waking | 7.19s, 7.02s | ~6.4s |
| warm | **0.73s** (`/api/health`) | 0.18s |
| warm + DB | 0.91–1.64s (`/api/garments`) | |

Controls, taken at the same moment so this is not a slow-network artifact:
`vercel.com` 0.15s connect, `api.github.com` 0.55s. The network is fine. This
is Render's free tier spinning down after roughly fifteen minutes idle.

**Why it is the top item:** customers arrive from a WhatsApp link, hours apart.
Every one of those arrivals is a cold start by definition. Twelve seconds is
past the point where people leave.

**Fix:** Render Starter, $7/month. Nothing else on this page matters while this
is true.

**On the keep-warm ping** — worth being clear-eyed. A cron hitting
`/api/health` every ten minutes does keep the instance up, but it is a patch,
not a fix: it burns the 750 free instance-hours faster, Render's terms
discourage it, and it does nothing for the first request after a deploy. Use it
as a stopgap while deciding on the paid tier, not instead of it.

### 2. The geography is backwards

- API: Render **Oregon** (`gcp-us-west1`)
- Database: Supabase **eu-west-1** (Ireland)
- Customers: **Lagos**

Every garment query goes Lagos → Oregon → Ireland → Oregon → Lagos. The warm
gap between `/api/health` (0.73s, no database) and `/api/garments`
(0.91–1.64s) is that Atlantic crossing, paid on every request that touches
data.

**Fix:** move the Render service to **Frankfurt** — nearest to both the
database and Lagos. This is a service recreation rather than a setting, so it
needs a maintenance window and a re-check of environment variables.

---

## Tier 2 — robustness

### 3. Nothing tells the user the system is waking up

The admin gate renders **"Checking session…"** while it waits. On a cold
instance that is twelve seconds of a message that implies everything is fine.
The customer-facing fetches have timeouts (5s server-side, 10s browser-side,
per `logs/decisions.md`) and fall back rather than throw — good — but the
fallback should say something true. "Still waking up, one moment" is honest;
an indefinite spinner is not.

### 4. Admin tap targets are below the minimum

Measured at 390px on `/admin`:

| control | size |
|---|---|
| Garments, FAQs, Shop settings, Account (nav links) | **32px tall** |
| Log out | **36px tall** |

44px is the smallest a fingertip reliably hits, and it is the number the public
site's own mobile menu was built to. Width is fine; only height is short. This
is a small change to the admin nav's padding and a genuinely quick win, because
order management is the thing most likely to be done from a phone.

### 5. Environment variables are unverified

`DEPLOYMENT.md` is specific: `DIRECT_URL` must be **on Render** (Prisma needs a
direct connection at build time) and must **not** be on Vercel. Neither has
been confirmed — the Render MCP exposes environment-variable *writing* but not
reading, so this needs the dashboard or a deliberate write.

### 6. Failure has no owner

`notifyOnFail: default`, and there is no uptime monitor. A deploy that fails at
2am is currently discovered by a customer.

---

## Tier 3 — the product

### 7. agbada and kaftan

Real imagery, no garment rows. The seed file's reasoning stands: adding rows
means inventing product copy and prices nobody has confirmed. Get the real
details from the shop, or leave the categories honest.

### 8. A copy pass

Headings, the FAQ, and every empty and error state. The site should read like
a Lagos tailor wrote it, not a template.

### 9. Delete the duplicate Vercel project

`bodman-outfits-web-gkny` builds on **every push**, alongside the real project.
Both ran on PR #1.

---

## Order I would take these in

1. Paid Render tier — everything else is cosmetic beside a 12-second cold start
2. Admin tap targets — smallest change, real daily benefit
3. Honest waking-up states
4. Frankfurt move — bigger change, needs a window
5. Environment-variable verification
6. Monitoring with a named owner
7. Product work: agbada/kaftan, copy, the duplicate project
