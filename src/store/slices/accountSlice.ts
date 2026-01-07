import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAccounts, IAccount } from '../../models/accounts/accounts';

interface AccountState {
    items: IAccount[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: AccountState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchAccounts = createAsyncThunk('accounts/fetchAccounts', async () => {
    const response = await getAccounts();
    return response;
});

const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAccounts.fulfilled, (state, action: PayloadAction<IAccount[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch accounts';
            });
    },
});

export default accountsSlice.reducer;
