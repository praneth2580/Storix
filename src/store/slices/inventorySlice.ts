
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IProduct } from '../../types/models';
import { getProducts } from '../../models/product';

interface InventoryState {
    items: IProduct[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: InventoryState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async () => {
    const response = await getProducts();
    return response;
});

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<IProduct[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch products';
            });
    },
});

export default inventorySlice.reducer;
