export const CUSTOM_REQUEST_CATEGORIES = ["suits", "corporate", "casual"] as const;

export interface CustomRequestSubmission {
  name: string;
  email: string;
  phone?: string;
  description: string;
  category?: (typeof CUSTOM_REQUEST_CATEGORIES)[number] | "";
}

// Browser-visible, same as the other public forms, so the API's per-IP rate
// limiter sees the real client rather than the web server.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SubmitOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "rate-limited" | "unavailable" };

export async function submitCustomRequest(request: CustomRequestSubmission): Promise<SubmitOutcome> {
  try {
    const response = await fetch(`${API_URL}/api/custom-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.ok) {
      const body = (await response.json()) as { id: string };
      return { ok: true, id: body.id };
    }
    if (response.status === 400) return { ok: false, reason: "invalid" };
    if (response.status === 429) return { ok: false, reason: "rate-limited" };
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
