import { z } from "zod";

// Mirrors FaqEntry in apps/web/lib/faq-data.ts. `category` is nullable to
// match the Prisma model's optional field.
export const faqSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string().nullable(),
  sortOrder: z.number(),
});

export type FaqDto = z.infer<typeof faqSchema>;

// Admin write contracts. Length caps are lower-stakes than on the public
// endpoints (these are behind AdminAuthGuard) but still bounded, so a
// mis-scripted admin client cannot push unbounded text into the database.
const MAX_QUESTION = 300;
const MAX_ANSWER = 5000;
const MAX_CATEGORY = 80;

export const createFaqSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION),
  answer: z.string().trim().min(1).max(MAX_ANSWER),
  // Empty string is normalised to null so grouping stays genuinely optional
  // rather than producing a category literally named "".
  category: z
    .string()
    .trim()
    .max(MAX_CATEGORY)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).max(10_000),
});

export type CreateFaqDto = z.infer<typeof createFaqSchema>;

// Partial: the dashboard edits one field at a time (including reordering,
// which sends only sortOrder), so requiring the whole object would force the
// client to round-trip fields it is not changing.
export const updateFaqSchema = createFaqSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one field must be provided" },
);

export type UpdateFaqDto = z.infer<typeof updateFaqSchema>;
