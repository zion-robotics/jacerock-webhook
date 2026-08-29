import { NavLink } from 'react-router-dom';
import { ListChecks, MessageSquare, History } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

const staffLinks = [
  { to: '/queue', icon: ListChecks, label: 'Queue', end: true },
  { to: '/queue/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/queue/history', icon: History, label: 'History', end: true },
];

export default function BottomNav() {
  const { pendingCount } = useAlertStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] z-20 safe-area-bottom">
      <div className="grid grid-cols-3">
        {staffLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative rounded-t-xl
              ${isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <div className="relative">
              <Icon className="w-4 h-4" />
              {label === 'Queue' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
