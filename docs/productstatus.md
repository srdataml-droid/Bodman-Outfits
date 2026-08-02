# Product Status

Last reviewed: 2026-07-29

## Delivery State

**Phase:** Workspace foundation and requirements clarification

The pnpm/Turborepo workspace foundation is installed and locked. Functional web,
API, database, infrastructure, and automated-test implementation have not yet
started because the API contract explicitly leaves two persisted-data and public
authorization decisions open.

## Confirmed Product Direction

- The product is a single-tenant business-management platform for Atelier
  Haute, a Nigerian tailoring business.
- Intended operational areas are customer management, measurements, orders,
  fittings, production, payments, delivery, reporting, and customer
  communication.
- The approved technical baseline is a pnpm/Turborepo TypeScript monorepo with
  Next.js/React web applications, a REST-first NestJS API, PostgreSQL/Prisma,
  Zod, Vitest, Playwright, Tailwind CSS, and Docker/IaC.
- Privacy-aware handling of customer information and measurements, least
  privilege, and auditability are mandatory architecture principles.

## Imported Material Awaiting a Decision

The approved migration source is retained at
`docs/reference/atelier-haute---tailoring-platform.zip`. It is a standalone
React/Vite and Express application that includes a Gemini API integration and
an independent dependency/tooling setup.

It is **not** a deployable application in this repository. Its UI concepts may
be migrated into approved Next.js applications, while its server behavior must
be redesigned behind the approved NestJS API, PostgreSQL/Prisma persistence,
Zod validation and appropriate authorization. No Vite,
Express, npm/Bun tooling, hard-coded credentials, in-memory data store, or
unapproved AI/payment integration will be adopted as production architecture.

`files.zip` contains repository guidance and API documentation copies; no files
have been imported from it.

## Product Specification

| Area | Status | What is known | Decision needed |
| --- | --- | --- | --- |
| Tenancy | Confirmed | The platform serves one business only; no tenant isolation or workspace logic. | None. |
| Customers | Planned | Customer management is in scope. | Customer fields, duplicates, consent, retention, and permissions. |
| Measurements | Planned | Measurement capture is in scope and privacy-sensitive. | Measurement templates, revision history, who may view/edit, and units. |
| Orders | Planned | Order lifecycle management is in scope. | Order states, pricing, deposits, cancellation, and change rules. |
| Fittings and production | Planned | Fittings and production tracking are in scope. | Workflow states, assignments, dependencies, and overdue handling. |
| Payments | Planned | Payment recording is in scope. | Payment methods, references, refunds, balance calculation, and integrations. |
| Delivery | Planned | Delivery is in scope. | Collection/delivery process, proof of delivery, and failed-delivery process. |
| Reporting | Planned | Reporting is in scope. | Initial reports, metrics, export requirements, and role access. |
| Communication | Planned | Customer communication is in scope. | Channels, templates, consent, delivery provider, and audit requirements. |
| AI capabilities | Unapproved | The supplied archive includes Gemini-based UI features. | Whether AI is a product requirement, its allowed use cases, data policy, provider, and acceptance criteria. |

## Requirements Needed Before Implementation

For the first release, confirm:

1. The primary users and their roles, including the permissions of each role.
2. The exact first workflow to deliver, from trigger through completion and
   exceptions.
3. The first-release scope versus items explicitly deferred.
4. The admin identity and initial-account provisioning requirements.
5. Data privacy, consent, retention, and audit requirements.
6. Whether the supplied archive is reference material, a migration source, or an
   approved architectural exception. **Confirmed: migration source; no
   architectural exception is approved.**

Confirmed business decisions belong in
[business-requirements.md](business-requirements.md). Technical decisions belong
in [architecture.md](architecture.md).

## Timeline

No delivery dates, team capacity, release target, or milestone commitments have
been supplied. A calendar timeline would therefore be speculative.

| Milestone | Status | Entry condition | Exit condition |
| --- | --- | --- | --- |
| Requirements baseline | Not started | Owner provides first-release workflow, actors, rules, and acceptance criteria. | Decisions recorded and approved. |
| Architecture and data design | Not started | Requirements baseline approved. | Architecture, data model, authorization, and security decisions documented. |
| Foundation | Not started | Architecture approved. | pnpm/Turborepo workspace, applications, shared packages, CI, and local infrastructure are verified. |
| First vertical slice | Not started | Foundation and first workflow acceptance criteria approved. | Secure end-to-end workflow implemented and tested. |
| Release readiness | Not started | First-release scope implemented. | Security, operations, migration, accessibility, and acceptance checks completed. |

## Current Next Action

Confirm currency storage and measurement-update authorization, then scaffold the
Next.js and NestJS applications and implement the Prisma schema. Update this
document after each material scope, requirement, or timeline decision.
