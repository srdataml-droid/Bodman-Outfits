const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SCRIPT_URL = process.env.GOOGLE_SHEETS_WEB_APP_URL;
const SHARED_SECRET = process.env.GOOGLE_SHEETS_SHARED_SECRET;

export type SheetKind = "commission" | "fitting";

export async function appendToOperationsSheet(kind: SheetKind, data: Record<string, unknown>) {
  if (!SHEET_ID || !SCRIPT_URL || !SHARED_SECRET) {
    throw new Error("Google Sheets prototype is not configured.");
  }

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: SHARED_SECRET, spreadsheetId: SHEET_ID, kind, data }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Google Sheets writer returned an error.");
  const result = (await response.json()) as { ok?: boolean; id?: string };
  if (!result.ok || !result.id) throw new Error("Google Sheets writer rejected the request.");
  return result.id;
}
