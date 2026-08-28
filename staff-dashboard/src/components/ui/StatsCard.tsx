import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'teal' | 'blue' | 'green' | 'amber' | 'red';
  trend?: { value: number; label?: string };
}

// Only genuinely alarming states get a colored chip: red (rejected/failed),
// amber (needs action). Everything else is neutral, since it's just data,
// not something that needs to compete for attention.
const alertColors: Record<string, boolean> = { red: true, amber: true };

const chipColorMap = {
  teal: 'bg-slate-100 text-slate-500',
  blue: 'bg-slate-100 text-slate-500',
  green: 'bg-slate-100 text-slate-500',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

export default function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
  const isUp = trend ? trend.value >= 0 : true;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${chipColorMap[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight mt-3">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-teal-600' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
