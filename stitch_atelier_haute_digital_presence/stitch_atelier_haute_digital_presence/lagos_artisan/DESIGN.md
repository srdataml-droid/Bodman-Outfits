---
name: Lagos Artisan
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#414843'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#727973'
  outline-variant: '#c1c8c2'
  surface-tint: '#426653'
  primary: '#032819'
  on-primary: '#ffffff'
  primary-container: '#1b3e2d'
  on-primary-container: '#84a993'
  inverse-primary: '#a9cfb8'
  secondary: '#924b11'
  on-secondary: '#ffffff'
  secondary-container: '#ffa363'
  on-secondary-container: '#763800'
  tertiary: '#301f04'
  on-tertiary: '#ffffff'
  tertiary-container: '#483416'
  on-tertiary-container: '#b99c76'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ecd3'
  primary-fixed-dim: '#a9cfb8'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#2b4e3c'
  secondary-fixed: '#ffdcc7'
  secondary-fixed-dim: '#ffb787'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#723600'
  tertiary-fixed: '#feddb3'
  tertiary-fixed-dim: '#e1c299'
  on-tertiary-fixed: '#281801'
  on-tertiary-fixed-variant: '#584324'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Spectral
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Spectral
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Spectral
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style
The design system embodies the concept of "unhurried luxury"—a digital translation of bespoke West African tailoring. It avoids the frantic pace of fast-fashion e-commerce in favor of a curated, gallery-like experience. The aesthetic is a blend of **Minimalism** and **Modern Corporate**, focusing on high-quality editorial layouts that allow the craftsmanship of the garments to breathe.

The personality is sophisticated and grounded. It targets a high-net-worth audience that values heritage, precision, and tactile quality. Every interaction should feel intentional, smooth, and warm, evoking the feeling of a private consultation in a Lagos atelier.

## Colors
The palette is rooted in the "Everglade" green, providing a deep, authoritative foundation. "Warm Copper" is used sparingly for primary actions and highlights, while "Tan" serves as a soft bridge between the deep green and the neutral backgrounds.

- **Primary (Everglade):** Used for headers, primary buttons, and critical brand moments.
- **Secondary (Warm Copper):** Used for interactive highlights, price points, and call-to-actions that require warmth.
- **Tertiary (Tan):** Used for decorative elements, hover states on light backgrounds, and subtle dividers.
- **Backgrounds:** Use `#FFFFFF` for main content areas and `#F2F2F2` for section offsets or card backgrounds to create a subtle layered effect.

## Typography
Typography is the cornerstone of this design system. We use **Fraunces** for all headings to provide a distinct, editorial voice with a touch of artisan charm. **Spectral** is used for body copy and labels to maintain a literary, high-end feel that is highly readable.

Large display type should utilize negative letter spacing to feel more cohesive, while small labels should use increased tracking (letter spacing) for an airy, premium touch. Ensure body text maintains a comfortable line height to reinforce the "unhurried" narrative.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop (12 columns) and a fluid model on mobile (4 columns). 

- **Vertical Rhythm:** Use a 120px gap between major sections to emphasize whitespace. 
- **Margins:** Desktop margins are generous (64px) to create an inset, "framed" look for the content.
- **Alignment:** Use asymmetrical layouts for image-heavy sections to mimic luxury fashion lookbooks. Text blocks should generally remain left-aligned or centered for formal announcements.

## Elevation & Depth
This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Low-contrast Outlines**. 

- **Tiers:** Use the off-white (`#F2F2F2`) background to sit behind white (`#FFFFFF`) cards or sections to create depth without using shadows.
- **Borders:** Subtle 1px borders in Tan or very light Everglade (at 10% opacity) define containers. 
- **Interactive Depth:** Only the primary buttons should have a very soft, diffused copper-tinted shadow on hover to simulate the physical pressing of high-quality material.

## Shapes
The shape language is "Soft-Organic." It balances the precision of tailoring with the comfort of fabric. 

- **Buttons:** Always use a 12px corner radius. This is slightly more rounded than standard corporate sets, suggesting a softer touch.
- **Cards/Containers:** Use a 16px corner radius.
- **Imagery:** Product photography should either be sharp-edged for a full-bleed look or use the 16px radius when nested within cards.

## Components
- **Buttons:** The primary button is solid Everglade with white text. The secondary button is outlined in Warm Copper. All buttons use 12px rounded corners.
- **Cards:** Product and story cards must use a 16px radius and a 1px border in Tan (`#D2B48C`). Use generous internal padding (min 24px).
- **Input Fields:** Use a simple bottom-border style (Everglade, 1px) for a more minimal, "bespoke form" feel, or a fully enclosed field with 12px radius and Tan border.
- **Chips/Tags:** Used for fabric types (e.g., "Aso Oke," "Linen"). These are pill-shaped with a Tan background and Everglade text.
- **Navigation:** A minimal top-bar with Fraunces "Label-caps" links. Hover states should transition the color to Warm Copper.
- **Measurement Inputs:** Custom UI component for bespoke sizing should be clean, using large typography and plenty of tap-target space, reinforcing the "Atelier" service.