import { cookies } from "next/headers";

const COOKIE_NAME = "bodmans_admin";

export type AdminSession = {
  email: string;
  secret: string;
};

function encodeSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string): AdminSession | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;

    const email = String(parsed.email ?? "").trim().toLowerCase();
    const secret = String(parsed.secret ?? "").trim();

    if (!email || !secret) return null;
    return { email, secret };
  } catch {
    return null;
  }
}

export async function createAdminSession(
  email: string,
  secret: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSecret = secret.trim();

  if (!normalizedEmail || !normalizedSecret) {
    throw new Error("Admin credentials are required.");
  }

  const store = await cookies();
  store.set(
    COOKIE_NAME,
    encodeSession({
      email: normalizedEmail,
      secret: normalizedSecret,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  );
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

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return decodeSession(value);
}
