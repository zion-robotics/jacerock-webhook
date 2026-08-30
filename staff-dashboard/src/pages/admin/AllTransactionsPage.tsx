import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import { Search, Filter, RefreshCw } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, name or number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-2 min-w-0 sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchTransactions}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Reference</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Pair</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden lg:table-cell">Time</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map(tx => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/queue/transaction/${tx.id}`)}
                    >
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-slate-600">{tx.reference}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{tx.kyc_name || '—'}</p>
                          <p className="text-xs text-slate-400">{tx.whatsapp_number}</p>
                        </div>
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
                      <td className="px-5 py-3">
                        <button className="text-xs text-accent font-medium hover:underline">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
