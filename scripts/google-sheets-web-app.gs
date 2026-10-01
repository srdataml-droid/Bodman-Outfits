/**
 * Bodman's Outfit prototype API.
 *
 * One Apps Script deployment handles both spreadsheets:
 * - Operations: commissions and fittings
 * - Products: catalogue products
 *
 * Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Keep the /exec URL in Vercel as GOOGLE_APPS_SCRIPT_URL. Do not commit it.
 */

const OPERATIONS_SHEET_ID = "1Cfs8gkYVxXSySnzmYFTgpBhNxTUvO10FLVMa36_9VZo";
const PRODUCTS_SHEET_ID = "1k6_ch5w3foEspqQac4AwdM3ttXi_MmHnCCuYCDrtwxU";

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "";

    if (action === "products") {
      return jsonResponse({
        success: true,
        products: getProducts()
      });
    }

    if (action === "requests") {
      return jsonResponse({
        success: true,
        requests: getRequests()
      });
    }

    return jsonResponse({
      success: true,
      message: "Bodman's Outfit API is running"
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action || "";

    if (action === "commission") return createCommission(body);
    if (action === "fitting") return createFitting(body);
    if (action === "product") return saveProduct(body);
    if (action === "requestStatus") return updateRequestStatus(body);

    return jsonResponse({ success: false, error: "Unknown action" });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function createCommission(data) {
  const sheet = SpreadsheetApp
    .openById(OPERATIONS_SHEET_ID)
    .getSheetByName("Commissions");

  if (!sheet) throw new Error("Commissions sheet not found");

  const id = Utilities.getUuid();
  sheet.appendRow([
    new Date(),
    id,
    data.name || "",
    data.email || "",
    data.phone || "",
    data.category || "",
    data.occasion || "",
    data.neededBy || "",
    data.description || "",
    "pending_review",
    ""
  ]);

  return jsonResponse({ success: true, id: id });
}

function createFitting(data) {
  const sheet = SpreadsheetApp
    .openById(OPERATIONS_SHEET_ID)
    .getSheetByName("Fittings");

  if (!sheet) throw new Error("Fittings sheet not found");

  const id = Utilities.getUuid();
  sheet.appendRow([
    new Date(),
    id,
    data.name || "",
    data.email || "",
    data.phone || "",
    data.preferredDate || "",
    data.preferredTime || "",
    data.category || "",
    data.notes || "",
    "pending"
  ]);

  return jsonResponse({ success: true, id: id });
}

function getProducts() {
  const sheet = SpreadsheetApp
    .openById(PRODUCTS_SHEET_ID)
    .getSheetByName("Products");

  if (!sheet) throw new Error("Products sheet not found");

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values
    .slice(1)
    .filter(function(row) { return row[0]; })
    .map(function(row) {
      return {
        id: String(row[0]),
        slug: String(row[1] || ""),
        category: String(row[2] || ""),
        name: String(row[3] || ""),
        detail: String(row[4] || ""),
        description: String(row[5] || ""),
        imageFlat: String(row[6] || ""),
        imageOnForm: String(row[7] || ""),
        altFlat: String(row[8] || ""),
        altOnForm: String(row[9] || ""),
        startingPrice: row[10] === "" || row[10] == null ? null : Number(row[10]),
        active: row[11] === true || String(row[11]).toLowerCase() === "true",
        sortOrder: Number(row[12]) || 0,
        updatedAt: row[13] || ""
      };
    })
    .sort(function(a, b) { return a.sortOrder - b.sortOrder; });
}

function getRequests() {
  const spreadsheet = SpreadsheetApp.openById(OPERATIONS_SHEET_ID);
  const commissionsSheet = spreadsheet.getSheetByName("Commissions");
  const fittingsSheet = spreadsheet.getSheetByName("Fittings");

  if (!commissionsSheet || !fittingsSheet) {
    throw new Error("Operations tabs not found");
  }

  const commissions = commissionsSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(function(row) { return row[1]; })
    .map(function(row) {
      return {
        type: "commission",
        createdAt: dateText(row[0]),
        id: String(row[1] || ""),
        name: String(row[2] || ""),
        email: String(row[3] || ""),
        phone: String(row[4] || ""),
        category: String(row[5] || ""),
        occasion: String(row[6] || ""),
        neededBy: dateText(row[7]),
        description: String(row[8] || ""),
        status: String(row[9] || "pending_review"),
        notes: String(row[10] || "")
      };
    });

  const fittings = fittingsSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(function(row) { return row[1]; })
    .map(function(row) {
      return {
        type: "fitting",
        createdAt: dateText(row[0]),
        id: String(row[1] || ""),
        name: String(row[2] || ""),
        email: String(row[3] || ""),
        phone: String(row[4] || ""),
        preferredDate: dateText(row[5]),
        preferredTime: String(row[6] || ""),
        category: String(row[7] || ""),
        notes: String(row[8] || ""),
        status: String(row[9] || "pending")
      };
    });

  return commissions.concat(fittings).sort(function(a, b) {
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function saveProduct(data) {
  const sheet = SpreadsheetApp
    .openById(PRODUCTS_SHEET_ID)
    .getSheetByName("Products");

  if (!sheet) throw new Error("Products sheet not found");

  const id = data.id || Utilities.getUuid();
  const values = sheet.getDataRange().getValues();
  let rowNumber = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      rowNumber = i + 1;
      break;
    }
  }

  const row = [
    id,
    data.slug || "",
    data.category || "",
    data.name || "",
    data.detail || "",
    data.description || "",
    data.imageFlat || "",
    data.imageOnForm || "",
    data.altFlat || "",
    data.altOnForm || "",
    data.startingPrice == null || data.startingPrice === "" ? "" : Number(data.startingPrice),
    data.active !== false,
    Number(data.sortOrder) || 0,
    new Date()
  ];

  if (rowNumber === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  }

  return jsonResponse({ success: true, id: id });
}

function updateRequestStatus(data) {
  const type = data.type;
  const allowed = type === "commission"
    ? ["pending_review", "accepted", "declined"]
    : type === "fitting"
      ? ["pending", "confirmed", "declined"]
      : [];

  if (allowed.indexOf(data.status) === -1) {
    throw new Error("Invalid request status");
  }

  const sheetName = type === "commission" ? "Commissions" : "Fittings";
  const sheet = SpreadsheetApp
    .openById(OPERATIONS_SHEET_ID)
    .getSheetByName(sheetName);

  if (!sheet) throw new Error(sheetName + " sheet not found");

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(data.id)) {
      sheet.getRange(i + 1, 10).setValue(data.status);
      return jsonResponse({
        success: true,
        id: data.id,
        status: data.status
      });
    }
  }

  throw new Error("Request not found");
}

function dateText(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  return String(value);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
