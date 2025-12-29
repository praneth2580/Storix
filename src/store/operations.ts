import { store } from "./index";
import type { RootState } from "./index";
import { mergeChanges, removeData } from "./slices/dataSlice";
import { addPending } from "./slices/syncSlice";
import { processPending } from "../utils/syncEngine";

import { createSelector } from "@reduxjs/toolkit";

// Input Selectors
const selectProductsState = (state: RootState) => state.data.Products;
const selectVariantsState = (state: RootState) => state.data.Variants;
const selectStockState = (state: RootState) => state.data.Stock;
const selectCustomersState = (state: RootState) => state.data.Customers;
const selectSuppliersState = (state: RootState) => state.data.Suppliers;
const selectOrdersState = (state: RootState) => state.data.Orders;
const selectSalesState = (state: RootState) => state.data.Sales;
const selectPurchasesState = (state: RootState) => state.data.Purchases;
const selectStockMovementsState = (state: RootState) => state.data.StockMovements;

// --------------------------------------------------
// PRODUCTS
// --------------------------------------------------

export const selectAllJoinedProducts = createSelector(
  [selectProductsState, selectVariantsState, selectStockState],
  (products, variants, stock) => {
    return Object.values(products).map(product => {
      const productVariants = Object.values(variants).filter(
        v => v.productId === product.id
      );
      const productStock = Object.values(stock).filter(
        s => s.productId === product.id
      );
      return { ...product, variants: productVariants, stock: productStock };
    });
  }
);

export const joinProduct = (state: RootState, productId: string) => {
  // Note: This is still an un-memoized helper for specific ID lookup if needed urgently,
  // but ideally we select from the memoized list or create a parametric selector.
  // However, maintaining the old signature for backward compat:
  const product = state.data.Products[productId];
  if (!product) return null;
  const variants = Object.values(state.data.Variants).filter(v => v.productId === productId);
  const stock = Object.values(state.data.Stock).filter(s => s.productId === productId);
  return { ...product, variants, stock };
}
// For useAllProducts selector alias
export const joinAllProducts = selectAllJoinedProducts;


// --------------------------------------------------
// VARIANTS
// --------------------------------------------------

export const selectAllJoinedVariants = createSelector(
  [selectVariantsState, selectProductsState, selectStockState],
  (variants, products, stock) => {
    return Object.values(variants).map(variant => {
      const product = products[variant.productId];
      const variantStock = Object.values(stock).filter(
        s => s.variantId === variant.id
      );
      return { ...variant, product, stock: variantStock };
    });
  }
);

export const joinAllVariants = selectAllJoinedVariants;


// --------------------------------------------------
// STOCK
// --------------------------------------------------

export const selectAllJoinedStock = createSelector(
  [selectStockState, selectProductsState, selectVariantsState, selectStockMovementsState],
  (stockMap, products, variants, movementsMap) => {
    return Object.values(stockMap).map(stock => {
      const product = products[stock.productId];
      const variant = variants[stock.variantId];
      const movements = Object.values(movementsMap).filter(
        mv => mv.stockId === stock.id
      );
      return { ...stock, product, variant, movements };
    });
  }
);

export const joinStock = (state: RootState, stockId: string) => {
  // Helper helper
  const stock = state.data.Stock[stockId];
  if (!stock) return null;
  return {
    ...stock,
    product: state.data.Products[stock.productId],
    variant: state.data.Variants[stock.variantId],
    movements: Object.values(state.data.StockMovements).filter(m => m.stockId === stockId)
  }
}

export const joinAllStock = selectAllJoinedStock;

// --------------------------------------------------
// OTHERS (Similar pattern if needed, keeping originals for now if not hot path but fixing export)
// --------------------------------------------------

// Customers
export const selectAllJoinedCustomers = createSelector(
  [selectCustomersState, selectOrdersState, selectSalesState],
  (customers, orders, sales) => {
    return Object.values(customers).map(c => ({
      ...c,
      orders: Object.values(orders).filter(o => o.customerId === c.id),
      sales: Object.values(sales).filter(s => s.customerId === c.id)
    }));
  }
);
export const joinAllCustomers = selectAllJoinedCustomers;

// Suppliers
export const selectAllJoinedSuppliers = createSelector(
  [selectSuppliersState, selectPurchasesState, selectStockState],
  (suppliers, purchases, stock) => {
    return Object.values(suppliers).map(s => ({
      ...s,
      purchases: Object.values(purchases).filter(p => p.supplierId === s.id),
      stockItems: Object.values(stock).filter(st => st.supplierId === s.id)
    }))
  }
);
export const joinAllSuppliers = selectAllJoinedSuppliers;

// Orders
export const selectAllJoinedOrders = createSelector(
  [selectOrdersState, selectCustomersState, selectStockMovementsState],
  (orders, customers, movements) => {
    return Object.values(orders).map(o => ({
      ...o,
      customer: customers[o.customerId],
      items: Object.values(movements).filter(m => m.orderId === o.id)
    }));
  }
);
export const joinAllOrders = selectAllJoinedOrders;

// Sales
export const selectAllJoinedSales = createSelector(
  [selectSalesState, selectCustomersState, selectStockMovementsState],
  (sales, customers, movements) => {
    return Object.values(sales).map(s => ({
      ...s,
      customer: customers[s.customerId],
      items: Object.values(movements).filter(m => m.saleId === s.id)
    }));
  }
);
export const joinAllSales = selectAllJoinedSales;

// Purchases
export const selectAllJoinedPurchases = createSelector(
  [selectPurchasesState, selectSuppliersState, selectStockMovementsState],
  (purchases, suppliers, movements) => {
    return Object.values(purchases).map(p => ({
      ...p,
      supplier: suppliers[p.supplierId],
      items: Object.values(movements).filter(m => m.purchaseId === p.id)
    }));
  }
);
export const joinAllPurchases = selectAllJoinedPurchases;

// Movements
export const selectAllJoinedMovements = createSelector(
  [selectStockMovementsState, selectProductsState, selectVariantsState, selectStockState, selectOrdersState, selectSalesState, selectPurchasesState],
  (movements, products, variants, stock, orders, sales, purchases) => {
    return Object.values(movements).map(mv => ({
      ...mv,
      product: products[mv.productId],
      variant: variants[mv.variantId],
      stock: stock[mv.stockId],
      order: orders[mv.orderId],
      sale: sales[mv.saleId],
      purchase: purchases[mv.purchaseId]
    }));
  }
);
export const joinAllMovements = selectAllJoinedMovements;

/*
export function joinProduct(state: RootState, productId: string) {
  const product = state.data.Products[productId];
  if (!product) return null;

  const variants = Object.values(state.data.Variants).filter(
    v => v.productId === productId
  );

  const stock = Object.values(state.data.Stock).filter(
    s => s.productId === productId
  );

  return { ...product, variants, stock };
}
*/
// ... keeping other specific joins as helpers if needed but effectively usage should migrate to selectors or memoized parametric selectors.
// To avoid breaking changes in hooks.ts if it uses specific joins, I kept the `joinProduct` and `joinStock` function stubs above slightly modified or simplified. 
// Ideally we replace all logic with createSelector.
// For the purpose of "joinStock" called by `useJoinedProduct` etc in hooks.ts...
// logic actually was `useJoinedProduct` -> `useSelector(s => joinProduct(s, id))`
// This creates a NEW OBJECT every render.
// To fix individual item selectors, we utilize createSelector with arguments.

const selectItemId = (_state: RootState, id: string) => id;

export const selectJoinedProductById = createSelector(
  [selectProductsState, selectVariantsState, selectStockState, selectItemId],
  (products, variants, stock, id) => {
    const product = products[id];
    if (!product) return null;
    return {
      ...product,
      variants: Object.values(variants).filter(v => v.productId === id),
      stock: Object.values(stock).filter(s => s.productId === id)
    }
  }
)

// We can replace the export of joinProduct with this, but joinProduct was a function (state, id).
// It's used in hooks as: useSelector(s => joinProduct(s, id))
// We should change hooks to: useSelector(s => selectJoinedProductById(s, id))

// --------------------------------------------------
// MUTATIONS (Optimistic + Sync)
// --------------------------------------------------

export async function createItem(table: string, data: any) {
  // 1. Optimistic Update
  store.dispatch(mergeChanges({
    table,
    payload: { rows: [data], fullRefresh: false }
  }));

  // 2. Queue for Sync
  store.dispatch(addPending({
    action: 'create',
    sheet: table,
    data
  }));

  // 3. Trigger Background Sync
  processPending();
}

export async function updateItem(table: string, data: any) {
  store.dispatch(mergeChanges({
    table,
    payload: { rows: [data], fullRefresh: false }
  }));

  store.dispatch(addPending({
    action: 'update',
    sheet: table,
    data
  }));

  processPending();
}

export async function deleteItem(table: string, id: string) {
  store.dispatch(removeData({ table, id }));

  store.dispatch(addPending({
    action: 'delete',
    sheet: table,
    id // for delete, we might just need ID, but syncEngine expects 'data' or 'id' param?
    // syncEngine.ts:66 data: encodeURIComponent(JSON.stringify(task.data))
    // script.js handleDelete: id comes from parameter.id.
    // But wait, syncEngine sends task.data stringified. 
    // If task.action is delete, script.js handleDelete looks for e.parameter.id.
    // syncEngine.ts only sends `data` param if task.data is present.
    // Let's re-read syncEngine.ts.
  }));

  // Correction: syncEngine.ts puts task.data into 'data' param.
  // script.js handleDelete checks e.parameter.id.
  // SO we need to ensure syncEngine sends 'id' param OR script.js reads id from data param?
  // script.js handleDelete: const id = e.parameter && e.parameter.id;
  // It does NOT read from data param.
  // We need to fix syncEngine.ts or adapt here.
  // Actually, let's fix syncEngine.ts to handle delete correctly or pass id in data and have script.js handle it?
  // script.js handleDelete: const id = e.parameter && e.parameter.id;
  // It expects `&id=...`. syncEngine currently only sends `&data=...`.
  // Wait, the plan was to use operations.ts.
  // Let's check syncEngine.ts again.

  processPending();
}
