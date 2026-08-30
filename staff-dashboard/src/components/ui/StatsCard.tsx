import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'teal' | 'blue' | 'green' | 'amber' | 'red';
  trend?: { value: number; label?: string };
}

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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide min-w-0 truncate">{title}</p>
        <span className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${chipColorMap[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-lg sm:text-xl md:text-3xl font-bold text-slate-900 tracking-tight mt-3 break-words leading-tight">{value}</p>
      <div className="flex items-center gap-1.5 mt-2 min-w-0 flex-wrap">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ${isUp ? 'text-teal-600' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 break-words">{subtitle}</p>}
      </div>
    </div>
  );
}
