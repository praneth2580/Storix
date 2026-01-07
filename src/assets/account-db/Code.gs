/** CONFIG */
const SPREADSHEET_ID = "YOUR_SHEET_ID"; // <--- Set your Accounts database spreadsheet ID
const SHEET_NAME = "Accounts"; // Sheet name for accounts

/** SCHEMA - Account fields matching IAccount interface */
const ACCOUNT_SCHEMA = [
    'id', 'email', 'masterPassword', 'scriptId', 'createdAt', 'updatedAt'
];

function doGet() {
    return HtmlService
        .createHtmlOutputFromFile("worker")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get or create the Accounts sheet with proper headers
 */
function getOrCreateSheet() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(ACCOUNT_SCHEMA);
        // Format header row
        const headerRange = sheet.getRange(1, 1, 1, ACCOUNT_SCHEMA.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4285f4');
        headerRange.setFontColor('#ffffff');
    }
    
    return sheet;
}

/**
 * Get all accounts or filter by email
 */
function getAccounts(filterEmail) {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rows = data.slice(1).map(row => {
        const account = {};
        headers.forEach((header, index) => {
            account[header] = row[index] || '';
        });
        return account;
    });
    
    // Filter by email if provided
    if (filterEmail) {
        return rows.filter(acc => 
            acc.email && acc.email.toLowerCase() === filterEmail.toLowerCase()
        );
    }
    
    return rows;
}

/**
 * Find account by ID
 */
function findAccountById(sheet, accountId) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('id');
    if (idIndex === -1) return null;
    
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][idIndex]) === String(accountId)) {
            return { row: i + 2, data: rows[i] };
        }
    }
    return null;
}

/**
 * Write account row to sheet
 */
function writeAccountRow(sheet, accountData, isNew) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = headers.map(h => accountData[h] !== undefined ? accountData[h] : '');
    
    if (isNew) {
        sheet.appendRow(rowValues);
        // Return the created account with generated ID
        const lastRow = sheet.getLastRow();
        const id = accountData.id || String(lastRow - 1); // Use provided ID or generate from row
        return { ...accountData, id };
    } else {
        const found = findAccountById(sheet, accountData.id);
        if (found) {
            sheet.getRange(found.row, 1, 1, headers.length).setValues([rowValues]);
            return accountData;
        } else {
            throw new Error('Account not found for update');
        }
    }
}

/**
 * Main mutation handler
 * payload = {
 *   action: "get" | "create" | "update",
 *   data?: string (JSON stringified account data)
 * }
 */
function mutateRow(payload) {
    const sheet = getOrCreateSheet();
    
    try {
        if (payload.action === "get") {
            // Parse data if provided (for filtering)
            let filterEmail = null;
            if (payload.data) {
                try {
                    const dataObj = JSON.parse(payload.data);
                    filterEmail = dataObj.email || null;
                } catch (e) {
                    // Ignore parse errors, return all accounts
                }
            }
            
            const accounts = getAccounts(filterEmail);
            return accounts;
        }
        
        if (payload.action === "create") {
            if (!payload.data) throw new Error("Missing data for create");
            
            const accountData = JSON.parse(payload.data);
            const now = new Date().toISOString();
            
            // Ensure required fields
            if (!accountData.id) {
                // Generate ID based on row number
                const lastRow = sheet.getLastRow();
                accountData.id = String(lastRow); // Will be row number after append
            }
            if (!accountData.createdAt) accountData.createdAt = now;
            if (!accountData.updatedAt) accountData.updatedAt = now;
            
            const created = writeAccountRow(sheet, accountData, true);
            return created;
        }
        
        if (payload.action === "update") {
            if (!payload.data) throw new Error("Missing data for update");
            
            const accountData = JSON.parse(payload.data);
            if (!accountData.id) throw new Error("Missing id for update");
            
            accountData.updatedAt = new Date().toISOString();
            
            const updated = writeAccountRow(sheet, accountData, false);
            return updated;
        }
        
        throw new Error("Invalid action: " + payload.action);
    } catch (error) {
        throw new Error("Mutation error: " + (error.message || String(error)));
    }
}
