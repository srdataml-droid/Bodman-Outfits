import { z } from "zod";

/**
 * Order status lifecycle.
 *
 * Deliberately coarse. AGENTS.md describes a workflow involving measurements,
 * fittings, production and delivery, but the actual stages this atelier works
 * in have not been confirmed, and inventing five plausible-sounding
 * production steps would be inventing business process. These five are broad
 * enough to be true of any made-to-order workshop. Refine them once the real
 * workflow is described. See docs/api.md.
 */
export const ORDER_STATUSES = ["draft", "in_production", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_SOURCES = ["appointment", "enquiry", "customRequest"] as const;

const MAX_NAME = 120;
const MAX_PHONE = 40;
const MAX_NOTES = 5000;
const MAX_CURRENCY = 8;

// Money is accepted as a string and stored as Decimal. Accepting a JS number
// would round-trip through binary floating point before it ever reached the
// database, which is the exact bug Decimal exists to avoid.
const money = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Expected an amount like 125000 or 125000.50")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createOrderSchema = z
  .object({
    source: z.enum(ORDER_SOURCES),
    sourceId: z.string().trim().min(1),
    customerName: z.string().trim().min(1).max(MAX_NAME),
    customerPhone: z.string().trim().min(1).max(MAX_PHONE),
    notes: z.string().trim().max(MAX_NOTES).optional().or(z.literal("").transform(() => undefined)),
    // All pricing is optional and stays that way. No pricing or deposit
    // policy exists, so an order can be tracked without one.
    totalAmount: money,
    depositAmount: money,
    currency: z.string().trim().max(MAX_CURRENCY).optional().or(z.literal("").transform(() => undefined)),
  })
  .strict();
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    notes: z.string().trim().max(MAX_NOTES).optional().or(z.literal("").transform(() => undefined)),
    totalAmount: money,
    depositAmount: money,
    currency: z.string().trim().max(MAX_CURRENCY).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field must be provided" });
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;

export interface OrderDto {
  id: string;
  source: (typeof ORDER_SOURCES)[number] | null;
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
