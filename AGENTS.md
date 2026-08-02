# AGENTS.md

## Project Overview

This repository contains a production-grade, single-tenant business-management platform for Atelier Haute, a Nigerian tailoring business. It supports customer enquiries and measurements, guest orders, fittings, production, payments, delivery, reporting, and customer communication.

Multiple AI and human contributors may work in this repository. Make changes that are small, reviewable, well-tested, and aligned with the documentation in `docs/`.

## Business Requirement Clarification

- Before generating or modifying implementation, ask the project owner for clarification whenever a business requirement, workflow, rule, exception, actor, authorization boundary, or acceptance criterion is unclear.
- Never invent, infer, or silently choose business rules. A plausible assumption is not a requirement.
- Record confirmed business decisions in `docs/business-requirements.md` before or alongside implementation when they affect shared behavior.
- If a decision is technical rather than business-specific, make the smallest safe choice consistent with this file and document material decisions in `docs/architecture.md`.

## Tech Stack

The initial project standard is:

- **Monorepo:** Turborepo with pnpm workspaces
- **Language:** TypeScript with strict compiler settings
- **Web applications:** Next.js and React
- **Backend API:** NestJS, REST-first
- **Database:** PostgreSQL
- **ORM and migrations:** Prisma
- **Validation:** Zod
- **Testing:** Vitest for unit and integration tests; Playwright for end-to-end tests
- **Styling and UI:** Tailwind CSS and shared accessible UI components
- **Infrastructure:** Docker and infrastructure-as-code kept in `infrastructure/`

Do not introduce a competing framework, package manager, ORM, test runner, or styling system without documenting the decision in `docs/architecture.md` and obtaining approval.

## Coding Standards

- Write TypeScript only; enable and preserve strict typing. Do not use `any` unless an approved, documented boundary requires it.
- Prefer clear names and small, single-purpose modules over clever abstractions.
- Keep business rules explicit, deterministic, and covered by tests.
- Validate all external input at system boundaries; never trust browser, API, webhook, or file-upload input.
- Return actionable, consistent errors. Never expose credentials, tokens, personally identifiable information, or internal implementation details in errors or logs.
- Format and lint code using the repository's configured tools. Do not disable linting rules to bypass a problem without justification.
- Add comments only where intent or a non-obvious trade-off cannot be expressed in code.

## Architecture Principles

- Preserve clear boundaries between presentation, application, domain, and infrastructure concerns.
- Treat tailoring workflows and business rules as domain logic, not UI or database implementation details.
- This is a single-business platform. Do not add tenant fields, tenant isolation, workspace switching, or SaaS behavior unless the owner explicitly revisits that decision.
- Prefer modular, composable services with explicit interfaces and dependencies.
- Keep API contracts versionable and backward-compatible where practical.
- Favor secure defaults, least-privilege access, auditability for sensitive business actions, and privacy-aware handling of customer measurements and contact details.
- Record material technical decisions in `docs/architecture.md` before or alongside implementation.

## Confirmed Product Policies

- Customers never have accounts, passwords, or sessions. They may submit guest
  enquiries, place and pay for guest orders, subscribe to the mailing list, and
  look up an order by ID or phone number.
- Admin is the only authenticated role. Use real email-and-password
  authentication with a hashed password and session cookie; never implement a
  PIN-only or hard-coded login bypass.
- Do not build staff or craftsperson entities, profiles, accounts, assignment,
  or booking-by-person behavior.
- FAQs are real, Admin-editable database content and are the primary
  rule-based knowledge source for the AI concierge.
- A direct public WhatsApp click-to-chat link is required now. It is not an AI
  integration or webhook. The editable number lives in
  `ShopSettings.whatsappNumber`, initially `+234 706 131 3517`.
- Fitting-session booking is a customer request, not a live calendar. Admin
  confirms or proposes an alternative.
- Orders support pickup or delivery; delivery requires an address. Admin
  coordinates delivery manually, with no courier API integration.
- The Admin dashboard is at `/admin`, is absent from public navigation, marked
  `noindex`, protected by the real login wall, and rate-limits login attempts.
- Payment state is server-authoritative. Only signature-verified Paystack
  webhooks or server-side Paystack verification may confirm payment.
- Shop details, pricing, services, fabric options, FAQs, and the WhatsApp
  number are database-managed, editable Admin content—not frontend constants.

## AI Feature Boundary

- Ollama Cloud is the only permitted AI provider. Call its native
  `https://ollama.com/api` endpoints from the NestJS API using server-only
  `OLLAMA_API_KEY`; do not add other AI vendor SDKs or expose keys to the web.
- Size/fit guidance is rules-based against a size chart; it does not use AI.
- Garment mockups use a curated fallback placeholder until Ollama Cloud image
  availability is explicitly confirmed.
- The shared concierge service supports rules-first answers from FAQs and
  catalog data, then a one-hour cached Ollama fallback. It must rate-limit,
  truncate conversation history, cap responses, and return contact guidance on
  every provider failure. Keep it independent of the web chat UI so a future
  WhatsApp webhook can call it.

## Boundaries for Autonomous Work

You have full autonomy to build this application end-to-end — implementation
decisions, file structure, following established patterns, are yours to decide
and log, not ask about (per the project's autonomy-boundary agreement: decide
and log routine/reversible/pattern-following calls; still flag first-time use
of real credentials or production connections, destructive operations, new
security gaps, and business/product decisions).

Two hard limits on that autonomy:

1. SCOPE: Everything you do must stay inside this project folder
   (`/home/noirxvii/Desktop/tailoring-platform`). Never read, edit, or run
   commands against anything outside it — no home directory files, no other
   projects, no system-level config. This is backed by a permission-level
   deny rule in `.claude/settings.json`, not just this instruction — but
   verify after any settings change that the rule is actually active (see
   note in that file) rather than assuming it is.

2. .ENV: Never read or edit `.env` directly, even to "just check" something.
   If a task needs a new environment variable or a real credential you don't
   have, STOP and tell the user exactly what's needed (variable name, what
   it's for, where to get it) — they'll add it themselves. Don't guess,
   don't invent placeholder values, don't attempt to work around a missing
   one.

## Folder Ownership

- `apps/` — deployable applications. Each application owns its routes, screens, app-specific composition, and delivery configuration.
- `packages/` — reusable, framework-appropriate shared packages. Do not place app-specific business logic here.
- `docs/` — the source of truth for product, business, architecture, database, API, UI/UX, assistant, and roadmap decisions.
- `infrastructure/` — deployment, environment provisioning, containers, and operational configuration. Application source code does not belong here.

When creating a new package or application, use an industry-standard lowercase kebab-case name and document its purpose in its local README.

## Implementing New Features

1. Read the relevant documents in `docs/` before changing code. Update them when the feature changes an agreed contract, workflow, model, API, UI pattern, or architectural decision.
2. Define the user outcome, tenant scope, authorization rules, validation rules, failure cases, and acceptance criteria before implementation.
3. Reuse existing shared packages and patterns where appropriate; do not duplicate a capability simply to move faster.
4. Keep schema changes backward-safe. Add Prisma migrations for persistent-data changes and update `docs/database.md`.
5. Update API documentation for public or inter-application contract changes.
6. Make the smallest cohesive change possible. Avoid unrelated refactors in a feature change.
7. Run the relevant checks before handoff and report any checks that could not run.

## Writing Tests

- Test observable behavior and domain rules, not implementation details.
- Add unit tests for business rules, validation, calculations, and edge cases.
- Add integration tests for database persistence, admin authorization, API behavior, external-service adapters, payment idempotency, and webhook signature validation.
- Add end-to-end tests for critical user flows, especially customer onboarding, measurement capture, order creation, payment recording, production tracking, and delivery.
- Include success, validation-failure, authorization-failure, and relevant security-boundary cases.
- Use deterministic test data. Do not depend on real external services, real customer data, time-sensitive behavior, or test ordering.
- A defect fix should include a regression test when practical.

## Git Commit Conventions

Use Conventional Commits:

```text
type(scope): concise imperative summary
```

Allowed types include `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, and `security`.

Examples:

```text
feat(orders): add production status transitions
fix(payments): prevent duplicate payment references
docs(api): document customer measurement endpoints
test(tenancy): cover cross-tenant order access denial
```

Keep commits focused and reversible. Do not commit generated secrets, credentials, local environment files, production data, or unrelated formatting changes.
