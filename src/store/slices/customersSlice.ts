
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ICustomer } from '../../types/models';
import { getCustomers } from '../../models/customers';

interface CustomersState {
    items: ICustomer[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

const initialState: CustomersState = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async () => {
    const response = await getCustomers();
    return response;
});

const customersSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<ICustomer[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch customers';
            });
    },
});

export default customersSlice.reducer;
