/**
 * @file CRUD functions for Product model using Google Apps Script GET API
 */
import type { IStock } from '../types/models.ts';
import { jsonpRequest } from '../utils/index.ts';

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

  return jsonpRequest<IStock[]>('Stock', {
    action: "get",
    ...finalParams,
  });
};

export const createStock = async (
  stock: Omit<IStock, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Stock', {
    action: "create",
    data: JSON.stringify(stock),
  });

  return result;
};

export const updateStock = async (
  stock: Partial<IStock> & { id: string }
): Promise<{ status: string }> => {
  const { id, ...rest } = stock;

  const result = await jsonpRequest<{ status: string }>('Stock', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};

export const deleteStock = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Stock', {
    action: "delete",
    id,
  });

  return result;
};
