/**
 * COMPOSANTS GRAPHIQUES POUR STATISTIQUES
 * Graphiques réutilisables pour visualiser les données
 * Note: Version simple sans library externe - peut être amélioré avec Recharts
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Types
interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartData {
  label: string;
  values: number[];
  color?: string;
}

// Barre de progression
export function ProgressBar({ value, max = 100, color = 'blue', label }: { 
  value: number; 
  max?: number; 
  color?: string;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  };
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span className="font-semibold">{value}/{max}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Graphique en barres verticales
export function BarChart({ data, height = 200 }: { data: ChartData[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-around gap-2" style={{ height: `${height}px` }}>
      {data.map((item, idx) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
        const color = item.color || 'bg-blue-600';
        
        return (
          <div key={idx} className="flex flex-col items-center flex-1 max-w-[100px]">
            <div className="relative w-full flex flex-col items-center justify-end" style={{ height: `${height - 40}px` }}>
              <div className="absolute -top-6 text-sm font-semibold text-gray-700">
                {item.value}
              </div>
              <div
                className={`w-full ${color} rounded-t transition-all duration-500`}
                style={{ height: `${barHeight}px` }}
              />
            </div>
            <div className="mt-2 text-xs text-center text-gray-600 truncate w-full px-1">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Graphique circulaire (Donut)
export function DonutChart({ data, size = 200 }: { data: ChartData[]; size?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const colors = [
    'text-blue-600',
    'text-green-600',
    'text-yellow-600',
    'text-purple-600',
    'text-red-600',
    'text-indigo-600',
    'text-pink-600',
    'text-orange-600'
  ];
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((item, idx) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            const startX = size / 2 + (size / 2 - 20) * Math.cos((startAngle - 90) * Math.PI / 180);
            const startY = size / 2 + (size / 2 - 20) * Math.sin((startAngle - 90) * Math.PI / 180);
            const endX = size / 2 + (size / 2 - 20) * Math.cos((endAngle - 90) * Math.PI / 180);
            const endY = size / 2 + (size / 2 - 20) * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${size / 2} ${size / 2}`,
              `L ${startX} ${startY}`,
              `A ${size / 2 - 20} ${size / 2 - 20} 0 ${largeArc} 1 ${endX} ${endY}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={idx}
                d={pathData}
                className={item.color || colors[idx % colors.length]}
                fill="currentColor"
                opacity="0.8"
              />
            );
          })}
          {/* Centre blanc */}
          <circle cx={size / 2} cy={size / 2} r={size / 4} fill="white" />
        </svg>
        
        {/* Total au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>
      
      {/* Légende */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {data.map((item, idx) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          const colorClass = item.color || colors[idx % colors.length];
          
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded ${colorClass.replace('text-', 'bg-')}`} />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto font-semibold">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Carte de statistique
export function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon,
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm mt-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{Math.abs(change)}%</span>
              <span className="text-gray-500">vs mois dernier</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Graphique en ligne simple
export function SimpleLineChart({ data, height = 150 }: { data: LineChartData[]; height?: number }) {
  if (!data.length || !data[0].values.length) return null;
  
  const maxValue = Math.max(...data.flatMap(d => d.values));
  const pointCount = data[0].values.length;
  const width = 400;
  const padding = 20;
  
  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Grille */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + (height - 2 * padding) * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text x={5} y={y + 4} fontSize="10" fill="#9ca3af">
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          );
        })}
        
        {/* Lignes */}
        {data.map((line, lineIdx) => {
          const points = line.values.map((value, idx) => {
            const x = padding + ((width - 2 * padding) / (pointCount - 1)) * idx;
            const y = padding + (height - 2 * padding) * (1 - value / maxValue);
            return `${x},${y}`;
          }).join(' ');
          
          const color = line.color || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][lineIdx % 4];
          
          return (
            <polyline
              key={lineIdx}
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

// Export default pour faciliter l'import
export default {
  ProgressBar,
  BarChart,
  DonutChart,
  StatCard,
  SimpleLineChart
};

