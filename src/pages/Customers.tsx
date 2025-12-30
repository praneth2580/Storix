import React, { useState } from 'react';
import { Search, MapPin, Phone, Mail, MessageCircle, FileText, User, ShoppingBag } from 'lucide-react';
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchCustomers } from '../store/slices/customersSlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import { fetchSales } from '../store/slices/salesSlice';
import { ICustomer, IOrder } from '../types/models';
import { Download } from 'lucide-react';

export function Customers() {
    const { items: customers, loading } = useAppSelector(state => state.customers);
    const { items: orders } = useAppSelector(state => state.orders);
    const { items: sales } = useAppSelector(state => state.sales);
    useDataPolling(fetchCustomers, 30000);
    useDataPolling(fetchOrders, 30000);
    useDataPolling(fetchSales, 30000);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    );

    const handleSendMessage = (customer: ICustomer) => {
        if (!customer.phone) return alert("Customer has no phone number");

        // Format message
        const message = `Hello ${customer.name}, this is a reminder from *${"My Shop"}*. \n\nYou have an outstanding balance of *${customer.outstandingBalance || 0}*. \n\nPlease pay at your earliest convenience.`;
        const encoded = encodeURIComponent(message);

        // Open WhatsApp
        window.open(`https://wa.me/${customer.phone}?text=${encoded}`, '_blank');
    };

    const handleSendBill = (customer: ICustomer) => {
        const text = `BILL SUMMARY\nCustomer: ${customer.name}\nTotal Due: ${customer.outstandingBalance || 0}\n\nPlease visit the shop to settle your bill.`;
        navigator.clipboard.writeText(text);
        alert("Bill summary copied to clipboard! You can paste it in any message app.");
    };

    const handleDownloadInvoice = (order: IOrder) => {
        const invoiceWindow = window.open('', '_blank');
        if (!invoiceWindow) return alert("Please allow popups to download invoice");

        // Get sales items for this order
        const orderSales = sales.filter(s => s.orderId === order.id);
        const customer = selectedCustomer || customers.find(c => c.id === order.customerId);
        
        // Calculate totals
        const subtotal = orderSales.length > 0 
            ? orderSales.reduce((sum, sale) => sum + sale.total, 0)
            : order.totalAmount;
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        // Build items table rows
        const itemsRows = orderSales.length > 0
            ? orderSales.map(sale => `
                <tr>
                    <td>Item #${sale.id.slice(0, 8)}</td>
                    <td class="text-center">${sale.quantity} ${sale.unit}</td>
                    <td class="text-right">$${sale.sellingPrice.toFixed(2)}</td>
                    <td class="text-right">$${sale.total.toFixed(2)}</td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td>Order Items</td>
                    <td class="text-center">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right">$${order.totalAmount.toFixed(2)}</td>
                </tr>
            `;

        const html = `
            <html>
            <head>
                <title>Invoice #${order.id}</title>
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
                    .notes-section {
                        margin-top: 40px;
                        padding: 25px;
                        background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
                        border-left: 4px solid #667eea;
                        border-radius: 8px;
                    }
                    .notes-section strong {
                        color: #667eea;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        display: block;
                        margin-bottom: 10px;
                    }
                    .notes-section p {
                        color: #495057;
                        line-height: 1.6;
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
                        <div class="invoice-number">#${order.id}</div>
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
                            ${customer ? `
                            <p><strong>${customer.name}</strong></p>
                            ${customer.address ? `<p>${customer.address}</p>` : ''}
                            ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
                            ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
                            ` : '<p>Walk-in Customer</p>'}
                            <p style="margin-top: 15px;"><strong>Invoice Date:</strong> ${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            ${order.paymentMethod ? `<p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>` : ''}
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
                        
                        ${order.notes ? `
                        <div class="notes-section">
                            <strong>Notes</strong>
                            <p>${order.notes}</p>
                        </div>
                        ` : ''}
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

    // Derived state
    const customerOrders = selectedCustomerId
        ? orders.filter(o => o.customerId === selectedCustomerId)
        : [];

    return (
        <div className="flex h-full bg-primary text-text-primary overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 min-w-[300px] border-r border-border-primary flex flex-col bg-secondary">
                <div className="p-4 border-b border-border-primary">
                    <h2 className="text-xl font-bold mb-4">Customers</h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-primary border border-border-primary pl-10 pr-4 py-2 rounded-sm text-sm focus:outline-none focus:border-accent-blue"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading && <div className="p-4 text-center text-text-muted">Loading...</div>}

                    {filteredCustomers.map(customer => (
                        <div
                            key={customer.id}
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className={`p-4 border-b border-border-primary cursor-pointer hover:bg-tertiary transition-colors ${selectedCustomerId === customer.id ? 'bg-tertiary border-l-4 border-l-accent-blue' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-sm">{customer.name}</h3>
                                {customer.outstandingBalance && customer.outstandingBalance > 0 && (
                                    <span className="text-xs font-mono text-accent-red font-bold">
                                        ${customer.outstandingBalance.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                <Phone size={12} />
                                <span>{customer?.phone || 'No Phone'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Detail View */}
            <div className="flex-1 flex flex-col overflow-hidden bg-primary">
                {selectedCustomer ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-border-primary bg-secondary flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-accent-blue/10 text-accent-blue rounded-full flex items-center justify-center">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{selectedCustomer.name}</h1>
                                    <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                                        <span className="flex items-center gap-1"><Phone size={14} /> {selectedCustomer.phone || "N/A"}</span>
                                        <span className="flex items-center gap-1"><Mail size={14} /> {selectedCustomer.email || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-text-muted uppercase tracking-wider mb-1">Outstanding Balance</div>
                                <div className={`text-3xl font-mono font-bold ${selectedCustomer.outstandingBalance && selectedCustomer.outstandingBalance > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                                    ${selectedCustomer.outstandingBalance?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSendMessage(selectedCustomer)}
                                    className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
                                >
                                    <MessageCircle size={24} />
                                    <div className="text-left">
                                        <div className="font-bold">Send Reminder</div>
                                        <div className="text-xs opacity-90">WhatsApp / SMS</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSendBill(selectedCustomer)}
                                    className="bg-secondary border border-border-primary hover:border-accent-blue hover:text-accent-blue text-text-primary p-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm"
                                >
                                    <FileText size={24} />
                                    <div className="text-left">
                                        <div className="font-bold">Copy Bill Summary</div>
                                        <div className="text-xs text-text-muted">To Clipboard</div>
                                    </div>
                                </button>
                            </div>

                            {/* Info */}
                            <div className="bg-secondary border border-border-primary rounded-lg p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <MapPin size={18} className="text-text-muted" />
                                    Address
                                </h3>
                                <p className="text-text-muted whitespace-pre-wrap">{selectedCustomer.address || "No address provided."}</p>
                            </div>

                            {/* Placeholder for History */}
                            <div className="bg-secondary border border-border-primary rounded-lg p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <ShoppingBag size={18} />
                                    Order History
                                </h3>

                                {customerOrders.length === 0 ? (
                                    <div className="text-center text-text-muted text-sm py-8">
                                        No recent orders found.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {customerOrders.map(order => (
                                            <div key={order.id} className="flex justify-between items-center p-3 border border-border-primary rounded bg-primary hover:bg-tertiary transition-colors">
                                                <div>
                                                    <div className="font-mono text-xs text-accent-blue">#{String(order.id).slice(0, 8)}</div>
                                                    <div className="text-xs text-text-muted">{new Date(order.date).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="font-bold font-mono">${order.totalAmount.toFixed(2)}</div>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(order)}
                                                        className="p-2 text-text-muted hover:text-accent-blue hover:bg-blue-500/10 rounded transition-colors"
                                                        title="Download Invoice"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                        <User size={64} className="mb-4 opacity-20" />
                        <p>Select a customer to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
