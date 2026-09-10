import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';
import { sendHotNotification, playAlertSound } from '../../services/notifications';
import type { Transaction } from '../../types';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function HotAlert() {
  const { user } = useAuthStore();
  const { setPendingCount } = useAlertStore();
  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new transactions reaching AWAITING_STAFF_APPROVAL
    const channel = supabase
      .channel('hot-alerts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions',
        filter: 'status=eq.AWAITING_STAFF_APPROVAL',
      }, (payload) => {
        const tx = payload.new as Transaction;
        triggerAlert(tx);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: 'status=eq.AWAITING_STAFF_APPROVAL',
      }, (payload) => {
        const tx = payload.new as Transaction;
        triggerAlert(tx);
      })
      .subscribe();

    // Also poll pending count every 30 seconds
    const interval = setInterval(async () => {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'AWAITING_STAFF_APPROVAL');
      setPendingCount(count || 0);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  function triggerAlert(tx: Transaction) {
    // Play sound
    playAlertSound();

    // Browser push notification
    sendHotNotification(
      '🔔 New Transaction Ready',
      `${tx.kyc_name || tx.whatsapp_number} — ${tx.currency_pair?.replace('_', ' → ')} · ${tx.amount} ${tx.from_currency}`,
    );

    // Add to in-app alerts
    setAlerts(prev => {
      const exists = prev.find(a => a.id === tx.id);
      if (exists) return prev;
      return [tx, ...prev].slice(0, 5);
    });

    // Update pending count
    setPendingCount(prev => prev + 1);

    // Also show toast
    toast.custom(() => (
      <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <p className="font-bold text-sm">Transaction Needs Review</p>
          <p className="text-xs opacity-90 mt-0.5">{tx.reference} — {tx.kyc_name}</p>
        </div>
      </div>
    ), { duration: 8000, position: 'top-right' });
  }

  function dismissAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function openTransaction(tx: Transaction) {
    navigate(`/queue/transaction/${tx.id}`);
    dismissAlert(tx.id);
  }

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {alerts.map(tx => (
        <div
          key={tx.id}
          className="bg-red-600 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-right"
        >
          <div className="p-1.5 bg-red-500 rounded-lg flex-shrink-0">
            <AlertCircle className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Transaction Ready for Review</p>
            <p className="text-xs opacity-90 mt-0.5 truncate">{tx.reference}</p>
            <p className="text-xs opacity-90 truncate">{tx.kyc_name} · {tx.currency_pair?.replace('_', ' → ')}</p>
            <button
              onClick={() => openTransaction(tx)}
              className="flex items-center gap-1 mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-semibold transition-colors"
            >
              Review Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => dismissAlert(tx.id)}
            className="text-white/60 hover:text-white flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
