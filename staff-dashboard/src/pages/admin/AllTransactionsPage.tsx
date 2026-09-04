import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import { Search, Filter, RefreshCw, ChevronRight } from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'AWAITING_STAFF_APPROVAL' },
  { label: 'Completed', value: 'SETTLEMENT_COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('all-transactions')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'transactions',
      }, () => fetchTransactions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let result = [...transactions];
    if (statusFilter) result = result.filter(t => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.reference?.toLowerCase().includes(q) ||
        t.kyc_name?.toLowerCase().includes(q) ||
        t.whatsapp_number?.includes(q)
      );
    }
    setFiltered(result);
  }, [transactions, search, statusFilter]);

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
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
    <div className="space-y-4 min-w-0">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by reference, name or number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent appearance-none bg-white"
              >
                {STATUS_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchTransactions}
              className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Count header */}
      <div className="px-1 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </h3>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm animate-pulse">
          Loading transactions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No transactions found
        </div>
      ) : (
        <>
          {/* Mobile card stack — below md */}
          <div className="space-y-3 md:hidden">
            {filtered.map(tx => (
              <button
                key={tx.id}
                onClick={() => navigate(`/queue/transaction/${tx.id}`)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 transition-colors min-w-0"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-slate-500 truncate">{tx.reference}</p>
                    <p className="font-medium text-slate-800 text-sm mt-1 truncate">{tx.kyc_name || '—'}</p>
                    <p className="text-xs text-slate-400 truncate">{tx.whatsapp_number}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{tx.currency_pair?.replace('_', ' → ')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={tx.status} />
                    <span className="text-xs text-slate-400">{timeAgo(tx.created_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Table — md and up */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Reference</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Customer</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Pair</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden lg:table-cell">Time</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(tx => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/queue/transaction/${tx.id}`)}
                    >
                      <td className="px-5 py-3 max-w-[140px]">
                        <span className="text-xs font-mono text-slate-600 truncate block">{tx.reference}</span>
                      </td>
                      <td className="px-5 py-3 max-w-[180px]">
                        <p className="text-sm font-medium text-slate-700 truncate">{tx.kyc_name || '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{tx.whatsapp_number}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-slate-600 whitespace-nowrap">{tx.currency_pair?.replace('_', ' → ')}</span>
                      </td>
                      <td className="px-5 py-3">
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
                      <td className="px-5 py-3">
                        <button className="text-xs text-accent font-medium hover:underline whitespace-nowrap">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
