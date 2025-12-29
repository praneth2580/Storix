/**
 * @file CRUD functions for the Customer model.
 * Works with Google Apps Script JSONP backend.
 */
import type { ICustomer } from '../types/models.ts';
import { jsonpRequest } from '../utils/index.ts';

/**
 * GET Customers
 */
export const getCustomers = async (
  params: Record<string, string> = {}
): Promise<ICustomer[]> => {
  return jsonpRequest<ICustomer[]>('Customers', {
    action: "get",
    ...params,
  });
};

/**
 * CREATE Customer
 * Google Apps Script returns: [{ id: "...", ... }]
 */
export const createCustomer = async (
  customer: Omit<ICustomer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ICustomer> => {
  const result = await jsonpRequest<ICustomer>('Customers', {
    action: "create",
    data: JSON.stringify(customer),
  });

  return result;
};

/**
 * UPDATE Customer
 */
export const updateCustomer = async (
  customer: Partial<ICustomer> & { id: string }
): Promise<ICustomer> => {
  const { id, ...rest } = customer;

  const result = await jsonpRequest<ICustomer>('Customers', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result;
};

/**
 * DELETE Customer
 */
export const deleteCustomer = async (id: string): Promise<{ success: boolean }> => {
  const result = await jsonpRequest<{ success: boolean }>('Customers', {
    action: "delete",
    id,
  });

  return result;
};
