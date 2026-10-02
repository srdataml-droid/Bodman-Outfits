import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json(session);
}
