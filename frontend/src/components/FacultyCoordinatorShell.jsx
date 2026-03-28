import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', to: '/dashboard' },
      { id: 'timetable', label: 'Timetables', to: '/scheduler' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'batches', label: 'Batches', to: '/faculty/batches' },
      { id: 'modules', label: 'Modules', to: '/faculty/modules' },
    ],
  },
];

const activeClass =
  'bg-gradient-to-r from-sky-700/45 to-sky-500/25 text-white border-sky-300 shadow-[0_10px_25px_rgba(2,132,199,0.18)]';
const idleClass = 'text-slate-200 hover:bg-white/10 hover:text-white border-transparent';

export default function FacultyCoordinatorShell({
  user,
  title,
  subtitle,
  badge = 'Academic Coordination',
  children,
  headerActions,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const displayName = user?.name || user?.username || 'Faculty Coordinator';
  const initials = useMemo(() => {
    const chars = displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return chars || 'FC';
  }, [displayName]);

  const sidebarWidthClass = sidebarCollapsed ? 'lg:w-24' : 'lg:w-72';
  const contentOffsetClass = sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72';

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-stone-50 text-slate-900"
      style={{
        fontFamily: 'Inter, "Source Sans 3", "Segoe UI", sans-serif',
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-sky-50/60" />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-700/70 bg-slate-900 shadow-[0_20px_50px_rgba(2,6,23,0.45)] transition-all duration-300 ${sidebarWidthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="border-b border-slate-700/70 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/90">
            Faculty Coordinator
          </p>
          {!sidebarCollapsed && (
            <h2 className="mt-2 text-lg font-semibold text-white">Scheduling Console</h2>
          )}
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <section key={group.title}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-slate-400">{group.title}</p>
              )}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigate(item.to);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        isActive ? activeClass : idleClass
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-700/70 p-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/85 p-3 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Logged In</p>
            {!sidebarCollapsed && (
              <>
                <p className="mt-2 text-sm font-semibold text-white">{displayName}</p>
                <p className="text-[11px] text-slate-300">Coordinator Workspace</p>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={`relative z-10 ${contentOffsetClass}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 px-4 py-3 backdrop-blur-xl shadow-[0_8px_25px_rgba(15,23,42,0.07)] sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition active:translate-y-[1px] lg:hidden"
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:translate-y-[1px] lg:inline-flex"
              >
                {sidebarCollapsed ? 'Expand' : 'Collapse'}
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">{badge}</p>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {headerActions}
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-[0_8px_25px_rgba(15,23,42,0.06)] sm:flex">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">Active Session</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl p-4 sm:p-6">{children}</section>
      </main>
    </div>
  );
}
