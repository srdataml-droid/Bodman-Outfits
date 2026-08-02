import type { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// `sameSite: "lax"` assumes the admin frontend and this API share a
// registrable domain (true for localhost across ports, and for a typical
// same-apex-domain production deploy). Revisit to "none" (+ secure) only if
// they ever end up on genuinely different registrable domains.
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  };
}

export function clearedSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
