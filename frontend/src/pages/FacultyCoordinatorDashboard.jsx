import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import { getSchedulingConflicts, resolveSchedulingConflict } from '../api/timetableGeneration.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';
import '../styles/enhanced-faculty-theme.css';
import {
  EnhancedStatCard,
  TimetableUtilizationChart,
  SchedulingConflictsChart,
  ModuleDistributionChart,
  ScheduleComplianceChart,
  EnhancedTable,
  AdvancedFilterPanel,
} from '../components/EnhancedFacultyComponents.jsx';
import { Users, Calendar, Book, Zap, TrendingUp, RefreshCw } from 'lucide-react';

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
  alert: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  refresh: (c='currentColor') => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/>
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
      borderRadius: 18, padding: '18px',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
      border: '1px solid rgba(191,219,254,0.75)',
      boxShadow: '0 14px 30px rgba(14, 116, 144, 0.14)',
      backdropFilter: 'blur(10px)',
      position: 'relative', overflow: 'hidden',
    }}
  >
    {/* glow accent */}
    <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${accent}1f 0%, transparent 70%)`, pointerEvents: 'none' }} />

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
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5f7389' }}>{label}</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#12293f', lineHeight: 1.2, marginTop: 2 }}>{value}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
          borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: pulse ? 'rgba(22,163,74,0.12)' : 'rgba(117,138,160,0.12)',
          border: `1px solid ${pulse ? 'rgba(22,163,74,0.25)' : 'rgba(117,138,160,0.2)'}`,
          color: pulse ? '#166534' : '#64748b',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: pulse ? '#22c55e' : '#64748b', display: 'inline-block' }} className={pulse ? 'fc-pulse-dot' : ''} />
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
      borderRadius: 16, padding: '18px',
      background: gradient || 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
      border: '1px solid rgba(191,219,254,0.75)',
      boxShadow: '0 10px 24px rgba(14,116,144,0.12)',
      backdropFilter: 'blur(8px)',
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
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#14314b' }}>{title}</h4>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#5f7389', lineHeight: 1.5 }}>{description}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="fc-btn"
      style={{
        marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        background: `linear-gradient(90deg, ${accent}22, ${accent}12)`,
        border: `1px solid ${accent}4a`,
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
  const [modulesCatalog, setModulesCatalog] = useState([]);
  const [batchesCatalog, setBatchesCatalog] = useState([]);
  const [lastWorkspaceSync, setLastWorkspaceSync] = useState(null);
  const [savedTimetables, setSavedTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loadingTimetables, setLoadingTimetables] = useState(false);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [resolvingConflictId, setResolvingConflictId] = useState('');
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
        setLoadingTimetables(true);
        setLoadingConflicts(true);
        const [resourceResponse, timetableResponse, conflictResponse, moduleResponse, batchResponse] = await Promise.all([
          api.getLicsWithInstructors(),
          api.getAcademicCoordinatorTimetables().catch(() => ({ data: [] })),
          getSchedulingConflicts(false).catch(() => ({ data: [] })),
          api.listItems('modules').catch(() => ({ items: [] })),
          api.listItems('batches').catch(() => ({ items: [] })),
        ]);
        if (mounted && resourceResponse?.items) setResources(resourceResponse.items);
        if (mounted) setSavedTimetables(Array.isArray(timetableResponse?.data) ? timetableResponse.data : []);
        if (mounted) setConflicts(Array.isArray(conflictResponse?.data) ? conflictResponse.data : []);
        if (mounted) setModulesCatalog(Array.isArray(moduleResponse?.items) ? moduleResponse.items : []);
        if (mounted) setBatchesCatalog(Array.isArray(batchResponse?.items) ? batchResponse.items : []);
        if (mounted) setLastWorkspaceSync(new Date());
      } catch (err) {
        console.error('Resource load failed', err);
      } finally {
        if (mounted) setLoadingResources(false);
        if (mounted) setLoadingTimetables(false);
        if (mounted) setLoadingConflicts(false);
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

  const specializationCoverage = useMemo(() => {
    const bag = new Set();
    batchesCatalog.forEach((batch) => {
      const tag = String(batch?.specialization || batch?.department || batch?.stream || '').trim().toUpperCase();
      if (tag) bag.add(tag);
    });
    return bag;
  }, [batchesCatalog]);

  const conflictPressureScore = useMemo(() => {
    const unresolved = conflicts.length;
    const rawScore = unresolved * 18 + Math.max(0, 4 - specializationCoverage.size) * 12;
    return Math.min(100, rawScore);
  }, [conflicts.length, specializationCoverage.size]);

  const operationsHealth = useMemo(() => {
    const hasResources = resources.length > 0;
    const hasModules = modulesCatalog.length > 0;
    const hasBatches = batchesCatalog.length > 0;
    const healthySignals = [hasResources, hasModules, hasBatches, conflicts.length < 3].filter(Boolean).length;
    return Math.round((healthySignals / 4) * 100);
  }, [resources.length, modulesCatalog.length, batchesCatalog.length, conflicts.length]);

  const coordinatorRecommendations = useMemo(() => {
    const items = [];

    if (conflicts.length >= 3) {
      items.push({
        id: 'high-conflicts',
        tone: '#b91c1c',
        title: 'Conflict load is high',
        detail: `${conflicts.length} unresolved conflicts detected. Prioritize conflict queue triage before next generation run.`,
        cta: 'Open Conflicts',
        onClick: () => document.getElementById('fcConflicts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      });
    }

    if (specializationCoverage.size < 3) {
      items.push({
        id: 'coverage-gap',
        tone: '#b45309',
        title: 'Specialization coverage gap',
        detail: `Only ${specializationCoverage.size || 0} specializations found in batches. Validate batch setup to avoid generation blind spots.`,
        cta: 'Open Batches',
        onClick: () => navigate('/faculty/batches'),
      });
    }

    if (savedTimetables.length === 0) {
      items.push({
        id: 'no-archives',
        tone: '#1d4ed8',
        title: 'No timetable baseline found',
        detail: 'Create at least one timetable archive for rollback and comparative quality checks.',
        cta: 'Open Scheduler',
        onClick: () => navigate('/scheduler/by-year'),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'healthy',
        tone: '#15803d',
        title: 'Workspace looks healthy',
        detail: 'Operations are balanced. Continue with optimization cycles and keep constraints updated.',
        cta: 'Tune Constraints',
        onClick: () => document.getElementById('fcSoftConstraints')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      });
    }

    return items;
  }, [conflicts.length, specializationCoverage.size, savedTimetables.length, navigate]);

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

  const readinessScore = useMemo(() => {
    const w5 = Number(softConstraintForm.w5Weight || 0);
    return Math.min(100, Math.round(resources.length * 9 + Math.min(savedTimetables.length, 6) * 8 + w5 * 0.6));
  }, [resources.length, savedTimetables.length, softConstraintForm.w5Weight]);

  const signalCards = [
    { label: 'Readiness', value: `${readinessScore}%`, hint: 'Engine confidence', tone: '#0ea5e9' },
    { label: 'Coverage', value: `${resources.length} LIC`, hint: 'Resource mapped', tone: '#6366f1' },
    { label: 'Archives', value: `${savedTimetables.length}`, hint: 'Saved outputs', tone: '#14b8a6' },
    { label: 'Policy', value: `w5 ${softConstraintForm.w5Weight}`, hint: 'Constraint weight', tone: '#f59e0b' },
  ];

  const extractSchedule = (timetable) => {
    const rawData = timetable?.data;
    const parsed = typeof rawData === 'string' ? (() => {
      try {
        return JSON.parse(rawData);
      } catch {
        return {};
      }
    })() : (rawData || {});

    return Array.isArray(parsed.schedule) ? parsed.schedule : [];
  };

  const downloadTimetableCsv = (timetable) => {
    const schedule = extractSchedule(timetable);
    if (!schedule.length) {
      window.alert('No schedule rows available for this timetable.');
      return;
    }

    const headers = ['Module', 'Hall', 'Day', 'Slot', 'Instructor', 'Batch Keys'];
    const rows = schedule.map((row) => [
      row.moduleName || row.moduleId || '',
      row.hallName || row.hallId || '',
      row.day || '',
      row.slot || (Array.isArray(row.slots) ? row.slots.join(' | ') : ''),
      row.instructorName || row.instructorId || '',
      Array.isArray(row.batchKeys) ? row.batchKeys.join(' | ') : '',
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const fileName = `${String(timetable?.name || 'timetable').replace(/[^a-zA-Z0-9-_]/g, '_')}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshTimetables = async () => {
    try {
      setLoadingTimetables(true);
      const response = await api.getAcademicCoordinatorTimetables();
      setSavedTimetables(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      window.alert(error.message || 'Failed to load timetables');
    } finally {
      setLoadingTimetables(false);
    }
  };

  const refreshConflicts = async () => {
    try {
      setLoadingConflicts(true);
      const response = await getSchedulingConflicts(false);
      setConflicts(Array.isArray(response?.data) ? response.data : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      window.alert(error.message || 'Failed to load conflicts');
    } finally {
      setLoadingConflicts(false);
    }
  };

  const refreshWorkspaceSnapshot = async () => {
    try {
      setLoadingResources(true);
      setLoadingTimetables(true);
      setLoadingConflicts(true);
      const [resourceResponse, timetableResponse, conflictResponse, moduleResponse, batchResponse] = await Promise.all([
        api.getLicsWithInstructors(),
        api.getAcademicCoordinatorTimetables().catch(() => ({ data: [] })),
        getSchedulingConflicts(false).catch(() => ({ data: [] })),
        api.listItems('modules').catch(() => ({ items: [] })),
        api.listItems('batches').catch(() => ({ items: [] })),
      ]);

      setResources(Array.isArray(resourceResponse?.items) ? resourceResponse.items : []);
      setSavedTimetables(Array.isArray(timetableResponse?.data) ? timetableResponse.data : []);
      setConflicts(Array.isArray(conflictResponse?.data) ? conflictResponse.data : []);
      setModulesCatalog(Array.isArray(moduleResponse?.items) ? moduleResponse.items : []);
      setBatchesCatalog(Array.isArray(batchResponse?.items) ? batchResponse.items : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      window.alert(error.message || 'Failed to refresh workspace data');
    } finally {
      setLoadingResources(false);
      setLoadingTimetables(false);
      setLoadingConflicts(false);
    }
  };

  const markConflictResolved = async (conflictId) => {
    if (!conflictId) return;
    const accepted = window.confirm('Mark this conflict as resolved?');
    if (!accepted) return;

    const resolutionNotes = window.prompt('Resolution note (optional):', '') || '';

    try {
      setResolvingConflictId(String(conflictId));
      await resolveSchedulingConflict(conflictId, resolutionNotes);
      await refreshConflicts();
    } catch (error) {
      window.alert(error.message || 'Failed to resolve conflict');
    } finally {
      setResolvingConflictId('');
    }
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Coordinator Workspace"
      subtitle="Operational overview for scheduling, batches & faculty alignment"
      badge="FC Dashboard"
      backgroundImage={facultyDashboardBg}
      sidebarSections={[
        { id: 'fcOverview', label: 'Overview' },
        { id: 'fcCommandCenter', label: 'Command Center' },
        { id: 'fcOperations', label: 'Operations Center' },
        { id: 'fcActivity', label: 'Recent Activity' },
        { id: 'fcConflicts', label: 'Conflict Center' },
        { id: 'fcTimetables', label: 'Saved Timetables' },
        { id: 'fcSoftConstraints', label: 'Soft Constraints' },
      ]}
      headerActions={
        <button
          type="button"
          onClick={() => navigate('/scheduler/by-year')}
          className="fc-btn fc-btn-lg"
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
            border: 'none', color: '#fff',
            boxShadow: '0 6px 20px rgba(14,165,233,0.4)',
          }}
        >
          Open Schedule
        </button>
      }
    >
      <style>{`
        .fc-day-btn { transition: all 0.2s ease; }
        .fc-day-btn:hover { transform: scale(1.05); }
        .fc-pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .fc-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .fc-card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(14,116,144,0.18) !important; border-color: rgba(56,189,248,0.55) !important; }
        .fc-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .fc-main-grid { display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 20px; align-items: start; }
        .fc-soft-panel { position: sticky; top: 80px; }
        .fc-hero-title { font-size: clamp(1.45rem, 2.2vw, 1.95rem); line-height: 1.2; letter-spacing: 0.01em; }
        .fc-section-title { font-size: clamp(1.02rem, 1.2vw, 1.2rem); line-height: 1.25; letter-spacing: 0.005em; }
        .fc-section-note { font-size: 13px; line-height: 1.6; }
        .fc-btn-lg { min-height: 42px; padding: 10px 18px !important; border-radius: 12px !important; font-size: 13px !important; font-weight: 800 !important; }
        .fc-btn-md { min-height: 38px; padding: 9px 14px !important; border-radius: 10px !important; font-size: 12px !important; font-weight: 700 !important; }
        .fc-btn-sm { min-height: 34px; padding: 7px 12px !important; border-radius: 10px !important; font-size: 12px !important; font-weight: 700 !important; }
        .fc-btn-lg:hover { transform: translateY(-1px); filter: brightness(1.03); }
        .fc-btn-md:hover { transform: translateY(-1px); filter: brightness(1.02); }
        .fc-btn-sm:hover { transform: none; filter: brightness(1.01); }
        .fc-signal-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0 0 24px; }
        .fc-signal-card { border-radius: 14px; border: 1px solid rgba(191,219,254,0.8); background: linear-gradient(160deg, rgba(255,255,255,0.92), rgba(239,246,255,0.72)); box-shadow: 0 10px 20px rgba(14,116,144,0.1); padding: 12px 14px; }
        .fc-signal-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #5f7389; }
        .fc-signal-value { margin-top: 6px; font-size: 20px; line-height: 1.15; font-weight: 800; color: #14314b; }
        .fc-signal-hint { margin-top: 4px; font-size: 12px; color: #6b8198; }
        .fc-command-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px; margin: 0 0 24px; }
        .fc-micro-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .fc-micro-card { border-radius: 12px; border: 1px solid rgba(191,219,254,0.8); background: #ffffff; padding: 10px 12px; }
        .fc-micro-label { margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }
        .fc-micro-value { margin: 6px 0 0; font-size: 20px; font-weight: 800; color: #0f2940; }
        .fc-reco-item { border-radius: 12px; border: 1px solid #d8e3ee; background: #ffffff; padding: 10px 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .fc-pulse-dot { animation: fcPulse 1.6s ease-in-out infinite; }
        @keyframes fcPulse {
          0% { transform: scale(0.85); opacity: 0.65; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.65; }
        }
        @keyframes fcShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 1100px) {
          .fc-main-grid { grid-template-columns: 1fr !important; }
          .fc-soft-panel { position: relative !important; top: 0 !important; }
          .fc-signal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .fc-command-grid { grid-template-columns: 1fr !important; }
          .fc-micro-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .fc-hero-wrap { padding: 22px 20px !important; }
          .fc-signal-grid { grid-template-columns: 1fr; }
          .fc-micro-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) { .fc-actions-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Welcome banner ── */}
      <div id="fcOverview" className="fc-hero-wrap" style={{
        borderRadius: 18, padding: '26px 30px', marginBottom: 24,
        background: 'linear-gradient(130deg, rgba(14,165,233,0.9) 0%, rgba(99,102,241,0.88) 52%, rgba(34,211,238,0.85) 100%)',
        border: '1px solid rgba(224,242,254,0.75)',
        boxShadow: '0 18px 34px rgba(14, 116, 144, 0.28)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -90, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(226,242,255,0.9)' }}>{greeting}, {username}</p>
          <h2 className="fc-hero-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#ffffff' }}>Scheduling coordination is ready</h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, maxWidth: 560, color: 'rgba(237,246,255,0.92)' }}>
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
              className="fc-btn fc-btn-md"
              style={{
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.45)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(2,6,23,0.2)',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Stats row ── */}
      <div className="fc-kpi-grid" style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <section className="fc-signal-grid" aria-label="Academic Intelligence Strip">
        {signalCards.map((item) => (
          <article key={item.label} className="fc-signal-card fc-card-hover">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p className="fc-signal-label" style={{ margin: 0 }}>{item.label}</p>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.tone, boxShadow: `0 0 0 6px ${item.tone}1f` }} />
            </div>
            <p className="fc-signal-value" style={{ margin: 0 }}>{item.value}</p>
            <p className="fc-signal-hint" style={{ marginBottom: 0 }}>{item.hint}</p>
          </article>
        ))}
      </section>

      <section id="fcCommandCenter" className="fc-command-grid" aria-label="Coordinator Command Center">
        <article style={{
          borderRadius: 16, padding: '18px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
          border: '1px solid rgba(191,219,254,0.75)',
          boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Role Intelligence</p>
              <h3 className="fc-section-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#14314b' }}>Coordinator Command Center</h3>
            </div>
            <button
              type="button"
              onClick={refreshWorkspaceSnapshot}
              className="fc-btn fc-btn-sm"
              style={{ cursor: 'pointer', background: 'rgba(15,93,153,0.12)', border: '1px solid rgba(15,93,153,0.3)', color: '#0f5d99', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {Icon.refresh('#0f5d99')} Refresh Snapshot
            </button>
          </div>

          <div className="fc-micro-grid">
            <div className="fc-micro-card">
              <p className="fc-micro-label">Modules</p>
              <p className="fc-micro-value">{modulesCatalog.length}</p>
            </div>
            <div className="fc-micro-card">
              <p className="fc-micro-label">Batches</p>
              <p className="fc-micro-value">{batchesCatalog.length}</p>
            </div>
            <div className="fc-micro-card">
              <p className="fc-micro-label">Conflicts</p>
              <p className="fc-micro-value" style={{ color: conflicts.length > 0 ? '#991b1b' : '#166534' }}>{conflicts.length}</p>
            </div>
            <div className="fc-micro-card">
              <p className="fc-micro-label">Coverage</p>
              <p className="fc-micro-value">{specializationCoverage.size}</p>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b' }}>
              Operational Health {operationsHealth}%
            </p>
            <div style={{ height: 8, borderRadius: 99, background: '#dbeafe', overflow: 'hidden' }}>
              <div style={{ width: `${operationsHealth}%`, height: '100%', background: operationsHealth >= 75 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : operationsHealth >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#b91c1c)' }} />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5f7389' }}>
              Conflict pressure score: <strong style={{ color: '#14314b' }}>{conflictPressureScore}</strong>/100
            </p>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/scheduler/by-year')}
              className="fc-btn fc-btn-sm"
              style={{ cursor: 'pointer', background: 'rgba(14,165,233,0.16)', border: '1px solid rgba(14,165,233,0.35)', color: '#0369a1' }}
            >
              Run Scheduler
            </button>
            <button
              type="button"
              onClick={() => navigate('/faculty/batches')}
              className="fc-btn fc-btn-sm"
              style={{ cursor: 'pointer', background: 'rgba(99,102,241,0.16)', border: '1px solid rgba(99,102,241,0.35)', color: '#4338ca' }}
            >
              Validate Batches
            </button>
            <button
              type="button"
              onClick={() => navigate('/faculty/modules')}
              className="fc-btn fc-btn-sm"
              style={{ cursor: 'pointer', background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.35)', color: '#047857' }}
            >
              Review Modules
            </button>
          </div>
        </article>

        <article style={{
          borderRadius: 16, padding: '18px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
          border: '1px solid rgba(191,219,254,0.75)',
          boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Recommended Actions</p>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {coordinatorRecommendations.map((item) => (
              <div key={item.id} className="fc-reco-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ marginTop: 1 }}>{Icon.alert(item.tone)}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#14314b' }}>{item.title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5f7389', lineHeight: 1.5 }}>{item.detail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="fc-btn fc-btn-sm"
                  style={{ cursor: 'pointer', background: `${item.tone}1a`, border: `1px solid ${item.tone}55`, color: item.tone, whiteSpace: 'nowrap' }}
                >
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#64748b' }}>
            Last sync: {lastWorkspaceSync ? lastWorkspaceSync.toLocaleTimeString() : 'Not synced yet'}
          </p>
        </article>
      </section>

      {/* ── Main 2-col layout ── */}
      <div className="fc-main-grid">

        {/* Left – Operations center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Action tiles */}
          <section id="fcOperations" style={{
            borderRadius: 16, padding: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
            border: '1px solid rgba(191,219,254,0.75)',
            boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Workspace Operations</p>
                <h3 className="fc-section-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#14314b' }}>Operations Center</h3>
                <p className="fc-section-note" style={{ margin: '6px 0 0', color: '#5f7389', maxWidth: 520 }}>
                  Coordinate batches, inspect modules, and launch the timetable generation engine.
                </p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)', color: '#166534',
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
                title="Timetable Generation"
                description="Launch specialization, year, and semester timetable generation."
                buttonText="Open Schedule"
                onClick={() => navigate('/scheduler/by-year')}
                iconEl={Icon.grid('#f59e0b')}
                accent="#f59e0b"
              />
            </div>
          </section>

          {/* Activity feed placeholder */}
          <section id="fcActivity" style={{
            borderRadius: 16, padding: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
            border: '1px solid rgba(191,219,254,0.75)',
            boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Recent Activity</p>
            <h3 className="fc-section-title" style={{ margin: '0 0 18px', fontWeight: 800, color: '#14314b' }}>System Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { time: 'Just now', text: 'Soft constraints profile loaded', col: '#38bdf8' },
                { time: '2 min ago', text: 'LIC resource sync completed', col: '#34d399' },
                { time: '10 min ago', text: 'Batch registry updated', col: '#a78bfa' },
                { time: '1 hr ago', text: 'Timetable engine last run', col: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} className="fc-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#ffffff', border: '1px solid #d9e4ee', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${item.col}, transparent)` }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.col, flexShrink: 0, boxShadow: `0 0 0 6px ${item.col}1f` }} />
                  <span style={{ fontSize: 13, color: '#1e3a52', flex: 1 }}>{item.text}</span>
                  <span style={{ fontSize: 11, color: '#6b8198', whiteSpace: 'nowrap' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="fcConflicts" style={{
            borderRadius: 16, padding: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
            border: '1px solid rgba(191,219,254,0.75)',
            boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b91c1c' }}>Conflict Command Center</p>
                <h3 className="fc-section-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#14314b' }}>Unresolved Conflict Queue</h3>
              </div>
              <button
                type="button"
                onClick={refreshConflicts}
                className="fc-btn fc-btn-md"
                style={{
                  cursor: 'pointer',
                  background: 'linear-gradient(90deg, #991b1b, #dc2626)', border: 'none', color: '#fff',
                }}
              >
                {loadingConflicts ? 'Refreshing...' : 'Refresh Queue'}
              </button>
            </div>

            {loadingConflicts ? (
              <p style={{ margin: 0, fontSize: 13, color: '#5f7389' }}>Loading conflict queue...</p>
            ) : conflicts.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>No unresolved conflicts at the moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conflicts.slice(0, 10).map((conflict) => {
                  const conflictId = String(conflict?.id || '');
                  return (
                    <div
                      key={conflictId}
                      className="fc-card-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        background: '#fff1f2',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7f1d1d' }}>
                          {conflict.conflict_type || conflict.type || 'Scheduling conflict'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#881337' }}>
                          {conflict.description || conflict.message || conflict.conflict_description || 'Conflict details unavailable'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => markConflictResolved(conflictId)}
                        disabled={resolvingConflictId === conflictId}
                        className="fc-btn fc-btn-sm"
                        style={{
                          cursor: resolvingConflictId === conflictId ? 'not-allowed' : 'pointer',
                          background: 'rgba(127,29,29,0.12)',
                          border: '1px solid rgba(127,29,29,0.3)',
                          color: '#7f1d1d',
                          opacity: resolvingConflictId === conflictId ? 0.6 : 1,
                        }}
                      >
                        {resolvingConflictId === conflictId ? 'Resolving...' : 'Resolve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section id="fcTimetables" style={{
            borderRadius: 16, padding: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
            border: '1px solid rgba(191,219,254,0.75)',
            boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Saved Timetables</p>
                <h3 className="fc-section-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#14314b' }}>View & Download (CSV for Excel)</h3>
              </div>
              <button
                type="button"
                onClick={refreshTimetables}
                className="fc-btn fc-btn-md"
                style={{
                  cursor: 'pointer',
                  background: 'linear-gradient(90deg, #0f5d99, #2f80c3)', border: 'none', color: '#fff',
                }}
              >
                {loadingTimetables ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loadingTimetables ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 52,
                      borderRadius: 12,
                      border: '1px solid #d8e3ee',
                      background: 'linear-gradient(90deg, #f0f7ff 25%, #ffffff 50%, #f0f7ff 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'fcShimmer 1.2s linear infinite',
                    }}
                  />
                ))}
              </div>
            ) : savedTimetables.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#5f7389' }}>No saved timetables available yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savedTimetables.slice(0, 20).map((tt) => (
                  <div key={tt.id} className="fc-card-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid #d8e3ee', background: '#fff' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#14314b' }}>{tt.name || `Timetable ${tt.id}`}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5f7389' }}>Year {tt.year || '-'} • Semester {tt.semester || '-'} • Status: {tt.status || 'pending'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadTimetableCsv(tt)}
                      className="fc-btn fc-btn-sm"
                      style={{
                        cursor: 'pointer',
                        background: 'rgba(15,93,153,0.12)', border: '1px solid rgba(15,93,153,0.28)', color: '#0f5d99',
                      }}
                    >
                      Download CSV
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right – Soft Constraints Panel */}
        <section id="fcSoftConstraints" className="fc-soft-panel" style={{
          borderRadius: 16, padding: '24px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.76))',
          border: '1px solid rgba(191,219,254,0.75)',
          boxShadow: '0 14px 28px rgba(14,116,144,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1f6fa8' }}>Settings Console</p>
              <h3 className="fc-section-title" style={{ margin: '8px 0 0', fontWeight: 800, color: '#14314b' }}>Soft Constraints</h3>
            </div>
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: 'rgba(15,93,153,0.12)', border: '1px solid rgba(15,93,153,0.24)', color: '#0f5d99',
            }}>
              w5 Policy
            </span>
          </div>

          {/* Day selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5f7389' }}>Preferred Days</p>
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
                      background: isOn ? 'linear-gradient(90deg, rgba(15,93,153,0.14), rgba(30,120,188,0.14))' : '#ffffff',
                      border: isOn ? '1px solid rgba(15,93,153,0.45)' : '1px solid #d8e3ee',
                      color: isOn ? '#0f5d99' : '#6b8198',
                      boxShadow: isOn ? '0 4px 12px rgba(15,93,153,0.12)' : 'none',
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
            className="fc-btn fc-btn-lg"
            style={{
              width: '100%', cursor: savingSoftConstraints ? 'not-allowed' : 'pointer',
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
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: '#ffffff', border: '1px solid #d8e3ee', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} className="fc-pulse-dot" />
            <p style={{ margin: 0, fontSize: 12, color: '#6b8198' }}>
              Logged in as <strong style={{ color: '#14314b' }}>{username}</strong>
            </p>
          </div>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorDashboard;
