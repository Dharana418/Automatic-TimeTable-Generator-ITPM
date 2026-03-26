import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, UserPlus, Layers3 } from 'lucide-react';
import { showError, showSuccess, showWarning } from '../utils/alerts.js';

const ROLE_OPTIONS = [
  'Instructor', 'Lecturer', 'Senior Lecturer', 'Assistant Lecturer',
  'Professor', 'LIC', 'Faculty Coordinator', 'Academic Coordinator',
];
const CUSTOM_ROLE_VALUE = '__custom__';

const FORBIDDEN_NAME_CHARS = /[~!@#$%^&*()_+]/;
const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_NUMBER = /\d/;
const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9]/;
const NON_DIGIT_CHARS = /\D/;

const initialForm = { name: '', email: '', password: '', phonenumber: '', role: '', customRole: '' };

const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20";

export default function AdminDashboard({ apiBase, user }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const resolvedRole = form.role === CUSTOM_ROLE_VALUE ? form.customRole.trim() : form.role;
  const requiredFieldsTotal = form.role === CUSTOM_ROLE_VALUE ? 5 : 4;
  const completedRequiredFields = [form.name, form.email, form.password, form.role, form.role === CUSTOM_ROLE_VALUE ? form.customRole : 'ok']
    .filter((value) => String(value || '').trim().length > 0).length;
  const formCompletion = Math.round((completedRequiredFields / requiredFieldsTotal) * 100);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && FORBIDDEN_NAME_CHARS.test(value)) {
      showWarning('Validation', 'Name cannot contain special characters.');
      return;
    }
    if (name === 'phonenumber') {
      if (NON_DIGIT_CHARS.test(value)) return showWarning('Validation', 'Digits only.');
      if (value.length > 10) return showWarning('Validation', 'Max 10 digits.');
    }
    setForm((prev) => {
      if (name === 'role' && value !== CUSTOM_ROLE_VALUE) {
        return { ...prev, role: value, customRole: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 3) return 'Valid name required (min 3 chars).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address.';
    if (form.password.length < 6 || !PASSWORD_HAS_LETTER.test(form.password) || !PASSWORD_HAS_NUMBER.test(form.password) || !PASSWORD_HAS_SPECIAL.test(form.password)) {
      return 'Password must be 6+ chars with a letter, number, and symbol.';
    }
    if (!form.role) return 'Please select a role.';
    if (form.role === CUSTOM_ROLE_VALUE) {
      if (!form.customRole.trim()) return 'Please enter a custom role.';
      if (form.customRole.trim().length < 2 || form.customRole.trim().length > 50) return 'Custom role must be between 2 and 50 characters.';
      if (!/^[A-Za-z][A-Za-z0-9\s]{1,49}$/.test(form.customRole.trim())) return 'Custom role must start with a letter and contain only letters, numbers, and spaces.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateForm();
    if (error) return showWarning('Validation error', error);

    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: resolvedRole,
          name: form.name.trim(),
          email: form.email.trim(),
          customRole: undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Creation failed');

      setCreatedUser(data.user || null);
      setForm(initialForm);
      showSuccess('Success', 'Staff account provisioned.');
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#581c87] font-sans text-white antialiased">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] lg:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-indigo-200 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <KeyRound size={18} className="drop-shadow" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Nexus<span className="text-indigo-300">.</span></h2>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem to="/dashboard" active label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" label="Role History" icon="📜" />
            <NavItem to="#" label="System Logs" icon="🛡️" disabled />
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-4 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-lg shadow-indigo-900/50">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-white">{user?.name || 'Administrator'}</p>
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-6 md:p-10 lg:p-16">
          <header className="mb-8 rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-indigo-200 shadow-lg">
                <KeyRound size={26} className="drop-shadow" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Command Center</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">Staff Provisioning</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">Securely onboard new faculty members and assign departmental roles within the university hierarchy.</p>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={<Layers3 size={18} className="drop-shadow" />} label="Available Roles" value={String(ROLE_OPTIONS.length)} />
            <StatCard icon={<UserPlus size={18} className="drop-shadow" />} label="Users Created" value={createdUser ? '1' : '0'} />
            <StatCard icon={<ShieldCheck size={18} className="drop-shadow" />} label="Form Readiness" value={`${formCompletion}%`} />
          </section>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormGroup label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Dr. Jane Smith" />
                    <FormGroup label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane.s@university.edu" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormGroup label="Temporary Password *" name="password" type="password" value={form.password} onChange={handleChange} />
                    <FormGroup label="Phone Number" name="phonenumber" type="tel" value={form.phonenumber} onChange={handleChange} placeholder="07xxxxxxxx" />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Institutional Role *</label>
                    <select name="role" value={form.role} onChange={handleChange} className={inputClasses} required>
                      <option value="">Choose a role...</option>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value={CUSTOM_ROLE_VALUE}>Custom Role</option>
                    </select>
                  </div>

                  {form.role === CUSTOM_ROLE_VALUE && (
                    <FormGroup
                      label="Custom Role *"
                      name="customRole"
                      value={form.customRole}
                      onChange={handleChange}
                      placeholder="Enter custom role"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Register Staff Account'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Notification */}
            <aside className="space-y-6">
              {createdUser ? (
                <div className="animate-in fade-in zoom-in slide-in-from-right-4 duration-500 rounded-3xl border border-emerald-300/30 bg-emerald-500/20 p-1 shadow-[0_8px_32px_0_rgba(16,185,129,0.35)]">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-2xl">✓</div>
                    <h3 className="text-xl font-extrabold text-white">Creation Successful</h3>
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm text-slate-200">
                      <p><span className="font-semibold text-slate-400">Name:</span> {createdUser.name}</p>
                      <p><span className="font-semibold text-slate-400">Designation:</span> {createdUser.role}</p>
                      <p className="truncate"><span className="font-semibold text-slate-400">ID/Email:</span> {createdUser.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-6 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                  <h4 className="font-extrabold text-white">Security Note</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">Temporary passwords should be changed by the staff member upon their first login to ensure account integrity.</p>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function FormGroup({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{label}</label>
      <input {...props} className={inputClasses} />
    </div>
  );
}

function NavItem({ label, to, active, icon, disabled }) {
  const base = "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200";
  if (disabled) return <div className={`${base} cursor-not-allowed opacity-30 grayscale text-slate-400`}><span className="text-lg">{icon}</span>{label}</div>;
  return (
    <Link to={to} className={`${base} ${active ? 'bg-indigo-500/20 text-indigo-200 shadow-sm shadow-indigo-900/30' : 'text-slate-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:shadow-sm'} active:scale-95`}>
      <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
      {label}
    </Link>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <article className="rounded-2xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
    </article>
  );
}