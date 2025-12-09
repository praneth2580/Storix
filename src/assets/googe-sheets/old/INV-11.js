/**
 * SINGLE-ENDPOINT INVENTORY API (+ ORDERS + BATCH API)
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
    
    /** NEW — ORDER HEADER TABLE */
    Orders: [
        'id', 'customerId', 'totalAmount', 'paymentMethod',
        'date', 'notes', 'createdAt'
    ],

    /** UPDATED — SALES NOW SUPPORT MULTIPLE ITEMS PER ORDER */
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
    Settings: [
        'shopName', 'currency', 'lowStockGlobalThreshold',
        'googleSheetId', 'theme', 'offlineMode', 'updatedAt'
    ]
};


// ------------------------------------------------------
// Load or Create Sheet
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

    let response;

    switch (action) {
        case "get":
            response = handleGet(e, getOrCreateSheet(sheetName), sheetName);
            break;

        case "create":
            response = handleCreate(e, getOrCreateSheet(sheetName), sheetName);
            break;

        case "update":
            response = handleUpdate(e, getOrCreateSheet(sheetName), sheetName);
            break;

        case "delete":
            response = handleDelete(e, getOrCreateSheet(sheetName));
            break;

        case "batch":
            response = handleBatch(e);
            break;

        default:
            response = { error: "Invalid action" };
    }

    return respondJSONP(response, e);
}



// ------------------------------------------------------
// FOREIGN KEY MAPS
// ------------------------------------------------------
function getFKMaps() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    const readSheet = (name) => {
        const rows = ss.getSheetByName(name)?.getDataRange().getValues() || [];
        const headers = rows.shift() || [];
        const map = {};
        rows.forEach(r => {
            const obj = Object.fromEntries(headers.map((h, i) => [h, r[i]]));
            map[obj.id] = obj;
        });
        return map;
    };

    return {
        productObjMap: readSheet("Products"),
        variantObjMap: readSheet("Variants"),
        customerObjMap: readSheet("Customers")
    };
}



// ------------------------------------------------------
// ENRICH FOREIGN KEYS
// ------------------------------------------------------
function enrichRow(row, sheetName, fk) {
    const enriched = { ...row };

    if (sheetName === "Variants") {
        const product = fk.productObjMap[row.productId];
        enriched.product = product || null;
        enriched.productName = product?.name || "";
    }

    if (sheetName === "Stock") {
        const variant = fk.variantObjMap[row.variantId];
        const product = fk.productObjMap[variant?.productId];
        enriched.variant = variant || null;
        enriched.product = product || null;
        enriched.productName = product?.name || "";
    }

    if (sheetName === "Sales") {
        const variant = fk.variantObjMap[row.variantId];
        const product = fk.productObjMap[variant?.productId];
        const customer = fk.customerObjMap[row.customerId];

        enriched.variant = variant || null;
        enriched.product = product || null;
        enriched.productName = product?.name || "";
        enriched.customer = customer || null;
        enriched.customerName = customer?.name || "";
    }

    return enriched;
}



// ------------------------------------------------------
// GET handler
// ------------------------------------------------------
function handleGet(e, sheet, sheetName) {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift() || [];

    const fk = getFKMaps();

    let rows = data.map(row =>
        enrichRow(
            Object.fromEntries(headers.map((h, i) => [h, row[i]])),
            sheetName,
            fk
        )
    );

    if (e.parameter.id) {
        return rows.find(r => String(r.id) === String(e.parameter.id)) || {};
    }

    const filters = Object.entries(e.parameter)
        .filter(([k]) => !['sheet', 'id', 'action', 'callback', 'window', 'interval'].includes(k));

    return filters.length
        ? rows.filter(row => filters.every(([key, val]) => String(row[key]) === String(val)))
        : rows;
}



// ------------------------------------------------------
// CREATE handler
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
// UPDATE handler
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
                    sheet.getRange(i + 2, j + 1).setValue(now);
                else if (updateData[h] !== undefined)
                    sheet.getRange(i + 2, j + 1).setValue(updateData[h]);
            });
            return { status: "updated", id };
        }
    }

    return { error: "ID not found", sheet: sheetName };
}



// ------------------------------------------------------
// DELETE handler
// ------------------------------------------------------
function handleDelete(e, sheet) {
    if (!e.parameter.id) return { error: "Missing id" };

    const id = String(e.parameter.id);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === id) {
            sheet.deleteRow(i + 1);
            return { status: "deleted", id };
        }
    }

    return { error: "ID not found" };
}



// ------------------------------------------------------
// BATCH API (create/update/delete multiple rows across sheets)
// ------------------------------------------------------

function handleBatch(e) {
    if (!e.parameter.data)
        return { error: "Missing batch payload" };

    let payload;
    try {
        payload = JSON.parse(e.parameter.data);
    } catch (err) {
        return { error: "Invalid JSON" };
    }

    if (!payload.operations || !Array.isArray(payload.operations))
        return { error: "Missing operations[]" };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const results = [];

    payload.operations.forEach((op, index) => {
        try {
            const sheet = getOrCreateSheet(op.sheet);
            const action = op.type.toLowerCase();

            // --- Create ---
            if (action === "create") {
                const headers = SCHEMAS[op.sheet];
                const lastRow = sheet.getLastRow();
                const nextId = lastRow >= 2
                    ? Number(sheet.getRange(lastRow, 1).getValue()) + 1
                    : 1;

                const now = new Date().toISOString();
                op.data.id = op.data.id || String(nextId);

                if (headers.includes("createdAt")) op.data.createdAt = now;
                if (headers.includes("updatedAt")) op.data.updatedAt = now;

                sheet.appendRow(headers.map(h => op.data[h] ?? ""));

                results.push({
                    index,
                    status: "created",
                    sheet: op.sheet,
                    id: op.data.id
                });

            }

            // --- Update ---
            else if (action === "update") {
                const id = String(op.id);
                const data = sheet.getDataRange().getValues();
                const headers = data.shift();
                const now = new Date().toISOString();

                let updated = false;
                for (let i = 0; i < data.length; i++) {
                    if (String(data[i][0]) === id) {
                        headers.forEach((h, j) => {
                            if (h === "updatedAt")
                                sheet.getRange(i + 2, j + 1).setValue(now);
                            else if (op.data[h] !== undefined)
                                sheet.getRange(i + 2, j + 1).setValue(op.data[h]);
                        });
                        updated = true;
                        break;
                    }
                }

                results.push(updated
                    ? { index, status: "updated", sheet: op.sheet, id }
                    : { index, error: "ID not found", sheet: op.sheet }
                );
            }

            // --- Delete ---
            else if (action === "delete") {
                const id = String(op.id);
                const data = sheet.getDataRange().getValues();

                let deleted = false;
                for (let i = 1; i < data.length; i++) {
                    if (String(data[i][0]) === id) {
                        sheet.deleteRow(i + 1);
                        deleted = true;
                        break;
                    }
                }

                results.push(deleted
                    ? { index, status: "deleted", sheet: op.sheet, id }
                    : { index, error: "ID not found", sheet: op.sheet }
                );
            }

            else {
                results.push({ index, error: "Invalid action type" });
            }

        } catch (err) {
            results.push({ index, error: err.message });
        }
    });

    return { status: "completed", results };
}



// ------------------------------------------------------
// JSON / JSONP Response
// ------------------------------------------------------
function respondJSONP(data, e) {
    const json = JSON.stringify(data);
    const cb = e?.parameter?.callback;
    const windowVar = e?.parameter?.window;

    if (cb) {
        return ContentService.createTextOutput(`${cb}(${json});`)
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    if (windowVar) {
        return ContentService.createTextOutput(`window["${windowVar}"] = ${json};`)
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);
}

