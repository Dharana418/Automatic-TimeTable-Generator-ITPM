import { useEffect, useMemo, useState } from 'react';
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
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
      <path d="M13 13h1" />
      <path d="M13 17h1" />
      <path d="M17 15h1" />
      <path d="M17 19h1" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M5 9h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Z" />
      <path d="M10 13h4" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.22.31.51.55.86.69.32.13.66.2 1 .2H21a2 2 0 1 1 0 4h-.09c-.34 0-.68.07-1 .2a1.65 1.65 0 0 0-.51.33Z" />
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

const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const FACULTY_NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', to: '/dashboard', icon: Icon.grid },
      { id: 'timetable', label: 'Timetables', to: '/scheduler/by-year', icon: Icon.calendar },
      { id: 'timetableReport', label: 'Timetable Sidebar View', to: '/faculty/timetable-report', icon: Icon.calendar },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'batches', label: 'Batches', to: '/faculty/batches', icon: Icon.users },
      { id: 'modules', label: 'Modules', to: '/faculty/modules', icon: Icon.book },
      { id: 'addedModules', label: 'Added Modules', to: '/faculty/modules/added', icon: Icon.archive },
      { id: 'hallAllocations', label: 'Hall Allocations', to: '/faculty/hall-allocations', icon: Icon.building },
    ],
  },
];

const ACADEMIC_NAV_GROUPS = [
  {
    title: 'Mission Control',
    items: [
      { id: 'overview', label: 'Overview Dashboard', to: '/dashboard', icon: Icon.grid },
      { id: 'conflicts', label: 'Conflict Resolutions', to: '/academic/conflicts', icon: Icon.shield, color: '#ef4444' },
      { id: 'assignments', label: 'Module Assignments', to: '/academic/assignments', icon: Icon.activity, color: '#f59e0b' },
      { id: 'hallAllocations', label: 'Hall Allocations', to: '/faculty/hall-allocations', icon: Icon.building, color: '#ef4444' },
    ],
  },
  {
    title: 'Registry Tools',
    items: [
      { id: 'modules', label: 'Module Registry', to: '/academic/modules', icon: Icon.book, color: '#38bdf8' },
      { id: 'personnel', label: 'Personnel Roster', to: '/academic/personnel', icon: Icon.users, color: '#a78bfa' },
      { id: 'calendar', label: 'Academic Calendar', to: '/academic/calendar', icon: Icon.calendar, color: '#f472b6' },
      { id: 'timetable', label: 'Timetables', to: '/scheduler/by-year', icon: Icon.grid, color: '#4ade80' },
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
  navigationGroups,
  brandCode = 'FC',
  brandTitle = 'Faculty Coordinator',
  brandSubtitle = 'Scheduling Console',
  sidebarSections = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState('');

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

  const currentYear = new Date().getFullYear();
  const roleKey = normalizeRoleKey(user?.role);

  const roleDefaultNavGroups = roleKey === 'academiccoordinator' ? ACADEMIC_NAV_GROUPS : FACULTY_NAV_GROUPS;

  const navGroups = useMemo(() => {
    const baseGroups = Array.isArray(navigationGroups) && navigationGroups.length
      ? navigationGroups
      : roleDefaultNavGroups;

    if (!Array.isArray(sidebarSections) || !sidebarSections.length) {
      return baseGroups;
    }

    const defaultSectionIcons = {
      fcOverview: Icon.grid,
      fcOperations: Icon.users,
      fcActivity: Icon.activity,
      fcTimetables: Icon.calendar,
      fcSoftConstraints: Icon.settings,
    };

    const sectionGroup = {
      title: 'Dashboard Sections',
      items: sidebarSections.map((section, index) => ({
        id: section.id || `section-${index}`,
        label: section.label || `Section ${index + 1}`,
        to: `/dashboard#${section.id || `section-${index}`}`,
        icon: section.icon || defaultSectionIcons[section.id] || Icon.grid,
        type: 'section',
      })),
    };

    return [...baseGroups, sectionGroup];
  }, [navigationGroups, roleDefaultNavGroups, sidebarSections]);

  const hexToRgba = (hex, alpha) => {
    const cleanHex = String(hex || '').replace('#', '');
    if (!/^[\da-fA-F]{6}$/.test(cleanHex)) {
      return `rgba(34, 197, 94, ${alpha})`;
    }
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return false;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  };

  const handleNavItemClick = (item) => {
    if (item.type === 'section') {
      const sectionId = item.id;
      if (location.pathname === '/dashboard') {
        navigate(`/dashboard#${sectionId}`);
        setTimeout(() => {
          scrollToSection(sectionId);
        }, 80);
      } else {
        navigate(`/dashboard#${sectionId}`);
      }
      setMobileOpen(false);
      return;
    }

    navigate(item.to);
    setMobileOpen(false);
  };

  useEffect(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/dashboard' || !location.hash) {
      return;
    }

    const sectionId = location.hash.replace('#', '');
    const timer = setTimeout(() => {
      scrollToSection(sectionId);
    }, 80);

    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden fc-shell-layout"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        backgroundImage: backgroundImage
          ? `linear-gradient(135deg, rgba(239,246,255,0.86) 0%, rgba(248,250,252,0.84) 55%, rgba(232,245,255,0.86) 100%), url(${backgroundImage})`
          : 'linear-gradient(135deg, #eaf4ff 0%, #f8fbff 52%, #eef7ff 100%)',
        backgroundSize: backgroundImage ? 'cover' : 'auto',
        backgroundPosition: backgroundImage ? 'center' : 'initial',
        backgroundRepeat: backgroundImage ? 'no-repeat' : 'repeat',
        backgroundAttachment: backgroundImage ? 'fixed' : 'scroll',
      }}
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, top: '-200px', left: '-150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 70%)', animation: 'fcOrb1 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, bottom: '-100px', right: '-100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', animation: 'fcOrb2 25s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, top: '40%', left: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', animation: 'fcOrb3 18s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes fcOrb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
        @keyframes fcOrb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(0.95); } }
        @keyframes fcOrb3 { 0%,100% { transform: translate(-50%,0) scale(1); } 50% { transform: translate(-50%,-20px) scale(1.08); } }
        @keyframes fcSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fcPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fcShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .fc-nav-item { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .fc-nav-item:hover { transform: translateX(3px); }
        .fc-card-hover { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .fc-card-hover:hover { transform: translateY(-2px); }
        .fc-btn { transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
        .fc-btn:hover { transform: translateY(-1px); }
        .fc-btn:active { transform: translateY(0); }
        .fc-animate-in { animation: fcSlideIn 0.4s ease forwards; }
        .fc-pulse-dot { animation: fcPulse 2s infinite; }
        .fc-shell-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          overflow-y: auto;
        }
        .fc-main-shell {
          margin-left: 0;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .fc-shell-sidebar {
            top: 64px; /* Flush with the top Navigation bar */
            bottom: 0px; /* Stretch completely to the bottom */
            z-index: 40;
            border-top-right-radius: 0px;
            border-bottom-right-radius: 18px;
          }
          .fc-main-shell {
            margin-left: var(--fc-sidebar-width);
            width: calc(100% - var(--fc-sidebar-width));
          }
        }
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
          display: 'flex', flexDirection: 'column',
          width: sidebarCollapsed ? 72 : 260,
          background: 'linear-gradient(180deg, rgba(250,247,255,0.97) 0%, rgba(243,240,255,0.95) 52%, rgba(238,236,255,0.94) 100%)',
          borderRight: '1px solid rgba(221,214,254,0.95)',
          boxShadow: '4px 0 28px rgba(76, 29, 149, 0.12)',
          backdropFilter: 'blur(20px)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className={`fc-shell-sidebar ${mobileOpen ? '' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand bar */}
        <div style={{ padding: sidebarCollapsed ? '20px 12px' : '20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{
            minWidth: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
            boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 1,
          }}>
            {brandCode}
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5b21b6', margin: 0 }}>{brandTitle}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, marginTop: 2 }}>{brandSubtitle}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '16px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(91,33,182,0.72)', marginBottom: 8, paddingLeft: 8 }}>
                  {group.title}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.items.map((item) => {
                  const itemAccent = item.color || '#38bdf8';
                  const sidebarAccent = '#7c3aed';
                  const isActive = item.type === 'section'
                    ? location.pathname === '/dashboard' && location.hash === `#${item.id}`
                    : location.pathname === item.to;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="fc-nav-item"
                      onClick={() => handleNavItemClick(item)}
                      onMouseEnter={() => {
                        if (sidebarCollapsed) setHoveredNavId(item.id);
                      }}
                      onMouseLeave={() => {
                        if (sidebarCollapsed) setHoveredNavId('');
                      }}
                      onFocus={() => {
                        if (sidebarCollapsed) setHoveredNavId(item.id);
                      }}
                      onBlur={() => {
                        if (sidebarCollapsed) setHoveredNavId('');
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: sidebarCollapsed ? '10px' : '10px 12px',
                        borderRadius: 12,
                        border: isActive ? `1px solid ${hexToRgba(sidebarAccent, 0.35)}` : '1px solid transparent',
                        background: isActive
                          ? `linear-gradient(90deg, ${hexToRgba(sidebarAccent, 0.22)} 0%, ${hexToRgba(sidebarAccent, 0.12)} 100%)`
                          : 'rgba(255,255,255,0.5)',
                        boxShadow: isActive ? `0 0 0 1px ${hexToRgba(sidebarAccent, 0.3)}, 0 6px 24px ${hexToRgba(sidebarAccent, 0.18)}` : 'none',
                        color: isActive ? '#5b21b6' : '#334155',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <span style={{ color: isActive ? '#6d28d9' : '#64748b', flexShrink: 0 }}>{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                      {sidebarCollapsed && hoveredNavId === item.id && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 'calc(100% + 10px)',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            whiteSpace: 'nowrap',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0f172a',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,249,255,0.95))',
                            border: '1px solid rgba(186,230,253,0.9)',
                            borderRadius: 8,
                            padding: '5px 10px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                            pointerEvents: 'none',
                            zIndex: 70,
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                      {isActive && !sidebarCollapsed && (
                        <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: itemAccent, flexShrink: 0 }} className="fc-pulse-dot" />
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
            background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: sidebarCollapsed ? '10px 0' : '10px 12px',
            border: '1px solid rgba(221,214,254,0.95)',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 34, height: 34, minWidth: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #14532d, #22c55e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>{initials}</div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ fontSize: 10, color: '#6d28d9', margin: 0, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>● Active Session</p>
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
            border: '2px solid #ffffff',
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
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', '--fc-sidebar-width': `${sidebarCollapsed ? 72 : 260}px` }} className="fc-main-shell transition-all duration-300">
        {/* Top header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(255,255,255,0.86)',
          borderBottom: '1px solid rgba(186,230,253,0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 24px rgba(14,116,144,0.1)',
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
                style={{ padding: '8px', borderRadius: 8, background: 'rgba(240,249,255,0.9)', border: '1px solid rgba(186,230,253,0.9)', color: '#0369a1', cursor: 'pointer' }}
              >
                {Icon.menu}
              </button>

              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>{badge}</p>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{title}</h1>
                {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>{subtitle}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Notification bell */}
              <button type="button" className="fc-btn" style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: '1px solid rgba(186,230,253,0.9)',
                background: 'rgba(240,249,255,0.9)', color: '#0369a1', cursor: 'pointer',
                position: 'relative',
              }}>
                {Icon.bell}
                <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', border: '1.5px solid #ffffff' }} />
              </button>

              {headerActions}

              {/* User chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px',
                background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(186,230,253,0.9)',
                borderRadius: 40, backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}>{initials}</div>
                <div style={{ display: 'none' }} className="sm:block">
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{displayName}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#0369a1', fontWeight: 600 }}>Coordinator</p>
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
              border: '1px solid rgba(186,230,253,0.9)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(240,249,255,0.9))',
              boxShadow: '0 10px 24px rgba(14,116,144,0.1)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '12px 14px',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#334155' }}>
              {footerNote || `SLIIT Timetable Coordinator Workspace • ${currentYear}`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>Data sync secured</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} className="fc-pulse-dot" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
