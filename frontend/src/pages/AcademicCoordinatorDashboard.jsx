import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import schedulerApi from '../api/scheduler.js';
import moduleCatalog from '../data/moduleCatalog.js';

const AcademicCoordinatorDashboard = ({ user, apiBase }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [lecturers, setLecturers] = useState([]);
  const [lics, setLics] = useState([]);
  const [modules, setModules] = useState([]);
  const [campusStructures, setCampusStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);
  const [academicCalendar, setAcademicCalendar] = useState([]);
  
  // Form states
  const [lecturerForm, setLecturerForm] = useState({ name: '', department: '', email: '' });
  const [licForm, setLicForm] = useState({ name: '', department: '' });
  const [moduleForm, setModuleForm] = useState({ code: '', name: '', batch_size: '', credits: '', lectures_per_week: '' });
  const [selectedCatalogModule, setSelectedCatalogModule] = useState('');
  const [campusForm, setCampusForm] = useState({
    name: '',
    capacity: '',
    building: '',
    floor: '',
    roomType: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    moduleId: '',
    lecturerId: '',
    licId: '',
    academicYear: '1',
    semester: '1',
  });
  const [calendarEventForm, setCalendarEventForm] = useState({
    event_name: '',
    event_type: 'semester_start',
    start_date: '',
    end_date: '',
    academic_year: new Date().getFullYear().toString(),
    semester: '1'
  });
  
  // UI states
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [view3d, setView3d] = useState({ rotateX: 10, rotateZ: -18, zoom: 1 });
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLecturers(),
        loadLics(),
        loadModules(),
        loadCampusStructures(),
        loadAssignments(),
        loadTimetables(),
        loadConflicts(),
        loadStats(),
        loadAcademicCalendar()
      ]);
    } catch (err) {
      console.error('Failed to load some data:', err);
      showMessage('Failed to load some data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLecturers = async () => {
    try {
      const res = await schedulerApi.listItems('instructors');
      setLecturers(res.items || []);
    } catch (err) {
      console.error('Failed to load lecturers:', err);
    }
  };

  const loadLics = async () => {
    try {
      const res = await schedulerApi.listItems('lics');
      setLics(res.items || []);
    } catch (err) {
      console.error('Failed to load LICs:', err);
    }
  };

  const loadModules = async () => {
    try {
      const res = await schedulerApi.listItems('modules');
      setModules(res.items || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  const loadCampusStructures = async () => {
    try {
      const res = await schedulerApi.listItems('halls');
      setCampusStructures(res.items || []);
    } catch (err) {
      console.error('Failed to load campus structures:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await schedulerApi.listAssignments();
      setAssignments(res.items || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const loadTimetables = async () => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/timetables`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTimetables(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load timetables:', err);
    }
  };

  const loadConflicts = async () => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/conflicts?resolved=false`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setConflicts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/stats`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadAcademicCalendar = async () => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/calendar`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAcademicCalendar(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load academic calendar:', err);
    }
  };

  // CRUD Operations
  const addLecturer = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('instructors', lecturerForm);
      setLecturerForm({ name: '', department: '', email: '' });
      showMessage('Lecturer added successfully');
      await loadLecturers();
    } catch (err) {
      showMessage(err.message || 'Failed to add lecturer', 'error');
    }
  };

  const addLic = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('lics', licForm);
      setLicForm({ name: '', department: '' });
      showMessage('LIC added successfully');
      await loadLics();
    } catch (err) {
      showMessage(err.message || 'Failed to add LIC', 'error');
    }
  };

  const addModule = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('modules', moduleForm);
      setModuleForm({ code: '', name: '', batch_size: '', credits: '', lectures_per_week: '' });
      showMessage('Module added successfully');
      await loadModules();
    } catch (err) {
      showMessage(err.message || 'Failed to add module', 'error');
    }
  };

  const applyCatalogModule = () => {
    if (!selectedCatalogModule) return;
    const [code, name] = selectedCatalogModule.split('::');
    setModuleForm({ ...moduleForm, code, name });
  };

  const addCampusStructure = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('halls', {
        name: campusForm.name,
        capacity: Number(campusForm.capacity) || null,
        features: {
          building: campusForm.building,
          floor: campusForm.floor,
          roomType: campusForm.roomType,
        },
      });
      setCampusForm({ name: '', capacity: '', building: '', floor: '', roomType: '' });
      showMessage('Campus structure added successfully');
      await loadCampusStructures();
    } catch (err) {
      showMessage(err.message || 'Failed to add campus structure', 'error');
    }
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.moduleId || !assignmentForm.lecturerId || !assignmentForm.licId) {
      showMessage('Please fill all required fields', 'error');
      return;
    }
    try {
      await schedulerApi.createAssignment(assignmentForm);
      showMessage('Module assignment created');
      setAssignmentForm({ moduleId: '', lecturerId: '', licId: '', academicYear: '1', semester: '1' });
      await loadAssignments();
    } catch (err) {
      showMessage(err.message || 'Failed to create assignment', 'error');
    }
  };

  const removeAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await schedulerApi.deleteAssignment(id);
      showMessage('Assignment removed');
      await loadAssignments();
    } catch (err) {
      showMessage(err.message || 'Failed to remove assignment', 'error');
    }
  };

  const approveTimetable = async (id) => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/timetables/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comments: 'Approved by Academic Coordinator' })
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Timetable approved successfully');
        await loadTimetables();
      } else {
        showMessage(data.message || 'Failed to approve', 'error');
      }
    } catch (err) {
      showMessage('Failed to approve timetable', 'error');
    }
  };

  const rejectTimetable = async (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/timetables/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comments: reason })
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Timetable rejected');
        await loadTimetables();
      } else {
        showMessage(data.message || 'Failed to reject', 'error');
      }
    } catch (err) {
      showMessage('Failed to reject timetable', 'error');
    }
  };

  const resolveConflict = async (id) => {
    const resolution = prompt('How was this conflict resolved?');
    if (!resolution) return;
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/conflicts/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolution_notes: resolution })
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Conflict resolved');
        await loadConflicts();
      } else {
        showMessage(data.message || 'Failed to resolve', 'error');
      }
    } catch (err) {
      showMessage('Failed to resolve conflict', 'error');
    }
  };

  const addCalendarEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(calendarEventForm)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Calendar event added');
        setCalendarEventForm({
          event_name: '',
          event_type: 'semester_start',
          start_date: '',
          end_date: '',
          academic_year: new Date().getFullYear().toString(),
          semester: '1'
        });
        setShowCalendarForm(false);
        await loadAcademicCalendar();
      } else {
        showMessage(data.message || 'Failed to add event', 'error');
      }
    } catch (err) {
      showMessage('Failed to add calendar event', 'error');
    }
  };

  const getFeatureValue = (features, key) => {
    if (!features) return '';
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return parsed?.[key] || '';
      } catch {
        return '';
      }
    }
    return features?.[key] || '';
  };

  const getCampusType = (structure) => {
    const roomType = getFeatureValue(structure.features, 'roomType')?.toLowerCase() || '';
    const name = (structure.name || '').toLowerCase();
    if (roomType.includes('lab') || name.includes('lab')) return 'Lab';
    if (roomType.includes('hall') || name.includes('hall')) return 'Hall';
    return roomType ? roomType.charAt(0).toUpperCase() + roomType.slice(1) : 'Other';
  };

  const hallCount = campusStructures.filter((item) => getCampusType(item) === 'Hall').length;
  const labCount = campusStructures.filter((item) => getCampusType(item) === 'Lab').length;
  const uniqueFloorCount = new Set(
    campusStructures
      .map((item) => getFeatureValue(item.features, 'floor'))
      .filter((value) => value !== null && value !== undefined && value !== '')
  ).size;

  // Calculate statistics
  const pendingApprovals = timetables.filter(t => t.approval_status === 'pending' || !t.approval_status).length;
  const activeConflicts = conflicts.filter(c => !c.resolved).length;
  const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' && !c.resolved).length;

  return (
    <div className="dashboard-container ac-dashboard">
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1>🎓 Academic Coordinator Dashboard</h1>
          <p className="hero-sub">Welcome, {user?.name || 'Academic Coordinator'}! Manage timetables, resolve conflicts, and coordinate academic activities.</p>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-value">{timetables.length}</div>
              <div className="stat-label">Total Timetables</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: pendingApprovals > 0 ? '#f59e0b' : '#10b981' }}>{pendingApprovals}</div>
              <div className="stat-label">Pending Approval</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: activeConflicts > 0 ? '#ef4444' : '#10b981' }}>{activeConflicts}</div>
              <div className="stat-label">Active Conflicts</div>
              {highSeverityConflicts > 0 && <div className="stat-hint">⚠️ {highSeverityConflicts} high severity</div>}
            </div>
            <div className="stat">
              <div className="stat-value">{campusStructures.length}</div>
              <div className="stat-label">Resources</div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
          <div className="quick-actions">
            <button className="primary" onClick={() => setActiveTab('timetables')}>Review Timetables</button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`ac-message ${message.type === 'error' ? 'ac-message-error' : 'ac-message-success'}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-main">
        <div className="left-col">
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              <div className="action-card">
                <div>
                  <h3>➕ Add Lecturer</h3>
                  <p>Add professors and lecturers with department details</p>
                </div>
                <button className="action-btn" onClick={() => document.getElementById('lecturerForm').scrollIntoView({ behavior: 'smooth' })}>Add Now</button>
              </div>
              
              <div className="action-card">
                <div>
                  <h3>👔 Add LIC</h3>
                  <p>Create module leadership records for allocation</p>
                </div>
                <button className="action-btn" onClick={() => document.getElementById('licForm').scrollIntoView({ behavior: 'smooth' })}>Add Now</button>
              </div>
              
              <div className="action-card">
                <div>
                  <h3>📚 Add Module</h3>
                  <p>Add new modules from catalog or custom</p>
                </div>
                <button className="action-btn" onClick={() => document.getElementById('moduleForm').scrollIntoView({ behavior: 'smooth' })}>Add Now</button>
              </div>
              
              <div className="action-card">
                <div>
                  <h3>🔗 Assign Module</h3>
                  <p>Map modules to lecturers and LICs</p>
                </div>
                <button className="action-btn" onClick={() => document.getElementById('assignmentForm').scrollIntoView({ behavior: 'smooth' })}>Assign Now</button>
              </div>
            </>
          )}

          {/* Timetables Tab Content */}
          {activeTab === 'timetables' && (
            <div className="panel">
              <h3>📅 Timetables for Review</h3>
              <div className="ac-table-wrapper">
                <table className="ac-table">
                  <thead>
                    <tr><th>Name</th><th>Semester</th><th>Year</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {timetables.length === 0 && (
                      <tr><td colSpan="5" className="ac-empty-row">No timetables available</td></tr>
                    )}
                    {timetables.map((timetable) => (
                      <tr key={timetable.id}>
                        <td>{timetable.name}</td>
                        <td>{timetable.semester}</td>
                        <td>{timetable.year}</td>
                        <td>
                          <span className={`ac-status ${timetable.approval_status || 'pending'}`}>
                            {timetable.approval_status || 'pending'}
                          </span>
                        </td>
                        <td>
                          {(timetable.approval_status !== 'approved') && (
                            <>
                              <button className="ac-approve-btn" onClick={() => approveTimetable(timetable.id)}>✓ Approve</button>
                              <button className="ac-reject-btn" onClick={() => rejectTimetable(timetable.id)}>✗ Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conflicts Tab Content */}
          {activeTab === 'conflicts' && (
            <div className="panel">
              <h3>⚠️ Scheduling Conflicts</h3>
              {highSeverityConflicts > 0 && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                  ⚠️ {highSeverityConflicts} high severity conflicts require immediate attention!
                </div>
              )}
              <div className="ac-table-wrapper">
                <table className="ac-table">
                  <thead>
                    <tr><th>Type</th><th>Description</th><th>Severity</th><th>Timetable</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {conflicts.length === 0 && (
                      <tr><td colSpan="5" className="ac-empty-row">No conflicts found</td></tr>
                    )}
                    {conflicts.map((conflict) => (
                      <tr key={conflict.id}>
                        <td>{conflict.conflict_type}</td>
                        <td>{conflict.description}</td>
                        <td><span className={`ac-severity ${conflict.severity}`}>{conflict.severity}</span></td>
                        <td>{conflict.timetable_name}</td>
                        <td>
                          {!conflict.resolved && (
                            <button className="ac-resolve-btn" onClick={() => resolveConflict(conflict.id)}>Resolve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resources Tab Content */}
          {activeTab === 'resources' && (
            <div className="panel">
              <h3>🏛️ Campus Resources</h3>
              <p>Halls: {hallCount} • Labs: {labCount} • Floors: {uniqueFloorCount}</p>
              <div className="ac-table-wrapper">
                <table className="ac-table">
                  <thead>
                    <tr><th>Name</th><th>Type</th><th>Building</th><th>Floor</th><th>Capacity</th></tr>
                  </thead>
                  <tbody>
                    {campusStructures.map((structure) => (
                      <tr key={structure.id}>
                        <td>{structure.name}</td>
                        <td><span className="ac-type-pill">{getCampusType(structure)}</span></td>
                        <td>{getFeatureValue(structure.features, 'building') || '-'}</td>
                        <td>{getFeatureValue(structure.features, 'floor') || '-'}</td>
                        <td>{structure.capacity || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calendar Tab Content */}
          {activeTab === 'calendar' && (
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>📆 Academic Calendar</h3>
                <button className="primary" onClick={() => setShowCalendarForm(!showCalendarForm)}>
                  {showCalendarForm ? 'Cancel' : '+ Add Event'}
                </button>
              </div>
              
              {showCalendarForm && (
                <form onSubmit={addCalendarEvent} style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <input className="ac-input" placeholder="Event Name" value={calendarEventForm.event_name}
                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_name: e.target.value })} required />
                  <select className="ac-input" value={calendarEventForm.event_type}
                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_type: e.target.value })}>
                    <option value="semester_start">Semester Start</option>
                    <option value="semester_end">Semester End</option>
                    <option value="exam_period">Exam Period</option>
                    <option value="holiday">Holiday</option>
                    <option value="special_event">Special Event</option>
                  </select>
                  <input className="ac-input" type="date" placeholder="Start Date" value={calendarEventForm.start_date}
                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, start_date: e.target.value })} required />
                  <input className="ac-input" type="date" placeholder="End Date" value={calendarEventForm.end_date}
                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, end_date: e.target.value })} required />
                  <button className="dashboard-btn" type="submit">Add Event</button>
                </form>
              )}

              <div className="ac-calendar-grid">
                {academicCalendar.map((event) => (
                  <div key={event.id} className="ac-calendar-card">
                    <div className={`ac-calendar-type ${event.event_type}`}>{event.event_type.replace('_', ' ')}</div>
                    <h3>{event.event_name}</h3>
                    <p>📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</p>
                    <p>📚 Year: {event.academic_year} | Semester: {event.semester || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="right-col">
          {/* Quick Actions */}
          <div className="panel">
            <h3>⚡ Quick Actions</h3>
            <div className="shortcuts">
              <div className="chip" onClick={() => setActiveTab('timetables')}>📅 Review Timetables</div>
              <div className="chip" onClick={() => setActiveTab('conflicts')}>⚠️ View Conflicts</div>
              <div className="chip" onClick={() => setActiveTab('resources')}>🏛️ Manage Resources</div>
              <div className="chip" onClick={() => setActiveTab('calendar')}>📆 Calendar</div>
            </div>
          </div>

          {/* Add Lecturer Form */}
          <div className="panel" id="lecturerForm">
            <h3>➕ Add Lecturer</h3>
            <form onSubmit={addLecturer} className="ac-form">
              <input className="ac-input" placeholder="Lecturer name" value={lecturerForm.name}
                onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })} required />
              <input className="ac-input" placeholder="Department" value={lecturerForm.department}
                onChange={(e) => setLecturerForm({ ...lecturerForm, department: e.target.value })} />
              <input className="ac-input" placeholder="Email" value={lecturerForm.email}
                onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} />
              <button className="dashboard-btn" type="submit">Add Lecturer</button>
            </form>
          </div>

          {/* Add LIC Form */}
          <div className="panel" id="licForm">
            <h3>👔 Add LIC</h3>
            <form onSubmit={addLic} className="ac-form">
              <input className="ac-input" placeholder="LIC name" value={licForm.name}
                onChange={(e) => setLicForm({ ...licForm, name: e.target.value })} required />
              <input className="ac-input" placeholder="Department" value={licForm.department}
                onChange={(e) => setLicForm({ ...licForm, department: e.target.value })} />
              <button className="dashboard-btn" type="submit">Add LIC</button>
            </form>
          </div>

          {/* Add Module Form */}
          <div className="panel" id="moduleForm">
            <h3>📚 Add Module</h3>
            <form onSubmit={addModule} className="ac-form">
              <select className="ac-input" value={selectedCatalogModule}
                onChange={(e) => setSelectedCatalogModule(e.target.value)}>
                <option value="">Select from catalog</option>
                {moduleCatalog.map((module) => (
                  <option key={`${module.code}-${module.name}`} value={`${module.code}::${module.name}`}>
                    {module.code} - {module.name}
                  </option>
                ))}
              </select>
              <button type="button" className="dashboard-btn ac-inline-btn" onClick={applyCatalogModule}>
                Use Selected
              </button>
              <input className="ac-input" placeholder="Module code" value={moduleForm.code}
                onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })} required />
              <input className="ac-input" placeholder="Module name" value={moduleForm.name}
                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} required />
              <button className="dashboard-btn" type="submit">Add Module</button>
            </form>
          </div>

          {/* Add Assignment Form */}
          <div className="panel" id="assignmentForm">
            <h3>🔗 Assign Module</h3>
            <form onSubmit={addAssignment} className="ac-form">
              <select className="ac-input" value={assignmentForm.moduleId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })} required>
                <option value="">Select module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.code} - {module.name}</option>
                ))}
              </select>
              <select className="ac-input" value={assignmentForm.lecturerId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, lecturerId: e.target.value })} required>
                <option value="">Select lecturer</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                ))}
              </select>
              <select className="ac-input" value={assignmentForm.licId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, licId: e.target.value })} required>
                <option value="">Select LIC</option>
                {lics.map((lic) => (
                  <option key={lic.id} value={lic.id}>{lic.name}</option>
                ))}
              </select>
              <select className="ac-input" value={assignmentForm.academicYear}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, academicYear: e.target.value })}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <button className="dashboard-btn" type="submit">Create Assignment</button>
            </form>
          </div>

          {/* Current Assignments */}
          <div className="panel">
            <h3>📋 Current Assignments</h3>
            <div className="ac-table-wrapper">
              <table className="ac-table">
                <thead>
                  <tr><th>Module</th><th>Lecturer</th><th>Year/Sem</th><th></th></tr>
                </thead>
                <tbody>
                  {assignments.slice(0, 5).map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.module_code}</td>
                      <td>{assignment.lecturer_name}</td>
                      <td>Y{assignment.academic_year}/S{assignment.semester}</td>
                      <td><button className="ac-remove-btn" onClick={() => removeAssignment(assignment.id)}>✗</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Visualization Section */}
      <div className="ac-3d-card">
        <h2>🏗️ 3D Campus Visualization</h2>
        <div className="ac-3d-controls">
          <label>Rotate X <input type="range" min="-20" max="35" step="1" value={view3d.rotateX}
            onChange={(e) => setView3d({ ...view3d, rotateX: Number(e.target.value) })} /></label>
          <label>Rotate Z <input type="range" min="-45" max="45" step="1" value={view3d.rotateZ}
            onChange={(e) => setView3d({ ...view3d, rotateZ: Number(e.target.value) })} /></label>
          <label>Zoom <input type="range" min="0.6" max="1.8" step="0.05" value={view3d.zoom}
            onChange={(e) => setView3d({ ...view3d, zoom: Number(e.target.value) })} /></label>
          <button className="dashboard-btn" onClick={() => setView3d({ rotateX: 10, rotateZ: -18, zoom: 1 })}>Reset View</button>
        </div>
        <div className="ac-3d-scene-wrap">
          <div className="ac-3d-scene" style={{ '--rx': `${view3d.rotateX}deg`, '--rz': `${view3d.rotateZ}deg`, '--zoom': view3d.zoom }}>
            <div className="ac-3d-camera">
              {campusStructures.length === 0 && (
                <div className="ac-3d-empty">No campus structures yet. Add one to generate the 3D layout.</div>
              )}
              {campusStructures.map((structure, index) => {
                const capacity = Number(structure.capacity) || 0;
                const height = Math.max(40, Math.min(160, capacity ? 28 + Math.round(capacity / 3) : 56));
                const x = (index % 6) * 74;
                const z = Math.floor(index / 6) * 66;
                return (
                  <div
                    key={structure.id || index}
                    className="ac-3d-block"
                    style={{
                      '--x': `${x}px`,
                      '--z': `${z}px`,
                      '--h': `${height}px`,
                      '--hue': `${(index * 37) % 360}`,
                    }}
                  >
                    <div className="ac-3d-label">
                      <strong>{structure.name}</strong>
                      <span>Cap: {capacity || '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCoordinatorDashboard;