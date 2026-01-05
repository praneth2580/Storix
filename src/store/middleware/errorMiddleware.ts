import { Middleware } from '@reduxjs/toolkit';
import { addSnackbar } from '../slices/snackbarSlice';
import { addLog } from '../slices/logSlice';

export const errorMiddleware: Middleware = (store) => (next) => (action) => {
  // Check if action is rejected
  if (action.type?.endsWith('/rejected')) {
    const error = action.error || action.payload;
    const errorMessage = error?.message || error?.toString() || 'An error occurred';
    const actionName = action.type.split('/')[0] || 'Unknown';
    
    // Extract additional error details
    let errorDetails = errorMessage;
    try {
      // Try to parse JSON error details if present
      const detailsMatch = errorMessage.match(/Details: ({.*})/);
      if (detailsMatch) {
        const parsed = JSON.parse(detailsMatch[1]);
        errorDetails = `Error: ${parsed.errorType || 'Unknown'}\nSheet: ${parsed.sheet || 'N/A'}\nScript ID: ${parsed.scriptId || 'N/A'}\nOnline: ${parsed.isOnline ? 'Yes' : 'No'}\nTime: ${parsed.timestamp || 'N/A'}\n\nFull Error: ${errorMessage}`;
      }
    } catch {
      // If parsing fails, use original message
      errorDetails = errorMessage;
    }
    
    // Create user-friendly error message
    let userMessage = errorMessage;
    if (errorMessage.includes('TIMEOUT')) {
      userMessage = `Request timed out. Check your internet connection or try again.`;
    } else if (errorMessage.includes('OFFLINE')) {
      userMessage = `Device is offline. Please check your connection.`;
    } else if (errorMessage.includes('MISSING_SCRIPT_ID')) {
      userMessage = `Google Script ID not configured. Please set it in Settings.`;
    } else if (errorMessage.includes('SCRIPT_LOAD_ERROR')) {
      // More specific message for script load errors
      if (errorMessage.includes('CORS') || errorMessage.includes('CSP')) {
        userMessage = `Connection blocked by browser security. Check Script ID in Settings.`;
      } else {
        userMessage = `Failed to connect to Google Scripts. Verify Script ID in Settings or check network.`;
      }
    } else if (errorMessage.includes('PARSE_ERROR')) {
      userMessage = `Invalid response from server. Please try again.`;
    }
    
    // Dispatch snackbar notification with user-friendly message
    store.dispatch(addSnackbar({
      message: `${actionName}: ${userMessage}`,
      type: 'error',
      duration: 8000, // Longer duration for mobile
    }));
    
    // Log detailed error for debugging
    store.dispatch(addLog({
      level: 'error',
      message: `Action failed: ${actionName}`,
      source: actionName,
      details: errorDetails,
    }));
  }
  
  return next(action);
};

