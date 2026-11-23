import { motion } from 'framer-motion';

// Import conditionnel de recharts avec fallback SVG
let rechartsAvailable = false;
let RechartsLineChart: any, Line: any, RechartsBarChart: any, Bar: any, PieChart: any, Pie: any, Cell: any;
let XAxis: any, YAxis: any, CartesianGrid: any, Tooltip: any, Legend: any, ResponsiveContainer: any;

try {
  const recharts = require('recharts');
  RechartsLineChart = recharts.LineChart;
  Line = recharts.Line;
  RechartsBarChart = recharts.BarChart;
  Bar = recharts.Bar;
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  Cell = recharts.Cell;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
  ResponsiveContainer = recharts.ResponsiveContainer;
  rechartsAvailable = true;
} catch (error) {
  console.warn('⚠️  Recharts non disponible - Utilisation de graphiques SVG basiques');
  rechartsAvailable = false;
}

interface LineChartProps {
  data: number[] | Array<{ name: string; value: number; label?: string }>;
  labels?: string[];
  color?: string;
  height?: number;
  className?: string;
  title?: string;
}

export function LineChart({ 
  data, 
  labels, 
  color = '#3B82F6', 
  height = 250, 
  className = '',
  title 
}: LineChartProps) {
  // Formater les données
  const chartData = Array.isArray(data) && data.length > 0 && typeof data[0] === 'object'
    ? data as Array<{ name: string; value: number }>
    : (data as number[]).map((value, index) => ({
        name: labels?.[index] || `J${index + 1}`,
        value
      }));

  // Version fallback SVG si recharts n'est pas disponible
  if (!rechartsAvailable) {
    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    const minValue = Math.min(...chartData.map(d => d.value), 0);
    const range = maxValue - minValue || 1;
    const padding = 40;
    const chartWidth = 100 - (padding * 2);
    const chartHeight = height - padding * 2;

    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1 || 1)) * chartWidth;
      const y = padding + (1 - (d.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const pathPoints = points.split(' ').map(p => p.split(','));
    const pathD = pathPoints.length > 0 
      ? `M ${pathPoints[0][0]},${pathPoints[0][1]} ` + 
        pathPoints.slice(1).map(([x, y]) => `L ${x},${y}`).join(' ')
      : '';

    return (
      <div className={`w-full ${className}`}>
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center text-amber-600 text-xs mb-2 font-medium">
            ⚠️ Recharts non installé - Graphique basique
          </div>
          <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} className="overflow-visible">
            <defs>
              <linearGradient id={`lineGradient-${title || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {pathPoints.length > 1 && (
              <>
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon
                  points={`${pathPoints[0][0]},${height - padding} ${points} ${pathPoints[pathPoints.length - 1][0]},${height - padding}`}
                  fill={`url(#lineGradient-${title || 'default'})`}
                />
              </>
            )}
          </svg>
        </div>
      </div>
    );
  }

  // Version Recharts (si disponible)
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  className?: string;
  title?: string;
}

export function DonutChart({ 
  data, 
  size = 300, 
  className = '',
  title 
}: DonutChartProps) {
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    fill: item.color
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Version fallback SVG si recharts n'est pas disponible
  if (!rechartsAvailable) {
    let currentAngle = 0;
    const radius = size * 0.25;
    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = size * 0.15;

    const paths = chartData.map((d, i) => {
      const percentage = (d.value / total) * 100;
      const angle = (d.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      const largeArc = angle > 180 ? 1 : 0;

      return {
        path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: d.fill,
        name: d.name,
        value: d.value,
        percentage
      };
    });

    return (
      <div className={`flex flex-col ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center text-amber-600 text-xs mb-2 font-medium">
            ⚠️ Recharts non installé - Graphique basique
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {paths.map((p, i) => (
                <g key={i}>
                  <path d={p.path} fill={p.color} stroke="white" strokeWidth="2" />
                </g>
              ))}
              <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" />
              <text x={centerX} y={centerY - 10} textAnchor="middle" className="text-2xl font-bold fill-gray-900">
                {total}
              </text>
              <text x={centerX} y={centerY + 15} textAnchor="middle" className="text-sm fill-gray-600">
                Total
              </text>
            </svg>
            <div className="space-y-2">
              {paths.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                  </div>
                  <span className="font-medium">{p.value} ({p.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version Recharts (si disponible)
  return (
    <div className={`flex flex-col ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <ResponsiveContainer width="100%" height={size} maxWidth={size}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.3}
              outerRadius={size * 0.4}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              className="text-2xl font-bold fill-gray-900"
            >
              {total}
            </text>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Légende */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <motion.div 
              key={index} 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  className?: string;
  title?: string;
  horizontal?: boolean;
}

export function BarChart({ 
  data, 
  height = 300, 
  className = '',
  title,
  horizontal = false
}: BarChartProps) {
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    fill: item.color || '#3B82F6'
  }));

  // Version fallback SVG si recharts n'est pas disponible
  if (!rechartsAvailable) {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = 60;
    const barHeight = (height - padding) / data.length;
    const maxBarWidth = 400;

    return (
      <div className={`w-full ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center text-amber-600 text-xs mb-4 font-medium">
            ⚠️ Recharts non installé - Graphique basique
          </div>
          <div style={{ maxWidth: maxBarWidth + padding, margin: '0 auto' }}>
            {data.map((d, i) => {
              const barWidth = (d.value / maxValue) * maxBarWidth;
              const y = i * barHeight + 10;

              return (
                <div key={i} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(d.value / maxValue) * 100}%`,
                        backgroundColor: d.color || '#3B82F6'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Version Recharts (si disponible)
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} width={100} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </RechartsBarChart>
        ) : (
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
