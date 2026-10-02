import { NextResponse } from "next/server";
import {
  adminCredentialsConfigured,
  createAdminSession,
  verifyAdminCredentials,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!adminCredentialsConfigured()) {
    return NextResponse.json(
      { message: "Admin login is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createAdminSession(email);
    return NextResponse.json({ email: email.trim().toLowerCase() });
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
}
