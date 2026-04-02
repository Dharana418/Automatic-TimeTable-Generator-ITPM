import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ── SVG icon set ─────────────────────────────────────────────── */
const Icon = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

const NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', to: '/dashboard', icon: Icon.grid },
      { id: 'timetable', label: 'Timetables', to: '/scheduler/by-year', icon: Icon.calendar },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'batches', label: 'Batches', to: '/faculty/batches', icon: Icon.users },
      { id: 'modules', label: 'Modules', to: '/faculty/modules', icon: Icon.book },
    ],
  },
];

export default function FacultyCoordinatorShell({
  user,
  title,
  subtitle,
  badge = 'Academic Coordination',
  backgroundImage,
  children,
  headerActions,
  footerNote,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const displayName = user?.name || user?.username || 'Faculty Coordinator';
  const initials = useMemo(() => {
    const chars = displayName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return chars || 'FC';
  }, [displayName]);

  const mainPl = sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]';
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        backgroundImage: backgroundImage
          ? `linear-gradient(135deg, rgba(15,23,42,0.66) 0%, rgba(12,22,40,0.58) 55%, rgba(15,23,42,0.68) 100%), url(${backgroundImage})`
          : 'linear-gradient(135deg, #0f172a 0%, #0c1628 50%, #0f172a 100%)',
        backgroundSize: backgroundImage ? 'cover' : 'auto',
        backgroundPosition: backgroundImage ? 'center' : 'initial',
        backgroundRepeat: backgroundImage ? 'no-repeat' : 'repeat',
        backgroundAttachment: backgroundImage ? 'fixed' : 'scroll',
      }}
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, top: '-200px', left: '-150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', animation: 'fcOrb1 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, bottom: '-100px', right: '-100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', animation: 'fcOrb2 25s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, top: '40%', left: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)', animation: 'fcOrb3 18s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes fcOrb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
        @keyframes fcOrb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(0.95); } }
        @keyframes fcOrb3 { 0%,100% { transform: translate(-50%,0) scale(1); } 50% { transform: translate(-50%,-20px) scale(1.08); } }
        @keyframes fcSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fcPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fcShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .fc-nav-item { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .fc-nav-item:hover { transform: translateX(3px); }
        .fc-card-hover { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .fc-card-hover:hover { transform: translateY(-2px); }
        .fc-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .fc-btn:hover { transform: translateY(-1px); }
        .fc-btn:active { transform: translateY(0); }
        .fc-animate-in { animation: fcSlideIn 0.4s ease forwards; }
        .fc-pulse-dot { animation: fcPulse 2s infinite; }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          width: sidebarCollapsed ? 72 : 260,
          background: 'linear-gradient(180deg, rgba(2,8,23,0.97) 0%, rgba(7,20,43,0.97) 100%)',
          borderRight: '1px solid rgba(148,163,184,0.1)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className={`${mobileOpen ? '' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand bar */}
        <div style={{ padding: sidebarCollapsed ? '20px 12px' : '20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{
            minWidth: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 1,
          }}>
            FC
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)', margin: 0 }}>Faculty Coordinator</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0, marginTop: 2 }}>Scheduling Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '16px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.6)', marginBottom: 8, paddingLeft: 8 }}>
                  {group.title}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="fc-nav-item"
                      onClick={() => { navigate(item.to); setMobileOpen(false); }}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: sidebarCollapsed ? '10px' : '10px 12px',
                        borderRadius: 12,
                        border: isActive ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
                        background: isActive
                          ? 'linear-gradient(90deg, rgba(14,165,233,0.22) 0%, rgba(99,102,241,0.16) 100%)'
                          : 'transparent',
                        boxShadow: isActive ? '0 4px 20px rgba(14,165,233,0.15)' : 'none',
                        color: isActive ? '#e0f2fe' : 'rgba(148,163,184,0.85)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <span style={{ color: isActive ? '#38bdf8' : 'rgba(148,163,184,0.7)', flexShrink: 0 }}>{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                      {isActive && !sidebarCollapsed && (
                        <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} className="fc-pulse-dot" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: sidebarCollapsed ? '12px 8px' : '12px 16px', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: sidebarCollapsed ? '10px 0' : '10px 12px',
            border: '1px solid rgba(148,163,184,0.08)',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 34, height: 34, minWidth: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>{initials}</div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ fontSize: 10, color: '#34d399', margin: 0, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>● Active Session</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((p) => !p)}
          style={{
            position: 'absolute', top: 24, right: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            border: '2px solid rgba(2,8,23,0.97)',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.4)',
          }}
          className="lg:flex fc-btn"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? Icon.chevronRight : Icon.chevronLeft}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className={`transition-all duration-300 ${mainPl}`}>
        {/* Top header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(7,20,43,0.8)',
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
          padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1400, margin: '0 auto', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mobile menu btn */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="fc-btn lg:hidden"
                style={{ padding: '8px', borderRadius: 8, background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8', cursor: 'pointer' }}
              >
                {Icon.menu}
              </button>

              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>{badge}</p>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{title}</h1>
                {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{subtitle}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Notification bell */}
              <button type="button" className="fc-btn" style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: '1px solid rgba(148,163,184,0.15)',
                background: 'rgba(148,163,184,0.08)', color: '#94a3b8', cursor: 'pointer',
                position: 'relative',
              }}>
                {Icon.bell}
                <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', border: '1.5px solid rgba(7,20,43,0.97)' }} />
              </button>

              {headerActions}

              {/* User chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px',
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 40, backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}>{initials}</div>
                <div style={{ display: 'none' }} className="sm:block">
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{displayName}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#34d399', fontWeight: 600 }}>{Icon.shield} Coordinator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - takes remaining space */}
        <section style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '28px 24px', overflow: 'auto' }} className="fc-animate-in">
          {children}
        </section>

        {/* Footer - stays at bottom */}
        <footer
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            width: '100%',
            padding: '28px 24px 24px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'linear-gradient(180deg, rgba(2,8,23,0.72), rgba(2,8,23,0.6))',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '12px 14px',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1' }}>
              {footerNote || `SLIIT Timetable Coordinator Workspace • ${currentYear}`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
              <span style={{ color: '#94a3b8' }}>Data sync secured</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} className="fc-pulse-dot" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
