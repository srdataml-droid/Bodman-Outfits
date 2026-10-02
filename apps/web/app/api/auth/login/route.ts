import { NextResponse } from "next/server";
import { createAdminSession } from "../../../../lib/admin-auth";
import { verifyAppsScriptAdminSecret } from "../../../../lib/google-sheets";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const valid = await verifyAppsScriptAdminSecret(password);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createAdminSession(email, password);
    return NextResponse.json({ email });
  } catch {
    return NextResponse.json(
      { message: "Admin login is temporarily unavailable." },
      { status: 503 },
    );
  }
}
