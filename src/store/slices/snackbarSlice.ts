import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SnackbarMessage, SnackbarType } from '../../components/Snackbar';

interface SnackbarState {
  messages: SnackbarMessage[];
}

const initialState: SnackbarState = {
  messages: [],
};

const MAX_SNACKBARS = 3; // Maximum number of snackbars to show at once

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    addSnackbar: (state, action: PayloadAction<Omit<SnackbarMessage, 'id'>>) => {
      const id = `snackbar-${Date.now()}-${Math.random()}`;
      state.messages.push({
        ...action.payload,
        id,
      });
      // Keep only the most recent MAX_SNACKBARS messages
      if (state.messages.length > MAX_SNACKBARS) {
        state.messages = state.messages.slice(-MAX_SNACKBARS);
      }
    },
    removeSnackbar: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    clearSnackbars: (state) => {
      state.messages = [];
    },
  },
});

export const { addSnackbar, removeSnackbar, clearSnackbars } = snackbarSlice.actions;

// Helper function to show snackbar
export const showSnackbar = (
  message: string,
  type: SnackbarType = 'info',
  duration?: number
) => ({
  type: addSnackbar.type,
  payload: { message, type, duration },
});

export default snackbarSlice.reducer;

