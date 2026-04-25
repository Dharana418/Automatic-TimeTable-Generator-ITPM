import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/* ---------------- ICONS ---------------- */
const Icon = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 0 0-4-4H5"/></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><polyline points="9 18 15 12 9 6"/></svg>,
  menu: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5"><line x1="3" y1="12" x2="21"/><line x1="3" y1="6" x2="21"/><line x1="3" y1="18" x2="21"/></svg>,
  bell: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18"/></svg>,
};

/* ---------------- NAV ---------------- */
const getRoleNav = (roleKey) => {
  const common = [{ id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: Icon.grid }];

  if (roleKey === 'academiccoordinator') {
    return [
      ...common,
      { id: 'academic-modules', label: 'Module Registry', to: '/academic/modules', icon: Icon.book },
      { id: 'academic-personnel', label: 'Personnel', to: '/academic/personnel', icon: Icon.users },
      { id: 'academic-assignments', label: 'Assignments', to: '/academic/assignments', icon: Icon.calendar },
      { id: 'academic-calendar', label: 'Calendar', to: '/academic/calendar', icon: Icon.calendar },
      { id: 'academic-timetables', label: 'Time Tables', to: '/academic/timetables', icon: Icon.calendar },
      { id: 'academic-conflicts', label: 'Conflicts', to: '/academic/conflicts', icon: Icon.warning },
      { id: 'academic-halls', label: 'Hall Allocation', to: '/faculty/hall-allocations', icon: Icon.grid },
      { id: 'shared-added-modules', label: 'Added Modules', to: '/faculty/modules/added', icon: Icon.book },
    ];
  }

  if (roleKey === 'facultycoordinator') {
    return [
      ...common,
      { id: 'scheduler', label: 'Scheduler', to: '/scheduler/by-year', icon: Icon.calendar },
      { id: 'faculty-modules', label: 'Modules', to: '/faculty/modules', icon: Icon.book },
      { id: 'faculty-added-modules', label: 'Added Modules', to: '/faculty/modules/added', icon: Icon.book },
      { id: 'faculty-batches', label: 'Batches', to: '/faculty/batches', icon: Icon.users },
      { id: 'faculty-report', label: 'Timetable Report', to: '/faculty/timetable-report', icon: Icon.calendar },
    ];
  }

  if (roleKey === 'admin') {
    return [
      ...common,
      { id: 'admin-role-history', label: 'Role History', to: '/admin/role-history', icon: Icon.shield },
    ];
  }

  return common;
};

const getRoleWorkspaceLabel = (roleKey) => {
  if (roleKey === 'academiccoordinator') return 'Academic Governance Workspace';
  if (roleKey === 'facultycoordinator') return 'Faculty Scheduling Workspace';
  if (roleKey === 'admin') return 'Administration Workspace';
  if (roleKey === 'lic') return 'LIC Workspace';
  if (roleKey === 'instructor') return 'Instructor Workspace';
  return 'Unified Academic Workspace';
};

/* ---------------- COMPONENT ---------------- */

export default function FacultyCoordinatorShell({
  user,
  title,
  subtitle,
  children,
  brandCode = 'FC',
  brandTitle = 'Faculty Coordinator',
  brandSubtitle = 'Scheduling Console',
  badge = 'Faculty Workspace',
  backgroundImage = null,
  footerNote = 'Faculty coordinator workspace',
  themeVariant = 'dark',
  headerActions = null,
  topOffsetClass = 'pt-4',
  contentWidthClass = 'max-w-7xl',
  contentSectionWidthClass = 'max-w-7xl',
  contentSectionClassName = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const roleKey = normalizeRoleKey(user?.role);

  const navItems = useMemo(() => getRoleNav(roleKey), [roleKey]);
  const workspaceLabel = useMemo(() => getRoleWorkspaceLabel(roleKey), [roleKey]);

  const displayName = user?.name || 'Coordinator';

  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const isLightTheme = themeVariant === 'light';
  const isAcademicTheme = themeVariant === 'academic';

  return (
    <div className={`fc-spacing-system relative min-h-screen overflow-hidden ${isLightTheme ? 'bg-slate-100 text-slate-900' : isAcademicTheme ? 'bg-[#040a16] text-slate-100' : 'bg-[#07111f] text-slate-100'}`}>
      <div className={`pointer-events-none absolute inset-0 ${isLightTheme
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_30%),linear-gradient(145deg,_rgba(248,250,252,0.98),_rgba(240,249,255,0.96)_40%,_rgba(239,246,255,0.96)_100%)]'
        : isAcademicTheme
          ? 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(155deg,_rgba(8,15,30,0.97),_rgba(4,12,28,0.99))]'
          : 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.26),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.24),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(155deg,_rgba(10,20,38,0.95),_rgba(2,8,24,0.99))]'
      }`} />
      <div className={`pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] ${isLightTheme ? 'opacity-60' : isAcademicTheme ? 'opacity-30' : 'opacity-20'}`} />

      <div className={`relative min-h-screen px-4 ${topOffsetClass} lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 lg:px-4`}>

        <aside className={`hidden lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-2rem)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-hidden rounded-[28px] border ${isLightTheme ? 'border-slate-200 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.16)]' : isAcademicTheme ? 'border-emerald-300/20 bg-slate-950/85 shadow-[0_24px_80px_rgba(2,10,24,0.55)]' : 'border-white/10 bg-slate-950/80 shadow-[0_24px_80px_rgba(2,6,23,0.48)]'} backdrop-blur-2xl`}>
          <div className={`relative flex items-center gap-2 border-b ${isLightTheme ? 'border-slate-200/80' : 'border-white/10'} p-3`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-sm font-black text-white shadow-[0_10px_24px_rgba(8,145,178,0.32)]">
              {brandCode}
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isLightTheme ? 'text-sky-700' : isAcademicTheme ? 'text-emerald-200/90' : 'text-cyan-200/80'}`}>{brandTitle}</p>
              <p className={`truncate text-sm font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{brandSubtitle}</p>
            </div>
          </div>

          <nav className="relative space-y-1 p-2">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <button
                  key={`sidebar-${item.id}`}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition duration-200 ${
                    active
                      ? (isLightTheme ? 'bg-gradient-to-r from-cyan-100 via-sky-100 to-indigo-100 text-slate-900 shadow-[0_10px_20px_rgba(14,116,144,0.12)] ring-1 ring-cyan-300/60' : isAcademicTheme ? 'bg-gradient-to-r from-emerald-500/18 via-cyan-500/15 to-sky-500/18 text-white shadow-[0_10px_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-300/25' : 'bg-gradient-to-r from-cyan-500/20 via-sky-500/18 to-indigo-500/20 text-white shadow-[0_10px_20px_rgba(8,145,178,0.14)] ring-1 ring-cyan-400/25')
                      : (isLightTheme ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900' : isAcademicTheme ? 'text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-100' : 'text-slate-300 hover:bg-white/5 hover:text-white')
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? (isLightTheme ? 'bg-white text-cyan-700' : isAcademicTheme ? 'bg-emerald-500/20 text-emerald-100' : 'bg-white/10 text-cyan-100') : (isLightTheme ? 'bg-slate-100 text-slate-600' : isAcademicTheme ? 'bg-slate-900/70 text-slate-300' : 'bg-white/5 text-slate-300')}`}>
                    {item.icon}
                  </span>
                  <span className="text-[13px] font-semibold leading-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={`mt-auto flex items-center gap-2 border-t ${isLightTheme ? 'border-slate-200/80 bg-white/70' : 'border-white/10 bg-slate-950/60'} p-3 backdrop-blur-xl`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-950/20">
              {initials}
            </div>
            <div className="min-w-0">
              <p className={`truncate text-xs font-semibold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{displayName}</p>
              <p className={`text-xs ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>Active session</p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="relative flex min-w-0 flex-1 flex-col mt-9">
          <header className={`relative z-20 mx-4 mb-4 rounded-[28px] border ${isLightTheme ? 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,249,255,0.92),rgba(224,242,254,0.88))] shadow-[0_18px_40px_rgba(14,116,144,0.14)]' : 'border-cyan-300/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.82),rgba(15,23,42,0.72),rgba(8,47,73,0.58))] shadow-[0_18px_40px_rgba(2,6,23,0.4)]'} px-5 py-4 backdrop-blur-2xl lg:mx-0`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${isLightTheme ? 'border-cyan-300/80 bg-cyan-50 text-cyan-700' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    {badge}
                  </div>
                  <h1 className={`truncate text-lg font-bold sm:text-2xl ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{title}</h1>
                  <p className={`truncate text-xs sm:text-sm ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {headerActions}
                <button className={`relative rounded-2xl border p-3 transition ${isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>
                  {Icon.bell}
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-12 lg:px-0 lg:pb-16">
            <div className="mx-auto flex w-full flex-col gap-6 fc-layout-stack fc-layout-stack-loose">
              <section
                className={`mx-auto w-full ${contentWidthClass} relative overflow-hidden rounded-[32px] border backdrop-blur-xl ${isLightTheme ? 'border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(240,249,255,0.95),rgba(224,242,254,0.9))] shadow-[0_18px_50px_rgba(14,116,144,0.14)]' : 'border-cyan-300/20 bg-[linear-gradient(145deg,rgba(15,23,42,0.62),rgba(8,47,73,0.52),rgba(30,41,59,0.58))] shadow-[0_18px_50px_rgba(2,6,23,0.28)]'}`}
                style={{ padding: '24px 24px 110px' }}
              >
                <div className={`absolute inset-0 ${isLightTheme ? 'bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.10),_transparent_30%)]' : 'bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.18),_transparent_30%)]'}`} />
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch">
                  <div className="space-y-4">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${isLightTheme ? 'text-cyan-700' : isAcademicTheme ? 'text-emerald-200/90' : 'text-cyan-100/80'}`}>{brandTitle} Dashboard</p>
                    <h2 className={`max-w-3xl text-3xl font-black leading-tight sm:text-4xl ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                      {title || 'Faculty Coordinator Workspace'}
                    </h2>
                    <p className={`max-w-3xl text-sm leading-7 sm:text-base ${isLightTheme ? 'text-slate-700' : 'text-slate-200/90'}`}>
                      {subtitle || 'Plan, generate, and manage timetables with a streamlined academic workflow.'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-100'}`}>Academic scheduling</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-100'}`}>Coordinator tools</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-100'}`}>Live module sync</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'}`}>{workspaceLabel}</span>
                    </div>
                  </div>

                  <div className={`relative h-full overflow-hidden rounded-[28px] border p-4 ${isLightTheme ? 'border-slate-200 bg-slate-50/80 shadow-[0_16px_40px_rgba(15,23,42,0.08)]' : 'border-white/10 bg-slate-950/50 shadow-[0_16px_40px_rgba(2,6,23,0.3)]'}`}>
                    <div className={`absolute inset-0 ${isLightTheme ? 'bg-gradient-to-br from-cyan-100/70 via-transparent to-indigo-100/70' : 'bg-gradient-to-br from-cyan-500/12 via-transparent to-indigo-500/18'}`} />
                    <div className="relative grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-2xl border p-4 ${isLightTheme ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                        <p className={`text-[11px] uppercase tracking-[0.2em] ${isLightTheme ? 'text-slate-500' : 'text-slate-300'}`}>Workspace</p>
                        <p className={`mt-2 text-lg font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{brandTitle}</p>
                      </div>
                      <div className={`rounded-2xl border p-4 ${isLightTheme ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                        <p className={`text-[11px] uppercase tracking-[0.2em] ${isLightTheme ? 'text-slate-500' : 'text-slate-300'}`}>Status</p>
                        <p className={`mt-2 text-lg font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>Ready</p>
                      </div>
                      <div className={`sm:col-span-2 rounded-2xl border p-4 ${isLightTheme ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                        <p className={`text-[11px] uppercase tracking-[0.2em] ${isLightTheme ? 'text-slate-500' : 'text-slate-300'}`}>User</p>
                        <p className={`mt-2 text-sm font-semibold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{displayName}</p>
                      </div>
                      {backgroundImage && (
                        <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-white/10">
                          <img src={backgroundImage} alt="Faculty coordinator backdrop" className="h-40 w-full object-cover opacity-90" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className={`fc-shell-content mx-auto w-full mt-24 ${contentSectionWidthClass} ${contentSectionClassName} rounded-[32px] border backdrop-blur-xl ${isLightTheme ? 'border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(241,245,249,0.93),rgba(224,242,254,0.88))] shadow-[0_18px_50px_rgba(14,116,144,0.12)]' : 'border-cyan-300/20 bg-[linear-gradient(145deg,rgba(2,6,23,0.75),rgba(15,23,42,0.64),rgba(7,89,133,0.38))] shadow-[0_18px_50px_rgba(2,6,23,0.24)]'}`}>
                {children}
              </section>
            </div>
          </main>

          <footer className={`mx-4 mb-8 rounded-[24px] border px-4 py-3 text-center text-xs backdrop-blur-xl lg:mx-0 lg:mb-10 ${isLightTheme ? 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.9))] text-slate-600 shadow-[0_12px_30px_rgba(14,116,144,0.12)]' : 'border-cyan-300/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.8),rgba(15,23,42,0.72),rgba(8,47,73,0.56))] text-slate-200 shadow-[0_12px_30px_rgba(2,6,23,0.28)]'}`}>
            {footerNote} · © {new Date().getFullYear()} SLIIT Scheduler
          </footer>
        </div>
      </div>
    </div>
  );
}