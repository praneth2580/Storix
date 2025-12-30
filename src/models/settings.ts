/**
 * @file CRUD functions for Settings model.
 * Works with Google Apps Script JSONP backend.
 */
import type { ISettingItem } from '../types/models';
import { LabelLayouts } from '../types/labelLayout';
import { jsonpRequest } from '../utils';
import { createDefaultLayout } from '../utils/defaultLayout';

const SETTINGS_KEY = 'labelLayouts';

/**
 * GET Label Layouts from Settings
 * Automatically creates a default layout if none exist
 */
export const getLabelLayouts = async (): Promise<LabelLayouts> => {
  try {
    const settings = await jsonpRequest<ISettingItem[]>('Settings', {
      action: 'get',
      key: SETTINGS_KEY
    });
    
    if (settings && Array.isArray(settings) && settings.length > 0 && settings[0].value) {
      const layouts = JSON.parse(settings[0].value);
      if (layouts && layouts.length > 0) {
        return layouts;
      }
    }
    
    // No layouts exist, create and save default layout
    const defaultLayout = createDefaultLayout();
    await saveLabelLayouts([defaultLayout]);
    return [defaultLayout];
  } catch (error) {
    console.error('Error fetching label layouts:', error);
    // If error occurs, return default layout without saving
    return [createDefaultLayout()];
  }
};

/**
 * SAVE Label Layouts to Settings
 * Creates or updates the setting with key='labelLayouts'
 * Uses updateSetting action which handles create/update by key
 */
export const saveLabelLayouts = async (layouts: LabelLayouts): Promise<void> => {
  try {
    const settingData = {
      key: SETTINGS_KEY,
      value: JSON.stringify(layouts)
    };

    await jsonpRequest('Settings', {
      action: 'updateSetting',
      data: JSON.stringify(settingData)
    });
  } catch (error) {
    console.error('Error saving label layouts:', error);
    throw error;
  }
};

