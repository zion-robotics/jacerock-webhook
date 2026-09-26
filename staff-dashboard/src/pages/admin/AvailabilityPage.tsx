import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Clock, AlertTriangle, MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface BusinessHourRow {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface BusinessStatus {
  away_message: string;
  outage_active: boolean;
  outage_message: string | null;
  outage_expected_resolution: string | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  const { user } = useAuthStore();
  const [hours, setHours] = useState<BusinessHourRow[]>([]);
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [savingAway, setSavingAway] = useState(false);
  const [savingOutage, setSavingOutage] = useState(false);

  const [awayDraft, setAwayDraft] = useState('');
  const [outageDraft, setOutageDraft] = useState('');
  const [outageTimeDraft, setOutageTimeDraft] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [{ data: hoursData }, { data: statusData }] = await Promise.all([
      supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }),
      supabase.from('business_status').select('*').eq('id', 1).single(),
    ]);
    if (hoursData) setHours(hoursData);
    if (statusData) {
      setStatus(statusData);
      setAwayDraft(statusData.away_message || '');
      setOutageDraft(statusData.outage_message || '');
      setOutageTimeDraft(statusData.outage_expected_resolution ? statusData.outage_expected_resolution.slice(0, 16) : '');
    }
    setLoading(false);
  }

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHourRow>) {
    setHours(prev => prev.map(h => h.day_of_week === dayOfWeek ? { ...h, ...patch } : h));
  }

  async function saveDay(row: BusinessHourRow) {
    setSavingDay(row.day_of_week);
    try {
      await supabase
        .from('business_hours')
        .update({
          is_open: row.is_open,
          open_time: row.is_open ? row.open_time : null,
          close_time: row.is_open ? row.close_time : null,
          updated_by: user?.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('day_of_week', row.day_of_week);
      toast.success(`${DAY_NAMES[row.day_of_week]} hours updated`);
    } catch {
      toast.error('Failed to update hours');
    } finally {
      setSavingDay(null);
    }
  }

  async function saveAwayMessage() {
    setSavingAway(true);
    try {
      await supabase
        .from('business_status')
        .update({ away_message: awayDraft, updated_at: new Date().toISOString() })
        .eq('id', 1);
      toast.success('Away message updated');
      fetchAll();
    } catch {
      toast.error('Failed to update away message');
    } finally {
      setSavingAway(false);
    }
  }

  async function toggleOutage(activate: boolean) {
    setSavingOutage(true);
    try {
      await supabase
        .from('business_status')
        .update({
          outage_active: activate,
          outage_message: activate ? outageDraft : null,
          outage_expected_resolution: activate && outageTimeDraft ? new Date(outageTimeDraft).toISOString() : null,
          outage_set_by: user?.full_name,
          outage_set_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      toast.success(activate ? 'Outage mode activated — customers will now see this message' : 'Outage mode deactivated');
      fetchAll();
    } catch {
      toast.error('Failed to update outage status');
    } finally {
      setSavingOutage(false);
    }
  }

  if (loading) {
    return <div className="text-center text-slate-400 text-sm py-12 animate-pulse">Loading availability settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl min-w-0">
      {/* Outage banner if active */}
      {status?.outage_active && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-red-800 font-semibold text-sm">Outage mode is currently ACTIVE</p>
            <p className="text-red-600 text-xs mt-0.5">Customers are seeing the outage message below instead of the normal bot flow.</p>
          </div>
        </div>
      )}

      {/* Business Hours */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent flex-shrink-0" />
          Business Hours (GMT)
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Outside these hours, customers automatically receive the away message and cannot start or continue a transaction.
        </p>

        <div className="space-y-3">
          {hours.map(row => (
            <div key={row.day_of_week} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 pb-3 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3 sm:w-40 flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={row.is_open}
                    onChange={e => updateDay(row.day_of_week, { is_open: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-accent rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm font-medium text-slate-700 truncate">{DAY_NAMES[row.day_of_week]}</span>
              </div>

              {row.is_open ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="time"
                    value={row.open_time || ''}
                    onChange={e => updateDay(row.day_of_week, { open_time: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0"
                  />
                  <span className="text-slate-400 text-sm flex-shrink-0">to</span>
                  <input
                    type="time"
                    value={row.close_time || ''}
                    onChange={e => updateDay(row.day_of_week, { close_time: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0"
                  />
                </div>
              ) : (
                <span className="text-sm text-slate-400 flex-1">Closed all day</span>
              )}

              <button
                onClick={() => saveDay(row)}
                disabled={savingDay === row.day_of_week}
                className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
              >
                {savingDay === row.day_of_week ? 'Saving...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Away Message */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
          Away Message
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Sent to customers outside business hours or on a fully closed holiday.
        </p>
        <textarea
          value={awayDraft}
          onChange={e => setAwayDraft(e.target.value)}
          rows={6}
          className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <button
          onClick={saveAwayMessage}
          disabled={savingAway}
          className="mt-3 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {savingAway ? 'Saving...' : 'Save Away Message'}
        </button>
      </div>

      {/* Manual Outage */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0" />
          Manual Outage Mode
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Use this when something breaks during business hours (e.g. settlement bank down). While active, this message overrides everything else, even during normal hours.
        </p>

        <div className="space-y-3">
          <textarea
            value={outageDraft}
            onChange={e => setOutageDraft(e.target.value)}
            rows={4}
            placeholder="e.g. We have closed business operations for today due to scheduled maintenance on our settlement infrastructure..."
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Expected resolution (optional)</label>
            <input
              type="datetime-local"
              value={outageTimeDraft}
              onChange={e => setOutageTimeDraft(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {status?.outage_active ? (
              <button
                onClick={() => toggleOutage(false)}
                disabled={savingOutage}
                className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {savingOutage ? 'Updating...' : 'Deactivate Outage Mode'}
              </button>
            ) : (
              <button
                onClick={() => toggleOutage(true)}
                disabled={savingOutage || !outageDraft.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {savingOutage ? 'Activating...' : 'Activate Outage Mode'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
