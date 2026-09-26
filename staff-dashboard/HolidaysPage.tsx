import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Holiday {
  id: string;
  holiday_date: string;
  name: string;
  type: 'CLOSED' | 'ONLINE_ONLY';
  custom_message: string | null;
}

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [form, setForm] = useState({
    holiday_date: '',
    name: '',
    type: 'CLOSED' as 'CLOSED' | 'ONLINE_ONLY',
    custom_message: '',
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  async function fetchHolidays() {
    const { data } = await supabase
      .from('holidays')
      .select('*')
      .order('holiday_date', { ascending: true });
    if (data) setHolidays(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setActing(true);
    try {
      const { error } = await supabase.from('holidays').insert({
        holiday_date: form.holiday_date,
        name: form.name,
        type: form.type,
        custom_message: form.custom_message.trim() || null,
        created_by: user?.full_name,
      });
      if (error) throw error;
      toast.success('Holiday added');
      setShowModal(false);
      setForm({ holiday_date: '', name: '', type: 'CLOSED', custom_message: '' });
      fetchHolidays();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add holiday';
      toast.error(message.includes('duplicate') ? 'A holiday already exists for that date' : message);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete(holiday: Holiday) {
    if (!confirm(`Remove "${holiday.name}" (${holiday.holiday_date})?`)) return;
    try {
      await supabase.from('holidays').delete().eq('id', holiday.id);
      toast.success('Holiday removed');
      fetchHolidays();
    } catch {
      toast.error('Failed to remove holiday');
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = holidays.filter(h => h.holiday_date >= today);
  const past = holidays.filter(h => h.holiday_date < today);

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Holidays</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Dates outside the normal weekly schedule — fully closed, or online transactions only.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Upcoming</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
        ) : upcoming.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No upcoming holidays scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map(h => (
              <div key={h.id} className="px-4 md:px-5 py-4 flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 text-sm">{h.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      h.type === 'CLOSED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {h.type === 'CLOSED' ? 'Fully Closed' : 'Online Only'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(h.holiday_date)}</p>
                  {h.custom_message && (
                    <p className="text-xs text-slate-500 mt-1 italic truncate">"{h.custom_message}"</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(h)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden opacity-70">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Past</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {past.map(h => (
              <div key={h.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm text-slate-600 truncate">{h.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(h.holiday_date)}</p>
                </div>
                <button
                  onClick={() => handleDelete(h)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add Holiday</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input
                  name="holiday_date"
                  type="date"
                  value={form.holiday_date}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Christmas Day"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="CLOSED">Fully Closed (like a normal off day)</option>
                  <option value="ONLINE_ONLY">Online Only (office closed, transfers still processed)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Custom Message (optional)</label>
                <textarea
                  name="custom_message"
                  value={form.custom_message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Leave blank to use the default away message"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
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
                  {acting ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
