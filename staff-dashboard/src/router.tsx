import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import SetupPage from './pages/auth/SetupPage';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import OverviewPage from './pages/admin/OverviewPage';

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

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<div className="text-slate-500 text-sm p-4">Transactions page coming next</div>} />
          <Route path="staff" element={<div className="text-slate-500 text-sm p-4">Staff management coming next</div>} />
          <Route path="logs" element={<div className="text-slate-500 text-sm p-4">Activity logs coming next</div>} />
          <Route path="rates" element={<div className="text-slate-500 text-sm p-4">Exchange rates coming next</div>} />
          <Route path="banks" element={<div className="text-slate-500 text-sm p-4">Bank accounts coming next</div>} />
        </Route>

        {/* Staff Routes */}
        <Route path="/queue" element={
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route index element={<div className="text-slate-500 text-sm p-4">Transaction queue coming next</div>} />
          <Route path="chat" element={<div className="text-slate-500 text-sm p-4">Live chat coming next</div>} />
          <Route path="transaction/:id" element={<div className="text-slate-500 text-sm p-4">Transaction detail coming next</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function Router() {
  return <AppRoutes />;
}
