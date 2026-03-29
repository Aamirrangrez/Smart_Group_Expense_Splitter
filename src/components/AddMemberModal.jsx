import { useState } from 'react';
import { groupApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AddMemberModal({ groupId, onClose, onAdded }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setError('Invalid email'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await groupApi.addMember(groupId, { email: email.trim() });
      onAdded(res.data.data.member);
      toast.success('Member added!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Add Member</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Member's Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            {error && <span className="form-error">⚠ {error}</span>}
            <span className="form-hint">The user must already have a SplitAI account.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Adding…</> : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
