import { z } from "zod";

// Mirrors the catalogue categories in apps/web/lib/garments.ts, plus the
// form's own "not-sure" escape hatch. Kept as an explicit allowlist here
// rather than a database enum — see the comment on Appointment.category in
// prisma/schema.prisma. If a catalogue category is added, add it here too.
export const APPOINTMENT_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate", "not-sure"] as const;

export const APPOINTMENT_TIMES = ["morning", "afternoon", "evening"] as const;

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "declined"] as const;

// Length caps matter more here than on the admin-only endpoints: this is an
// open, unauthenticated write endpoint, so an uncapped text field is a free
// way to push arbitrary volume into the database.
const MAX_NAME = 120;
const MAX_PHONE = 40;
const MAX_EMAIL = 200;
const MAX_NOTES = 2000;

// The form's optional fields submit "" rather than omitting the key, so
// empty strings are normalised to undefined before validation rather than
// being stored as empty rows in the database.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const createAppointmentSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  phone: z.string().trim().min(1).max(MAX_PHONE),
  email: optionalText(MAX_EMAIL).refine(
    (value) => value === undefined || z.string().email().safeParse(value).success,
    { message: "Invalid email address" },
  ),
  // Calendar day, not an instant. The regex enforces the shape; the refine
  // rejects dates that match the shape but do not exist (e.g. 2026-02-31),
  // which Date parsing would otherwise silently roll forward.
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, "Not a real calendar date"),
  preferredTime: z.enum(APPOINTMENT_TIMES),
  category: z.enum(APPOINTMENT_CATEGORIES),
  notes: optionalText(MAX_NOTES),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

// Public POST response: deliberately minimal. The caller already knows what
// they submitted; echoing it back adds nothing, so only the reference id and
// the server-assigned status are returned.
export interface AppointmentReceiptDto {
  id: string;
  status: (typeof APPOINTMENT_STATUSES)[number];
}

// Admin GET response: the full record.
export interface AppointmentDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;
  preferredTime: (typeof APPOINTMENT_TIMES)[number];
  category: string;
  notes: string | null;
  status: (typeof APPOINTMENT_STATUSES)[number];
  createdAt: string;
}

// Admin status transition. Deliberately the ONLY mutable field: an admin
// confirming a booking has no business rewriting the customer's name or
// requested date, and keeping the surface this narrow means a compromised
// admin session cannot quietly alter what a customer actually asked for.
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});

export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;
