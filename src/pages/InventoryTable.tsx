import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts, InventoryProduct } from '../store/slices/inventorySlice';

type SortField = 'name' | 'category' | 'barcode' | 'quantity' | 'price' | 'value';

type SortDirection = 'asc' | 'desc';

export function InventoryTable() {
  // Use Redux for data
  const { items, loading, error } = useAppSelector((state) => state.inventory);

  // Auto-fetch every 30 seconds
  useDataPolling(fetchProducts, 30000);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Electronics', 'Furniture', 'Accessories', 'Storage'];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Helper functions to get calculated values
  const getPrice = (item: InventoryProduct): number => {
    return item.variants?.[0]?.price || 0;
  };

  const getQuantity = (item: InventoryProduct): number => {
    return item.totalStock || 0;
  };

  const getValue = (item: InventoryProduct): number => {
    return getQuantity(item) * getPrice(item);
  };

  // Helper to safely access properties for sorting/filtering
  const filteredData = items.filter(item => {
    const matchesCategory = filter === 'All' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'barcode':
          aValue = a.barcode || '';
          bValue = b.barcode || '';
          break;
        case 'quantity':
          aValue = getQuantity(a);
          bValue = getQuantity(b);
          break;
        case 'price':
          aValue = getPrice(a);
          bValue = getPrice(b);
          break;
        case 'value':
          aValue = getValue(a);
          bValue = getValue(b);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      // Numbers
      return sortDirection === 'asc'
        ? (Number(aValue) - Number(bValue))
        : (Number(bValue) - Number(aValue));
    });

  const getQuantityStyle = (qty: number) => {
    if (qty === 0) return 'text-accent-red bg-accent-red/10 border border-accent-red/20';
    if (qty < 10) return 'text-accent-red';
    if (qty <= 20) return 'text-accent-amber';
    return 'text-text-primary';
  };

  const getStatusColor = (item: InventoryProduct) => {
    const qty = getQuantity(item);
    if (qty === 0) return 'bg-accent-red';
    const minStock = item.minStockLevel || 10;
    if (qty < minStock) return 'bg-accent-red';
    return 'bg-accent-green';
  };
  const SortIcon = ({
    field
  }: {
    field: SortField;
  }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
    return sortDirection === 'asc' ? <ArrowUp size={12} className="text-accent-blue ml-1" /> : <ArrowDown size={12} className="text-accent-blue ml-1" />;
  };
  return <div className="flex flex-col h-full bg-primary text-text-primary">
    {/* Toolbar */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-border-primary gap-4 bg-secondary">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
        {categories.map(cat => <button key={cat} onClick={() => setFilter(cat)} className={`
                px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap
                ${filter === cat ? 'bg-accent-blue text-white' : 'bg-tertiary text-text-muted hover:bg-border-secondary hover:text-text-primary'}
              `}>
          {cat}
        </button>)}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search SKU or Name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-primary border border-border-primary text-text-primary text-xs py-2 pl-9 pr-4 focus:outline-none focus:border-accent-blue placeholder-text-muted rounded-sm" />
        </div>
        <button className="p-2 bg-tertiary hover:bg-border-secondary border border-border-primary text-text-primary transition-colors rounded-sm">
          <Filter size={14} />
        </button>
      </div>
    </div>

    {/* Table Container */}
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="bg-secondary sticky top-0 z-10">
          <tr>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold w-12">
              <input type="checkbox" className="bg-primary border-border-primary rounded-sm" />
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group" onClick={() => handleSort('barcode')}>
              <div className="flex items-center">
                Barcode <SortIcon field="barcode" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group" onClick={() => handleSort('name')}>
              <div className="flex items-center">
                Product Name <SortIcon field="name" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group" onClick={() => handleSort('category')}>
              <div className="flex items-center">
                Category <SortIcon field="category" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group text-right" onClick={() => handleSort('quantity')}>
              <div className="flex items-center justify-end">
                Qty <SortIcon field="quantity" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group text-right" onClick={() => handleSort('price')}>
              <div className="flex items-center justify-end">
                Price <SortIcon field="price" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group text-right" onClick={() => handleSort('value')}>
              <div className="flex items-center justify-end">
                Value <SortIcon field="value" />
              </div>
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold text-center">
              Status
            </th>
            <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-primary">
          {loading ? (
            <tr><td colSpan={9} className="p-8 text-center text-text-muted"><Loader2 className="animate-spin mx-auto mb-2" /> Loading inventory...</td></tr>
          ) : error ? (
            <tr><td colSpan={9} className="p-8 text-center text-accent-red">
              <AlertTriangle className="mx-auto mb-2" size={24} />
              <div>Error loading inventory</div>
              <div className="text-xs mt-1">{error}</div>
            </td></tr>
          ) : filteredData.length === 0 ? (
            <tr><td colSpan={9} className="p-8 text-center text-text-muted">No items found</td></tr>
          ) : filteredData.map(item => <tr key={item.id} className="hover:bg-tertiary transition-colors group">
            <td className="p-3">
              <input type="checkbox" className="bg-primary border-border-primary rounded-sm opacity-30 group-hover:opacity-100" />
            </td>
            <td className="p-3 font-mono text-xs text-accent-blue">
              {item.barcode || 'N/A'}
            </td>
            <td className="p-3 text-sm font-medium text-text-primary">
              {item.name}
            </td>
            <td className="p-3 text-xs text-text-muted">{item.category}</td>
            <td className="p-3 text-right">
              <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm ${getQuantityStyle(getQuantity(item))}`}>
                {getQuantity(item)}
              </span>
            </td>
            <td className="p-3 text-right font-mono text-sm text-text-primary">
              ${getPrice(item).toFixed(2)}
            </td>
            <td className="p-3 text-right font-mono text-sm text-text-primary">
              ${getValue(item).toFixed(2)}
            </td>
            <td className="p-3 text-center">
              <div className={`inline-block w-2 h-2 rounded-full ${getStatusColor(item)}`} title={getQuantity(item) === 0 ? 'Out of Stock' : getQuantity(item) < (item.minStockLevel || 10) ? 'Low Stock' : 'In Stock'}></div>
            </td>
            <td className="p-3 text-right">
              <button className="p-1 hover:bg-border-primary rounded text-text-muted hover:text-text-primary transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>

    {/* Footer / Pagination */}
    <div className="p-3 border-t border-border-primary bg-secondary flex justify-between items-center text-xs text-text-muted">
      <div className="font-mono">
        Showing{' '}
        <span className="text-text-primary">{filteredData.length}</span> items
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 border border-border-primary hover:bg-tertiary disabled:opacity-50 transition-colors rounded-sm">
          Prev
        </button>
        <button className="px-3 py-1 border border-border-primary hover:bg-tertiary text-text-primary transition-colors rounded-sm">
          1
        </button>
        <button className="px-3 py-1 border border-border-primary hover:bg-tertiary transition-colors rounded-sm">
          2
        </button>
        <button className="px-3 py-1 border border-border-primary hover:bg-tertiary transition-colors rounded-sm">
          Next
        </button>
      </div>
    </div>
  </div>;
}