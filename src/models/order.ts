/**
 * @file This file contains CRUD functions for the Order model.
 * These functions interact with a Google Apps Script backend.
 */
import type { IOrder } from '../types/models';
import { jsonpRequest, SCRIPT_URL } from '../utils';

export const getOrders = async (params: Record<string, string> = {}): Promise<IOrder[]> => {
  return jsonpRequest<IOrder>("Orders", params);
};

export const createOrder = async (Order: Omit<IOrder, 'id' | 'date'>): Promise<IOrder> => {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheet: 'Orders', ...Order }),
  });
  if (!response.ok) throw new Error('Failed to create Order');
  const { data } = await response.json();
  return data as IOrder;
};

export const updateOrder = async (Order: Partial<IOrder> & { id: string }): Promise<IOrder> => {
  const response = await fetch(SCRIPT_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheet: 'Orders', ...Order }),
  });
  if (!response.ok) throw new Error('Failed to update Order');
  const { data } = await response.json();
  return data as IOrder;
};

export const deleteOrder = async (id: string): Promise<{ success: boolean }> => {
  const query = new URLSearchParams({ sheet: 'Orders', id }).toString();
  const response = await fetch(`${SCRIPT_URL}?${query}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete Order');
  return await response.json();
};

/**
 * Creates an order + multiple sales items in a single batch request.
 * @param orderData   The order header (customer, totals, etc.)
 * @param items       Array of sales items (variantId, qty, price, etc.)
 */
export const createBatchOrder = async (
  orderData: Omit<IOrder, 'id' | 'date' | 'createdAt' | 'updatedAt'>,
  items: Array<{
    variantId: string;
    quantity: number;
    unit: string;
    sellingPrice: number;
    total: number;
    customerId: string;
    paymentMethod: string;
  }>
) => {

  const operations: any[] = [];

  // A. Order Create (index 0)
  operations.push({
    type: "create",
    sheet: "Orders",
    data: {
      ...orderData,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString()
    }
  });

  // B. Sales Rows
  items.forEach(item => {
    operations.push({
      type: "create",
      sheet: "Sales",
      data: {
        ...item,
        orderId: "__REF(0).id__",
        date: new Date().toISOString()
      }
    });
  });

  // NOW SEND AS "data"
  const response = await jsonpRequest<any>('Orders', {
    action: "batch",
    data: JSON.stringify({ operations })  // IMPORTANT!
  });

  const batch = response;

  const orderId = batch.results[0].id;
  const salesItemIds = batch.results.slice(1).map((r: any) => r.id);

  return {
    orderId,
    salesItemIds,
    raw: batch
  };
};



// export const createBatchOrder = async (
//   orderData: Omit<IOrder, 'id' | 'date' | 'createdAt' | 'updatedAt'>,
//   items: Array<{
//     variantId: string;
//     quantity: number;
//     unit: string;
//     sellingPrice: number;
//     total: number;
//     customerId: string;
//     paymentMethod: string;
//   }>
// ) => {

//   // 1️⃣ Build the operations array
//   const operations: any[] = [];

//   // A. Create Order (index 0)
//   operations.push({
//     type: "create",
//     sheet: "Orders",
//     data: {
//       ...orderData,
//       createdAt: new Date().toISOString(),
//       date: new Date().toISOString()
//     }
//   });

//   // B. Create Sales referencing order (index > 0)
//   items.forEach(item => {
//     operations.push({
//       type: "create",
//       sheet: "Sales",
//       data: {
//         ...item,
//         orderId: "__REF(0).id__",     // backend will replace this with created order ID
//         date: new Date().toISOString()
//       }
//     });
//   });

//   // 2️⃣ Send GET JSONP request
//   const result = await jsonpRequest<any>('Orders', {
//     action: "batch",
//     operations: JSON.stringify(operations) // operations
//   });

//   const batch = result[0];

//   // 3️⃣ Extract IDs
//   const orderId = batch.results[0].id;
//   const salesItemIds = batch.results.slice(1).map((res: any) => res.id);

//   return {
//     orderId,
//     salesItemIds,
//     raw: batch
//   };
// };

