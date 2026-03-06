import React, { useState, useEffect } from 'react';
import { User, Globe, Database, Moon, Sun, Shield, Save, RefreshCw, CheckCircle2, Package, Plus, Edit, Trash2, Copy, X, Store, QrCode, AlertTriangle, Mail, Key, Link2, ExternalLink } from 'lucide-react';
import { LabelLayoutEditor } from '../components/LabelLayoutEditor';
import { LabelLayout } from '../types/labelLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStoreSettings,
  saveStoreSettings,
  fetchLabelLayouts,
  saveLabelLayoutsThunk,
  updateStoreSettings,
} from '../store/slices/settingsSlice';
import { encryptWithPassword } from '../utils/encryption';
import { getStoredSpreadsheetId, setStoredSpreadsheetId, googleSheetsApi } from '../services/googleSheetsApi';

interface SettingsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Settings({
  theme,
  onToggleTheme
}: SettingsProps) {
  const dispatch = useAppDispatch();

  // Redux state
  const { storeSettings, storeSettingsLoading } = useAppSelector(state => ({
    storeSettings: state.settings.storeSettings,
    storeSettingsLoading: state.settings.storeSettingsLoading,
  }));

  const { labelLayouts, labelLayoutsLoading } = useAppSelector(state => ({
    labelLayouts: state.settings.labelLayouts,
    labelLayoutsLoading: state.settings.labelLayoutsLoading,
  }));

  // Local UI state
  const [editingLayout, setEditingLayout] = useState<LabelLayout | null>(null);
  const [showNewLayoutForm, setShowNewLayoutForm] = useState(false);
  const [newLayoutForm, setNewLayoutForm] = useState({
    name: '',
    rows: 2,
    cols: 2,
  });
  const [localStoreSettings, setLocalStoreSettings] = useState(storeSettings);

  const [savedSheetIds, setSavedSheetIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_google_sheet_ids') || '[]');
    } catch {
      return [];
    }
  });
  const [activeSheetId, setActiveSheetId] = useState(getStoredSpreadsheetId());
  const [newSheetId, setNewSheetId] = useState('');
  const [isVerifyingSheet, setIsVerifyingSheet] = useState(false);
  const [isReformatting, setIsReformatting] = useState(false);
  const [uninitializedId, setUninitializedId] = useState('');

  // 0 = closed, 1 = first warning, 2 = final warning
  const [reformatStep, setReformatStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    dispatch(fetchStoreSettings());
    dispatch(fetchLabelLayouts());

    // Initialize saved sheet IDs if empty
    if (savedSheetIds.length === 0) {
      const initialId = getStoredSpreadsheetId();
      setSavedSheetIds([initialId]);
      localStorage.setItem('saved_google_sheet_ids', JSON.stringify([initialId]));
    }
  }, [dispatch, savedSheetIds.length]);

  const saveAndApplySheetId = (id: string, makeActive: boolean) => {
    const updated = [...savedSheetIds, id];
    setSavedSheetIds(updated);
    localStorage.setItem('saved_google_sheet_ids', JSON.stringify(updated));
    setNewSheetId('');

    if (makeActive) {
      handleSetActiveSheetId(id);
    } else {
      alert('Sheet ID added successfully! You can now switch to it from the list.');
    }
  };

  const executeReformat = async () => {
    if (!activeSheetId) return;
    setIsReformatting(true);
    try {
      const success = await googleSheetsApi.initializeSpreadsheet(activeSheetId, true);
      if (success) {
        alert('Database successfully reformatted! The page will now reload.');
        window.location.reload();
      } else {
        alert('Failed to reformat the database. Please check your permissions.');
        setReformatStep(0);
      }
    } catch (error) {
      console.error('Error reformatting database:', error);
      alert('An error occurred while reformatting the database.');
      setReformatStep(0);
    } finally {
      setIsReformatting(false);
    }
  };

  const handleAddSheetId = async () => {
    if (!newSheetId.trim()) return;
    const id = newSheetId.trim();

    if (savedSheetIds.includes(id)) {
      alert('This Sheet ID is already in your list.');
      return;
    }

    setIsVerifyingSheet(true);
    try {
      const isAccessible = await googleSheetsApi.verifySheetAccess(id);
      if (!isAccessible) {
        alert(`Access Denied! Your Google account cannot access the Sheet ID: ${id}. Please ensure the ID is correct and the sheet is shared with your Google account.`);
        return;
      }

      setStoredSpreadsheetId(id); // Temporarily set for initialization
      const status = await googleSheetsApi.checkSpreadsheetStatus(id);

      const isFirstId = savedSheetIds.length === 0 || !activeSheetId;

      if (status === 'empty') {
        // Auto-initialize
        const initSuccess = await googleSheetsApi.initializeSpreadsheet(id, false);
        if (!initSuccess) {
          alert('Connected, but failed to initialize the required sheets.');
          setStoredSpreadsheetId(activeSheetId); // Restore
          return;
        }
        saveAndApplySheetId(id, isFirstId);
      } else if (status === 'not_empty') {
        // Store it and let the custom modal handle the confirm
        setUninitializedId(id);
      } else {
        alert('Failed to check the spreadsheet status.');
        setStoredSpreadsheetId(activeSheetId); // Restore
      }
    } catch (error) {
      console.error('Error verifying sheet access:', error);
      alert('An error occurred while trying to verify access to the Google Sheet.');
      setStoredSpreadsheetId(activeSheetId); // Restore
    } finally {
      setIsVerifyingSheet(false);
    }
  };

  const executeOverwrite = async () => {
    if (!uninitializedId) return;
    setIsVerifyingSheet(true);
    try {
      setStoredSpreadsheetId(uninitializedId);
      const isFirstId = savedSheetIds.length === 0 || !activeSheetId;
      const initSuccess = await googleSheetsApi.initializeSpreadsheet(uninitializedId, true);

      if (!initSuccess) {
        alert('Failed to initialize and overwrite the sheet.');
        setStoredSpreadsheetId(activeSheetId); // Restore
        return;
      }
      saveAndApplySheetId(uninitializedId, isFirstId);
    } catch (error) {
      console.error('Error overwriting sheet:', error);
      alert('An error occurred while trying to overwrite the sheet.');
      setStoredSpreadsheetId(activeSheetId); // Restore
    } finally {
      setIsVerifyingSheet(false);
      setUninitializedId('');
    }
  };

  const cancelOverwrite = () => {
    setStoredSpreadsheetId(activeSheetId); // Restore active
    setUninitializedId('');
  };

  const handleRemoveSheetId = (id: string) => {
    const updated = savedSheetIds.filter(s => s !== id);
    setSavedSheetIds(updated);
    localStorage.setItem('saved_google_sheet_ids', JSON.stringify(updated));

    if (activeSheetId === id) {
      const nextId = updated.length > 0 ? updated[0] : '';
      setActiveSheetId(nextId);
      setStoredSpreadsheetId(nextId);
      if (nextId) window.location.reload();
    }
  };

  const handleReformatActiveSheet = () => {
    if (!activeSheetId) return;
    setReformatStep(1);
  };

  const handleSetActiveSheetId = (id: string) => {
    setActiveSheetId(id);
    setStoredSpreadsheetId(id);
    window.location.reload();
  };

  // Sync local state when Redux state changes
  useEffect(() => {
    setLocalStoreSettings(storeSettings);
  }, [storeSettings]);




  const handleSaveStoreSettings = async () => {
    try {
      await dispatch(saveStoreSettings(localStoreSettings)).unwrap();
      alert('Store settings saved successfully!');
    } catch (error) {
      console.error('Error saving store settings:', error);
      alert('Failed to save store settings. Please try again.');
    }
  };

  const handleSaveLayout = async (layout: LabelLayout) => {
    console.log('handleSaveLayout - received layout:', {
      id: layout.id,
      name: layout.name,
      elementsCount: layout.elements?.length || 0,
      elements: layout.elements,
      fullLayout: JSON.stringify(layout, null, 2)
    });

    try {
      // Ensure elements array exists and is properly structured
      // Remove backgroundImage - it won't be saved to backend, will be requested during generation
      const { backgroundImage, ...layoutWithoutImage } = layout;
      const layoutToSave: LabelLayout = {
        ...layoutWithoutImage,
        elements: Array.isArray(layout.elements) ? layout.elements : [],
      };

      console.log('Layout to save (after ensuring elements):', {
        id: layoutToSave.id,
        name: layoutToSave.name,
        elementsCount: layoutToSave.elements.length,
        elements: layoutToSave.elements
      });

      // Create a new array (immutable update) - don't mutate labelLayouts directly
      const existingIndex = labelLayouts.findIndex(l => l.id === layoutToSave.id);
      const updatedLayouts = existingIndex >= 0
        ? labelLayouts.map((l, idx) => idx === existingIndex ? layoutToSave : l)
        : [...labelLayouts, layoutToSave];

      console.log('Saving layout:', {
        isEditing: existingIndex >= 0,
        layoutId: layoutToSave.id,
        layoutName: layoutToSave.name,
        elementsCount: layoutToSave.elements.length,
        totalLayouts: updatedLayouts.length,
        allLayoutIds: updatedLayouts.map(l => l.id),
        savedLayoutElements: updatedLayouts.find(l => l.id === layoutToSave.id)?.elements?.length || 0
      });

      // Verify the layout in updatedLayouts has all elements
      const savedLayout = updatedLayouts.find(l => l.id === layoutToSave.id);
      if (savedLayout) {
        console.log('Layout in updatedLayouts array:', {
          id: savedLayout.id,
          name: savedLayout.name,
          elementsCount: savedLayout.elements?.length || 0,
          elements: savedLayout.elements
        });
      }

      // Save to backend - this will update Redux state via the fulfilled action
      const result = await dispatch(saveLabelLayoutsThunk(updatedLayouts)).unwrap();

      console.log('Save result:', {
        savedCount: result.length,
        savedIds: result.map(l => l.id),
        expectedCount: updatedLayouts.length,
        expectedIds: updatedLayouts.map(l => l.id)
      });

      // Verify elements are preserved in the result
      const resultLayout = result.find(l => l.id === layoutToSave.id);
      if (resultLayout) {
        console.log('Layout in save result:', {
          id: resultLayout.id,
          name: resultLayout.name,
          elementsCount: resultLayout.elements?.length || 0,
          elements: resultLayout.elements
        });
      }

      setEditingLayout(null);

      // Redux state is automatically updated by saveLabelLayoutsThunk.fulfilled
      // No need to reload - the state already has the correct data
      // The UI will re-render automatically when Redux state updates

      alert('Label layout saved successfully!');
    } catch (error) {
      console.error('Error saving label layout:', error);
      alert(`Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'} `);
    }
  };

  const handleDeleteLayout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this layout?')) return;

    try {
      const updatedLayouts = labelLayouts.filter(l => l.id !== id);
      const result = await dispatch(saveLabelLayoutsThunk(updatedLayouts)).unwrap();
      console.log('Delete result:', {
        remainingCount: result.length,
        remainingIds: result.map(l => l.id)
      });

      // Redux state is automatically updated by saveLabelLayoutsThunk.fulfilled
      // No need to reload - the state already has the correct data

      alert('Label layout deleted successfully!');
    } catch (error) {
      console.error('Error deleting label layout:', error);
      alert('Failed to delete layout. Please try again.');
    }
  };

  const handleCloneLayout = (layout: LabelLayout) => {
    const cloned: LabelLayout = {
      ...layout,
      id: `layout - ${Date.now()} `,
      name: `${layout.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingLayout(cloned);
  };

  const handleNewLayoutFormSubmit = () => {
    if (!newLayoutForm.name.trim()) {
      alert('Please enter a layout name');
      return;
    }

    const pageSize = { width: 210, height: 297 }; // A4 in mm
    const margin = 5; // mm
    const labelWidth = (pageSize.width - margin * (newLayoutForm.cols + 1)) / newLayoutForm.cols;
    const labelHeight = (pageSize.height - margin * (newLayoutForm.rows + 1)) / newLayoutForm.rows;

    const newLayout: LabelLayout = {
      id: `layout - ${Date.now()} `,
      name: newLayoutForm.name.trim(),
      pageSize,
      grid: { rows: newLayoutForm.rows, cols: newLayoutForm.cols },
      labelSize: { width: labelWidth, height: labelHeight },
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingLayout(newLayout);
    setShowNewLayoutForm(false);
    setNewLayoutForm({ name: '', rows: 2, cols: 2 });
  };

  return <div className="flex flex-col h-full bg-primary text-text-primary overflow-hidden">
    <div className="p-6 border-b border-border-primary bg-secondary">
      <h1 className="text-2xl font-bold mb-1">System Configuration</h1>
      <p className="text-text-muted text-sm font-mono">
        Manage workspace, integrations, and preferences
      </p>
    </div>

    <div className="flex-1 overflow-auto p-6">

      {/* Reformat Confirmation Modal */}
      {reformatStep > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary border border-border-primary w-full max-w-md shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border-primary bg-tertiary">
              <h3 className="text-lg font-bold text-accent-red flex items-center gap-2">
                <AlertTriangle size={20} />
                {reformatStep === 1 ? 'Reformat Database' : 'Final Warning'}
              </h3>
              <button
                onClick={() => setReformatStep(0)}
                disabled={isReformatting}
                className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-primary rounded disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {reformatStep === 1 ? (
                <>
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                    <strong>DANGER!</strong> You are about to reformat the active Google Sheet:
                    <div className="font-mono mt-2 p-2 bg-black/20 rounded select-all break-all">{activeSheetId}</div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    This will <strong className="text-text-primary">DELETE ALL DATA</strong> (Products, Customers, Sales, Orders, etc.) and reset it to an empty database schematic.
                  </p>
                  <p className="text-sm font-bold text-accent-red">
                    Are you absolutely sure you want to proceed? This action CANNOT be undone.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-red-500 text-white rounded text-center">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <strong>FINAL WARNING</strong>
                  </div>
                  <p className="text-sm text-center text-text-secondary">
                    All database information will be permanently and irreversibly erased.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border-primary bg-tertiary">
              <button
                onClick={() => setReformatStep(0)}
                disabled={isReformatting}
                className="px-4 py-2 border border-border-primary hover:bg-primary rounded-sm transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              {reformatStep === 1 ? (
                <button
                  onClick={() => setReformatStep(2)}
                  className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white rounded-sm flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  Yes, I understand
                </button>
              ) : (
                <button
                  onClick={executeReformat}
                  disabled={isReformatting}
                  className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white rounded-sm flex items-center gap-2 transition-colors text-sm font-bold disabled:opacity-50"
                >
                  <AlertTriangle size={16} />
                  {isReformatting ? 'Formatting...' : 'ERASE & REFORMAT'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {uninitializedId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary border border-border-primary w-full max-w-md shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border-primary bg-tertiary">
              <h3 className="text-lg font-bold text-accent-red flex items-center gap-2">
                <AlertTriangle size={20} />
                Warning: Sheet Not Empty
              </h3>
              <button
                onClick={cancelOverwrite}
                disabled={isVerifyingSheet}
                className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-primary rounded disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                <strong>WARNING!</strong> The Google Sheet you entered already contains data:
                <div className="font-mono mt-2 p-2 bg-black/20 rounded select-all break-all">{uninitializedId}</div>
              </div>
              <p className="text-sm text-text-secondary">
                Using it as your database requires <strong className="text-text-primary">deleting existing conflicting schema sheets</strong> (like Products, Sales, etc.) and re-initializing the system.
              </p>
              <p className="text-sm font-bold text-accent-red">
                Do you want to clear this data and format the sheet?
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border-primary bg-tertiary">
              <button
                onClick={cancelOverwrite}
                disabled={isVerifyingSheet}
                className="px-4 py-2 border border-border-primary hover:bg-primary rounded-sm transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={executeOverwrite}
                disabled={isVerifyingSheet}
                className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white rounded-sm flex items-center gap-2 transition-colors text-sm font-bold disabled:opacity-50"
              >
                <AlertTriangle size={16} />
                {isVerifyingSheet ? 'Initializing...' : 'Delete & Initialize'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile and Workspace sections removed as requested */}

        {/* Store/POS Settings Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
            <Store size={18} className="text-accent-blue" /> Store & POS Settings
          </h2>
          {storeSettingsLoading ? (
            <div className="text-center text-text-muted py-8">Loading store settings...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    Shop/Store Name *
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.shopName}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, shopName: e.target.value })}
                    placeholder="e.g. Storix POS"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    Store Name (Alternative)
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.storeName}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeName: e.target.value })}
                    placeholder="Alternative store name"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    Store Address
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.storeAddress}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeAddress: e.target.value })}
                    placeholder="123 Business Street"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    City
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.storeCity}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeCity: e.target.value })}
                    placeholder="City"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    State
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.storeState}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeState: e.target.value })}
                    placeholder="State"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={localStoreSettings.storeZip}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeZip: e.target.value })}
                    placeholder="12345"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={localStoreSettings.storeEmail}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeEmail: e.target.value })}
                    placeholder="info@storix.com"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={localStoreSettings.storePhone}
                    onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storePhone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                  />
                </div>
              </div>

              {/* UPI Payment Settings */}
              <div className="pt-4 border-t border-border-primary">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <QrCode size={16} className="text-purple-500" /> UPI Payment Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                      UPI Merchant ID *
                    </label>
                    <input
                      type="text"
                      value={localStoreSettings.upiMerchantId}
                      onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, upiMerchantId: e.target.value })}
                      placeholder="your-merchant@paytm"
                      className="w-full bg-primary border border-border-primary p-2 text-sm font-mono focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                    />
                    <p className="text-xs text-text-muted mt-1">Used for generating UPI payment QR codes</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                      Merchant UPI (Alternative)
                    </label>
                    <input
                      type="text"
                      value={localStoreSettings.merchantUPI}
                      onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, merchantUPI: e.target.value })}
                      placeholder="Alternative UPI ID"
                      className="w-full bg-primary border border-border-primary p-2 text-sm font-mono focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-primary">
                <button
                  onClick={handleSaveStoreSettings}
                  disabled={storeSettingsLoading}
                  className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-2 rounded-sm flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {storeSettingsLoading ? 'Saving...' : 'Save Store Settings'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Integrations Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
            <Database size={18} className="text-accent-blue" /> Data
            Integrations
          </h2>

          <div className="space-y-4">
            <div className="bg-primary border border-border-primary p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent-green/20 rounded flex items-center justify-center text-accent-green">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Google Sheets API</h3>
                  <p className="text-xs text-text-muted">
                    Connected via OAuth 2.0
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border text-accent-green bg-accent-green/10 border-accent-green/10">
                  <CheckCircle2 size={12} /> Connected
                </span>
                <button className="p-2 hover:bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors" title="Sync Now">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Google Sheets IDs Section */}
          <div className="bg-primary border border-border-primary p-4 rounded-sm space-y-3 mt-4">
            <div className="space-y-4">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                <Database size={14} />
                Google Sheets IDs
              </label>

              {/* List of saved IDs */}
              <div className="space-y-2">
                {savedSheetIds.map((id) => (
                  <div key={id} className={`flex items - center justify - between p - 3 rounded - sm border ${activeSheetId === id ? 'bg-accent-blue/10 border-accent-blue' : 'bg-secondary border-border-primary'} `}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="radio"
                        name="activeSheet"
                        checked={activeSheetId === id}
                        onChange={() => handleSetActiveSheetId(id)}
                        className="w-4 h-4 text-accent-blue bg-primary border-border-primary focus:ring-accent-blue"
                      />
                      <span className="text-sm font-mono truncate cursor-pointer" title={id} onClick={() => handleSetActiveSheetId(id)}>{id}</span>
                      {activeSheetId === id && (
                        <span className="text-[10px] bg-accent-blue text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Active</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent-blue p-1 transition-colors flex-shrink-0"
                        title="Open Sheet in New Tab"
                      >
                        <ExternalLink size={16} />
                      </a>
                      {savedSheetIds.length > 1 && (
                        <button
                          onClick={() => handleRemoveSheetId(id)}
                          className="text-text-muted hover:text-accent-red p-1 transition-colors flex-shrink-0"
                          title="Remove ID"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reformat Button for Active Sheet */}
              {activeSheetId && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleReformatActiveSheet}
                    disabled={isReformatting}
                    className="text-accent-red hover:bg-red-500/10 text-xs px-3 py-1.5 rounded-sm border border-accent-red/50 flex items-center gap-1.5 transition-colors font-bold tracking-wider disabled:opacity-50"
                  >
                    <AlertTriangle size={14} />
                    {isReformatting ? 'Reformatting...' : 'Reformat Database'}
                  </button>
                </div>
              )}

              {/* Add new ID */}
              <div className="flex gap-2 pt-2 border-t border-border-primary">
                <input
                  type="text"
                  value={newSheetId}
                  onChange={(e) => setNewSheetId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSheetId()}
                  placeholder="Paste new Google Sheet ID..."
                  className="flex-1 bg-secondary border border-border-primary text-text-primary text-sm p-2 rounded-sm focus:border-accent-blue focus:outline-none font-mono"
                />
                <button
                  onClick={handleAddSheetId}
                  disabled={!newSheetId.trim() || isVerifyingSheet}
                  className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  {isVerifyingSheet ? 'Verifying...' : 'Add ID'}
                </button>
              </div>
              <p className="text-xs text-text-muted">
                You can manage multiple spreadsheet databases and switch between them. Changing the active database will reload the application.
              </p>
            </div>
          </div>
        </section>


        {/* Label Layouts Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-border-primary">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package size={18} className="text-accent-blue" /> Label Layouts
            </h2>
            <button
              onClick={() => setShowNewLayoutForm(true)}
              className="bg-accent-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New Layout
            </button>
          </div>

          {/* New Layout Form Modal */}
          {showNewLayoutForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-secondary border border-border-primary w-full max-w-md shadow-2xl rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-border-primary bg-tertiary">
                  <h3 className="text-lg font-bold">Create New Layout</h3>
                  <button
                    onClick={() => {
                      setShowNewLayoutForm(false);
                      setNewLayoutForm({ name: '', rows: 2, cols: 2 });
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-primary rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                      Layout Name
                    </label>
                    <input
                      type="text"
                      value={newLayoutForm.name}
                      onChange={(e) => setNewLayoutForm({ ...newLayoutForm, name: e.target.value })}
                      placeholder="Enter layout name"
                      className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNewLayoutFormSubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                        Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newLayoutForm.rows}
                        onChange={(e) => setNewLayoutForm({ ...newLayoutForm, rows: parseInt(e.target.value) || 1 })}
                        className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 block">
                        Columns
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newLayoutForm.cols}
                        onChange={(e) => setNewLayoutForm({ ...newLayoutForm, cols: parseInt(e.target.value) || 1 })}
                        className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-text-muted">
                    This will create a {newLayoutForm.rows}×{newLayoutForm.cols} grid layout ({newLayoutForm.rows * newLayoutForm.cols} labels per page)
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-border-primary bg-tertiary">
                  <button
                    onClick={() => {
                      setShowNewLayoutForm(false);
                      setNewLayoutForm({ name: '', rows: 2, cols: 2 });
                    }}
                    className="px-4 py-2 border border-border-primary hover:bg-primary rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewLayoutFormSubmit}
                    className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-sm flex items-center gap-2 transition-colors"
                  >
                    <Save size={16} />
                    Create & Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {labelLayoutsLoading ? (
            <div className="text-center text-text-muted py-8">Loading layouts...</div>
          ) : labelLayouts.length === 0 ? (
            <div className="text-center text-text-muted py-8">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No label layouts created yet.</p>
              <p className="text-sm mt-2">Click "New Layout" to create your first layout.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labelLayouts.map(layout => (
                <div
                  key={layout.id}
                  className="bg-primary border border-border-primary p-4 rounded-sm hover:border-accent-blue transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm">{layout.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCloneLayout(layout)}
                        className="p-1 hover:bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Clone"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLayout(layout.id)}
                        className="p-1 hover:bg-tertiary rounded text-text-muted hover:text-accent-red transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted space-y-1 mb-3">
                    <div>Grid: {layout.grid.rows}×{layout.grid.cols}</div>
                    <div>Label Size: {layout.labelSize.width.toFixed(0)}mm × {layout.labelSize.height.toFixed(0)}mm</div>
                    <div>Elements: {layout.elements.length}</div>
                  </div>
                  <button
                    onClick={() => setEditingLayout(layout)}
                    className="w-full mt-2 px-3 py-1.5 bg-secondary hover:bg-tertiary border border-border-primary rounded-sm text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={14} />
                    Edit Layout
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferences Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
            {theme === 'dark' ? <Moon size={18} className="text-accent-blue" /> : <Sun size={18} className="text-accent-amber" />}{' '}
            Interface Preferences
          </h2>

          <div className="flex items-center justify-between p-4 bg-primary border border-border-primary rounded-sm">
            <div>
              <h3 className="text-sm font-bold">Theme Mode</h3>
              <p className="text-xs text-text-muted">
                Switch between dark and light appearance
              </p>
            </div>
            <button onClick={onToggleTheme} className={`
                  relative inline - flex h - 6 w - 11 items - center rounded - full transition - colors focus: outline - none focus: ring - 2 focus: ring - accent - blue focus: ring - offset - 2 focus: ring - offset - primary
                  ${theme === 'dark' ? 'bg-accent-blue' : 'bg-border-secondary'}
`}>
              <span className={`
inline - block h - 4 w - 4 transform rounded - full bg - white transition - transform
                    ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
`} />
            </button>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-2 rounded-sm flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20 transition-all">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {editingLayout !== null && (
        <LabelLayoutEditor
          layout={editingLayout}
          onSave={handleSaveLayout}
          onCancel={() => setEditingLayout(null)}
        />
      )}
    </div>
  </div>;
}