# Atelier Haute Archive Migration

## Approved Scope

The supplied archive is reference material for a future platform implementation.
It is not incorporated as a Vite/Express application. The archive is retained
at `reference/atelier-haute---tailoring-platform.zip`.

## Source Inventory

The archive contains:

- public-site components: header, hero, service showcase, contact section,
  inquiry form, mailing-list modal, and order tracker;
- customer-facing interactive concepts: size/fit advisor and garment mockup
  generator;
- staff-facing concepts: admin sign-in and an operations dashboard;
- demo data and a client-side mock API;
- Express endpoints for shop settings, catalog, orders, measurements,
  inquiries, subscribers, Paystack calls, and Gemini-assisted experiences.

## Migration Rules

| Source material | Migration treatment |
| --- | --- |
| Visual language and public-page layout | Candidate for a future Next.js web app after branding and content approval. |
| React Router routes | Recreate using the Next.js App Router. |
| Express API endpoints | Redesign as versioned NestJS REST endpoints after domain contracts are approved. |
| In-memory mock store and sample records | Do not migrate into production; replace with Prisma persistence and deterministic test fixtures. |
| Admin PIN, default email, and client-side session | Do not migrate; authentication and authorization requirements are pending. |
| Paystack implementation | Do not migrate yet; payment rules and provider approval are pending. |
| Gemini/AI features | Do not migrate yet; use case, data policy, and provider approval are pending. |
| `any` types and front-end business behavior | Do not migrate; use strict TypeScript, Zod boundary validation, and explicit domain services. |

## Work That Cannot Be Safely Inferred

The archive presents a single-tailor demo. The production platform serves one
business, and the following are business decisions rather than technical
conversion tasks:

- how the Admin role accesses customer measurements, payments, and settings;
- the order, fitting, production, payment, and delivery state transitions;
- pricing, deposit, refund, cancellation, and payment-provider rules;
- customer consent, communication, and retention requirements;
- whether size advice, garment mockups, or AI concierge are first-release
  capabilities.

Record confirmed answers in [business-requirements.md](business-requirements.md)
before implementing those capabilities.
