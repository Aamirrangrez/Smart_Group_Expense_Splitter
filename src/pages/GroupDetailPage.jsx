import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupApi, expenseApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatCurrency, formatDate, getCategoryIcon, getInitials } from '../utils/helpers';
import AddExpenseModal from '../components/AddExpenseModal';
import AddMemberModal from '../components/AddMemberModal';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const { joinGroup, leaveGroup, onEvent } = useSocket();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'members'

  const fetchGroup = useCallback(async () => {
    try {
      const res = await groupApi.getById(id);
      const g = res.data.data.group;
      setGroup(g);
      setExpenses(g.expenses || []);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        toast.error('Group not found or access denied');
        navigate('/groups');
      } else {
        toast.error('Failed to load group');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();

    // Join socket room
    joinGroup(id);

    const offExpenseCreated = onEvent('expense:created', ({ expense }) => {
      setExpenses((prev) => {
        const exists = prev.find((e) => e.id === expense.id);
        if (exists) return prev;
        return [expense, ...prev];
      });
      toast.info(`New expense: ${expense.title}`);
    });

    const offExpenseDeleted = onEvent('expense:deleted', ({ expenseId }) => {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    });

    const offSplitSettled = onEvent('split:settled', ({ expenseId, split }) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                splits: e.splits?.map((s) =>
                  s.userId === split.userId ? { ...s, paid: true } : s
                ),
              }
            : e
        )
      );
    });

    const offMemberAdded = onEvent('group:member_added', ({ member }) => {
      setGroup((prev) =>
        prev ? { ...prev, members: [...(prev.members || []), member] } : prev
      );
      toast.info(`${member.user?.name} joined the group`);
    });

    return () => {
      leaveGroup(id);
      offExpenseCreated?.();
      offExpenseDeleted?.();
      offSplitSettled?.();
      offMemberAdded?.();
    };
  }, [id]);

  const handleExpenseAdded = (expense) => {
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === expense.id);
      if (exists) return prev;
      return [expense, ...prev];
    });
    setShowAddExpense(false);
    toast.success('Expense added!');
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseApi.delete(expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleSettle = async (expenseId, userId) => {
    try {
      await expenseApi.settle(expenseId, { userId });
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                splits: e.splits?.map((s) =>
                  s.userId === userId ? { ...s, paid: true } : s
                ),
              }
            : e
        )
      );
      toast.success('Settled!');
    } catch {
      toast.error('Failed to settle');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 60, marginBottom: 'var(--space-4)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      </div>
    );
  }

  if (!group) return null;

  const members = group.members || [];
  const isCreator = group.createdById === user?.id;

  // Calculate per-member balance within this group
  const memberBalances = members.map((m) => {
    let balance = 0;
    expenses.forEach((expense) => {
      if (expense.paidById === m.userId) {
        // This member paid — they're owed by others
        expense.splits?.forEach((split) => {
          if (split.userId !== m.userId && !split.paid) {
            balance += split.amount;
          }
        });
      } else {
        // Check if this member owes something
        const split = expense.splits?.find((s) => s.userId === m.userId);
        if (split && !split.paid) balance -= split.amount;
      }
    });
    return { ...m, balance };
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="group-avatar" style={{ width: 52, height: 52, fontSize: '1.3rem' }}>
            {getInitials(group.name)}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>{group.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {group.description && (
                <span className="page-subtitle">{group.description}</span>
              )}
              <span className="badge badge-muted">{group.currency}</span>
              <div className="realtime-badge">
                <span className="realtime-dot" />
                Live
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {isCreator && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
              + Member
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
            + Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses ({expenses.length})
        </button>
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({members.length})
        </button>
        <button
          className={`tab ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <div className="empty-title">No expenses yet</div>
              <div className="empty-desc">Add your first expense — try voice input!</div>
              <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
                Add Expense
              </button>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => {
                const isPayer = expense.paidById === user?.id;
                const userSplit = expense.splits?.find((s) => s.userId === user?.id);
                const allSplits = expense.splits || [];
                const settledCount = allSplits.filter((s) => s.paid).length;

                return (
                  <div key={expense.id} className="expense-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div className={`expense-icon ${expense.category}`}>
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="expense-details">
                        <div className="expense-title">{expense.title}</div>
                        <div className="expense-meta">
                          <span>Paid by <strong style={{ color: 'var(--text-primary)' }}>{isPayer ? 'you' : expense.paidBy?.name}</strong></span>
                          <span>·</span>
                          <span>{formatDate(expense.createdAt)}</span>
                          <span>·</span>
                          <span style={{ color: 'var(--accent-light)' }}>{expense.category}</span>
                        </div>
                      </div>
                      <div className="expense-amount">
                        <div className="expense-total">{formatCurrency(expense.amount)}</div>
                        {userSplit && (
                          <div className={`expense-share ${userSplit.paid ? '' : isPayer ? 'owed-to-you' : 'you-owe'}`}>
                            {userSplit.paid ? '✓ Settled' : isPayer ? 'You paid' : `You owe ${formatCurrency(userSplit.amount)}`}
                          </div>
                        )}
                      </div>
                      {isPayer && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          title="Delete expense"
                          style={{ color: 'var(--danger)', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Splits breakdown */}
                    <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Split: {settledCount}/{allSplits.length} settled
                      </span>
                      {allSplits.map((split) => (
                        <span
                          key={split.id || split.userId}
                          className={`badge ${split.paid ? 'badge-success' : 'badge-muted'}`}
                          style={{ cursor: isPayer && !split.paid && split.userId !== user?.id ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (isPayer && !split.paid && split.userId !== user?.id) {
                              handleSettle(expense.id, split.userId);
                            }
                          }}
                          title={isPayer && !split.paid ? 'Click to mark as settled' : ''}
                        >
                          {split.user?.name || 'Unknown'}
                          {split.paid ? ' ✓' : ` ${formatCurrency(split.amount)}`}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {members.map((member) => (
            <div key={member.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="user-avatar" style={{ width: 42, height: 42, fontSize: '1rem' }}>
                {getInitials(member.user?.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {member.user?.name}
                  {member.userId === user?.id && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (you)</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{member.user?.email}</div>
              </div>
              <span className={`badge ${member.role === 'admin' ? 'badge-accent' : 'badge-muted'}`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {memberBalances.map((member) => (
            <div key={member.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="user-avatar" style={{ width: 42, height: 42, fontSize: '1rem' }}>
                {getInitials(member.user?.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {member.user?.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {member.balance > 0 ? 'Gets back' : member.balance < 0 ? 'Owes' : 'Settled up'}
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: member.balance > 0 ? 'var(--success)' : member.balance < 0 ? 'var(--danger)' : 'var(--text-muted)'
              }}>
                {member.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(member.balance))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onAdded={handleExpenseAdded}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          groupId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={(member) => {
            setGroup((prev) => ({ ...prev, members: [...prev.members, member] }));
            setShowAddMember(false);
            toast.success('Member added!');
          }}
        />
      )}
    </div>
  );
}
