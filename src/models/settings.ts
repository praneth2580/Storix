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
    
    console.log('Fetched settings for labelLayouts:', settings);
    
    if (settings && Array.isArray(settings) && settings.length > 0 && settings[0].value) {
      try {
        const layouts = JSON.parse(settings[0].value);
        console.log('Parsed layouts:', {
          count: layouts?.length,
          layouts: layouts?.map((l: any) => ({ id: l.id, name: l.name }))
        });
        
        // Return layouts even if empty array - don't create default if empty
        // Only create default if the setting doesn't exist at all
        if (Array.isArray(layouts)) {
          // Return the layouts array, even if empty
          // Empty array means user deleted all layouts, not that we need to create default
          return layouts;
        }
      } catch (parseError) {
        console.error('Error parsing layouts JSON:', parseError);
        console.error('Raw value:', settings[0].value);
        // If parsing fails, return empty array instead of creating default
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
 * Uses updateSetting action which handles create/update by key
 */
export const saveLabelLayouts = async (layouts: LabelLayouts): Promise<void> => {
  try {
    // Ensure layouts is an array
    if (!Array.isArray(layouts)) {
      throw new Error('Layouts must be an array');
    }

    const settingData = {
      key: SETTINGS_KEY,
      value: JSON.stringify(layouts)
    };

    console.log('Saving label layouts:', {
      key: SETTINGS_KEY,
      layoutsCount: layouts.length,
      layouts: layouts.map(l => ({ id: l.id, name: l.name })),
      valueLength: settingData.value.length
    });

    const response = await jsonpRequest<{ status: string; key: string; value: string; updatedAt: string }>('Settings', {
      action: 'updateSetting',
      data: JSON.stringify(settingData)
    });

    console.log('Label layouts save response:', response);

    if (response && response.status === 'ok') {
      console.log('✅ Label layouts saved successfully');
    } else {
      console.warn('⚠️ Unexpected response format:', response);
    }
  } catch (error) {
    console.error('❌ Error saving label layouts:', error);
    throw error;
  }
};

