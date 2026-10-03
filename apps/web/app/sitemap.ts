import type { MetadataRoute } from "next";
import { categories } from "../lib/garments";
import { getGarments } from "../lib/garments-data";
import { SITE_URL } from "../lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/catalogue", "/faq", "/contact", "/appointment"];
  const garments = await getGarments();

  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...categories.map((category) => ({ url: `${SITE_URL}/catalogue/${category.slug}` })),
    ...garments.map((garment) => ({ url: `${SITE_URL}/catalogue/${garment.category}/${garment.slug}` })),
  ];
}
