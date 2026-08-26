import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAlertStore } from '../../store/alertStore';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import {
  ListChecks, CheckCircle, Clock, XCircle,
  TrendingUp, Users, AlertTriangle
} from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalVolumeNGN: 0,
    activeStaff: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingCount } = useAlertStore();

  useEffect(() => {
    fetchData();

    // Realtime subscription for new transactions
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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          title="Total Volume"
          value={formatNGN(stats.totalVolumeNGN)}
          subtitle="Settlement in NGN"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
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

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-slate-200">
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
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-slate-600">{tx.reference}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-700">{tx.kyc_name || tx.whatsapp_number}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{tx.currency_pair?.replace('_', ' → ')}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-slate-700">
                        {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
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
