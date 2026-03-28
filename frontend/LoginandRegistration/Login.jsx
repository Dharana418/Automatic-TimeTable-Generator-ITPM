import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";
import campus from "../src/assets/SliitHD.jpg";
import { showError, showSuccess, showWarning } from "../src/utils/alerts.js";
import { getDashboardPathByRole } from "../src/utils/roleToDashboard.js";
import { requestPasswordReset } from "../src/api/auth.js";

const Login = ({ apiBase, onAuthSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showWarning("Validation required", "Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showWarning("Validation required", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      showWarning("Validation required", "Password is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      showSuccess("Login successful", "Welcome back.");
      onAuthSuccess(data.user);
      navigate(getDashboardPathByRole(data?.user?.role), { replace: true });
    } catch (err) {
      setError(err.message);
      showError("Login failed", err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showWarning("Email required", "Enter your email first, then click Forgot Password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showWarning("Invalid email", "Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const data = await requestPasswordReset(email.trim());
      const resetHint = data?.resetLink ? `\n\nDev reset link: ${data.resetLink}` : "";
      showSuccess("Reset requested", `${data?.message || "If the account exists, a reset token was created."}${resetHint}`);
    } catch (err) {
      showError("Request failed", err.message || "Unable to process forgot password request.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel – Branding */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden lg:flex">
        <img src={campus} alt="SLIIT Campus" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-slate-900/80 to-slate-950/90" />
        <div className="relative z-10 flex flex-col items-center gap-6 px-10 text-center">
          <img src={sliitLogo} alt="SLIIT Logo" className="h-20 w-auto drop-shadow-2xl" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Sri Lanka Institute of Information Technology
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white xl:text-4xl">
              Automatic Timetable Generator
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Conflict-free academic scheduling powered by intelligent algorithms — built for SLIIT.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            {[
              { value: "100+", label: "Batches" },
              { value: "50+", label: "Faculty" },
              { value: "Zero", label: "Conflicts" },
              { value: "24/7", label: "Access" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xl font-extrabold text-indigo-300">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <img src={sliitLogo} alt="SLIIT Logo" className="h-14 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Automatic Timetable Generator</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Welcome Back</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Sign In</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your SLIIT credentials to continue.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-800 shadow-sm outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-none bg-transparent p-0 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.58 10.58a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.93 12.53C4.86 16.17 8.24 18.5 12 18.5c2.09 0 4.03-.6 5.69-1.63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.12 9.88A3 3 0 009.88 14.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M1.5 12s4-7 10.5-7S22.5 12 22.5 12s-4 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {forgotLoading ? "Requesting reset..." : "Forgot Password?"}
              </button>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SLIIT · Automatic Timetable Generator
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;