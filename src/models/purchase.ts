/**
 * @file CRUD functions for Purchase model using Google Apps Script GET API
 */
import type { IPurchase } from '../types/models';
import { jsonpRequest } from '../utils/index';

/**
 * GET Purchases (with optional filters)
 */
export const getPurchases = async (
  params: Record<string, string> = {}
): Promise<IPurchase[]> => {
  return jsonpRequest<IPurchase[]>('Purchases', {
    action: "get",
    ...params,
  });
};

export const createPurchase = async (
  purchase: Omit<IPurchase, 'id' | 'date' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Purchases', {
    action: "create",
    data: JSON.stringify(purchase),
  });

  return result;
};

export const updatePurchase = async (
  purchase: Partial<IPurchase> & { id: string }
): Promise<{ status: string }> => {

  const { id, ...rest } = purchase;

  const result = await jsonpRequest<{ status: string }>('Purchases', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};

export const deletePurchase = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Purchases', {
    action: "delete",
    id,
  });

  return result;
};
