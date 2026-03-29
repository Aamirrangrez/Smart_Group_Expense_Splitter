import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

const SkeletonGroupCard = () => (
  <div className="group-card" style={{ pointerEvents: 'none' }}>
    <div className="group-card-header">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10 }} />
      <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 20 }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
      <div className="skeleton" style={{ height: '0.75rem', width: '80%' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', marginLeft: -8 }} />
      <div className="skeleton" style={{ height: '0.75rem', width: '40%', marginLeft: 4 }} />
    </div>
  </div>
);

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', currency: 'INR', memberEmails: [] });
  const [emailInput, setEmailInput] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.data.groups);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || form.memberEmails.includes(email) || email === user?.email) return;
    setForm(f => ({ ...f, memberEmails: [...f.memberEmails, email] }));
    setEmailInput('');
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/groups', form);
      setGroups(prev => [data.data.group, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', currency: 'INR', memberEmails: [] });
      toast.success('Group created!');
      navigate(`/groups/${data.data.group.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally { setCreating(false); }
  };

  const GROUP_ICONS = ['🏠', '✈️', '🎉', '🍽️', '🏖️', '🎓', '💼', '🚗'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${groups.length} group${groups.length !== 1 ? 's' : ''} · split expenses together`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Group</button>
      </div>

      {loading ? (
        <div className="groups-grid">
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No groups yet</div>
          <div className="empty-desc">Create a group to start splitting expenses with friends and family</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first group</button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group, idx) => (
            <div key={group.id} className="group-card" onClick={() => navigate(`/groups/${group.id}`)}>
              <div className="group-card-header">
                <div className="group-icon">{GROUP_ICONS[idx % GROUP_ICONS.length]}</div>
                <span className="badge badge-accent">{group._count?.expenses || 0} expenses</span>
              </div>
              <div>
                <div className="group-name">{group.name}</div>
                {group.description && <div className="group-desc">{group.description}</div>}
              </div>
              <div className="group-members-row">
                <div className="member-avatars">
                  {group.members.slice(0, 4).map(m => (
                    <div key={m.id} className="avatar avatar-sm" title={m.user.name}>
                      {getInitials(m.user.name)}
                    </div>
                  ))}
                </div>
                <span className="group-meta-text">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  {group.members.length > 4 ? ` · +${group.members.length - 4} more` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create New Group</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Group Name *</label>
                <input className="form-input" placeholder="e.g., Goa Trip 2025" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="What's this group for?" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-input form-select" value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Add Members by Email</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" placeholder="friend@example.com" value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addEmail()} />
                  <button className="btn btn-secondary" onClick={addEmail}>Add</button>
                </div>
                <div className="form-hint">Members must already have a SplitAI account</div>
                {form.memberEmails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {form.memberEmails.map(email => (
                      <div key={email} className="member-tag">
                        <div className="avatar avatar-sm">{email[0].toUpperCase()}</div>
                        {email}
                        <button className="member-tag-remove"
                          onClick={() => setForm(f => ({ ...f, memberEmails: f.memberEmails.filter(e => e !== email) }))}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? <><span className="spinner"></span> Creating...</> : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}