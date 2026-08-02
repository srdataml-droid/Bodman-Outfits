# Business Requirements

Purpose: Record the business capabilities, rules, workflows, constraints, priorities, and acceptance criteria that guide product delivery.

## FAQ Content

FAQs are customer-facing, database-managed content. Admin maintains the
question, answer, category, and display order; they are not hard-coded into the
web application.

The following draft topics are proposed for the initial content set. Text that
contains bracketed values is intentionally unconfirmed and must not be seeded
or published until the owner provides the actual policy/value.

| Category | Draft question | Draft answer status |
| --- | --- | --- |
| Ordering | Do I need an account to place an order? | Confirmed principle: guests can order without an account. |
| Ordering | Can I choose a specific fabric for my order? | Draft: select from catalog or bring own fabric; owner must confirm the bring-your-own-fabric policy. |
| Pricing & Deposits | How much deposit do I need to pay? | Deposit percentage `[X]%` is unconfirmed. |
| Pricing & Deposits | What payment methods do you accept? | Draft: card and bank transfer via Paystack; owner must confirm. |
| Measurements & Fit | I don't know my measurements — what do I do? | Draft: book a fitting or use a size guide; owner must confirm available size-guide workflow. |
| Measurements & Fit | What if the fit isn't right when it's ready? | Adjustment/alteration policy is unconfirmed. |
| Delivery & Pickup | Can I get my order delivered? | Delivery fees and coverage areas are unconfirmed. |
| Delivery & Pickup | Where do I pick up my order? | Shop address and collection hours are unconfirmed. |
| Timelines | How long does an order take? | Typical service turnaround ranges are unconfirmed. |
| Timelines | Can I track my order's progress? | Confirmed principle: public lookup uses order ID or phone number. |

## Customer WhatsApp Contact

- Public pages provide a floating “Chat with us” WhatsApp entry point and a
  second entry point in the contact section.
- The default business WhatsApp number is `+234 706 131 3517`.
- Admin can update the WhatsApp number from the shop-settings area.
- The WhatsApp URL is constructed from the current setting, not from a
  hard-coded frontend value.
