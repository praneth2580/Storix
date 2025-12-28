import React, { useEffect, useState } from 'react';
import { Search, ScanBarcode, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, X, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts } from '../store/slices/inventorySlice';
import { IProduct } from '../types/models';

type CartItem = IProduct & {
  quantity: number;
};
export function POS() {
  // Redux
  useDataPolling(fetchProducts, 60000); // 1 min poll for POS
  const { items: products, loading } = useAppSelector(state => state.inventory);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'qr'>('card');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').toLowerCase().includes(search.toLowerCase()); // Changed sku to barcode as per IProduct
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Cart Logic
  const addToCart = (product: IProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {
          ...item,
          quantity: item.quantity + 1
        } : item);
      }
      return [...prev, {
        ...product,
        quantity: 1
      }];
    });
  };
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty
        };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  const clearCart = () => setCart([]);
  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.defaultSellingPrice * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setShowReceipt(true);
    }, 1500);
  };
  const handleNewSale = () => {
    setShowReceipt(false);
    clearCart();
  };
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  if (showReceipt) {
    return <div className="h-full flex items-center justify-center bg-primary p-4">
      <div className="bg-white text-black p-8 max-w-md w-full shadow-2xl font-mono relative rounded-sm">
        <div className="text-center mb-6 border-b-2 border-dashed border-black pb-6">
          <h2 className="text-2xl font-bold mb-2">STORIX POS</h2>
          <p className="text-sm">Store #404 - Terminal 1</p>
          <p className="text-sm">{new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          {cart.map(item => <div key={item.id} className="flex justify-between">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>${(item.defaultSellingPrice * item.quantity).toFixed(2)}</span>
          </div>)}
        </div>

        <div className="border-t-2 border-dashed border-black pt-4 mb-8">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold mt-2">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Paid via {paymentMethod.toUpperCase()}</span>
            <span>Auth: {Math.floor(Math.random() * 999999)}</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <ScanBarcode size={48} className="opacity-50" />
          </div>
          <p className="text-xs">Thank you for your business!</p>
          <button onClick={handleNewSale} className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded-sm">
            <RotateCcw size={16} /> Start New Sale
          </button>
        </div>
      </div>
    </div>;
  }
  return <div className="flex flex-col lg:flex-row h-full bg-primary text-text-primary overflow-hidden">
    {/* Left Side: Product Catalog */}
    <div className="flex-1 flex flex-col border-r border-border-primary overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-secondary border-b border-border-primary flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Scan barcode or search product..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="w-full bg-primary border border-border-primary text-text-primary py-3 pl-10 pr-12 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue placeholder-text-muted rounded-sm" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-blue">
            <ScanBarcode size={20} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full sm:max-w-[400px]">
          {['All', 'Electronics', 'Furniture', 'Accessories', 'Peripherals'].map(cat => <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border rounded-sm transition-colors ${category === cat ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-primary border-border-primary text-text-muted hover:border-border-secondary'}`}>
            {cat}
          </button>)}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-primary">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => <button key={product.id} onClick={() => addToCart(product)} className="bg-secondary border border-border-primary p-4 hover:border-accent-blue hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all text-left group flex flex-col h-full rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className={`w-2 h-2 rounded-full bg-accent-blue`}></div>
              <span className="text-[10px] font-mono text-text-muted">
                100 in stock
              </span>
            </div>
            <h3 className="font-bold text-sm text-text-primary mb-1 line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div className="flex justify-between items-end mt-2">
              <span className="font-mono text-lg text-accent-blue">
                ${product.defaultSellingPrice.toFixed(2)}
              </span>
              <div className="w-6 h-6 bg-tertiary rounded flex items-center justify-center text-text-muted group-hover:bg-accent-blue group-hover:text-white transition-colors">
                <Plus size={14} />
              </div>
            </div>
          </button>)}
        </div>
      </div>
    </div>

    {/* Right Side: Cart & Checkout */}
    <div className="w-full lg:w-[400px] flex flex-col bg-secondary border-t lg:border-t-0 lg:border-l border-border-primary shrink-0 h-[40vh] lg:h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-border-primary flex justify-between items-center bg-tertiary shrink-0">
        <div className="flex items-center gap-2 text-text-primary font-bold">
          <ShoppingCart size={18} />
          <span>Current Sale</span>
          <span className="bg-accent-blue text-white text-xs px-2 py-0.5 rounded-full">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        </div>
        <button onClick={clearCart} className="text-text-muted hover:text-accent-red text-xs flex items-center gap-1 transition-colors">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
          <ScanBarcode size={48} className="mb-4" />
          <p>Scan item or select from grid</p>
        </div> : cart.map(item => <div key={item.id} className="bg-primary border border-border-primary p-3 flex justify-between items-center group rounded-sm">
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              {item.name}
            </div>
            <div className="text-xs font-mono text-text-muted">
              ${item.defaultSellingPrice.toFixed(2)} / unit
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary border border-border-primary rounded-sm">
              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-accent-red transition-colors">
                <Minus size={12} />
              </button>
              <span className="w-8 text-center font-mono text-sm">
                {item.quantity}
              </span>
              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-accent-blue transition-colors">
                <Plus size={12} />
              </button>
            </div>
            <div className="w-16 text-right font-mono text-sm font-bold text-text-primary">
              ${(item.defaultSellingPrice * item.quantity).toFixed(0)}
            </div>
          </div>
        </div>)}
      </div>

      {/* Payment Section */}
      <div className="bg-tertiary border-t border-border-primary p-4 shrink-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-muted">
            <span>Tax (8%)</span>
            <span className="font-mono">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-text-primary pt-2 border-t border-border-primary">
            <span>Total</span>
            <span className="font-mono text-accent-blue">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => setPaymentMethod('card')} className={`p-2 flex flex-col items-center justify-center gap-1 text-xs border rounded-sm transition-colors ${paymentMethod === 'card' ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-secondary border-border-primary text-text-muted'}`}>
            <CreditCard size={16} /> Card
          </button>
          <button onClick={() => setPaymentMethod('cash')} className={`p-2 flex flex-col items-center justify-center gap-1 text-xs border rounded-sm transition-colors ${paymentMethod === 'cash' ? 'bg-accent-green/20 border-accent-green text-accent-green' : 'bg-secondary border-border-primary text-text-muted'}`}>
            <Banknote size={16} /> Cash
          </button>
          <button onClick={() => setPaymentMethod('qr')} className={`p-2 flex flex-col items-center justify-center gap-1 text-xs border rounded-sm transition-colors ${paymentMethod === 'qr' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-secondary border-border-primary text-text-muted'}`}>
            <QrCode size={16} /> QR
          </button>
        </div>

        <button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut} className={`w-full py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all rounded-sm ${isCheckingOut ? 'bg-accent-green text-white cursor-wait' : cart.length === 0 ? 'bg-border-primary text-text-muted cursor-not-allowed' : 'bg-accent-blue hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}>
          {isCheckingOut ? <>
            <CheckCircle2 className="animate-pulse" /> Processing...
          </> : <>
            Checkout <span className="font-mono">${total.toFixed(2)}</span>
          </>}
        </button>
      </div>
    </div>
  </div>;
}