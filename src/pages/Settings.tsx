import React, { useState, useEffect } from 'react';
import { User, Globe, Database, Moon, Sun, Shield, Save, RefreshCw, CheckCircle2, Package, Plus, Edit, Trash2, Copy, X, Store, QrCode, AlertTriangle } from 'lucide-react';
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
  const [googleScriptId, setGoogleScriptId] = useState(() => localStorage.getItem('VITE_GOOGLE_SCRIPT_ID') || '');

  useEffect(() => {
    dispatch(fetchStoreSettings());
    dispatch(fetchLabelLayouts());
  }, [dispatch]);

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
      alert(`Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      id: `layout-${Date.now()}`,
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
      id: `layout-${Date.now()}`,
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
            <User size={18} className="text-accent-blue" /> User Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Full Name
              </label>
              <input type="text" defaultValue="Admin User" className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Email Address
              </label>
              <input type="email" defaultValue="admin@storix.io" className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors opacity-70 cursor-not-allowed" disabled />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Role
              </label>
              <div className="flex items-center gap-2 p-2 bg-primary border border-border-primary text-sm text-text-secondary rounded-sm">
                <Shield size={14} className="text-accent-green" />
                <span>Super Administrator</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Section */}
        <section className="bg-secondary border border-border-primary p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
            <Globe size={18} className="text-accent-blue" /> Workspace
            Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Company Name
              </label>
              <input type="text" defaultValue="Storix Inc." className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Currency
              </label>
              <select className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Timezone
              </label>
              <select className="w-full bg-primary border border-border-primary p-2 text-sm focus:border-accent-blue focus:outline-none rounded-sm transition-colors">
                <option value="UTC">UTC (GMT+0)</option>
                <option value="EST">EST (GMT-5)</option>
                <option value="PST">PST (GMT-8)</option>
              </select>
            </div>
          </div>
        </section>

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
                  <h3 className="font-bold">Google Sheets Database</h3>
                  <p className="text-xs text-text-muted">
                    {googleScriptId ? `Script ID: ${googleScriptId.substring(0, 20)}...` : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
                  googleScriptId 
                    ? 'text-accent-green bg-accent-green/10 border-accent-green/10' 
                    : 'text-text-muted bg-primary border-border-primary'
                }`}>
                  <CheckCircle2 size={12} /> {googleScriptId ? 'Connected' : 'Not Connected'}
                </span>
                <button className="p-2 hover:bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors" title="Sync Now">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="bg-primary border border-border-primary p-4 rounded-sm space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                  <Globe size={14} />
                  Google Apps Script ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={googleScriptId}
                    onChange={(e) => setGoogleScriptId(e.target.value)}
                    placeholder="AKfycbx..."
                    className="w-full bg-secondary border border-border-primary text-text-primary text-sm p-3 rounded-sm focus:border-accent-blue focus:outline-none font-mono pr-10"
                  />
                  {googleScriptId && (
                    <button
                      onClick={() => setGoogleScriptId('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-red transition-colors"
                      title="Clear"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Your Google Apps Script deployment ID. This connects Storix to your Google Sheets database.
                  <br />
                  <span className="text-accent-blue">Note:</span> Changing this will require a page reload to take effect.
                </p>
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-text-muted">
                      <strong className="text-yellow-500">Mobile Troubleshooting:</strong> If you're experiencing connection errors on mobile, ensure:
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Script is deployed as "Web app" (not "API executable")</li>
                        <li>Execute as: "Me"</li>
                        <li>Who has access: "Anyone" (or "Anyone with Google account")</li>
                        <li>Use the "Test & Save" button to verify connection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-primary">
                <button
                  onClick={async (e) => {
                    if (!googleScriptId.trim()) {
                      alert('Please enter a valid Google Script ID.');
                      return;
                    }
                    
                    const button = e.currentTarget;
                    const originalHTML = button.innerHTML;
                    button.disabled = true;
                    button.innerHTML = '<span>⏳ Testing...</span>';
                    
                    try {
                      // Test connection before saving
                      const { testScriptConnection } = await import('../utils/scriptTester');
                      const testResult = await testScriptConnection(googleScriptId.trim());
                      
                      if (testResult.success) {
                        localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', googleScriptId.trim());
                        alert(`✅ Connection test successful!\nResponse time: ${testResult.details?.responseTime}ms\n\nThe page will reload to apply changes.`);
                        window.location.reload();
                      } else {
                        const errorMsg = `❌ Connection test failed!\n\nError: ${testResult.error}\n\nCommon mobile issues:\n1. Script not deployed as "Web app"\n2. Access not set to "Anyone"\n3. CORS/CSP restrictions\n4. Network blocking script tags\n\nCheck the Logs page for detailed error information.`;
                        alert(errorMsg);
                        // Ask if user wants to save anyway
                        if (confirm('Do you want to save the Script ID anyway? (You can test it later)')) {
                          localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', googleScriptId.trim());
                          window.location.reload();
                        }
                      }
                    } catch (err) {
                      alert(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
                    } finally {
                      button.disabled = false;
                      button.innerHTML = originalHTML;
                    }
                  }}
                  className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  Test & Save Script ID
                </button>
              </div>
            </div>

            <div className="text-xs text-text-muted font-mono">
              Last sync: {new Date().toLocaleString()}
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
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-primary
                  ${theme === 'dark' ? 'bg-accent-blue' : 'bg-border-secondary'}
                `}>
              <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
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