import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, UserRound, Phone } from 'lucide-react';
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
  return parsed.toLocaleString();
};

export default function FacultyStaffDirectoryPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label).push(person);
    });

    return DISPLAY_ROLE_ORDER.map((role) => ({ role, users: map.get(role) || [] }));
  }, [staff]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Faculty Coordination</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Staff Directory</h1>
            <p className="mt-1 text-sm text-slate-600">Lecturers, Senior Lecturers, Instructors, LIC, and Professors added by Admin.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/faculty-coordinator')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Total Staff</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{staff.length}</p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">Loading staff directory...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{error}</div>
        ) : (
          <div className="space-y-5">
            {grouped.map((section) => (
              <section key={section.role} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-semibold text-slate-900">{section.role}s</h2>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">{section.users.length}</span>
                </div>

                {section.users.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-500">No {section.role.toLowerCase()} records found.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {section.users.map((person) => (
                      <div key={person.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{person.name || 'Unnamed Staff'}</p>
                          <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs text-slate-600">
                            <Mail size={12} />
                            {person.email || 'No email'}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} />
                              {person.phonenumber || 'No phone'}
                            </span>
                            <span>Assigned: {formatDateTime(person.role_assigned_at || person.created_at)}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <UserRound size={12} />
                          {toRoleLabel(person.role)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
