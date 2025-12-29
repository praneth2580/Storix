/***********************************************
 * Storix JSONP-only GET Backend for Google Sheets
 * - All endpoints via GET
 * - JSONP callback wrapper: storix(...)
 * - Separate endpoints for CRUD, sync, settings
 * - onEdit trigger to stamp updatedAt on manual edits
 ***********************************************/

/** CONFIG */
const SPREADSHEET_ID = "1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek"; // <--- set this
const META_SHEET = "__Meta__";
const JSONP_CALLBACK = "storix"; // fixed JSONP callback name

/** SCHEMAS - keep header names EXACT in sheets */
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
  Customers: [
    'id', 'name', 'phone', 'email', 'address',
    'notes', 'gstNumber', 'outstandingBalance',
    'createdAt', 'updatedAt'
  ],
  Stock: [
    'id', 'variantId', 'quantity', 'unit', 'batchCode',
    'metadata', 'location', 'updatedAt'
  ],
  StockMovements: [
    'id', 'variantId', 'change', 'unit', 'type', 'refId', 'createdAt'
  ],
  Orders: [
    'id', 'customerId', 'totalAmount', 'paymentMethod',
    'date', 'notes', 'createdAt'
  ],
  Sales: [
    'id', 'orderId', 'variantId', 'quantity', 'unit',
    'sellingPrice', 'total', 'date', 'customerId', 'paymentMethod'
  ],
  Purchases: [
    'id', 'variantId', 'supplierId', 'quantity', 'unit',
    'costPrice', 'total', 'date', 'invoiceNumber'
  ],
  Suppliers: [
    'id', 'name', 'contactPerson', 'phone', 'email',
    'address', 'notes', 'createdAt', 'updatedAt'
  ],
  // Settings is special: key, value, updatedAt (dynamic schema)
  Settings: [
    'key', 'value', 'updatedAt'
  ]
};

/* ------------------------
   ENTRY POINTS (GET-only)
   ------------------------ */
function doGet(e) {
  // All actions handled via GET; always return JSONP: storix(...)
  try {
    const action = (e && e.parameter && e.parameter.action) || "unknown";

    switch (action) {
      // Reading / sync
      case "syncAll":
        return respondJSONP(syncAll());

      case "syncChanges":
        return respondJSONP(syncChanges(e));

      case "get":
        return respondJSONP(handleGet(e));

      case "getSettings":
        return respondJSONP(getSettings());

      // Writes (still GET with data param)
      case "create":
        return respondJSONP(handleCreate(e));

      case "update":
        return respondJSONP(handleUpdate(e));

      case "delete":
        return respondJSONP(handleDelete(e));

      case "updateSetting":
        return respondJSONP(handleUpdateSetting(e));

      case "deleteSetting":
        return respondJSONP(handleDeleteSetting(e));

      // Optional batch (array of ops)
      case "batch":
        return respondJSONP(handleBatchGET(e));

      default:
        return respondJSONP({ error: "Unknown action: " + action });
    }
  } catch (err) {
    return respondJSONP({ error: String(err && err.message ? err.message : err) });
  }
}

// For completeness; we keep doPost returning an error because client uses GET-only JSONP.
function doPost(e) {
  return respondJSONP({ error: "POST not supported - use GET + JSONP" });
}

/* ------------------------
   JSONP RESPONSE helper
   ------------------------ */
function respondJSONP(obj) {
  const payload = JSON.stringify(obj);
  const wrapped = JSONP_CALLBACK + "(" + payload + ");";
  return ContentService.createTextOutput(wrapped).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/* ------------------------
   META SHEET HELPERS
   ------------------------ */
function getMetaSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(META_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(META_SHEET);
    sheet.appendRow(["sheetName", "lastUpdated"]);
  }
  return sheet;
}

function updateMeta(sheetName) {
  const meta = getMetaSheet();
  const all = meta.getDataRange().getValues();
  const headers = all.shift() || [];
  const now = new Date().toISOString();

  for (let i = 0; i < all.length; i++) {
    if (all[i][0] === sheetName) {
      meta.getRange(i + 2, 2).setValue(now);
      return;
    }
  }

  meta.appendRow([sheetName, now]);
}

function getMetaMap() {
  const meta = getMetaSheet();
  const data = meta.getDataRange().getValues();
  if (data.length <= 1) return {};
  data.shift(); // drop headers
  const map = {};
  data.forEach(r => {
    map[r[0]] = r[1] ? new Date(r[1]).toISOString() : null;
  });
  return map;
}

/* ------------------------
   GENERIC SHEET UTILITIES
   ------------------------ */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let s = ss.getSheetByName(sheetName);
  if (!s) {
    const headers = SCHEMAS[sheetName] || ['id', 'name'];
    s = ss.insertSheet(sheetName);
    s.appendRow(headers);
  }
  return s;
}

function getSheetRows(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return [];
  const headers = raw.shift();
  return raw.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

// writeRow: if isNew true => append, else update row matching id
function writeRow(sheetName, obj, isNew) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = headers.map(h => {
    return obj[h] !== undefined ? obj[h] : "";
  });

  if (isNew) {
    sheet.appendRow(rowValues);
  } else {
    const idIndex = headers.indexOf("id");
    if (idIndex === -1) throw new Error("No id column in sheet: " + sheetName);
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][idIndex]) === String(obj.id)) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
        return;
      }
    }
    // If not found, append (optionally)
    sheet.appendRow(rowValues);
  }
}

function deleteRowById(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIdx = headers.indexOf("id");
  if (idIdx === -1) return false;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

/* ------------------------
   HANDLE GET (read)
   Usage:
     ?action=get&sheet=Products
     ?action=get&sheet=Products&id=123
     ?action=get&sheet=Products&minimal=true&offset=0&limit=50
   ------------------------ */
function handleGet(e) {
  const sheetName = (e.parameter.sheet) || "";
  if (!sheetName) return { error: "Missing sheet param" };
  const sheet = getOrCreateSheet(sheetName);
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return [];

  const headers = raw.shift();
  let rows = raw.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));

  if (e.parameter.id) {
    const found = rows.find(r => String(r.id) === String(e.parameter.id));
    return found || {};
  }

  // filters: any extra params except reserved
  const reserved = ['sheet', 'id', 'action', 'callback', 'window', 'interval', 'minimal', 'offset', 'limit'];
  const filters = Object.entries(e.parameter || {}).filter(([k]) => reserved.indexOf(k) === -1);
  if (filters.length) {
    rows = rows.filter(row =>
      filters.every(([key, val]) => {
        if (row[key] === undefined) return false;
        const parts = String(val).split(',').map(x => x.trim().toLowerCase());
        return parts.includes(String(row[key]).toLowerCase());
      })
    );
  }

  // minimal listing option (simplified fallback)
  if (e.parameter.minimal === "true") {
    rows = rows.map(r => {
      const minimal = { id: r.id };
      if (r.name) minimal.name = r.name;
      if (r.sku) minimal.sku = r.sku;
      if (r.sellingPrice) minimal.sellingPrice = r.sellingPrice;
      return minimal;
    });
  }

  // pagination
  const offset = e.parameter.offset ? Number(e.parameter.offset) : 0;
  const limit = e.parameter.limit ? Number(e.parameter.limit) : rows.length;
  if (offset || limit !== rows.length) rows = rows.slice(offset, offset + limit);

  return rows;
}

/* ------------------------
   CREATE (via GET + data param)
   Usage:
     ?action=create&sheet=Products&data=ENCODED_JSON
   ------------------------ */
function handleCreate(e) {
  const sheetName = e.parameter && e.parameter.sheet;
  const dataStr = e.parameter && e.parameter.data;
  if (!sheetName || !dataStr) return { error: "Missing sheet or data" };

  let data;
  try {
    data = JSON.parse(decodeURIComponent(dataStr));
  } catch (err) {
    // try raw parse if not encoded
    try { data = JSON.parse(dataStr); } catch (e2) { return { error: "Invalid JSON data" }; }
  }

  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  const nextId = lastRow >= 2 ? Number(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
  const now = new Date().toISOString();

  // assign id if missing
  if (!data.id) {
    // if sheet uses numeric id first col, keep that pattern; else allow client id.
    data.id = String(nextId);
  }
  if (headers.indexOf("createdAt") !== -1) data.createdAt = data.createdAt || now;
  if (headers.indexOf("updatedAt") !== -1) data.updatedAt = now;

  // append row
  writeRow(sheetName, data, true);
  updateMeta(sheetName);

  return { status: "created", sheet: sheetName, id: data.id, now: now };
}

/* ------------------------
   UPDATE (via GET + data param)
   Usage:
     ?action=update&sheet=Products&data=ENCODED_JSON  (data must include id)
   ------------------------ */
function handleUpdate(e) {
  const sheetName = e.parameter && e.parameter.sheet;
  const dataStr = e.parameter && e.parameter.data;
  if (!sheetName || !dataStr) return { error: "Missing sheet or data" };

  let data;
  try {
    data = JSON.parse(decodeURIComponent(dataStr));
  } catch (err) {
    try { data = JSON.parse(dataStr); } catch (e2) { return { error: "Invalid JSON data" }; }
  }

  if (!data.id) return { error: "Missing id in data" };

  // set updatedAt
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = new Date().toISOString();
  if (headers.indexOf("updatedAt") !== -1) data.updatedAt = now;

  writeRow(sheetName, data, false);
  updateMeta(sheetName);

  return { status: "updated", sheet: sheetName, id: data.id, now: now };
}

/* ------------------------
   DELETE (via GET)
   Usage:
     ?action=delete&sheet=Products&id=123
   ------------------------ */
function handleDelete(e) {
  const sheetName = e.parameter && e.parameter.sheet;
  const id = e.parameter && e.parameter.id;
  if (!sheetName || !id) return { error: "Missing sheet or id" };

  const ok = deleteRowById(sheetName, id);
  if (ok) {
    updateMeta(sheetName);
    return { status: "deleted", sheet: sheetName, id: id };
  } else {
    return { error: "ID not found", sheet: sheetName, id: id };
  }
}

/* ------------------------
   BATCH (GET + data param) - optional: operations array
   Usage:
     ?action=batch&data=ENCODED_JSON
     where data = { operations: [ { action: "create"|"update"|"delete", sheet: "Products", data: {...} }, ... ] }
   ------------------------ */
function handleBatchGET(e) {
  const dataStr = e.parameter && e.parameter.data;
  if (!dataStr) return { error: "Missing data payload" };

  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(dataStr));
  } catch (err) {
    try { payload = JSON.parse(dataStr); } catch (e2) { return { error: "Invalid JSON payload" }; }
  }

  if (!payload.operations || !Array.isArray(payload.operations)) return { error: "Missing operations[]" };

  const results = [];
  // results array used for __REF() resolution (if used)
  payload.operations.forEach((op, idx) => {
    try {
      const action = (op.action || "").toLowerCase();
      const sheet = op.sheet;
      if (action === "create") {
        const now = new Date().toISOString();
        const data = op.data || {};
        const s = getOrCreateSheet(sheet);
        const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
        const lastRow = s.getLastRow();
        const nextId = lastRow >= 2 ? Number(s.getRange(lastRow, 1).getValue()) + 1 : 1;
        data.id = data.id || String(nextId);
        if (headers.indexOf("createdAt") !== -1) data.createdAt = data.createdAt || now;
        if (headers.indexOf("updatedAt") !== -1) data.updatedAt = now;
        writeRow(sheet, data, true);
        updateMeta(sheet);
        results.push({ index: idx, status: "created", sheet: sheet, id: data.id });
      } else if (action === "update") {
        const data = op.data || {};
        if (!data.id) { results.push({ index: idx, error: "Missing id for update" }); return; }
        const s = getOrCreateSheet(sheet);
        const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
        if (headers.indexOf("updatedAt") !== -1) data.updatedAt = new Date().toISOString();
        writeRow(sheet, data, false);
        updateMeta(sheet);
        results.push({ index: idx, status: "updated", sheet: sheet, id: data.id });
      } else if (action === "delete") {
        const id = op.id || (op.data && op.data.id);
        if (!id) { results.push({ index: idx, error: "Missing id for delete" }); return; }
        const ok = deleteRowById(sheet, id);
        if (ok) {
          updateMeta(sheet);
          results.push({ index: idx, status: "deleted", sheet: sheet, id: id });
        } else {
          results.push({ index: idx, error: "ID not found", sheet: sheet, id: id });
        }
      } else {
        results.push({ index: idx, error: "Invalid action: " + op.action });
      }
    } catch (err) {
      results.push({ index: idx, error: String(err && err.message ? err.message : err) });
    }
  });

  return { status: "completed", results: results };
}

/* ------------------------
   SYNC: syncAll (full dump)
   Usage:
     ?action=syncAll
   ------------------------ */
function syncAll() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const out = {};
  sheets.forEach(s => {
    const name = s.getName();
    if (name === META_SHEET) return;
    out[name] = getSheetRows(name);
  });
  out.__meta__ = getMetaMap();
  out.now = new Date().toISOString();
  return out;
}

/* ------------------------
   SYNC: syncChanges (delta)
   Usage:
     ?action=syncChanges&since=ISO_TIMESTAMP
   ------------------------ */
function syncChanges(e) {
  const sinceParam = e.parameter && e.parameter.since;
  if (!sinceParam) return { error: "Missing since param (ISO timestamp)" };

  const since = new Date(sinceParam);
  const metaMap = getMetaMap();
  const changes = {};

  Object.keys(metaMap).forEach(sheetName => {
    const lastUpdatedIso = metaMap[sheetName];
    if (!lastUpdatedIso) return;
    const lastUpdated = new Date(lastUpdatedIso);
    if (lastUpdated <= since) return;

    const rows = getSheetRows(sheetName);
    // row-level updatedAt filter
    const changedRows = rows.filter(r => {
      if (!r.updatedAt) return true;
      return new Date(r.updatedAt) > since;
    });

    if (changedRows.length === 0) {
      // metadata changed but no per-row updatedAt passed => possible delete/reorder
      changes[sheetName] = { fullRefresh: true, rows: rows };
    } else {
      changes[sheetName] = { fullRefresh: false, rows: changedRows };
    }
  });

  return { since: sinceParam, now: new Date().toISOString(), changes: changes };
}

/* ------------------------
   SETTINGS endpoints (separate per your request)
   - getSettings
   - updateSetting (create/update by key)
   - deleteSetting
   Usage:
     ?action=getSettings
     ?action=updateSetting&data=ENCODED_JSON  (data: {key, value})
     ?action=deleteSetting&key=someKey
   ------------------------ */
function getSettings() {
  const rows = getSheetRows("Settings");
  // convert to key: { value, updatedAt }
  const obj = {};
  rows.forEach(r => {
    const key = r.key;
    if (!key) return;
    obj[key] = { value: r.value, updatedAt: r.updatedAt };
  });
  return { now: new Date().toISOString(), settings: obj };
}

function handleUpdateSetting(e) {
  const dataStr = e.parameter && e.parameter.data;
  if (!dataStr) return { error: "Missing data" };
  let data;
  try { data = JSON.parse(decodeURIComponent(dataStr)); } catch (err) { try { data = JSON.parse(dataStr); } catch (e2) { return { error: "Invalid JSON" }; } }
  if (!data.key) return { error: "Missing key" };
  const sheetName = "Settings";
  const rows = getOrCreateSheet(sheetName);
  const headers = rows.getRange(1, 1, 1, rows.getLastColumn()).getValues()[0];
  const now = new Date().toISOString();
  // find by key
  const all = rows.getDataRange().getValues();
  const hdr = all.shift();
  const keyIdx = hdr.indexOf("key");
  const valueIdx = hdr.indexOf("value");
  const updatedIdx = hdr.indexOf("updatedAt");

  let updated = false;
  for (let i = 0; i < all.length; i++) {
    if (String(all[i][keyIdx]) === String(data.key)) {
      // update row
      const row = [];
      hdr.forEach(h => {
        if (h === "key") row.push(data.key);
        else if (h === "value") row.push(data.value);
        else if (h === "updatedAt") row.push(now);
        else row.push("");
      });
      rows.getRange(i + 2, 1, 1, hdr.length).setValues([row]);
      updated = true;
      break;
    }
  }

  if (!updated) {
    // append
    const row = hdr.map(h => {
      if (h === "key") return data.key;
      if (h === "value") return data.value;
      if (h === "updatedAt") return now;
      return "";
    });
    rows.appendRow(row);
  }

  updateMeta(sheetName);
  return { status: "ok", key: data.key, value: data.value, updatedAt: now };
}

function handleDeleteSetting(e) {
  const key = e.parameter && e.parameter.key;
  if (!key) return { error: "Missing key" };
  const s = getOrCreateSheet("Settings");
  const all = s.getDataRange().getValues();
  if (all.length <= 1) return { error: "No rows" };
  const hdr = all.shift();
  const keyIdx = hdr.indexOf("key");
  for (let i = 0; i < all.length; i++) {
    if (String(all[i][keyIdx]) === String(key)) {
      s.deleteRow(i + 2);
      updateMeta("Settings");
      return { status: "deleted", key: key };
    }
  }
  return { error: "Key not found", key: key };
}

/* ------------------------
   onEdit trigger - stamps row-level updatedAt and updates meta
   (installable onEdit recommended)
   ------------------------ */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    if (!sheetName || sheetName === META_SHEET) return;

    const hdr = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const updatedIdx = hdr.indexOf("updatedAt") + 1;
    if (updatedIdx === 0) return;

    const row = range.getRow();
    if (row === 1) return; // header edit ignored

    // avoid writing updatedAt if user edited updatedAt cell
    if (range.getColumn() !== updatedIdx) {
      sheet.getRange(row, updatedIdx).setValue(new Date().toISOString());
    }

    updateMeta(sheetName);
  } catch (err) {
    // simple trigger should fail silently
  }
}
