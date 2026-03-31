import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sparklineSets = {
  resources:    [45, 55, 58, 64, 67, 70, 72],
  instructors:  [32, 35, 38, 40, 44, 46, 49],
  sync:         [85, 88, 91, 92, 94, 96, 97],
  constraint:   [35, 42, 54, 52, 61, 60, 68],
};

/* ── tiny icon set ─────────────────────────────────────────────── */
const Icon = {
  layers: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  users: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  zap: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  sliders: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  calendar: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  book: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  grid: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/* ── Sparkline SVG ─────────────────────────────────────────────── */
const Sparkline = ({ points = [], color = '#38bdf8' }) => {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const W = 120, H = 32;
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const coords = points.map((p, i) => ({ x: i * step, y: H - ((p - min) / range) * H }));
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  // area fill
  const area = `${d} L${coords[coords.length - 1].x},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 32 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Stat KPI card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, status, chart, pulse = false, iconEl, accent = '#38bdf8', trend = '+12%' }) => (
  <article
    className="fc-card-hover"
    style={{
      borderRadius: 20, padding: '20px',
      background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(7,20,43,0.95) 100%)',
      border: '1px solid rgba(148,163,184,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
      position: 'relative', overflow: 'hidden',
    }}
  >
    {/* glow accent */}
    <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
          border: `1px solid ${accent}30`,
        }}>
          {iconEl}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginTop: 2 }}>{value}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
          borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: pulse ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.1)',
          border: `1px solid ${pulse ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.15)'}`,
          color: pulse ? '#34d399' : '#94a3b8',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: pulse ? '#34d399' : '#64748b', display: 'inline-block' }} className={pulse ? 'fc-pulse-dot' : ''} />
          {status}
        </span>
        <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: accent }}>{trend}</p>
      </div>
    </div>

    <div style={{ marginTop: 16 }}>
      <Sparkline points={chart} color={accent} />
    </div>
  </article>
);

/* ── Action tile ───────────────────────────────────────────────── */
const ActionTile = ({ title, description, buttonText, onClick, iconEl, accent = '#38bdf8', gradient }) => (
  <article
    className="fc-card-hover"
    style={{
      borderRadius: 18, padding: '22px',
      background: gradient || 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(148,163,184,0.1)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${accent}30, ${accent}15)`,
      border: `1px solid ${accent}30`,
    }}>
      {iconEl}
    </div>
    <div>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{title}</h4>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.8)', lineHeight: 1.5 }}>{description}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="fc-btn"
      style={{
        marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        background: `linear-gradient(90deg, ${accent}28, ${accent}18)`,
        border: `1px solid ${accent}40`,
        color: accent,
      }}
    >
      {buttonText}
      {Icon.arrowRight}
    </button>
  </article>
);

/* ── Input field ───────────────────────────────────────────────── */
const DarkInput = ({ label, val, onChange, type = 'text', placeholder = '', mono = false }) => (
  <label style={{ display: 'block' }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', display: 'block', marginBottom: 6 }}>
      {label}
    </span>
    <input
      type={type}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10,
        background: '#ffffff', border: '1px solid rgba(148,163,184,0.4)',
        color: '#0f172a', fontSize: 13, fontFamily: mono ? "'Geist Mono', monospace" : 'inherit',
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      placeholder={placeholder}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      onFocus={e => { e.target.style.borderColor = 'rgba(56,189,248,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.2)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
    />
  </label>
);

/* ── Main Component ────────────────────────────────────────────── */
const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || user?.name || 'Coordinator';
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [_loadingResources, setLoadingResources] = useState(false);
  const [savingSoftConstraints, setSavingSoftConstraints] = useState(false);
  const [saved, setSaved] = useState(false);
  const [softConstraintForm, setSoftConstraintForm] = useState({
    preferredDaysCsv: 'Mon,Tue,Wed,Thu,Fri',
    preferredSlotsCsv: '09:00-10:00,10:00-11:00',
    w5Weight: '15',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoadingResources(true);
        const response = await api.getLicsWithInstructors();
        if (mounted && response?.items) setResources(response.items);
      } catch (err) {
        console.error('Resource load failed', err);
      } finally {
        if (mounted) setLoadingResources(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const selectedDays = useMemo(
    () => softConstraintForm.preferredDaysCsv.split(',').map((d) => d.trim()).filter(Boolean),
    [softConstraintForm.preferredDaysCsv],
  );

  const totalInstructors = useMemo(
    () => resources.reduce((s, l) => s + (l.instructors?.length || 0), 0),
    [resources],
  );

  const syncHealth = resources.length > 0 ? 'Synced' : 'Pending';

  const saveSoftConstraints = async () => {
    try {
      setSavingSoftConstraints(true);
      const payload = {
        preferredDays: softConstraintForm.preferredDaysCsv.split(',').map((s) => s.trim()).filter(Boolean),
        preferredTimeSlots: softConstraintForm.preferredSlotsCsv.split(',').map((s) => s.trim()).filter(Boolean),
        w5Weight: Number(softConstraintForm.w5Weight || 0),
        notes: softConstraintForm.notes,
      };
      await api.saveSoftConstraints(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      window.alert(error.message || 'Update failed.');
    } finally {
      setSavingSoftConstraints(false);
    }
  };

  const toggleDay = (day) => {
    const hasDay = selectedDays.includes(day);
    const next = hasDay ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
    setSoftConstraintForm((prev) => ({ ...prev, preferredDaysCsv: next.join(',') }));
  };

  /* ── Time of day greeting */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { label: 'LIC Units', value: resources.length, status: 'Data Active', chart: sparklineSets.resources, pulse: false, iconEl: Icon.layers('#38bdf8'), accent: '#38bdf8', trend: `+${resources.length} units` },
    { label: 'Instructors', value: totalInstructors, status: 'Faculty Loaded', chart: sparklineSets.instructors, pulse: false, iconEl: Icon.users('#a78bfa'), accent: '#a78bfa', trend: `${totalInstructors} total` },
    { label: 'Sync Health', value: syncHealth, status: resources.length > 0 ? 'Healthy' : 'Awaiting', chart: sparklineSets.sync, pulse: resources.length > 0, iconEl: Icon.zap('#34d399'), accent: '#34d399', trend: '97% uptime' },
    { label: 'Constraint', value: `w5 = ${softConstraintForm.w5Weight}`, status: 'Policy Mode', chart: sparklineSets.constraint, pulse: false, iconEl: Icon.sliders('#f59e0b'), accent: '#f59e0b', trend: 'Configured' },
  ];

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Coordinator Workspace"
      subtitle="Operational overview for scheduling, batches & faculty alignment"
      badge="FC Dashboard"
      backgroundImage={facultyDashboardBg}
      headerActions={
        <button
          type="button"
          onClick={() => navigate('/scheduler')}
          className="fc-btn"
          style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
            border: 'none', color: '#fff',
            boxShadow: '0 6px 20px rgba(14,165,233,0.4)',
          }}
        >
          Open Timetables
        </button>
      }
    >
      <style>{`
        .fc-day-btn { transition: all 0.2s ease; }
        .fc-day-btn:hover { transform: scale(1.05); }
        .fc-pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
        @media (max-width: 768px) { .fc-actions-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Welcome banner ── */}
      <div style={{
        borderRadius: 24, padding: '28px 32px', marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(14,165,233,0.34) 0%, rgba(99,102,241,0.32) 50%, rgba(139,92,246,0.28) 100%)',
        border: '1px solid rgba(56,189,248,0.36)',
        boxShadow: '0 10px 40px rgba(14,165,233,0.2)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#38bdf8' }}>{greeting}, {username} 👋</p>
          <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Scheduling coordination is ready</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.85)' }}>
            Manage batches, modules, and soft constraints from a single workspace.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Batch Control', path: '/faculty/batches', color: '#38bdf8' },
            { label: 'Module Ledger', path: '/faculty/modules', color: '#a78bfa' },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => navigate(q.path)}
              className="fc-btn"
              style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(15,23,42,0.68)', border: `1px solid ${q.color}75`,
                color: '#f8fafc', backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 14px rgba(2,6,23,0.32)',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Main 2-col layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, alignItems: 'start' }}>

        {/* Left – Operations center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Action tiles */}
          <section style={{
            borderRadius: 22, padding: '26px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
            border: '1px solid rgba(148,163,184,0.1)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>Workspace Operations</p>
                <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Operations Center</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.75)', maxWidth: 480 }}>
                  Coordinate batches, inspect modules, and launch the timetable generation engine.
                </p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
              }}>
                Coordinator Ready
              </span>
            </div>

            <div className="fc-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <ActionTile
                title="Batch Control"
                description="Manage cohorts, capacities, and specialization allocation windows."
                buttonText="Open Batches"
                onClick={() => navigate('/faculty/batches')}
                iconEl={Icon.users('#38bdf8')}
                accent="#38bdf8"
              />
              <ActionTile
                title="Module Ledger"
                description="Inspect departmental modules and review teaching load filters."
                buttonText="Open Modules"
                onClick={() => navigate('/faculty/modules')}
                iconEl={Icon.book('#a78bfa')}
                accent="#a78bfa"
              />
              <ActionTile
                title="Timetable Engine"
                description="Launch timetable generation and evaluate optimization outputs."
                buttonText="Open Scheduler"
                onClick={() => navigate('/scheduler')}
                iconEl={Icon.grid('#f59e0b')}
                accent="#f59e0b"
              />
            </div>
          </section>

          {/* Activity feed placeholder */}
          <section style={{
            borderRadius: 22, padding: '26px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
            border: '1px solid rgba(148,163,184,0.1)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(20px)',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a78bfa' }}>Recent Activity</p>
            <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>System Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { time: 'Just now', text: 'Soft constraints profile loaded', col: '#38bdf8' },
                { time: '2 min ago', text: 'LIC resource sync completed', col: '#34d399' },
                { time: '10 min ago', text: 'Batch registry updated', col: '#a78bfa' },
                { time: '1 hr ago', text: 'Timetable engine last run', col: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.07)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.col, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>{item.text}</span>
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', whiteSpace: 'nowrap' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right – Soft Constraints Panel */}
        <section style={{
          borderRadius: 22, padding: '26px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(7,20,43,0.97))',
          border: '1px solid rgba(148,163,184,0.12)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 80,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b' }}>Settings Console</p>
              <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Soft Constraints</h3>
            </div>
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b',
            }}>
              w5 Policy
            </span>
          </div>

          {/* Day selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Preferred Days</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {dayOptions.map((day) => {
                const isOn = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="fc-day-btn"
                    style={{
                      padding: '9px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: isOn ? 'linear-gradient(90deg, rgba(56,189,248,0.3), rgba(99,102,241,0.25))' : 'rgba(15,23,42,0.6)',
                      border: isOn ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(148,163,184,0.12)',
                      color: isOn ? '#38bdf8' : 'rgba(148,163,184,0.6)',
                      boxShadow: isOn ? '0 0 12px rgba(56,189,248,0.2)' : 'none',
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <DarkInput
              label="Preferred Slots"
              val={softConstraintForm.preferredSlotsCsv}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: v })}
              mono
              placeholder="09:00-10:00,10:00-11:00"
            />
            <DarkInput
              label="w5 Weight"
              type="number"
              val={softConstraintForm.w5Weight}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: v })}
            />
            <DarkInput
              label="Notes"
              val={softConstraintForm.notes}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, notes: v })}
              placeholder="Constraint context for scheduling runs"
            />
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={saveSoftConstraints}
            disabled={savingSoftConstraints}
            className="fc-btn"
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: savingSoftConstraints ? 'not-allowed' : 'pointer',
              background: savingSoftConstraints ? 'rgba(148,163,184,0.15)' : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
              border: 'none', color: '#fff',
              boxShadow: savingSoftConstraints ? 'none' : '0 8px 24px rgba(14,165,233,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: savingSoftConstraints ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {saved ? <>{Icon.check} Saved!</> : savingSoftConstraints ? 'Saving...' : 'Save Constraints'}
          </button>

          {/* Logged-in note */}
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} className="fc-pulse-dot" />
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>
              Logged in as <strong style={{ color: '#f1f5f9' }}>{username}</strong>
            </p>
          </div>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorDashboard;
