import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import salesReducer from './slices/salesSlice';
import purchasesReducer from './slices/purchasesSlice';
import suppliersReducer from './slices/suppliersSlice';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        sales: salesReducer,
        purchases: purchasesReducer,
        suppliers: suppliersReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
