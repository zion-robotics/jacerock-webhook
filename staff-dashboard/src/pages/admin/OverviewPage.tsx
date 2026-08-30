import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAlertStore } from '../../store/alertStore';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import {
  ListChecks, CheckCircle, Clock, XCircle,
  TrendingUp, Users, AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalVolumeNGN: 0,
    activeStaff: 0,
  });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingCount } = useAlertStore();

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('transactions-overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: staff } = await supabase
      .from('staff_users')
      .select('id')
      .eq('is_active', true);

    if (transactions) {
      const pending = transactions.filter(t => t.status === 'AWAITING_STAFF_APPROVAL').length;
      const completed = transactions.filter(t => t.status === 'SETTLEMENT_COMPLETED' || t.status === 'CLOSED').length;
      const rejected = transactions.filter(t => t.status === 'REJECTED').length;
      const totalVolumeNGN = transactions
        .filter(t => t.settlement_amount_ngn)
        .reduce((sum, t) => sum + (parseFloat(t.settlement_amount_ngn) || 0), 0);

      setStats({
        total: transactions.length,
        pending,
        completed,
        rejected,
        totalVolumeNGN,
        activeStaff: staff?.length || 0,
      });

      setPendingCount(pending);
      setAllTransactions(transactions);
      setRecentTransactions(transactions.slice(0, 8));
    }

    setLoading(false);
  }

  function formatNGN(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const weeklyActivity = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    allTransactions.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= cutoff) counts[d.getDay()] += 1;
    });

    return labels.map((label, i) => ({ day: label, count: counts[i] }));
  }, [allTransactions]);

  const peakDayIndex = weeklyActivity.reduce(
    (maxIdx, cur, idx, arr) => (cur.count > arr[maxIdx].count ? idx : maxIdx), 0
  );

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <StatsCard
          title="Total Transactions"
          value={stats.total}
          subtitle="all time"
          icon={<ListChecks className="w-5 h-5" />}
          color="teal"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pending}
          subtitle="awaiting action"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          subtitle="settled"
          icon={<CheckCircle className="w-5 h-5" />}
          color="teal"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          subtitle="declined"
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Total Volume"
          value={formatNGN(stats.totalVolumeNGN)}
          subtitle="settlement NGN"
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Active Staff"
          value={stats.activeStaff}
          subtitle="team members"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-semibold text-sm">
              {stats.pending} transaction{stats.pending > 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Please review and process pending transactions promptly.
            </p>
          </div>
        </div>
      )}

      {/* Weekly activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Weekly Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Transactions per day, last 7 days</p>
          </div>
          {weeklyActivity[peakDayIndex]?.count > 0 && (
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Peak: {weeklyActivity[peakDayIndex].day}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyActivity} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: '#f0fdfa' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {weeklyActivity.map((_, index) => (
                <Cell
                  key={index}
                  fill={index === peakDayIndex ? '#0f766e' : '#a5d8d0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3">Reference</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3 hidden md:table-cell">Pair</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3 hidden md:table-cell">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3 hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-mono text-slate-600">{tx.reference}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-slate-700">{tx.kyc_name || tx.whatsapp_number}</span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{tx.currency_pair?.replace('_', ' → ')}</span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="text-sm font-medium text-slate-700">
                        {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{timeAgo(tx.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
