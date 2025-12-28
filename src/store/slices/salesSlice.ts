import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ISale } from '../../types/models';
import { getSales } from '../../models/sale';

interface SalesState {
    items: ISale[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: SalesState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchSales = createAsyncThunk('sales/fetchSales', async () => {
    const response = await getSales();
    return response;
});

const salesSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSales.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSales.fulfilled, (state, action: PayloadAction<ISale[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchSales.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch sales';
            });
    },
});

export default salesSlice.reducer;
