import { z } from "zod";

// Mirrors the options in apps/web/components/enquiry-form.tsx exactly. Kept
// as an explicit allowlist rather than a database enum — see the comment on
// Enquiry.subject in prisma/schema.prisma. If the form gains an option, add
// it here too.
export const ENQUIRY_SUBJECTS = ["bespoke", "fitting", "custom-request", "general"] as const;

export const ENQUIRY_STATUSES = ["unread", "replied"] as const;

// Same reasoning as appointments: this is an open, unauthenticated write
// endpoint, so every free-text field needs an upper bound. `message` is
// allowed more room than an appointment's `notes` because it is the whole
// point of the form rather than an afterthought.
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_PHONE = 40;
const MAX_MESSAGE = 5000;

export const createEnquirySchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  // Required here, unlike on appointments. The contact form has no other
  // guaranteed way to reply.
  email: z.string().trim().min(1).max(MAX_EMAIL).email(),
  // The form submits "" when left blank, so empty is normalised to absent
  // rather than stored as an empty string.
  phone: z
    .string()
    .trim()
    .max(MAX_PHONE)
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  subject: z.enum(ENQUIRY_SUBJECTS),
  message: z.string().trim().min(1).max(MAX_MESSAGE),
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;

// Public POST response: minimal, same as appointments. A reference id and
// the server-assigned status, nothing echoed back.
export interface EnquiryReceiptDto {
  id: string;
  status: (typeof ENQUIRY_STATUSES)[number];
}

export interface EnquiryDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: (typeof ENQUIRY_STATUSES)[number];
  createdAt: string;
}

// Admin status transition. Same reasoning as appointments: status is the
// only mutable field, so an admin cannot rewrite what a customer wrote.
export const updateEnquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export type UpdateEnquiryStatusDto = z.infer<typeof updateEnquiryStatusSchema>;
