import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Users, Activity,
  TrendingUp, Landmark, LogOut, X, MessageSquare,
  ChevronLeft, ChevronRight, Shield, History
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/transactions', icon: ListChecks, label: 'Transactions' },
  { to: '/admin/staff', icon: Users, label: 'Staff Management' },
  { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
  { to: '/admin/rates', icon: TrendingUp, label: 'Exchange Rates' },
  { to: '/admin/banks', icon: Landmark, label: 'Bank Accounts' },
  { to: '/admin/history', icon: History, label: 'History' },
  { to: '/admin/settings', icon: Shield, label: 'Settings' },
];

const staffLinks = [
  { to: '/queue', icon: ListChecks, label: 'Transaction Queue', end: true },
  { to: '/queue/chat', icon: MessageSquare, label: 'Live Chat' },
  { to: '/queue/history', icon: History, label: 'History' },
];

export default function Sidebar({ open, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { pendingCount } = useAlertStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const links = isAdmin ? adminLinks : staffLinks;
  const widthClass = collapsed ? 'lg:w-20' : 'lg:w-64';

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 ${widthClass} bg-primary z-30 flex flex-col relative
        transform transition-all duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Floating collapse toggle, sits on the sidebar's own edge, desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex absolute top-7 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 z-40 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm mx-auto">
              J
            </div>
          ) : (
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Jacerock</h1>
              <p className="text-slate-400 text-xs">AfrikBerry Dashboard</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-6 py-3">
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-white">
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label, end }) => {
            const showBadge =
              (label === 'Transaction Queue' || label === 'Transactions') && pendingCount > 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                  ${collapsed ? 'justify-center px-2' : ''}
                  ${isActive
                    ? 'bg-accent text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="flex-1">{label}</span>}
                {showBadge && (
                  <span className={`bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                    collapsed ? 'absolute top-1 right-1 w-4 h-4 text-[10px]' : ''
                  }`}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            aria-label="Sign out"
            className={`flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  );
}
