import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/groups', label: 'Groups', icon: '◈' },
  { to: '/insights', label: 'Insights', icon: '◉' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="brand-logo">
          <div className="brand-icon">✦</div>
          <span className="brand-name">Split<span>AI</span></span>
        </div>
      </header>

      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">✦</div>
            <span className="brand-name">Split<span>AI</span></span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Navigation</span>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}

          <span className="nav-section-label" style={{ marginTop: 'var(--space-4)' }}>Status</span>
          <div className="realtime-badge" style={{ padding: 'var(--space-2) var(--space-4)' }}>
            <span className={`realtime-dot ${connected ? '' : 'disconnected'}`}
              style={{ background: connected ? 'var(--success)' : 'var(--danger)' }}
            />
            {connected ? 'Live updates on' : 'Reconnecting…'}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
