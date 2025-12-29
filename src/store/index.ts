import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import dataReducer from './slices/dataSlice';
import settingsReducer from "./slices/settingsSlice";
import syncReducer from "./slices/syncSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    data: dataReducer,
    settings: settingsReducer,
    sync: syncReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
