import { NextResponse } from "next/server";
const SCRIPT_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
export async function GET() {
  if (!SCRIPT_URL) return NextResponse.json([]);
  try {
    const response = await fetch(`${SCRIPT_URL}?resource=requests`, { cache: "no-store" });
    const body = (await response.json()) as { ok?: boolean; requests?: unknown[] };
    return NextResponse.json(body.ok && Array.isArray(body.requests) ? body.requests : []);
  } catch { return NextResponse.json([]); }
}
