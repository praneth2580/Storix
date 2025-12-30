/**
 * @file CRUD functions for Purchase model using Google Apps Script GET API
 */
import type { IPurchase } from '../types/models';
import { jsonpRequest } from '../utils';

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


/**
 * CREATE Purchase  
 * Uses action=create  
 * Sends ?action=create&sheet=Purchases&data={}
 */
export const createPurchase = async (
  purchase: Omit<IPurchase, 'id' | 'date' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string, now: string }>('Purchases', {
    action: "create",
    data: JSON.stringify(purchase),
  });

  return { ...purchase, id: result.id };
};


/**
 * UPDATE Purchase  
 * Uses action=update&id=123&data={}
 */
export const updatePurchase = async (
  purchase: Partial<IPurchase> & { id: string }
): Promise<{ status: string }> => {

  const { id, ...rest } = purchase;

  const result = await jsonpRequest<{ status: string, id: string, now: string }>('Purchases', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};


/**
 * DELETE Purchase  
 * Uses action=delete&id=123
 */
export const deletePurchase = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Purchases', {
    action: "delete",
    id,
  });

  return result;
};
