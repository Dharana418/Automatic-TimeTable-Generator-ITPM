import { useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';

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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50 to-teal-50 p-4 md:p-6 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 opacity-12 blur-3xl animate-float-medium" />
      <div className="pointer-events-none absolute left-1/3 -bottom-40 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400 to-green-500 opacity-15 blur-3xl animate-float-slow-reverse" />

      <div className="pointer-events-none absolute inset-0 bg-grid opacity-3 animate-grid-shift" />
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-lg backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-2xl shadow-lg">📚</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Faculty Coordinator</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Department Modules</h1>
              <p className="mt-1 text-sm text-slate-600">
                {displayName} can view modules added by Academic Coordinator and filter them by department.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 shadow-lg backdrop-blur">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">🔍 Search</label>
              <input
                className="mt-2 w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 hover:border-emerald-300"
                placeholder="Search by module code or name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">🏷️ Department</label>
              <select
                className="mt-2 w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 hover:border-emerald-300"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department === 'ALL' ? 'All Departments' : department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">📊 Count</label>
              <div className="mt-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3 text-center text-xl font-bold text-white shadow-lg">
                {filteredModules.length}
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 px-4 py-3 text-sm font-semibold text-red-700">❌ {errorMessage}</p>
          )}

          {isLoading && <p className="mt-4 text-center text-sm font-semibold text-slate-600">⏳ Loading modules...</p>}

          {!isLoading && filteredModules.length === 0 && (
            <p className="mt-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 text-center text-sm font-semibold text-slate-600">
              😴 No modules found for the selected filters.
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((moduleItem, idx) => {
              const colorGradients = [
                'from-purple-500 to-pink-500',
                'from-emerald-500 to-teal-500',
                'from-cyan-500 to-blue-500',
                'from-orange-500 to-rose-500',
                'from-indigo-500 to-purple-500',
                'from-rose-500 to-pink-500',
                'from-teal-500 to-green-500',
                'from-amber-500 to-orange-500',
              ];
              const gradient = colorGradients[idx % colorGradients.length];
              return (
                <article key={moduleItem.id} className="group rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-md transition hover:-translate-y-2 hover:shadow-xl hover:border-emerald-300">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{moduleItem.code || moduleItem.name}</h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{moduleItem.name}</p>
                    </div>
                    <span className={`bg-gradient-to-br ${gradient} rounded-2xl px-3 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap`}>
                      {moduleItem.department || 'GENERAL'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {moduleItem.credits ? (
                      <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-700">
                        💳 {moduleItem.credits} credits
                      </span>
                    ) : null}
                    {moduleItem.lectures_per_week ? (
                      <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-700">
                        📅 {moduleItem.lectures_per_week}/week
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FacultyModulesPage;
