import type { MetadataRoute } from "next";
import { categories } from "../lib/garments";
import { SITE_URL } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/catalogue", "/faq", "/contact", "/appointment"];

  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...categories.map((category) => ({ url: `${SITE_URL}/catalogue/${category.slug}` })),
  ];
}
