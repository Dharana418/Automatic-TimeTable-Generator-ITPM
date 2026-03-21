import React, { useState } from "react";
import { Link } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const Register = ({ apiBase, onAuthSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phonenumber: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = "Full name is required";
    } else if (form.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!form.role) {
      errors.role = "Please select a role";
    }
    if (form.phonenumber) {
      const digits = form.phonenumber.replace(/\D/g, '');
      if (digits.length < 10) {
        errors.phonenumber = "Please enter a valid phone number";
      }
    }
    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const submissionData = { ...form };
    delete submissionData.confirmPassword;
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submissionData),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccess("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          onAuthSuccess?.(data.user ?? null);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/95 px-8 py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-md">
      <img className="mx-auto mb-5 block w-20 drop-shadow-sm" src={sliitLogo} alt="SLIIT logo" />
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Create Account</p>
      <h2 className="mb-6 text-3xl text-slate-900">Register</h2>
      <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit}>
        <label className="mb-1 text-sm font-semibold text-slate-700" htmlFor="name">Full Name</label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
          type="text"
          name="name"
          id="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder=""
        />
        {fieldErrors.name && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.name}</span>}

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700" htmlFor="email">Email Address</label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
          type="email"
          name="email"
          id="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder=""
        />
        {fieldErrors.email && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.email}</span>}

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700" htmlFor="role">Your Role</label>
        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none ring-indigo-500 transition focus:border-indigo-400 focus:ring-2"
          name="role"
          id="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="">Select your role...</option>
          <option value="Faculty Coordinator">Faculty Coordinator</option>
          <option value="Academic Coordinator">Academic Coordinator</option>
          <option value="Instructor">Instructor</option>
          <option value="Lecturer/Senior Lecturer">Lecturer/Senior Lecturer</option>
          <option value="LIC">LIC</option>
        </select>
        {fieldErrors.role && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.role}</span>}

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
        <div className="relative w-full">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="password"
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
        {fieldErrors.password && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.password}</span>}

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
        <div className="relative w-full">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-none bg-transparent p-0 text-indigo-950 transition hover:bg-indigo-50"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword((s) => !s)}
          >
            {showConfirmPassword ? (
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
        {fieldErrors.confirmPassword && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.confirmPassword}</span>}

        <label className="mb-1 mt-1 text-sm font-semibold text-slate-700" htmlFor="phonenumber">Phone Number</label>
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none ring-indigo-500 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2"
          type="tel"
          name="phonenumber"
          id="phonenumber"
          value={form.phonenumber}
          onChange={handleChange}
          placeholder=""
        />
        {fieldErrors.phonenumber && <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{fieldErrors.phonenumber}</span>}

        {error && <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-600">{success}</div>}

        <button
          className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-slate-900 px-4 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>Creating account...</>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-700">
        <span>Already have an account?</span>
        <Link to="/login" className="ml-1 font-semibold text-indigo-600 hover:underline">Sign in here</Link>
      </div>
    </div>
  );
};

export default Register;
