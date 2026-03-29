import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import InsightsPage from './pages/InsightsPage';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Loading SplitAI…
    </p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="groups/:id" element={<GroupDetailPage />} />
                <Route path="insights" element={<InsightsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}