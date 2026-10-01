import { NextResponse } from "next/server";

const SCRIPT_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
const SECRET = process.env.GOOGLE_SHEETS_SHARED_SECRET;

export async function GET() {
  if (!SCRIPT_URL) return NextResponse.json([], { status: 200 });
  try {
    const response = await fetch(`${SCRIPT_URL}?resource=products`, { cache: "no-store" });
    const body = (await response.json()) as { ok?: boolean; products?: unknown[] };
    return NextResponse.json(body.ok && Array.isArray(body.products) ? body.products : []);
  } catch { return NextResponse.json([]); }
}

export async function POST(request: Request) {
  if (!SCRIPT_URL || !SECRET) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const data = (await request.json()) as Record<string, unknown>;
    const response = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ secret: SECRET, kind: "product-upsert", data }), cache: "no-store" });
    const body = (await response.json()) as { ok?: boolean; id?: string };
    if (!body.ok || !body.id) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json({ ...data, id: body.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 503 }); }
}
