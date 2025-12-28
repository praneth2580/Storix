import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Save, Calculator, Truck, Calendar, PackageCheck } from 'lucide-react';
type CartItem = {
  id: string;
  productId: string;
  name: string;
  cost: number;
  quantity: number;
};
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchSuppliers } from '../store/slices/suppliersSlice';

// Using cost price which might not be on IProduct directly? IProduct has 'price' (selling price).
// Usually products have 'cost' price too. Checking IProduct definition...
// IProduct has: id, name, sku, barcode, description, category, price, stock, reorderLevel, status, lastUpdated.
// It seems 'cost' is missing from IProduct.
// For now I will use 'price' as a placeholder or we assume cost entry is manual for now. 
// Actually line 31 in original file: `if (product) setCost(product.cost);`
// I will just default cost to 0 or use price if that's all we have, but Purchase Entry usually sets the cost.
// I'll leave cost as state that the user can edit.
export function PurchaseEntry() {
  useDataPolling(fetchProducts, 60000);
  useDataPolling(fetchSuppliers, 60000); // Fetch suppliers too

  const { items: products } = useAppSelector(state => state.inventory);
  const { items: suppliers } = useAppSelector(state => state.suppliers);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);

  const handleProductSelect = (id: string) => {
    setSelectedProduct(id);
    const product = products.find(p => p.id === id);
    // Default cost to 0 as we don't store cost price in public product catalog yet
    if (product) setCost(0);
  };
  const handleAddToCart = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const newItem: CartItem = {
      id: Math.random().toString(),
      productId: product.id,
      name: product.name,
      cost: cost,
      quantity: quantity
    };
    setCart([...cart, newItem]);
    setQuantity(1);
    setSelectedProduct('');
    setCost(0);
  };
  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };
  const total = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  return <div className="flex flex-col lg:flex-row h-full bg-primary text-text-primary overflow-hidden">
    {/* Left Panel: Entry Form */}
    <div className="flex-1 flex flex-col border-r border-border-primary overflow-y-auto">
      <div className="p-6 border-b border-border-primary bg-secondary">
        <h1 className="text-2xl font-bold mb-1">Purchase Order</h1>
        <p className="text-text-muted text-sm font-mono">
          Record incoming stock from suppliers
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Supplier Info */}
        <div className="bg-secondary border border-border-primary p-4 rounded-lg">
          <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
            <Truck size={14} /> Supplier Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Supplier
              </label>
              <select className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm">
                <option>TechGlobal Industries</option>
                <option>MegaCorp Logistics</option>
                <option>NanoChip Solutions</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Expected Delivery
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="date" className="w-full bg-primary border border-border-primary p-2 pl-9 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Entry */}
        <div className="bg-secondary border border-border-primary p-4 rounded-lg">
          <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
            <PackageCheck size={14} /> Add Items
          </h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Product
              </label>
              <select value={selectedProduct} onChange={e => handleProductSelect(e.target.value)} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>
                  {p.name}
                </option>)}
              </select>
            </div>
            <div className="w-24 space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Cost ($)
              </label>
              <input type="number" value={cost} onChange={e => setCost(parseFloat(e.target.value))} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Qty
              </label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" />
            </div>
            <button onClick={handleAddToCart} disabled={!selectedProduct} className="bg-accent-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium transition-colors h-[38px]">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="border border-border-primary bg-primary min-h-[200px] rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-secondary text-text-muted text-[10px] uppercase font-mono">
              <tr>
                <th className="p-3 border-b border-border-primary">Item</th>
                <th className="p-3 border-b border-border-primary text-right hidden sm:table-cell">
                  Unit Cost
                </th>
                <th className="p-3 border-b border-border-primary text-right">
                  Qty
                </th>
                <th className="p-3 border-b border-border-primary text-right">
                  Total
                </th>
                <th className="p-3 border-b border-border-primary w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {cart.length === 0 ? <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted text-sm italic">
                  No items added to order yet.
                </td>
              </tr> : cart.map(item => <tr key={item.id} className="group hover:bg-secondary/50">
                <td className="p-3 text-sm">
                  {item.name}
                  <div className="sm:hidden text-xs text-text-muted font-mono mt-1">
                    ${item.cost.toFixed(2)}
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-sm hidden sm:table-cell">
                  ${item.cost.toFixed(2)}
                </td>
                <td className="p-3 text-right font-mono text-sm">
                  {item.quantity}
                </td>
                <td className="p-3 text-right font-mono text-sm text-text-primary">
                  ${(item.cost * item.quantity).toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => handleRemoveItem(item.id)} className="text-text-muted hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Right Panel: Summary */}
    <div className="w-full lg:w-[350px] bg-secondary border-t lg:border-t-0 lg:border-l border-border-primary flex flex-col shrink-0">
      <div className="p-6 border-b border-border-primary">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Calculator size={18} /> Cost Summary
        </h2>
      </div>

      <div className="p-6 flex-1 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Total Items</span>
          <span className="font-mono text-text-primary">
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </div>
        <div className="h-px bg-border-primary my-2"></div>
        <div className="flex justify-between text-lg font-bold">
          <span className="text-text-primary">Total Cost</span>
          <span className="font-mono text-accent-blue">
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="mt-6 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-sm text-xs text-accent-blue">
          <p className="mb-2 font-bold flex items-center gap-2">
            <CreditCard size={12} /> Payment Terms
          </p>
          <p>
            Net 30 payment terms apply. Invoice will be generated upon
            approval.
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-border-primary bg-tertiary">
        <button className="w-full bg-accent-blue hover:bg-blue-600 text-white py-3 font-bold rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
          <Save size={18} />
          Submit Order
        </button>
      </div>
    </div>
  </div>;
}