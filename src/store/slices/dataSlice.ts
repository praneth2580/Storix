import { createSlice } from "@reduxjs/toolkit";

const tables = [
  "Products",
  "Variants",
  "Stock",
  "Customers",
  "Suppliers",
  "Orders",
  "Sales",
  "Purchases",
  "StockMovements",
];

const initialState: Record<string, Record<string, any>> = {};
tables.forEach(t => (initialState[t] = {}));

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setTableData(state, action) {
      const { table, rows } = action.payload;
      const map: Record<string, any> = {};

      rows.forEach((r: any) => {
        map[r.id] = r;
      });

      state[table] = map;
    },

    mergeChanges(state, action) {
      const { table, payload } = action.payload;
      const { rows, fullRefresh } = payload;

      if (fullRefresh) {
        const map: Record<string, any> = {};
        rows.forEach((r: any) => (map[r.id] = r));
        state[table] = map;
        return;
      }

      rows.forEach((row: any) => {
        state[table][row.id] = row;
      });
    },

    removeData(state, action) {
      const { table, id } = action.payload;
      if (state[table] && state[table][id]) {
        delete state[table][id];
      }
    },
  },
});

export const { setTableData, mergeChanges, removeData } = dataSlice.actions;
export default dataSlice.reducer;
