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
    /*
     * Both contact fields are optional individually and jointly required by
     * the refinement below.
     *
     * `customerPhone` used to be mandatory, and that is exactly why the admin
     * screen wrote `phone ?? email` into it: a custom request carries an
     * optional phone and a required email, so the only way past the validator
     * was to put an address in the phone column. That produced orders the shop
     * would try to telephone at an email address, and - since nothing then
     * filled `customerEmail` - orders that could never be told they were ready.
     *
     * What an order actually needs is a way to reach the customer, not a phone
     * specifically. That is what is enforced now.
     */
    customerPhone: z.string().trim().max(MAX_PHONE).optional().or(z.literal("").transform(() => undefined)),
    customerEmail: z.string().trim().email().max(254).optional().or(z.literal("").transform(() => undefined)),
    notes: z.string().trim().max(MAX_NOTES).optional().or(z.literal("").transform(() => undefined)),
    // All pricing is optional and stays that way. No pricing or deposit
    // policy exists, so an order can be tracked without one.
    totalAmount: money,
    depositAmount: money,
    currency: z.string().trim().max(MAX_CURRENCY).optional().or(z.literal("").transform(() => undefined)),
  })
  .strict()
  .refine((o) => Boolean(o.customerPhone) || Boolean(o.customerEmail), {
    message: "An order needs at least one of customerPhone or customerEmail - otherwise nobody can be told it is ready.",
    path: ["customerPhone"],
  });
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
  // Nullable to match the column. At least one of these is always present -
  // the create schema refuses an order that nobody could be contacted about.
  customerPhone: string | null;
  customerEmail: string | null;
  status: OrderStatus;
  notes: string | null;
  totalAmount: string | null;
  depositAmount: string | null;
  currency: string | null;
  createdAt: string;
}
