
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ISupplier } from '../../types/models';
import { getSuppliers } from '../../models/supplier';

interface SuppliersState {
    items: ISupplier[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: SuppliersState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchSuppliers = createAsyncThunk('suppliers/fetchSuppliers', async () => {
    const response = await getSuppliers();
    return response;
});

const suppliersSlice = createSlice({
    name: 'suppliers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSuppliers.fulfilled, (state, action: PayloadAction<ISupplier[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchSuppliers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch suppliers';
            });
    },
});

export default suppliersSlice.reducer;
