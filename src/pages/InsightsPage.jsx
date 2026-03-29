import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getCategoryIcon } from '../utils/helpers';

const CHART_COLORS = [
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--danger)',
  'var(--accent-light)',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: '0.85rem',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
          {formatCurrency(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.insights()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}
        </div>
      </div>
    );
  }

  const weekly = data?.weeklySpending || [];
  const categories = data?.categoryBreakdown || [];
  const maxCategory = categories[0]?.total || 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">Your spending patterns over the last 4 weeks</p>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value neutral">{formatCurrency(data?.totalThisMonth || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Expenses Paid</span>
          <span className="stat-value neutral">{data?.expenseCount || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top Category</span>
          <span className="stat-value neutral" style={{ fontSize: '1.5rem' }}>
            {categories[0] ? `${getCategoryIcon(categories[0].category)} ${categories[0].category}` : '—'}
          </span>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="chart-container" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="chart-header">
          <span className="chart-title">Weekly Spending</span>
          <span className="badge badge-accent">Last 4 weeks</span>
        </div>
        {weekly.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-icon">📊</div>
            <div className="empty-title">No data yet</div>
            <div className="empty-desc">Start adding expenses to see your spending patterns</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,110,245,0.08)' }} />
              <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Category Bars */}
        <div className="chart-container">
          <div className="chart-header">
            <span className="chart-title">By Category</span>
          </div>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No category data</p>
          ) : (
            <div className="category-bar-list">
              {categories.map((cat, i) => (
                <div key={cat.category} className="category-bar-item">
                  <div className="category-bar-meta">
                    <span className="category-bar-name">
                      {getCategoryIcon(cat.category)} {cat.category}
                    </span>
                    <span className="category-bar-amount">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{
                        width: `${(cat.total / maxCategory) * 100}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <span className="chart-title">Distribution</span>
          </div>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data to display</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={3}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {getCategoryIcon(value)} {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
