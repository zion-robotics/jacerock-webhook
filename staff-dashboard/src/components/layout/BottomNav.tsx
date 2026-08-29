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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 safe-area-bottom">
      <div className="flex">
        {staffLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors relative
              ${isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-1" />
              {label === 'Queue' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
