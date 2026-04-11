import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ---------------- ICONS ---------------- */
const Icon = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="3" y="4" width="18" height="18"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 0 0-4-4H5"/></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><polyline points="9 18 15 12 9 6"/></svg>,
  menu: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5"><line x1="3" y1="12" x2="21"/><line x1="3" y1="6" x2="21"/><line x1="3" y1="18" x2="21"/></svg>,
  bell: <svg viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18"/></svg>,
};

/* ---------------- NAV ---------------- */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: Icon.grid },
  { id: 'timetable', label: 'Timetables', to: '/scheduler/by-year', icon: Icon.calendar },
  { id: 'modules', label: 'Modules', to: '/faculty/modules', icon: Icon.book },
  { id: 'batches', label: 'Batches', to: '/faculty/batches', icon: Icon.users },
];

/* ---------------- COMPONENT ---------------- */

export default function FacultyCoordinatorShell({
  user,
  title,
  subtitle,
  children,
  brandCode = 'FC',
  brandTitle = 'Faculty Coordinator',
  brandSubtitle = 'Scheduling Console',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-slate-950 border-r border-slate-800 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}>

        {/* MOBILE OVERLAY */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* BRAND */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-600 w-10 h-10 rounded flex items-center justify-center font-bold">
            {brandCode}
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs text-slate-400">{brandTitle}</p>
              <p className="font-bold">{brandSubtitle}</p>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav className="p-2 space-y-1">
          {NAV.map(item => {
            const active = location.pathname === item.to;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.to);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${
                  active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {!collapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* USER */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm">{displayName}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          )}
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center"
        >
          {collapsed ? Icon.chevronRight : Icon.chevronLeft}
        </button>
      </aside>

      {/* MAIN */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>

        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-30">

          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              {Icon.menu}
            </button>

            <div>
              <h1 className="font-bold">{title}</h1>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button className="relative">
            {Icon.bell}
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6 bg-slate-900">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
          © {new Date().getFullYear()} SLIIT Scheduler
        </footer>
      </div>
    </div>
  );
}