import type { GarmentImagePair } from "./garments";

/**
 * Catalogue garments, read from the API rather than the static list that used
 * to live in `garments.ts`.
 *
 * CATEGORIES STILL COME FROM CODE. They carry the five confirmed prices, the
 * item-vs-outfit price unit and signed-off copy; only garments became
 * admin-editable. See the Garment model comment in prisma/schema.prisma.
 *
 * Every function here returns empty (or null) rather than throwing when the
 * API is unreachable, matching `getShopSettings`. A backend outage should
 * render a catalogue with no pieces and an honest empty state, not a 500 on
 * the customer's screen.
 */

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export interface GarmentRecord {
  id: string;
  slug: string;
  category: string;
  name: string;
  detail: string;
  description: string;
  imageFlat: string;
  imageOnForm: string;
  altFlat: string;
  altOnForm: string;
  /** Naira. Null means "inherit this category's confirmed starting price". */
  startingPrice: number | null;
  active: boolean;
  sortOrder: number;
}

/** Adapts a record to the shape `GarmentFigure` already expects. */
export function garmentImages(garment: GarmentRecord): GarmentImagePair {
  return {
    flat: garment.imageFlat,
    onForm: garment.imageOnForm,
    altFlat: garment.altFlat,
    altOnForm: garment.altOnForm,
  };
}

export async function getGarments(): Promise<GarmentRecord[]> {
  try {
    const response = await fetch(`${API_URL}/api/garments`, {
      // Same 5-minute window as shop settings and FAQs, so an admin edit
      // appears on the public site within five minutes without a deploy.
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    return (await response.json()) as GarmentRecord[];
  } catch {
    return [];
  }
}

export async function getGarmentsByCategory(category: string): Promise<GarmentRecord[]> {
  const garments = await getGarments();
  return garments.filter((garment) => garment.category === category);
}

export async function getGarment(
  category: string,
  slug: string,
): Promise<GarmentRecord | null> {
  const garments = await getGarments();
  return garments.find((g) => g.category === category && g.slug === slug) ?? null;
}
