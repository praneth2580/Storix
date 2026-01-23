/**
 * Google Sheets API v4 Service
 * Handles all CRUD operations with Google Sheets
 */

import { googleAuth } from './googleAuth';

const SPREADSHEET_ID = '1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek';
const API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetRow {
  [key: string]: unknown;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  sheet: string;
  id?: string;
  data?: Record<string, unknown>;
}

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
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Sheet doesn't exist, return empty array
        return [];
      }
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
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
      const value = rowData[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });

    // Append row
    const range = `${sheetName}!A:ZZ`;
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create row: ${response.statusText}`);
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
      const value = updatedRow[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });

    // Update row (rowIndex + 2 because: 1 for header row, 1 for 1-based indexing)
    const rowNumber = rowIndex + 2;
    const range = `${sheetName}!A${rowNumber}:ZZ${rowNumber}`;
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update row: ${response.statusText}`);
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
    const batchUrl = `${API_BASE_URL}/${SPREADSHEET_ID}:batchUpdate`;
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
      const errorText = await batchResponse.text();
      throw new Error(`Failed to delete row: ${batchResponse.statusText}. ${errorText}`);
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
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}?fields=sheets.properties`;

    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
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
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
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
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}:batchUpdate`;
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
      throw new Error(`Failed to create sheet: ${response.statusText}`);
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
    const url = `${API_BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: headersToUse,
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set headers: ${response.statusText}`);
    }
  }
}

// Export singleton instance
export const googleSheetsApi = new GoogleSheetsApiService();
