import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAlertStore } from '../../store/alertStore';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { setPendingCount, setLatestAlert } = useAlertStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('staff-queue')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: 'status=eq.AWAITING_STAFF_APPROVAL',
      }, (payload) => {
        const newTx = payload.new as Transaction;
        setLatestAlert(newTx);
        toast.custom(() => (
          <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">New Transaction Ready</p>
              <p className="text-xs opacity-90">{newTx.reference} — {newTx.kyc_name}</p>
            </div>
          </div>
        ), { duration: 6000 });
        fetchQueue();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions',
      }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchQueue() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'AWAITING_STAFF_APPROVAL')
      .order('created_at', { ascending: true });

    if (data) {
      setTransactions(data);
      setPendingCount(data.length);
    }
    setLoading(false);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Pending Transactions</h3>
          <p className="text-sm text-slate-500 mt-0.5 break-words">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-20 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No pending transactions</p>
          <p className="text-slate-400 text-sm mt-1">New transactions will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div
              key={tx.id}
              onClick={() => navigate(`/queue/transaction/${tx.id}`)}
              className="bg-white rounded-xl border-2 border-amber-200 p-4 cursor-pointer hover:border-accent hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-xs font-mono text-slate-500">{tx.reference}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{tx.kyc_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tx.whatsapp_number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">
                    {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">{tx.currency_pair?.replace('_', ' → ')}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(tx.created_at)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {tx.payment_method?.replace('_', ' ') || '—'}
                </span>
                <span className="text-xs text-accent font-semibold">
                  Tap to review →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
