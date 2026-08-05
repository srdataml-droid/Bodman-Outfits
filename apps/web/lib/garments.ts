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

/**
 * What a starting price is actually charged against.
 *
 * This distinction is not cosmetic and must never be dropped from a price
 * display. Suits, agbada and kaftan are priced per garment. Casuals and
 * corporate are priced per COMPLETE OUTFIT, meaning shirt and trousers
 * together, not either piece alone. The five lines sit next to each other on
 * the catalogue index and in the hero carousel, so a bare figure would invite
 * a customer to read casuals at 90,000 as the price of one shirt.
 */
export type PriceUnit = "item" | "outfit";

export interface CategoryPrice {
  /**
   * Naira. ALWAYS a minimum, never a fixed or final figure: the real price
   * moves up with the specific piece and is negotiable on quantity. Anything
   * rendering this must say "From", which is why `formatStartingPrice` below
   * exists and why no component should format the number itself.
   */
  from: number;
  unit: PriceUnit;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  /** Confirmed by the owner on 2026-08-04. See logs/decisions.md. */
  price: CategoryPrice;
  images: GarmentImagePair;
}

/**
 * The single place a naira figure becomes display text.
 *
 * Centralised so "From" can never be forgotten at a call site. Every one of
 * the five prices is a starting point, so there is no variant of this that
 * renders a bare amount.
 */
export function formatStartingPrice(price: CategoryPrice): string {
  return `From ₦${price.from.toLocaleString("en-NG")}`;
}

/** Short qualifier, for use directly beside the figure. */
export function priceUnitLabel(price: CategoryPrice): string {
  return price.unit === "outfit" ? "per complete outfit" : "per item";
}

/**
 * The unambiguous version, for the category pages where a customer is
 * actually deciding. Spells out what an outfit contains rather than assuming
 * "outfit" is self-explanatory.
 */
export function priceUnitDetail(price: CategoryPrice): string {
  return price.unit === "outfit"
    ? "for the complete outfit, shirt and trousers together, not either piece on its own"
    : "per item";
}

/**
 * Shown wherever a price is. Says prices move upward and are negotiable in
 * quantity WITHOUT naming a discount structure, because no discount structure
 * has been decided. Deliberately not a calculator.
 */
export const PRICING_QUALIFIER =
  "Starting prices. The final figure depends on the piece, the cloth and the detail you choose, and is negotiable on larger orders.";

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
    price: { from: 70000, unit: "item" },
    images: placeholderPair("category-suits", "the suits line"),
  },
  {
    slug: "agbada",
    name: "Agbada",
    tagline: "Ceremonial & occasion",
    description: "Flowing, layered pieces for the occasions that ask for them.",
    price: { from: 70000, unit: "item" },
    images: placeholderPair("category-agbada", "the agbada line"),
  },
  {
    slug: "kaftan",
    name: "Kaftan",
    tagline: "Everyday & occasion",
    description: "Clean-lined kaftans, cut to move.",
    price: { from: 25000, unit: "item" },
    images: placeholderPair("category-kaftan", "the kaftan line"),
  },
  {
    slug: "casuals",
    name: "Casuals",
    tagline: "Shirts & trousers",
    description: "Off-duty pieces that keep the same discipline of cut, just without the tie.",
    price: { from: 90000, unit: "outfit" },
    images: placeholderPair("category-casuals", "the casuals line"),
  },
  {
    slug: "corporate",
    name: "Corporate",
    tagline: "Shirts & trousers",
    description: "Separates built for the working week. Mix, match, and repeat without the garment giving up on you.",
    price: { from: 120000, unit: "outfit" },
    images: placeholderPair("category-corporate", "the corporate line"),
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
