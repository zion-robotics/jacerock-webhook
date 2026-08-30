import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction, AuditLog } from '../../types';
import {
  ArrowLeft, User, Phone, CreditCard,
  CheckCircle, XCircle, Download, ZoomIn,
  Clock, Shield
} from 'lucide-react';

export default function CompletedTransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const basePath = user?.role === 'ADMIN' ? '/admin/history' : '/queue/history';
  const [tx, setTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptZoomed, setReceiptZoomed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: true });

      if (txData) setTx(txData);
      if (logsData) setLogs(logsData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  function formatNGN(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-4xl">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Transaction not found</p>
        <button onClick={() => navigate(basePath)} className="text-accent text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const isCompleted = tx.status === 'SETTLEMENT_COMPLETED' || tx.status === 'CLOSED';
  const isRejected = tx.status === 'REJECTED' || tx.status === 'CANCELLED';

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>
        <StatusBadge status={tx.status} />
      </div>

      {/* Status banner */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-semibold text-sm">Transaction Completed Successfully</p>
            {tx.completed_at && (
              <p className="text-green-600 text-xs mt-0.5">
                Completed on {new Date(tx.completed_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-semibold text-sm">Transaction {tx.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}</p>
            {tx.rejection_reason && (
              <p className="text-red-600 text-xs mt-0.5">Reason: {tx.rejection_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Transaction Reference</p>
        <p className="font-mono text-lg font-bold text-slate-800">{tx.reference}</p>
        <p className="text-xs text-slate-400 mt-1">
          Created {new Date(tx.created_at).toLocaleString()}
        </p>
        {tx.staff_reviewer && (
          <p className="text-xs text-slate-400 mt-0.5">
            Reviewed by: <span className="font-medium text-slate-600">{tx.staff_reviewer}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            Customer Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">KYC Name</span>
              <span className="font-medium text-slate-800">{tx.kyc_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">WhatsApp</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {tx.whatsapp_number}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            Transaction Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Currency Pair</span>
              <span className="font-medium text-slate-800">{tx.currency_pair?.replace('_', ' → ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-medium text-slate-800">
                {tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exchange Rate</span>
              <span className="font-medium text-slate-800">{tx.exchange_rate || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Settlement (NGN)</span>
              <span className="font-bold text-green-600">
                {tx.settlement_amount_ngn ? formatNGN(parseFloat(String(tx.settlement_amount_ngn))) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-medium text-slate-800">{tx.payment_method?.replace(/_/g, ' ') || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          Payment Receipt
          <span className="text-xs text-slate-400 font-normal">Stored securely for audit purposes</span>
        </h3>

        {tx.receipt_url ? (
          <div className="space-y-3">
            {receiptZoomed && (
              <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setReceiptZoomed(false)}
              >
                <img
                  src={tx.receipt_url}
                  alt="Payment receipt"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            )}
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 max-h-72">
              <img
                src={tx.receipt_url}
                alt="Payment receipt"
                className="w-full object-contain max-h-72 cursor-pointer"
                onClick={() => setReceiptZoomed(true)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReceiptZoomed(true)}
                className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <ZoomIn className="w-3 h-3" />
                Zoom In
              </button>
              <a
                href={tx.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-400 text-sm">
            No receipt on file for this transaction
          </div>
        )}
      </div>

      {/* Settlement Account */}
      {tx.settlement_account_name && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Settlement Account Details</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{tx.settlement_account_name}</p>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Full Audit Trail
          </h3>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-slate-700">{log.action.replace(/_/g, ' ')}</span>
                  {log.notes && <span className="text-slate-500"> — {log.notes}</span>}
                  <div className="text-slate-400 mt-0.5">
                    {log.performed_by} · {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
