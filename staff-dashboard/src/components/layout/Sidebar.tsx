import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Users, Activity,
  TrendingUp, Landmark, LogOut, X, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/transactions', icon: ListChecks, label: 'Transactions' },
  { to: '/admin/staff', icon: Users, label: 'Staff Management' },
  { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
  { to: '/admin/rates', icon: TrendingUp, label: 'Exchange Rates' },
  { to: '/admin/banks', icon: Landmark, label: 'Bank Accounts' },
];

const staffLinks = [
  { to: '/queue', icon: ListChecks, label: 'Transaction Queue', end: true },
  { to: '/queue/chat', icon: MessageSquare, label: 'Live Chat' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const links = isAdmin ? adminLinks : staffLinks;

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  }

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-primary z-30 flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Jacerock</h1>
            <p className="text-slate-400 text-xs">AfrikBerry Dashboard</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3">
          <span className={`
            text-xs font-semibold px-2 py-1 rounded-full
            ${isAdmin ? 'bg-accent text-white' : 'bg-slate-700 text-slate-300'}
          `}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-accent text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
