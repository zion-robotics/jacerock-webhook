import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../../services/notifications';

export default function NotificationBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    const timer = window.setTimeout(() => setShow(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleEnable() {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-white rounded-xl shadow-xl p-4 z-40 flex items-start gap-3">
      <div className="p-2 bg-accent rounded-lg flex-shrink-0">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Enable Notifications</p>
        <p className="text-xs text-slate-300 mt-0.5">
          Get instant alerts when a new transaction needs your review. Never miss an urgent payment.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            className="bg-accent text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Enable Alerts
          </button>
          <button
            onClick={() => setShow(false)}
            className="text-slate-400 text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button onClick={() => setShow(false)} className="text-slate-400 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
