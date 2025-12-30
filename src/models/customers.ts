/**
 * @file CRUD functions for the Customer model.
 * Works with Google Apps Script JSONP backend.
 */
import type { ICustomer } from '../types/models.ts';
import { jsonpRequest } from '../utils.ts';

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
  Customer: Omit<ICustomer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ICustomer> => {
  const result = await jsonpRequest<{ id: string, now: string }>('Customers', {
    action: "create",
    data: JSON.stringify(Customer),
  });

  return { ...Customer, id: result.id, createdAt: result.now, updatedAt: result.now } as ICustomer;
};

/**
 * UPDATE Customer
 */
export const updateCustomer = async (
  Customer: Partial<ICustomer> & { id: string }
): Promise<ICustomer> => {
  const result = await jsonpRequest<{ status: string, now: string }>('Customers', {
    action: "update",
    id: Customer.id,
    data: JSON.stringify(Customer),
  });

  return { ...Customer, updatedAt: result.now } as ICustomer;
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
