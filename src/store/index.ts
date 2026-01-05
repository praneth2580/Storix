import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import salesReducer from './slices/salesSlice';
import purchasesReducer from './slices/purchasesSlice';
import suppliersReducer from './slices/suppliersSlice';
import customersReducer from './slices/customersSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import snackbarReducer from './slices/snackbarSlice';
import logReducer from './slices/logSlice';
import { errorMiddleware } from './middleware/errorMiddleware';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        sales: salesReducer,
        purchases: purchasesReducer,
        suppliers: suppliersReducer,
        customers: customersReducer,
        orders: ordersReducer,
        ui: uiReducer,
        settings: settingsReducer,
        snackbar: snackbarReducer,
        log: logReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(errorMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
