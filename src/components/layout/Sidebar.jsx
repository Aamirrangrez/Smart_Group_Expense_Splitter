import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '⬡' },
  { label: 'Groups', path: '/groups', icon: '◈' },
  { label: 'Insights', path: '/insights', icon: '◎' },
];

const getInitials = (name) =>
  name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">Split<span>AI</span></div>
        <div className="sidebar-logo-tagline">Smart Expense Splitter</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Status</div>
        <div style={{ padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: connected ? 'var(--success)' : 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }}></span>
            {connected ? 'Live sync on' : 'Connecting...'}
          </div>
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar avatar-sm">{getInitials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="btn-ghost btn-icon btn" onClick={handleLogout} title="Logout" style={{ fontSize: '1rem', flexShrink: 0 }}>⎋</button>
        </div>
      </div>
    </aside>
  );
}
