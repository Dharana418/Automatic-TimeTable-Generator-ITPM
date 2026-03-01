import React, { useState } from "react";
import { Link } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";
import "./login.css";

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
    <div className="auth-card">
      <img className="auth-logo" src={sliitLogo} alt="SLIIT logo" />
      <h2 style={{ color: 'black' }}>Register</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__label" htmlFor="name">Full Name</label>
        <input
          className="form__input"
          type="text"
          name="name"
          id="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder=""
        />
        {fieldErrors.name && <span className="error-message">{fieldErrors.name}</span>}

        <label className="form__label" htmlFor="email">Email Address</label>
        <input
          className="form__input"
          type="email"
          name="email"
          id="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder=""
        />
        {fieldErrors.email && <span className="error-message">{fieldErrors.email}</span>}

        <label className="form__label" htmlFor="role">Your Role</label>
        <select
          className="form__input"
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
        {fieldErrors.role && <span className="error-message">{fieldErrors.role}</span>}

        <label className="form__label" htmlFor="password">Password</label>
        <div className="input-wrapper">
          <input
            className="form__input"
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
            className="input-toggle"
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
        {fieldErrors.password && <span className="error-message">{fieldErrors.password}</span>}

        <label className="form__label" htmlFor="confirmPassword">Confirm Password</label>
        <div className="input-wrapper">
          <input
            className="form__input"
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
            className="input-toggle"
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
        {fieldErrors.confirmPassword && <span className="error-message">{fieldErrors.confirmPassword}</span>}

        <label className="form__label" htmlFor="phonenumber">Phone Number</label>
        <input
          className="form__input"
          type="tel"
          name="phonenumber"
          id="phonenumber"
          value={form.phonenumber}
          onChange={handleChange}
          placeholder=""
        />
        {fieldErrors.phonenumber && <span className="error-message">{fieldErrors.phonenumber}</span>}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="error-message" style={{ color: '#51cf66', background: 'rgba(81,207,102,0.1)', border: '1px solid #51cf66' }}>{success}</div>}

        <button
          className="form__btn"
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
      <div className="auth-footer">
        <span>Already have an account?</span>
        <Link to="/login" className="register-link">Sign in here</Link>
      </div>
    </div>
  );
};

export default Register;
