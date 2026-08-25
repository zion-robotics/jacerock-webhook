import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import SetupPage from './pages/auth/SetupPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/queue" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuthStore();
  const { loading, setupRequired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-white text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (setupRequired) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SetupPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          !user
            ? <Navigate to="/login" replace />
            : user.role === 'ADMIN'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/queue" replace />
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly>
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <p className="text-slate-500 text-sm">Admin dashboard — coming next</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/queue/*" element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <p className="text-slate-500 text-sm">Staff queue — coming next</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function Router() {
  return <AppRoutes />;
}
