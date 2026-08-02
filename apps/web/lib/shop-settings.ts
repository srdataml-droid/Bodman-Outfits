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
