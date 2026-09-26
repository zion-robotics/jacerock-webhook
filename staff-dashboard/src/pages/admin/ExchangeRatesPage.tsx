import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import type { ExchangeRate } from '../../types';
import { TrendingUp, Save, RefreshCw, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [form, setForm] = useState({
    from_currency: '',
    to_currency: '',
    rate: '',
  });

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

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'from_currency' || name === 'to_currency' ? value.toUpperCase() : value });
  }

  async function handleAddPair(e: React.FormEvent) {
    e.preventDefault();
    const fromC = form.from_currency.trim();
    const toC = form.to_currency.trim();
    const rateNum = parseFloat(form.rate);

    if (!fromC || !toC) {
      toast.error('Please enter both currencies');
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    const currencyPair = `${fromC}_${toC}`;
    if (rates.some(r => r.currency_pair === currencyPair)) {
      toast.error(`${fromC} → ${toC} already exists`);
      return;
    }

    setActing(true);
    try {
      const { error } = await supabase.from('exchange_rates').insert({
        currency_pair: currencyPair,
        from_currency: fromC,
        to_currency: toC,
        rate: rateNum,
        is_active: true,
        updated_by: user?.full_name,
      });
      if (error) throw error;
      toast.success(`${fromC} → ${toC} added`);
      setShowModal(false);
      setForm({ from_currency: '', to_currency: '', rate: '' });
      fetchRates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add currency pair';
      toast.error(message);
    } finally {
      setActing(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Exchange Rates</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Changes take effect immediately in the WhatsApp bot
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={fetchRates}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 border border-slate-200 px-3 py-2.5 rounded-lg hover:bg-slate-50 bg-white"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Pair
          </button>
        </div>
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
        ) : rates.length === 0 ? (
          <div className="p-10 text-center">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No currency pairs yet</p>
            <p className="text-slate-400 text-xs mt-1">Click Add Pair to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rates.map(rate => (
              <div key={rate.id} className="px-4 md:px-5 py-4 min-w-0">
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="font-semibold text-slate-800 text-sm truncate">
                    {rate.currency_pair.replace('_', ' → ')}
                  </span>
                  {!rate.is_active && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3 truncate">
                  Last updated {timeAgo(rate.updated_at)}
                  {rate.updated_by && ` by ${rate.updated_by}`}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editing[rate.id] !== undefined ? editing[rate.id] : rate.rate}
                    onChange={e => handleEdit(rate.id, e.target.value)}
                    className="w-28 flex-shrink-0 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  {editing[rate.id] !== undefined && (
                    <button
                      onClick={() => handleSave(rate)}
                      disabled={saving === rate.id}
                      className="flex items-center gap-1 bg-accent text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <Save className="w-3 h-3" />
                      {saving === rate.id ? 'Saving...' : 'Save'}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(rate)}
                    className={`text-xs px-2.5 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add Currency Pair</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPair} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">From Currency</label>
                  <input
                    name="from_currency"
                    value={form.from_currency}
                    onChange={handleFormChange}
                    required
                    maxLength={5}
                    placeholder="USD"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">To Currency</label>
                  <input
                    name="to_currency"
                    value={form.to_currency}
                    onChange={handleFormChange}
                    required
                    maxLength={5}
                    placeholder="GMD"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Rate</label>
                <input
                  name="rate"
                  type="number"
                  step="0.01"
                  value={form.rate}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 75.55"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  1 {form.from_currency || 'FROM'} = {form.rate || '?'} {form.to_currency || 'TO'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                This pair will not appear in the bot's currency selection list until you also add it there in the code — this only adds the rate to the database.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acting}
                  className="flex-1 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {acting ? 'Adding...' : 'Add Pair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
