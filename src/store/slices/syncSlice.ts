import { createSlice } from "@reduxjs/toolkit";

const syncSlice = createSlice({
  name: "sync",
  initialState: {
    lastSync: null as string | null,
    pending: [] as any[],
    syncing: false,
  },
  reducers: {
    setLastSync(state, action) {
      state.lastSync = action.payload;
    },
    addPending(state, action) {
      state.pending.push(action.payload);
    },
    clearPending(state) {
      state.pending = [];
    },
    setSyncing(state, action) {
      state.syncing = action.payload;
    },
  },
});

export const {
  setLastSync,
  addPending,
  clearPending,
  setSyncing,
} = syncSlice.actions;

export default syncSlice.reducer;
