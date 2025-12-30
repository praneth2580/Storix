import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import salesReducer from './slices/salesSlice';
import purchasesReducer from './slices/purchasesSlice';
import suppliersReducer from './slices/suppliersSlice';
import customersReducer from './slices/customersSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        sales: salesReducer,
        purchases: purchasesReducer,
        suppliers: suppliersReducer,
        customers: customersReducer,
        orders: ordersReducer,
        ui: uiReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
