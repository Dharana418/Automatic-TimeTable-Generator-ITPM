import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { showError, showSuccess, showWarning } from '../utils/alerts.js';

const ROLE_OPTIONS = [
  'Instructor', 'Lecturer', 'Senior Lecturer', 'Assistant Lecturer',
  'Professor', 'LIC', 'Faculty Coordinator', 'Academic Coordinator',
];

const FORBIDDEN_NAME_CHARS = /[~!@#$%^&*()_+]/;
const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_NUMBER = /\d/;
const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9]/;
const NON_DIGIT_CHARS = /\D/;

const initialForm = { name: '', email: '', password: '', phonenumber: '', role: '' };

// Reusable Tailwind classes for inputs
const inputClasses = "w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-400/20 hover:border-slate-400";
const creativeBorderCard = "rounded-3xl bg-gradient-to-br from-indigo-400/80 via-fuchsia-400/70 to-cyan-400/80 p-[1.5px] shadow-lg";
const creativeInnerCard = "rounded-[22px] bg-white/90 backdrop-blur-sm";

export default function AdminDashboard({ apiBase, user }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || data.message || 'Failed to fetch role assignment history';
        throw new Error(message);
      }

      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name' && FORBIDDEN_NAME_CHARS.test(value)) {
      showWarning('Validation required', 'Name cannot contain special characters ~!@#$%^&*()_+');
      return;
    }

    if (name === 'phonenumber') {
      if (NON_DIGIT_CHARS.test(value)) {
        showWarning('Validation required', 'Phone number can contain digits only');
        return;
      }
      if (value.length > 10) {
        showWarning('Validation required', 'Phone number cannot exceed 10 numbers');
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Name is required';
    if (form.name.trim().length < 3) return 'Name must be at least 3 characters';
    if (FORBIDDEN_NAME_CHARS.test(form.name.trim())) return 'Name cannot contain special characters ~!@#$%^&*()_+';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!PASSWORD_HAS_LETTER.test(form.password) || !PASSWORD_HAS_NUMBER.test(form.password) || !PASSWORD_HAS_SPECIAL.test(form.password)) {
      return 'Password must contain at least one letter, one number, and one special character';
    }
    if (!form.role) return 'Please select a role';
    if (form.phonenumber && NON_DIGIT_CHARS.test(form.phonenumber)) return 'Phone number can contain digits only';
    if (form.phonenumber && form.phonenumber.length > 10) return 'Phone number cannot exceed 10 numbers';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateForm();
    if (error) return showWarning('Validation error', error);

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (!payload.phonenumber) {
        delete payload.phonenumber;
      }

      const response = await fetch(`${apiBase}/api/auth/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || data.message || data?.errors?.[0]?.msg || 'Creation failed';
        throw new Error(message);
      }

      setCreatedUser(data.user || null);
      setForm(initialForm);
      await fetchAssignments();
      showSuccess('Success', 'Staff account created successfully.');
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-timetable-page admin-solid-black min-h-screen text-slate-900 antialiased">
      <div className="admin-timetable-bg" aria-hidden="true">
        <span className="admin-bg-orb orb-1" />
        <span className="admin-bg-orb orb-2" />
        <span className="admin-bg-orb orb-3" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r-2 border-dashed border-slate-300/90 bg-white/80 p-6 backdrop-blur-sm lg:flex">
          <div className="mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Admin System</span>
            <h2 className="title-cursive text-2xl text-slate-900">Nexus<span className="text-brand-500">.</span></h2>
          </div>

          <nav className="space-y-1">
            <NavItem to="/dashboard" active label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" label="Role History" icon="📚" />
            <NavItem to="#" label="System Logs" icon="📜" disabled />
          </nav>

          <div className={`${creativeBorderCard} mt-6`}>
            <div className={`${creativeInnerCard} bg-slate-100/80 p-4`}>
              <p className="mb-3 text-xs font-medium uppercase text-slate-500">Session Info</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-semibold">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] font-medium text-green-600">● Online</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-4 md:p-8 lg:p-12">
          <header className="mb-10 flex justify-center">
            <div className="inline-block rounded-xl bg-white px-5 py-4 text-center shadow-sm">
              <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
              <p className="mt-2 text-slate-500">Provision new faculty accounts and manage organizational roles.</p>
            </div>
          </header>

          <div className={`grid gap-8 ${createdUser ? 'xl:grid-cols-3' : ''}`}>
            {/* Form Section */}
            <section className={`${createdUser ? 'xl:col-span-2' : 'mx-auto max-w-4xl'} w-full space-y-6`}>
              <div className="rounded-3xl border-2 border-black p-[1.5px] shadow-lg">
                <div className={`${creativeInnerCard} bg-slate-800/90 p-8`}>
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-white">Account Details</h2>
                    <p className="text-sm text-slate-400">All fields marked with * are mandatory</p>
                  </div>

                  <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} className={inputClasses} required />
                      <input name="email" type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} className={inputClasses} required />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <input name="password" type="password" placeholder="Temporary Password *" value={form.password} onChange={handleChange} className={inputClasses} required />
                      <input name="phonenumber" type="tel" placeholder="Phone (e.g. +123...)" value={form.phonenumber} onChange={handleChange} className={inputClasses} />
                    </div>

                    <select name="role" value={form.role} onChange={handleChange} className={inputClasses} required>
                      <option value="">Select an assigned role *</option>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Processing...
                        </span>
                      ) : 'Register Staff Account'}
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* Sidebar Cards */}
            {createdUser && (
              <aside className="space-y-6">
                <div className="animate-in fade-in slide-in-from-top-4 rounded-3xl bg-gradient-to-br from-emerald-300/90 via-lime-300/80 to-teal-300/90 p-[1.5px] shadow-sm">
                  <div className="rounded-[22px] bg-emerald-50/90 p-6 text-emerald-900">
                    <div className="mb-2 flex items-center gap-2 font-bold">
                      <span className="text-xl">✅</span> Last User Created
                    </div>
                    <div className="space-y-1 text-sm opacity-90">
                      <p><strong>Name:</strong> {createdUser.name}</p>
                      <p><strong>Role:</strong> {createdUser.role}</p>
                      <p className="truncate"><strong>Email:</strong> {createdUser.email}</p>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper Component for Navigation
function NavItem({ label, to, active, icon, disabled }) {
  if (disabled) {
    return (
      <span
        className={`flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium transition-colors ${
          active
            ? 'border-slate-300 bg-slate-100 text-slate-800'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        } opacity-40 cursor-not-allowed`}
      >
        <span className="text-lg">{icon}</span>
        {label}
      </span>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-bold transition-colors ${
        active 
          ? 'border-slate-300 bg-slate-100 text-slate-800' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}