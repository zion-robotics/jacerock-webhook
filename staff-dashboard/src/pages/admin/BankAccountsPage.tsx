import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import type { BankAccount } from '../../types';
import { Landmark, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BankAccountsPage() {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [form, setForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    currency: 'GMD',
    country: 'Gambia',
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBanks(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setActing(true);
    try {
      const { error } = await supabase.from('bank_accounts').insert({
        ...form,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Bank account added successfully');
      setShowModal(false);
      setForm({ bank_name: '', account_name: '', account_number: '', currency: 'GMD', country: 'Gambia' });
      fetchBanks();
    } catch {
      toast.error('Failed to add bank account');
    } finally {
      setActing(false);
    }
  }

  async function handleToggle(bank: BankAccount) {
    await supabase
      .from('bank_accounts')
      .update({ is_active: !bank.is_active })
      .eq('id', bank.id);
    toast.success(`${bank.bank_name} ${bank.is_active ? 'deactivated' : 'activated'}`);
    fetchBanks();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Bank Accounts</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Active accounts are shown to customers in the WhatsApp bot
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">
            {banks.filter(b => b.is_active).length} active · {banks.length} total
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading accounts...</div>
        ) : banks.length === 0 ? (
          <div className="p-10 text-center">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No bank accounts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {banks.map(bank => (
              <div key={bank.id} className="px-5 py-4 flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                  <Landmark className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{bank.bank_name}</p>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {bank.currency} · {bank.country}
                    </span>
                    {!bank.is_active && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{bank.account_name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{bank.account_number}</p>
                </div>
                <button
                  onClick={() => handleToggle(bank)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    bank.is_active
                      ? 'text-amber-600 border border-amber-200 hover:bg-amber-50'
                      : 'text-green-600 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  {bank.is_active
                    ? <><ToggleRight className="w-4 h-4" /> Disable</>
                    : <><ToggleLeft className="w-4 h-4" /> Enable</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add Bank Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Bank Name</label>
                <input name="bank_name" value={form.bank_name} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="GTBank" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account Name</label>
                <input name="account_name" value={form.account_name} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Jacerock Capital Limited" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account Number</label>
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
                  {acting ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
