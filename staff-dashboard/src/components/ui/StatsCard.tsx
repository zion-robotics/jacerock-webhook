import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'teal' | 'blue' | 'green' | 'amber' | 'red';
  trend?: { value: number; label?: string };
}

const iconColorMap = {
  teal: 'text-teal-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
};

export default function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
  const isUp = trend ? trend.value >= 0 : true;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <span className={iconColorMap[color]}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
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