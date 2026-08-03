import { z } from "zod";

export const CUSTOM_REQUEST_STATUSES = ["pending_review", "accepted", "declined"] as const;
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];

// Catalogue categories, optional here: a custom request starts from the
// customer's own idea, so it need not belong to an existing category.
export const CUSTOM_REQUEST_CATEGORIES = ["suits", "corporate", "casual"] as const;

const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_PHONE = 40;
// Longer than an enquiry message: this field is where the customer describes
// a garment that does not exist yet, which is the whole point of the form.
const MAX_DESCRIPTION = 6000;

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
  category: string | null;
  status: CustomRequestStatus;
  declineReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
