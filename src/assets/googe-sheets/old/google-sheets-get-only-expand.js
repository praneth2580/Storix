/**
 * SINGLE-ENDPOINT INVENTORY API
 * CRUD handled through GET using "action" param
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

// ------------------------------------------------------
// Load / Create Sheet
// ------------------------------------------------------
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

// ------------------------------------------------------
// MAIN ENTRY
// ------------------------------------------------------
function doGet(e) {
  const action = e.parameter.action || "get";
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const sheet = getOrCreateSheet(sheetName);

  let response;

  switch (action) {
    case "get": response = handleGet(e, sheet, sheetName); break;
    case "create": response = handleCreate(e, sheet, sheetName); break;
    case "update": response = handleUpdate(e, sheet, sheetName); break;
    case "delete": response = handleDelete(e, sheet, sheetName); break;
    default: response = { error: "Invalid action" };
  }

  return respondJSONP(response, e);
}

// ------------------------------------------------------
// FOREIGN KEY CACHE
// ------------------------------------------------------
function getFKMaps() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const productRows = ss.getSheetByName("Products").getDataRange().getValues();
  const prodHeaders = productRows.shift();
  const products = productRows.map(r =>
    Object.fromEntries(prodHeaders.map((h, i) => [h, r[i]]))
  );

  const variantRows = ss.getSheetByName("Variants").getDataRange().getValues();
  const varHeaders = variantRows.shift();
  const variants = variantRows.map(r =>
    Object.fromEntries(varHeaders.map((h, i) => [h, r[i]]))
  );

  const productMap = {};
  const productObjMap = {};

  products.forEach(p => {
    productMap[p.id] = p.name;
    productObjMap[p.id] = p;
  });

  const variantMap = {};
  const variantObjMap = {};

  variants.forEach(v => {
    variantMap[v.id] = v.sku;
    variantObjMap[v.id] = v;
  });

  return { productMap, productObjMap, variantMap, variantObjMap };
}

// ------------------------------------------------------
// ENRICH FOREGIN KEYS
// ------------------------------------------------------
function enrichRow(row, sheetName, fk) {
  const enriched = { ...row };

  // Variants → add productName
  if (sheetName === "Variants") {
    enriched.productName = fk.productMap[row.productId] || "";
  }

  // Stock → add variantSku + productId + productName
  if (sheetName === "Stock") {
    const variant = fk.variantObjMap[row.variantId];

    enriched.variantSku = variant?.sku || "";
    enriched.productId = variant?.productId || "";
    enriched.productName = fk.productMap[variant?.productId] || "";
  }

  // Sales / Purchases → add variant + product info
  if (sheetName === "Sales" || sheetName === "Purchases") {
    const variant = fk.variantObjMap[row.variantId];

    enriched.variantSku = variant?.sku || "";
    enriched.productId = variant?.productId || "";
    enriched.productName = fk.productMap[variant?.productId] || "";
  }

  return enriched;
}

// ------------------------------------------------------
// GET handler
// ------------------------------------------------------
function handleGet(e, sheet, sheetName) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const fk = getFKMaps();

  let rows = data.map(r =>
    enrichRow(
      Object.fromEntries(headers.map((h, i) => [h, r[i]])),
      sheetName,
      fk
    )
  );

  if (e.parameter.id) {
    return rows.find(r => String(r.id) === String(e.parameter.id)) || {};
  }

  const filters = Object.entries(e.parameter)
    .filter(([k]) => !['sheet','id','action','callback','window','interval'].includes(k));

  return filters.length
    ? rows.filter(r => filters.every(([key, val]) => String(r[key]) === String(val)))
    : rows;
}

// ------------------------------------------------------
// CREATE
// ------------------------------------------------------
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

  sheet.appendRow(headers.map(h => data[h] ?? ""));

  return { status: "success", id: data.id, sheet: sheetName };
}

// ------------------------------------------------------
// UPDATE
// ------------------------------------------------------
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
        if (h === "updatedAt")
          sheet.getRange(i+2, j+1).setValue(now);
        else if (updateData[h] !== undefined)
          sheet.getRange(i+2, j+1).setValue(updateData[h]);
      });
      return { status: "updated", id };
    }
  }

  return { error: "ID not found", sheet: sheetName };
}

// ------------------------------------------------------
// DELETE
// ------------------------------------------------------
function handleDelete(e, sheet, sheetName) {
  if (!e.parameter.id) return { error: "Missing id" };

  const id = String(e.parameter.id);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i+1);
      return { status: "deleted", id };
    }
  }

  return { error: "ID not found" };
}

// ------------------------------------------------------
// JSON / JSONP Response
// ------------------------------------------------------
function respondJSONP(data, e) {
  const json = JSON.stringify(data);
  const callback = e?.parameter?.callback;
  const windowVar = e?.parameter?.window;

  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  if (windowVar) {
    return ContentService.createTextOutput(`window["${windowVar}"] = ${json};`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
