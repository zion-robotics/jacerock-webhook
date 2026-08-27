import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import type { ExchangeRate } from '../../types';
import { TrendingUp, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('currency_pair');
    if (data) setRates(data);
    setLoading(false);
  }

  function handleEdit(id: string, value: string) {
    setEditing({ ...editing, [id]: value });
  }

  async function handleSave(rate: ExchangeRate) {
    const newRate = parseFloat(editing[rate.id]);
    if (isNaN(newRate) || newRate <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    setSaving(rate.id);
    try {
      await supabase
        .from('exchange_rates')
        .update({
          rate: newRate,
          updated_by: user?.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rate.id);

      toast.success(`${rate.currency_pair.replace('_', ' → ')} rate updated to ${newRate}`);
      const newEditing = { ...editing };
      delete newEditing[rate.id];
      setEditing(newEditing);
      fetchRates();
    } catch {
      toast.error('Failed to update rate');
    } finally {
      setSaving(null);
    }
  }

  async function handleToggleActive(rate: ExchangeRate) {
    await supabase
      .from('exchange_rates')
      .update({ is_active: !rate.is_active })
      .eq('id', rate.id);
    toast.success(`${rate.currency_pair.replace('_', ' → ')} ${rate.is_active ? 'deactivated' : 'activated'}`);
    fetchRates();
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Exchange Rates</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Changes take effect immediately in the WhatsApp bot
          </p>
        </div>
        <button
          onClick={fetchRates}
          className="flex items-center gap-2 text-sm text-slate-500 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 bg-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        ⚠️ Rate changes are live immediately. Customers currently in a transaction will see the new rate on their next interaction.
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">All Currency Pairs</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading rates...</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rates.map(rate => (
              <div key={rate.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-slate-800 text-sm">
                      {rate.currency_pair.replace('_', ' → ')}
                    </span>
                    {!rate.is_active && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Last updated {timeAgo(rate.updated_at)}
                    {rate.updated_by && ` by ${rate.updated_by}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={editing[rate.id] !== undefined ? editing[rate.id] : rate.rate}
                      onChange={e => handleEdit(rate.id, e.target.value)}
                      className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  {editing[rate.id] !== undefined && (
                    <button
                      onClick={() => handleSave(rate)}
                      disabled={saving === rate.id}
                      className="flex items-center gap-1 bg-accent text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {saving === rate.id ? 'Saving...' : 'Save'}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(rate)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      rate.is_active
                        ? 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                        : 'text-green-600 border border-green-200 hover:bg-green-50'
                    }`}
                  >
                    {rate.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
