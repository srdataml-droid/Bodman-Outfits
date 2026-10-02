import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bodmans_admin";

function credentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password =
    process.env.ADMIN_PASSWORD ||
    process.env.GOOGLE_APPS_SCRIPT_ADMIN_SECRET;

  if (!password) return null;
  return { email, password };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signature(email: string, password: string): string {
  return createHmac("sha256", password)
    .update(`bodmans-outfit-admin:${email}`)
    .digest("base64url");
}

function sessionValue(email: string, password: string): string {
  return `${Buffer.from(email).toString("base64url")}.${signature(email, password)}`;
}

export function adminCredentialsConfigured(): boolean {
  return credentials() !== null;
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expected = credentials();
  if (!expected) return false;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !safeEqual(password, expected.password)) return false;

  return expected.email ? safeEqual(normalizedEmail, expected.email) : true;
}

export async function createAdminSession(email: string): Promise<void> {
  const expected = credentials();
  if (!expected) throw new Error("Admin credentials are not configured.");

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Admin email is required.");

  const store = await cookies();
  store.set(COOKIE_NAME, sessionValue(normalizedEmail, expected.password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const expected = credentials();
  if (!expected) return null;

  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [encodedEmail, suppliedSignature] = value.split(".");
  if (!encodedEmail || !suppliedSignature) return null;

  try {
    const email = Buffer.from(encodedEmail, "base64url")
      .toString("utf8")
      .trim()
      .toLowerCase();
    const expectedSignature = signature(email, expected.password);

    if (!safeEqual(suppliedSignature, expectedSignature)) return null;
    if (expected.email && !safeEqual(email, expected.email)) return null;

    return { email };
  } catch {
    return null;
  }
}
