import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Smartphone, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface MobileWallet {
  id: string;
  wallet_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country: string | null;
  is_active: boolean;
}

export default function MobileWalletsPage() {
  const [wallets, setWallets] = useState<MobileWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [form, setForm] = useState({
    wallet_name: '',
    account_name: '',
    account_number: '',
    currency: 'GMD',
    country: 'Gambia',
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    const { data } = await supabase
      .from('mobile_wallets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWallets(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setActing(true);
    try {
      const { error } = await supabase.from('mobile_wallets').insert({
        ...form,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Mobile wallet added successfully');
      setShowModal(false);
      setForm({ wallet_name: '', account_name: '', account_number: '', currency: 'GMD', country: 'Gambia' });
      fetchWallets();
    } catch {
      toast.error('Failed to add mobile wallet');
    } finally {
      setActing(false);
    }
  }

  async function handleToggle(wallet: MobileWallet) {
    await supabase
      .from('mobile_wallets')
      .update({ is_active: !wallet.is_active })
      .eq('id', wallet.id);
    toast.success(`${wallet.wallet_name} ${wallet.is_active ? 'deactivated' : 'activated'}`);
    fetchWallets();
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Mobile Wallets</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Active wallets are shown to customers as mobile wallet payment options
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Wallet
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">
            {wallets.filter(w => w.is_active).length} active · {wallets.length} total
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading wallets...</div>
        ) : wallets.length === 0 ? (
          <div className="p-10 text-center">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No mobile wallets yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {wallets.map(wallet => (
              <div key={wallet.id} className="px-4 md:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm truncate">{wallet.wallet_name}</p>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        {wallet.currency}{wallet.country ? ` · ${wallet.country}` : ''}
                      </span>
                      {!wallet.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">{wallet.account_name}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{wallet.account_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(wallet)}
                  className={`flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                    wallet.is_active
                      ? 'text-amber-600 border border-amber-200 hover:bg-amber-50'
                      : 'text-green-600 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  {wallet.is_active
                    ? <><ToggleRight className="w-4 h-4" /> Disable</>
                    : <><ToggleLeft className="w-4 h-4" /> Enable</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add Mobile Wallet</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Wallet Name</label>
                <input name="wallet_name" value={form.wallet_name} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="APS, Wave, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account Name</label>
                <input name="account_name" value={form.account_name} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Jacerock Capital Limited" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account / Wallet Number</label>
                <input name="account_number" value={form.account_number} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0123456789" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="GMD">GMD</option>
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Country</label>
                  <select name="country" value={form.country} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="Gambia">Gambia</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={acting}
                  className="flex-1 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {acting ? 'Adding...' : 'Add Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
