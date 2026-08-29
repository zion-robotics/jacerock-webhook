import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import type { AuditLog } from '../../types';
import { Activity, Search } from 'lucide-react';

export default function MyActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtered, setFiltered] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMyLogs();
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(logs); return; }
    const q = search.toLowerCase();
    setFiltered(logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.notes?.toLowerCase().includes(q)
    ));
  }, [logs, search]);

  async function fetchMyLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('performed_by', user?.full_name)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) { setLogs(data); setFiltered(data); }
    setLoading(false);
  }

  function actionColor(action: string) {
    if (action.includes('APPROVED') || action.includes('COMPLETED')) return 'bg-green-100 text-green-700';
    if (action.includes('REJECTED') || action.includes('FAILED')) return 'bg-red-100 text-red-700';
    if (action.includes('HOLD') || action.includes('REVIEW')) return 'bg-amber-100 text-amber-700';
    if (action.includes('SENT') || action.includes('CONFIRMED')) return 'bg-blue-100 text-blue-700';
    if (action.includes('PAUSED') || action.includes('RESUMED')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-600';
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800">My Activity</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Your personal action history on the platform
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your actions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            {filtered.length} actions recorded
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No activity recorded yet</p>
            <p className="text-slate-400 text-xs mt-1">Your actions on transactions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {filtered.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${actionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-1">{log.notes}</p>
                  )}
                  {(log.old_status || log.new_status) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {log.old_status && <span>{log.old_status.replace(/_/g, ' ')}</span>}
                      {log.old_status && log.new_status && <span className="mx-1">→</span>}
                      {log.new_status && <span className="font-medium">{log.new_status.replace(/_/g, ' ')}</span>}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
