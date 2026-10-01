import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/admin-auth";
import { getRequests } from "../../../lib/google-sheets";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json(await getRequests());
  } catch {
    return NextResponse.json(
      { message: "Requests are temporarily unavailable." },
      { status: 503 },
    );
  }
}
