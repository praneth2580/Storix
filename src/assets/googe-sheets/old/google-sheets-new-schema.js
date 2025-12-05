/**
 * 🧩 Google Sheets Inventory DB API
 * Supports dynamic sheets for Products, Variants, Stock, Sales, Purchases, Suppliers, etc.
 * Automatically creates sheet if not present.
 */

const SPREADSHEET_ID = '1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek';
const DEFAULT_SHEET = 'Products'; // fallback entity

// =========================================================
// ✅ UPDATED: SCHEMAS FOR ADVANCED INVENTORY MANAGEMENT
// =========================================================
const SCHEMAS = {
  Products: [
    'id',
    'name',
    'category',
    'description',
    'barcode',
    'type',
    'baseUnit',              // pcs, g, kg, litre
    'hasVariants',           // true | false
    'defaultCostPrice',
    'defaultSellingPrice',
    'createdAt',
    'updatedAt'
  ],

  Variants: [
    'id',
    'productId',
    'sku',
    'attributes',            // JSON: {"size":"L","color":"Red"}
    'unit',                  // optional override from product
    'costPrice',
    'sellingPrice',
    'createdAt',
    'updatedAt'
  ],

  Stock: [
    'id',
    'variantId',
    'quantity',
    'unit',
    'batchCode',
    'metadata',              // JSON like {"quality":"A+"}
    'location',
    'updatedAt'
  ],

  StockMovements: [
    'id',
    'variantId',
    'change',                // +/- quantity
    'unit',
    'type',                  // purchase, sale, return, adjustment
    'refId',                 // reference to sale/purchase id
    'createdAt'
  ],

  Sales: [
    'id',
    'variantId',
    'quantity',
    'unit',
    'sellingPrice',
    'total',
    'date',
    'customerName',
    'paymentMethod'
  ],

  Purchases: [
    'id',
    'variantId',
    'supplierId',
    'quantity',
    'unit',
    'costPrice',
    'total',
    'date',
    'invoiceNumber'
  ],

  Suppliers: [
    'id',
    'name',
    'contactPerson',
    'phone',
    'email',
    'address',
    'notes',
    'createdAt',
    'updatedAt'
  ],

  Settings: [
    'shopName',
    'currency',
    'lowStockGlobalThreshold',
    'googleSheetId',
    'theme',
    'offlineMode',
    'updatedAt'
  ]
};

/**
 * 🧠 Get or create a sheet with correct headers
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
 * 🧩 GET Handler
 */
function doGet(e) {
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

  let response;

  if (e.parameter.id) {
    const record = rows.find(r => String(r.id) === String(e.parameter.id));
    response = record || {};
  } else {
    const filters = Object.entries(e.parameter)
      .filter(([k]) => !['sheet', 'id', 'callback', 'window', 'interval'].includes(k));

    const filtered = filters.length
      ? rows.filter(r => filters.every(([key, val]) => String(r[key]) === String(val)))
      : rows;

    response = filtered;
  }

  return respondJSONP(response, e);
}

/**
 * 🧩 POST Handler (Create)
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheetName = body.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();

  const nextId = lastRow >= 2
    ? Number(sheet.getRange(lastRow, 1).getValue()) + 1
    : 1;

  const now = new Date().toISOString();

  body.id = body.id || String(nextId);
  if (headers.includes('createdAt')) body.createdAt = now;
  if (headers.includes('updatedAt')) body.updatedAt = now;

  const newRow = headers.map(h => body[h] ?? '');
  sheet.appendRow(newRow);

  return respondJSONP({ status: 'success', id: body.id, sheet: sheetName }, e);
}

/**
 * 🧩 PUT Handler (Update)
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
 * 🧩 DELETE Handler
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
 * 🔄 JSON / JSONP Response Wrapper
 */
function respondJSONP(data, e) {
  const json = JSON.stringify(data);
  const callback = e?.parameter?.callback;
  const windowVar = e?.parameter?.window;
  const interval = Number(e?.parameter?.interval || 0);

  let jsOutput = "";

  if (callback) {
    jsOutput = `${callback}(${json});`;
  } else if (windowVar) {
    jsOutput = `window["${windowVar}"] = ${json};`;
  } else {
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }

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
