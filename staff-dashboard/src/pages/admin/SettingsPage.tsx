import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl min-w-0">

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-accent flex-shrink-0" />
          Account Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-2 py-2 border-b border-slate-50 min-w-0">
            <span className="text-sm text-slate-500 flex-shrink-0">Full Name</span>
            <span className="text-sm font-medium text-slate-800 truncate text-right">{user?.full_name}</span>
          </div>
          <div className="flex justify-between items-center gap-2 py-2 border-b border-slate-50 min-w-0">
            <span className="text-sm text-slate-500 flex-shrink-0">Email Address</span>
            <span className="text-sm font-medium text-slate-800 truncate text-right">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center gap-2 py-2 min-w-0">
            <span className="text-sm text-slate-500 flex-shrink-0">Role</span>
            <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-0.5 rounded-full flex-shrink-0">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 min-w-0">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent flex-shrink-0" />
          Change Password
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Update your admin password. Choose something strong and unique.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Confirm New Password</label>
            <input
              name="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Repeat new password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <Lock className="w-4 h-4" />
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Security Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 md:p-5 min-w-0">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-slate-500 flex-shrink-0" />
          Security Notes
        </h3>
        <ul className="space-y-2 text-xs text-slate-500">
          <li>• Sessions expire automatically after 30 minutes of inactivity</li>
          <li>• All staff actions are logged and visible in the Activity Logs page</li>
          <li>• You can deactivate any staff account instantly from Staff Management</li>
          <li>• Never share your admin password with anyone including staff members</li>
          <li>• Exchange rate changes take effect immediately in the WhatsApp bot</li>
        </ul>
      </div>
    </div>
  );
}
