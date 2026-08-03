import { Throttle } from "@nestjs/throttler";

/**
 * Rate limiting is split by who the endpoint is for, rather than raised
 * globally.
 *
 * The public surface is the spam surface: anonymous submission endpoints are
 * what an abuser targets, so those keep a tight budget. Authenticated admin
 * routes are a different risk profile entirely (the caller already proved
 * they hold the account) and their traffic is bursty by nature, because a
 * single dashboard navigation costs a session check plus the screen's data.
 * Raising the global ceiling to accommodate that would have loosened the
 * limit exactly where it does the work.
 *
 * Note NestJS keys throttle counters per route as well as per IP, so these
 * budgets are per-endpoint rather than shared across the whole API.
 */

/** Generous budget for routes behind AdminAuthGuard. */
export const ADMIN_THROTTLE = { default: { limit: 1200, ttl: 60_000 } };

/** Tight budget for anonymous write endpoints. Matches the login limit. */
export const PUBLIC_WRITE_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

export const AdminThrottle = (): MethodDecorator & ClassDecorator => Throttle(ADMIN_THROTTLE);

export const PublicWriteThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle(PUBLIC_WRITE_THROTTLE);
