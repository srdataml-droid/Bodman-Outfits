export const APPOINTMENT_TIMES = ["morning", "afternoon", "evening"] as const;

export const APPOINTMENT_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate", "not-sure"] as const;

export interface AppointmentRequest {
  name: string;
  email: string;
  phone?: string;
  preferredDate: string;
  preferredTime: (typeof APPOINTMENT_TIMES)[number];
  category: (typeof APPOINTMENT_CATEGORIES)[number];
  notes?: string;
}

// Browser-visible on purpose (NEXT_PUBLIC_), unlike the server-only API_URL
// used by shop-settings.ts and faq-data.ts. The appointment form is a client
// component and posts directly from the browser, which keeps the real client
// IP visible to the API's per-IP rate limiter — proxying through a Next.js
// route handler would make every submission appear to come from the single
// server address and turn that limit into a global one.
//
// The localhost fallback matches the existing convention in the two server
// libs above, so local development needs no extra configuration. A real
// deployment MUST set NEXT_PUBLIC_API_URL — see docs/api.md.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SubmitOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "rate-limited" | "unavailable" };

// Longer than the server-side build-time timeouts elsewhere in this repo,
// since this runs in a customer's browser rather than blocking a build — but
// still bounded, so a cold/asleep API leaves the submit button in a clear
// "unavailable" state within 10s rather than spinning indefinitely.
const SUBMIT_TIMEOUT_MS = 10000;

// Returns a discriminated outcome rather than throwing, so the form can show
// a specific, honest message for each failure instead of a generic one. A
// silent success on a failed request would be the worst option here: the
// customer would believe a request was sent that the atelier never received.
export async function submitAppointment(request: AppointmentRequest): Promise<SubmitOutcome> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}