import React, { useEffect, useMemo, useState } from 'react';
import schedulerApi from '../api/scheduler.js';
import { showError, showSuccess, showWarning } from '../utils/alerts.js';

const types = ['halls','modules','instructors','lics'];
const algorithmOptions = ['pso', 'anticolony', 'genetic', 'tabu', 'hybrid'];
const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayLabel = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
const defaultSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00'];

const departmentColors = {
  Computing: { bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.55)' },
  Engineering: { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.55)' },
  Business: { bg: 'rgba(52, 211, 153, 0.18)', border: 'rgba(52, 211, 153, 0.55)' },
  Science: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)' },
  General: { bg: 'rgba(148, 163, 184, 0.2)', border: 'rgba(148, 163, 184, 0.45)' },
};

function guessDepartment(item = {}) {
  const raw = `${item.department || ''} ${item.code || ''} ${item.name || ''}`.toLowerCase();
  if (raw.includes('comp') || raw.includes('it')) return 'Computing';
  if (raw.includes('eng')) return 'Engineering';
  if (raw.includes('bus') || raw.includes('mgt')) return 'Business';
  if (raw.includes('sci') || raw.includes('bio') || raw.includes('chem') || raw.includes('phy')) return 'Science';
  return 'General';
}

function toCourse(item = {}, index = 0) {
  const department = guessDepartment(item);
  const title = item.name || item.code || `Course ${index + 1}`;
  return {
    id: String(item.id || item.code || `${title}-${index}`),
    title,
    lecturer: item.lecturer || item.instructor || item.teacher || 'TBD',
    room: item.hall || item.room || 'Room pending',
    department,
    credits: item.credits || 3,
    color: departmentColors[department] || departmentColors.General,
  };
}

function normalizeDay(value = '') {
  const key = String(value).trim().toLowerCase().slice(0, 3);
  const map = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
  return map[key] || null;
}

function slotToMinutes(slot = '') {
  const [start = '00:00'] = String(slot).split('-');
  const [hours = '0', mins = '0'] = start.trim().split(':');
  const hh = Number(hours);
  const mm = Number(mins);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

function pickPreferredAlgorithm(results = {}) {
  const priority = ['hybrid', 'tabu', 'genetic', 'ant', 'pso'];
  for (const key of priority) {
    if (results?.[key]) return { key, data: results[key] };
  }

  const fallbackKey = Object.keys(results || {})[0];
  if (!fallbackKey) return { key: null, data: null };
  return { key: fallbackKey, data: results[fallbackKey] };
}

function toGeneratedEntry(entry = {}, index = 0, segmentKey = '') {
  const sourceTitle = entry.moduleName || entry.moduleId || `Session ${index + 1}`;
  const department = guessDepartment({
    department: entry.department,
    code: entry.moduleId,
    name: sourceTitle,
  });

  return {
    id: `${entry.moduleId || sourceTitle}-${entry.day || 'day'}-${entry.slot || index}-${index}-${segmentKey || 'main'}`,
    moduleId: String(entry.moduleId || sourceTitle),
    title: sourceTitle,
    department,
    lecturer: entry.instructorName || entry.instructorId || 'TBD',
    room: entry.hallName || entry.hallId || 'TBD',
    day: normalizeDay(entry.day) || 'Mon',
    slot: String(entry.slot || '').trim(),
    slots: Array.isArray(entry.slots) && entry.slots.length ? entry.slots.map((slot) => String(slot)) : [String(entry.slot || '')],
    batchKeys: Array.isArray(entry.batchKeys) ? entry.batchKeys : [],
    color: departmentColors[department] || departmentColors.General,
    segmentKey,
  };
}

function toCapitalized(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toReadableLabel(value = '') {
  return toCapitalized(String(value || '').replace(/_/g, ' '));
}

export default function Scheduler() {
  const [activeType, setActiveType] = useState('modules');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [segmentedResult, setSegmentedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedEntries, setGeneratedEntries] = useState([]);
  const [executionSnapshot, setExecutionSnapshot] = useState({
    coverage: null,
    scheduled: 0,
    totalRequired: 0,
    conflicts: 0,
    source: '-',
  });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeNav, setActiveNav] = useState('overview');
  const [iterations, setIterations] = useState(80);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(['pso', 'anticolony', 'genetic', 'tabu', 'hybrid']);
  const [hallStructures3D, setHallStructures3D] = useState([]);
  const [view3d, setView3d] = useState({ rotateX: 10, rotateZ: -18, zoom: 1 });
  const [coordinatorHallAllocations, setCoordinatorHallAllocations] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState({
    total: 0,
    fromApprovedTimetable: 0,
    fromRecommendationFallback: 0,
  });
  const [allocationLoading, setAllocationLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      try {
        const res = await schedulerApi.listItems(activeType);
        if (!cancelled) setItems(res.items || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setItems([]);
      }
    };

    loadItems();
    return () => {
      cancelled = true;
    };
  }, [activeType]);

  useEffect(() => {
    let cancelled = false;

    const loadHalls = async () => {
      try {
        const response = await schedulerApi.listItems('halls');
        if (!cancelled) {
          setHallStructures3D(response?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setHallStructures3D([]);
        }
        console.error('Failed to load 3D halls:', err);
      }
    };

    loadHalls();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCoordinatorHallAllocations() {
    setAllocationLoading(true);
    try {
      const response = await schedulerApi.getCoordinatorHallAllocations();
      setCoordinatorHallAllocations(response?.data || []);
      setAllocationSummary(
        response?.summary || {
          total: 0,
          fromApprovedTimetable: 0,
          fromRecommendationFallback: 0,
        }
      );
    } catch (err) {
      setCoordinatorHallAllocations([]);
      setAllocationSummary({
        total: 0,
        fromApprovedTimetable: 0,
        fromRecommendationFallback: 0,
      });
      showError('Load failed', err.message || 'Unable to fetch hall allocations from Academic Coordinator.');
    }
    setAllocationLoading(false);
  }

  function handleNavChange(view) {
    setActiveNav(view);
    if ((view === 'overview' || view === 'resources') && coordinatorHallAllocations.length === 0) {
      loadCoordinatorHallAllocations();
    }
  }

  async function handleAdd(e){
    e.preventDefault();
    if (!form || typeof form !== 'object' || Array.isArray(form) || Object.keys(form).length === 0) {
      showWarning('Invalid payload', 'Please enter a valid JSON object before creating an entry.');
      return;
    }
    try{
      await schedulerApi.addItem(activeType, form);
      setForm({});
      showSuccess('Entry created', `${activeType.slice(0, -1)} added successfully.`);
      const refreshed = await schedulerApi.listItems(activeType);
      setItems(refreshed.items || []);
    }catch(err){ showError('Create failed', err.message); }
  }

  async function handleRun(){
    setLoading(true); setResult(null); setSegmentedResult(null);
    try{
      const algorithms = selectedAlgorithms.length ? selectedAlgorithms : ['hybrid'];
      const res = await schedulerApi.runScheduler(algorithms, { iterations });
      setResult(res.results);

      const selected = pickPreferredAlgorithm(res.results || {});
      const schedule = Array.isArray(selected?.data?.schedule) ? selected.data.schedule : [];
      const entries = schedule.map((entry, index) => toGeneratedEntry(entry, index));
      const conflicts = Array.isArray(selected?.data?.conflicts) ? selected.data.conflicts.length : 0;
      const scheduled = Number(selected?.data?.stats?.scheduled || 0);
      const totalRequired = Number(selected?.data?.stats?.totalRequired || 0);
      const coverage = selected?.data?.stats?.coverage;

      setGeneratedEntries(entries);
      setExecutionSnapshot({
        coverage: typeof coverage === 'number' ? coverage : null,
        scheduled,
        totalRequired,
        conflicts,
        source: selected?.key ? `${toReadableLabel(selected.key)} (primary)` : '-',
      });

      showSuccess('Scheduler completed', 'Algorithm run completed successfully.');
    }catch(err){ showError('Scheduler failed', err.message); }
    setLoading(false);
  }

  async function handleRunBySegments(){
    setLoading(true); setResult(null); setSegmentedResult(null);
    try{
      const algorithms = selectedAlgorithms.length ? selectedAlgorithms : ['hybrid'];
      const res = await schedulerApi.runSchedulerBySegments(algorithms, { iterations });
      setSegmentedResult(res);

      const segmentRows = Array.isArray(res?.segmentedResults) ? res.segmentedResults : [];
      let totalScheduled = 0;
      let totalRequired = 0;
      let totalConflicts = 0;
      const mergedEntries = [];

      segmentRows.forEach((segmentRow, segmentIndex) => {
        const selected = pickPreferredAlgorithm(segmentRow?.results || {});
        const schedule = Array.isArray(selected?.data?.schedule) ? selected.data.schedule : [];
        schedule.forEach((entry, entryIndex) => {
          mergedEntries.push(toGeneratedEntry(entry, entryIndex, segmentRow?.segment?.key || `segment-${segmentIndex + 1}`));
        });

        totalScheduled += Number(selected?.data?.stats?.scheduled || 0);
        totalRequired += Number(selected?.data?.stats?.totalRequired || 0);
        totalConflicts += Array.isArray(selected?.data?.conflicts) ? selected.data.conflicts.length : 0;
      });

      setGeneratedEntries(mergedEntries);
      setExecutionSnapshot({
        coverage: totalRequired > 0 ? totalScheduled / totalRequired : null,
        scheduled: totalScheduled,
        totalRequired,
        conflicts: totalConflicts,
        source: `Segmented (${segmentRows.length} segments)`,
      });

      showSuccess('Segmented run completed', 'Scheduler run by segments finished.');
    }catch(err){ showError('Segmented run failed', err.message); }
    setLoading(false);
  }

  const modulesCatalog = useMemo(
    () => (activeType === 'modules' ? (items || []).map((item, index) => toCourse(item, index)) : []),
    [items, activeType]
  );

  const coverageLabel = executionSnapshot.coverage == null
    ? '-'
    : `${Math.round(executionSnapshot.coverage * 100)}%`;

  const uniqueScheduledModules = useMemo(
    () => new Set(generatedEntries.map((entry) => entry.moduleId)).size,
    [generatedEntries]
  );

  const statsCards = [
    { label: 'Catalog Modules', value: modulesCatalog.length || 0 },
    { label: 'Generated Sessions', value: generatedEntries.length },
    { label: 'Unique Modules', value: uniqueScheduledModules },
    { label: 'Coverage', value: coverageLabel },
  ];

  function handleJsonChange(value) {
    if (!value.trim()) {
      setForm({});
      return;
    }
    try {
      setForm(JSON.parse(value));
    } catch {
      setForm({});
    }
  }

  const summarizedResults = result
    ? Object.entries(result).map(([key, value]) => ({
        algorithm: key,
        coverage: value?.stats?.coverage,
        scheduled: value?.stats?.scheduled,
        totalRequired: value?.stats?.totalRequired,
        conflicts: value?.conflicts?.length || 0,
      }))
    : [];

  function toggleAlgorithm(algorithm) {
    setSelectedAlgorithms((previous) => {
      if (previous.includes(algorithm)) {
        if (previous.length === 1) return previous;
        return previous.filter((item) => item !== algorithm);
      }
      return [...previous, algorithm];
    });
  }

  const activeDays = useMemo(() => {
    const inSchedule = [...new Set(generatedEntries.map((entry) => entry.day).filter(Boolean))];
    if (!inSchedule.length) return dayOrder.slice(0, 5);
    return dayOrder.filter((day) => inSchedule.includes(day));
  }, [generatedEntries]);

  const activeSlots = useMemo(() => {
    const slotSet = new Set();

    generatedEntries.forEach((entry) => {
      if (Array.isArray(entry.slots) && entry.slots.length) {
        entry.slots.forEach((slot) => slotSet.add(slot));
      } else if (entry.slot) {
        slotSet.add(entry.slot);
      }
    });

    const list = [...slotSet];
    if (!list.length) return defaultSlots;
    return list.sort((left, right) => slotToMinutes(left) - slotToMinutes(right));
  }, [generatedEntries]);

  const scheduleMap = useMemo(() => {
    const map = {};

    generatedEntries.forEach((entry) => {
      const slots = Array.isArray(entry.slots) && entry.slots.length ? entry.slots : [entry.slot];
      slots.forEach((slot) => {
        const key = `${entry.day}__${slot}`;
        if (!map[key]) map[key] = [];
        map[key].push(entry);
      });
    });

    return map;
  }, [generatedEntries]);

  return (
    <div className="scheduler-shell">
      <aside className="scheduler-sidebar">
        <div>
          <div className="scheduler-brand">ATG</div>
          <h2>Timetable OS</h2>
          <p>Automated University Scheduling System</p>
        </div>

        <nav className="sidebar-nav">
          <button className={activeNav === 'overview' ? 'active' : ''} onClick={() => handleNavChange('overview')}>Overview</button>
          <button className={activeNav === 'weekly' ? 'active' : ''} onClick={() => handleNavChange('weekly')}>Weekly Calendar</button>
          <button className={activeNav === 'resources' ? 'active' : ''} onClick={() => handleNavChange('resources')}>Resource Hub</button>
          <button className={activeNav === 'algorithms' ? 'active' : ''} onClick={() => handleNavChange('algorithms')}>Algorithms</button>
        </nav>

        <div className="sidebar-section">
          <h3>Data Source</h3>
          <div className="data-type-switcher">
            {types.map((type) => (
              <button
                key={type}
                className={activeType === type ? 'active' : ''}
                onClick={() => setActiveType(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer-note">
          Designed for high-density scheduling workflows with low-friction interactions.
        </div>
      </aside>

      <main className="scheduler-main">
        <header className="scheduler-header">
          <div>
            <h1>Automated University Timetable Dashboard</h1>
            <p>Run scheduling engines using real coordinator allocations, institutional data, and module duration rules.</p>
          </div>
          <div className="header-actions">
            <button className="action primary" onClick={handleRun} disabled={loading}>
              {loading ? 'Running...' : 'Run Scheduler'}
            </button>
            <button className="action" onClick={handleRunBySegments} disabled={loading}>
              {loading ? 'Running...' : 'Run by Segments'}
            </button>
          </div>
        </header>

        {(activeNav === 'overview' || activeNav === 'algorithms') && (
          <section className="panel-card">
            <div className="panel-header">
              <h3>Engine Configuration</h3>
              <span>Choose algorithms and runtime settings</span>
            </div>

            <div className="json-form">
              <label>
                Iterations
                <input
                  className="ac-input"
                  min={10}
                  max={500}
                  type="number"
                  value={iterations}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) return;
                    setIterations(Math.max(10, Math.min(500, value)));
                  }}
                />
              </label>
              <div className="course-pool">
                {algorithmOptions.map((algorithm) => (
                  <label key={algorithm} className="pool-item generated-block" style={{ background: 'rgba(15, 23, 42, 0.45)', borderColor: 'rgba(148, 163, 184, 0.35)' }}>
                    <input
                      type="checkbox"
                      checked={selectedAlgorithms.includes(algorithm)}
                      onChange={() => toggleAlgorithm(algorithm)}
                    />
                    <strong>{toReadableLabel(algorithm)}</strong>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}
        {(activeNav === 'overview' || activeNav === 'weekly') && (
          <section className="scheduler-stats">
            {statsCards.map((stat) => (
              <article key={stat.label} className="stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>
        )}

        <section className="scheduler-grid-layout">
          {(activeNav === 'overview' || activeNav === 'weekly') && (
          <article className="calendar-panel">
            <div className="panel-header">
              <h3>Weekly Schedule Matrix</h3>
              <span>Backend generated output • Algorithm driven</span>
            </div>

            <div className="calendar-grid">
              <div className="grid-corner">Time</div>
              {activeDays.map((day) => (
                <div key={day} className="grid-day-header">{dayLabel[day] || day}</div>
              ))}

              {activeSlots.map((slot) => (
                <React.Fragment key={slot}>
                  <div className="grid-time-label">{slot}</div>
                  {activeDays.map((day) => {
                    const cellKey = `${day}__${slot}`;
                    const entries = scheduleMap[cellKey] || [];
                    return (
                      <div key={cellKey} className="grid-cell">
                        {entries.length ? (
                          <div className="schedule-cell-stack">
                            {entries.map((entry) => (
                              <button
                                key={entry.id}
                                className="course-block generated-block"
                                onClick={() => setSelectedBlock(entry)}
                                style={{
                                  background: entry.color.bg,
                                  borderColor: entry.color.border,
                                }}
                                type="button"
                              >
                                <strong>{entry.title}</strong>
                                <span>{entry.room}</span>
                                <span>{entry.lecturer}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="grid-empty">No generated class</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </article>
          )}

          <aside className="control-panel">
            {(activeNav === 'overview' || activeNav === 'resources') && (
            <section className="panel-card">
              <div className="panel-header">
                <h3>3D Halls View</h3>
                <span>{hallStructures3D.length} halls</span>
              </div>

              <div className="ac-3d-controls">
                <label>
                  Rotate X
                  <input
                    type="range"
                    min="-20"
                    max="35"
                    step="1"
                    value={view3d.rotateX}
                    onChange={(event) => setView3d((previous) => ({ ...previous, rotateX: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  Rotate Z
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={view3d.rotateZ}
                    onChange={(event) => setView3d((previous) => ({ ...previous, rotateZ: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  Zoom
                  <input
                    type="range"
                    min="0.6"
                    max="1.8"
                    step="0.05"
                    value={view3d.zoom}
                    onChange={(event) => setView3d((previous) => ({ ...previous, zoom: Number(event.target.value) }))}
                  />
                </label>
                <button className="action" type="button" onClick={() => setView3d({ rotateX: 10, rotateZ: -18, zoom: 1 })}>
                  Reset View
                </button>
              </div>

              <div className="ac-3d-scene-wrap">
                <div className="ac-3d-scene" style={{ '--rx': `${view3d.rotateX}deg`, '--rz': `${view3d.rotateZ}deg`, '--zoom': view3d.zoom }}>
                  <div className="ac-3d-camera">
                    {hallStructures3D.length === 0 && (
                      <div className="ac-3d-empty">No halls available yet. Add halls to render the 3D layout.</div>
                    )}

                    {hallStructures3D.map((structure, index) => {
                      const capacity = Number(structure.capacity) || 0;
                      const height = Math.max(40, Math.min(160, capacity ? 28 + Math.round(capacity / 3) : 56));
                      const x = (index % 6) * 74;
                      const z = Math.floor(index / 6) * 66;

                      return (
                        <div
                          key={structure.id || `${structure.name || 'hall'}-${index}`}
                          className="ac-3d-block"
                          style={{
                            '--x': `${x}px`,
                            '--z': `${z}px`,
                            '--h': `${height}px`,
                            '--hue': `${(index * 37) % 360}`,
                          }}
                        >
                          <div className="ac-3d-label">
                            <strong>{structure.name || structure.id || `Hall ${index + 1}`}</strong>
                            <span>Cap: {capacity || '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
            )}

            {(activeNav === 'overview' || activeNav === 'resources') && (
            <section className="panel-card">
              <div className="panel-header">
                <h3>Academic Coordinator Hall Allocations</h3>
                <button
                  type="button"
                  className="action"
                  onClick={loadCoordinatorHallAllocations}
                  disabled={allocationLoading}
                >
                  {allocationLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="result-row">
                <strong>Total: {allocationSummary.total || 0}</strong>
                <p>
                  Approved timetable: {allocationSummary.fromApprovedTimetable || 0} •
                  {` Fallback recommendations: ${allocationSummary.fromRecommendationFallback || 0}`}
                </p>
              </div>

              <div className="course-pool">
                {allocationLoading ? (
                  <p className="empty-pool">Loading coordinator allocations...</p>
                ) : coordinatorHallAllocations.length === 0 ? (
                  <p className="empty-pool">No hall allocations found from Academic Coordinator.</p>
                ) : (
                  coordinatorHallAllocations.map((item) => (
                    <div key={`${item.moduleId}-${item.hallId}`} className="result-row">
                      <strong>{item.moduleCode || item.moduleId} → {item.hallName || item.hallId}</strong>
                      <p>
                        {item.moduleName || 'Module name unavailable'} • Source: {toReadableLabel(item.source || '')}
                        {item.timetableName ? ` • Timetable: ${item.timetableName}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
            )}

            {(activeNav === 'overview' || activeNav === 'resources') && (
            <section className="panel-card">
              <div className="panel-header">
                <h3>Generated Session Feed</h3>
                <span>{generatedEntries.length} records</span>
              </div>

              <div className="course-pool">
                {generatedEntries.length === 0 ? (
                  <p className="empty-pool">Run scheduler to populate generated timetable sessions.</p>
                ) : (
                  generatedEntries.slice(0, 80).map((entry) => (
                    <div
                      key={entry.id}
                      className="pool-item generated-block"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedBlock(entry)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedBlock(entry);
                        }
                      }}
                      style={{
                        background: entry.color.bg,
                        borderColor: entry.color.border,
                      }}
                    >
                      <strong>{entry.title}</strong>
                      <span>{(dayLabel[entry.day] || entry.day)} • {entry.slot}</span>
                      <span>{entry.room}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
            )}

            {(activeNav === 'overview' || activeNav === 'resources') && (
            <section className="panel-card">
              <div className="panel-header">
                <h3>Add {toCapitalized(activeType.slice(0, -1))}</h3>
                <span>JSON payload</span>
              </div>
              <form className="json-form" onSubmit={handleAdd}>
                <textarea
                  rows={7}
                  value={JSON.stringify(form, null, 2)}
                  onChange={(event) => handleJsonChange(event.target.value)}
                />
                <button type="submit" className="action primary">Create Entry</button>
              </form>

              <div className="existing-list">
                <h4>Existing {toCapitalized(activeType)}</h4>
                {items.slice(0, 30).map((item, index) => (
                  <div key={item.id || item.name || `${activeType}-${index}`}>
                    {item.name || item.code || item.id}
                  </div>
                ))}
              </div>
            </section>
            )}

            {(activeNav === 'overview' || activeNav === 'algorithms') && (summarizedResults.length > 0 || segmentedResult) && (
              <section className="panel-card">
                <div className="panel-header">
                  <h3>Execution Insights</h3>
                  <span>Algorithm snapshot</span>
                </div>

                {summarizedResults.map((entry) => (
                  <div className="result-row" key={entry.algorithm}>
                    <strong>{toReadableLabel(entry.algorithm)}</strong>
                    <p>
                      Coverage: {typeof entry.coverage === 'number' ? entry.coverage.toFixed(2) : '-'} •
                      {` ${entry.scheduled ?? '-'} / ${entry.totalRequired ?? '-'} `}
                      • Conflicts: {entry.conflicts}
                    </p>
                  </div>
                ))}

                {segmentedResult && (
                  <div className="result-row segmented">
                    <strong>Segmented Run</strong>
                    <p>Total Segments: {segmentedResult.totalSegments}</p>
                  </div>
                )}

                <div className="result-row">
                  <strong>Active Schedule Source</strong>
                  <p>{executionSnapshot.source}</p>
                  <p>
                    Scheduled: {executionSnapshot.scheduled} / {executionSnapshot.totalRequired} •
                    {` Conflicts: ${executionSnapshot.conflicts} `}
                  </p>
                </div>
              </section>
            )}
          </aside>
        </section>
      </main>

      {selectedBlock && (
        <div className="glass-modal-backdrop" onClick={() => setSelectedBlock(null)}>
          <div className="glass-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{selectedBlock.title}</h3>
            <p>{dayLabel[selectedBlock.day] || selectedBlock.day} • {selectedBlock.slot}</p>
            <div className="modal-meta-grid">
              <div>
                <span>Department</span>
                <strong>{selectedBlock.department}</strong>
              </div>
              <div>
                <span>Lecturer</span>
                <strong>{selectedBlock.lecturer}</strong>
              </div>
              <div>
                <span>Room</span>
                <strong>{selectedBlock.room}</strong>
              </div>
              <div>
                <span>Batches</span>
                <strong>{selectedBlock.batchKeys.length ? selectedBlock.batchKeys.join(', ') : 'N/A'}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="action" onClick={() => setSelectedBlock(null)} type="button">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
