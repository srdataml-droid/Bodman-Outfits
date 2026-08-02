# AGENTS.md — Atelier Haute Tailoring Platform

## Governing Policy

**No implementation proceeds on unclear business rules, ever.** If a
requirement is not explicitly confirmed in `business-requirements.md`
or this file, the agent must ask the project owner rather than
guessing or assuming a "reasonable default" — this applies to data
shapes, auth behavior, business logic, and UI copy alike.

## Confirmed Tech Stack

| Layer | Choice |
|---|---|
| Monorepo tooling | Turborepo + pnpm |
| Language | TypeScript (strict mode, everywhere) |
| Frontend | Next.js (App Router) + React |
| Styling | Tailwind CSS |
| Backend | NestJS (REST API) |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod (all external input, every boundary) |
| Testing | Vitest (unit), Playwright (e2e) |

Do not substitute or mix in a different frontend framework (e.g. Vite
SPA), backend framework (e.g. plain Express), or database/ORM (e.g.
Firebase/Firestore) without explicit project-owner sign-off.

## Architecture Principles

- **Single-tenant.** This is one tailoring business's own management
  platform — not a SaaS product for multiple tailoring businesses.
  Do NOT build multi-tenancy, tenant isolation columns/fields, or any
  "workspace switching" logic. If this constraint is ever revisited,
  it must be an explicit, deliberate decision — not an assumption.
- **Customers do not have accounts** — no login, no passwords, no
  sessions, ever. But customers CAN, without logging in:
  - Submit a guest inquiry (a soft lead — question/interest, not a
    committed order)
  - **Place a real order themselves** (service + fabric + contact
    info) and **pay the deposit directly via a Paystack payment
    link** — no admin step required to create the order or collect
    payment. This is genuinely self-service, not just an inquiry.
  - Sign up for the mailing list
  - Look up an existing order by ID or phone number
- **Admin is the only authenticated role.** Currently a single Admin
  role covers the owner and any staff. A distinct staff role may be
  added later if the business grows to need it — do not build this
  speculatively ahead of confirmed need.
- **Real authentication only.** No PIN-only auth, no hardcoded
  fallback credentials of any kind, in any environment.
- **No staff/craftsperson entity of any kind.** Orders are not
  assigned to specific people in the system — this was considered
  and explicitly dropped. Do not build profiles, booking-by-person,
  or any related routing.
- **FAQs are real, admin-editable content**, not hardcoded copy —
  same "content lives in the database" principle as services/fabrics.
  They also double as the primary knowledge source for the AI
  concierge's rules-first matching step (see AI Feature Scope below).
- **A direct WhatsApp "chat with us" link is a confirmed feature now**
  — this is separate from, and simpler than, the future AI-on-WhatsApp
  phase. It's a plain click-to-chat link (`wa.me/<number>`) connecting
  a customer straight to the shop's human WhatsApp number, no API or
  webhook involved. The number lives in `ShopSettings.whatsappNumber`,
  editable by Admin, seeded with `+234 706 131 3517` as the initial
  default.
- **Fitting-session booking is a request, not a live calendar.**
  Customer proposes a date/time from the shop's posted hours; Admin
  confirms or proposes an alternative through the dashboard. A
  real-time synced calendar is a future upgrade, not required now.
- **Orders have a fulfillment method: pickup or delivery.** If
  delivery, an address is collected. No live courier/logistics API
  integration yet — Admin coordinates delivery manually for now.
- **Admin dashboard lives at `/admin`, not linked from public
  navigation** — but this is a minor convenience, not the security
  boundary. The real login wall (hashed password + session) is what
  actually protects it; `/admin` should also be marked `noindex` so
  it never appears in search results, and login attempts should be
  rate-limited.
- **Payment integrity is server-authoritative, never client-trusted.**
  The frontend reporting "payment succeeded" is never sufficient to
  mark an order paid. Fulfillment only happens after (a) a verified
  Paystack webhook signature, or (b) a direct server-side call to
  Paystack's verify-transaction endpoint — and only after confirming
  the paid amount matches the expected deposit/total. See
  `api.md` section 8 for the exact contract.
- **Content lives in the database, not in code.** Shop details,
  pricing, services, and fabric options must be editable by the Admin
  through the UI — never hardcoded into components or config files.

## AI Feature Scope (confirmed, do not expand without sign-off)

**AI provider: Ollama Cloud, not Google Gemini, not OpenAI/Anthropic.**
Ollama Cloud is Ollama's own hosted service at `https://ollama.com/api`
— not a self-managed server. Requests are authenticated with a Bearer
token from the `OLLAMA_API_KEY` environment variable. This key is
server-side only, in NestJS, and must never reach the frontend.

1. **Size/fit guidance**: rules-based comparison against a size
   chart only. No trained ML model, no fit-prediction system, no
   Ollama call needed for this feature at all.
2. **Garment mockup generation**: Ollama's image-generation models
   (Z-Image-Turbo, FLUX.2) were introduced as a local/macOS-only
   experimental feature — availability through Ollama Cloud is
   unconfirmed as of this writing. Confirm current Ollama Cloud model
   list before building; if image generation isn't available on
   Cloud yet, use a curated placeholder image (`isFallback: true`)
   rather than substituting a different cloud image API without
   sign-off.
3. **AI concierge / help assistant**: goes beyond Q&A — explains how
   ordering/booking works, and actively recommends matching services
   or fabrics based on what the customer describes needing.
   Implementation: a light retrieval step (query the actual
   catalog/FAQ data for relevant matches) feeding structured results
   into the AI's context, rather than full vector-search RAG —
   proportionate at current catalog size; revisit with `pgvector` if
   the catalog grows significantly.
   **Architecture requirement**: this logic must live in one shared
   service, callable from the website chat widget now and from a
   WhatsApp Business API webhook later — do not couple the AI logic
   to the web chat UI. WhatsApp integration itself is a later phase,
   not part of the current build.

### AI cost & reliability strategy (mandatory, not optional polish)

Ollama Cloud bills by GPU-time and gates concurrency/usage on a
resetting clock, with no uptime guarantee — treat it as a limited,
sometimes-unavailable resource, not an always-on utility:

- **Rule-based first**: match common questions (price, hours,
  turnaround, order tracking) with deterministic keyword logic before
  ever calling Ollama Cloud. Only unmatched questions escalate to a
  real AI call.
- **Light model by default** for the concierge — escalate to a
  heavier model only if a defined need arises, never by default.
- **Cache AI replies** (in-memory, TTL ~1 hour) keyed to the
  normalized question text. Invalidate the cache whenever
  services/fabrics/shop-settings change via the admin dashboard.
- **Rate-limit public AI endpoints** per IP (e.g. 10/minute) using
  NestJS's built-in throttler.
- **Truncate conversation history** sent to the model to the last
  few turns; cap max response length.
- **Always have a graceful fallback reply** (contact info) for any
  Ollama Cloud failure, timeout, or quota exhaustion — never surface
  a raw error to a customer.

No self-hosting or dedicated AI server needed — Ollama Cloud removes
that concern entirely.

## Payments

Paystack, following their documented server-side integration pattern.
Never store raw payment credentials.
