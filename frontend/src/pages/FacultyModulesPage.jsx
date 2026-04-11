import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

/* ── Department helpers ─────────────────────────────────────────── */
const normalizeDep = (v = '') => String(v || '').trim().toUpperCase();

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
  const MAP = { IT: 'IT', SE: 'SE', IE: 'ISE', CS: 'CS', CN: 'CN', IM: 'IM', DS: 'DS' };
  return MAP[p] || p;
};

const getDep = (m = {}) => {
  const d = m.department || m.department_id || m.departmentId || m.specialization || m.specialization_id || m.stream;
  return d ? normalizeDep(d) : inferDep(m.code);
};

const toView = (m = {}) => {
  const details = parseDetails(m.details);
  return {
  id: String(m.id || `${m.code}-${m.name}`),
  code: String(m.code || m.id || '').trim(),
  name: String(m.name || m.title || m.code || 'Untitled Module').trim(),
  department: getDep(m),
  credits: m.credits || details.credits || '',
  lectures_per_week: m.lectures_per_week || details.lectures_per_week || '',
  academic_year: String(m.academic_year || details.academic_year || ''),
  semester: String(m.semester || details.semester || ''),
};
};

/* ── Department palette ─────────────────────────────────────────── */
const DEP_STYLE = {
  IT:      { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)'  },
  SE:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  DS:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  ISE:     { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
  CS:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  IM:      { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  CN:      { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
  GENERAL: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)' },
};

const getStyle = (dep) => DEP_STYLE[dep] || DEP_STYLE.GENERAL;

/* ── Search icon ─────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const BookIcon = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

/* ── Module Card ─────────────────────────────────────────────────── */
const ModuleCard = ({ m }) => {
  const s = getStyle(m.department);
  return (
    <article
      className="fc-card-hover"
      style={{
        borderRadius: 18, padding: '20px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
        border: `1px solid ${s.border}`,
        boxShadow: `0 6px 30px rgba(0,0,0,0.3)`,
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${s.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <BookIcon color={s.color} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>
              {m.code || m.name}
            </h3>
            {m.code && m.name !== m.code && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.4 }}>{m.name}</p>
            )}
          </div>
        </div>

        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
          background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        }}>
          {m.department || 'GENERAL'}
        </span>
      </div>

      {/* Meta chips */}
      {(m.credits || m.lectures_per_week) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {m.credits && (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: 'rgba(148,163,184,0.8)',
            }}>
              📚 {m.credits} credits
            </span>
          )}
          {m.lectures_per_week && (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: 'rgba(148,163,184,0.8)',
            }}>
              🗓 {m.lectures_per_week}/week
            </span>
          )}
        </div>
      )}
    </article>
  );
};

/* ── Main Component ─────────────────────────────────────────────── */
const FacultyModulesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';
  const [modules, setModules] = useState([]);
  const [selectedDep, setSelectedDep] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setErr('');
        const res = await api.listItems('modules');
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setModules(items.map(toView));
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || 'Failed to load modules.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const departments = useMemo(() => {
    const all = new Set(modules.map((m) => m.department).filter(Boolean));
    return ['ALL', ...Array.from(all).sort()];
  }, [modules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((m) => {
      const matchDep = selectedDep === 'ALL' || m.department === selectedDep;
      const searchable = `${m.code} ${m.name} ${m.department}`.toLowerCase();
      return matchDep && (!q || searchable.includes(q));
    });
  }, [modules, selectedDep, search]);

  /* department stats */
  const depStats = useMemo(() => {
    const counts = {};
    modules.forEach((m) => { counts[m.department] = (counts[m.department] || 0) + 1; });
    return counts;
  }, [modules]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Department Module Control"
      subtitle="Filter, inspect, and monitor modules by department and instructional load"
      badge="Module Management"
    >
      <style>{`
        .fc-card-hover { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .fc-card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important; }
        .fc-dep-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .fc-dep-btn:hover { transform: translateY(-1px) scale(1.03); }
        .fc-section-card { background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(7,20,43,0.96)); border: 1px solid rgba(148,163,184,0.1); border-radius: 22px; backdrop-filter: blur(20px); box-shadow: 0 8px 40px rgba(0,0,0,0.35); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Search & filter card ── */}
        <section className="fc-section-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>Module Ledger</p>
          <h2 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>Department Modules</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.75)' }}>
            <strong style={{ color: '#f1f5f9' }}>{displayName}</strong> — review and filter module inventory by department and code.
          </p>

            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link
                to="/faculty/modules/added"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#bae6fd',
                  border: '1px solid rgba(125,211,252,0.45)',
                  background: 'linear-gradient(90deg, rgba(56,189,248,0.2), rgba(14,116,144,0.22))',
                }}
              >
                Open Added Modules Page
              </Link>
            </div>

          {/* Search + select row */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'end' }}>

            {/* Search */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Search</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', pointerEvents: 'none' }}>
                  <SearchIcon />
                </span>
                <input
                  style={{
                    width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 55%, #e5e7eb 100%)', border: '1px solid rgba(148,163,184,0.45)',
                    color: '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  placeholder="Search by code or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = 'rgba(56,189,248,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </label>

            {/* Department select */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 170 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Department</span>
              <select
                style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 55%, #e5e7eb 100%)', border: '1px solid rgba(148,163,184,0.45)',
                  color: '#0f172a', fontSize: 13, outline: 'none', cursor: 'pointer',
                }}
                value={selectedDep}
                onChange={(e) => setSelectedDep(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d} style={{ background: '#ffffff', color: '#0f172a' }}>
                    {d === 'ALL' ? 'All Departments' : `${d} (${depStats[d] || 0})`}
                  </option>
                ))}
              </select>
            </label>

            {/* Count badge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Found</span>
              <div style={{
                padding: '10px 20px', borderRadius: 12, textAlign: 'center',
                background: 'linear-gradient(90deg, rgba(56,189,248,0.2), rgba(99,102,241,0.2))',
                border: '1px solid rgba(56,189,248,0.3)',
                fontSize: 18, fontWeight: 900, color: '#38bdf8',
              }}>
                {filtered.length}
              </div>
            </div>
          </div>

          {/* Department quick-filter pills */}
          {departments.length > 1 && (
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {departments.map((d) => {
                const isActive = selectedDep === d;
                const s = d === 'ALL' ? { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' } : getStyle(d);
                return (
                  <button
                    key={d}
                    type="button"
                    className="fc-dep-btn"
                    onClick={() => setSelectedDep(d)}
                    style={{
                      padding: '6px 14px', borderRadius: 40, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: isActive ? s.bg : 'rgba(15,23,42,0.5)',
                      border: `1px solid ${isActive ? s.border : 'rgba(148,163,184,0.12)'}`,
                      color: isActive ? s.color : 'rgba(148,163,184,0.6)',
                      boxShadow: isActive ? `0 0 12px ${s.bg}` : 'none',
                    }}
                  >
                    {d === 'ALL' ? 'All' : d}
                    {d !== 'ALL' && depStats[d] && (
                      <span style={{ marginLeft: 5, opacity: 0.7 }}>({depStats[d]})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Error / Loading states ── */}
        {err && (
          <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
            ⚠ {err}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid rgba(56,189,248,0.15)',
                borderTop: '3px solid #38bdf8',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.7)', fontWeight: 600 }}>Loading modules...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!isLoading && !err && filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px', borderRadius: 22,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)',
          }}>
            <p style={{ margin: 0, fontSize: 32 }}>📭</p>
            <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>No modules found</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>Try adjusting the search or department filter.</p>
          </div>
        )}

        {/* ── Modules table ── */}
        {!isLoading && filtered.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.5)' }}>
                {filtered.length} module{filtered.length !== 1 ? 's' : ''} {selectedDep !== 'ALL' ? `— ${selectedDep}` : 'across all departments'}
              </p>
            </div>

            <div className="fc-section-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                  <thead>
                    <tr style={{ background: 'rgba(15,23,42,0.9)' }}>
                      {['Code', 'Name', 'Specialization', 'Year/Sem', 'Credits', 'Lectures/Week'].map((head) => (
                        <th key={head} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.9)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const s = getStyle(m.department);
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.14)' }}>
                          <td style={{ padding: '12px 14px', color: '#f1f5f9', fontWeight: 700 }}>{m.code}</td>
                          <td style={{ padding: '12px 14px', color: 'rgba(226,232,240,0.95)' }}>{m.name}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                              {m.department}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>Y{m.academic_year || '-'} / S{m.semester || '-'}</td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{m.credits || '-'}</td>
                          <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{m.lectures_per_week || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyModulesPage;
