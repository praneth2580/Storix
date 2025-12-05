/**
 * 🧩 Google Sheets Inventory DB API
 * Supports dynamic sheets for Products, Sales, Purchases, Suppliers, etc.
 * Each entity (sheet) auto-creates with predefined headers and timestamps.
 */

const SPREADSHEET_ID = 'YOUR_SHEET_ID';
const DEFAULT_SHEET = 'Products'; // fallback entity

// Define schema headers for each entity (TypeScript interfaces)
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

// 🧠 Utility: get or create sheet with appropriate headers
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

// 🧩 Handle GET requests (read)
function doGet(e) {
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

  // GET by ID
  if (e.parameter.id) {
    const record = rows.find(r => String(r.id) === String(e.parameter.id));
    return respondWithCors(record || {});
  }

  // Filter by field (e.g. ?sheet=Products&category=Saree)
  const filters = Object.entries(e.parameter).filter(([k]) => !['sheet', 'id'].includes(k));
  const filtered = filters.length
    ? rows.filter(r => filters.every(([key, val]) => String(r[key]) === String(val)))
    : rows;

  return respondWithCors(filtered);
}

// 🧩 Handle POST requests (create)
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheetName = body.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Auto-generate ID and timestamps
  const lastRow = sheet.getLastRow();
  const nextId = lastRow >= 2 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
  const now = new Date().toISOString();

  body.id = body.id || String(nextId);
  if (headers.includes('createdAt')) body.createdAt = now;
  if (headers.includes('updatedAt')) body.updatedAt = now;

  const newRow = headers.map(h => body[h] ?? '');
  sheet.appendRow(newRow);

  return respondWithCors({ status: 'success', id: body.id, sheet: sheetName });
}

// 🧩 Handle PUT requests (update)
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
      return respondWithCors({ status: 'updated', id, sheet: sheetName });
    }
  }

  return respondWithCors({ error: 'ID not found', sheet: sheetName });
}

// 🧩 Handle DELETE requests (remove)
function doDelete(e) {
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);
  const id = String(e.parameter.id);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return respondWithCors({ status: 'deleted', id, sheet: sheetName });
    }
  }

  return respondWithCors({ error: 'ID not found', sheet: sheetName });
}

// Centralize CORS headers (edit allowed headers/methods as needed)
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // or 'https://your-domain.com'
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Authorization'
  };
}

// Handle preflight OPTIONS request (required for most non-GET fetches)
function doOptions(e) {
  const headers = getCorsHeaders();
  // returning an empty 204 with headers is fine
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', headers['Access-Control-Allow-Origin'])
    .setHeader('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods'])
    .setHeader('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
}

// Use this function to respond with JSON + CORS headers
function respondWithCors(obj) {
  const headers = getCorsHeaders();
  const out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // setHeader is available on TextOutput
  // out.setHeader('Access-Control-Allow-Origin', headers['Access-Control-Allow-Origin']);
  // out.setHeader('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
  // out.setHeader('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
  return out;
}
