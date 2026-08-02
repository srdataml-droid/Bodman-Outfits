export type CategorySlug = "suits" | "corporate" | "casual";

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
    images: placeholderPair("category-suits", "the suits category"),
  },
  {
    slug: "corporate",
    name: "Corporate",
    tagline: "Blazers, trousers & shirts",
    description: "Separates built for the working week. Mix, match, and repeat without the garment giving up on you.",
    images: placeholderPair("category-corporate", "the corporate category"),
  },
  {
    slug: "casual",
    name: "Casual",
    tagline: "Everyday menswear",
    description: "Off-duty pieces that keep the same discipline of cut, just without the tie.",
    images: placeholderPair("category-casual", "the casual category"),
  },
];

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
  {
    slug: "tailored-blazer",
    category: "corporate",
    name: "Tailored Blazer",
    detail: "Corporate",
    description: "A single-breasted blazer that pairs cleanly with separates. Structured chest, soft shoulder.",
    images: placeholderPair("tailored-blazer", "a tailored blazer"),
  },
  {
    slug: "flat-front-trouser",
    category: "corporate",
    name: "Flat-Front Trouser",
    detail: "Corporate",
    description: "A flat-front trouser in a mid-weight wool blend, cut for a clean line from waist to break.",
    images: placeholderPair("flat-front-trouser", "a flat-front trouser"),
  },
  {
    slug: "oxford-shirt",
    category: "corporate",
    name: "Oxford Shirt",
    detail: "Corporate",
    description: "A made-to-measure oxford shirt in brushed cotton, built to hold its shape through a long day.",
    images: placeholderPair("oxford-shirt", "an oxford shirt"),
  },
  {
    slug: "linen-shirt",
    category: "casual",
    name: "Linen Shirt",
    detail: "Casual",
    description: "A relaxed linen shirt for warm-weather days, cut with a touch more room through the body.",
    images: placeholderPair("linen-shirt", "a linen shirt"),
  },
  {
    slug: "relaxed-chino",
    category: "casual",
    name: "Relaxed Chino",
    detail: "Casual",
    description: "A tapered chino in soft cotton twill, made to move between a Saturday errand and dinner out.",
    images: placeholderPair("relaxed-chino", "a relaxed chino"),
  },
  {
    slug: "weekend-overshirt",
    category: "casual",
    name: "Weekend Overshirt",
    detail: "Casual",
    description: "An unstructured overshirt in brushed cotton, layered easily over a tee or worn open.",
    images: placeholderPair("weekend-overshirt", "a weekend overshirt"),
  },
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
