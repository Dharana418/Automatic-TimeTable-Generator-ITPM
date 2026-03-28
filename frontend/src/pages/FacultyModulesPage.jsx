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
    <div className="min-h-screen bg-white p-4 md:p-6 dark:bg-black">
      <div className="mx-auto max-w-7xl space-y-3">
        <header className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Faculty Coordinator</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Department Modules</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {displayName} can view modules added by Academic Coordinator and filter them by department.
          </p>
        </header>

        <section className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="grid gap-2 md:grid-cols-[1.2fr_0.8fr_auto]">
            <input
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-1 focus:ring-[#059669] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              placeholder="Search by module code or name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <select
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#059669] focus:ring-1 focus:ring-[#059669] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((department) => (
                <option key={department} value={department} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
                  {department === 'ALL' ? 'All Departments' : department}
                </option>
              ))}
            </select>

            <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {filteredModules.length}
            </div>
          </div>

          {errorMessage && (
            <p className="mt-3 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{errorMessage}</p>
          )}

          {isLoading && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading modules...</p>}

          {!isLoading && filteredModules.length === 0 && (
            <p className="mt-3 border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              No modules found for the selected filters.
            </p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((moduleItem) => (
              <article key={moduleItem.id} className="border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{moduleItem.code || moduleItem.name}</h3>
                  <span className="border border-gray-300 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {moduleItem.department || 'GENERAL'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{moduleItem.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  {moduleItem.credits ? (
                    <span className="border border-gray-300 bg-gray-50 px-2 py-0.5 dark:border-gray-700 dark:bg-gray-900">Credits: {moduleItem.credits}</span>
                  ) : null}
                  {moduleItem.lectures_per_week ? (
                    <span className="border border-gray-300 bg-gray-50 px-2 py-0.5 dark:border-gray-700 dark:bg-gray-900">
                      Lectures/Week: {moduleItem.lectures_per_week}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FacultyModulesPage;
