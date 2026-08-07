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

// How long to wait before giving up on the API and falling back. Kept well
// under Vercel's per-page build timeout so a cold/asleep backend degrades
// gracefully (fallback content) instead of hanging the whole build — this is
// what previously caused /about, /_not-found, and every /admin/* page to
// time out together, since all of them go through the root layout, which
// calls this on every request.
const FETCH_TIMEOUT_MS = 5000;

// Server-only fetch (never exposed to the browser bundle — no
// NEXT_PUBLIC_ prefix). Returns null on any failure OR timeout rather than
// throwing or hanging, so a backend outage or cold start degrades individual
// WhatsApp entry points instead of blocking every page's build.
export async function getShopSettings(): Promise<ShopSettings | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/api/shop-settings`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as ShopSettings;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
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