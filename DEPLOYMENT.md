# Deployment guide — Vercel (site) + Render (API)

Practical, repo-specific. For the reasoning behind the choices see
`docs/deployment.md`; this file is the one to follow while clicking buttons.

> **Note:** the API host changed from Railway to **Render**. `railway.json` is
> still in the repo and is now unused — delete it once Render is working, or
> keep it as a fallback, but do not configure both.

| Piece | Host | What it is |
|---|---|---|
| `apps/web` | Vercel | Customer site **and** the admin dashboard at `/admin` |
| `apps/api` | Render | NestJS API |

The admin dashboard is **not** a separate deployment. It ships inside the
Next.js app.

---

## Facts about this repo that break naive deploys

Read these first — most first-deploy failures here are one of them.

1. **`generated/prisma` is gitignored and untracked.** `apps/api` imports it,
   so a fresh clone cannot compile until `prisma generate` runs. It is wired
   into the `apps/api` build script, so it happens automatically — but only
   if the build actually runs that script.
2. **`prisma generate` hard-fails without `DIRECT_URL`.** It resolves the
   variable through `prisma.config.ts` and throws `PrismaConfigEnvError` if it
   is absent. It never opens a connection, so any syntactically valid URL
   satisfies it. **This is why `DIRECT_URL` is required on Render at build
   time** — and why it must NOT be added to Vercel (see below).
3. **`apps/web` never imports Prisma.** Vercel therefore needs no database
   credentials at all. If a guide tells you to add `DATABASE_URL` to Vercel,
   it is wrong for this repo.
4. **pnpm is pinned to 11.17.0** via `packageManager`, with lockfile v9.0.
   Both hosts need corepack to honour that.
5. **The app is written to survive an unreachable API.** Every fetcher returns
   an empty fallback instead of throwing, so a build can **succeed** while the
   site shows no contact details, no FAQs and an empty catalogue. A green
   build is not proof the env vars are right.
6. **Turborepo runs tasks in a strict environment.** A variable set on the
   host is invisible to a task unless it is declared in `turbo.json`'s `env`.
   Vercel reports this as *"set on your Vercel project, but missing from
   turbo.json … WILL NOT be available"*. If `DIRECT_URL` is stripped this way,
   the API build dies at `prisma generate` even though the variable is
   correctly set. `turbo.json` now declares the build-time inputs. Runtime
   secrets are deliberately **not** declared — see the comment in that file.

---

## Vercel — the site

### Recommended: Root Directory = `apps/web`

This is the path with the least friction, because Vercel auto-detects Next.js
and handles the pnpm workspace itself.

1. **New Project** → import the repo.
2. **Root Directory:** `apps/web`.
3. Leave **"Include files outside of the root directory"** ON. This is
   required — the lockfile, `pnpm-workspace.yaml` and the Prisma schema all
   live above `apps/web`.
4. Framework preset: **Next.js** (auto-detected). Leave build and install
   commands **empty** so Vercel uses its defaults.
5. Add the two environment variables below.

**If you use this path, delete the root `vercel.json`.** With Root Directory
set to `apps/web`, a root-level `vercel.json` is either ignored or fights
Vercel's own Next.js detection, and its `outputDirectory: apps/web/.next` is
wrong relative to that root. Having both is a common source of
"No Output Directory named .next found".

### Alternative: Root Directory = repository root

Only if the above does not suit you. Keep `vercel.json` as committed — it sets
the install command, the filtered build and `outputDirectory: apps/web/.next`.
Do not also set those in the dashboard; dashboard values override the file and
the two silently disagree.

### Vercel environment variables

Set for **Production, Preview and Development**.

| Variable | Value | Why |
|---|---|---|
| `API_URL` | `https://<your-api>.onrender.com` | Server-side fetches: shop settings, FAQs, catalogue |
| `NEXT_PUBLIC_API_URL` | same value | Browser fetches: appointment form, custom-request form, **and the entire admin dashboard** |

Both are needed. They are **not** interchangeable — same value, different
exposure. `API_URL` is server-only; `NEXT_PUBLIC_API_URL` is inlined into the
browser bundle.

> `NEXT_PUBLIC_*` is baked in **at build time**. Changing it in the dashboard
> does nothing until you redeploy.

**Do not add** `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_PUBLIC`,
`DATABASE_URL_ADMIN`, `RESEND_API_KEY` or `PAYSTACK_SECRET_KEY` to Vercel. The
site never reads them, and `PAYSTACK_SECRET_KEY` in the local `.env` is a
**live** key.

---

## Render — the API

`render.yaml` is committed, so **New → Blueprint** and point it at the repo.
It creates one web service with the right build and start commands and prompts
for each secret.

If you create the service manually instead:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm --filter @atelier-haute/api build` |
| Start command | `node apps/api/dist/main.js` |
| Health check path | `/health` |

### Render environment variables

| Variable | Required | Notes |
|---|---|---|
| `DIRECT_URL` | **Build** | Pooler **:5432** (session mode). Without it the build dies at `prisma generate` |
| `DATABASE_URL_PUBLIC` | **Runtime** | Pooler **:6543**, role `atelier_api_public`. **Process refuses to boot without it** |
| `DATABASE_URL_ADMIN` | **Runtime** | Pooler **:6543**, role `atelier_api_admin`. **Refuses to boot without it** |
| `NODE_ENV` | Yes | `production`, or the session cookie ships without `Secure` |
| `WEB_ORIGIN` | Yes | Exact site origin. Wrong value = every browser call blocked by CORS |
| `NODE_VERSION` | Yes | `22` |
| `RESEND_API_KEY` | Email | Already held |
| `NOTIFICATION_EMAIL` | Email | Currently unset — **nothing is emailed without it** |
| `NOTIFICATION_FROM` | Email | Needs a Resend-verified domain |
| `PORT` | **No** | Render injects it. `main.ts` reads it and binds `0.0.0.0` |

> **Render free tier sleeps after inactivity.** The first request after idle
> takes ~50s to wake. The site degrades honestly rather than erroring — but
> contact details and the catalogue will look empty on that first hit. If that
> matters, use a paid instance.

---

## Order of operations

Deploy the **API first**. The site's build fetches the catalogue, so deploying
Vercel first means building against nothing.

1. Deploy Render, wait for green, confirm `https://<api>/health` responds.
2. Set `API_URL` and `NEXT_PUBLIC_API_URL` on Vercel to that URL.
3. Deploy Vercel.
4. Set `WEB_ORIGIN` on Render to the Vercel URL. **Redeploy Render** so CORS
   picks it up.
5. Redeploy Vercel if you changed `NEXT_PUBLIC_API_URL` after the first build.

Steps 4 and 5 are the ones people skip, and they produce a site that looks
deployed but cannot talk to its own API.

---

## Cookie warning — this decides whether admin login works

The session cookie is `SameSite=Lax`, which requires the site and API to share
a **registrable domain**.

- `yourdomain.com` + `api.yourdomain.com` → **same-site, works.**
- `yoursite.vercel.app` + `yourapi.onrender.com` → **different sites. The
  browser silently drops the session cookie and admin login will not persist,
  no matter how correct the credentials are.**

So on the default platform domains, **the public site works fine but the admin
dashboard cannot hold a login.** That is expected, not a bug. Fixes, in order
of preference:

1. Put both on one domain: site at `yourdomain.com`, API at
   `api.yourdomain.com`. Nothing in the code changes.
2. Only if that is impossible: switch to `sameSite: "none"` with `secure: true`
   in `apps/api/src/auth/session-cookie.ts`. This permits cross-site cookies
   and is a deliberate security downgrade.

Admin login also will not persist on **Vercel preview URLs**, for the same
reason. Test admin on the real domain only.

---

## Failure → cause

| Symptom | Cause |
|---|---|
| `Cannot find module '../../../../generated/prisma/client'` **plus a run of `TS7006 implicitly has an 'any' type`** | One root cause, not many: `prisma generate` did not run. Every implicit-any error is downstream of the unresolved import. Fixing the generate clears all of them |
| `schema.prisma: file not found` during generate | The generate ran with the wrong working directory. Use `pnpm exec prisma generate` (repo root), **never** `pnpm --filter @atelier-haute/api exec prisma generate` — filtering sets cwd to `apps/api`, which has no `prisma.config.ts` and no schema |
| `PrismaConfigEnvError: Cannot resolve environment variable: DIRECT_URL` | Either `DIRECT_URL` is not set on the host, **or** it is set but not declared in `turbo.json` `env` so Turborepo stripped it |
| Turbo warns *"set on your Vercel project, but missing from turbo.json"* for `@atelier-haute/api#build` | **Vercel is building the API, which it should not be.** Set Root Directory to `apps/web`. The warning also means those vars were stripped from the build |
| `No Output Directory named ".next" found` | Root Directory and `vercel.json` disagree. Pick one of the two Vercel paths above, not both |
| `ERR_PNPM_OUTDATED_LOCKFILE` | Lockfile out of date. Run `pnpm install` locally and commit `pnpm-lock.yaml` |
| Unsupported/oldpnpm version | Corepack not honouring `packageManager`. Set `ENABLE_EXPERIMENTAL_COREPACK=1` on Vercel; Render uses `corepack enable` in the build command |
| Build green, but site shows no contact details, empty FAQ/catalogue | `API_URL` missing or wrong on Vercel — fetchers fell back to empty |
| Forms fail, console shows CORS | `WEB_ORIGIN` on Render does not exactly match the site origin, **or** Render was not redeployed after setting it |
| Admin login works then instantly logs out | Cross-site cookie. See the cookie warning above |
| API 502 / never becomes healthy | Free instance still waking, or the process failed to boot on a missing `DATABASE_URL_PUBLIC`/`_ADMIN` — check logs for the explicit error |
| `P1001 Can't reach database server` | Often **intermittent**, not an outage. Retry before investigating — see `logs/decisions.md`, 2026-08-05 |

---

## Post-deploy checks

- [ ] `https://<api>/health` responds
- [ ] `/contact` shows address, hours, phone, email
- [ ] `/faq` lists five questions
- [ ] `/catalogue/suits` shows three garments
- [ ] Appointment form submits, no CORS error in console
- [ ] Admin login **survives a page reload** (the cookie check that matters)
- [ ] DevTools → Cookies: `admin_session` has `HttpOnly` **and** `Secure`
- [ ] Delete any test rows you created
