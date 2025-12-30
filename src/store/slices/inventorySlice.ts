
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IProduct, IVariant } from '../../types/models';
import { getProducts } from '../../models/product';
import { getVariants } from '../../models/variants';
import { getStocks } from '../../models/stock';

export interface InventoryProduct extends IProduct {
    variants: IVariant[];
    totalStock?: number; // Helpers
    priceRange?: string; // Helpers
}

interface InventoryState {
    items: InventoryProduct[];
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
    const [products, variants, stocks] = await Promise.all([
        getProducts(),
        getVariants(),
        getStocks()
    ]);

    // Join variants to products and calculate stock from Stock table
    const joined: InventoryProduct[] = products.map(p => {
        const pVariants = variants.filter(v => v.productId === p.id);
        // Calculate totalStock from Stock table (not from variant.stock)
        const variantIds = pVariants.map(v => v.id);
        const productStocks = stocks.filter(s => variantIds.includes(s.variantId));
        const totalStock = productStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

        // precise mapping
        return {
            ...p,
            variants: pVariants,
            totalStock
        };
    });

    return joined;
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
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<InventoryProduct[]>) => {
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
