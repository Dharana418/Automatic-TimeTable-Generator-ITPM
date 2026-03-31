import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sparklineSets = {
  resources: [45, 55, 58, 64, 67, 70, 72],
  instructors: [32, 35, 38, 40, 44, 46, 49],
  sync: [85, 88, 91, 92, 94, 96, 97],
};

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || user?.name || 'Coordinator';
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [_loadingResources, setLoadingResources] = useState(false);
  const [savingSoftConstraints, setSavingSoftConstraints] = useState(false);
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
    return () => {
      mounted = false;
    };
  }, []);

  const selectedDays = useMemo(
    () =>
      softConstraintForm.preferredDaysCsv
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [softConstraintForm.preferredDaysCsv],
  );

  const totalInstructors = useMemo(
    () => resources.reduce((sum, lic) => sum + (lic.instructors?.length || 0), 0),
    [resources],
  );

  const syncHealth = resources.length > 0 ? 'Synced' : 'Pending';

  const saveSoftConstraints = async () => {
    try {
      setSavingSoftConstraints(true);
      const payload = {
        preferredDays: softConstraintForm.preferredDaysCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredTimeSlots: softConstraintForm.preferredSlotsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        w5Weight: Number(softConstraintForm.w5Weight || 0),
        notes: softConstraintForm.notes,
      };
      await api.saveSoftConstraints(payload);
      window.alert('Constraints updated successfully.');
    } catch (error) {
      window.alert(error.message || 'Update failed.');
    } finally {
      setSavingSoftConstraints(false);
    }
  };

  const toggleDay = (day) => {
    const hasDay = selectedDays.includes(day);
    const next = hasDay ? selectedDays.filter((item) => item !== day) : [...selectedDays, day];
    setSoftConstraintForm((prev) => ({
      ...prev,
      preferredDaysCsv: next.join(','),
    }));
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Coordinator Workspace"
      subtitle="Operational overview for scheduling, batches, and faculty resource alignment"
      badge="Modern Institutional Professional"
      headerActions={
        <button
          type="button"
          onClick={() => navigate('/scheduler')}
          className="rounded-xl border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(3,105,161,0.24)] transition hover:-translate-y-0.5 hover:bg-sky-800 active:translate-y-[1px]"
        >
          Open Timetables
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-12">
        <section className="xl:col-span-12">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="LIC Units"
              value={resources.length}
              status="Data Active"
              chart={sparklineSets.resources}
            />
            <SummaryCard
              label="Instructors"
              value={totalInstructors}
              status="Faculty Loaded"
              chart={sparklineSets.instructors}
            />
            <SummaryCard
              label="Sync Health"
              value={syncHealth}
              status={resources.length > 0 ? 'Healthy' : 'Awaiting Data'}
              chart={sparklineSets.sync}
              pulse={resources.length > 0}
            />
            <SummaryCard
              label="Constraint Profile"
              value={`w5=${softConstraintForm.w5Weight}`}
              status="Policy Mode"
              chart={[35, 42, 54, 52, 61, 60, 68]}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/88 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Workspace Operations</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Batch & Timetable Operations Center</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Use the coordination tools to maintain specialization balance, resource utilization, and scheduling readiness.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Coordinator Ready
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ActionTile
              title="Batch Control"
              description="Manage cohorts, capacities, and specialization allocation windows."
              buttonText="Open Batches"
              onClick={() => navigate('/faculty/batches')}
            />
            <ActionTile
              title="Module Ledger"
              description="Inspect departmental modules and review teaching load filters."
              buttonText="Open Modules"
              onClick={() => navigate('/faculty/modules')}
            />
            <ActionTile
              title="Timetable Engine"
              description="Launch timetable generation and evaluate optimization outputs."
              buttonText="Open Scheduler"
              onClick={() => navigate('/scheduler')}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/88 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Settings Console</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Soft Constraints</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              w5 Policy
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Preferred Days</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {dayOptions.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition active:translate-y-[1px] ${
                      isSelected
                        ? 'border-sky-500 bg-sky-100 text-sky-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              label="Preferred Slots"
              val={softConstraintForm.preferredSlotsCsv}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: v })}
              mono
            />
            <Input
              label="w5 Weight"
              type="number"
              val={softConstraintForm.w5Weight}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: v })}
            />
            <Input
              label="Notes"
              val={softConstraintForm.notes}
              onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, notes: v })}
              placeholder="Constraint context for scheduling runs"
            />
          </div>

          <button
            type="button"
            onClick={saveSoftConstraints}
            disabled={savingSoftConstraints}
            className="mt-4 w-full rounded-xl border border-sky-700 bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(3,105,161,0.24)] transition hover:-translate-y-0.5 hover:bg-sky-800 active:translate-y-[1px] disabled:opacity-60"
          >
            {savingSoftConstraints ? 'Saving...' : 'Save Constraints'}
          </button>
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Logged in as <span className="font-semibold text-slate-900">{username}</span>
          </p>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

const SummaryCard = ({ label, value, status, chart, pulse = false }) => (
  <article className="rounded-3xl border border-slate-200 bg-white/88 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700">
        <span className={`h-2 w-2 rounded-full bg-emerald-500 ${pulse ? 'animate-pulse' : ''}`} />
        {status}
      </span>
    </div>
    <Sparkline points={chart} />
  </article>
);

const Sparkline = ({ points = [] }) => {
  const max = Math.max(...points, 1);
  const width = 180;
  const height = 36;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const d = points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point / max) * height;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-10 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
};

const ActionTile = ({ title, description, buttonText, onClick }) => (
  <article className="rounded-2xl border border-slate-200 bg-slate-50/55 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
    <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    <button
      type="button"
      onClick={onClick}
      className="mt-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 active:translate-y-[1px]"
    >
      {buttonText}
    </button>
  </article>
);

const Input = ({ label, val, onChange, type = 'text', placeholder = '', mono = false }) => (
  <label className="block">
    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</span>
    <input
      type={type}
      className={`mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 ${
        mono ? 'font-mono' : ''
      }`}
      placeholder={placeholder}
      value={val}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export default FacultyCoordinatorDashboard;
