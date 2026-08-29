import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/transactions': 'All Transactions',
  '/admin/staff': 'Staff Management',
  '/admin/logs': 'Activity Logs',
  '/admin/rates': 'Exchange Rates',
  '/admin/banks': 'Bank Accounts',
  '/admin/history': 'Transaction History',
  '/admin/settings': 'Settings',
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/admin/history/')) return 'Transaction Detail';
  if (pathname.startsWith('/admin/transaction')) return 'Transaction Detail';
  return 'Dashboard';
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
