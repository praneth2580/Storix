import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { saveLog, getAllLogs, clearAllLogs as clearAllLogsDB, deleteOldLogs } from '../../utils/logStorage';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  source?: string;
  details?: string;
}

interface LogState {
  entries: LogEntry[];
  maxEntries: number;
  loading: boolean;
  error: string | null;
}

const initialState: LogState = {
  entries: [],
  maxEntries: 500, // Keep last 500 entries
  loading: false,
  error: null,
};

// Async thunks
export const loadLogsFromDB = createAsyncThunk('log/loadFromDB', async () => {
  try {
    const logs = await getAllLogs();
    return logs;
  } catch (error) {
    throw new Error('Failed to load logs from IndexedDB');
  }
});

export const clearAllLogsDBThunk = createAsyncThunk('log/clearDB', async () => {
  try {
    await clearAllLogsDB();
    return true;
  } catch (error) {
    throw new Error('Failed to clear logs from IndexedDB');
  }
});

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<Omit<LogEntry, 'id' | 'timestamp'>>) => {
      const entry: LogEntry = {
        ...action.payload,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      
      state.entries.unshift(entry); // Add to beginning
      
      // Keep only last maxEntries
      if (state.entries.length > state.maxEntries) {
        state.entries = state.entries.slice(0, state.maxEntries);
      }
      
      // Save to IndexedDB asynchronously (don't await to avoid blocking)
      saveLog(entry).catch(err => {
        console.error('Failed to save log to IndexedDB:', err);
      });
    },
    clearLogs: (state) => {
      state.entries = [];
    },
    setLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.entries = action.payload;
    },
    setMaxEntries: (state, action: PayloadAction<number>) => {
      state.maxEntries = action.payload;
      if (state.entries.length > state.maxEntries) {
        state.entries = state.entries.slice(0, state.maxEntries);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLogsFromDB.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadLogsFromDB.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(loadLogsFromDB.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load logs';
      })
      .addCase(clearAllLogsDBThunk.fulfilled, (state) => {
        state.entries = [];
      });
  },
});

export const { addLog, clearLogs, setLogs, setMaxEntries } = logSlice.actions;

// Helper functions
export const logInfo = (message: string, source?: string, details?: string) =>
  addLog({ level: 'info', message, source, details });

export const logSuccess = (message: string, source?: string, details?: string) =>
  addLog({ level: 'success', message, source, details });

export const logWarning = (message: string, source?: string, details?: string) =>
  addLog({ level: 'warning', message, source, details });

export const logError = (message: string, source?: string, details?: string) =>
  addLog({ level: 'error', message, source, details });

export default logSlice.reducer;

