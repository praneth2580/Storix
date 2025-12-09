/**
 * @file CRUD functions for Product model using Google Apps Script GET API
 */
import type { IStock } from '../types/models.ts';
import { jsonpRequest } from '../utils.ts';

/**
 * GET Stock (with optional filters)
 */
export const getStocks = async (
  params: Record<string, string | string[]> = {}
): Promise<IStock[]> => {
  const finalParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    finalParams[key] = Array.isArray(value) ? value.join(",") : value;
  });

  return jsonpRequest<IStock>('Stock', {
    action: "get",
    ...finalParams,
  });
};

/**
 * CREATE Product  
 * Uses action=create  
 * Sends ?action=create&sheet=Stock&data={}
 */
export const createStock = async (
  stock: Omit<IStock, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Stock', {
    action: "create",
    data: JSON.stringify(stock),
  });

  // result is an array → return first item
  return result[0];
};


/**
 * UPDATE Product  
 * Uses action=update&id=123&data={}
 */
export const updateStock = async (
  stock: Partial<IStock> & { id: string }
): Promise<{ status: string }> => {
  const { id, ...rest } = stock;

  const result = await jsonpRequest<{ status: string }>('Stock', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result[0]
};

/**
 * DELETE Product  
 * Uses action=delete&id=123
 */
export const deleteStock = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Stock', {
    action: "delete",
    id,
  });

  return result[0]
};
