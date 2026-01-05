import React, { useState } from 'react'
import {
    Calendar,
    Download,
    FileText,
    TrendingUp,
    Package,
    DollarSign,
    ShoppingCart,
    Filter,
    ChevronDown,
    BarChart3,
    PieChart,
    LineChart,
} from 'lucide-react'
import { MiniChart } from '../components/MiniChart'
type ReportType = 'sales' | 'inventory' | 'purchases' | 'profit' | 'all'
type ReportData = {
    id: string
    date: string
    type: string
    description: string
    amount: number
    quantity?: number
    status: 'Completed' | 'Pending' | 'Processing'
}
// Redux integration replaces mock data
// const MOCK_REPORT_DATA... removed

import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchSales } from '../store/slices/salesSlice';
import { fetchPurchases } from '../store/slices/purchasesSlice';
import { fetchProducts } from '../store/slices/inventorySlice';
import { Loader2 } from 'lucide-react';
import { Loader } from '../components/Loader';

export function Reports() {
    useDataPolling(fetchSales, 30000, 'Sales');
    useDataPolling(fetchPurchases, 30000, 'Purchases');
    useDataPolling(fetchProducts, 30000, 'Products');

    const { items: sales, loading: salesLoading } = useAppSelector(state => state.sales);
    const { items: purchases, loading: purchasesLoading } = useAppSelector(state => state.purchases);
    const { items: products, loading: productsLoading } = useAppSelector(state => state.inventory);
    
    const loading = salesLoading || purchasesLoading || productsLoading;
    
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader message="Loading report data..." />
            </div>
        );
    }

    const [reportType, setReportType] = useState<ReportType>('all')
    const [dateFrom, setDateFrom] = useState('2024-01-01')
    const [dateTo, setDateTo] = useState('2024-12-31') // Extended default range
    const [showExportMenu, setShowExportMenu] = useState(false)
    // Mock chart data (still mock for now as we don't have historical data structure in Redux state yet)
    const salesChartData = [45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 88, 95]
    const inventoryChartData = [
        120, 115, 110, 108, 105, 102, 98, 95, 92, 88, 85, 82,
    ]
    const purchaseChartData = [30, 35, 32, 40, 38, 45, 42, 48, 52, 50, 55, 58]
    const profitChartData = [15, 18, 16, 25, 20, 27, 26, 27, 30, 28, 33, 37]

    // Combine data
    const allTransactions: ReportData[] = [
        ...sales.map(s => ({
            id: s.id,
            date: s.date, // Assuming ISale has date string
            type: 'Sales',
            description: `Order #${s.orderId} - ${s.quantity} units`, // Simplified description
            amount: s.total,
            quantity: s.quantity,
            status: 'Completed' as const
        })),
        ...purchases.map(p => ({
            id: p.id,
            date: p.date,
            type: 'Purchase',
            description: `PO ${p.invoiceNumber || ''} - ${p.productId}`,
            amount: p.total,
            quantity: p.quantity,
            status: 'Completed' as const
        }))
    ];

    const filteredData = allTransactions.filter((item) => {
        if (reportType !== 'all' && item.type.toLowerCase() !== reportType)
            return false
        return true
    })
    const totalSales = filteredData
        .filter((d) => d.type === 'Sales')
        .reduce((sum, d) => sum + d.amount, 0)
    const totalPurchases = filteredData
        .filter((d) => d.type === 'Purchase')
        .reduce((sum, d) => sum + d.amount, 0)
    const totalProfit = totalSales - totalPurchases
    const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
        console.log(`Exporting as ${format}...`)
        setShowExportMenu(false)
        // Mock export functionality
        alert(`Report exported as ${format.toUpperCase()}`)
    }
    return (
        <div className="flex flex-col h-full bg-primary text-text-primary overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-border-primary bg-secondary shrink-0">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Reports & Analytics</h1>
                        <p className="text-text-muted text-sm font-mono">
                            Comprehensive business intelligence and insights
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-lg"
                            >
                                <Download size={16} />
                                Export Report
                                <ChevronDown size={14} />
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-secondary border border-border-primary rounded-sm shadow-xl z-50">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-tertiary transition-colors flex items-center gap-2"
                                    >
                                        <FileText size={14} /> Export as CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-tertiary transition-colors flex items-center gap-2"
                                    >
                                        <FileText size={14} /> Export as PDF
                                    </button>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-tertiary transition-colors flex items-center gap-2"
                                    >
                                        <FileText size={14} /> Export as Excel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                <Calendar size={12} /> From Date
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none rounded-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                <Calendar size={12} /> To Date
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full bg-primary border border-border-primary p-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none rounded-sm font-mono"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {[
                            {
                                id: 'all',
                                label: 'All Reports',
                                icon: BarChart3,
                            },
                            {
                                id: 'sales',
                                label: 'Sales',
                                icon: ShoppingCart,
                            },
                            {
                                id: 'inventory',
                                label: 'Inventory',
                                icon: Package,
                            },
                            {
                                id: 'purchases',
                                label: 'Purchases',
                                icon: DollarSign,
                            },
                            {
                                id: 'profit',
                                label: 'Profit',
                                icon: TrendingUp,
                            },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setReportType(type.id as ReportType)}
                                className={`px-3 py-2 text-xs font-medium border rounded-sm whitespace-nowrap flex items-center gap-2 transition-colors ${reportType === type.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-primary border-border-primary text-text-muted hover:border-border-secondary'}`}
                            >
                                <type.icon size={14} />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Report Cards */}
            <div className="p-4 md:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Sales Report Card */}
                    <div className="bg-secondary border border-border-primary p-4 rounded-lg hover:border-blue-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center text-blue-500">
                                <ShoppingCart size={20} />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted uppercase tracking-wider">
                                    Sales
                                </div>
                                <div className="text-2xl font-mono font-bold text-text-primary">
                                    ${totalSales.toFixed(0)}
                                </div>
                            </div>
                        </div>
                        <div className="h-12 mb-2">
                            <MiniChart data={salesChartData} color="#3b82f6" height={48} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-text-muted">Last 30 days</span>
                            <span className="text-green-500 font-mono">+12.5%</span>
                        </div>
                    </div>

                    {/* Inventory Report Card */}
                    <div className="bg-secondary border border-border-primary p-4 rounded-lg hover:border-purple-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded flex items-center justify-center text-purple-500">
                                <Package size={20} />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted uppercase tracking-wider">
                                    Inventory
                                </div>
                                <div className="text-2xl font-mono font-bold text-text-primary">
                                    1,842
                                </div>
                            </div>
                        </div>
                        <div className="h-12 mb-2">
                            <MiniChart
                                data={inventoryChartData}
                                color="#a855f7"
                                height={48}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-text-muted">Active SKUs</span>
                            <span className="text-amber-500 font-mono">-3.2%</span>
                        </div>
                    </div>

                    {/* Purchase Report Card */}
                    <div className="bg-secondary border border-border-primary p-4 rounded-lg hover:border-orange-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded flex items-center justify-center text-orange-500">
                                <DollarSign size={20} />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted uppercase tracking-wider">
                                    Purchases
                                </div>
                                <div className="text-2xl font-mono font-bold text-text-primary">
                                    ${totalPurchases.toFixed(0)}
                                </div>
                            </div>
                        </div>
                        <div className="h-12 mb-2">
                            <MiniChart data={purchaseChartData} color="#f97316" height={48} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-text-muted">Procurement</span>
                            <span className="text-green-500 font-mono">+8.3%</span>
                        </div>
                    </div>

                    {/* Profit Report Card */}
                    <div className="bg-secondary border border-border-primary p-4 rounded-lg hover:border-green-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center text-green-500">
                                <TrendingUp size={20} />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted uppercase tracking-wider">
                                    Net Profit
                                </div>
                                <div className="text-2xl font-mono font-bold text-green-500">
                                    ${totalProfit.toFixed(0)}
                                </div>
                            </div>
                        </div>
                        <div className="h-12 mb-2">
                            <MiniChart data={profitChartData} color="#10b981" height={48} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-text-muted">Margin: 35%</span>
                            <span className="text-green-500 font-mono">+15.7%</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Report Table */}
                <div className="bg-secondary border border-border-primary rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <FileText size={18} className="text-blue-500" />
                            Detailed Transaction Report
                        </h2>
                        <div className="text-sm text-text-muted font-mono">
                            Showing {filteredData.length} transactions
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-tertiary text-text-muted text-[10px] uppercase font-mono tracking-wider">
                                <tr>
                                    <th className="p-3 border-b border-border-primary">Date</th>
                                    <th className="p-3 border-b border-border-primary">Type</th>
                                    <th className="p-3 border-b border-border-primary">
                                        Description
                                    </th>
                                    <th className="p-3 border-b border-border-primary text-right">
                                        Quantity
                                    </th>
                                    <th className="p-3 border-b border-border-primary text-right">
                                        Amount
                                    </th>
                                    <th className="p-3 border-b border-border-primary text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-primary">
                                {filteredData.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-tertiary transition-colors"
                                    >
                                        <td className="p-3 font-mono text-xs text-text-secondary">
                                            {item.date}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`text-xs px-2 py-1 rounded border ${item.type === 'Sales' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}
                                            >
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-text-primary">
                                            {item.description}
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm">
                                            {item.quantity || '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-sm font-bold text-text-primary">
                                            ${item.amount.toFixed(2)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide ${item.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="p-4 border-t border-border-primary bg-tertiary flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-text-muted font-mono">
                            Total:{' '}
                            <span className="text-text-primary font-bold">
                                ${filteredData.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-border-primary hover:bg-secondary text-text-muted text-xs rounded-sm transition-colors">
                                Previous
                            </button>
                            <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-sm">
                                1
                            </button>
                            <button className="px-3 py-1 border border-border-primary hover:bg-secondary text-text-muted text-xs rounded-sm transition-colors">
                                2
                            </button>
                            <button className="px-3 py-1 border border-border-primary hover:bg-secondary text-text-muted text-xs rounded-sm transition-colors">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
