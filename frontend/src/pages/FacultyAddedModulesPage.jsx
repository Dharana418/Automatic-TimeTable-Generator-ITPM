import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import backgroundImage from '../assets/room-interior-design.jpg';

const normalizeDep = (value = '') => String(value || '').trim().toUpperCase();

const parseDetails = (details) => {
  if (!details) return {};
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
};

const inferDep = (code = '') => {
  const match = String(code || '').trim().match(/^([A-Za-z]+)/);
  if (!match) return 'GENERAL';
  const p = match[1].toUpperCase();
  const depMap = { IT: 'IT', SE: 'SE', IE: 'IME', CS: 'CS', CN: 'CN', IM: 'IME', DS: 'DS' };
  return depMap[p] || p;
};

const getDep = (module = {}) => {
  const dep = module.department || module.department_id || module.departmentId || module.specialization || module.specialization_id || module.stream;
  return dep ? normalizeDep(dep) : inferDep(module.code);
};

const toView = (module = {}) => {
  const details = parseDetails(module.details);
  return {
    id: String(module.id || `${module.code}-${module.name}`),
    code: String(module.code || module.id || '').trim(),
    name: String(module.name || module.title || module.code || 'Untitled Module').trim(),
    department: normalizeSpecialization(getDep(module)),
    credits: module.credits || details.credits || '',
    lecturesPerWeek: module.lectures_per_week || details.lectures_per_week || '',
    academicYear: String(module.academic_year || details.academic_year || ''),
    semester: String(module.semester || details.semester || ''),
    createdAt: module.created_at || module.createdAt || null,
    createdBy: module.created_by || module.createdBy || null,
    creatorName: module.created_by_name || module.createdByName || '',
    creatorRole: module.created_by_role || module.createdByRole || '',
  };
};

const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeSpecialization = (value = '') => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return 'GENERAL';

  const aliases = {
    SOFTWAREENGINEERING: 'SE',
    SOFTWARE_ENG: 'SE',
    INFORMATIONTECHNOLOGY: 'IT',
    INTERACTIVEMEDIA: 'IME',
    COMPUTERSCIENCE: 'CS',
    INFORMATIONSYSTEMSENGINEERING: 'ISE',
    COMPUTER_SYSTEMS_NETWORK_ENGINEERING: 'CSNE',
    INFORMATICS: 'IM',
    IM: 'IME',
    IE: 'IME',
    CYBERSECURITY: 'CYBER SECURITY',
    CYBER: 'CYBER SECURITY',
    GENERAL: 'GENERAL',
  };

  const compact = normalized.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || normalized;
};

const isAcademicCoordinatorModule = (module) => {
  const creatorRole = normalizeRoleKey(module.creatorRole);
  if (creatorRole === 'academiccoordinator') {
    return true;
  }

  const details = parseDetails(module.details);
  const source = normalizeRoleKey(details.source || details.created_by_role || details.creator_role || '');

  if (source.includes('catalog') || source.includes('academiccoordinator')) {
    return true;
  }

  return !module.createdBy;
};

const formatAcademicYear = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'N/A';
  return text.includes('-') ? text.replace('-', ' - ') : text;
};

const StatCard = ({ label, value, helper, tone = 'cyan' }) => {
  const toneStyles = {
    cyan: 'from-cyan-500/20 to-sky-500/10 text-cyan-100 border-cyan-300/15',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-100 border-emerald-300/15',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-100 border-amber-300/15',
    indigo: 'from-indigo-500/20 to-slate-500/10 text-indigo-100 border-indigo-300/15',
  };

  return (
    <div className={`rounded-3xl border bg-gradient-to-br px-5 py-4 shadow-[0_18px_38px_rgba(2,6,23,0.32)] backdrop-blur ${toneStyles[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">{label}</p>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      {helper && <p className="mt-2 text-xs leading-5 text-white/68">{helper}</p>}
    </div>
  );
};

const ModuleCard = ({ module }) => {
  const createdAtLabel = module.createdAt ? new Date(module.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }) : 'Recently added';

  return (
    <article className="group rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_20px_46px_rgba(2,6,23,0.35)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Module Code</p>
          <h3 className="mt-2 text-lg font-bold text-white">{module.code || 'Untitled'}</h3>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-100">
          Published
        </span>
      </div>

      <p className="mt-4 text-base font-medium leading-6 text-slate-100">{module.name || 'Module name unavailable'}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-100">
          {module.department || 'GENERAL'}
        </span>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-200">
          Year {formatAcademicYear(module.academicYear)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-200">
          Semester {module.semester || 'N/A'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-200">
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Credits</p>
          <p className="mt-1 font-semibold text-white">{module.credits || 'N/A'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Lectures / Week</p>
          <p className="mt-1 font-semibold text-white">{module.lecturesPerWeek || 'N/A'}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-300">
        <span>{module.creatorName ? `Academic Coordinator: ${module.creatorName}` : 'Academic Coordinator published'}</span>
        <span>{createdAtLabel}</span>
      </div>
    </article>
  );
};

const FacultyAddedModulesPage = ({ user }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.listItems('modules');
      const items = Array.isArray(response?.items) ? response.items : [];
      setModules(items.map(toView));
    } catch (err) {
      setError(err.message || 'Failed to load module catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const strictCoordinatorModules = useMemo(
    () => modules.filter((module) => isAcademicCoordinatorModule(module)),
    [modules]
  );

  const usingMetadataFallback = strictCoordinatorModules.length === 0 && modules.length > 0;

  const coordinatorModules = useMemo(
    () => (strictCoordinatorModules.length > 0 ? strictCoordinatorModules : modules),
    [strictCoordinatorModules, modules]
  );

  const departments = useMemo(() => {
    const set = new Set(coordinatorModules.map((module) => module.department).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [coordinatorModules]);

  const years = useMemo(() => {
    const set = new Set(coordinatorModules.map((module) => module.academicYear).filter(Boolean));
    return ['ALL', ...Array.from(set).sort((left, right) => String(left).localeCompare(String(right)))];
  }, [coordinatorModules]);

  const semesters = useMemo(() => {
    const set = new Set(coordinatorModules.map((module) => module.semester).filter(Boolean));
    return ['ALL', ...Array.from(set).sort((left, right) => Number(left) - Number(right))];
  }, [coordinatorModules]);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return coordinatorModules.filter((module) => {
      const matchDepartment = selectedDepartment === 'ALL' || module.department === selectedDepartment;
      const matchYear = selectedYear === 'ALL' || module.academicYear === selectedYear;
      const matchSemester = selectedSemester === 'ALL' || module.semester === selectedSemester;
      const searchableText = [
        module.code,
        module.name,
        module.department,
        module.academicYear,
        module.semester,
        module.creatorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchDepartment && matchYear && matchSemester && (!query || searchableText.includes(query));
    });
  }, [coordinatorModules, search, selectedDepartment, selectedYear, selectedSemester]);

  const summaryStats = useMemo(() => {
    const averageCredits = filteredModules.filter((module) => Number(module.credits) > 0);
    const averageLectures = filteredModules.filter((module) => Number(module.lecturesPerWeek) > 0);

    return {
      published: coordinatorModules.length,
      visible: filteredModules.length,
      departments: new Set(coordinatorModules.map((module) => module.department)).size,
      avgCredits: averageCredits.length
        ? (averageCredits.reduce((total, module) => total + Number(module.credits || 0), 0) / averageCredits.length).toFixed(1)
        : '0.0',
      avgLectures: averageLectures.length
        ? (averageLectures.reduce((total, module) => total + Number(module.lecturesPerWeek || 0), 0) / averageLectures.length).toFixed(1)
        : '0.0',
    };
  }, [coordinatorModules, filteredModules]);

  const sortedModules = useMemo(
    () => [...filteredModules].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime || String(left.code || '').localeCompare(String(right.code || ''));
    }),
    [filteredModules]
  );

  const clearFilters = () => {
    setSearch('');
    setSelectedDepartment('ALL');
    setSelectedYear('ALL');
    setSelectedSemester('ALL');
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Academic Coordinator Added Modules"
      subtitle="Read-only catalogue of modules published from the academic coordinator side"
      backgroundImage={backgroundImage}
      brandTitle="Academic Coordinator"
      brandSubtitle="Published Module Archive"
      badge="Read-Only Catalogue"
      themeVariant="academic"
      footerNote="Only modules added by the academic coordinator are shown here."
      sidebarSections={[
        { id: 'addedModulesSummary', label: 'Summary' },
        { id: 'addedModulesFilters', label: 'Filters' },
        { id: 'addedModulesTable', label: 'Module Cards' },
      ]}
      headerActions={
        <button
          type="button"
          onClick={loadModules}
          className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-emerald-100 transition hover:bg-emerald-500/20"
        >
          Refresh
        </button>
      }
    >
      <div className="fc-layout-stack fc-layout-stack-tight">
        <section
          id="addedModulesSummary"
          className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(4,15,30,0.92),rgba(10,26,48,0.82))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">Governance Ledger</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Academic Coordinator Added Modules</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                A clean, read-only archive of modules published from the academic coordinator side. Use the filters to narrow the list by specialization, year, semester, or text search.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right text-xs text-slate-300 sm:min-w-[260px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Visible</p>
                <p className="mt-1 text-2xl font-black text-white">{summaryStats.visible}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Published</p>
                <p className="mt-1 text-2xl font-black text-white">{summaryStats.published}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Published modules" value={summaryStats.published} helper="Modules available in the academic coordinator archive." tone="emerald" />
          <StatCard label="Visible in view" value={summaryStats.visible} helper="Matches your current filters." tone="cyan" />
          <StatCard label="Specializations" value={summaryStats.departments} helper="Unique module streams currently displayed." tone="indigo" />
          <StatCard label="Avg. workload" value={`${summaryStats.avgCredits} / ${summaryStats.avgLectures}`} helper="Credits and lectures per week in the filtered set." tone="amber" />
        </section>

        <section id="addedModulesFilters" className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_44px_rgba(2,6,23,0.28)] backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, name, coordinator, or year"
                className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/50"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Specialization</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-slate-950/50"
              >
                {departments.map((dep) => (
                  <option key={dep} value={dep} className="bg-slate-950 text-white">
                    {dep === 'ALL' ? 'All specializations' : dep}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Academic year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-slate-950/50"
              >
                {years.map((year) => (
                  <option key={year} value={year} className="bg-slate-950 text-white">
                    {year === 'ALL' ? 'All years' : formatAcademicYear(year)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-slate-950/50"
              >
                {semesters.map((semester) => (
                  <option key={semester} value={semester} className="bg-slate-950 text-white">
                    {semester === 'ALL' ? 'All semesters' : `Semester ${semester}`}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
            {error}
          </div>
        )}

        {usingMetadataFallback && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Showing module records using fallback mode because creator metadata is incomplete in existing data.
          </div>
        )}

        <section id="addedModulesTable" className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(3,10,20,0.92),rgba(8,18,34,0.9))] p-5 shadow-[0_22px_58px_rgba(2,6,23,0.42)] backdrop-blur">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Module Cards</p>
              <h3 className="mt-2 text-xl font-bold text-white">{loading ? 'Loading module archive' : `${sortedModules.length} modules in view`}</h3>
            </div>
            <p className="text-sm text-slate-400">Only modules published by the academic coordinator are shown.</p>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-[28px] border border-white/8 bg-white/5" />
              ))}
            </div>
          ) : sortedModules.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">No academic-coordinator modules match this view.</p>
              <p className="mt-2 text-sm text-slate-400">Try clearing the filters or wait for the academic coordinator to publish more modules.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          )}
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyAddedModulesPage;
