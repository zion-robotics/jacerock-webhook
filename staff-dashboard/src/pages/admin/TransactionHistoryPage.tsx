import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction } from '../../types';
import { Search, Filter, Download, Eye } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Transaction History</h3>
          <p className="text-sm text-slate-500 mt-0.5 break-words">
            {completedCount} completed · {formatNGN(totalVolume)} total volume
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 bg-white"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, name, number or account..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No completed transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Reference</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Pair</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase px-5 py-3 hidden md:table-cell">Amount</th>
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
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-sm font-bold text-green-600">
                        {tx.settlement_amount_ngn ? formatNGN(parseFloat(String(tx.settlement_amount_ngn))) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="flex items-center gap-1 text-xs text-accent font-medium hover:underline">
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
