# Shop details rollout — bug fix + confirmed business facts

Created 2026-08-04. Working checklist for two linked pieces of work: fixing
the reported "saved settings don't show on the site" bug, and publishing the
business facts confirmed by the owner on 2026-08-04.

**"Verified" in this document means confirmed in the rendered page output, not
confirmed in the database.** A database row proves storage, not display —
that distinction is the whole reason the original bug went unnoticed.

---

## The bug, and what actually caused it

**Reported symptom:** WhatsApp, email and address were entered in
`/admin/shop-settings`, but the live site still showed blank or placeholder
text, and the contact page omitted hours entirely "as if nothing was saved".

**What the data layer actually shows.** A direct read of `ShopSettings`
(via the pooler, as `atelier_api_admin`) proves the admin write worked:

| Field | Stored value |
|---|---|
| `phone` | `+2348023770833` |
| `whatsappNumber` | `+2348023770833` |
| `email` | `labodman03@gmail.com` |
| `address` | `No. 3 Oduselu Street, off Johnson bus stop, along Ijesha Road, Surulere` |
| `hoursWeekday` / `hoursSaturday` / `hoursSunday` | empty |
| `pricingNote` | empty |
| `depositPercentage` | `0` |
| `updatedAt` | `2026-08-04 17:56:41` |

So the admin `PUT` persisted correctly. `updatedAt` is recent. **Nothing is
wrong with the write path, `adminDb`, or the column-level grants.**

**Root cause: the fields were never wired into the public UI.** None of the
three named fields is read by any public page. Counting consumption across
`apps/web/app`, `apps/web/components` and `apps/web/lib`, excluding the admin
route group and `admin-api.ts`:

| Field | Public consumers |
|---|---|
| `phone` | 0 |
| `address` | 0 |
| `hoursWeekday` / `hoursSaturday` / `hoursSunday` | 0 |
| `email` | 0 |
| `pricingNote` | 0 |
| `depositPercentage` | 0 |
| `cityCountry` | 0 |
| `whatsappNumber` | link only, via `getWhatsAppLink` — never shown as text |
| `shopName`, `tagline` | rendered (header/footer) |

The contact page's "Visit the Studio" card is **hardcoded prose**
(`apps/web/app/contact/page.tsx:73`):

> "Our Lagos studio address and visiting hours are still being finalized."

That sentence is static JSX. It would have said the same thing regardless of
what was saved in the admin app, forever.

**Each hypothesis in the bug report, tested:**

- *Is the admin PUT writing to `adminDb` and persisting?* — Yes. Verified by
  direct read; `updatedAt` reflects the save.
- *Is the public page reading stale cache / wrong client / a `publicDb`
  column-grant problem?* — No. `getShopSettings()` uses `revalidate: 300`
  (5 minutes, not indefinite), and a grant failure would surface as a 500,
  not as blanks. The public read is fine; there is simply no code consuming
  these fields.
- *Build-time vs runtime mismatch / never revalidating?* — No. ISR is
  configured and would have picked the values up within 5 minutes if anything
  rendered them.

**Two symptoms, two different causes** — worth separating:

1. WhatsApp / email / address "blank" → **data is stored, UI never renders it.**
2. Hours section "missing" → **hours were genuinely never saved** (all three
   columns are empty). Not the same bug. Item 2 below fills them.

One real caching caveat that follows from the fix: because
`getShopSettings()` uses `revalidate: 300`, once the fields *are* wired up, a
save in the admin app still takes **up to 5 minutes** to appear on the public
site. That is by design, but it is not communicated anywhere, and would
readily be re-reported as this same bug. Noted under follow-ups.

---

## Checklist

### A. Wire the fields into the public UI (the actual bug fix)

- [x] A1. Replace the hardcoded "still being finalized" card on `/contact`
      with real address, hours, phone and email from `ShopSettings`
      — **verified**, card renders all four (D2)
- [x] A2. Card degrades honestly when a field is empty — omit the line, never
      print a blank label or an invented value — **verified** by blanking a
      field and re-rendering (D4)
- [x] A3. Surface `pricingNote` somewhere public (currently rendered nowhere)
      — added under the FAQ price list, **verified** rendered
- [x] A4. `apps/web` typechecks clean — **verified**, exit 0

### B. Fill the confirmed facts (data)

Owner-confirmed 2026-08-04. These are now real and may be published.

- [x] B1. `hoursWeekday` — `9am - 7pm`
- [x] B2. `hoursSaturday` `9am - 7pm` / `hoursSunday` `Closed`. The schema has
      three columns and the confirmed fact is a Mon–Sat range, so Saturday
      carries the same value rather than being folded into the weekday row.
- [x] B3. `depositPercentage` — `60`
- [x] B4. `pricingNote` — "Prices are negotiable depending on quantity."
- [x] B5. `address` — was stored truncated at "Surulere"; extended to the full
      confirmed string ending ", Lagos"
- [x] B6. `email` / `whatsappNumber` / `phone` — confirmed already stored and
      correct; not rewritten

### C. Remove placeholder language tied to *these* facts only

- [x] C1. `/contact` — "still being finalized" prose removed (same edit as A1)
      — **verified** absent from rendered page
- [x] C2. FAQ `deposit-and-payment` — states 60% before work starts,
      refundable. Applied to **both** the database row and `prisma/seed.ts`
      — **verified** rendered
- [x] C3. FAQ `alterations-policy` — states alterations after delivery are
      free. Applied to **both** the database row and `prisma/seed.ts`
      — **verified** rendered
- [x] C4. Audited. `/admin/shop-settings` marked eight fields `pending: true`
      with the hint "Not yet confirmed, blank on the live site". Those eight
      were **exactly** the now-confirmed set, so all eight flags were cleared
      and the three group notes rewritten to describe where each field is
      displayed. **No field was flagged that is still unconfirmed**, so
      nothing honest was cleared.

**Still genuinely unconfirmed after this pass:** nothing in `ShopSettings`.
Every column now holds a real value. `cityCountry` is real but rendered
nowhere (the address string now carries "Lagos" itself). Payment *methods*
remain unconfirmed and the FAQ deposit answer still deliberately names none.
The `pending` flag mechanism was kept in the admin screen for the next field
that needs it.

### D. Verification (rendered output, not the database)

- [x] D1. API serves the new values on `GET /api/shop-settings` — all twelve
      fields correct, and `GET /api/faqs` returns the new answers
- [x] D2. `/contact` renders address, all three hours rows, phone (`tel:`) and
      email (`mailto:`) — confirmed in fetched HTML
- [x] D3. `/faq` renders the updated deposit and alterations answers, plus the
      pricing note — confirmed in fetched HTML
- [x] D4. Blanked `hoursSunday` and `pricingNote`, waited out revalidation and
      re-fetched: the Sunday row and the pricing note disappeared entirely
      (no stranded labels), while Monday–Friday, Saturday, address and email
      still rendered. Both values then restored and the full render
      re-confirmed.

**A caching fact this verification proved, worth keeping:** after the database
was updated, `/faq` continued serving the previous copy while the API already
returned the new one. It caught up ~220s later, and the restore took ~300s.
That is `revalidate: 300` behaving exactly as configured, and it is precisely
what the original bug report would look like if the UI wiring had been fine.
A note now appears on the admin settings screen so a save that has not yet
appeared is not mistaken for a failed save.

---

## Follow-ups (not in scope unless asked)

- Admin saves take up to 5 minutes to appear publicly (`revalidate: 300`).
  Nothing tells the admin this. A note on the settings screen, or an
  on-save revalidation, would prevent this being re-reported as a bug.
- `prisma/seed.ts` upserts with `update: {}`, so it can create rows but never
  correct them. Any FAQ copy change must be applied to the database too —
  which is why C2 and C3 each say "both".
- The direct connection on port 5432 is unreachable; the pooler on 6543
  works. No migration can be applied until that is resolved. This work needs
  no migration, so it is not blocked.
