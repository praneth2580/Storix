import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, ExternalLink, X, Save, Users, Loader2 } from 'lucide-react';
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchSuppliers } from '../store/slices/suppliersSlice';

export function Suppliers() {
  const { items: suppliers, loading } = useAppSelector(state => state.suppliers);
  useDataPolling(fetchSuppliers, 30000);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())));
  return <div className="flex flex-col h-full bg-primary text-text-primary">
    {/* Header */}
    <div className="p-6 border-b border-border-primary bg-secondary">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Supplier Directory</h1>
          <p className="text-text-muted text-sm font-mono">
            Manage vendor relationships and contacts
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-primary border border-border-primary text-text-primary text-sm py-2 pl-9 pr-4 focus:outline-none focus:border-accent-blue placeholder-text-muted rounded-sm" />
      </div>
    </div>

    {/* Grid Content */}
    <div className="flex-1 overflow-auto p-6">
      {loading ? (
        <div className="h-full flex items-center justify-center text-text-muted gap-2">
          <Loader2 className="animate-spin" /> Loading suppliers...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center text-text-muted mt-10">No suppliers found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => <div key={supplier.id} className="bg-secondary border border-border-primary p-5 hover:border-border-secondary transition-all group rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-text-primary">
                  {supplier.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full bg-accent-green`}></span>
                  <span className="text-xs text-text-muted uppercase tracking-wide">
                    Active
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-tertiary rounded text-text-muted hover:text-accent-blue transition-colors">
                  <Edit size={14} />
                </button>
                <button className="p-1.5 hover:bg-tertiary rounded text-text-muted hover:text-accent-red transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-text-muted">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary border border-border-primary flex items-center justify-center shrink-0">
                  <Users size={14} />
                </div>
                <span className="text-text-primary">
                  {supplier.contactPerson}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary border border-border-primary flex items-center justify-center shrink-0">
                  <Mail size={14} />
                </div>
                <a href={`mailto:${supplier.email}`} className="hover:text-accent-blue transition-colors truncate">
                  {supplier.email}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary border border-border-primary flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </div>
                <span className="font-mono">{supplier.phone}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary border border-border-primary flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </div>
                <span className="truncate">{supplier.address}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border-primary flex justify-between items-center">
              <button className="text-xs text-accent-blue hover:text-blue-400 flex items-center gap-1">
                View Catalog <ExternalLink size={10} />
              </button>
              <span className="text-[10px] text-text-muted font-mono">
                ID: {supplier.id?.padStart(4, '0')}
              </span>
            </div>
          </div>)}
        </div>
      )}
    </div>

    {/* Modal */}
    {isModalOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary border border-border-primary w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold">Add New Supplier</h2>
          <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Company Name
            </label>
            <input type="text" className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Contact Person
            </label>
            <input type="text" className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Email
              </label>
              <input type="email" className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Phone
              </label>
              <input type="tel" className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Address
            </label>
            <textarea className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none h-20 resize-none rounded-sm"></textarea>
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3 bg-tertiary">
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <Save size={16} />
            Save Supplier
          </button>
        </div>
      </div>
    </div>}
  </div>;
}