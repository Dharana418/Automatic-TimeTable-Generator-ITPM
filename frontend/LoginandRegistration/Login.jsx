import React, { useState } from "react";
import { Link } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const Login = ({ apiBase, onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-300/50 bg-white/90 px-8 py-10 text-center shadow-2xl backdrop-blur-md">
      <img src={sliitLogo} alt="SLIIT Logo" className="mx-auto mb-5 block w-20" />
      <h2 className="mb-6 text-3xl text-slate-900">Sign In</h2>

      <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit}>
        <label className="mb-1 font-semibold text-indigo-950">Email</label>
        <input
          type="email"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-indigo-500 transition focus:ring-2"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 mt-1 font-semibold text-indigo-950">Password</label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 pr-11 text-slate-800 outline-none ring-indigo-500 transition focus:ring-2"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border-none bg-transparent p-0 text-indigo-950"
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

        {error && <div className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-red-500">{error}</div>}

        <button type="submit" className="mt-1 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-950 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 text-center text-indigo-950">
        Don’t have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;