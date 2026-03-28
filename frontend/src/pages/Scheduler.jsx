import React, { useEffect, useMemo, useState } from 'react';
import schedulerApi from '../api/scheduler.js';
import { showError, showSuccess, showWarning } from '../utils/alerts.js';

const types = ['halls','modules','instructors','lics'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'];

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

export default function Scheduler() {
  const [activeType, setActiveType] = useState('modules');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [segmentedResult, setSegmentedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarMap, setCalendarMap] = useState({});
  const [dragPayload, setDragPayload] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeNav, setActiveNav] = useState('weekly');

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
      const res = await schedulerApi.runScheduler(['pso','anticolony','genetic','tabu','hybrid'], { iterations: 80 });
      setResult(res.results);
      showSuccess('Scheduler completed', 'Algorithm run completed successfully.');
    }catch(err){ showError('Scheduler failed', err.message); }
    setLoading(false);
  }

  async function handleRunBySegments(){
    setLoading(true); setResult(null); setSegmentedResult(null);
    try{
      const res = await schedulerApi.runSchedulerBySegments(['hybrid'], { iterations: 80 });
      setSegmentedResult(res);
      showSuccess('Segmented run completed', 'Scheduler run by segments finished.');
    }catch(err){ showError('Segmented run failed', err.message); }
    setLoading(false);
  }

  const courses = useMemo(() => {
    if (activeType !== 'modules') return [];
    return (items || []).map((item, index) => toCourse(item, index));
  }, [items, activeType]);

  const assignedCourseIds = useMemo(() => new Set(Object.values(calendarMap)), [calendarMap]);

  const unassignedCourses = useMemo(
    () => courses.filter((course) => !assignedCourseIds.has(course.id)),
    [courses, assignedCourseIds]
  );

  const coverage = courses.length
    ? Math.round(((courses.length - unassignedCourses.length) / courses.length) * 100)
    : 0;

  const statsCards = [
    { label: 'Total Modules', value: courses.length || 0 },
    { label: 'Assigned Blocks', value: Object.keys(calendarMap).length },
    { label: 'Unscheduled', value: unassignedCourses.length },
    { label: 'Coverage', value: `${coverage}%` },
  ];

  function findCourse(courseId) {
    return courses.find((course) => course.id === courseId);
  }

  function handleDragStartFromPool(courseId) {
    setDragPayload({ source: 'pool', courseId, fromCell: null });
  }

  function handleDragStartFromCell(courseId, fromCell) {
    setDragPayload({ source: 'grid', courseId, fromCell });
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  function assignToCell(day, slot) {
    if (!dragPayload?.courseId) return;

    const cellKey = `${day}__${slot}`;

    setCalendarMap((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach((key) => {
        if (next[key] === dragPayload.courseId) {
          delete next[key];
        }
      });

      if (dragPayload.source === 'grid' && dragPayload.fromCell && dragPayload.fromCell !== cellKey) {
        delete next[dragPayload.fromCell];
      }

      next[cellKey] = dragPayload.courseId;
      return next;
    });

    setDragPayload(null);
  }

  function unassignCourse(courseId) {
    setCalendarMap((previous) => {
      const next = { ...previous };
      Object.keys(next).forEach((key) => {
        if (next[key] === courseId) delete next[key];
      });
      return next;
    });
    setDragPayload(null);
  }

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

  return (
    <div className="scheduler-shell">
      <aside className="scheduler-sidebar">
        <div>
          <div className="scheduler-brand">ATG</div>
          <h2>Timetable OS</h2>
          <p>Automated University Scheduling System</p>
        </div>

        <nav className="sidebar-nav">
          <button className={activeNav === 'overview' ? 'active' : ''} onClick={() => setActiveNav('overview')}>Overview</button>
          <button className={activeNav === 'weekly' ? 'active' : ''} onClick={() => setActiveNav('weekly')}>Weekly Calendar</button>
          <button className={activeNav === 'resources' ? 'active' : ''} onClick={() => setActiveNav('resources')}>Resource Hub</button>
          <button className={activeNav === 'algorithms' ? 'active' : ''} onClick={() => setActiveNav('algorithms')}>Algorithms</button>
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
            <p>Drag course blocks into weekly slots to compose, compare, and refine institutional schedules.</p>
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

        <section className="scheduler-stats">
          {statsCards.map((stat) => (
            <article key={stat.label} className="stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="scheduler-grid-layout">
          <article className="calendar-panel">
            <div className="panel-header">
              <h3>Weekly Schedule Matrix</h3>
              <span>Drag & drop blocks • 5 day view</span>
            </div>

            <div className="calendar-grid">
              <div className="grid-corner">Time</div>
              {weekdays.map((day) => (
                <div key={day} className="grid-day-header">{day}</div>
              ))}

              {timeSlots.map((slot) => (
                <React.Fragment key={slot}>
                  <div className="grid-time-label">{slot}</div>
                  {weekdays.map((day) => {
                    const cellKey = `${day}__${slot}`;
                    const courseId = calendarMap[cellKey];
                    const course = courseId ? findCourse(courseId) : null;
                    return (
                      <div
                        key={cellKey}
                        className="grid-cell"
                        onDragOver={allowDrop}
                        onDrop={() => assignToCell(day, slot)}
                      >
                        {course ? (
                          <button
                            className="course-block"
                            draggable
                            onDragStart={() => handleDragStartFromCell(course.id, cellKey)}
                            onClick={() => setSelectedBlock({ day, slot, course })}
                            style={{
                              background: course.color.bg,
                              borderColor: course.color.border,
                            }}
                            type="button"
                          >
                            <strong>{course.title}</strong>
                            <span>{course.department}</span>
                            <span>{course.lecturer}</span>
                          </button>
                        ) : (
                          <span className="grid-empty">Drop here</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </article>

          <aside className="control-panel">
            <section className="panel-card">
              <div className="panel-header">
                <h3>Course Pool</h3>
                <span>{unassignedCourses.length} unscheduled</span>
              </div>

              <div
                className="course-pool"
                onDragOver={allowDrop}
                onDrop={() => {
                  if (dragPayload?.courseId) {
                    unassignCourse(dragPayload.courseId);
                  }
                }}
              >
                {unassignedCourses.length === 0 ? (
                  <p className="empty-pool">All modules are currently scheduled.</p>
                ) : (
                  unassignedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="pool-item"
                      draggable
                      onDragStart={() => handleDragStartFromPool(course.id)}
                      style={{
                        background: course.color.bg,
                        borderColor: course.color.border,
                      }}
                    >
                      <strong>{course.title}</strong>
                      <span>{course.department}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header">
                <h3>Add {activeType.slice(0, -1)}</h3>
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
                <h4>Existing {activeType}</h4>
                {items.slice(0, 30).map((item, index) => (
                  <div key={item.id || item.name || `${activeType}-${index}`}>
                    {item.name || item.code || item.id}
                  </div>
                ))}
              </div>
            </section>

            {(summarizedResults.length > 0 || segmentedResult) && (
              <section className="panel-card">
                <div className="panel-header">
                  <h3>Execution Insights</h3>
                  <span>Algorithm snapshot</span>
                </div>

                {summarizedResults.map((entry) => (
                  <div className="result-row" key={entry.algorithm}>
                    <strong>{entry.algorithm.toUpperCase()}</strong>
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
              </section>
            )}
          </aside>
        </section>
      </main>

      {selectedBlock && (
        <div className="glass-modal-backdrop" onClick={() => setSelectedBlock(null)}>
          <div className="glass-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{selectedBlock.course.title}</h3>
            <p>{selectedBlock.day} • {selectedBlock.slot}</p>
            <div className="modal-meta-grid">
              <div>
                <span>Department</span>
                <strong>{selectedBlock.course.department}</strong>
              </div>
              <div>
                <span>Lecturer</span>
                <strong>{selectedBlock.course.lecturer}</strong>
              </div>
              <div>
                <span>Room</span>
                <strong>{selectedBlock.course.room}</strong>
              </div>
              <div>
                <span>Credits</span>
                <strong>{selectedBlock.course.credits}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="action" onClick={() => setSelectedBlock(null)} type="button">Close</button>
              <button
                className="action danger"
                onClick={() => {
                  unassignCourse(selectedBlock.course.id);
                  setSelectedBlock(null);
                }}
                type="button"
              >
                Remove From Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
