import { Middleware } from '@reduxjs/toolkit';
import { addSnackbar } from '../slices/snackbarSlice';
import { addLog } from '../slices/logSlice';

export const errorMiddleware: Middleware = (store) => (next) => (action) => {
  // Check if action is rejected
  if (action.type?.endsWith('/rejected')) {
    const errorMessage = action.error?.message || action.payload?.message || 'An error occurred';
    const actionName = action.type.split('/')[0] || 'Unknown';
    
    // Dispatch snackbar notification
    store.dispatch(addSnackbar({
      message: `Error: ${errorMessage}`,
      type: 'error',
      duration: 6000,
    }));
    
    // Log error
    store.dispatch(addLog({
      level: 'error',
      message: `Action failed: ${actionName}`,
      source: actionName,
      details: errorMessage,
    }));
  }
  
  return next(action);
};

