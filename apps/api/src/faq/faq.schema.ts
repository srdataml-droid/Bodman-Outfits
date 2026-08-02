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
