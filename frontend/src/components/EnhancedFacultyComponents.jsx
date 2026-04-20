import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, Book, Zap } from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════
   ENHANCED STAT CARD WITH TREND
   ═════════════════════════════════════════════════════════════════════ */

export function EnhancedStatCard({
  title,
  value,
  icon: Icon,
  trend = null,
  color = 'blue',
  subtitle = null,
}) {
  const colorMap = {
    blue: { bg: 'from-blue-100 to-blue-50', icon: 'text-blue-600', border: 'border-blue-200 hover:border-blue-300' },
    green: { bg: 'from-green-100 to-green-50', icon: 'text-green-600', border: 'border-green-200 hover:border-green-300' },
    purple: { bg: 'from-purple-100 to-purple-50', icon: 'text-purple-600', border: 'border-purple-200 hover:border-purple-300' },
    amber: { bg: 'from-amber-100 to-amber-50', icon: 'text-amber-600', border: 'border-amber-200 hover:border-amber-300' },
  };

  const colors = colorMap[color] || colorMap.blue;
  const isPositive = trend && trend > 0;

  return (
    <div className={`fc-stat-card ${colors.border}`}>
      <div className="fc-stat-card-header">
        <div className={`fc-stat-icon bg-gradient-to-br ${colors.bg}`}>
          {Icon && <Icon className={`w-6 h-6 ${colors.icon}`} />}
        </div>
      </div>
      <div className="fc-stat-content">
        <div className="fc-stat-label">{title}</div>
        <div className="fc-stat-value">{value}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
        {trend !== null && (
          <div className={`fc-stat-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   DATA VISUALIZATION COMPONENTS
   ═════════════════════════════════════════════════════════════════════ */

export function TimetableUtilizationChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { day: 'Mon', utilization: 78 },
    { day: 'Tue', utilization: 82 },
    { day: 'Wed', utilization: 85 },
    { day: 'Thu', utilization: 79 },
    { day: 'Fri', utilization: 75 },
    { day: 'Sat', utilization: 45 },
  ];

  return (
    <div className="fc-viz-container">
      <h3 className="fc-viz-title">Weekly Timetable Utilization</h3>
      <div className="fc-viz-content h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar dataKey="utilization" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SchedulingConflictsChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Room Conflicts', value: 12, fill: '#ef4444' },
    { name: 'Instructor Clashes', value: 8, fill: '#f59e0b' },
    { name: 'Batch Overlaps', value: 5, fill: '#10b981' },
    { name: 'Resolved', value: 25, fill: '#06b6d4' },
  ];

  return (
    <div className="fc-viz-container">
      <h3 className="fc-viz-title">Scheduling Issues Breakdown</h3>
      <div className="fc-viz-content h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name} (${value})`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ModuleDistributionChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { semester: 'Sem 1', Year1: 12, Year2: 10, Year3: 8 },
    { semester: 'Sem 2', Year1: 14, Year2: 11, Year3: 9 },
    { semester: 'Sem 3', Year1: 13, Year2: 12, Year3: 10 },
    { semester: 'Sem 4', Year1: 15, Year2: 13, Year3: 11 },
  ];

  return (
    <div className="fc-viz-container">
      <h3 className="fc-viz-title">Module Distribution by Year</h3>
      <div className="fc-viz-content h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semester" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="Year1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Year2" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Year3" fill="#10b981" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScheduleComplianceChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { week: 'Week 1', compliance: 92 },
    { week: 'Week 2', compliance: 94 },
    { week: 'Week 3', compliance: 88 },
    { week: 'Week 4', compliance: 96 },
    { week: 'Week 5', compliance: 91 },
    { week: 'Week 6', compliance: 95 },
  ];

  return (
    <div className="fc-viz-container">
      <h3 className="fc-viz-title">Schedule Compliance Over Time</h3>
      <div className="fc-viz-content h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="compliance"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompliance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   ENHANCED TABLE
   ═════════════════════════════════════════════════════════════════════ */

export function EnhancedTable({
  columns = [],
  data = [],
  onRowClick = null,
  loading = false,
  emptyMessage = 'No data available',
}) {
  if (loading) {
    return (
      <div className="fc-table-wrapper">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="fc-empty-state">
        <div className="fc-empty-state-icon">📭</div>
        <div className="fc-empty-state-title">No Data</div>
        <div className="fc-empty-state-description">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="fc-table-wrapper">
      <table className="fc-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   QUICK STATS ROW
   ═════════════════════════════════════════════════════════════════════ */

export function QuickStatsRow() {
  const stats = [
    { title: 'Total Modules', value: 48, icon: Book, color: 'blue', trend: 5 },
    { title: 'Batches', value: 24, icon: Users, color: 'green', trend: 12 },
    { title: 'Schedule Health', value: '94%', icon: Zap, color: 'purple', trend: 3 },
    { title: 'Pending Conflicts', value: 5, icon: Calendar, color: 'amber', trend: -25 },
  ];

  return (
    <div className="fc-stats-grid">
      {stats.map((stat, idx) => (
        <EnhancedStatCard key={idx} {...stat} />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   ADVANCED FILTER PANEL
   ═════════════════════════════════════════════════════════════════════ */

export function AdvancedFilterPanel({
  filters = {},
  onFilterChange = () => {},
  onApply = () => {},
  onReset = () => {},
}) {
  return (
    <div className="fc-filter-panel">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Advanced Filters</h3>
      <div className="space-y-4">
        {Object.entries(filters).map(([key, value]) => (
          <div key={key} className="fc-filter-group">
            <label htmlFor={key} className="fc-filter-label">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              id={key}
              type="text"
              className="fc-filter-input"
              value={value}
              onChange={(e) => onFilterChange(key, e.target.value)}
              placeholder={`Filter by ${key}...`}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <button className="fc-btn primary flex-1" onClick={onApply}>
          Apply Filters
        </button>
        <button className="fc-btn secondary flex-1" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default {
  EnhancedStatCard,
  TimetableUtilizationChart,
  SchedulingConflictsChart,
  ModuleDistributionChart,
  ScheduleComplianceChart,
  EnhancedTable,
  QuickStatsRow,
  AdvancedFilterPanel,
};
