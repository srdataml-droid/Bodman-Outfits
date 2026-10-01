import type { GarmentImagePair } from "./garments";
import { getProducts } from "./google-sheets";

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
    const products = await getProducts();
    return products
      .filter((product) => product.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
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
