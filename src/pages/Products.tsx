import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, X, Save, Upload } from 'lucide-react';
// Types

import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts } from '../store/slices/inventorySlice';
import { IProduct } from '../types/models';

export function Products() {
  useDataPolling(fetchProducts, 30000);
  const { items: products, loading } = useAppSelector(state => state.inventory);

  // const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS); // Removed local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });
  // Modal handlers
  const handleOpenModal = (product?: IProduct) => {
    if (product) setEditingProduct(product); else setEditingProduct(null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // setProducts(products.filter(p => p.id !== id)); // Redux state is immutable directly
      console.log("Delete product", id);
      alert("Delete not implemented in Redux yet");
    }
  };
  return <div className="flex flex-col h-full bg-primary text-text-primary">
    {/* Header / Toolbar */}
    <div className="p-6 border-b border-border-primary bg-secondary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Product Management</h1>
          <p className="text-text-muted text-sm font-mono">
            Manage catalog, pricing, and specifications
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search by SKU or Name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-primary border border-border-primary text-text-primary text-sm py-2 pl-9 pr-4 focus:outline-none focus:border-accent-blue placeholder-text-muted rounded-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {['All', 'Electronics', 'Furniture', 'Accessories'].map(cat => <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-2 text-xs font-medium border rounded-sm whitespace-nowrap ${filter === cat ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-primary border-border-primary text-text-muted hover:border-border-secondary'} transition-colors`}>
            {cat}
          </button>)}
        </div>
      </div>
    </div>

    {/* Table Content */}
    <div className="flex-1 overflow-auto p-6">
      <div className="border border-border-primary bg-secondary rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-tertiary text-text-muted text-[10px] uppercase font-mono tracking-wider">
            <tr>
              <th className="p-3 border-b border-border-primary w-16 text-center">
                Img
              </th>
              <th className="p-3 border-b border-border-primary">Barcode</th>
              <th className="p-3 border-b border-border-primary">
                Product Name
              </th>
              <th className="p-3 border-b border-border-primary">Category</th>
              <th className="p-3 border-b border-border-primary text-right">
                Price
              </th>
              <th className="p-3 border-b border-border-primary text-right">
                Stock
              </th>
              <th className="p-3 border-b border-border-primary text-center">
                Status
              </th>
              <th className="p-3 border-b border-border-primary text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {filteredProducts.map(product => <tr key={product.id} className="hover:bg-tertiary transition-colors group">
              <td className="p-3 text-center">
                <div className="w-8 h-8 bg-primary border border-border-primary rounded flex items-center justify-center mx-auto text-text-muted">
                  <ImageIcon size={14} />
                </div>
              </td>
              <td className="p-3 font-mono text-xs text-accent-blue">
                {product.barcode || 'N/A'}
              </td>
              <td className="p-3 text-sm font-medium text-text-primary">
                {product.name}
              </td>
              <td className="p-3 text-xs text-text-muted">
                {product.category}
              </td>
              <td className="p-3 text-right font-mono text-sm">
                ${product.defaultSellingPrice.toFixed(2)}
              </td>
              <td className="p-3 text-right font-mono text-sm">
                <span className="text-text-primary">
                  0
                </span>
              </td>
              <td className="p-3 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded border bg-accent-green/10 text-accent-green border-accent-green/20">
                  ACTIVE
                </span>
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(product)} className="p-1 hover:text-accent-blue transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-1 hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal */}
    {isModalOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary border border-border-primary w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {editingProduct ? <Edit size={18} className="text-accent-blue" /> : <Plus size={18} className="text-accent-blue" />}
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={handleCloseModal} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Image Upload Placeholder */}
          <div className="col-span-1 md:col-span-2 flex justify-center">
            <div className="w-full h-32 border-2 border-dashed border-border-primary hover:border-accent-blue/50 rounded flex flex-col items-center justify-center text-text-muted cursor-pointer transition-colors bg-primary">
              <Upload size={24} className="mb-2" />
              <span className="text-xs">
                Drag & drop product image or click to upload
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Product Name
            </label>
            <input type="text" defaultValue={editingProduct?.name} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" placeholder="e.g. Quantum Processor" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              SKU / Barcode
            </label>
            <input type="text" defaultValue={editingProduct?.barcode} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" placeholder="e.g. ELEC-001" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Category
            </label>
            <select className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm">
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Accessories</option>
              <option>Storage</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Selling Price ($)
            </label>
            <input type="number" defaultValue={editingProduct?.defaultSellingPrice} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" placeholder="0.00" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
              Cost Price ($)
            </label>
            <input type="number" defaultValue={editingProduct?.defaultCostPrice} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" placeholder="0.00" />
          </div>
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3 bg-tertiary">
          <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleCloseModal} className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <Save size={16} />
            Save Product
          </button>
        </div>
      </div>
    </div>}
  </div>;
}