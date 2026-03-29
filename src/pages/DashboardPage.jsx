import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CATEGORY_ICONS = {
  food: '🍔', transport: '🚗', entertainment: '🎬', utilities: '💡',
  shopping: '🛍️', health: '❤️', travel: '✈️', general: '💰',
};

const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const SkeletonCard = () => (
  <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div className="skeleton" style={{ height: '0.7rem', width: '50%' }} />
    <div className="skeleton" style={{ height: '1.75rem', width: '70%' }} />
    <div className="skeleton" style={{ height: '0.65rem', width: '40%' }} />
  </div>
);

const SkeletonExpense = () => (
  <div className="expense-item" style={{ pointerEvents: 'none' }}>
    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="skeleton" style={{ height: '0.85rem', width: '60%' }} />
      <div className="skeleton" style={{ height: '0.65rem', width: '80%' }} />
    </div>
    <div className="skeleton" style={{ width: 60, height: '1rem' }} />
  </div>
);

const SkeletonSplitRow = () => (
  <div className="split-row" style={{ pointerEvents: 'none' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
        <div className="skeleton" style={{ height: '0.6rem', width: '70%' }} />
      </div>
    </div>
    <div className="skeleton" style={{ width: 60, height: '0.875rem' }} />
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { summary, recentExpenses = [], owedToYouSplits = [], youOweSplits = [] } = data || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Hey {user?.name?.split(' ')[0]} 👋 Here's your financial overview
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">You Are Owed</div>
              <div className="stat-value positive">{formatCurrency(summary?.totalOwedToYou || 0)}</div>
              <div className="stat-meta">{owedToYouSplits.length} pending payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">You Owe</div>
              <div className="stat-value negative">{formatCurrency(summary?.totalYouOwe || 0)}</div>
              <div className="stat-meta">{youOweSplits.length} unsettled splits</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Net Balance</div>
              <div className={`stat-value ${(summary?.netBalance || 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(Math.abs(summary?.netBalance || 0))}
              </div>
              <div className="stat-meta">{(summary?.netBalance || 0) >= 0 ? 'You are ahead' : 'You are behind'}</div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Recent Expenses */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent Expenses</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/groups')}>View all →</button>
          </div>

          {loading ? (
            <div className="expense-list">
              <SkeletonExpense /><SkeletonExpense /><SkeletonExpense />
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <div className="empty-icon">🧾</div>
              <div className="empty-title">No expenses yet</div>
              <div className="empty-desc">Add your first expense inside a group</div>
            </div>
          ) : (
            <div className="expense-list">
              {recentExpenses.map(exp => {
                const myShare = exp.splits[0];
                return (
                  <div key={exp.id} className="expense-item" onClick={() => navigate(`/groups/${exp.group.id}`)}>
                    <div className={`expense-category-icon cat-${exp.category}`}>
                      {CATEGORY_ICONS[exp.category] || '💰'}
                    </div>
                    <div className="expense-info">
                      <div className="expense-title">{exp.title}</div>
                      <div className="expense-meta">
                        {exp.group.name} · {timeAgo(exp.createdAt)} · paid by {exp.paidBy.id === user?.id ? 'you' : exp.paidBy.name}
                      </div>
                    </div>
                    <div className="expense-amount-col">
                      <div className="expense-amount">{formatCurrency(exp.amount, exp.group.currency)}</div>
                      {myShare && (
                        <div className="expense-split-info">
                          your share: {formatCurrency(myShare.amount, exp.group.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Balances */}
        <div>
          {loading ? (
            <div className="splits-list">
              <SkeletonSplitRow /><SkeletonSplitRow /><SkeletonSplitRow /><SkeletonSplitRow />
            </div>
          ) : (
            <>
              {owedToYouSplits.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="section-header"><span className="section-title">People Owe You</span></div>
                  <div className="splits-list">
                    {owedToYouSplits.slice(0, 4).map(s => (
                      <div key={s.id} className="split-row">
                        <div className="split-user">
                          <div className="avatar avatar-sm">{s.user.name[0]}</div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.user.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.expense.title}</div>
                          </div>
                        </div>
                        <span className="split-amount paid">{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {youOweSplits.length > 0 && (
                <div>
                  <div className="section-header"><span className="section-title">You Owe</span></div>
                  <div className="splits-list">
                    {youOweSplits.slice(0, 4).map(s => (
                      <div key={s.id} className="split-row">
                        <div className="split-user">
                          <div className="avatar avatar-sm">{s.expense.paidBy.name[0]}</div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.expense.paidBy.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.expense.title}</div>
                          </div>
                        </div>
                        <span className="split-amount unpaid">{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {owedToYouSplits.length === 0 && youOweSplits.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.25rem' }}>All settled up!</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No outstanding balances</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}