import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { createStaffAccount, resetStaffPassword } from '../../services/api';
import type { StaffUser } from '../../types';
import {
  UserPlus, Trash2, ShieldOff, ShieldCheck,
  Eye, EyeOff, Users, X, KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'AGENT' as 'AGENT' | 'ADMIN',
  });

  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const { data } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setStaff(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setActing(true);
    try {
      await createStaffAccount(form.full_name, form.email, form.password, form.role);

      toast.success(`Staff member ${form.full_name} added successfully`);
      setShowModal(false);
      setForm({ full_name: '', email: '', password: '', confirmPassword: '', role: 'AGENT' });
      fetchStaff();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as any).response?.data?.error
          : err instanceof Error ? err.message : 'Failed to add staff';
      toast.error(message || 'Failed to add staff');
    } finally {
      setActing(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setResetting(true);
    try {
      await resetStaffPassword(resetTarget.id, newPassword);
      toast.success(`Password reset for ${resetTarget.full_name}`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as any).response?.data?.error
          : err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  async function handleToggleActive(member: StaffUser) {
    try {
      await supabase
        .from('staff_users')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);

      toast.success(`${member.full_name} ${member.is_active ? 'deactivated' : 'reactivated'}`);
      fetchStaff();
    } catch {
      toast.error('Failed to update staff status');
    }
  }

  async function handleRemove(member: StaffUser) {
    if (!confirm(`Are you sure you want to permanently remove ${member.full_name}?`)) return;
    try {
      await supabase.from('staff_users').delete().eq('id', member.id);
      toast.success(`${member.full_name} removed`);
      fetchStaff();
    } catch {
      toast.error('Failed to remove staff member');
    }
  }

  const activeCount = staff.filter(s => s.is_active).length;

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">Staff Management</h3>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {activeCount} active member{activeCount !== 1 ? 's' : ''} · {staff.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-4 flex items-center gap-3 min-w-0">
          <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold text-slate-800">{activeCount}</p>
            <p className="text-xs text-slate-500 truncate">Active Staff</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-4 flex items-center gap-3 min-w-0">
          <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
            <ShieldOff className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold text-slate-800">{staff.length - activeCount}</p>
            <p className="text-xs text-slate-500 truncate">Deactivated</p>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">All Staff Members</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No staff members yet</p>
            <p className="text-slate-400 text-xs mt-1">Click Add Staff to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {staff.map(member => (
              <div key={member.id} className="px-4 md:px-5 py-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    member.role === 'ADMIN' ? 'bg-accent' : 'bg-slate-400'
                  }`}>
                    {member.full_name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800 text-sm truncate">{member.full_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        member.role === 'ADMIN'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.role === 'ADMIN' ? 'Admin' : 'Staff'}
                      </span>
                      {!member.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold flex-shrink-0">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Actions — full width row on mobile, right-aligned on desktop */}
                <div className="flex items-center gap-2 mt-3 md:mt-0 md:absolute md:right-5">
                  <button
                    onClick={() => setResetTarget(member)}
                    className="flex items-center justify-center gap-1.5 flex-1 md:flex-none text-xs px-3 py-2 rounded-lg text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="md:hidden">Reset</span>
                  </button>
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`flex items-center justify-center gap-1.5 flex-1 md:flex-none text-xs px-3 py-2 rounded-lg border transition-colors ${
                      member.is_active
                        ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                        : 'text-green-600 border-green-200 hover:bg-green-50'
                    }`}
                  >
                    {member.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span className="md:hidden">{member.is_active ? 'Deactivate' : 'Reactivate'}</span>
                  </button>
                  {member.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleRemove(member)}
                      className="flex items-center justify-center flex-1 md:flex-none text-xs px-3 py-2 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="md:hidden ml-1.5">Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add New Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ibrahim Koroma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="ibrahim@jacerockcapital.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="AGENT">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Repeat password"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                After creating this account, share the email and password with the staff member directly via WhatsApp or your preferred channel.
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
                  {acting ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Reset Password</h3>
              <button
                onClick={() => { setResetTarget(null); setNewPassword(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4 truncate">
              Set a new password for <span className="font-medium text-slate-700">{resetTarget.full_name}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                Share the new password with the staff member directly via WhatsApp or your preferred channel.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setResetTarget(null); setNewPassword(''); }}
                  className="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
