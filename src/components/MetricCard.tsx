import React from 'react';
import { MiniChart } from './MiniChart';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel?: string;
  chartData: number[];
  type?: 'neutral' | 'positive' | 'negative' | 'warning';
}
export function MetricCard({
  title,
  value,
  trend,
  trendLabel = 'vs last week',
  chartData,
  type = 'neutral'
}: MetricCardProps) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  let trendColor = 'text-accent-blue';
  let chartColor = '#3b82f6'; // blue
  if (type === 'positive' || type === 'neutral' && isPositive) {
    trendColor = 'text-accent-green';
    chartColor = '#10b981';
  } else if (type === 'negative' || type === 'neutral' && !isPositive && !isNeutral) {
    trendColor = 'text-accent-red';
    chartColor = '#ef4444';
  } else if (type === 'warning') {
    trendColor = 'text-accent-amber';
    chartColor = '#f59e0b';
  }
  return <div className="bg-secondary border border-border-primary p-4 flex flex-col justify-between h-full hover:border-border-secondary transition-colors duration-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-text-muted text-xs uppercase tracking-wider font-semibold">
          {title}
        </h3>
        <div className={`flex items-center text-xs font-mono font-bold ${trendColor}`}>
          {isPositive && <ArrowUpRight size={14} className="mr-1" />}
          {!isPositive && !isNeutral && <ArrowDownRight size={14} className="mr-1" />}
          {isNeutral && <Minus size={14} className="mr-1" />}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-mono font-bold text-text-primary tabular-nums tracking-tight">
            {value}
          </div>
          <div className="text-[10px] text-text-muted mt-1">{trendLabel}</div>
        </div>

        <div className="w-24 h-10">
          <MiniChart data={chartData} color={chartColor} height={40} />
        </div>
      </div>
    </div>;
}