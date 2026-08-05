import { z } from "zod";

/**
 * The five catalogue lines.
 *
 * Duplicated from apps/web/lib/garments.ts rather than imported: apps/api and
 * apps/web are separate builds with no shared package, and the same
 * duplication already exists for APPOINTMENT_CATEGORIES. If a sixth line is
 * ever confirmed, both lists change together.
 */
export const GARMENT_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate"] as const;

export const garmentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  category: z.string(),
  name: z.string(),
  detail: z.string(),
  description: z.string(),
  imageFlat: z.string(),
  imageOnForm: z.string(),
  altFlat: z.string(),
  altOnForm: z.string(),
  startingPrice: z.number().nullable(),
  active: z.boolean(),
  sortOrder: z.number(),
});

export type GarmentDto = z.infer<typeof garmentSchema>;

const MAX_SLUG = 80;
const MAX_NAME = 120;
const MAX_DETAIL = 80;
const MAX_DESCRIPTION = 2000;
const MAX_PATH = 300;
const MAX_ALT = 300;

/**
 * Image paths are entered by hand until an upload feature exists, so this is
 * the only thing standing between a typo and a broken catalogue card.
 *
 * Constrained to a site-relative path under /images/ specifically. Rejecting
 * absolute URLs is deliberate: allowing `https://…` would let an admin point
 * the catalogue at a third-party host, which is both a privacy leak (the
 * visitor's IP goes to that host) and an availability risk. The character
 * class also forecloses `../` traversal.
 */
const imagePath = z
  .string()
  .trim()
  .max(MAX_PATH)
  .regex(
    /^\/images\/[A-Za-z0-9._/-]+\.(png|jpg|jpeg|webp|avif)$/,
    "Must be a site-relative path under /images/ ending in .png, .jpg, .jpeg, .webp or .avif",
  );

// Lowercase, digits and single hyphens. This becomes part of a public URL
// (/catalogue/<category>/<slug>), so anything needing escaping is rejected
// rather than silently encoded.
const slug = z
  .string()
  .trim()
  .max(MAX_SLUG)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and single hyphens only");

export const createGarmentSchema = z.object({
  slug,
  category: z.enum(GARMENT_CATEGORIES),
  name: z.string().trim().min(1).max(MAX_NAME),
  detail: z.string().trim().min(1).max(MAX_DETAIL),
  description: z.string().trim().min(1).max(MAX_DESCRIPTION),
  imageFlat: imagePath,
  imageOnForm: imagePath,
  altFlat: z.string().trim().min(1).max(MAX_ALT),
  altOnForm: z.string().trim().min(1).max(MAX_ALT),
  /*
   * Null means "inherit the category's confirmed starting price", which is
   * the normal case. It is NOT the same as 0, and the admin UI must not
   * default an empty field to zero: a garment priced at ₦0 published to a
   * real site is worse than one showing the line price.
   */
  startingPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export type CreateGarmentDto = z.infer<typeof createGarmentSchema>;

// Partial, matching the FAQ pattern: the dashboard edits one field at a time,
// and deactivating sends only `active`.
export const updateGarmentSchema = createGarmentSchema.partial();

export type UpdateGarmentDto = z.infer<typeof updateGarmentSchema>;
