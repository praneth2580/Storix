/**
 * @file CRUD functions for the Variant model.
 * Works with Google Apps Script JSONP backend.
 */
import type { IVariant } from '../types/models.ts';
import { jsonpRequest } from '../utils.ts';

/**
 * GET Variants
 */
export const getVariants = async (
  params: Record<string, string> = {}
): Promise<IVariant[]> => {
  return jsonpRequest<IVariant[]>('Variants', {
    action: "get",
    ...params,
  });
};

/**
 * CREATE Variant
 * Google Apps Script returns: [{ id: "...", ... }]
 */
export const createVariant = async (
  variant: Omit<IVariant, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IVariant> => {
  // Ensure attributes is a string
  const payload = { ...variant };
  if (payload.attributes && typeof payload.attributes !== 'string') {
    payload.attributes = JSON.stringify(payload.attributes);
  }

  const result = await jsonpRequest<{ status: string, id: string, now: string, sheet: string }>('Variants', {
    action: "create",
    data: JSON.stringify(payload),
  });

  // Construct the returned object (optimistic)
  return {
    ...variant,
    id: result.id,
    createdAt: result.now,
    updatedAt: result.now,
    stock: 0, // default
    lowStock: 0, // default
    attributes: typeof payload.attributes === 'string' ? JSON.parse(payload.attributes) : payload.attributes || {}
  } as IVariant;
};

/**
 * UPDATE Variant
 */
export const updateVariant = async (
  variant: Partial<IVariant> & { id: string }
): Promise<IVariant> => {
  const payload = { ...variant };
  if (payload.attributes && typeof payload.attributes !== 'string') {
    payload.attributes = JSON.stringify(payload.attributes);
  }

  const result = await jsonpRequest<{ status: string, now: string }>('Variants', {
    action: "update",
    data: JSON.stringify(payload),
  });

  return { ...variant, updatedAt: result.now } as IVariant;
};

/**
 * DELETE Variant
 */
export const deleteVariant = async (id: string): Promise<{ success: boolean }> => {
  const result = await jsonpRequest<{ success: boolean }>('Variants', {
    action: "delete",
    id,
  });

  return result;
};
