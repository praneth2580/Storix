/**
 * @file CRUD functions for the Variant model.
 * Works with Google Apps Script JSONP backend.
 */
import type { IVariant } from '../types/models.ts';
import { jsonpRequest } from '../utils/index.ts';

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

export const createVariant = async (
  variant: Omit<IVariant, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IVariant> => {
  const result = await jsonpRequest<IVariant>('Variants', {
    action: "create",
    data: JSON.stringify(variant),
  });

  return result;
};

export const updateVariant = async (
  variant: Partial<IVariant> & { id: string }
): Promise<IVariant> => {
  const result = await jsonpRequest<IVariant>('Variants', {
    action: "update",
    data: JSON.stringify(variant),
  });

  return result;
};

export const deleteVariant = async (id: string): Promise<{ success: boolean }> => {
  const result = await jsonpRequest<{ success: boolean }>('Variants', {
    action: "delete",
    id,
  });

  return result;
};
