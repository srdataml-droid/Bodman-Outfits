# UI/UX

Purpose: Capture user journeys, information architecture, interaction patterns, accessibility requirements, visual-system decisions, and design references.

## Public Catalogue Page

Route: `/catalogue`

The initial catalogue is a static visual implementation based solely on the
approved Relume and Stitch design exports supplied at the repository root. It
uses the supplied editorial photography and local Fraunces/Spectral fonts. The
four categories are Native Wear, Formal Wear, Bridal, and Lounge Wear.

- Use Everglade `#1B3E2D` as the primary colour, Copper `#C8763A` for
  interactive accents, and white/`#F2F2F2` tonal surfaces.
- Headings use Fraunces at weight 500; body and labels use Spectral.
- Buttons have a 12px radius; cards and nested imagery have a 16px radius.
- Maintain a 120px desktop rhythm between major catalogue sections and a
  maximum content width of 1280px.
- Provide keyboard-visible focus states, descriptive image alternatives, and
  reduced-motion support.
- The category content is intentionally static for this visual pass. Replace
  it with database-managed catalogue data only when the catalogue API and
  Admin management workflow are implemented.

## Public Home Page

Route: `/`

The home page uses the approved Relume page structure and copy, rebuilt in the
shared Next.js visual system. It includes an editorial hero, a four-category
catalogue preview, the three-stage bespoke process, and an appointment CTA.

- The Relume lifestyle photography is intentionally not used because it does
  not depict tailoring and would misrepresent the service.
- Until Atelier Haute supplies original studio photography, the page reuses
  the approved Stitch garment photography. This is a known temporary
  placeholder-photography boundary, not final brand imagery.
- Category preview links lead to `/catalogue`; appointment CTAs lead to the
  planned `/book-an-appointment` journey.

## Public FAQ Page

Route: `/faq` (corrected from an earlier `/faqs` draft to match the
atelier-frontend skill's route map and the site header/footer links, which
already pointed to `/faq`).

The public FAQ page presents a searchable, categorized list rather than a
single wall of text. **Implemented**, with one intentional gap noted below.

- Display a keyword search field above the list. It filters FAQ questions and
  answers by keyword. Implemented client-side in `components/faq-list.tsx`.
- Group results by the FAQ `category` field, ordered within each category by
  `sortOrder`.
- Render each question collapsed by default using native `<details>`/
  `<summary>` (keyboard-operable and screen-reader-friendly without custom JS
  for the disclosure behavior itself); selecting it expands its answer.
- Use the established elegant, restrained visual language and muted palette
  from the approved Atelier Haute design reference — reuses the shared site
  header/footer and locked tokens, no new ones introduced.
- Fetch public content from `GET /api/faqs`. **Not yet implemented** —
  `docs/api.md` defines no FAQ contract at all, the same gap `ShopSettings`
  had before it was documented. Following the same pattern used for the
  WhatsApp number, `apps/web/lib/faq-data.ts` hard-codes 4 placeholder Q&As
  (covering turnaround, measurements, deposit/payment, and alterations) in a
  typed module shaped to match a future `FaqEntry` API response, with a
  `TODO` marking it for replacement once `GET /api/faqs` exists. **Flagged to
  the owner rather than building the backend in this pass**, per instruction.
  Each placeholder answer states plainly that the specific policy (turnaround
  range, deposit percentage, payment methods, alteration terms) is still
  pending confirmation — the same honesty pattern used for the unconfirmed
  studio address/hours on `/contact` and the missing founding story on
  `/about`. None of it should be treated as real policy until the owner
  confirms it and it moves into the real FAQ content set described below.

Admin management lives at `/admin/faqs`. Admin can create, edit, delete, and
reorder FAQs using the same protected CRUD convention as services and fabrics.
Not yet implemented (no `apps/admin` exists yet). When it is, the 4
placeholder entries in `lib/faq-data.ts` should be treated as disposable —
replace them with the owner-confirmed content from the FAQ Content draft table
in Business Requirements, not migrate them as seed data.

## Public Appointment Page

Route: `/appointment`

Reuses the shared site header/footer and locked design tokens, in the same
7/5 form-plus-aside layout established on `/contact` (single column below
`lg`, side-by-side at `lg` and up). **Implemented.**

- Fields: name, phone (both required), email (optional), preferred date,
  preferred time (Morning / Afternoon / Evening — deliberately a day-part
  select, not specific hours, since no business hours are confirmed
  anywhere in Business Requirements), garment category (Suits / Corporate /
  Casual / Not sure yet — matches the confirmed catalogue structure, no
  bridal or native-wear option), and an optional free-text note.
- Per the confirmed policy that "fitting-session booking is a customer
  request, not a live calendar; Admin confirms or proposes an alternative,"
  the form is explicitly framed as a request, not a booking, both in the
  aside copy and the post-submit confirmation. It never implies a slot is
  held.
- Aside includes a WhatsApp alternative (reuses `whatsapp-icon.tsx` and
  `getWhatsAppLink`, no duplication) and a short "what happens next" note
  restating the request-not-booking framing.
- `POST /api/appointments` does not exist — `docs/api.md` defines no
  appointment/booking contract. Following the same pattern as WhatsApp and
  FAQ, submission is client-side only: a simulated delay, a warm
  confirmation state, and a `TODO` in `components/appointment-form.tsx`
  marking where the real POST call goes. **Flagged to the owner rather than
  building the backend in this pass.**

**Bug found and fixed during this build, affecting both this form and the
`/contact` enquiry form:** both originally called `event.currentTarget.reset()`
inside a `setTimeout` callback. React nulls `SyntheticEvent.currentTarget`
once the synchronous handler returns, so by the time the callback ran this
threw `TypeError: Cannot read properties of null`. The UI still appeared to
work — the state update to the "sent" view had already committed before the
throw — so it was silent until console errors were checked here. Fixed in
both files by capturing the form element in a local variable before the
`setTimeout`, and calling `.reset()` on that instead.

## Public Contact Page

Route: `/contact`

Reuses the shared site header/footer and locked design tokens. Contains an
enquiry form (name, email, phone, subject, message — client-side only, no
backend endpoint yet) and the WhatsApp contact entry point described below.
Subject options are menswear-only (Bespoke Suit / Corporate Order, Booking a
Fitting, Custom Design Request, General Enquiry) — no bridal option, per the
confirmed menswear-only catalogue scope.

Studio address and visiting hours are not shown because they are unconfirmed
(see Business Requirements — Delivery & Pickup). The page states this openly
rather than inventing placeholder values.

## Public About Page

Route: `/about`

Reuses the shared site header/footer and locked design tokens. Adapted from
the Stitch "The Atelier" reference, with three deviations made deliberately
rather than by omission:

- **No founding story.** The Stitch copy asserted specific founding narrative
  ("Founded in the heart of Lagos... born from a desire to preserve...").
  None of this is confirmed anywhere in Business Requirements. The page states
  openly that the fuller history is still being written, the same honesty
  pattern used for the unconfirmed studio address/hours on `/contact`.
- **No "Hands Behind the Work" team section.** The Stitch mockup profiled
  three named individuals (fabricated names, tenure claims, and AI-generated
  photos — none real). Owner decision: omit the section entirely rather than
  ship even a genericized version, since the section's premise implies real
  named people that don't exist yet. Revisit once real team information is
  available. This is separate from, but consistent with, the
  Architecture Decisions single-tenant note against craftsperson/staff
  profiles.
- **No Aso Oke / heritage-textile framing.** The Stitch "Craft" section
  centered hand-loomed Aso Oke and named weaver partnerships — both
  unconfirmed and coded toward native/traditional wear, which is explicitly
  out of scope (see the confirmed Suits/Corporate/Casual catalogue
  structure). Replaced with general, honest material/construction language
  consistent with what the catalogue already states (wool, cotton, linen).

Also dropped: the Stitch CTA's invented "View Heritage Lookbook" link (no such
page exists or is planned) and its externally hotlinked placeholder photos
(replaced with the site's existing local `formal-wear.png` placeholder,
consistent with Home/Catalogue).

## WhatsApp Contact Entry Points

Display a floating **Chat with us** WhatsApp button on every public page. It is
fixed at the bottom-right using the conventional, accessible floating-action
pattern. Do not show it in the admin dashboard. **Implemented** in the root
layout (`app/layout.tsx` renders `components/whatsapp-floating-button.tsx`),
so it persists across every route without each page needing to add it. It
self-hides on any `/admin`-prefixed path via `usePathname`, ready for when
`apps/web` (or a future admin surface) grows one.

Also display a WhatsApp contact link in the public contact section. **Implemented**
on `/contact` as of this build. Both entry points share one icon
(`components/whatsapp-icon.tsx`) and one link-building helper
(`lib/shop-settings.ts`) rather than duplicating either.

Both entry points derive their destination from the public `ShopSettings`
response. Build the link as:

```text
https://wa.me/{normalized whatsappNumber}
```

For the link value, remove `+` characters and whitespace, then remove a
leading `0` if present. The number itself is admin-editable through
`ShopSettings.whatsappNumber` (see docs/api.md); no number is hard-coded in
the UI. **Implemented as of this build** — `lib/shop-settings.ts` fetches
`GET /api/shop-settings` server-side (never exposed to the browser bundle)
instead of hard-coding the number; the earlier `TODO` is gone. Confirmed via
direct testing against a local database that a real `GET`/`PUT` roundtrip
correctly updates what `/contact`, `/appointment`, and the floating button
all render.

`getShopSettings()` returns `null` on any fetch failure instead of throwing,
and `getWhatsAppLink()` propagates that `null`. Each of the three call sites
(`app/layout.tsx` for the floating button, `/contact`, `/appointment`)
conditionally omits its WhatsApp entry point when the link is `null`, so an
`apps/api` outage degrades those specific elements rather than crashing
pages that don't otherwise depend on this data. `admin/settings` itself is
not built yet (`apps/admin` doesn't exist) — the number can currently only
be changed via `PUT /api/shop-settings` directly, not through an editing UI.
