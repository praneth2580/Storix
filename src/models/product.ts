/**
 * @file CRUD functions for Product model using Google Apps Script GET API
 */
import type { IProduct } from '../types/models.ts';
import { jsonpRequest } from '../utils/index.ts';

/**
 * GET Products (with optional filters)
 */
// getProducts
export const getProducts = async (
  params: Record<string, string> = {}
): Promise<IProduct[]> => {
  return jsonpRequest<IProduct[]>('Products', {
    action: "get",
    ...params,
  });
};

// ...

export const createProduct = async (
  product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Products', {
    action: "create",
    data: JSON.stringify(product),
  });

  return result;
};

export const updateProduct = async (
  product: Partial<IProduct> & { id: string }
): Promise<{ status: string }> => {
  const { id, ...rest } = product;

  const result = await jsonpRequest<{ status: string }>('Products', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};

export const deleteProduct = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Products', {
    action: "delete",
    id,
  });

  return result;
};
