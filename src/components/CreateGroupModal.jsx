import { useState } from 'react';
import { groupApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export default function CreateGroupModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', currency: 'INR', memberEmails: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Group name is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Parse emails
    const memberEmails = form.memberEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e && /\S+@\S+\.\S+/.test(e));

    setLoading(true);
    try {
      const res = await groupApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        currency: form.currency,
        memberEmails,
      });
      onCreated(res.data.data.group);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Create Group</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Goa Trip 2025"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            {errors.name && <span className="form-error">⚠ {errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="What's this group for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Currency</label>
            <select
              className="form-select"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Invite Members (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Enter email addresses, one per line or comma-separated&#10;rahul@example.com&#10;priya@example.com"
              value={form.memberEmails}
              onChange={(e) => setForm({ ...form, memberEmails: e.target.value })}
              rows={3}
            />
            <span className="form-hint">
              Only registered users will be added. You can also add members later.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating…</> : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
