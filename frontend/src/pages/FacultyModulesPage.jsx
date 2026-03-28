import { useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

const normalizeDepartment = (value = '') => String(value || '').trim().toUpperCase();

const inferDepartmentFromCode = (code = '') => {
  const match = String(code || '').trim().match(/^([A-Za-z]+)/);
  if (!match) return 'GENERAL';

  const prefix = match[1].toUpperCase();
  if (prefix === 'IT') return 'IT';
  if (prefix === 'SE') return 'SE';
  if (prefix === 'IE') return 'ISE';
  if (prefix === 'CS') return 'CS';
  if (prefix === 'CN') return 'CN';
  if (prefix === 'IM') return 'IM';
  if (prefix === 'DS') return 'DS';
  return prefix;
};

const getModuleDepartment = (moduleItem = {}) => {
  const directDepartment =
    moduleItem.department ||
    moduleItem.department_id ||
    moduleItem.departmentId ||
    moduleItem.specialization ||
    moduleItem.specialization_id ||
    moduleItem.stream;

  if (directDepartment) return normalizeDepartment(directDepartment);
  return inferDepartmentFromCode(moduleItem.code);
};

const toModuleView = (moduleItem = {}) => {
  const code = String(moduleItem.code || moduleItem.id || '').trim();
  const name = String(moduleItem.name || moduleItem.title || moduleItem.code || 'Untitled Module').trim();
  const department = getModuleDepartment(moduleItem);

  return {
    id: String(moduleItem.id || `${code}-${name}`),
    code,
    name,
    department,
    credits: moduleItem.credits,
    lectures_per_week: moduleItem.lectures_per_week,
  };
};

const departmentPill = {
  IT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  SE: 'bg-violet-100 text-violet-800 border-violet-200',
  DS: 'bg-amber-100 text-amber-800 border-amber-200',
  ISE: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  CS: 'bg-blue-100 text-blue-800 border-blue-200',
  IM: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CN: 'bg-slate-200 text-slate-800 border-slate-300',
  GENERAL: 'bg-slate-100 text-slate-700 border-slate-200',
};

const FacultyModulesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';
  const [modules, setModules] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadModules = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await api.listItems('modules');
        if (!mounted) return;

        const items = Array.isArray(response?.items) ? response.items : [];
        setModules(items.map(toModuleView));
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error.message || 'Failed to load modules.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadModules();
    return () => {
      mounted = false;
    };
  }, []);

  const departments = useMemo(() => {
    const all = new Set(modules.map((moduleItem) => moduleItem.department).filter(Boolean));
    return ['ALL', ...Array.from(all).sort()];
  }, [modules]);

  const filteredModules = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return modules.filter((moduleItem) => {
      const matchesDepartment = selectedDepartment === 'ALL' || moduleItem.department === selectedDepartment;
      const searchable = `${moduleItem.code} ${moduleItem.name} ${moduleItem.department}`.toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      return matchesDepartment && matchesSearch;
    });
  }, [modules, selectedDepartment, searchText]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Department Module Control"
      subtitle="Filter, inspect, and monitor modules by department and instructional load"
      badge="Module Management"
    >
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white/88 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Module Ledger</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Department Modules</h2>
          <p className="mt-2 text-sm text-slate-600">{displayName} can review and filter module inventory by department and code.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Search</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                placeholder="Search by module code or name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Department</span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department === 'ALL' ? 'All Departments' : department}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Count</span>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xl font-semibold text-slate-900">
                {filteredModules.length}
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMessage}</p>
        )}

        {isLoading && <p className="text-center text-sm font-semibold text-slate-500">Loading modules...</p>}

        {!isLoading && filteredModules.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-600">
            No modules found for the selected filters.
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((moduleItem) => {
            const badgeStyle = departmentPill[moduleItem.department] || departmentPill.GENERAL;
            return (
              <article
                key={moduleItem.id}
                className="rounded-3xl border border-slate-200 bg-white/92 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{moduleItem.code || moduleItem.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{moduleItem.name}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}>
                    {moduleItem.department || 'GENERAL'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {moduleItem.credits ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {moduleItem.credits} credits
                    </span>
                  ) : null}
                  {moduleItem.lectures_per_week ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {moduleItem.lectures_per_week}/week
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyModulesPage;
