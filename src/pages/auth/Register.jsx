import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice';
import { Field, StatusAlert } from '../../components/layout/PageShell.jsx';

export default function Register({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && email && password) {
      const resultAction = await dispatch(registerUser({ name, email, password }));
      if (registerUser.fulfilled.match(resultAction)) {
        setSuccessMsg('Account created! Redirecting to login...');
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      {/* Outer card — wide two-column shell */}
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur flex flex-col md:flex-row">

        {/* ── Left branding panel ── */}
        <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-10 py-14 text-white md:w-2/5">
          {/* Decorative circles */}
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur">
              <span className="text-base font-bold tracking-[0.3em] text-white">POS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">POS System</h1>
            <p className="mt-2 text-sm leading-relaxed text-teal-100">
              Set up your account and start managing your store today.
            </p>
          </div>

          <ul className="relative z-10 space-y-3 text-sm text-teal-50">
            {['Quick and easy setup', 'Secure role-based access', 'Full inventory control'].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-1 text-sm text-slate-500">Join the POS management system</p>
          </div>

          <StatusAlert type="success" message={successMsg} />
          {error && <StatusAlert type="error" message={error} />}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full Name" required>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  placeholder="John Smith"
                />
              </Field>

              <Field label="Email Address" required>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Password" required>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  placeholder="••••••••"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-semibold text-teal-600 hover:underline">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}