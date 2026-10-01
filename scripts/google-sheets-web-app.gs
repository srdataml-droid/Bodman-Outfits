/**
 * Bodman's Outfit prototype writer.
 * Paste this into a Google Apps Script project owned by the Google account
 * that owns the operations sheet, set SCRIPT_SECRET, and deploy as a Web App.
 */
const SCRIPT_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SCRIPT_SECRET) return json_({ ok: false, error: "unauthorized" });

    const ss = SpreadsheetApp.openById(body.spreadsheetId);
    const now = new Date().toISOString();
    const id = Utilities.getUuid();

    if (body.kind === "commission") {
      const d = body.data || {};
      ss.getSheetByName("Commissions").appendRow([
        now, id, d.name || "", d.email || "", d.phone || "", d.category || "",
        d.occasion || "", d.neededBy || "", d.description || "", "NEW", ""
      ]);
    } else if (body.kind === "fitting") {
      const d = body.data || {};
      ss.getSheetByName("Fittings").appendRow([
        now, id, d.name || "", d.email || "", d.phone || "", d.preferredDate || "",
        d.preferredTime || "", d.category || "", d.notes || "", "NEW"
      ]);
    } else {
      return json_({ ok: false, error: "unknown-kind" });
    }

    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
