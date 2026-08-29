import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import SetupPage from './pages/auth/SetupPage';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import OverviewPage from './pages/admin/OverviewPage';
import AllTransactionsPage from './pages/admin/AllTransactionsPage';
import QueuePage from './pages/staff/QueuePage';
import TransactionDetailPage from './pages/staff/TransactionDetailPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import ExchangeRatesPage from './pages/admin/ExchangeRatesPage';
import BankAccountsPage from './pages/admin/BankAccountsPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import ChatPage from './pages/staff/ChatPage';
import TransactionHistoryPage from './pages/admin/TransactionHistoryPage';
import CompletedTransactionPage from './pages/admin/CompletedTransactionPage';
import MyActivityPage from './pages/staff/MyActivityPage';
import HotAlert from './components/alerts/HotAlert';
import NotificationBanner from './components/alerts/NotificationBanner';

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
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<AllTransactionsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="logs" element={<ActivityLogsPage />} />
          <Route path="rates" element={<ExchangeRatesPage />} />
          <Route path="banks" element={<BankAccountsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="history" element={<TransactionHistoryPage />} />
          <Route path="history/:id" element={<CompletedTransactionPage />} />
        </Route>
        {/* Staff Routes */}
        <Route path="/queue" element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
          <Route index element={<QueuePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="transaction/:id" element={<TransactionDetailPage />} />
          <Route path="history" element={<TransactionHistoryPage />} />
          <Route path="history/:id" element={<CompletedTransactionPage />} />
          <Route path="activity" element={<MyActivityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && (
        <>
          <HotAlert />
          <NotificationBanner />
        </>
      )}
    </BrowserRouter>
  );
}

export default function Router() {
  return <AppRoutes />;
}
