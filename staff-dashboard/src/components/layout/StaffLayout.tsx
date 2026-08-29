import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const pageTitles: Record<string, string> = {
  '/queue': 'Transaction Queue',
  '/queue/chat': 'Live Chat',
  '/queue/history': 'Transaction History',
  '/queue/activity': 'My Activity',
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/queue/history/')) return 'Transaction Detail';
  if (pathname.startsWith('/queue/transaction')) return 'Transaction Detail';
  return 'Dashboard';
}

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
