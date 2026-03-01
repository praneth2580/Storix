/**
 * Google Sheets API v4 Service
 * Handles all CRUD operations with Google Sheets
 */

import { googleAuth } from './googleAuth';

const DEFAULT_SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || '1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek';
const API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export function getStoredSpreadsheetId(): string {
  return localStorage.getItem('active_google_sheet_id') || DEFAULT_SPREADSHEET_ID;
}

export function setStoredSpreadsheetId(id: string) {
  localStorage.setItem('active_google_sheet_id', id);
}

export interface SheetRow {
  [key: string]: unknown;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  sheet: string;
  id?: string;
  data?: Record<string, unknown>;
}

export const REQUIRED_SHEETS_SCHEMA: Record<string, string[]> = {
  Products: ['id', 'name', 'category', 'description', 'barcode', 'type', 'baseUnit', 'sku', 'minStockLevel', 'supplierId', 'notes', 'status', 'imageUrl', 'createdAt', 'updatedAt'],
  Variants: ['id', 'productId', 'sku', 'attributes', 'cost', 'price', 'stock', 'lowStock', 'createdAt', 'updatedAt'],
  Customers: ['id', 'name', 'phone', 'email', 'address', 'notes', 'gstNumber', 'outstandingBalance', 'createdAt', 'updatedAt'],
  Suppliers: ['id', 'name', 'contactPerson', 'phone', 'email', 'address', 'notes', 'createdAt', 'updatedAt'],
  Orders: ['id', 'customerId', 'totalAmount', 'paymentMethod', 'date', 'notes', 'createdAt', 'updatedAt'],
  Sales: ['id', 'orderId', 'variantId', 'quantity', 'unit', 'sellingPrice', 'total', 'date', 'customerId', 'paymentMethod', 'createdAt', 'updatedAt'],
  Purchases: ['id', 'productId', 'variantId', 'quantity', 'costPrice', 'total', 'date', 'supplierId', 'invoiceNumber', 'createdAt', 'updatedAt'],
  Stocks: ['id', 'variantId', 'quantity', 'unit', 'batchCode', 'metadata', 'location', 'updatedAt'],
  StockMovements: ['id', 'variantId', 'change', 'unit', 'type', 'refId', 'createdAt'],
  StoreSettings: ['key', 'value', 'updatedAt'],
  LabelLayouts: ['id', 'name', 'pageSize', 'grid', 'labelSize', 'elements', 'createdAt', 'updatedAt']
};

class GoogleSheetsApiService {
  /**
   * Get access token for API requests
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await googleAuth.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Helper to parse and throw API errors
   */
  private async handleApiError(response: Response, defaultMessage: string): Promise<never> {
    let errorDetail = '';
    try {
      const errorData = await response.json();
      if (errorData?.error?.message) {
        errorDetail = ` - ${errorData.error.message}`;
        if (errorData.error.status) {
          errorDetail += ` (${errorData.error.status})`;
        }
      }
    } catch {
      // Failed to parse JSON, use status text
      errorDetail = ` - ${response.statusText}`;
    }

    if (response.status === 403 || errorDetail.includes('PERMISSION_DENIED')) {
      throw new Error(`PERMISSION_DENIED: Your Google account does not have permission to access the configured Google Sheet. Please share the sheet with your email address or check your VITE_GOOGLE_SPREADSHEET_ID.`);
    }

    throw new Error(`${defaultMessage}${errorDetail}`);
  }

  /**
   * Get all rows from a sheet
   */
  async getSheetData(sheetName: string, filters?: Record<string, string | string[]>): Promise<SheetRow[]> {
    const headers = await this.getAuthHeaders();

    // First, get the sheet metadata to find the sheet ID
    const sheetId = await this.getSheetId(sheetName, headers);
    if (!sheetId) {
      return [];
    }

    // Get all data from the sheet
    const range = `${sheetName}!A:ZZ`;
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        // Sheet doesn't exist, return empty array
        return [];
      }
      await this.handleApiError(response, 'Failed to fetch sheet data');
    }

    const data = await response.json();
    const values = data.values || [];

    if (values.length === 0) {
      return [];
    }

    // First row is headers
    const headers_row = values[0];
    const rows: SheetRow[] = [];

    // Convert rows to objects
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowObj: SheetRow = {};

      headers_row.forEach((header: string, index: number) => {
        rowObj[header] = row[index] ?? '';
      });

      // Apply filters if provided
      if (filters) {
        let matches = true;
        for (const [key, value] of Object.entries(filters)) {
          const rowValue = String(rowObj[key] || '').toLowerCase();
          const filterValues = Array.isArray(value)
            ? value.map(v => String(v).toLowerCase())
            : [String(value).toLowerCase()];

          if (value && !filterValues.some(fv => rowValue.includes(fv) || rowValue === fv)) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      rows.push(rowObj);
    }

    return rows;
  }

  /**
   * Get a single row by ID
   */
  async getRowById(sheetName: string, id: string): Promise<SheetRow | null> {
    const rows = await this.getSheetData(sheetName, { id: [id] });
    return rows.find(row => String(row.id) === String(id)) || null;
  }

  /**
   * Create a new row
   */
  async createRow(sheetName: string, data: Record<string, unknown>): Promise<{ id: string }> {
    const headers = await this.getAuthHeaders();

    // Ensure sheet exists and has headers
    await this.ensureSheetExists(sheetName, data);

    // Get sheet ID
    const sheetId = await this.getSheetId(sheetName, headers);
    if (!sheetId) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    // Get current data to determine next ID
    const existingData = await this.getSheetData(sheetName);
    const nextId = existingData.length > 0
      ? String(Number(existingData[existingData.length - 1].id || 0) + 1)
      : '1';

    // Add ID and timestamps
    const now = new Date().toISOString();
    const rowData = {
      id: nextId,
      ...data,
      ...(data.createdAt === undefined && { createdAt: now }),
      ...(data.updatedAt === undefined && { updatedAt: now }),
    };

    // Get headers
    const headers_row = await this.getSheetHeaders(sheetName, headers);

    // Convert row data to array matching header order
    const values = headers_row.map(header => {
      const value = (rowData as Record<string, unknown>)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });

    // Append row
    const range = `${sheetName}!A:ZZ`;
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to create row');
    }

    return { id: nextId };
  }

  /**
   * Update an existing row
   */
  async updateRow(sheetName: string, id: string, data: Partial<Record<string, unknown>>): Promise<{ status: string }> {
    const headers = await this.getAuthHeaders();

    // Get all rows to find the row index
    const rows = await this.getSheetData(sheetName);
    const rowIndex = rows.findIndex(row => String(row.id) === String(id));

    if (rowIndex === -1) {
      throw new Error(`Row with id ${id} not found`);
    }

    // Get headers
    const headers_row = await this.getSheetHeaders(sheetName, headers);

    // Get existing row data
    const existingRow = rows[rowIndex];
    const updatedRow = {
      ...existingRow,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Convert to array
    const values = headers_row.map(header => {
      const value = (updatedRow as Record<string, unknown>)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });

    // Update row (rowIndex + 2 because: 1 for header row, 1 for 1-based indexing)
    const rowNumber = rowIndex + 2;
    const range = `${sheetName}!A${rowNumber}:ZZ${rowNumber}`;
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to update row');
    }

    return { status: 'updated' };
  }

  /**
   * Delete a row
   */
  async deleteRow(sheetName: string, id: string): Promise<{ status: string }> {
    const headers = await this.getAuthHeaders();

    // Get all rows to find the row index
    const rows = await this.getSheetData(sheetName);
    const rowIndex = rows.findIndex(row => String(row.id) === String(id));

    if (rowIndex === -1) {
      throw new Error(`Row with id ${id} not found`);
    }

    // Get sheet ID
    const sheetId = await this.getSheetId(sheetName, headers);
    if (!sheetId) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    // Delete the row using batchUpdate (this actually removes the row)
    const batchUrl = `${API_BASE_URL}/${getStoredSpreadsheetId()}:batchUpdate`;
    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 for header row (0-indexed)
              endIndex: rowIndex + 2,   // endIndex is exclusive
            },
          },
        }],
      }),
    });

    if (!batchResponse.ok) {
      await this.handleApiError(batchResponse, 'Failed to delete row');
    }

    return { status: 'deleted' };
  }

  /**
   * Execute batch operations
   */
  async batchOperations(operations: BatchOperation[]): Promise<{ status: string; results: unknown[] }> {
    const results: unknown[] = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      try {
        // Resolve references (__REF(n).key__)
        if (op.data) {
          this.resolveReferences(op.data, results);
        }

        let result: unknown;

        switch (op.type) {
          case 'create':
            if (!op.data) throw new Error('Create operation requires data');
            result = await this.createRow(op.sheet, op.data);
            results.push({ index: i, status: 'created', sheet: op.sheet, id: (result as { id: string }).id, ...op.data });
            break;

          case 'update':
            if (!op.id || !op.data) throw new Error('Update operation requires id and data');
            result = await this.updateRow(op.sheet, op.id, op.data);
            results.push({ index: i, status: 'updated', sheet: op.sheet, id: op.id, ...op.data });
            break;

          case 'delete':
            if (!op.id) throw new Error('Delete operation requires id');
            result = await this.deleteRow(op.sheet, op.id);
            results.push({ index: i, status: 'deleted', sheet: op.sheet, id: op.id });
            break;

          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      } catch (error) {
        results.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          sheet: op.sheet,
        });
      }
    }

    return { status: 'completed', results };
  }

  /**
   * Resolve __REF(n).key__ references in data
   */
  private resolveReferences(obj: Record<string, unknown>, results: unknown[]): void {
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'string') {
        const match = value.match(/^__REF\((\d+)\)\.(\w+)__$/);
        if (match) {
          const refIndex = Number(match[1]);
          const refKey = match[2];
          const refResult = results[refIndex] as Record<string, unknown>;

          if (refResult && refResult[refKey] !== undefined) {
            obj[key] = refResult[refKey];
          } else {
            throw new Error(`Invalid reference: ${value}`);
          }
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.resolveReferences(value as Record<string, unknown>, results);
      }
    }
  }

  /**
   * Get sheet ID by name
   */
  private async getSheetId(sheetName: string, headers?: HeadersInit): Promise<number | null> {
    const authHeaders = headers || await this.getAuthHeaders();
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}?fields=sheets.properties`;

    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        await this.handleApiError(response, 'Failed to access spreadsheet metadata');
      }
      return null;
    }

    const data = await response.json();
    const sheet = data.sheets?.find((s: { properties: { title: string } }) =>
      s.properties.title === sheetName
    );

    return sheet?.properties?.sheetId || null;
  }

  /**
   * Get sheet headers
   */
  private async getSheetHeaders(sheetName: string, headers?: HeadersInit): Promise<string[]> {
    const authHeaders = headers || await this.getAuthHeaders();
    const range = `${sheetName}!1:1`;
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        await this.handleApiError(response, 'Failed to access sheet headers');
      }
      return [];
    }

    const data = await response.json();
    return data.values?.[0] || [];
  }

  /**
   * Ensure sheet exists with proper headers
   */
  private async ensureSheetExists(sheetName: string, sampleData: Record<string, unknown>): Promise<void> {
    const headers = await this.getAuthHeaders();

    // Check if sheet exists
    const sheetId = await this.getSheetId(sheetName, headers);
    if (sheetId !== null) {
      // Sheet exists, check if it has headers
      const existingHeaders = await this.getSheetHeaders(sheetName, headers);
      if (existingHeaders.length === 0) {
        // Sheet exists but has no headers, add them
        const allKeys = Object.keys(sampleData);
        await this.setSheetHeaders(sheetName, allKeys, headers);
      }
      return;
    }

    // Sheet doesn't exist, create it
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}:batchUpdate`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        }],
      }),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to create sheet');
    }

    // Add headers
    const allKeys = Object.keys(sampleData);
    await this.setSheetHeaders(sheetName, allKeys, headers);
  }

  /**
   * Set sheet headers
   */
  private async setSheetHeaders(sheetName: string, headers: string[], authHeaders?: HeadersInit): Promise<void> {
    const headersToUse = authHeaders || await this.getAuthHeaders();
    const range = `${sheetName}!1:1`;
    const url = `${API_BASE_URL}/${getStoredSpreadsheetId()}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: headersToUse,
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to set headers');
    }
  }

  /**
   * Verify if a specific spreadsheet ID is accessible
   */
  async verifySheetAccess(spreadsheetId: string): Promise<boolean> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/${spreadsheetId}?fields=sheets.properties`;

      const response = await fetch(url, { headers: authHeaders });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if a spreadsheet is completely empty (lacks required sheets)
   */
  async checkSpreadsheetStatus(spreadsheetId: string): Promise<'empty' | 'not_empty' | 'error'> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/${spreadsheetId}?fields=sheets.properties`;

      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) return 'error';

      const data = await response.json();
      const existingSheetTitles = data.sheets?.map((s: any) => s.properties.title) || [];

      // If ANY of our required schema sheets exist, it's NOT empty
      const requiredTitles = Object.keys(REQUIRED_SHEETS_SCHEMA);
      const hasAnyRequired = requiredTitles.some(t => existingSheetTitles.includes(t));

      return hasAnyRequired ? 'not_empty' : 'empty';
    } catch {
      return 'error';
    }
  }

  /**
   * Initialize a Google Sheet with the predefined schema.
   * When overwrite=true, deletes ALL existing sheets and creates fresh ones.
   */
  async initializeSpreadsheet(spreadsheetId: string, overwrite: boolean = false): Promise<boolean> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/${spreadsheetId}?fields=sheets(properties(sheetId,title))`;

      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) return false;

      const data = await response.json();
      const existingSheets: { properties: { sheetId: number; title: string } }[] = data.sheets || [];
      const requiredTitles = Object.keys(REQUIRED_SHEETS_SCHEMA);

      if (overwrite) {
        // STEP 1: Rename ALL existing sheets that conflict with our required names
        const renameRequests: any[] = [];
        const timestamp = Date.now();

        for (const sheet of existingSheets) {
          if (requiredTitles.includes(sheet.properties.title)) {
            renameRequests.push({
              updateSheetProperties: {
                properties: {
                  sheetId: sheet.properties.sheetId,
                  title: `__OLD_${sheet.properties.title}_${timestamp}`
                },
                fields: 'title'
              }
            });
          }
        }

        // Execute renames first (if any conflicts exist)
        if (renameRequests.length > 0) {
          const renameUrl = `${API_BASE_URL}/${spreadsheetId}:batchUpdate`;
          const renameRes = await fetch(renameUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ requests: renameRequests })
          });
          if (!renameRes.ok) {
            const err = await renameRes.json();
            console.error('Rename step failed:', err);
            return false;
          }
        }

        // STEP 2: Create all required schema sheets
        const createRequests: any[] = requiredTitles.map(title => ({
          addSheet: { properties: { title } }
        }));

        const createUrl = `${API_BASE_URL}/${spreadsheetId}:batchUpdate`;
        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ requests: createRequests })
        });
        if (!createRes.ok) {
          const err = await createRes.json();
          console.error('Create step failed:', err);
          return false;
        }

        // STEP 3: Delete ALL original sheets (now safe because new ones exist)
        const deleteRequests: any[] = existingSheets.map(sheet => ({
          deleteSheet: { sheetId: sheet.properties.sheetId }
        }));

        if (deleteRequests.length > 0) {
          const deleteUrl = `${API_BASE_URL}/${spreadsheetId}:batchUpdate`;
          const deleteRes = await fetch(deleteUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ requests: deleteRequests })
          });
          if (!deleteRes.ok) {
            const err = await deleteRes.json();
            console.error('Delete step failed:', err);
            // Non-fatal: new sheets were created, old ones just linger
          }
        }

      } else {
        // Non-overwrite: only create sheets that don't already exist
        const createRequests: any[] = [];
        for (const title of requiredTitles) {
          if (existingSheets.some(s => s.properties.title === title)) continue;
          createRequests.push({ addSheet: { properties: { title } } });
        }

        if (createRequests.length > 0) {
          const createUrl = `${API_BASE_URL}/${spreadsheetId}:batchUpdate`;
          const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ requests: createRequests })
          });
          if (!createRes.ok) {
            const err = await createRes.json();
            console.error('Create step failed:', err);
            return false;
          }
        }
      }

      // STEP 4: Set headers for each required sheet
      for (const [title, headers] of Object.entries(REQUIRED_SHEETS_SCHEMA)) {
        const range = `${title}!1:1`;
        const headerUrl = `${API_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

        await fetch(headerUrl, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ values: [headers] })
        });
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const googleSheetsApi = new GoogleSheetsApiService();
