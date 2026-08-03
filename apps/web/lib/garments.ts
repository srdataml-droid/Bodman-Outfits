/**
 * Five top-level lines, confirmed by the owner on 2026-08-03.
 *
 * This ADDS agbada and kaftan, which the atelier-frontend skill had listed as
 * "native/traditional wear status: unresolved, pending owner confirmation" and
 * told contributors not to build until confirmed. That confirmation is what
 * this change records; it supersedes the 2026-08-01 decision that removed
 * them. See logs/decisions.md.
 *
 * `casual` also became `casuals` to match the requested route.
 */
export type CategorySlug = "suits" | "agbada" | "kaftan" | "casuals" | "corporate";

/**
 * Two-shot photography, as a pair.
 *
 * `flat` is the garment laid out or shot as detail; `onForm` is the same
 * garment dressed on a form. The hover mechanic crossfades between exactly
 * these two, so the pair is modelled as data rather than derived from a
 * filename convention. When real two-shot photography exists, swapping it in
 * is an edit to this file only, never to a component.
 *
 * Both images in a pair MUST share an aspect ratio (currently 4:5). A
 * mismatch would make the crossfade jump, which is precisely the kind of
 * attention-seeking motion this design avoids.
 */
export interface GarmentImagePair {
  flat: string;
  onForm: string;
  altFlat: string;
  altOnForm: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  images: GarmentImagePair;
}

export interface Garment {
  slug: string;
  category: CategorySlug;
  name: string;
  detail: string;
  description: string;
  images: GarmentImagePair;
}

// All imagery below is design-system placeholder, not photography. It is
// deliberately non-photographic so it cannot be mistaken for a real picture
// of a real garment from this house. Real photography replaces these paths;
// see decisions.md for the full generation checklist (paths, dimensions,
// and what each shot should depict).
function placeholderPair(slug: string, subject: string): GarmentImagePair {
  return {
    flat: `/images/catalogue/${slug}-flat.png`,
    onForm: `/images/catalogue/${slug}-on-form.png`,
    altFlat: `Placeholder for a flat/detail photograph of ${subject}`,
    altOnForm: `Placeholder for a photograph of ${subject} on the form`,
  };
}

export const categories: Category[] = [
  {
    slug: "suits",
    name: "Suits",
    tagline: "Business, wedding & event",
    description: "Two- and three-piece suiting cut for the boardroom, the aisle, and everything between.",
    images: placeholderPair("category-suits", "the suits line"),
  },
  {
    slug: "agbada",
    name: "Agbada",
    tagline: "Ceremonial & occasion",
    description: "Flowing, layered pieces for the occasions that ask for them.",
    images: placeholderPair("category-agbada", "the agbada line"),
  },
  {
    slug: "kaftan",
    name: "Kaftan",
    tagline: "Everyday & occasion",
    description: "Clean-lined kaftans, cut to move.",
    images: placeholderPair("category-kaftan", "the kaftan line"),
  },
  {
    slug: "casuals",
    name: "Casuals",
    tagline: "Shirts & trousers",
    description: "Off-duty pieces that keep the same discipline of cut, just without the tie.",
    images: placeholderPair("category-casuals", "the casuals line"),
  },
  {
    slug: "corporate",
    name: "Corporate",
    tagline: "Shirts & trousers",
    description: "Separates built for the working week. Mix, match, and repeat without the garment giving up on you.",
    images: placeholderPair("category-corporate", "the corporate line"),
  },
];

// Shared placeholder imagery for shirts and trousers.
//
// OPEN QUESTION, flagged rather than guessed: only one shirt pair and one
// trousers pair exist, and they are used for BOTH the casuals and corporate
// lines. If a casual shirt and a corporate shirt are meant to be visually
// distinct garments (different cloth, cut, formality) then this needs four
// pairs, not two. That has to be settled before real photography, not after.
// See logs/decisions.md.
function sharedPair(kind: "shirt" | "trousers", subject: string): GarmentImagePair {
  return {
    flat: `/images/catalogue/${kind}-flat.png`,
    onForm: `/images/catalogue/${kind}-on-form.png`,
    altFlat: `Placeholder for a flat/detail photograph of ${subject}`,
    altOnForm: `Placeholder for a photograph of ${subject} on the form`,
  };
}

export const garments: Garment[] = [
  {
    slug: "navy-two-piece",
    category: "suits",
    name: "Navy Two-Piece",
    detail: "Suits",
    description:
      "A single-breasted two-piece in a deep navy wool blend. Built for the boardroom, cut close through the waist.",
    images: placeholderPair("navy-two-piece", "a navy two-piece suit"),
  },
  {
    slug: "charcoal-three-piece",
    category: "suits",
    name: "Charcoal Three-Piece",
    detail: "Suits",
    description:
      "Jacket, trouser, and waistcoat in charcoal wool. A formal silhouette that still moves with the wearer.",
    images: placeholderPair("charcoal-three-piece", "a charcoal three-piece suit"),
  },
  {
    slug: "ivory-wedding-suit",
    category: "suits",
    name: "Ivory Wedding Suit",
    detail: "Suits",
    description:
      "An ivory wool-silk suit for the groom. Softly structured shoulders, finished with hand-stitched lapels.",
    images: placeholderPair("ivory-wedding-suit", "an ivory wedding suit"),
  },
  // Casuals and Corporate are parent lines, each holding a shirt and a
  // trouser. Descriptions stay deliberately general: the actual cloths and
  // cuts that distinguish a casual shirt from a corporate one have not been
  // confirmed, and inventing them here would be inventing product.
  {
    slug: "casual-shirt",
    category: "casuals",
    name: "Casual Shirt",
    detail: "Casuals",
    description: "A relaxed shirt cut with a little more room through the body, for days without a tie.",
    images: sharedPair("shirt", "a casual shirt"),
  },
  {
    slug: "casual-trousers",
    category: "casuals",
    name: "Casual Trousers",
    detail: "Casuals",
    description: "An easy trouser made to move between a Saturday errand and dinner out.",
    images: sharedPair("trousers", "a pair of casual trousers"),
  },
  {
    slug: "corporate-shirt",
    category: "corporate",
    name: "Corporate Shirt",
    detail: "Corporate",
    description: "A made-to-measure shirt built to hold its shape through a long working day.",
    images: sharedPair("shirt", "a corporate shirt"),
  },
  {
    slug: "corporate-trousers",
    category: "corporate",
    name: "Corporate Trousers",
    detail: "Corporate",
    description: "A tailored trouser cut for a clean line from waist to break.",
    images: sharedPair("trousers", "a pair of corporate trousers"),
  },
  // Agbada and kaftan have no individual pieces listed yet. Rather than
  // invent garment names and descriptions for lines nobody has described,
  // the category pages say so honestly. See getGarmentsByCategory callers.
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getGarmentsByCategory(slug: string): Garment[] {
  return garments.filter((garment) => garment.category === slug);
}

export function getGarment(categorySlug: string, itemSlug: string): Garment | undefined {
  return garments.find((garment) => garment.category === categorySlug && garment.slug === itemSlug);
}
