import { NextResponse } from "next/server";
import {
  clearAdminSession,
  getAdminSession,
} from "../../../../lib/admin-auth";
import { verifyAppsScriptAdminSecret } from "../../../../lib/google-sheets";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  const valid = await verifyAppsScriptAdminSecret(session.secret);
  if (!valid) {
    await clearAdminSession();
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  return NextResponse.json({ email: session.email });
}
