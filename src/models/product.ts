/**
 * @file CRUD functions for Product model using Google Apps Script GET API
 */
import type { IProduct } from '../types/models.ts';
import { jsonpRequest } from '../utils.ts';

/**
 * GET Products (with optional filters)
 */
export const getProducts = async (
  params: Record<string, string> = {}
): Promise<IProduct[]> => {
  return jsonpRequest<IProduct[]>('Products', {
    action: "get",
    ...params,
  });
};


/**
 * CREATE Product  
 * Uses action=create  
 * Sends ?action=create&sheet=Products&data={}
 */
export const createProduct = async (
  product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ status: string, id: string, now: string }>('Products', {
    action: "create",
    data: JSON.stringify(product),
  });

  return { ...product, id: result.id, createdAt: result.now, updatedAt: result.now } as IProduct;
};


/**
 * UPDATE Product  
 * Uses action=update&id=123&data={}
 */
export const updateProduct = async (
  product: Partial<IProduct> & { id: string }
): Promise<{ status: string }> => {
  const { id, ...rest } = product;

  const result = await jsonpRequest<{ status: string, id: string, now: string }>('Products', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result; // status object
};

/**
 * DELETE Product  
 * Uses action=delete&id=123
 */
export const deleteProduct = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Products', {
    action: "delete",
    id,
  });

  return result;
};
