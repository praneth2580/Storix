import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Calculator, User, Calendar, DollarSign, Download } from 'lucide-react';
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
  const [customerName, setCustomerName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const handleAddToCart = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const price = product.variants?.[0]?.price || 0;
    const newItem: CartItem = {
      id: Math.random().toString(),
      productId: product.id,
      name: product.name,
      price: price,
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

  const handleDownloadInvoice = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Add items before generating invoice.");
      return;
    }

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Please allow popups to download invoice");

    const invoiceId = `INV-${Math.floor(Math.random() * 10000)}`;
    const invoiceDate = orderDate ? new Date(orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const itemsRows = cart.map(item => `
      <tr>
        <td>${item.name}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">$${item.price.toFixed(2)}</td>
        <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
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
          .invoice-title {
            font-size: 48px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 30px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .invoice-number {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
            letter-spacing: 1px;
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
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoiceId}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Bill From</h3>
              <p><strong>STORIX</strong></p>
              <p>Your Business Name</p>
              <p>123 Business Street</p>
              <p>City, State 12345</p>
              <p>Email: info@storix.com</p>
              <p>Phone: (555) 123-4567</p>
            </div>
            <div class="info-section">
              <h3>Bill To</h3>
              <p><strong>${customerName || 'Walk-in Customer'}</strong></p>
              <p style="margin-top: 15px;"><strong>Invoice Date:</strong> ${invoiceDate}</p>
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
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" 
                placeholder="Walk-in Customer" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase">
                Date
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="date" 
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  className="w-full bg-primary border border-border-primary p-2 pl-9 text-sm text-text-primary focus:border-accent-blue focus:outline-none rounded-sm" 
                />
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
                {products.map(p => {
                  const price = p.variants?.[0]?.price || 0;
                  return <option key={p.id} value={p.id}>
                    {p.name} - ${price.toFixed(2)}
                  </option>;
                })}
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
        <button 
          onClick={handleDownloadInvoice}
          disabled={cart.length === 0}
          className="w-full bg-accent-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 font-bold rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all mb-3"
        >
          <Download size={18} />
          Download Invoice
        </button>
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