import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function SetupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);

    if (name === 'confirmPassword' || name === 'password') {
      if (updated.confirmPassword && updated.password !== updated.confirmPassword) {
        setConfirmError('Passwords do not match');
      } else {
        setConfirmError('');
      }
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setConfirmError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      const { error: staffError } = await supabase
        .from('staff_users')
        .insert({
          full_name: form.fullName,
          email: form.email,
          role: 'ADMIN',
          is_active: true,
        });

      if (staffError) throw staffError;

      toast.success('Admin account created successfully. Please log in.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* left: animated panel */}
        <div className="hidden md:block relative bg-[#0b1f3f] overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="45%" stopColor="#64748b" />
                <stop offset="55%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="tube" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="50%" stopColor="#3b5fd9" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>

            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="600" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
            ))}

            <rect x="230" y="70" width="130" height="70" rx="10" fill="#e7e5df" />
            <circle cx="255" cy="95" r="2.5" fill="#93c5cf" />
            <circle cx="280" cy="115" r="2" fill="#0f766e" />
            <circle cx="310" cy="90" r="2.5" fill="#94a3b8" />
            <circle cx="335" cy="120" r="2" fill="#93c5cf" />
            <circle cx="270" cy="130" r="2" fill="#0f766e" />

            <path
              d="M20 40 C 100 40, 100 130, 200 130 S 320 220, 260 260"
              stroke="url(#tube)"
              strokeWidth="22"
              fill="none"
              strokeLinecap="round"
            />

            <path
              id="mainTube"
              d="M40 260 C 140 260, 140 380, 260 380 S 380 470, 300 520 S 140 560, 60 500"
              stroke="url(#tube)"
              strokeWidth="26"
              fill="none"
              strokeLinecap="round"
            />

            <circle cx="260" cy="140" r="16" fill="#0f766e" opacity="0.25" />

            <circle r="11" fill="url(#chrome)">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                path="M40 260 C 140 260, 140 380, 260 380 S 380 470, 300 520 S 140 560, 60 500"
              />
            </circle>

            <rect x="20" y="440" width="70" height="70" rx="10" fill="#e7e5df" opacity="0.9" />
            <circle cx="40" cy="465" r="2" fill="#94a3b8" />
            <circle cx="60" cy="480" r="2" fill="#93c5cf" />
            <circle cx="50" cy="500" r="2" fill="#0f766e" />
          </svg>
        </div>

        {/* right: form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo.png" alt="Jacerock" className="h-20 w-20 object-contain flex-shrink-0" />
            <div>
              <span className="text-2xl font-bold text-slate-800 leading-tight block">Jacerock</span>
              <span className="text-sm font-medium text-slate-500">AfrikBerry</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create admin account</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">Jacerock / AfrikBerry staff portal — first time setup</p>

          <form onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Full name</label>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                placeholder="Emmanuel Shaib"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Admin email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                placeholder="admin@jacerockcapital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Confirm password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full border rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    confirmError
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-teal-600'
                  }`}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmError && (
                <p className="text-xs text-red-500 mt-1.5">{confirmError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-800 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create admin account'}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-6">
            This page is only shown once. After setup, only the login page will appear.
          </p>

          <div className="flex items-center gap-1.5 mt-6 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs">Secured staff access only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
