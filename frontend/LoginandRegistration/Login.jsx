import React, { useState } from "react";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";
import { showError, showSuccess, showWarning } from "../src/utils/alerts.js";

const Login = ({ apiBase, onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        const backendMessage = String(data?.error || data?.message || "").trim();
        const isInvalidCredentials = /invalid credentials|wrong email|wrong password|email or password/i.test(backendMessage);
        const finalMessage = isInvalidCredentials
          ? "Email or password is incorrect."
          : (backendMessage || "Login failed");

        throw new Error(finalMessage);
      }

      showSuccess("Login successful", "Welcome back.");
      onAuthSuccess(data.user);
    } catch (err) {
      const popupMessage = err?.message || "Unable to sign in";
      setError(popupMessage);
      showError("Login failed", popupMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/95 px-8 py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-md">
      <img src={sliitLogo} alt="SLIIT Logo" className="mx-auto mb-5 block w-20 drop-shadow-sm" />
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Welcome Back</p>
      <h2 className="mb-6 text-3xl text-slate-900">Sign In</h2>

      <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit}>
        <label className="mb-1 text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700">Password</label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-none bg-transparent p-0 text-indigo-950 transition hover:bg-indigo-50"
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

        {error && <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</div>}

        <button type="submit" className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-slate-900 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default Login;