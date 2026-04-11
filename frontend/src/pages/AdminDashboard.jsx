import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, UserPlus, Layers3, UserCog, BadgeCheck, ChartNoAxesCombined } from 'lucide-react';
import { showError, showSuccess, showWarning } from '../utils/alerts.js';
import adminBgImage from '../assets/2151998492.jpg';

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
const VALID_NAME_CHARS = /^[A-Za-z][A-Za-z\s'.-]{2,99}$/;

const initialForm = { name: '', email: '', password: '', phonenumber: '', role: '', customRole: '' };

const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const detectHumanLikeNameIssue = (rawName) => {
  const name = String(rawName || '').trim();

  if (!name || name.length < 3) return 'Valid name required (min 3 chars).';
  if (!VALID_NAME_CHARS.test(name)) return 'Name can contain only letters, spaces, apostrophes, dots, and hyphens.';

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return 'Please enter full name (first and last name).';

  const shortPart = parts.find((part) => part.replace(/[^A-Za-z]/g, '').length < 2);
  if (shortPart) return 'Each name part should contain at least 2 letters.';

  const lettersOnly = name.toLowerCase().replace(/[^a-z]/g, '');
  if (lettersOnly.length < 4) return 'Please enter a realistic full name.';
  if (/(.)\1{3,}/.test(lettersOnly)) return 'Name looks invalid. Please enter a realistic human name.';
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(lettersOnly)) return 'Name looks invalid. Please enter a realistic human name.';
  if (/[aeiou]{5,}/.test(lettersOnly)) return 'Name looks invalid. Please enter a realistic human name.';

  const uniqueChars = new Set(lettersOnly).size;
  if (lettersOnly.length >= 8 && uniqueChars <= 3) {
    return 'Name appears repetitive. Please enter a realistic human name.';
  }

  const vowelCount = (lettersOnly.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowelCount / lettersOnly.length;
  if (vowelCount < 2 || vowelRatio < 0.2 || vowelRatio > 0.8) {
    return 'Name does not look human-like. Please enter a realistic full name.';
  }

  return null;
};

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
    const nameIssue = detectHumanLikeNameIssue(form.name);
    if (nameIssue) return nameIssue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address.';
    if (form.password.length < 8 || !PASSWORD_HAS_LETTER.test(form.password) || !PASSWORD_HAS_NUMBER.test(form.password) || !PASSWORD_HAS_SPECIAL.test(form.password)) {
      return 'Password must be 8+ chars with a letter, number, and symbol.';
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
    <div className="relative min-h-full overflow-hidden bg-slate-100 text-slate-900 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${adminBgImage})`, backgroundPosition: 'center 30%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/35 via-slate-100/50 to-slate-100/65" />
        <div className="absolute -top-28 left-10 h-80 w-80 rounded-full bg-indigo-200/45 blur-3xl" />
        <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-full max-w-[1600px] lg:grid-cols-[290px_1fr]">
        <aside className="hidden h-full flex-col border-r border-slate-200/70 bg-slate-900 px-6 py-8 lg:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-cyan-300 shadow-sm">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">University Admin</p>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Control Suite</h2>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            <NavItem to="/dashboard" active label="Create Staff" icon={UserCog} />
            <NavItem to="/admin/role-history" label="Role History" icon={ChartNoAxesCombined} />
            <NavItem to="#" label="System Logs" icon={ShieldCheck} disabled />
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-700 bg-slate-800/95 p-4 shadow-xl shadow-slate-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold uppercase text-white shadow-md shadow-indigo-500/40">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'Administrator'}</p>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="px-4 py-6 sm:px-6 md:px-10 lg:px-14 lg:py-10">
          <header className="mb-8 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-300/45 backdrop-blur md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/40">
                  <KeyRound size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin Command Center</p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Staff Provisioning Console</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-600">Create and assign staff accounts with secure credential policy controls for your academic operations.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/85 px-4 py-3 text-sm font-semibold text-indigo-700">
                Readiness: <span className="text-indigo-900">{formCompletion}%</span>
              </div>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={<Layers3 size={18} />} label="Available Roles" value={String(ROLE_OPTIONS.length)} />
            <StatCard icon={<UserPlus size={18} />} label="Users Created" value={createdUser ? '1' : '0'} />
            <StatCard icon={<ShieldCheck size={18} />} label="Form Readiness" value={`${formCompletion}%`} />
          </section>

          <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-300/35 backdrop-blur md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <BadgeCheck className="text-indigo-600" size={20} />
                <h2 className="text-lg font-extrabold text-slate-900">Create New Staff Account</h2>
              </div>

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
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Institutional Role *</label>
                  <select name="role" value={form.role} onChange={handleChange} className={inputClasses} required>
                    <option value="">Choose a role...</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-400/40 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-cyan-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Processing...' : 'Register Staff Account'}
                </button>
              </form>
            </section>

            <aside className="space-y-5">
              {createdUser ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-lg shadow-emerald-200/50">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
                  <h3 className="text-xl font-extrabold text-emerald-900">Creation Successful</h3>
                  <div className="mt-4 space-y-3 border-t border-emerald-200 pt-4 text-sm text-emerald-800">
                    <p><span className="font-semibold text-emerald-700">Name:</span> {createdUser.name}</p>
                    <p><span className="font-semibold text-emerald-700">Designation:</span> {createdUser.role}</p>
                    <p className="truncate"><span className="font-semibold text-emerald-700">ID/Email:</span> {createdUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-300/30 backdrop-blur">
                  <h4 className="font-extrabold text-slate-900">Security Note</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">Temporary passwords should be changed by the staff member on first login to maintain institutional account security.</p>
                </div>
              )}

              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/80 p-6 shadow-lg shadow-cyan-200/35">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-cyan-800">Policy Reminder</h4>
                <p className="mt-2 text-sm text-cyan-900/80">Use role naming conventions consistently to keep reporting and access control records accurate.</p>
              </div>
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
      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <input {...props} className={inputClasses} />
    </div>
  );
}

function NavItem({ label, to, active, icon, disabled }) {
  const base = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200";
  const Icon = icon;
  if (disabled) return <div className={`${base} cursor-not-allowed opacity-30 grayscale text-slate-400`}><span>{Icon ? <Icon size={16} /> : null}</span>{label}</div>;
  return (
    <Link to={to} className={`${base} ${active ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-700/35' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} active:scale-[0.99]`}>
      <span className={`transition-transform ${active ? 'scale-110' : ''}`}>{Icon ? <Icon size={16} /> : null}</span>
      {label}
    </Link>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-300/30 backdrop-blur">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
    </article>
  );
}
