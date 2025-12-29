import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    scriptUrl: "https://script.google.com/macros/s/AKfycbyGSDkRZhkN5_pWOYkb4G7JO0OsvjXVJ6Q2LiZWe-lcPHxb-HDsnFHYx9k76wfgibAU/exec"
  },
  reducers: {
    setSettings(_state, action) {
      return action.payload;
    }
  }
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
