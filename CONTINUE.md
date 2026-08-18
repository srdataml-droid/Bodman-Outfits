# CONTINUE — pick up here

Written 2026-08-17. Read this first. It is the state of the world and the
ordered list of what is worth doing next, with the reason for each, so that
nothing here has to be rediscovered.

---

## Where things stand

| Piece | Where | State |
|---|---|---|
| `apps/web` | Vercel `bodman-outfits-web` | **live and green**, auto-deploys from `main` |
| `apps/api` | Render | **live**, `/api/health` returns ok, free tier (spins down) |
| Database | Supabase `dad's business`, eu-west-1, Postgres 17 | **ACTIVE_HEALTHY**, 10 migrations applied |
| Repo | `srdataml-droid/Bodman-Outfits`, public | `main` at the PR #1 merge |

### Done since (2026-08-17, later)

- **Customer notifications.** Submissions now confirm to the customer as well
  as alerting the shop, and an order moving to `ready` emails "your garment is
  ready" - on the transition only, so editing a note does not re-send.
- **Order contact fixed.** The admin screen used to write a customer's *email
  address into the phone column* when a custom request carried no number, which
  also left the order with nowhere to send that ready notice. Both fields are
  now optional individually and jointly required.
- **A tab icon.** There was none; `/favicon.ico` 404'd.
- **Migration applied to production.** `customerEmail` added, `customerPhone`
  made nullable, recorded in `_prisma_migrations` with the checksum Prisma
  computes so `migrate deploy` sees it as applied rather than pending.
- **`railway.json` deleted** and the `logs/` records committed.

### Done 2026-08-18

- **Commissioning is reachable and sortable.** `/custom-request` was in
  neither the nav nor the footer; it is now "Commission" in the main nav.
  The form asks the two questions a tailor asks first - `occasion`, and
  `neededBy` as a real DATE rather than a sentence inside the description.
- **And the admin can actually see them.** The commit that added those two
  fields wrote them, emailed them, and then dropped both on the read path -
  `Row` and `toDto` in the API service never mentioned them, so the review
  queue could not show a deadline it had just been told to sort by. Fixed:
  the API returns both, the queue has a "Needed by" column, the detail panel
  shows both, and accepting a request into a draft order leads the note with
  the deadline and occasion, because `Order` has no date field of its own.

`neededBy` is sent as a date-only `YYYY-MM-DD` string, not an ISO timestamp.
The column is `@db.Date`, and a timestamp renders as the previous day for any
admin west of UTC. `Appointment.preferredDate` already does it this way; match
it rather than inventing a second convention.

**Still open on this**: the queue is ordered oldest-first by *arrival*, which
is what the review-queue design says, and it now displays a deadline it cannot
sort by. Deliberately not built - sorting an empty queue is guesswork, and the
right default (arrival or deadline) is a question for the shop once real
requests exist.

Applied through the Supabase connector rather than `prisma migrate deploy`,
because this sandbox cannot reach port 5432 - `P1001` on the pooler. The
checksum method was validated first by reproducing an already-applied
migration's recorded hash, so Prisma's history is consistent rather than
merely populated. Verified after: both columns present with the expected
nullability, `atelier_api_admin` holds SELECT/INSERT/UPDATE on both, the API
answers `{"status":"ok"}`, and `/api/garments` returns 200.

PR #1 merged earlier carried three commits:

- `31d14c2` **your Render health-check fix**, which had been stranded unpushed
  on local `main` — `render.yaml` now says `healthCheckPath: /api/health`
- `0509251` 24 real garment images, and a mobile menu
- `978f53a` the 320px header overflow that the mobile menu work introduced

### Done 2026-08-18, later

- **A script tab icon.** The Fraunces italic B is now a roundhand capital B
  from Great Vibes (OFL), matched against a reference the shop supplied. Five
  OFL scripts were rendered against it; a mathematical script from STIX was
  tried first and rejected as too upright. It carries a 0.6 stroke in the same
  off-white as the fill - roundhand hairlines fall below one device pixel at
  16px and drop out, and the stroke is what keeps the letter whole. Tuned by
  rendering at true 16px, not by eye at display size.
- **Admin tap targets, and a margin bug found while verifying them.** Every
  admin control is 44px now, matching the `min-h-11` the public site already
  used everywhere. The Garments screen was also the one place that forgot
  `Panel` supplies no padding: its rows had no horizontal padding at all and
  its loading and empty states were bare `<p>`s rather than `Notice`. Both
  fixed, re-measured at 390px against a production build.
- **agbada and kaftan: the open question was based on a stale doc.** Their
  prices were never unconfirmed - they sit on the category in
  `apps/web/lib/garments.ts`, ₦70,000 and ₦25,000. See item 3 below.

### Appointment now requires an email, not a phone — CODE DONE, **MIGRATION NOT APPLIED**

Requested 2026-08-18. `Appointment` was the only one of the three request
types keyed on a phone number; `Enquiry` and `CustomRequest` both already
required an email and left the phone optional. It is now consistent with them.

Changed: `prisma/schema.prisma`, `appointments.schema.ts`,
`appointments.service.ts`, `apps/web/lib/appointments.ts`,
`apps/web/lib/admin-api.ts`, `appointment-form.tsx`, and the admin
appointments screen, where the `tel:` link needed the null guard the
enquiries screen already had. Both apps typecheck clean, and the form was
driven in a real browser: email `required`, phone not, labelled
"PHONE (optional)".

**Read this before deploying.** The migration
`20260818110000_appointment_email_required` is written and committed but has
**deliberately not been applied**, because the order is load-bearing:

1. **Deploy the code first.** Render auto-deploys the API from `main`.
2. **Then apply the migration.**

Backwards, and the live appointment form breaks: the currently deployed API
still treats email as optional, so the moment `email` is `NOT NULL` any
submission without one is a NOT NULL violation and a 500 on a public form.
`phone DROP NOT NULL` is safe in either order; `email SET NOT NULL` is not.

Note that **the deploy pipeline does not run migrations** - `render.yaml`
runs `prisma generate`, never `prisma migrate deploy` - so this will not
happen on its own and there is no automation to race.

Apply it through the Supabase connector, as with the last two: this sandbox
cannot reach port 5432 (`P1001` on the pooler). The checksum to record in
`_prisma_migrations` is a plain SHA-256 of `migration.sql`, re-validated
today by reproducing both recent migrations' recorded hashes exactly:

```
12c14a53b9df113735c5d16eceed29bfe63f993baeb3c9adad715a01bca8e0c0
```

`Appointment` held **zero rows** when this was written, so `SET NOT NULL`
cannot fail on existing data. Re-check that before applying - a single NULL
email aborts the whole migration.

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

### 3. Named pieces in the catalogue — ✅ PREMISE WAS STALE (2026-08-18)

This entry asked for a decision about agbada and kaftan on the grounds that
their prices were unconfirmed. They are not, and they never were: the prices
sit on the **category**, in `apps/web/lib/garments.ts` — agbada from ₦70,000
per item, kaftan from ₦25,000 — and every category page already shows its
figure.

The entry was also out of date on imagery. It named
`agbada-{flat,on-form}.png`, but those were deleted when the catalogue was
emptied of AI-generated pieces. Only the ten `category-*` images remain.

So agbada and kaftan are not a special case. `GARMENT_SEED_DATA` is an
**empty array** and *no* category has a named garment. What is missing is real
product — a name, a description, real photography — for any category at all.
That is a shop input, not a code task, and it goes in through the admin
Garments screen rather than the seed. The category pages remain honest and
priced in the meantime.

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

**A file can serve 200, with the right content type, and still be broken.**
The first tab icon documented itself in an XML comment naming the CSS custom
properties. A property name contains a double hyphen, which is illegal inside
an XML comment, so the SVG was unparseable - and it still served 200 as
`image/svg+xml` with all three `<link rel="icon">` tags present. It rendered
nothing. Only opening it in a browser caught it. Keep notes in `<desc>`.

**Kill the server before rebuilding - it happened twice.** The second time a
`next start` had been running 5.6 hours, serving a build from before the icon
existed, which is why three checks reported 404 on a file that was right
there.
