
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IOrder } from '../../types/models';
import { getOrders } from '../../models/order';

interface OrdersState {
    items: IOrder[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: OrdersState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
    const response = await getOrders();
    return response;
});

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<IOrder[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch orders';
            });
    },
});

export default ordersSlice.reducer;
