/**
 * Bodman's Outfit prototype writer.
 * Paste this into a Google Apps Script project owned by the Google account
 * that owns the operations sheet, set SCRIPT_SECRET, and deploy as a Web App.
 */
const SCRIPT_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET";
const PRODUCTS_SPREADSHEET_ID = "1k6_ch5w3foEspqQac4AwdM3ttXi_MmHnCCuYCDrtwxU";

function doGet(e) {
  try {
    if (e.parameter.resource !== "products") return json_({ ok: false, error: "unknown-resource" });
    const sheet = SpreadsheetApp.openById(PRODUCTS_SPREADSHEET_ID).getSheetByName("Products");
    const rows = sheet.getDataRange().getValues().slice(1);
    const products = rows.filter(r => r[0]).map(r => ({ id:String(r[0]), slug:String(r[1]), category:String(r[2]), name:String(r[3]), detail:String(r[4]), description:String(r[5]), imageFlat:String(r[6]), imageOnForm:String(r[7]), altFlat:String(r[8]), altOnForm:String(r[9]), startingPrice:r[10] === "" ? null : Number(r[10]), active:String(r[11]).toLowerCase() !== "false", sortOrder:Number(r[12] || 0) }));
    return json_({ ok: true, products: products });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

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
    } else if (body.kind === "product-upsert") {
      const d = body.data || {};
      const sheet = SpreadsheetApp.openById(PRODUCTS_SPREADSHEET_ID).getSheetByName("Products");
      const values = sheet.getDataRange().getValues();
      const productId = d.id || Utilities.getUuid();
      const row = [productId, d.slug || "", d.category || "", d.name || "", d.detail || "", d.description || "", d.imageFlat || "", d.imageOnForm || "", d.altFlat || "", d.altOnForm || "", d.startingPrice == null ? "" : d.startingPrice, d.active !== false, d.sortOrder || 0, now];
      let target = -1;
      for (let i = 1; i < values.length; i++) if (String(values[i][0]) === String(productId)) target = i + 1;
      if (target > 0) sheet.getRange(target, 1, 1, row.length).setValues([row]); else sheet.appendRow(row);
      return json_({ ok: true, id: productId });
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
