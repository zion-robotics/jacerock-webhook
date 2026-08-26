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
  teal: 'bg-teal-50 text-teal-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

const borderColorMap = {
  teal: 'border-l-teal-500',
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
};

export default function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
  const isUp = trend ? trend.value >= 0 : true;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderColorMap[color]} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${chipColorMap[color]}`}>
          {icon}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
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