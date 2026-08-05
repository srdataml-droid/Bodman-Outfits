"use client";

// Browser-visible base URL, same variable the public forms use.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;
  preferredTime: "morning" | "afternoon" | "evening";
  category: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
}

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

// Read from the API's own enums rather than restated by hand. If a value is
// ever added server-side, TypeScript will flag every switch that misses it.
export const APPOINTMENT_STATUSES = ["pending", "confirmed", "declined"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const ENQUIRY_STATUSES = ["unread", "replied"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface CustomRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  category: string | null;
  status: CustomRequestStatus;
  declineReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  source: "appointment" | "enquiry" | "customRequest" | null;
  sourceId: string | null;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  notes: string | null;
  totalAmount: string | null;
  depositAmount: string | null;
  currency: string | null;
  createdAt: string;
}

export const CUSTOM_REQUEST_STATUSES = ["pending_review", "accepted", "declined"] as const;
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];

export const ORDER_STATUSES = ["draft", "in_production", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Garment {
  id: string;
  slug: string;
  category: string;
  name: string;
  detail: string;
  description: string;
  imageFlat: string;
  imageOnForm: string;
  altFlat: string;
  altOnForm: string;
  /** Naira. Null means "inherit the category's confirmed starting price". */
  startingPrice: number | null;
  active: boolean;
  sortOrder: number;
}

/** Mirrors GARMENT_CATEGORIES in apps/api/src/garments/garments.schema.ts. */
export const GARMENT_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate"] as const;

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

/**
 * Every admin call goes through here.
 *
 * `credentials: "include"` is required and easy to forget: the session
 * cookie is httpOnly and set by the API on a different origin in
 * development (:4000 vs :3000), so without it the browser simply omits the
 * cookie and every request looks unauthenticated for no visible reason.
 *
 * Errors are returned rather than thrown so each screen decides what to do.
 * A 401 in particular is not an error condition to display, it means the
 * session is gone and the caller should send the user back to login.
 */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<AdminResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      // Admin data must never be served stale from a cache.
      cache: "no-store",
    });

    if (response.status === 204) return { ok: true, data: undefined as T };

    if (!response.ok) {
      // Rate limiting deserves its own wording. NestJS returns the raw
      // "ThrottlerException: Too Many Requests" string, which is meaningless
      // to whoever is running the shop and reads like a crash.
      if (response.status === 429) {
        return {
          ok: false,
          status: 429,
          message: "Too many requests in a short time. Wait a moment, then reload.",
        };
      }
      let message = `Request failed (${response.status})`;
      try {
        const body = (await response.json()) as { message?: unknown };
        if (typeof body.message === "string") message = body.message;
      } catch {
        // Body was not JSON; the status-based message above is fine.
      }
      return { ok: false, status: response.status, message };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server." };
  }
}

export const adminApi = {
  me: () => adminFetch<{ id: string; email: string }>("/api/auth/me"),
  login: (email: string, password: string) =>
    adminFetch<{ email: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => adminFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    adminFetch<{ ok: true }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  changeEmail: (currentPassword: string, newEmail: string) =>
    adminFetch<{ email: string }>("/api/auth/change-email", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newEmail }),
    }),

  appointments: () => adminFetch<Appointment[]>("/api/appointments"),
  setAppointmentStatus: (id: string, status: AppointmentStatus) =>
    adminFetch<Appointment>(`/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  enquiries: () => adminFetch<Enquiry[]>("/api/enquiries"),
  setEnquiryStatus: (id: string, status: EnquiryStatus) =>
    adminFetch<Enquiry>(`/api/enquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  shopSettings: () => adminFetch<ShopSettings>("/api/shop-settings"),
  saveShopSettings: (patch: Partial<ShopSettings>) =>
    adminFetch<ShopSettings>("/api/shop-settings", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  customRequests: () => adminFetch<CustomRequest[]>("/api/custom-requests"),
  reviewCustomRequest: (id: string, status: CustomRequestStatus, declineReason?: string) =>
    adminFetch<CustomRequest>(`/api/custom-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(declineReason ? { declineReason } : {}) }),
    }),

  // "all" rather than the public list: the dashboard must show deactivated
  // garments, which the public endpoint deliberately cannot return.
  garments: () => adminFetch<Garment[]>("/api/garments/all"),
  createGarment: (input: Omit<Garment, "id">) =>
    adminFetch<Garment>("/api/garments", { method: "POST", body: JSON.stringify(input) }),
  updateGarment: (id: string, patch: Partial<Omit<Garment, "id">>) =>
    adminFetch<Garment>(`/api/garments/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  setGarmentActive: (id: string, active: boolean) =>
    adminFetch<Garment>(`/api/garments/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  deleteGarment: (id: string) => adminFetch<void>(`/api/garments/${id}`, { method: "DELETE" }),

  orders: () => adminFetch<Order[]>("/api/orders"),
  createOrder: (input: {
    source: "appointment" | "enquiry" | "customRequest";
    sourceId: string;
    customerName: string;
    customerPhone: string;
    notes?: string;
  }) => adminFetch<Order>("/api/orders", { method: "POST", body: JSON.stringify(input) }),
  updateOrder: (
    id: string,
    patch: { status?: OrderStatus; notes?: string; totalAmount?: string; depositAmount?: string; currency?: string },
  ) => adminFetch<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  faqs: () => adminFetch<Faq[]>("/api/faqs"),
  createFaq: (input: Omit<Faq, "id">) =>
    adminFetch<Faq>("/api/faqs", { method: "POST", body: JSON.stringify(input) }),
  updateFaq: (id: string, patch: Partial<Omit<Faq, "id">>) =>
    adminFetch<Faq>(`/api/faqs/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteFaq: (id: string) => adminFetch<void>(`/api/faqs/${id}`, { method: "DELETE" }),
};
