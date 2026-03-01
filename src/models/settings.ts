/**
 * @file CRUD functions for Settings model.
 * Works with Google Sheets API via jsonpRequest adapter.
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
    // Use standard 'get' action with key filter
    const settings = await jsonpRequest<ISettingItem[]>('Settings', {
      action: 'get',
      key: SETTINGS_KEY
    });

    if (settings && Array.isArray(settings) && settings.length > 0 && settings[0].value) {
      try {
        const layouts = JSON.parse(settings[0].value);
        if (Array.isArray(layouts)) {
          return layouts;
        }
      } catch (parseError) {
        console.error('Error parsing layouts JSON:', parseError);
        return [];
      }
    }

    // No settings entry exists at all, create and save default layout
    console.log('No labelLayouts setting found, creating default layout');
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
 * Uses standard 'update' action (or 'create' if no existing entry)
 */
export const saveLabelLayouts = async (layouts: LabelLayouts): Promise<void> => {
  try {
    if (!Array.isArray(layouts)) {
      throw new Error('Layouts must be an array');
    }

    const settingData = {
      key: SETTINGS_KEY,
      value: JSON.stringify(layouts)
    };

    // First check if the setting already exists
    const existing = await jsonpRequest<any[]>('Settings', {
      action: 'get',
      key: SETTINGS_KEY
    });

    if (existing && Array.isArray(existing) && existing.length > 0 && existing[0].id) {
      // Update existing setting
      await jsonpRequest<any>('Settings', {
        action: 'update',
        id: existing[0].id,
        data: JSON.stringify(settingData)
      });
    } else {
      // Create new setting
      await jsonpRequest<any>('Settings', {
        action: 'create',
        data: JSON.stringify(settingData)
      });
    }

    console.log('✅ Label layouts saved successfully');
  } catch (error) {
    console.error('❌ Error saving label layouts:', error);
    throw error;
  }
};

