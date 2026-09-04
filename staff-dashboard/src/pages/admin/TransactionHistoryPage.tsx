import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import { Search, Filter, Download, ChevronRight } from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Completed', value: 'completed' },
  { label: 'Settlement Completed', value: 'SETTLEMENT_COMPLETED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const basePath = user?.role === 'ADMIN' ? '/admin/history' : '/queue/history';

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let result = [...transactions];

    if (statusFilter === 'completed') {
      result = result.filter(t =>
        ['SETTLEMENT_COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(t.status)
      );
    } else if (statusFilter) {
      result = result.filter(t => t.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.reference?.toLowerCase().includes(q) ||
        t.kyc_name?.toLowerCase().includes(q) ||
        t.whatsapp_number?.includes(q) ||
        t.settlement_account_name?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [transactions, search, statusFilter]);

  async function fetchHistory() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .in('status', ['SETTLEMENT_COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED', 'PAYMENT_FAILED'])
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  }

  function exportCSV() {
    const headers = ['Reference', 'Customer', 'WhatsApp', 'Pair', 'Amount', 'Settlement NGN', 'Status', 'Date'];
    const rows = filtered.map(t => [
      t.reference,
      t.kyc_name || '',
      t.whatsapp_number,
      t.currency_pair?.replace('_', ' → ') || '',
      t.amount ? `${t.amount} ${t.from_currency}` : '',
      t.settlement_amount_ngn ? `NGN ${t.settlement_amount_ngn}` : '',
      t.status,
      new Date(t.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function formatNGN(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const completedCount = transactions.filter(t => t.status === 'SETTLEMENT_COMPLETED').length;
  const totalVolume = transactions
    .filter(t => t.status === 'SETTLEMENT_COMPLETED' && t.settlement_amount_ngn)
    .reduce((sum, t) => sum + parseFloat(String(t.settlement_amount_ngn)), 0);

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Transaction History</h3>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {completedCount} completed · {formatNGN(totalVolume)} total volume
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 bg-white flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, name, number or account..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="relative min-w-0">
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
        </div>
      </div>

      {/* Count header */}
      <div className="px-1">
        <h3 className="font-semibold text-slate-800 text-sm">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </h3>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm animate-pulse">
          Loading history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No completed transactions found
        </div>
      ) : (
        <>
          {/* Mobile card stack — below md */}
          <div className="space-y-3 md:hidden">
            {filtered.map(tx => (
              <button
                key={tx.id}
                onClick={() => navigate(`${basePath}/${tx.id}`)}
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
                    <p className="text-sm font-bold text-green-600 truncate">
                      {tx.settlement_amount_ngn ? formatNGN(parseFloat(String(tx.settlement_amount_ngn))) : '—'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'} · {tx.currency_pair?.replace('_', ' → ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={tx.status} />
                    <span className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
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
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden lg:table-cell">Settlement</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden lg:table-cell">Date</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(tx => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`${basePath}/${tx.id}`)}
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
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                          {tx.settlement_amount_ngn ? formatNGN(parseFloat(String(tx.settlement_amount_ngn))) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
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
