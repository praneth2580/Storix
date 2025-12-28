import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Calculator, User, Calendar, DollarSign } from 'lucide-react';
type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
};
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts } from '../store/slices/inventorySlice';
// CartItem is local to this component logic for now, or could match ISaleItem but ISaleItem is for the record.
// Let's keep a local CartItem type but map fields correctly.
export function SalesEntry() {
  useDataPolling(fetchProducts, 60000);
  const { items: products } = useAppSelector(state => state.inventory);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const handleAddToCart = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const newItem: CartItem = {
      id: Math.random().toString(),
      productId: product.id,
      name: product.name,
      price: product.defaultSellingPrice || 0,
      quantity: quantity
    };
    setCart([...cart, newItem]);
    setQuantity(1);
    setSelectedProduct('');
  };
  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const profitMargin = subtotal * 0.35; // Mock 35% margin
  return <div className="flex flex-col lg:flex-row h-full bg-primary text-text-primary overflow-hidden">
    {/* Left Panel: Entry Form */}
    <div className="flex-1 flex flex-col border-r border-border-primary overflow-y-auto">
      <div className="p-6 border-b border-border-primary bg-secondary">
        <h1 className="text-2xl font-bold mb-1">New Sales Order</h1>
        <p className="text-text-muted text-sm font-mono">
          Create transaction record #INV-{Math.floor(Math.random() * 10000)}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer Info */}
        <div className="bg-secondary border border-border-primary p-4 rounded-lg">
          <h3 className="text-xs text-text-muted uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
            <User size={14} /> Customer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Customer Name
              </label>
              <input type="text" className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" placeholder="Walk-in Customer" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Date
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
            <ShoppingCart size={14} /> Add Items
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[10px] text-text-muted uppercase">
                Product
              </label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>
                  {p.name} - ${p.defaultSellingPrice?.toFixed(2) ?? '0.00'}
                </option>)}
              </select>
            </div>
            <div className="w-full sm:w-24 space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Qty
              </label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary font-mono focus:border-accent-blue focus:outline-none rounded-sm" />
            </div>
            <button onClick={handleAddToCart} disabled={!selectedProduct} className="w-full sm:w-auto bg-accent-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-sm flex items-center justify-center gap-2 text-sm font-medium transition-colors h-[38px]">
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
                  Price
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
                  No items added to cart yet.
                </td>
              </tr> : cart.map(item => <tr key={item.id} className="group hover:bg-secondary/50">
                <td className="p-3 text-sm">
                  {item.name}
                  <div className="sm:hidden text-xs text-text-muted font-mono mt-1">
                    ${item.price.toFixed(2)}
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-sm hidden sm:table-cell">
                  ${item.price.toFixed(2)}
                </td>
                <td className="p-3 text-right font-mono text-sm">
                  {item.quantity}
                </td>
                <td className="p-3 text-right font-mono text-sm text-text-primary">
                  ${(item.price * item.quantity).toFixed(2)}
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
          <Calculator size={18} /> Order Summary
        </h2>
      </div>

      <div className="p-6 flex-1 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-mono text-text-primary">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Tax (8%)</span>
          <span className="font-mono text-text-primary">
            ${tax.toFixed(2)}
          </span>
        </div>
        <div className="h-px bg-border-primary my-2"></div>
        <div className="flex justify-between text-lg font-bold">
          <span className="text-text-primary">Total</span>
          <span className="font-mono text-accent-blue">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Profit Margin Indicator */}
        <div className="mt-6 p-4 bg-primary border border-border-primary rounded-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-text-muted uppercase">
              Est. Margin
            </span>
            <span className="text-xs font-mono text-accent-green">+35%</span>
          </div>
          <div className="text-xl font-mono text-accent-green font-bold">
            +${profitMargin.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border-primary bg-tertiary">
        <button className="w-full bg-accent-green hover:bg-green-600 text-white py-3 font-bold rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all">
          <DollarSign size={18} />
          Complete Sale
        </button>
        <button className="w-full mt-3 border border-border-primary hover:bg-border-secondary text-text-muted py-2 text-sm rounded-sm transition-colors">
          Save as Draft
        </button>
      </div>
    </div>
  </div>;
}