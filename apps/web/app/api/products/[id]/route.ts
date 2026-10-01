import { NextResponse } from "next/server";

const SCRIPT_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
const SECRET = process.env.GOOGLE_SHEETS_SHARED_SECRET;

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!SCRIPT_URL || !SECRET) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const { id } = await context.params;
  try {
    const data = (await request.json()) as Record<string, unknown>;
    const response = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ secret: SECRET, kind: "product-upsert", data: { ...data, id } }), cache: "no-store" });
    const body = (await response.json()) as { ok?: boolean };
    if (!body.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json({ ...data, id });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 503 }); }
}
