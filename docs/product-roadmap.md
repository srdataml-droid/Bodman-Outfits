# Product roadmap — what to add, and why

Compiled 2026-08-17 by reading the schema and the services rather than
guessing. Companion to `docs/production-readiness.md`, which covers the
infrastructure. This one is about the product.

---

## The three gaps that matter

### 1. There are no measurements

Nine models — `Appointment`, `Enquiry`, `CustomRequest`, `Order`, `Garment`,
`Faq`, `Admin`, `AdminSession`, `ShopSettings` — and not one field for a chest,
a sleeve, a waist or an inseam. Verified: zero matches for
`measurement|chest|waist|inseam|sleeve` in `schema.prisma`.

This is a **bespoke tailor**. Measurements are the core asset of the business
and its strongest retention hook: *"we already have your measurements"* is the
reason a customer returns to you rather than the tailor down the road. Today
that record lives in a notebook, which means it cannot be searched, backed up,
or used to shorten a repeat order.

**What it needs:** a `Measurement` model keyed to a customer identity, with a
`takenAt` date and the admin UI to record and revise it. Measurements change,
so history matters more than a single current value — a suit cut to last year's
numbers is a remake.

**The hard part is customer identity.** There is no `Customer` model. All three
request types denormalise a name and a phone. Measurements need something
stable to attach to, so this probably starts with a `Customer` record keyed on
phone number.

### 2. The customer never hears from the system

`notifications.service.ts` maps every submission kind to an admin route —
`/admin/appointments`, `/admin/enquiries`, `/admin/custom-requests`. The **shop
owner** is told. The customer books a fitting and receives nothing: no
confirmation that it arrived, no reminder before the day.

For an appointment business, no-shows are the largest recurring cost, and a
reminder is the cheapest fix there is. Resend is already wired and the service
is already written to never throw, so the plumbing exists.

**The constraint that shapes this:** on all three models `email` is **optional**
and `phone` is **required**. Realistic for Lagos, and it means an email-only
confirmation reaches only the subset who gave an address. Options, in order of
reach:

- **WhatsApp** — reaches everyone, matches how customers already arrive, and
  costs a Business API setup
- **SMS** — reaches everyone, costs per message
- **Email** — free, already wired, reaches only some

Start with email because it is a small change on existing plumbing, but do not
mistake it for solving the problem. The customers most likely to no-show are
the ones who gave only a number.

### 3. They cannot see where their garment is

`OrderStatus` already exists: `draft → in_production → ready → completed`,
plus `cancelled`. There are process videos for measuring, cutting, sewing,
fitting, pressing and finished. None of it is visible to the customer.

Bespoke work takes weeks. *"Where is my thing"* is the recurring question, and
every instance currently arrives as a WhatsApp message a person answers by
hand. A read-only status page, reached by a link tied to the order, converts
that from labour into a page view.

Worth doing well rather than literally: the internal statuses are for the
workshop. What the customer wants is an honest stage and an expected date.

---

## Accounts and authentication — decided 2026-08-17

**Progressive.** Browsing and asking stay open; anything that protects money
or personal data requires an account.

| Action | Account required |
|---|---|
| Browse catalogue, FAQ, prices | No |
| Enquiry, custom request, book a fitting | No — name and phone only |
| Track an order | **Yes** |
| Make a purchase | **Yes** |
| Stored measurements and history | **Yes** |

**Why not gate everything:** customers arrive from a WhatsApp link to book a
fitting. Every field before that booking loses some of them, and for a shop
doing tens of orders a month an account wall likely costs more business than it
organises.

**Why gate those three:** identifying a customer by phone number alone is fine
for *recognising* a returning customer and useless as *authentication* — anyone
who knows Ada's number could read Ada's orders. Once money moves and personal
data persists, that is the obvious attack and it has to be closed.

### Phone + one-time code, not email + password

- Everyone here has a phone and knows the number. Not everyone checks email —
  `email` is nullable on every model precisely because of this.
- No password storage, no reset flow, no credential stuffing. The admin side
  does not even have password reset yet; adding that burden on the customer
  side would be a step backwards.
- The login key becomes the *same* key as the customer identity: one person,
  one number, whether they walked in, messaged, or bought online. Email
  becomes an optional contact detail rather than the account.

This still needs the `Customer` model keyed on a normalised phone number, so
that work comes first either way.

## Payments

Paystack keys are in `.env` and **nothing references them** — zero matches
across `apps/` and `packages/`. The integration is entirely unbuilt. The owner
is handling this; keys to follow.

**One design opinion, recorded so it is not lost:** bespoke convention is a
deposit — typically half upfront, the balance at fitting. Full payment upfront
on a ₦120,000 suit will cost conversions; nothing upfront exposes the shop to
abandoned commissions. Paystack supports partial payments, and `Order` already
snapshots the customer, so the model is a natural fit.

**Going live requires** (checked against Paystack's own docs, not memory): CAC
registration — Business Name or RC both accepted — the BVN of the owner or a
director, a government-issued ID, and a Nigerian bank account for settlement.
KYC clears in 1–3 business days. Settlement is T+1.

**Status: deferred deliberately.** Not being built yet - documented now so the
design decisions survive until keys arrive.

**Refund policy: deliberately not drafted here.** It needs a conversation, not
a template. A garment cut to one person's body cannot be resold, which makes
the usual "14 days, no questions" actively wrong — and it is exactly the clause
a customer will point at when something goes wrong. To be written together.

---

## The assistant — replacing the WhatsApp button with something that answers

The floating WhatsApp button hands every question to one person. That works
until volume arrives, at which point the boss becomes the bottleneck for
"do you make agbada" as much as for real decisions.

**Shape:** a retrieval-backed assistant that answers from the shop's own data
and hands over to a human on request.

### The two things it must never invent

**A price** and **a date.** Both create obligations the shop then has to
honour, and a customer will quote either back verbatim. Refusal is the feature,
not a limitation - the correct answer to a question it cannot ground is "let me
put you through to the shop", every time.

### Three design rules

1. **Knowledge comes from the database, not the prompt.** FAQs are already a
   `Faq` table; garments, prices and categories are already rows. Read those at
   answer time and the assistant updates itself when the shop changes a price.
   Bake prices into a system prompt and it will quote last month's figures with
   total confidence, forever.
2. **Escalation is one tap and always visible** - present in every reply, not
   offered only once the assistant has failed. Its job is to absorb the routine
   eighty percent, not to defend the gate.
3. **Log every conversation.** It is the audit trail when a customer says "your
   bot told me forty thousand", and it is the material that shows which
   questions deserve a proper answer on the site itself.

### Start narrow

FAQs, "where is my order", and booking a fitting. Those three cover most
message volume and each has a checkable answer. Everything else escalates.

**Prior art in this account:** `docs-rag-service` - "RAG with verifiable
citations and measured refusal, retrieval scored separately". That is the same
discipline this needs, and the evaluation approach transfers directly.

**Channel cost:** WhatsApp Business API bills per conversation. Worth pricing
before committing, since the alternative - answering in the web chat only -
loses the arrival path customers actually use.

## Legal and compliance

**A privacy policy is required.** The NDPA 2023 applies to small businesses,
demands an accessible policy, and Paystack will ask for one during onboarding.

**A cookie banner is *not* required yet — and this is worth getting right.**
NDPA requires opt-in consent only for non-essential cookies, and this site
currently runs **no analytics and no tracking at all**. So no banner today. The
moment analytics is added it becomes required, so decide both together rather
than adding analytics and inheriting a compliance gap by accident.

---

## Order of work

1. **Customer confirmation emails** — small, uses existing plumbing, immediate
   value. Reaches only those who gave an address; that limit is the point of
   item 2 below.
2. **A reach decision: WhatsApp or SMS** — because phone is the field everyone
   fills in. This is a cost and setup question for the owner, not a code
   question.
3. **Measurements**, with the `Customer` identity that has to come first.
4. **Customer-facing order status.**
5. **Paystack**, once keys arrive, with deposit semantics.
6. **Privacy policy**, before payments go live.
7. **Analytics and the cookie consent that comes with it**, together.
