import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { pendingCount } = useAlertStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  function handleBellClick() {
    navigate(isAdmin ? '/admin/transactions' : '/queue');
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-11 h-11 -ml-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={2.25} />
        </button>
        <h2 className="text-slate-800 font-semibold text-base md:text-lg">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleBellClick}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label={pendingCount > 0 ? `${pendingCount} pending notifications` : 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
