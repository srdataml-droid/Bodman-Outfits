import { NextResponse } from "next/server";
import { appendToOperationsSheet } from "../../../lib/google-sheets";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as Record<string, unknown>;
    if (!String(data.name ?? "").trim() || !String(data.email ?? "").trim() || !String(data.description ?? "").trim()) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const id = await appendToOperationsSheet("commission", data);
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
