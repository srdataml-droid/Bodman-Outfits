export const ENQUIRY_SUBJECTS = ["bespoke", "fitting", "custom-request", "general"] as const;

export interface EnquiryRequest {
  name: string;
  email: string;
  phone?: string;
  subject: (typeof ENQUIRY_SUBJECTS)[number];
  message: string;
}

// Browser-visible on purpose, same as lib/appointments.ts: the contact form
// posts directly from the browser so the API's per-IP rate limiter sees the
// real client address rather than the web server's. A real deployment must
// set NEXT_PUBLIC_API_URL; the localhost fallback matches the convention
// already used across this lib directory.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SubmitOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "rate-limited" | "unavailable" };

// Returns a discriminated outcome rather than throwing. A silent success on
// a failed request is the one unacceptable outcome here: it would tell a
// customer their message was sent when the atelier never received it.
export async function submitEnquiry(request: EnquiryRequest): Promise<SubmitOutcome> {
  try {
    const response = await fetch(`${API_URL}/api/enquiries`, {
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
