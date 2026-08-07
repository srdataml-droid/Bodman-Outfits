export interface FaqEntry {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  sortOrder: number;
}

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Kept well under Vercel's per-page build timeout, same reasoning as
// garments-data.ts and shop-settings.ts — this is the same bug pattern
// repeated a third time, not a new one.
const FETCH_TIMEOUT_MS = 5000;

// Server-only fetch (never exposed to the browser bundle — no
// NEXT_PUBLIC_ prefix). Returns null on any failure OR timeout rather than
// throwing or silently returning an empty array — an empty array would read
// as "there are no FAQs," which is different from and more misleading than
// "the FAQs failed to load." The FAQ page distinguishes these and shows
// an honest unavailable state rather than an empty list.
export async function getFaqEntries(): Promise<FaqEntry[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/api/faqs`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as FaqEntry[];
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}