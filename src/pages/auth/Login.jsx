import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../features/auth/authSlice";
import { Field, StatusAlert } from "../../components/layout/PageShell.jsx";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (identifier && password) {
      dispatch(loginUser({ identifier, password }));
    }
  };

  // Detect if input looks like an email
  const isEmail = identifier.includes("@");

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
            {/* POS logo mark */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur">
              <span className="text-base font-bold tracking-[0.3em] text-white">
                POS
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">POS System</h1>
            <p className="mt-2 text-sm leading-relaxed text-teal-100">
              Manage your inventory, categories, and items from one place.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="relative z-10 space-y-3 text-sm text-teal-50">
            {[
              "Category & item management",
              "Real-time inventory tracking",
              "Multi-user access control",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
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
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your email or username
            </p>
          </div>

          <StatusAlert message={error} type="error" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username field */}
            <Field label="Email or Username" required>
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  placeholder="name@company.com or johndoe"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                />
                {/* Dynamic icon: switches between @ and person */}
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isEmail ? (
                    // @ icon
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  ) : (
                    // person icon
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </span>
              </div>
            </Field>

            {/* Password field */}
            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? (
                    <MdVisibilityOff size={20} />
                  ) : (
                    <MdVisibility size={20} />
                  )}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <span className="font-medium text-slate-600">
              Please contact your system administrator to request access.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}