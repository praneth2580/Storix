import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, ScanBarcode, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, X, CheckCircle2, RotateCcw, Download } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [isScanning, setIsScanning] = useState(false);
  const [showUPIQr, setShowUPIQr] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanContainerRef = useRef<HTMLDivElement>(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').toLowerCase().includes(search.toLowerCase()); // Changed sku to barcode as per IProduct
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  // Cart Logic
  const addToCart = useCallback((product: IProduct) => {
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
  }, []);

  // Barcode Scanner Logic
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      addToCart(product);
      // Stop scanner after successful scan
      stopScanner();
      // Show brief success feedback
      setSearch(barcode);
      setTimeout(() => setSearch(''), 2000);
    } else {
      // Product not found - show alert but keep scanning
      alert(`Product with barcode "${barcode}" not found.`);
    }
  }, [products, addToCart, stopScanner]);

  const startScanner = useCallback(async () => {
    if (!scanContainerRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode("barcode-scanner");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback - barcode/QR detected
          handleBarcodeScanned(decodedText);
        },
        (errorMessage) => {
          // Error callback - ignore, scanner will keep trying
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('Failed to start camera. Please ensure camera permissions are granted.');
    }
  }, [handleBarcodeScanned]);
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

  // UPI QR Code Generation
  const generateUPIQRCode = () => {
    // UPI payment URL format: upi://pay?pa=<merchant_vpa>&pn=<merchant_name>&am=<amount>&cu=INR&tn=<transaction_note>
    const merchantVPA = 'storix@paytm'; // Replace with actual merchant UPI ID
    const merchantName = 'Storix POS';
    const amount = total.toFixed(2);
    const transactionNote = `Payment for Order #${Date.now().toString().slice(-8)}`;
    
    const upiUrl = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // Generate QR code using QR Server API
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
  };

  const handleQRPaymentClick = () => {
    setPaymentMethod('qr');
    if (cart.length > 0) {
      setShowUPIQr(true);
    }
  };
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
  const handleDownloadInvoice = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Add items before generating invoice.");
      return;
    }

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Please allow popups to download invoice");

    const invoiceId = `POS-${Date.now().toString().slice(-8)}`;
    const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const itemsRows = cart.map(item => `
      <tr>
        <td>${item.name}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">$${item.defaultSellingPrice.toFixed(2)}</td>
        <td class="text-right">$${(item.defaultSellingPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <title>Invoice ${invoiceId}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-box { box-shadow: none; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .invoice-box { 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 0; 
            background: white; 
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            overflow: hidden;
          }
          .header-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px 50px 40px;
            position: relative;
          }
          .header-section::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
          }
          .invoice-logo {
            margin-bottom: 20px;
            text-align: center;
          }
          .invoice-logo img {
            height: 60px;
            width: auto;
            object-fit: contain;
          }
          .invoice-banner {
            margin-bottom: 20px;
            text-align: center;
          }
          .invoice-banner img {
            width: 100%;
            max-width: 400px;
            height: auto;
            object-fit: contain;
          }
          .invoice-number {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
            letter-spacing: 1px;
            text-align: center;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 40px 50px;
            background: #f8f9fa;
          }
          .info-section h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #6c757d;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .info-section p {
            font-size: 15px;
            color: #212529;
            margin: 8px 0;
            line-height: 1.6;
          }
          .info-section strong {
            color: #495057;
            font-weight: 600;
            display: inline-block;
            min-width: 80px;
          }
          .items-section {
            padding: 50px;
          }
          .section-title {
            font-size: 24px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 0;
            background: white;
          }
          thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          th { 
            color: white; 
            padding: 18px 15px; 
            text-align: left; 
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          th.text-center { text-align: center; }
          th.text-right { text-align: right; }
          tbody tr {
            border-bottom: 1px solid #e9ecef;
            transition: background 0.2s;
          }
          tbody tr:hover {
            background: #f8f9fa;
          }
          tbody tr:nth-child(even) {
            background: #fafbfc;
          }
          tbody tr:nth-child(even):hover {
            background: #f1f3f5;
          }
          td { 
            padding: 18px 15px; 
            color: #495057;
            font-size: 14px;
          }
          td.text-center { text-align: center; }
          td.text-right { text-align: right; }
          .total-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            padding: 12px 15px;
            font-size: 15px;
          }
          .total-row-label {
            width: 200px;
            text-align: right;
            padding-right: 20px;
            color: #6c757d;
            font-weight: 500;
          }
          .total-row-value {
            width: 150px;
            text-align: right;
            color: #212529;
            font-weight: 600;
          }
          .total-row.final {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 20px;
            font-weight: 700;
            padding: 20px 15px;
          }
          .total-row.final .total-row-label,
          .total-row.final .total-row-value {
            color: white;
          }
          .footer {
            background: #f8f9fa;
            padding: 40px 50px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            color: #6c757d;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer .thank-you {
            font-size: 18px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-section">
            <div class="invoice-logo">
              <img src="/pos-logo.png" alt="Storix POS Logo" />
            </div>
            <div class="invoice-banner">
              <img src="/pos-banner.png" alt="Storix POS Banner" />
            </div>
            <div class="invoice-number">Invoice #${invoiceId}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Store Information</h3>
              <p><strong>STORIX POS</strong></p>
              <p>Store #404 - Terminal 1</p>
              <p>123 Business Street</p>
              <p>City, State 12345</p>
              <p>Email: info@storix.com</p>
              <p>Phone: (555) 123-4567</p>
            </div>
            <div class="info-section">
              <h3>Transaction Details</h3>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
              <p><strong>Authorization:</strong> ${Math.floor(Math.random() * 999999)}</p>
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-title">Items</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <div class="total-row-label">Subtotal:</div>
                <div class="total-row-value">$${subtotal.toFixed(2)}</div>
              </div>
              <div class="total-row">
                <div class="total-row-label">Tax (8%):</div>
                <div class="total-row-value">$${tax.toFixed(2)}</div>
              </div>
              <div class="total-row final">
                <div class="total-row-label">TOTAL:</div>
                <div class="total-row-value">$${total.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p class="thank-you">Thank you for your business!</p>
            <p>We appreciate your trust in our services</p>
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(() => window.print(), 250);
          }
        </script>
      </body>
      </html>
    `;

    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isScanning) {
          stopScanner();
        } else {
          clearCart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanning, stopScanner]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [stopScanner]);
  if (showReceipt) {
    return <div className="h-full flex items-center justify-center bg-primary p-4">
      <div className="bg-white text-black p-8 max-w-md w-full shadow-2xl font-mono relative rounded-sm">
        <div className="text-center mb-6 border-b-2 border-dashed border-black pb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/pos-logo.png" 
              alt="Storix POS Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="mb-3">
            <img 
              src="/pos-banner.png" 
              alt="Storix POS Banner" 
              className="h-16 w-full object-contain mx-auto"
            />
          </div>
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
          <button 
            onClick={handleDownloadInvoice}
            className="w-full bg-accent-blue hover:bg-blue-600 text-white py-3 font-bold transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            <Download size={16} /> Download Invoice
          </button>
          <button onClick={handleNewSale} className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded-sm">
            <RotateCcw size={16} /> Start New Sale
          </button>
        </div>
      </div>
    </div>;
  }
  return <div className="flex flex-col lg:flex-row h-full bg-primary text-text-primary overflow-hidden">
    {/* UPI QR Code Modal */}
    {showUPIQr && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary">Scan to Pay via UPI</h3>
            <button
              onClick={() => setShowUPIQr(false)}
              className="text-text-muted hover:text-accent-red transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg flex flex-col items-center mb-4">
            <div className="mb-4">
              <img 
                src={generateUPIQRCode()} 
                alt="UPI Payment QR Code" 
                className="w-64 h-64 border-2 border-border-primary rounded-lg"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-gray-800">Amount to Pay</p>
              <p className="text-2xl font-bold text-accent-blue">₹{total.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">Scan with any UPI app</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-text-muted mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span className="font-mono">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-primary font-semibold text-text-primary">
              <span>Total:</span>
              <span className="font-mono">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowUPIQr(false)}
              className="flex-1 bg-secondary hover:bg-tertiary border border-border-primary text-text-primary py-2.5 font-medium rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowUPIQr(false);
                handleCheckout();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 font-medium rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Payment Done
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Barcode Scanner Modal */}
    {isScanning && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary">Scan Barcode/QR Code</h3>
            <button
              onClick={stopScanner}
              className="text-text-muted hover:text-accent-red transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div 
            id="barcode-scanner" 
            ref={scanContainerRef}
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: '300px' }}
          />
          <p className="text-sm text-text-muted mt-4 text-center">
            Point camera at barcode or QR code. Press ESC to cancel.
          </p>
        </div>
      </div>
    )}
    
    {/* Left Side: Product Catalog */}
    <div className="flex-1 flex flex-col border-r border-border-primary overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-secondary border-b border-border-primary flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Scan barcode or search product..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="w-full bg-primary border border-border-primary text-text-primary py-3 pl-10 pr-12 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue placeholder-text-muted rounded-sm" />
          <button 
            onClick={() => isScanning ? stopScanner() : startScanner()}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isScanning ? 'text-accent-red hover:text-red-600' : 'text-text-muted hover:text-accent-blue'}`}
            title={isScanning ? 'Stop Scanner' : 'Start Barcode Scanner'}
          >
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
          <button onClick={handleQRPaymentClick} className={`p-2 flex flex-col items-center justify-center gap-1 text-xs border rounded-sm transition-colors ${paymentMethod === 'qr' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-secondary border-border-primary text-text-muted'}`}>
            <QrCode size={16} /> QR
          </button>
        </div>

        <button 
          onClick={handleDownloadInvoice} 
          disabled={cart.length === 0}
          className="w-full mb-3 bg-secondary hover:bg-tertiary border border-border-primary text-text-primary py-2.5 font-medium rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Download Invoice
        </button>
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