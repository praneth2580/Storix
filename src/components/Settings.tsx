import React from 'react';
import { User, Globe, Database, Moon, Sun, Shield, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
interface SettingsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}
export function Settings({
  theme,
  onToggleTheme
}: SettingsProps) {
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

          {/* Integrations Section */}
          <section className="bg-secondary border border-border-primary p-6 rounded-lg">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-2 border-b border-border-primary">
              <Database size={18} className="text-accent-blue" /> Data
              Integrations
            </h2>

            <div className="bg-primary border border-border-primary p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent-green/20 rounded flex items-center justify-center text-accent-green">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Google Sheets Database</h3>
                  <p className="text-xs text-text-muted">
                    Connected to 'Inventory_Master_v2'
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-accent-green bg-accent-green/10 px-2 py-1 rounded border border-accent-green/20">
                  <CheckCircle2 size={12} /> Connected
                </span>
                <button className="p-2 hover:bg-tertiary rounded text-text-muted hover:text-text-primary transition-colors" title="Sync Now">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-text-muted font-mono">
              Last sync: {new Date().toLocaleString()}
            </div>
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
      </div>
    </div>;
}