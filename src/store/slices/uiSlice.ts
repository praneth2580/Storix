import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    isAuthenticated: boolean;
    activeTab: string;
    theme: 'light' | 'dark';
    isSidebarOpen: boolean;
}

const initialState: UIState = {
    isAuthenticated: false,
    activeTab: 'dashboard',
    theme: 'dark',
    isSidebarOpen: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setAuthenticated: (state, action: PayloadAction<boolean>) => {
            state.isAuthenticated = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
        setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
            state.theme = action.payload;
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
    },
});

export const {
    setAuthenticated,
    setActiveTab,
    setTheme,
    toggleTheme,
    setSidebarOpen,
    toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
