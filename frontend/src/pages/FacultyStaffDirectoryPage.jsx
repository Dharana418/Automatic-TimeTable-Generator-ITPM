import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Search, Users } from 'lucide-react';
import { getStaffDirectory } from '../api/auth.js';

const DISPLAY_ROLE_ORDER = ['Lecturer', 'Senior Lecturer', 'Instructor', 'LIC', 'Professor'];

const toRoleLabel = (role) => {
  const normalized = String(role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'lecturer') return 'Lecturer';
  if (normalized === 'seniorlecturer') return 'Senior Lecturer';
  if (normalized === 'instructor') return 'Instructor';
  if (normalized === 'lic' || normalized === 'liccoordinator') return 'LIC';
  if (normalized === 'professor') return 'Professor';
  return role || 'Other';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
};

const ROLE_PLURALS = {
  'Lecturer': 'Lecturers',
  'Senior Lecturer': 'Senior Lecturers',
  'Instructor': 'Instructors',
  'LIC': 'LICs',
  'Professor': 'Professors',
};

const pluralizeRole = (role) => ROLE_PLURALS[role] || `${role}s`;

const ROLE_COLORS = {
  'Lecturer': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-600' },
  'Senior Lecturer': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-600' },
  'Instructor': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-600' },
  'LIC': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-600' },
  'Professor': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-600' },
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function FacultyStaffDirectoryPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');

  useEffect(() => {
    let mounted = true;

    async function loadDirectory() {
      try {
        setLoading(true);
        setError('');
        const response = await getStaffDirectory();
        if (mounted) {
          setStaff(Array.isArray(response?.users) ? response.users : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load staff directory');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDirectory();

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    DISPLAY_ROLE_ORDER.forEach((role) => map.set(role, []));
    staff.forEach((person) => {
      const label = toRoleLabel(person.role);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(person);
    });
    return DISPLAY_ROLE_ORDER.map((role) => ({ role, users: map.get(role) || [] }));
  }, [staff]);

  const filteredGrouped = useMemo(() => {
    return grouped
      .filter((section) => activeRole === 'all' || section.role === activeRole)
      .map((section) => ({
        ...section,
        users: section.users.filter(
          (person) =>
            !search ||
            (person.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (person.email || '').toLowerCase().includes(search.toLowerCase()),
        ),
      }));
  }, [grouped, search, activeRole]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Faculty Coordination</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Staff Directory</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/faculty-coordinator')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Stats Banner */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-800 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Users className="h-10 w-10 text-indigo-300" strokeWidth={1.5} />
              <div>
                <p className="text-3xl font-extrabold">{staff.length}</p>
                <p className="text-xs font-medium text-indigo-200">Total Staff Members</p>
              </div>
            </div>
            <div className="h-10 w-px bg-white/20 hidden sm:block" />
            {grouped.map(({ role, users }) => (
              users.length > 0 && (
                <div key={role} className="text-center">
                  <p className="text-lg font-bold">{users.length}</p>
                  <p className="text-[10px] font-medium text-indigo-200">{pluralizeRole(role)}</p>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveRole('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeRole === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              All
            </button>
            {DISPLAY_ROLE_ORDER.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeRole === role ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Loading staff directory...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">{error}</div>
        ) : (
          <div className="space-y-6">
            {filteredGrouped.map((section) => {
              if (section.users.length === 0 && (search || activeRole !== 'all')) return null;
              const colors = ROLE_COLORS[section.role] || ROLE_COLORS['Lecturer'];
              return (
                <section key={section.role} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Section header */}
                  <div className={`flex items-center justify-between border-b border-slate-100 px-5 py-4 ${colors.bg}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.badge} text-[10px] font-bold text-white`}>
                        {section.role.slice(0, 1)}
                      </div>
                      <h2 className={`text-sm font-bold ${colors.text}`}>{pluralizeRole(section.role)}</h2>
                    </div>
                    <span className={`rounded-full ${colors.badge} px-2.5 py-0.5 text-[10px] font-bold text-white`}>
                      {section.users.length}
                    </span>
                  </div>

                  {section.users.length === 0 ? (
                    <p className="px-5 py-5 text-sm text-slate-400">No {pluralizeRole(section.role).toLowerCase()} found.</p>
                  ) : (
                    <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
                      {section.users.map((person) => (
                        <div key={person.id} className="flex items-start gap-4 bg-white p-4 transition hover:bg-slate-50">
                          {/* Avatar */}
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text} text-sm font-bold`}>
                            {getInitials(person.name)}
                          </div>
                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{person.name || 'Unnamed Staff'}</p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                              <Mail size={11} />
                              {person.email || 'No email'}
                            </p>
                            {person.phonenumber && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Phone size={11} />
                                {person.phonenumber}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                              Since {formatDateTime(person.role_assigned_at || person.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            {filteredGrouped.every((s) => s.users.length === 0) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-600">No staff found</p>
                <p className="mt-1 text-xs text-slate-400">Try a different search or filter.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
