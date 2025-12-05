/**
 * SINGLE-ENDPOINT INVENTORY API
 * ALL CRUD actions handled through GET using "action" param
 */

const SPREADSHEET_ID = '1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek';
const DEFAULT_SHEET = 'Products';

/**
 * Schema definitions
 */
const SCHEMAS = {
  Products: [
    'id', 'name', 'category', 'description', 'barcode', 'type', 'baseUnit',
    'hasVariants', 'defaultCostPrice', 'defaultSellingPrice',
    'createdAt', 'updatedAt'
  ],
  Variants: [
    'id', 'productId', 'sku', 'attributes', 'unit',
    'costPrice', 'sellingPrice', 'createdAt', 'updatedAt'
  ],
  Stock: [
    'id', 'variantId', 'quantity', 'unit', 'batchCode',
    'metadata', 'location', 'updatedAt'
  ],
  StockMovements: [
    'id', 'variantId', 'change', 'unit', 'type', 'refId', 'createdAt'
  ],
  Sales: [
    'id', 'variantId', 'quantity', 'unit',
    'sellingPrice', 'total', 'date', 'customerName', 'paymentMethod'
  ],
  Purchases: [
    'id', 'variantId', 'supplierId', 'quantity', 'unit',
    'costPrice', 'total', 'date', 'invoiceNumber'
  ],
  Suppliers: [
    'id', 'name', 'contactPerson', 'phone', 'email',
    'address', 'notes', 'createdAt', 'updatedAt'
  ],
  Settings: [
    'shopName', 'currency', 'lowStockGlobalThreshold',
    'googleSheetId', 'theme', 'offlineMode', 'updatedAt'
  ]
};

// ----------------------------------------
// Ensure Sheet Exists
// ----------------------------------------
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    const headers = SCHEMAS[sheetName] || ['id', 'name'];
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
  }

  return sheet;
}

// ----------------------------------------
// Handle ALL CRUD operations via GET
// ----------------------------------------
function doGet(e) {
  const action = e.parameter.action || "get";
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  let response;

  switch (action) {
    case "get":
      response = handleGet(e, sheet, sheetName);
      break;

    case "create":
      response = handleCreate(e, sheet, sheetName);
      break;

    case "update":
      response = handleUpdate(e, sheet, sheetName);
      break;

    case "delete":
      response = handleDelete(e, sheet, sheetName);
      break;

    default:
      response = { error: "Invalid action" };
  }

  return respondJSONP(response, e);
}

// ----------------------------------------
// GET handler
// ----------------------------------------
function handleGet(e, sheet, sheetName) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

  if (e.parameter.id) {
    return rows.find(r => String(r.id) === String(e.parameter.id)) || {};
  }

  // Apply filters
  const filters = Object.entries(e.parameter)
    .filter(([k]) => !['sheet', 'id', 'action', 'callback', 'window', 'interval'].includes(k));

  return filters.length
    ? rows.filter(r => filters.every(([key, val]) => String(r[key]) === String(val)))
    : rows;
}

// ----------------------------------------
// CREATE handler
// ----------------------------------------
function handleCreate(e, sheet, sheetName) {
  if (!e.parameter.data) return { error: "Missing data payload" };

  const data = JSON.parse(e.parameter.data);
  const headers = SCHEMAS[sheetName];
  const lastRow = sheet.getLastRow();

  const nextId = lastRow >= 2
    ? Number(sheet.getRange(lastRow, 1).getValue()) + 1
    : 1;

  const now = new Date().toISOString();

  data.id = data.id || String(nextId);
  if (headers.includes("createdAt")) data.createdAt = now;
  if (headers.includes("updatedAt")) data.updatedAt = now;

  const row = headers.map(h => data[h] ?? "");
  sheet.appendRow(row);

  return { status: "success", id: data.id, sheet: sheetName };
}

// ----------------------------------------
// UPDATE handler
// ----------------------------------------
function handleUpdate(e, sheet, sheetName) {
  if (!e.parameter.id) return { error: "Missing id" };
  if (!e.parameter.data) return { error: "Missing data" };

  const updateData = JSON.parse(e.parameter.data);
  const id = String(e.parameter.id);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const now = new Date().toISOString();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      headers.forEach((h, j) => {
        if (h === "updatedAt") sheet.getRange(i + 2, j + 1).setValue(now);
        else if (updateData[h] !== undefined) sheet.getRange(i + 2, j + 1).setValue(updateData[h]);
      });
      return { status: "updated", id };
    }
  }

  return { error: "ID not found", sheet: sheetName };
}

// ----------------------------------------
// DELETE handler
// ----------------------------------------
function handleDelete(e, sheet, sheetName) {
  if (!e.parameter.id) return { error: "Missing id" };

  const id = String(e.parameter.id);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { status: "deleted", id };
    }
  }

  return { error: "ID not found", sheet: sheetName };
}

// ----------------------------------------
// JSON / JSONP Response
// ----------------------------------------
function respondJSONP(data, e) {
  const json = JSON.stringify(data);
  const callback = e?.parameter?.callback;
  const windowVar = e?.parameter?.window;
  const interval = Number(e?.parameter?.interval || 0);

  let js = "";

  if (callback) {
    js = `${callback}(${json});`;
  } else if (windowVar) {
    js = `window["${windowVar}"] = ${json};`;
  } else {
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (interval > 0 && windowVar) {
    const url = ScriptApp.getService().getUrl();
    js += `
      setTimeout(() => {
        const s = document.createElement("script");
        s.src = "${url}?window=${windowVar}&sheet=${e.parameter.sheet}&action=get&t=" + Date.now();
        document.body.appendChild(s);
      }, ${interval});
    `;
  }

  return ContentService.createTextOutput(js)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
