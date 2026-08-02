import { z } from "zod";

// Mirrors the ShopSettings interface documented in docs/api.md exactly —
// do not add or rename fields here without updating that contract first.
export const shopSettingsSchema = z.object({
  shopName: z.string(),
  tagline: z.string(),
  phone: z.string(),
  whatsappNumber: z.string(),
  email: z.string(),
  address: z.string(),
  cityCountry: z.string(),
  hoursWeekday: z.string(),
  hoursSaturday: z.string(),
  hoursSunday: z.string(),
  pricingNote: z.string(),
  depositPercentage: z.number(),
});

export type ShopSettingsDto = z.infer<typeof shopSettingsSchema>;

export const updateShopSettingsSchema = shopSettingsSchema.partial();

export type UpdateShopSettingsDto = z.infer<typeof updateShopSettingsSchema>;
