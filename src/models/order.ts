/**
 * @file This file contains CRUD functions for the Order model.
 * These functions interact with a Google Apps Script backend.
 */
import type { BatchEntry, BatchResponseItem } from '../types/general';
import { Customer, type IOrder } from '../types/models';
import { jsonpRequest, SCRIPT_URL } from '../utils/index';
import { getCustomers } from './customers';
import { getStocks } from './stock';

export const getOrders = async (params: Record<string, string> = {}): Promise<IOrder[]> => {
  return jsonpRequest<IOrder[]>("Orders", params);
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
    body: JSON.stringify({ sheet: 'Orders', id: Order.id, data: JSON.stringify(Order) }),
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
 * @param orderData         The order header (customer, totals, etc.)
 * @param items             Array of sales items (variantId, qty, price, etc.)
 * @param customer          The Customer to whom the order belongs
 * @param totalAmount       The Total Amount of the Order
 * @param totalPayedAmount  The Amount the Customer payed
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
  }>,
  customer: Customer,
  totalAmount: number,
  totalPayedAmount: number
) => {

  const variantIds = [...new Set(items.map(item => item.variantId))]

  let _customer = customer;
  try {
    const fetched = await getCustomers({ id: customer.id });
    if (fetched && fetched[0]) {
      _customer = new Customer(fetched[0]);
    }
  } catch (e) {
    console.warn("Failed to refresh customer data during checkout, using local copy", e);
  }
  const stock = await getStocks({ variantId: variantIds });

  _customer.outstandingBalance = (_customer.outstandingBalance ?? 0) + (totalAmount - totalPayedAmount)
  const _items = stock.map(s => {
    const item = items.find(item => item.variantId === s.variantId);
    if (!item || item.quantity > s.quantity) return null;
    return {
      variantId: item.variantId,
      quantity: item.quantity,
      unit: item.unit,
      sellingPrice: item.sellingPrice,
      total: item.sellingPrice,
      customerId: item.customerId,
      paymentMethod: item.paymentMethod,
      stock_id: s.id
    }
  }).filter(item => item != null);

  const operations: unknown[] = [];

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
  _items.forEach(item => {
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

  // C. Customer
  operations.push({
    type: "update",
    sheet: "Customers",
    id: customer.id,
    data: {
      ..._customer,
      updatedAt: new Date().toISOString()
    }
  })

  // D. StockMovements Rows
  _items.forEach(item => {
    operations.push({
      type: "create",
      sheet: "StockMovements",
      data: {
        variantId: item.variantId,
        change: item.quantity * -1,
        unit: item.unit,
        type: 'sale',
        refId: "__REF(0).id__",
        createdAt: new Date().toISOString()
      }
    });
  });

  // E. Stock Rows
  stock.forEach(s => {
    const item = _items.find(item => item.variantId === s.variantId);
    if (!item) return;

    operations.push({
      type: "update",
      sheet: "Stock",
      id: item.stock_id,
      data: {
        variantId: s.variantId,
        quantity: (s.quantity - item.quantity),
        unit: s.unit,
        batchCode: s.batchCode,
        metadata: s.metadata,
        location: s.location,
        updatedAt: new Date().toISOString(),
      }
    });
  });

  const response = await jsonpRequest<BatchResponseItem>('Orders', {
    action: "batch",
    data: JSON.stringify({ operations })  // IMPORTANT!
  });

  const batch = response;

  const orderId = batch.results[0].id;
  const salesItemIds = batch.results.slice(1).map((r: BatchEntry) => r.id);

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

