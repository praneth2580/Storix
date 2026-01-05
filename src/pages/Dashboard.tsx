import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { TrendingUp, AlertCircle, DollarSign, Package } from 'lucide-react';
import { useAppSelector, useDataPolling } from '../store/hooks';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchSales } from '../store/slices/salesSlice';
import { Loader } from '../components/Loader';

export function Dashboard() {
  useDataPolling(fetchProducts, 30000, 'Products');
  useDataPolling(fetchSales, 30000, 'Sales');

  const { items: products, loading: productsLoading } = useAppSelector(state => state.inventory);
  const { items: sales, loading: salesLoading } = useAppSelector(state => state.sales);
  
  const isLoading = productsLoading || salesLoading;

  // Calculate Metrics
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.defaultSellingPrice * 0), 0); // Stock is not available in IProduct yet.
  const lowStockCount = 0; // Mocked until we fetch Stock data
  const activeSkuCount = products.length; // Assume all fetched products are active for now
  const recentSalesCount = sales.length; // Mocking 'Pending Orders' with total sales count for now or 0

  // Mock data for charts (keep for visual until we have time-series data)
  const chartData1 = [65, 59, 80, 81, 56, 55, 40, 60, 75, 85, 90, 100];
  const chartData2 = [20, 25, 30, 28, 35, 40, 45, 42, 50, 55, 60, 65];
  const chartData3 = [85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30];
  const chartData4 = [45, 50, 45, 55, 48, 52, 58, 50, 60, 65, 62, 70];
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader message="Loading dashboard data..." />
      </div>
    );
  }
  
  return <div className="p-6 h-full overflow-y-auto bg-primary text-text-primary">
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-text-muted text-sm">
          Real-time inventory metrics & analysis
        </p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-text-primary font-mono text-sm">
          MARKET STATUS: <span className="text-accent-green">OPEN</span>
        </div>
        <div className="text-text-muted text-xs font-mono">
          {new Date().toUTCString()}
        </div>
      </div>
    </div>

    {/* Top Metrics Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Inventory Value"
        value={`$${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        trend={12.5}
        chartData={chartData1}
        type="positive"
      />
      <MetricCard
        title="Low Stock Alerts"
        value={lowStockCount.toString()}
        trend={-5.2}
        trendLabel="items critical"
        chartData={chartData2}
        type="negative"
      />
      <MetricCard
        title="Active SKUs"
        value={activeSkuCount.toLocaleString()}
        trend={3.8}
        chartData={chartData4}
        type="neutral"
      />
      <MetricCard
        title="Total Transactions"
        value={recentSalesCount.toLocaleString()}
        trend={0.0}
        trendLabel="lifetime sales"
        chartData={chartData3}
        type="warning"
      />
    </div>

    {/* Secondary Section - Dense Info */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[400px]">
      {/* Recent Activity Feed */}
      <div className="bg-secondary border border-border-primary p-4 flex flex-col col-span-1 lg:col-span-2 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-text-muted text-xs uppercase tracking-wider font-semibold">
            System Activity Log
          </h3>
          <button className="text-accent-blue text-xs hover:underline">
            View All
          </button>
        </div>
        <div className="flex-1 overflow-auto pr-2">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                <th className="pb-2 text-[10px] text-text-muted font-mono">
                  TIMESTAMP
                </th>
                <th className="pb-2 text-[10px] text-text-muted font-mono">
                  EVENT
                </th>
                <th className="pb-2 text-[10px] text-text-muted font-mono hidden sm:table-cell">
                  USER
                </th>
                <th className="pb-2 text-[10px] text-text-muted font-mono text-right">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {[...Array(8)].map((_, i) => <tr key={i} className="group hover:bg-tertiary transition-colors">
                <td className="py-2 text-xs font-mono text-text-secondary">
                  10:42:{15 + i}
                </td>
                <td className="py-2 text-sm text-text-primary">
                  Stock adjustment: SKU-00{i + 1}
                </td>
                <td className="py-2 text-xs text-text-secondary hidden sm:table-cell">
                  admin_01
                </td>
                <td className="py-2 text-right">
                  <span className="text-[10px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded border border-accent-green/20">
                    SUCCESS
                  </span>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions / Status */}
      <div className="bg-secondary border border-border-primary p-4 flex flex-col gap-4 rounded-lg">
        <h3 className="text-text-muted text-xs uppercase tracking-wider font-semibold">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-primary border border-border-primary hover:border-accent-blue hover:text-accent-blue text-text-muted text-xs flex flex-col items-center justify-center gap-2 transition-all rounded-sm">
            <Package size={20} />
            <span>Add Product</span>
          </button>
          <button className="p-3 bg-primary border border-border-primary hover:border-accent-blue hover:text-accent-blue text-text-muted text-xs flex flex-col items-center justify-center gap-2 transition-all rounded-sm">
            <TrendingUp size={20} />
            <span>Run Report</span>
          </button>
          <button className="p-3 bg-primary border border-border-primary hover:border-accent-blue hover:text-accent-blue text-text-muted text-xs flex flex-col items-center justify-center gap-2 transition-all rounded-sm">
            <AlertCircle size={20} />
            <span>View Alerts</span>
          </button>
          <button className="p-3 bg-primary border border-border-primary hover:border-accent-blue hover:text-accent-blue text-text-muted text-xs flex flex-col items-center justify-center gap-2 transition-all rounded-sm">
            <DollarSign size={20} />
            <span>Update Pricing</span>
          </button>
        </div>

        <div className="mt-auto pt-4 lg:pt-0">
          <h3 className="text-text-muted text-xs uppercase tracking-wider font-semibold mb-3">
            System Health
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-primary">Database Load</span>
                <span className="text-accent-green font-mono">24%</span>
              </div>
              <div className="h-1 bg-border-primary w-full rounded-full overflow-hidden">
                <div className="h-full bg-accent-green w-[24%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-primary">API Latency</span>
                <span className="text-accent-blue font-mono">42ms</span>
              </div>
              <div className="h-1 bg-border-primary w-full rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue w-[15%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}