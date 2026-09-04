import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { sendTemplate, pauseBot, resumeBot } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Transaction, AuditLog } from '../../types';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, MessageSquare,
  Download, ZoomIn, User, Phone, CreditCard, AlertTriangle,
  Send, Pause, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { value: 'payment_verified', label: 'Payment Verified' },
  { value: 'transaction_completed', label: 'Transaction Completed' },
  { value: 'payment_unverified', label: 'Payment Unverified' },
  { value: 'transaction_on_hold', label: 'Transaction On Hold' },
  { value: 'additional_info_required', label: 'Additional Info Required' },
];

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('payment_verified');
  const [receiptZoomed, setReceiptZoomed] = useState(false);
  const [botPaused, setBotPaused] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  async function fetchTransaction() {
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

    if (txData) {
      setTx(txData);
      const { data: session } = await supabase
        .from('conversation_sessions')
        .select('bot_paused')
        .eq('whatsapp_number', txData.whatsapp_number)
        .single();
      setBotPaused(session?.bot_paused || false);
    }

    if (logsData) setLogs(logsData);
    setLoading(false);
  }

  async function logAction(action: string, oldStatus: string, newStatus: string, notes = '') {
    await supabase.from('audit_logs').insert({
      transaction_id: id,
      customer_id: tx?.customer_id,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      performed_by: user?.full_name || 'STAFF',
      notes,
    });
  }

  async function handleApprove() {
    if (!tx) return;
    setActing(true);
    try {
      await supabase.from('transactions').update({
        status: 'PAYMENT_VERIFIED',
        staff_reviewer: user?.full_name,
        verified_at: new Date().toISOString(),
      }).eq('id', id);

      await logAction('PAYMENT_APPROVED', tx.status, 'PAYMENT_VERIFIED');
      await sendTemplate(tx.whatsapp_number, 'payment_verified', [tx.kyc_name, tx.reference]);
      toast.success('Payment approved and customer notified');
      fetchTransaction();
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setActing(false);
    }
  }

  async function handleComplete() {
    if (!tx) return;
    setActing(true);
    try {
      await supabase.from('transactions').update({
        status: 'SETTLEMENT_COMPLETED',
        completed_at: new Date().toISOString(),
      }).eq('id', id);

      await logAction('TRANSACTION_COMPLETED', tx.status, 'SETTLEMENT_COMPLETED');
      await sendTemplate(tx.whatsapp_number, 'transaction_completed', [
        tx.kyc_name, tx.reference,
        tx.currency_pair?.replace('_', ' → ') || '',
        `${tx.amount} ${tx.from_currency}`,
      ]);
      toast.success('Transaction completed and customer notified');
      fetchTransaction();
    } catch {
      toast.error('Failed to complete transaction');
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!tx || !rejectReason) return;
    setActing(true);
    try {
      await supabase.from('transactions').update({
        status: 'REJECTED',
        rejection_reason: rejectReason,
        staff_reviewer: user?.full_name,
      }).eq('id', id);

      await logAction('PAYMENT_REJECTED', tx.status, 'REJECTED', rejectReason);
      await sendTemplate(tx.whatsapp_number, 'payment_unverified', [tx.kyc_name, tx.reference]);
      toast.success('Transaction rejected and customer notified');
      setShowRejectModal(false);
      fetchTransaction();
    } catch {
      toast.error('Failed to reject transaction');
    } finally {
      setActing(false);
    }
  }

  async function handleHold() {
    if (!tx) return;
    setActing(true);
    try {
      await supabase.from('transactions').update({ status: 'UNDER_REVIEW' }).eq('id', id);
      await logAction('PLACED_ON_HOLD', tx.status, 'UNDER_REVIEW');
      await sendTemplate(tx.whatsapp_number, 'transaction_on_hold', [tx.kyc_name, tx.reference]);
      toast.success('Transaction placed on hold');
      fetchTransaction();
    } catch {
      toast.error('Failed to hold transaction');
    } finally {
      setActing(false);
    }
  }

  async function handleSendTemplate() {
    if (!tx) return;
    try {
      await sendTemplate(tx.whatsapp_number, selectedTemplate, [tx.kyc_name, tx.reference]);
      await logAction('TEMPLATE_SENT', tx.status, tx.status, `Template sent: ${selectedTemplate}`);
      toast.success('Template sent to customer');
    } catch {
      toast.error('Failed to send template');
    }
  }

  async function handleToggleBot() {
    if (!tx) return;
    try {
      if (botPaused) {
        await resumeBot(tx.whatsapp_number, user?.full_name || 'STAFF');
        setBotPaused(false);
        toast.success('AI bot resumed');
      } else {
        await pauseBot(tx.whatsapp_number, user?.full_name || 'STAFF');
        setBotPaused(true);
        toast.success('AI bot paused — you can now message the customer directly');
      }
    } catch {
      toast.error('Failed to toggle bot');
    }
  }

  function kycMatch() {
    if (!tx?.kyc_name) return null;
    return tx.settlement_account_name?.toLowerCase().includes(tx.kyc_name.toLowerCase().split(' ')[0]);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Transaction not found</p>
        <button onClick={() => navigate(-1)} className="text-accent text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl min-w-0">
      {/* Back + header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <StatusBadge status={tx.status} />
      </div>

      {/* Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Transaction Reference</p>
        <p className="font-mono text-lg font-bold text-slate-800 break-all">{tx.reference}</p>
        <p className="text-xs text-slate-400 mt-1">
          Created {new Date(tx.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-accent flex-shrink-0" />
            Customer Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">KYC Name</span>
              <span className="font-medium text-slate-800 truncate text-right">{tx.kyc_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">WhatsApp</span>
              <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{tx.whatsapp_number}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent flex-shrink-0" />
            Transaction Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Currency Pair</span>
              <span className="font-medium text-slate-800 truncate text-right">{tx.currency_pair?.replace('_', ' → ')}</span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Amount</span>
              <span className="font-medium text-slate-800 truncate text-right">{tx.amount ? `${tx.amount} ${tx.from_currency}` : '—'}</span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Rate</span>
              <span className="font-medium text-slate-800 truncate text-right">{tx.exchange_rate || '—'}</span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Settlement (NGN)</span>
              <span className="font-bold text-green-600 truncate text-right">
                {tx.settlement_amount_ngn
                  ? `₦${Number(tx.settlement_amount_ngn).toLocaleString()}`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Payment Method</span>
              <span className="font-medium text-slate-800 truncate text-right">{tx.payment_method?.replace('_', ' ') || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2 flex-wrap">
          Payment Receipt
          {tx.receipt_url ? (
            <span className="text-xs text-green-600 font-normal">✓ Uploaded</span>
          ) : (
            <span className="text-xs text-amber-600 font-normal">Not uploaded yet</span>
          )}
        </h3>
        {tx.receipt_url ? (
          <div className="space-y-3">
            {receiptZoomed && (
              <div
                className="fixed inset-4 z-50 bg-black flex items-center justify-center rounded-lg"
                onClick={() => setReceiptZoomed(false)}
              >
                <img
                  src={tx.receipt_url}
                  alt="Payment receipt"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <div
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 max-h-64 cursor-pointer"
              onClick={() => setReceiptZoomed(true)}
            >
              <img
                src={tx.receipt_url}
                alt="Payment receipt"
                className="w-full object-contain max-h-64"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReceiptZoomed(!receiptZoomed)}
                className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {receiptZoomed ? 'Close' : 'Zoom In'}
              </button>
              
                href={tx.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-400 text-sm">
            No receipt uploaded yet
          </div>
        )}
      </div>

      {/* Settlement Account */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Settlement Account (NGN)</h3>
        {tx.settlement_account_name ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 min-w-0">
              <span className="text-slate-500 flex-shrink-0">Account Details</span>
              <span className="font-medium text-slate-800 break-words sm:text-right">{tx.settlement_account_name}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {kycMatch() ? (
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  KYC name appears to match
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Verify KYC name against receipt manually
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Settlement details not provided yet</p>
        )}
      </div>

      {/* Action Buttons */}
      {(tx.status === 'AWAITING_STAFF_APPROVAL' || tx.status === 'PAYMENT_VERIFIED' || tx.status === 'UNDER_REVIEW') && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Actions</h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {tx.status === 'AWAITING_STAFF_APPROVAL' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Payment
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={handleHold}
                  disabled={acting}
                  className="flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  Hold
                </button>
              </>
            )}
            {tx.status === 'PAYMENT_VERIFIED' && (
              <button
                onClick={handleComplete}
                disabled={acting}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      )}

      {/* Send Template */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-accent flex-shrink-0" />
          Send Template to Customer
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {TEMPLATES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleSendTemplate}
            className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* Human Takeover */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
          Conversation Control
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {botPaused
            ? 'AI bot is paused. You can message the customer directly from the Live Chat page.'
            : 'AI bot is handling this conversation. Pause it to take over manually.'}
        </p>
        <button
          onClick={handleToggleBot}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto ${
            botPaused
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-slate-800 text-white hover:bg-slate-900'
          }`}
        >
          {botPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {botPaused ? 'Resume AI Bot' : 'Take Over Conversation'}
        </button>
      </div>

      {/* Audit Trail */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Audit Trail</h3>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 text-xs min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-700 break-words">{log.action.replace(/_/g, ' ')}</span>
                  {log.notes && <span className="text-slate-500 break-words"> — {log.notes}</span>}
                  <div className="text-slate-400 mt-0.5 truncate">
                    {log.performed_by} · {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Reject Transaction</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejection. The customer will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Payment receipt name does not match KYC name"
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || acting}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
