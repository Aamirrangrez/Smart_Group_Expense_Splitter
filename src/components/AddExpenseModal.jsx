import { useState, useEffect } from 'react';
import { expenseApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVoice } from '../hooks/useVoice';
import { formatCurrency, getCategoryIcon } from '../utils/helpers';

const CATEGORIES = ['general', 'food', 'transport', 'entertainment', 'utilities', 'shopping', 'health', 'travel'];

export default function AddExpenseModal({ group, onClose, onAdded }) {
  const { user } = useAuth();
  const toast = useToast();
  const { isRecording, transcript, supported, startRecording, stopRecording, setTranscript } = useVoice();

  const [mode, setMode] = useState('manual'); // 'manual' | 'voice'
  const [aiParsing, setAiParsing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null); // null | object

  const members = group?.members || [];

  // Check Ollama status when user switches to voice tab
  useEffect(() => {
    if (mode === 'voice' && ollamaStatus === null) {
      aiApi.getStatus()
        .then((res) => setOllamaStatus(res.data.data))
        .catch(() => setOllamaStatus({ ollamaRunning: false, hint: 'Could not reach Ollama. Run: ollama serve' }));
    }
  }, [mode]);

  // Form state
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'general',
    description: '',
    splitBetween: members.map((m) => m.userId), // default: split all
  });
  const [errors, setErrors] = useState({});

  const handleParseAI = async () => {
    if (!transcript.trim()) return;
    setAiParsing(true);
    setAiResult(null);

    try {
      const res = await aiApi.parseExpense({
        text: transcript,
        groupMembers: members.map((m) => ({ id: m.userId, name: m.user?.name, email: m.user?.email })),
      });

      const parsed = res.data.data.parsed;
      setAiResult(parsed);

      // Auto-fill form
      setForm((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        amount: parsed.amount ? String(parsed.amount) : prev.amount,
        category: parsed.category || prev.category,
        description: parsed.description || prev.description,
        splitBetween: resolveSplitBetween(parsed.splitBetween, members, user),
      }));

      toast.success('AI parsed your expense!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI parsing failed');
    } finally {
      setAiParsing(false);
    }
  };

  // Convert AI name array → userId array
  const resolveSplitBetween = (names, members, currentUser) => {
    if (!names || names.length === 0) return members.map((m) => m.userId);
    const result = [];
    names.forEach((name) => {
      const lName = name.toLowerCase();
      if (lName === 'me' || lName === currentUser?.name?.toLowerCase()) {
        result.push(currentUser.id);
      } else {
        const match = members.find((m) =>
          m.user?.name?.toLowerCase().includes(lName) ||
          m.user?.email?.toLowerCase().includes(lName)
        );
        if (match) result.push(match.userId);
      }
    });
    // Always include payer
    if (!result.includes(currentUser.id)) result.unshift(currentUser.id);
    return result.length > 0 ? result : members.map((m) => m.userId);
  };

  const toggleMember = (userId) => {
    setForm((prev) => {
      const has = prev.splitBetween.includes(userId);
      if (has && prev.splitBetween.length === 1) return prev; // keep at least 1
      return {
        ...prev,
        splitBetween: has
          ? prev.splitBetween.filter((id) => id !== userId)
          : [...prev.splitBetween, userId],
      };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = 'Valid amount required';
    if (form.splitBetween.length === 0) errs.split = 'Select at least one person';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await expenseApi.create({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        groupId: group.id,
        splitBetween: form.splitBetween,
        splitType: 'equal',
      });
      onAdded(res.data.data.expense);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const splitAmount = form.splitBetween.length > 0 && form.amount
    ? (Number(form.amount) / form.splitBetween.length).toFixed(2)
    : 0;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Expense</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Mode toggle */}
          <div className="tabs">
            <button className={`tab ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
              ✎ Manual
            </button>
            <button className={`tab ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')}>
              🎤 Voice + AI
            </button>
          </div>

          {/* Voice Mode */}
          {mode === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

              {/* ── Ollama Status Banner ── */}
              {ollamaStatus === null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span className="spinner" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Checking Ollama status…</span>
                </div>
              ) : ollamaStatus.ollamaRunning ? (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--success-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                    ✦ Ollama running — model: <code style={{ background: 'rgba(52,211,153,0.15)', padding: '1px 6px', borderRadius: 4 }}>{ollamaStatus.activeModel}</code>
                    {!ollamaStatus.modelPulled && (
                      <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠ not pulled yet</span>
                    )}
                  </div>
                  {!ollamaStatus.modelPulled && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Run: <code style={{ color: 'var(--accent-light)' }}>ollama pull {ollamaStatus.activeModel}</code>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Ollama is not running</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Start it: <code style={{ color: 'var(--accent-light)' }}>ollama serve</code>
                    &nbsp;then pull: <code style={{ color: 'var(--accent-light)' }}>ollama pull llama3</code>
                  </div>
                </div>
              )}

              {!supported && (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>
                    ⚠ Voice input not supported in this browser. Use Chrome or Edge.
                  </span>
                </div>
              )}
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <button
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  style={{ width: 72, height: 72, fontSize: '1.8rem', margin: '0 auto var(--space-3)', display: 'flex' }}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!supported}
                >
                  {isRecording ? '⏹' : '🎤'}
                </button>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {isRecording ? 'Listening… speak now' : 'Tap to start speaking'}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Transcript / Edit</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="e.g. I paid 200 for petrol with Rahul and Priya"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={2}
                />
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleParseAI}
                disabled={!transcript.trim() || aiParsing}
              >
                {aiParsing ? <><span className="spinner" /> Parsing with AI…</> : '✦ Parse with AI'}
              </button>

              {aiResult && (
                <div className="ai-result-preview">
                  <span className="ai-label">✦ AI Parsed Result</span>
                  <div className="ai-chips">
                    {aiResult.title && <span className="ai-chip"><strong>Title:</strong> {aiResult.title}</span>}
                    {aiResult.amount && <span className="ai-chip"><strong>Amount:</strong> ₹{aiResult.amount}</span>}
                    {aiResult.category && <span className="ai-chip"><strong>Category:</strong> {getCategoryIcon(aiResult.category)} {aiResult.category}</span>}
                    {aiResult.splitBetween?.length > 0 && (
                      <span className="ai-chip"><strong>Split:</strong> {aiResult.splitBetween.join(', ')}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-light)' }}>
                    Form auto-filled below ↓ review and submit
                  </p>
                </div>
              )}

              <div className="divider" />
            </div>
          )}

          {/* Form (always visible) */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dinner at Swiggy"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <span className="form-error">⚠ {errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount ({group?.currency || 'INR'})</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              {errors.amount && <span className="form-error">⚠ {errors.amount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Split Between</label>
            <div className="member-selector">
              {members.map((m) => {
                const selected = form.splitBetween.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    className={`member-toggle ${selected ? 'selected' : ''}`}
                    onClick={() => toggleMember(m.userId)}
                  >
                    <span className="member-toggle-avatar">
                      {m.user?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    {m.userId === user?.id ? 'You' : m.user?.name}
                  </button>
                );
              })}
            </div>
            {errors.split && <span className="form-error">⚠ {errors.split}</span>}
            {form.amount && form.splitBetween.length > 0 && (
              <span className="form-hint">
                Each person pays: <strong style={{ color: 'var(--accent-light)' }}>{formatCurrency(Number(splitAmount))}</strong> ({form.splitBetween.length} people)
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Add a note…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <><span className="spinner" /> Adding…</> : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
