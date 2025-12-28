import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IPurchase } from '../../types/models';
import { getPurchases } from '../../models/purchase';

interface PurchasesState {
    items: IPurchase[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: PurchasesState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchPurchases = createAsyncThunk('purchases/fetchPurchases', async () => {
    const response = await getPurchases();
    return response;
});

const purchasesSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPurchases.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPurchases.fulfilled, (state, action: PayloadAction<IPurchase[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchPurchases.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch purchases';
            });
    },
});

export default purchasesSlice.reducer;
