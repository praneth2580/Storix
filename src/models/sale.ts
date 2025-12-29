/**
 * @file CRUD functions for Sale model using Google Apps Script GET API
 */
import type { ISale } from '../types/models';
import { jsonpRequest } from '../utils/index';


/**
 * GET Sales (supports multi-value filters)
 *
 * Example:
 * getSales({ variantId: ["4", "8"], paymentMethod: "cash,upi" })
 */
export const getSales = async (
  params: Record<string, unknown> = {}
): Promise<ISale[]> => {
  const queryParams: Record<string, string> = { action: "get" };

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Arrays → comma-separated "a,b,c"
    if (Array.isArray(value)) {
      queryParams[key] = value.join(",");
    }
    // Numbers → toString
    else if (typeof value === "number") {
      queryParams[key] = String(value);
    }
    // Strings → pass as-is
    else {
      queryParams[key] = String(value);
    }
  });

  return jsonpRequest<ISale[]>("Sales", queryParams);
};


export const createSale = async (
  sale: Omit<ISale, 'id' | 'date' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Sales', {
    action: "create",
    data: JSON.stringify(sale),
  });

  return result;
};


export const updateSale = async (
  sale: Partial<ISale> & { id: string }
): Promise<{ status: string }> => {

  const { id, ...rest } = sale;

  const result = await jsonpRequest<{ status: string }>('Sales', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};


export const deleteSale = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Sales', {
    action: "delete",
    id,
  });

  return result;
};
