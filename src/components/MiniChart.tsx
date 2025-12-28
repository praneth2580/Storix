import React from 'react';
interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}
export function MiniChart({
  data,
  color = '#3b82f6',
  height = 40,
  width = 100
}: MiniChartProps) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  // Create points for the SVG path
  const points = data.map((value, index) => {
    const x = index / (data.length - 1) * width;
    const y = height - (value - min) / range * height;
    return `${x},${y}`;
  }).join(' ');
  return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
      {/* Line */}
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />

      {/* Gradient fill area (optional, adds depth) */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#gradient-${color})`} points={`0,${height} ${points} ${width},${height}`} opacity="0.5" />
    </svg>;
}