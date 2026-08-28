import { NavLink } from 'react-router-dom';
import { ListChecks, MessageSquare } from 'lucide-react';

const staffLinks = [
  { to: '/queue', icon: ListChecks, label: 'Queue', end: true },
  { to: '/queue/chat', icon: MessageSquare, label: 'Chat' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 safe-area-bottom">
      <div className="flex">
        {staffLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors
              ${isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <Icon className="w-5 h-5 mb-1" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
