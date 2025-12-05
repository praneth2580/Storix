/**
 * 🧩 Google Sheets Inventory DB API
 * Supports dynamic sheets for Products, Sales, Purchases, Suppliers, etc.
 * Each entity (sheet) auto-creates with predefined headers and timestamps.
 */

const SPREADSHEET_ID = '1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek';
const DEFAULT_SHEET = 'Products'; // fallback entity

// Define schema headers for each entity
const SCHEMAS = {
  Products: [
    'id', 'name', 'category', 'description', 'sku', 'barcode',
    'quantity', 'costPrice', 'sellingPrice', 'supplierId', 'lowStockThreshold',
    'createdAt', 'updatedAt'
  ],
  Sales: [
    'id', 'productId', 'quantity', 'sellingPrice', 'total',
    'date', 'customerName', 'paymentMethod'
  ],
  Purchases: [
    'id', 'productId', 'supplierId', 'quantity', 'costPrice', 'total',
    'date', 'invoiceNumber'
  ],
  Suppliers: [
    'id', 'name', 'contactPerson', 'phone', 'email', 'address', 'notes',
    'createdAt', 'updatedAt'
  ],
  Settings: [
    'shopName', 'currency', 'lowStockGlobalThreshold', 'googleSheetId',
    'theme', 'offlineMode', 'updatedAt'
  ]
};

/**
 * 🧠 Utility: Get or create a sheet with the right headers
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    const headers = SCHEMAS[sheetName] || ['id', 'name'];
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    Logger.log(`✅ Created new sheet: ${sheetName}`);
  }
  return sheet;
}

/**
 * 🧩 Handle GET (Read)
 * Supports:
 * - ?sheet=Products
 * - ?id=123
 * - ?category=Saree
 * - ?callback=myFunction  (JSONP)
 * - ?window=appData (sets window.appData directly)
 * - ?interval=10000 (auto-reloads if used as <script> tag)
 */
function doGet(e) {
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

  let response;

  // Get by ID
  if (e.parameter.id) {
    const record = rows.find(r => String(r.id) === String(e.parameter.id));
    response = record || {};
  } else {
    // Filter by query params
    const filters = Object.entries(e.parameter).filter(([k]) => !['sheet', 'id', 'callback', 'window', 'interval'].includes(k));
    const filtered = filters.length
      ? rows.filter(r => filters.every(([key, val]) => String(r[key]) === String(val)))
      : rows;

    response = filtered;
  }

  return respondJSONP(response, e);
}

/**
 * 🧩 Handle POST (Create)
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheetName = body.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  const nextId = lastRow >= 2 ? Number(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
  const now = new Date().toISOString();

  body.id = body.id || String(nextId);
  if (headers.includes('createdAt')) body.createdAt = now;
  if (headers.includes('updatedAt')) body.updatedAt = now;

  const newRow = headers.map(h => body[h] ?? '');
  sheet.appendRow(newRow);

  return respondJSONP({ status: 'success', id: body.id, sheet: sheetName }, e);
}

/**
 * 🧩 Handle PUT (Update)
 */
function doPut(e) {
  const body = JSON.parse(e.postData.contents);
  const sheetName = body.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);
  const id = String(body.id);
  const now = new Date().toISOString();

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      headers.forEach((h, j) => {
        if (h === 'updatedAt') sheet.getRange(i + 2, j + 1).setValue(now);
        else if (body[h] !== undefined) sheet.getRange(i + 2, j + 1).setValue(body[h]);
      });
      return respondJSONP({ status: 'updated', id, sheet: sheetName }, e);
    }
  }

  return respondJSONP({ error: 'ID not found', sheet: sheetName }, e);
}

/**
 * 🧩 Handle DELETE (Remove)
 */
function doDelete(e) {
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);
  const id = String(e.parameter.id);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return respondJSONP({ status: 'deleted', id, sheet: sheetName }, e);
    }
  }

  return respondJSONP({ error: 'ID not found', sheet: sheetName }, e);
}

/**
 * 🔄 Universal JSONP / JS Response Wrapper
 */
function respondJSONP(data, e) {
  const json = JSON.stringify(data);
  const callback = e?.parameter?.callback;
  const windowVar = e?.parameter?.window;
  const interval = Number(e?.parameter?.interval || 0);

  let jsOutput = "";

  if (callback) {
    // JSONP
    jsOutput = `${callback}(${json});`;
  } else if (windowVar) {
    // Plain JS that assigns to window
    jsOutput = `window["${windowVar}"] = ${json}; console.log("✅ Data updated:", window["${windowVar}"]);`;
  } else {
    // Default JSON
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  // Optional auto-refresh (for use with <script> tags)
  if (interval > 0 && windowVar) {
    const url = ScriptApp.getService().getUrl();
    jsOutput += `
      setTimeout(() => {
        const s = document.createElement("script");
        s.src = "${url}?window=${windowVar}&sheet=${e.parameter.sheet || DEFAULT_SHEET}&t=" + Date.now();
        document.body.appendChild(s);
      }, ${interval});
    `;
  }

  return ContentService.createTextOutput(jsOutput)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
