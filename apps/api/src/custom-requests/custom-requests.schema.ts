import { z } from "zod";

export const CUSTOM_REQUEST_STATUSES = ["pending_review", "accepted", "declined"] as const;
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];

// Catalogue categories, optional here: a custom request starts from the
// customer's own idea, so it need not belong to an existing category.
export const CUSTOM_REQUEST_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate"] as const;

const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_PHONE = 40;
// Longer than an enquiry message: this field is where the customer describes
// a garment that does not exist yet, which is the whole point of the form.
const MAX_DESCRIPTION = 6000;
const MAX_OCCASION = 120;

const optional = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? undefined : v)).optional();

export const createCustomRequestSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  email: z.string().trim().min(1).max(MAX_EMAIL).email(),
  phone: optional(MAX_PHONE),
  description: z.string().trim().min(1).max(MAX_DESCRIPTION),
  category: z
    .enum(CUSTOM_REQUEST_CATEGORIES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  /*
   * The two questions a tailor asks before anything else, captured as data
   * rather than left inside the description paragraph.
   *
   * `neededBy` is the one that decides whether the job can be taken at all -
   * a wedding in nine days is a different answer from one in nine weeks - and
   * as a date it can be sorted and filtered, which a sentence cannot.
   * `occasion` shapes the cut and the cloth.
   *
   * Both optional: a customer who only knows they want "something like the
   * navy one" should not be blocked from asking.
   */
  occasion: optional(MAX_OCCASION),
  neededBy: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type CreateCustomRequestDto = z.infer<typeof createCustomRequestSchema>;

// Declining requires a reason, per the atelier-frontend skill. Expressed as
// a refinement rather than a database constraint because "required only when
// status is declined" is conditional.
export const reviewCustomRequestSchema = z
  .object({
    status: z.enum(CUSTOM_REQUEST_STATUSES),
    declineReason: optional(2000),
  })
  .refine((v) => v.status !== "declined" || (v.declineReason ?? "").length > 0, {
    message: "A reason is required when declining a request",
    path: ["declineReason"],
  });
export type ReviewCustomRequestDto = z.infer<typeof reviewCustomRequestSchema>;

export interface CustomRequestReceiptDto {
  id: string;
  status: CustomRequestStatus;
}

export interface CustomRequestDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  occasion: string | null;
  /** Date-only, `YYYY-MM-DD`, as `Appointment.preferredDate` is sent. */
  neededBy: string | null;
  category: string | null;
  status: CustomRequestStatus;
  declineReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
