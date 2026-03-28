import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";
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
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-3xl border border-white/40 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.18)] overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-center">
          <img src={sliitLogo} alt="SLIIT Logo" className="mx-auto mb-3 block w-16 brightness-0 invert drop-shadow-sm" />
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">SLIIT Timetable System</p>
          <h2 className="mt-1 text-2xl font-black text-white">Welcome Back</h2>
        </div>

        {/* Form body */}
        <div className="px-8 py-7">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="you@sliit.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.58 10.58a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.93 12.53C4.86 16.17 8.24 18.5 12 18.5c2.09 0 4.03-.6 5.69-1.63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M1.5 12s4-7 10.5-7S22.5 12 22.5 12s-4 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-xs font-bold text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {forgotLoading ? "Requesting..." : "Forgot Password?"}
              </button>
            </div>

            <button
              type="submit"
              className="mt-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400">
        SLIIT Automatic Timetable Generator &middot; Secure Access
      </p>
    </div>
  );
};

export default Login;
