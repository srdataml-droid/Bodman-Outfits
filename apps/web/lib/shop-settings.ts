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

/**
 * Fallback display name.
 *
 * The real name lives in ShopSettings and is Admin-editable, per AGENTS.md
 * ("shop details are database-managed, editable Admin content, not frontend
 * constants"). This constant exists only so the site still has a name to show
 * when the API is unreachable, and for the static page descriptions that are
 * exported at build time and cannot await a fetch.
 *
 * If the business is renamed, change it in the Admin dashboard. This value is
 * the safety net, not the source of truth.
 */
export const SHOP_NAME_FALLBACK = "Bodman Outfits";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Server-only fetch (never exposed to the browser bundle — no
// NEXT_PUBLIC_ prefix). Returns null on any failure rather than throwing,
// so a backend outage degrades individual WhatsApp entry points instead of
// crashing pages that don't otherwise depend on this data.
export async function getShopSettings(): Promise<ShopSettings | null> {
  try {
    const response = await fetch(`${API_URL}/api/shop-settings`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as ShopSettings;
  } catch {
    return null;
  }
}

function normalizeWhatsAppNumber(rawNumber: string): string {
  const digitsOnly = rawNumber.replace(/[+\s]/g, "");
  return digitsOnly.replace(/^0/, "");
}

export async function getWhatsAppLink(prefillText?: string): Promise<string | null> {
  const settings = await getShopSettings();
  if (!settings) return null;
  const normalized = normalizeWhatsAppNumber(settings.whatsappNumber);
  const query = prefillText ? `?text=${encodeURIComponent(prefillText)}` : "";
  return `https://wa.me/${normalized}${query}`;
}

/** Display name, from the database, falling back if the API is unreachable. */
export async function getShopName(): Promise<string> {
  const settings = await getShopSettings();
  return settings?.shopName?.trim() || SHOP_NAME_FALLBACK;
}
