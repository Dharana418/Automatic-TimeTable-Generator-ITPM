import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import backgroundImage from '../assets/room-interior-design.jpg';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

const CHART_COLORS = ['#22d3ee', '#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#f97316', '#f43f5e', '#8b5cf6'];

const formatYearSemester = (year, semester) => {
  const y = formatAcademicYear(year);
  const s = semester ? `S${semester}` : 'S?';
  return `${y} • ${s}`;
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
  const roleKey = normalizeRoleKey(user?.role);
  const canManageModules = roleKey === 'academiccoordinator' || roleKey === 'admin';
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });

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

  const cardModules = useMemo(
    () => [...filteredModules].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime || String(left.code || '').localeCompare(String(right.code || ''));
    }),
    [filteredModules]
  );

  const tableModules = useMemo(() => {
    const list = [...filteredModules];
    const { key, direction } = sortConfig;

    const toComparable = (module) => {
      if (key === 'academicYear') return String(module.academicYear || '').toUpperCase();
      if (key === 'semester') return Number(module.semester || 0);
      if (key === 'credits') return Number(module.credits || 0);
      if (key === 'lecturesPerWeek') return Number(module.lecturesPerWeek || 0);
      if (key === 'createdAt') return module.createdAt ? new Date(module.createdAt).getTime() : 0;
      return String(module[key] || '').toUpperCase();
    };

    list.sort((left, right) => {
      const leftValue = toComparable(left);
      const rightValue = toComparable(right);

      if (leftValue < rightValue) return direction === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredModules, sortConfig]);

  const specializationChartData = useMemo(() => {
    const statsMap = new Map();

    filteredModules.forEach((module) => {
      const specialization = module.department || 'GENERAL';
      const credits = Number(module.credits || 0);
      const lectures = Number(module.lecturesPerWeek || 0);

      if (!statsMap.has(specialization)) {
        statsMap.set(specialization, {
          name: specialization,
          modules: 0,
          creditsTotal: 0,
          lecturesTotal: 0,
        });
      }

      const stat = statsMap.get(specialization);
      stat.modules += 1;
      stat.creditsTotal += Number.isFinite(credits) ? credits : 0;
      stat.lecturesTotal += Number.isFinite(lectures) ? lectures : 0;
    });

    return Array.from(statsMap.values())
      .map((entry) => ({
        ...entry,
        avgCredits: entry.modules ? Number((entry.creditsTotal / entry.modules).toFixed(2)) : 0,
        avgLectures: entry.modules ? Number((entry.lecturesTotal / entry.modules).toFixed(2)) : 0,
      }))
      .sort((left, right) => right.modules - left.modules)
      .slice(0, 8);
  }, [filteredModules]);

  const timelineChartData = useMemo(() => {
    const bucket = new Map();

    filteredModules.forEach((module) => {
      const year = String(module.academicYear || '').trim() || 'N/A';
      const semester = String(module.semester || '').trim() || 'N/A';
      const key = `${year}::${semester}`;

      if (!bucket.has(key)) {
        bucket.set(key, {
          key,
          label: formatYearSemester(year, semester === 'N/A' ? '' : semester),
          year,
          semester,
          modules: 0,
        });
      }

      bucket.get(key).modules += 1;
    });

    const parseYear = (value) => {
      const text = String(value || '');
      const direct = Number(text);
      if (Number.isInteger(direct)) return direct;
      const match = text.match(/(\d{4})/);
      return match ? Number(match[1]) : 0;
    };

    return Array.from(bucket.values()).sort((left, right) => {
      const yDiff = parseYear(left.year) - parseYear(right.year);
      if (yDiff !== 0) return yDiff;
      const sLeft = Number(left.semester) || 0;
      const sRight = Number(right.semester) || 0;
      return sLeft - sRight;
    });
  }, [filteredModules]);

  const topSpecialization = specializationChartData[0]?.name || 'N/A';

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortLabel = (key) => {
    if (sortConfig.key !== key) return 'Sort';
    return sortConfig.direction === 'asc' ? 'Asc' : 'Desc';
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedDepartment('ALL');
    setSelectedYear('ALL');
    setSelectedSemester('ALL');
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Added Modules"
      subtitle="Govern and maintain the academic module registry"
      badge="Governance Control Center"
      footerNote={canManageModules ? 'Use Update for corrections and Delete for retired modules only.' : 'View-only mode: modules are managed by Academic Coordinator.'}
      contentSectionWidthClass="max-w-none"
      contentSectionClassName="lg:w-[calc(100%+21.5rem)] lg:ml-[-21.5rem]"
      sidebarSections={[
        { id: 'addedModulesSummary', label: 'Summary' },
        { id: 'addedModulesFilters', label: 'Filters' },
        { id: 'addedModulesInsights', label: 'Insights' },
        { id: 'addedModulesTable', label: 'Module Table' },
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
        <style>{`
          @keyframes floatPulse {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -8px, 0) scale(1.02); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }

          .added-modules-hero-glow {
            animation: floatPulse 8s ease-in-out infinite;
          }
        `}</style>

        <section
          id="addedModulesSummary"
          className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(130deg,rgba(4,15,30,0.94),rgba(10,26,48,0.9)_50%,rgba(9,40,48,0.72))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur"
        >
          <div className="added-modules-hero-glow pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="added-modules-hero-glow pointer-events-none absolute -bottom-16 left-24 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

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

        <section
          id="addedModulesInsights"
          className="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(6,16,30,0.94),rgba(4,10,23,0.88))] p-5 shadow-[0_24px_68px_rgba(2,6,23,0.48)] backdrop-blur"
        >
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/75">Analytics</p>
              <h3 className="mt-2 text-xl font-black text-white">Advanced Module Insights</h3>
            </div>
            <p className="text-sm text-slate-400">
              Top specialization: <span className="font-semibold text-cyan-100">{topSpecialization}</span>
            </p>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Specialization Distribution</p>
              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={specializationChartData} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.95} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.65} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(2,6,23,0.92)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 12 }}
                      labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="modules" name="Modules" radius={[10, 10, 0, 0]} fill="url(#barGradient)" />
                    <Line yAxisId="right" type="monotone" dataKey="avgCredits" name="Avg Credits" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 3, stroke: '#fbbf24', fill: '#111827' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Volume by Year / Semester</p>
                <div className="mt-4 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineChartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={56} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value}`, 'Modules']}
                        contentStyle={{ backgroundColor: 'rgba(2,6,23,0.92)', border: '1px solid rgba(20,184,166,0.28)', borderRadius: 12 }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                      />
                      <Bar dataKey="modules" radius={[8, 8, 0, 0]}>
                        {timelineChartData.map((entry, index) => (
                          <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Specialization Share</p>
                <div className="mt-4 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={specializationChartData}
                        dataKey="modules"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="rgba(15,23,42,0.8)"
                        strokeWidth={2}
                      >
                        {specializationChartData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, payload) => [`${value} modules`, payload?.payload?.name || 'Specialization']}
                        contentStyle={{ backgroundColor: 'rgba(2,6,23,0.92)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 12 }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
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

        <section id="addedModulesTable" className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-5 shadow-[0_20px_52px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Advanced Table View</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{loading ? 'Loading module archive' : `${tableModules.length} modules in view`}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition ${viewMode === 'table' ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-300 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition ${viewMode === 'cards' ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-300 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'}`}
              >
                Cards
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 space-y-2">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : tableModules.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-900">No academic-coordinator modules match this view.</p>
              <p className="mt-2 text-sm text-slate-500">Try clearing the filters or wait for the academic coordinator to publish more modules.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
              <div className="max-h-[560px] overflow-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] backdrop-blur">
                    <tr className="border-b border-slate-200">
                      {[
                        { label: 'Module Code', key: 'code' },
                        { label: 'Module Name', key: 'name' },
                        { label: 'Specialization', key: 'department' },
                        { label: 'Academic Year', key: 'academicYear' },
                        { label: 'Semester', key: 'semester' },
                        { label: 'Credits', key: 'credits' },
                        { label: 'Lectures/Week', key: 'lecturesPerWeek' },
                        { label: 'Published On', key: 'createdAt' },
                      ].map((column) => (
                        <th key={column.key} className="px-4 py-3 text-left">
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className="group flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:text-sky-700"
                          >
                            <span>{column.label}</span>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${sortConfig.key === column.key ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-300 bg-white text-slate-500 group-hover:text-slate-700'}`}>
                              {getSortLabel(column.key)}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableModules.map((module, index) => {
                      const createdAtLabel = module.createdAt
                        ? new Date(module.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
                        : 'Recently added';

                      return (
                        <tr
                          key={module.id}
                          className={`border-b border-slate-100 transition hover:bg-sky-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 font-bold text-sky-700">{module.code || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-900">{module.name || 'Module name unavailable'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{module.department || 'GENERAL'}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatAcademicYear(module.academicYear)}</td>
                          <td className="px-4 py-3 text-slate-700">{module.semester || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-700">{module.credits || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-700">{module.lecturesPerWeek || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-500">{createdAtLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cardModules.map((module) => (
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
