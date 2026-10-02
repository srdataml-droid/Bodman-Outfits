export interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  cityCountry: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  pricingNote: string;
  depositPercentage: number;
}

export const SHOP_NAME_FALLBACK = "Bodman Outfits";

/**
 * Prototype settings.
 *
 * The old version fetched these from the retired Nest/Postgres API on every
 * server render. That added a multi-second timeout to otherwise static pages
 * whenever the old backend was asleep or unavailable. Keep the confirmed
 * business details local for this Sheets prototype; move them into a Settings
 * sheet later if the owner wants them admin-editable again.
 */
const PROTOTYPE_SETTINGS: ShopSettings = {
  shopName: "Bodman Outfits",
  tagline: "Redefining modern sartorial heritage from the heart of Lagos.",
  phone: "",
  whatsappNumber: "+234 706 131 3517",
  email: "",
  address: "No. 3 Oduselu Street, off Johnson bus stop, along Ijesha Road",
  cityCountry: "Surulere, Lagos",
  hoursWeekday: "9am–7pm",
  hoursSaturday: "9am–7pm",
  hoursSunday: "Closed",
  pricingNote: "",
  depositPercentage: 60,
};

export async function getShopSettings(): Promise<ShopSettings> {
  return PROTOTYPE_SETTINGS;
}

function normalizeWhatsAppNumber(rawNumber: string): string {
  const digitsOnly = rawNumber.replace(/[+\s]/g, "");
  return digitsOnly.replace(/^0/, "");
}

export async function getWhatsAppLink(prefillText?: string): Promise<string> {
  const normalized = normalizeWhatsAppNumber(PROTOTYPE_SETTINGS.whatsappNumber);
  const query = prefillText ? `?text=${encodeURIComponent(prefillText)}` : "";
  return `https://wa.me/${normalized}${query}`;
}

export async function getShopName(): Promise<string> {
  return PROTOTYPE_SETTINGS.shopName || SHOP_NAME_FALLBACK;
}
