---
name: atelier-frontend
description: Use this skill any time you are building, editing, or reviewing pages/components in apps/web (customer site) or apps/admin (internal ops app) for the Atelier Haute project. Covers design language, motion rules, catalogue structure, and the custom design request feature.
---

# Atelier Haute — Frontend Build Rules

Menswear only: suits, corporate wear, casual. No bridal, no native wear, no womenswear categories — do not build them even if old Relume/Stitch mockups suggest otherwise.

Real design source of truth: the Relume zip (Home page + DESIGN.md tokens) and the Stitch zip (Catalogue, Book an Appointment, Get in Touch, FAQ, About — real photography + code). **Figma is not a source — it only ever contained placeholder wireframes and should be ignored entirely.**

## Design tokens (confirmed, do not invent new ones)
- Colors: Everglade green (#1B3E2D, primary), Copper (#C8763A, accent), Tan (#D2B48C, accent), white/#F2F2F2 backgrounds
- Type: Fraunces for headings, Spectral for body
- Radii: 12px buttons, 16px cards

## Design references — what to actually do, per reference

These are studied for approach only, never copied wholesale, never quoted or attributed as if the person said something to you.

- **Emil Kowalski's approach (micro-interactions):** apply to hover/focus states and transition timing in BOTH apps. Rule of thumb: transitions should feel instant but not abrupt — 150-250ms, ease-out for entrances, ease-in for exits. Never animate more than one property change without a clear reason.
- **Rauno Freiberg's approach (tactile response):** apply to `apps/web` only — garment cards, the "customize" button, the custom-design-request form. Elements should respond to interaction like physical objects: subtle scale/shadow shift on press, not just a color change.
- **Linear's approach (density + discipline):** apply to `apps/admin` entirely, especially the custom-request review queue. No decorative color, no motion libraries, dense information layout, keyboard-navigable. Speed and clarity over polish.
- **Paystack / Flutterwave / Moniepoint (Nigerian market proof point):** apply to `apps/web` overall visual restraint and load performance. These prove a disciplined, polished layout reads well to a Nigerian audience without importing a foreign SaaS aesthetic — do not default to Silicon Valley startup visual tropes (gradient mesh hero, generic SaaS icon grids).
- **Josh Comeau's writing:** implementation reference only, not a look. If an animation you write feels janky, check joshwcomeau.com's CSS/animation explainers before guessing.

## Motion libraries — which app, which library
- `apps/web`: GSAP (scroll-triggered reveals, hero video transition), Motion (component transitions — customize modal, custom-request form steps), Lenis (smooth scroll)
- `apps/admin`: none of the above. Deliberately plain per the Linear reference.

Performance guardrail, non-negotiable: compressed video, poster-frame fallback, lazy-loaded images, `prefers-reduced-motion` respected everywhere.

## Route structure for apps/web (Next.js App Router)

```
app/
  page.tsx                          → / (Home)
  catalogue/
    page.tsx                        → /catalogue
    [category]/
      page.tsx                      → /catalogue/suits, /catalogue/corporate, /catalogue/casual
      [item]/
        page.tsx                    → individual garment detail page
  customize/
    [item]/
      page.tsx                      → customize-an-existing-piece flow
  custom-request/
    page.tsx                        → new custom design submission form
  appointment/
    page.tsx                        → Book an Appointment
  contact/
    page.tsx                        → Enquiry / Get in Touch
  faq/
    page.tsx
  about/
    page.tsx
```

Use dynamic routes (`[category]`, `[item]`) rather than one static file per garment/category — new garments should mean a new database entry, not new code.

## Responsiveness — non-negotiable, every page

- Mobile-first: design and build for narrow viewports first, then expand up, not the reverse.
- Breakpoints: test at minimum 375px (small phone), 768px (tablet), 1280px (desktop).
- Touch targets on mobile: minimum 44x44px tappable area, especially on catalogue cards and the customize/custom-request flows.
- No horizontal scroll at any breakpoint unless explicitly a carousel component.
- Motion libraries (GSAP, Motion, Lenis) must degrade gracefully on mobile — reduce or disable heavier scroll effects on small viewports and always respect `prefers-reduced-motion`, per the performance guardrail above.
- Garment card grids: reflow (e.g. 3-up desktop → 2-up tablet → 1-up mobile), never just shrink.
- Verify every new page at all three breakpoints before considering it done.

## Catalogue structure (confirmed)
- Suits (business, wedding, event)
- Corporate (blazers, trousers, shirts)
- Casual (everyday menswear)
- Native/traditional wear status: unresolved, pending owner confirmation — do not add as a category yet

## Custom Design Request feature (new, build when apps/admin work begins)
Distinct from the existing catalogue "customize this piece" flow. Customer starts from their own idea instead of an existing item.
- Customer side: entry point separate from per-item customize button. Fields: description, optional reference image, optional catalogue-category link. Status on submit: `pending_review`.
- Admin side: queue view, oldest first. Accept → converts to real order, proceeds to measurements/payment. Decline → requires reason, sent back to customer.
- Data model: new `CustomRequest` entity (not `Order`), status enum (`pending_review`, `accepted`, `declined`), `reviewedBy` admin reference, nullable `declineReason`.

## Copy voice
Customer-centric warmth, confirmed priority. This is a copy/interaction decision, not a visual one — layout stays disciplined per tokens above.
- "Your suit is with the tailor now" — not "Status: In Progress"
- Decline messages and confirmations should read as attentive, never templated/automated-sounding
- Applies to order status, custom-request responses, and appointment confirmations

## Forward compatibility — mobile app planned later, web first
Web is the priority now. A native/Expo mobile app is planned for later, consuming the same NestJS API — not a rebuild. Keep this in mind for `apps/api` work (not `apps/web` UI): API responses should stay platform-agnostic (plain JSON, no HTML-specific shaping) so a future mobile client can consume the same endpoints without backend rework. This does not change any web-app priority or timeline — it is a "don't paint into a corner" note, not a task to build now.

## Still open — do not block on these, but flag if relevant
1. Native/traditional wear category — pending owner
2. `apps/admin` subdomain/path convention — not yet decided
3. Hero video creative direction — pending owner's fuller description
4. Core business content (real name, pricing, policies, real photography) — pending conversation with business owner, still placeholder everywhere
