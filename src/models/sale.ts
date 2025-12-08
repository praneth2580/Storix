/**
 * @file CRUD functions for Sale model using Google Apps Script GET API
 */
import type { ISale } from '../types/models';
import { jsonpRequest } from '../utils';


/**
 * GET Sales (with optional filters)
 */
export const getSales = async (
  params: Record<string, string> = {}
): Promise<ISale[]> => {
  return jsonpRequest<ISale>('Sales', {
    action: "get",
    ...params,
  });
};


/**
 * CREATE Sale  
 * Uses action=create  
 * Sends ?action=create&sheet=Sales&data={}
 */
export const createSale = async (
  sale: Omit<ISale, 'id' | 'date' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string }> => {

  const result = await jsonpRequest<{ id: string }>('Sales', {
    action: "create",
    data: JSON.stringify(sale),
  });

  return result[0];
};


/**
 * UPDATE Sale  
 * Uses action=update&id=123&data={}
 */
export const updateSale = async (
  sale: Partial<ISale> & { id: string }
): Promise<{ status: string }> => {

  const { id, ...rest } = sale;

  const result = await jsonpRequest<{ status: string }>('Sales', {
    action: "update",
    id,
    data: JSON.stringify(rest),
  });

  return result[0];
};


/**
 * DELETE Sale  
 * Uses action=delete&id=123
 */
export const deleteSale = async (
  id: string
): Promise<{ status: string }> => {

  const result = await jsonpRequest<{ status: string }>('Sales', {
    action: "delete",
    id,
  });

  return result[0];
};
