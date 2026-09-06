import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAlertStore } from '../../store/alertStore';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import {
  ListChecks, CheckCircle, Clock, XCircle,
  TrendingUp, Users, AlertTriangle, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface PairVolume {
  pair: string;
  transactions: number;
  totalSent: number;
  currency: string;
  totalNGN: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalVolumeNGN: 0,
    activeStaff: 0,
  });
  const [pairVolumes, setPairVolumes] = useState<PairVolume[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingCount } = useAlertStore();

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('transactions-overview')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'transactions',
      }, () => fetchData())
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
      const completed = transactions.filter(t =>
        t.status === 'SETTLEMENT_COMPLETED' || t.status === 'CLOSED'
      ).length;
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
      setRecentTransactions(transactions.slice(0, 8));

      // Build currency pair volume breakdown
      const pairMap: Record<string, PairVolume> = {};
      transactions.forEach(t => {
        if (!t.currency_pair || !t.amount) return;
        const key = t.currency_pair;
        if (!pairMap[key]) {
          pairMap[key] = {
            pair: key.replace('_', ' → '),
            transactions: 0,
            totalSent: 0,
            currency: t.from_currency,
            totalNGN: 0,
          };
        }
        pairMap[key].transactions += 1;
        pairMap[key].totalSent += parseFloat(t.amount) || 0;
        pairMap[key].totalNGN += parseFloat(t.settlement_amount_ngn) || 0;
      });
      setPairVolumes(Object.values(pairMap).sort((a, b) => b.transactions - a.transactions));

      // Build weekly data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekCounts: Record<string, number> = {};
      days.forEach(d => { weekCounts[d] = 0; });
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      transactions
        .filter(t => new Date(t.created_at).getTime() > sevenDaysAgo)
        .forEach(t => {
          const day = days[new Date(t.created_at).getDay()];
          weekCounts[day] = (weekCounts[day] || 0) + 1;
        });
      setWeeklyData(days.map(d => ({ day: d, count: weekCounts[d] })));
    }

    setLoading(false);
  }

  function formatNGN(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
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

  const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777', '#059669'];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse min-w-0">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Transactions"
          value={stats.total}
          subtitle="All time"
          icon={<ListChecks className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pending}
          subtitle="Awaiting staff action"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          subtitle="Successfully settled"
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          subtitle="Declined transactions"
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Total Settled (NGN)"
          value={formatNGN(stats.totalVolumeNGN)}
          subtitle="Total NGN paid out to recipients"
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
        />
        <StatsCard
          title="Active Staff"
          value={stats.activeStaff}
          subtitle="Team members"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-amber-800 font-semibold text-sm">
              {stats.pending} transaction{stats.pending > 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Please review and process pending transactions promptly.
            </p>
          </div>
        </div>
      )}

      {/* Currency pair volume breakdown */}
      {pairVolumes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent flex-shrink-0" />
            Volume by Currency Pair
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            {/* Table breakdown */}
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase py-2">Pair</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase py-2">Txns</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase py-2">Sent</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase py-2">Settled (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pairVolumes.map((pv, i) => (
                    <tr key={pv.pair} className="hover:bg-slate-50">
                      <td className="py-2.5 max-w-[100px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="font-medium text-slate-700 text-xs truncate">{pv.pair}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-xs text-slate-600 whitespace-nowrap">{pv.transactions}</td>
                      <td className="py-2.5 text-right text-xs font-mono text-slate-600 whitespace-nowrap">
                        {pv.totalSent.toLocaleString()} {pv.currency}
                      </td>
                      <td className="py-2.5 text-right text-xs font-bold text-green-600 whitespace-nowrap">
                        {formatNGN(pv.totalNGN)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td className="py-2.5 text-xs font-bold text-slate-700">Total</td>
                    <td className="py-2.5 text-right text-xs font-bold text-slate-700 whitespace-nowrap">
                      {pairVolumes.reduce((s, p) => s + p.transactions, 0)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-slate-400">—</td>
                    <td className="py-2.5 text-right text-xs font-bold text-green-600 whitespace-nowrap">
                      {formatNGN(pairVolumes.reduce((s, p) => s + p.totalNGN, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bar chart */}
            <div className="h-48 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pairVolumes} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="pair"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatNGN(typeof value === 'number' ? value : 0), 'Settled NGN']}
                    labelStyle={{ fontSize: 11, color: '#0f172a' }}
                    contentStyle={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="totalNGN" radius={[4, 4, 0, 0]}>
                    {pairVolumes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Weekly activity chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm flex-shrink-0">Weekly Activity</h3>
          <span className="text-xs text-slate-400 truncate">Transactions per day, last 7 days</span>
        </div>
        <div className="h-40 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [typeof value === 'number' ? value : 0, 'Transactions']}
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-slate-200 min-w-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Reference</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Pair</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 max-w-[120px]">
                      <span className="text-xs font-mono text-slate-600 truncate block">{tx.reference}</span>
                    </td>
                    <td className="px-5 py-3 max-w-[140px]">
                      <span className="text-sm text-slate-700 truncate block">{tx.kyc_name || tx.whatsapp_number}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600 whitespace-nowrap">{tx.currency_pair?.replace('_', ' → ')}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(tx.created_at)}</span>
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
