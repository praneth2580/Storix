import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LabelLayout } from '../../types/labelLayout';
import { jsonpRequest } from '../../utils';
import { getLabelLayouts, saveLabelLayouts } from '../../models/settings';

export interface StoreSettings {
  shopName: string;
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storeEmail: string;
  storePhone: string;
  upiMerchantId: string;
  merchantUPI: string;
}

interface SettingsState {
  // Store/POS Settings
  storeSettings: StoreSettings;
  storeSettingsLoading: boolean;
  storeSettingsError: string | null;
  
  // Label Layouts
  labelLayouts: LabelLayout[];
  labelLayoutsLoading: boolean;
  labelLayoutsError: string | null;
  
  // General settings map (for easy access)
  settingsMap: Record<string, string>;
}

const initialState: SettingsState = {
  storeSettings: {
    shopName: '',
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    storeZip: '',
    storeEmail: '',
    storePhone: '',
    upiMerchantId: '',
    merchantUPI: '',
  },
  storeSettingsLoading: false,
  storeSettingsError: null,
  labelLayouts: [],
  labelLayoutsLoading: false,
  labelLayoutsError: null,
  settingsMap: {},
};

// Async thunks for Store Settings
export const fetchStoreSettings = createAsyncThunk(
  'settings/fetchStoreSettings',
  async () => {
    const response = await jsonpRequest<{ settings: Record<string, { value: string; updatedAt: string }> }>('Settings', {
      action: 'getSettings'
    });
    
    if (response && response.settings) {
      const storeSettings: StoreSettings = {
        shopName: response.settings.shopName?.value || response.settings.storeName?.value || '',
        storeName: response.settings.storeName?.value || '',
        storeAddress: response.settings.storeAddress?.value || '',
        storeCity: response.settings.storeCity?.value || '',
        storeState: response.settings.storeState?.value || '',
        storeZip: response.settings.storeZip?.value || '',
        storeEmail: response.settings.storeEmail?.value || '',
        storePhone: response.settings.storePhone?.value || '',
        upiMerchantId: response.settings.upiMerchantId?.value || '',
        merchantUPI: response.settings.merchantUPI?.value || '',
      };
      
      // Build settings map for easy access
      const settingsMap: Record<string, string> = {};
      Object.entries(response.settings).forEach(([key, setting]) => {
        settingsMap[key] = setting.value;
      });
      
      return { storeSettings, settingsMap };
    }
    
    return { storeSettings: initialState.storeSettings, settingsMap: {} };
  }
);

export const saveStoreSettings = createAsyncThunk(
  'settings/saveStoreSettings',
  async (storeSettings: StoreSettings) => {
    const settingsToSave = [
      { key: 'shopName', value: storeSettings.shopName },
      { key: 'storeName', value: storeSettings.storeName },
      { key: 'storeAddress', value: storeSettings.storeAddress },
      { key: 'storeCity', value: storeSettings.storeCity },
      { key: 'storeState', value: storeSettings.storeState },
      { key: 'storeZip', value: storeSettings.storeZip },
      { key: 'storeEmail', value: storeSettings.storeEmail },
      { key: 'storePhone', value: storeSettings.storePhone },
      { key: 'upiMerchantId', value: storeSettings.upiMerchantId },
      { key: 'merchantUPI', value: storeSettings.merchantUPI },
    ];

    // Save all settings sequentially
    for (const setting of settingsToSave) {
      if (setting.value) {
        await jsonpRequest('Settings', {
          action: 'updateSetting',
          data: JSON.stringify({ key: setting.key, value: setting.value })
        });
      }
    }

    return storeSettings;
  }
);

// Async thunks for Label Layouts
export const fetchLabelLayouts = createAsyncThunk(
  'settings/fetchLabelLayouts',
  async () => {
    const layouts = await getLabelLayouts();
    return layouts;
  }
);

export const saveLabelLayoutsThunk = createAsyncThunk(
  'settings/saveLabelLayouts',
  async (layouts: LabelLayout[]) => {
    await saveLabelLayouts(layouts);
    return layouts;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateStoreSetting: (state, action: PayloadAction<{ key: keyof StoreSettings; value: string }>) => {
      state.storeSettings[action.payload.key] = action.payload.value as any;
      state.settingsMap[action.payload.key] = action.payload.value;
    },
    updateStoreSettings: (state, action: PayloadAction<Partial<StoreSettings>>) => {
      state.storeSettings = { ...state.storeSettings, ...action.payload };
      // Update settings map
      Object.entries(action.payload).forEach(([key, value]) => {
        if (value) {
          state.settingsMap[key] = value;
        }
      });
    },
    setLabelLayouts: (state, action: PayloadAction<LabelLayout[]>) => {
      state.labelLayouts = action.payload;
    },
    addLabelLayout: (state, action: PayloadAction<LabelLayout>) => {
      state.labelLayouts.push(action.payload);
    },
    updateLabelLayout: (state, action: PayloadAction<LabelLayout>) => {
      const index = state.labelLayouts.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.labelLayouts[index] = action.payload;
      }
    },
    removeLabelLayout: (state, action: PayloadAction<string>) => {
      state.labelLayouts = state.labelLayouts.filter(l => l.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Store Settings
    builder
      .addCase(fetchStoreSettings.pending, (state) => {
        state.storeSettingsLoading = true;
        state.storeSettingsError = null;
      })
      .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        state.storeSettingsLoading = false;
        state.storeSettings = action.payload.storeSettings;
        state.settingsMap = action.payload.settingsMap;
      })
      .addCase(fetchStoreSettings.rejected, (state, action) => {
        state.storeSettingsLoading = false;
        state.storeSettingsError = action.error.message || 'Failed to fetch store settings';
      })
      .addCase(saveStoreSettings.pending, (state) => {
        state.storeSettingsLoading = true;
        state.storeSettingsError = null;
      })
      .addCase(saveStoreSettings.fulfilled, (state, action) => {
        state.storeSettingsLoading = false;
        state.storeSettings = action.payload;
        // Update settings map
        Object.entries(action.payload).forEach(([key, value]) => {
          if (value) {
            state.settingsMap[key] = value;
          }
        });
      })
      .addCase(saveStoreSettings.rejected, (state, action) => {
        state.storeSettingsLoading = false;
        state.storeSettingsError = action.error.message || 'Failed to save store settings';
      });
    
    // Label Layouts
    builder
      .addCase(fetchLabelLayouts.pending, (state) => {
        state.labelLayoutsLoading = true;
        state.labelLayoutsError = null;
      })
      .addCase(fetchLabelLayouts.fulfilled, (state, action) => {
        state.labelLayoutsLoading = false;
        state.labelLayouts = action.payload;
      })
      .addCase(fetchLabelLayouts.rejected, (state, action) => {
        state.labelLayoutsLoading = false;
        state.labelLayoutsError = action.error.message || 'Failed to fetch label layouts';
      })
      .addCase(saveLabelLayoutsThunk.pending, (state) => {
        state.labelLayoutsLoading = true;
        state.labelLayoutsError = null;
      })
      .addCase(saveLabelLayoutsThunk.fulfilled, (state, action) => {
        state.labelLayoutsLoading = false;
        state.labelLayouts = action.payload;
      })
      .addCase(saveLabelLayoutsThunk.rejected, (state, action) => {
        state.labelLayoutsLoading = false;
        state.labelLayoutsError = action.error.message || 'Failed to save label layouts';
      });
  },
});

export const {
  updateStoreSetting,
  updateStoreSettings,
  setLabelLayouts,
  addLabelLayout,
  updateLabelLayout,
  removeLabelLayout,
} = settingsSlice.actions;

export default settingsSlice.reducer;

