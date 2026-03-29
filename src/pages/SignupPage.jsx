import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success('Account created! Welcome to SplitAI');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-bg-orb auth-bg-orb-1"></div>
      <div className="auth-bg-orb auth-bg-orb-2"></div>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✨</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start splitting expenses the smart way</p>
        </div>

        {[
          { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Rahul Sharma' },
          { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
        ].map(field => (
          <div className="form-group" key={field.key}>
            <label className="form-label">{field.label}</label>
            <input
              className="form-input"
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {errors[field.key] && <span className="form-error">{errors[field.key]}</span>}
          </div>
        ))}

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? <><span className="spinner"></span> Creating account...</> : 'Create Account'}
        </button>

        <div className="auth-switch">
          Already have an account?{' '}
          <span className="auth-switch-link" onClick={() => navigate('/login')}>Sign in</span>
        </div>
      </div>
    </div>
  );
}
