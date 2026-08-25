import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function Router() {
  const { user } = useAuthStore();

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
          <ProtectedRoute role="ADMIN">
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-slate-500">Admin dashboard coming soon</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/queue/*" element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-slate-500">Staff queue coming soon</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
