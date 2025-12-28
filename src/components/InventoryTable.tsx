import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, MoreHorizontal, AlertTriangle } from 'lucide-react';
// Types
type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
};
// Mock Data
const MOCK_DATA: Product[] = [{
  id: '1',
  sku: 'ELEC-001',
  name: 'Quantum Processor X7',
  category: 'Electronics',
  quantity: 142,
  price: 299.99,
  status: 'In Stock',
  lastUpdated: '10:42:15'
}, {
  id: '2',
  sku: 'ELEC-002',
  name: 'Neural Interface V2',
  category: 'Electronics',
  quantity: 8,
  price: 899.5,
  status: 'Low Stock',
  lastUpdated: '09:15:22'
}, {
  id: '3',
  sku: 'FURN-104',
  name: 'ErgoChair Ultimate',
  category: 'Furniture',
  quantity: 45,
  price: 450.0,
  status: 'In Stock',
  lastUpdated: '11:20:01'
}, {
  id: '4',
  sku: 'ACC-552',
  name: 'Holographic Display',
  category: 'Accessories',
  quantity: 0,
  price: 1250.0,
  status: 'Out of Stock',
  lastUpdated: 'Yesterday'
}, {
  id: '5',
  sku: 'ELEC-005',
  name: 'Solid State Drive 4TB',
  category: 'Electronics',
  quantity: 12,
  price: 320.0,
  status: 'Low Stock',
  lastUpdated: '10:05:33'
}, {
  id: '6',
  sku: 'PERI-882',
  name: 'Mechanical Keypad',
  category: 'Peripherals',
  quantity: 89,
  price: 120.0,
  status: 'In Stock',
  lastUpdated: '08:45:10'
}, {
  id: '7',
  sku: 'NET-301',
  name: 'Mesh Router Pro',
  category: 'Networking',
  quantity: 34,
  price: 189.99,
  status: 'In Stock',
  lastUpdated: '11:55:42'
}, {
  id: '8',
  sku: 'ELEC-009',
  name: 'Smart Home Hub',
  category: 'Electronics',
  quantity: 5,
  price: 89.99,
  status: 'Low Stock',
  lastUpdated: '09:30:15'
}, {
  id: '9',
  sku: 'ACC-112',
  name: 'USB-C Docking Stn',
  category: 'Accessories',
  quantity: 210,
  price: 149.5,
  status: 'In Stock',
  lastUpdated: '10:12:08'
}, {
  id: '10',
  sku: 'MON-404',
  name: '4K Ultra Monitor',
  category: 'Monitors',
  quantity: 18,
  price: 599.0,
  status: 'Low Stock',
  lastUpdated: '11:01:20'
}, {
  id: '11',
  sku: 'AUD-202',
  name: 'Noise Cancel Headset',
  category: 'Audio',
  quantity: 56,
  price: 249.99,
  status: 'In Stock',
  lastUpdated: 'Yesterday'
}, {
  id: '12',
  sku: 'STOR-001',
  name: 'NAS Server Bay',
  category: 'Storage',
  quantity: 3,
  price: 450.0,
  status: 'Low Stock',
  lastUpdated: '08:15:00'
}];
type SortField = keyof Product;
type SortDirection = 'asc' | 'desc';
export function InventoryTable() {
  const [data, setData] = useState<Product[]>(MOCK_DATA);
  const [sortField, setSortField] = useState<SortField>('quantity');
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
  const filteredData = data.filter(item => filter === 'All' || item.category === filter).filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });
  const getQuantityStyle = (qty: number) => {
    if (qty === 0) return 'text-accent-red bg-accent-red/10 border border-accent-red/20';
    if (qty < 10) return 'text-accent-red';
    if (qty <= 20) return 'text-accent-amber';
    return 'text-text-primary';
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
              <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-text-primary group" onClick={() => handleSort('sku')}>
                <div className="flex items-center">
                  SKU <SortIcon field="sku" />
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
              <th className="p-3 border-b border-border-primary text-[10px] uppercase tracking-wider text-text-muted font-semibold text-right">
                Value
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
            {filteredData.map(item => <tr key={item.id} className="hover:bg-tertiary transition-colors group">
                <td className="p-3">
                  <input type="checkbox" className="bg-primary border-border-primary rounded-sm opacity-30 group-hover:opacity-100" />
                </td>
                <td className="p-3 font-mono text-xs text-accent-blue">
                  {item.sku}
                </td>
                <td className="p-3 text-sm font-medium text-text-primary">
                  {item.name}
                </td>
                <td className="p-3 text-xs text-text-muted">{item.category}</td>
                <td className="p-3 text-right">
                  <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm ${getQuantityStyle(item.quantity)}`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-sm text-text-primary">
                  ${item.price.toFixed(2)}
                </td>
                <td className="p-3 text-right font-mono text-sm text-text-muted">
                  $
                  {(item.quantity * item.price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
                </td>
                <td className="p-3 text-center">
                  {item.quantity < 10 ? <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/10 text-accent-red border border-accent-red/20 uppercase tracking-wide">
                      <AlertTriangle size={10} className="mr-1" /> Alert
                    </div> : <div className="inline-block w-2 h-2 rounded-full bg-accent-green/50"></div>}
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