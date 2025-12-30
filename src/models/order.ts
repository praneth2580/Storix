/**
 * @file This file contains CRUD functions for the Order model.
 * These functions interact with a Google Apps Script backend.
 */
import type { BatchEntry, BatchResponseItem } from '../types/general';
import type { Customer, IOrder } from '../types/models';
import { jsonpRequest } from '../utils';
import { getCustomers } from './customers';
import { getStocks } from './stock';

export const getOrders = async (params: Record<string, string> = {}): Promise<IOrder[]> => {
  const data = await jsonpRequest<IOrder[]>("Orders", {
    action: "get",
    ...params,
  });

  return data.map(order => ({
    ...order,
    id: String(order.id),
    customerId: order.customerId ? String(order.customerId) : undefined
  }));
};

export const createOrder = async (Order: Omit<IOrder, 'id' | 'date' | 'createdAt' | 'updatedAt'>): Promise<IOrder> => {
  const result = await jsonpRequest<{ id: string, now: string }>("Orders", {
    action: "create",
    data: JSON.stringify(Order),
  });

  return { ...Order, id: result.id, date: result.now, createdAt: result.now, updatedAt: result.now } as IOrder;
};

export const updateOrder = async (Order: Partial<IOrder> & { id: string }): Promise<IOrder> => {
  const result = await jsonpRequest<{ status: string, now: string }>("Orders", {
    action: "update",
    id: Order.id,
    data: JSON.stringify(Order),
  });

  return { ...Order, updatedAt: result.now } as IOrder;
};

export const deleteOrder = async (id: string): Promise<{ success: boolean }> => {
  return jsonpRequest<{ success: boolean }>("Orders", {
    action: "delete",
    id,
  });
};

/**
 * Creates an order + multiple sales items.
 * Since backend removed __REF support, we must:
 * 1. Create Order explicitly.
 * 2. Use ID to create dependents via Batch.
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
  const _customer = (await getCustomers({ id: customer.id }))?.[0]; // getCustomers returns array
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

  // 1. Create Order First
  const createdOrder = await createOrder(orderData);
  const orderId = createdOrder.id;
  const now = createdOrder.createdAt;

  const operations: unknown[] = [];

  // B. Sales Rows (linked to orderId)
  _items.forEach(item => {
    operations.push({
      action: "create", // Use 'action', not 'type'
      sheet: "Sales",
      data: {
        ...item,
        orderId: orderId, // Use real ID
        date: now
      }
    });
  });

  // C. Customer
  operations.push({
    action: "update",
    sheet: "Customers",
    id: customer.id, // ID at top level for update
    data: {
      id: customer.id, // ID inside data too for safety
      ..._customer,
      updatedAt: now
    }
  })

  // D. StockMovements Rows
  _items.forEach(item => {
    operations.push({
      action: "create",
      sheet: "StockMovements",
      data: {
        variantId: item.variantId,
        change: item.quantity * -1,
        unit: item.unit,
        type: 'sale',
        refId: orderId,
        createdAt: now
      }
    });
  });

  // E. Stock Rows
  stock.forEach(s => {
    const item = _items.find(item => item.variantId === s.variantId);
    if (!item) return;

    operations.push({
      action: "update",
      sheet: "Stock",
      id: item.stock_id,
      data: {
        id: item.stock_id,
        variantId: s.variantId,
        quantity: (s.quantity - item.quantity),
        unit: s.unit,
        batchCode: s.batchCode,
        metadata: s.metadata,
        location: s.location,
        updatedAt: now,
      }
    });
  });

  // Send batch for the rest
  const response = await jsonpRequest<{ results: any[] }>('Orders', {
    action: "batch",
    data: JSON.stringify({ operations })
  });

  // Construct return similar to before
  const salesItemIds = response.results
    .filter((r: any) => r.sheet === 'Sales' && r.status === 'created')
    .map((r: any) => r.id);

  return {
    orderId,
    salesItemIds,
    raw: response
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

