# CONTINUE — pick up here

Written 2026-08-17. Read this first. It is the state of the world and the
ordered list of what is worth doing next, with the reason for each, so that
nothing here has to be rediscovered.

---

## Where things stand

| Piece | Where | State |
|---|---|---|
| `apps/web` | Vercel `bodman-outfits-web` | **live and green**, auto-deploys from `main` |
| `apps/api` | Render | config fixed but **unverified** — see task 1 |
| Database | Supabase `dad's business`, eu-west-1, Postgres 17 | **ACTIVE_HEALTHY** as of 11:5x today |
| Repo | `srdataml-droid/Bodman-Outfits`, public | `main` at the PR #1 merge |

PR #1 merged today carried three commits:

- `31d14c2` **your Render health-check fix**, which had been stranded unpushed
  on local `main` — `render.yaml` now says `healthCheckPath: /api/health`
- `0509251` 24 real garment images, and a mobile menu
- `978f53a` the 320px header overflow that the mobile menu work introduced

---

## Next, in order

### 1. Connect Render — ✅ THE API IS UP (verified 2026-08-17, indirectly)

Still not connected over MCP, but the question it existed to answer is
**settled**: `https://bodman-outfits-web.vercel.app/catalogue/suits/navy-two-piece`
returns **200 with real garment data**. That page is API-backed, so the Render
service is answering and `31d14c2`'s `/api/health` fix is doing its job.

Connect it anyway when convenient (`/mcp` → **claude.ai Render**) to check the
env-var questions below, which cannot be answered from outside.

Then confirm, in this order, because each answer changes the next question:

- does the service report live, and did the last deploy succeed?
- is `DIRECT_URL` set **on Render**? `DEPLOYMENT.md` says it is required at
  build time, because Prisma needs a direct connection for `generate`
- is `DIRECT_URL` **absent from Vercel**? The same doc is explicit that adding
  it there is wrong, and Vercel reports it as "set on your Vercel project but
  missing from…"
- does `https://<api>/api/health` answer 200? That is the whole point of
  `31d14c2`, and it has never been observed passing

### 2. Seed and verify — ✅ DONE (2026-08-17)

The database was **already migrated and seeded**: 9 migrations, 5 garments,
5 FAQs, shop settings, 1 admin. Nothing needed running. The local 404s were
only ever a missing local API.

All ten `imageFlat`/`imageOnForm` paths in `Garment` match the installed files
exactly, and the whole thing was verified on **production**: the garment page
renders real photography, both images load at 546x728, and the flat-to-on-form
crossfade works on hover — the first time it has had anything but two identical
grey placeholders to swap between.

~~Original task below, kept for context.~~

The garment detail pages (`/catalogue/suits/navy-two-piece` and the other
four) **404 without a database** — they are API-backed. This was the one thing
today's image work could not verify: the category cards render from code, so
those were confirmed visually, but the per-garment flat/on-form pair was not.

Supabase is healthy now, so: point `DATABASE_URL`/`DIRECT_URL` at it, run
`prisma migrate deploy` then `prisma/seed.ts`, and open a garment page. What
to look for is the hover crossfade — flat cloth resolving into the garment on
a form. Both images are now real; before today both were grey placeholders and
the effect had nothing to show.

### 3. Decide about agbada and kaftan

They now have real imagery (`agbada-{flat,on-form}.png`,
`kaftan-{flat,on-form}.png`) and **no garment rows in `prisma/seed.ts`**. They
exist only as categories.

This is a judgement call, not an oversight, and the seed file says why:

> the five confirmed prices are per category, and a per-garment figure would be
> an invented fact

Adding rows means writing product copy — a name, a description, alt text — for
garments nobody has confirmed exist. Either get the real details from the shop
and add them, or leave the categories imageless-but-honest. Do not invent them.

### 4. Security: Supabase flagged RLS disabled on one table

`public._prisma_migrations` has Row Level Security **disabled**, so anyone with
the anon key can read or modify it. Every application table already has RLS on.

Supabase's own advice is not to blind-fix it, because enabling RLS with no
policy blocks all access — and Prisma needs that table to apply migrations. The
SQL, for you to decide on:

```sql
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
```

Worth checking first whether the anon key is exposed to the browser at all —
`apps/web` never imports Prisma and talks only to the API, so the practical
exposure may be nil.

### 5. Housekeeping that is already decided, just not done

- **Delete the duplicate Vercel project** `bodman-outfits-web-gkny`. It was
  created six minutes after the real one and builds **every push twice** — both
  projects ran on PR #1. Vercel dashboard; I have no delete permission.
- **Delete `railway.json`.** `DEPLOYMENT.md` already says: *"still in the repo
  and is now unused — delete it once Render is working"*. Task 1 settles that.
- **Commit `logs/decisions.md` and `logs/project-status.md`.** They carry the
  record of the deployment-debugging session and are still uncommitted. They
  were deliberately left out of PR #1, which was scoped to imagery and nav.

### 6. Loose ends worth a look, none urgent

- Five garments still have placeholder images (`tailored-blazer`, `oxford-` and
  `linen-shirt`, `flat-front-trouser`, `relaxed-chino`, `weekend-overshirt`).
  Nothing references them — they are not seeded — so they are dormant, not
  broken. `process-images.zip` has no renders for them.
- `category-casual-flat.png` / `-on-form.png` are dead files. The code uses
  `category-casuals-*` (plural). Safe to delete.
- Preview deploys sit behind Vercel SSO, so a preview URL cannot be shared with
  anyone without a Vercel account. Fine as a default; worth knowing before you
  try to show a client.

---

## Things learned today that will otherwise be rediscovered painfully

**Kill the dev server before `next build`.** Running a build while a server
serves from `.next` produced a **21-byte stylesheet** — a completely unstyled
site. Half an hour went into "why is `md:hidden` broken" before the cause was
found, and the answer was that the page under test had no CSS at all. Every
measurement taken during that window was meaningless.

**`StaggerText` is not broken.** Under `next dev` in headless Chrome its word
spans sit at `opacity: 0` past its own 3-second failsafe, which looks exactly
like a bug. It is the dev server's HMR websocket failing to connect, so React
never hydrates. In a production build it renders correctly. Do not "fix" it.

**The header is sized by a database value.** `shopName` comes from
`getShopName()`, so any fixed width or `whitespace-nowrap` on the logo is one
long shop name away from overflowing. That is why it now carries `min-w-0` and
only refuses to wrap from `sm` up.

**Verify responsive work at 320px, not just 390.** The overflow this session
introduced was invisible at 390 and 42px at 320.
