import React, { useEffect, useState } from 'react';
import schedulerApi from '../api/scheduler.js';
import moduleCatalog from '../data/moduleCatalog.js';
import HallAllocation from '../components/HallAllocation.jsx';

const HALL_ALLOCATION_PRESET = [
  'A401', 'A402', 'A403', 'A404', 'A405',
  'B401', 'B402', 'B403', 'B404', 'B405',
  'E401', 'E402', 'E403',
  'F401', 'F402', 'F403', 'F404',
  'G401', 'G402', 'G403',
  'Smart Classroom 1', 'Smart Classroom 2',
  'Network Lab 1', 'Programming Lab 1',
];

const PenaltyBreakdownChart = ({ breakdown }) => {
  if (!breakdown || typeof breakdown !== 'object') {
    return <div className="text-center py-8 text-gray-500">No penalty data available.</div>;
  }

  const entries = Object.entries(breakdown)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .map(([key, value]) => ({ key, value: Number(value) }));

  if (entries.length === 0) {
    return <div className="text-center py-8 text-gray-500">No penalty data available.</div>;
  }

  const maxValue = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const widthPercent = Math.max(4, Math.round((entry.value / maxValue) * 100));
        return (
          <div key={entry.key} className="flex items-center gap-3 text-sm">
            <div className="w-24 font-medium text-gray-700 capitalize">{entry.key}</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <div className="w-12 text-right font-semibold text-gray-800">{entry.value}</div>
          </div>
        );
      })}
    </div>
  );
};

const AcademicCoordinatorDashboard = ({ user, apiBase }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mainView, setMainView] = useState('lectures');
  
  // Data states
  const [lecturers, setLecturers] = useState([]);
  const [lics, setLics] = useState([]);
  const [modules, setModules] = useState([]);
  const [campusStructures, setCampusStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);
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
  const [toast, setToast] = useState({ text: '', type: '' });
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [penaltyBreakdown, setPenaltyBreakdown] = useState(null);
  const [importingHalls, setImportingHalls] = useState(false);
  const [dragLecturerId, setDragLecturerId] = useState(null);
  const [hoveredAssignmentId, setHoveredAssignmentId] = useState(null);
  const [view3d, setView3d] = useState({ rotateX: 10, rotateZ: -18, zoom: 1 });
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 4000);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    showToast(text, type);
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
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
          loadAcademicCalendar()
        ]);
      } catch (err) {
        console.error('Failed to load some data:', err);
        showMessage('Failed to load some data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [apiBase]);

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
      if (data.success) setTimetables(data.data || []);
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
      if (data.success) setConflicts(data.data || []);
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    }
  };

  const loadAcademicCalendar = async () => {
    try {
      const response = await fetch(`${apiBase}/api/academic-coordinator/calendar`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setAcademicCalendar(data.data || []);
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
    if (!moduleForm.code || !moduleForm.name) {
      showMessage('Module code and name are required', 'error');
      return;
    }
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

    setAssigning(true);

    try {
      const response = await schedulerApi.createAssignment(assignmentForm);
      if (response && response.success) {
        showMessage('Module assignment created successfully', 'success');
      } else {
        showMessage(response.error || 'Assignment may not have been saved', 'error');
      }

      setAssignmentForm({ moduleId: '', lecturerId: '', licId: '', academicYear: '1', semester: '1' });
      await loadAssignments();
    } catch (err) {
      showMessage(err.message || 'Failed to create assignment', 'error');
    } finally {
      setAssigning(false);
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

  const loadPenaltyBreakdown = async () => {
    try {
      setPenaltyLoading(true);
      const response = await schedulerApi.runScheduler(['hybrid'], { iterations: 40 });
      setPenaltyBreakdown(response?.results?.hybrid?.penaltyBreakdown || null);
    } catch (err) {
      showMessage(err.message || 'Failed to load penalty breakdown', 'error');
    } finally {
      setPenaltyLoading(false);
    }
  };

  const reassignInstructor = async (assignmentId, lecturerId) => {
    if (!assignmentId || !lecturerId) return;
    try {
      await schedulerApi.updateAssignment(assignmentId, { lecturerId });
      showMessage('Instructor reassigned successfully');
      await loadAssignments();
    } catch (err) {
      showMessage(err.message || 'Failed to reassign instructor', 'error');
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
    } catch {
      showMessage('Failed to add calendar event', 'error');
    }
  };

  const importPresetHallAllocations = async () => {
    try {
      setImportingHalls(true);
      const existing = new Set(campusStructures.map(s => s.name?.toLowerCase().trim()));
      const payloads = HALL_ALLOCATION_PRESET
        .filter(name => !existing.has(name.toLowerCase().trim()))
        .map(name => ({
          name,
          capacity: name.toLowerCase().includes('smart classroom') ? 80 : name.toLowerCase().includes('lab') ? 60 : 120,
          features: {
            building: name.match(/^[FG]/i) ? 'New Building' : 'Main Building',
            floor: name.match(/[A-Z](\d)/)?.[1] || '',
            roomType: name.toLowerCase().includes('lab') ? 'Lab' : name.toLowerCase().includes('smart classroom') ? 'Smart Classroom' : 'Hall',
          },
        }));
      if (payloads.length === 0) {
        showMessage('All preset hall allocations already exist', 'success');
        return;
      }
      for (let i = 0; i < payloads.length; i += 15) {
        await Promise.all(payloads.slice(i, i + 15).map(p => schedulerApi.addItem('halls', p)));
      }
      await loadCampusStructures();
      showMessage(`${payloads.length} hall allocations added successfully`);
    } catch (err) {
      showMessage(err.message || 'Failed to import hall allocations', 'error');
    } finally {
      setImportingHalls(false);
    }
  };

  const getFeatureValue = (features, key) => {
    if (!features) return '';
    if (typeof features === 'string') {
      try {
        return JSON.parse(features)?.[key] || '';
      } catch { return ''; }
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

  const hallCount = campusStructures.filter(item => getCampusType(item) === 'Hall').length;
  const labCount = campusStructures.filter(item => getCampusType(item) === 'Lab').length;
  const pendingApprovals = timetables.filter(t => t.approval_status === 'pending' || !t.approval_status).length;
  const activeConflicts = conflicts.filter(c => !c.resolved).length;
  const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' && !c.resolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-8 bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🎓 Academic Coordinator Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome, {user?.name || 'Academic Coordinator'}! Manage timetables, resolve conflicts, and coordinate academic activities.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-2xl font-bold text-indigo-600">{timetables.length}</div>
                <div className="text-sm text-gray-600">Total Timetables</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 min-w-[100px]">
                <div className={`text-2xl font-bold ${pendingApprovals > 0 ? 'text-amber-500' : 'text-green-600'}`}>
                  {pendingApprovals}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 min-w-[100px]">
                <div className={`text-2xl font-bold ${activeConflicts > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {activeConflicts}
                </div>
                <div className="text-sm text-gray-600">Active Conflicts</div>
                {highSeverityConflicts > 0 && (
                  <div className="text-xs text-red-500 mt-1">⚠️ {highSeverityConflicts} high severity</div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 min-w-[100px]">
                <div className="text-2xl font-bold text-indigo-600">{campusStructures.length}</div>
                <div className="text-sm text-gray-600">Resources</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <button 
              onClick={() => setActiveTab('timetables')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Review Timetables
            </button>
            <button 
              onClick={() => setActiveTab('reassignment')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Reassign Instructors
            </button>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`max-w-7xl mx-auto mb-4 p-3 rounded-lg text-center ${
          message.type === 'error' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {toast.text && (
        <div className={`ac-toast ${toast.type === 'error' ? 'ac-toast-error' : 'ac-toast-success'}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

      {/* Main Menu Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-2 flex gap-2 shadow-lg">
          <button
            onClick={() => setMainView('lectures')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mainView === 'lectures' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📚 Lectures
          </button>
          <button
            onClick={() => setMainView('hallAllocation')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mainView === 'hallAllocation' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🏛️ Hall Allocation
          </button>
        </div>
      </div>

      {/* Main Content */}
      {mainView === 'lectures' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Quick Action Cards */}
            {activeTab === 'overview' && (
              <>
                {[
                  { id: 'lecturerForm', emoji: '➕', title: 'Add Lecturer', desc: 'Add professors and lecturers with department details' },
                  { id: 'licForm', emoji: '👔', title: 'Add LIC', desc: 'Create module leadership records for allocation' },
                  { id: 'moduleForm', emoji: '📚', title: 'Add Module', desc: 'Add new modules from catalog or custom' },
                  { id: 'assignmentForm', emoji: '🔗', title: 'Assign Module', desc: 'Map modules to lecturers and LICs' },
                ].map((card) => (
                  <div key={card.id} className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{card.emoji} {card.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                      </div>
                      <button 
                        onClick={() => document.getElementById(card.id).scrollIntoView({ behavior: 'smooth' })}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:shadow-md transition-all group-hover:scale-105"
                      >
                        Add Now
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">🧩 Post-Generation Instructor Drag & Drop</h3>
                      <p className="text-sm text-gray-500 mt-1">Drag lecturers onto generated assignments to rebalance delivery ownership</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('reassignment')}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:shadow-md transition-all"
                    >
                      Open Board
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Reassignment Tab */}
            {activeTab === 'reassignment' && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🧩 Post-Generation Instructor Reassignment</h3>
                <p className="text-sm text-gray-500 mb-4">Drag an instructor onto an assignment to update lecturer allocation after timetable generation.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instructors Column */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Available Instructors</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {lecturers.map((lecturer) => (
                        <div
                          key={lecturer.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                          draggable
                          onDragStart={() => setDragLecturerId(lecturer.id)}
                          onDragEnd={() => {
                            setDragLecturerId(null);
                            setHoveredAssignmentId(null);
                          }}
                        >
                          <strong className="block text-gray-800">{lecturer.name}</strong>
                          <span className="text-xs text-gray-500">{lecturer.department || 'General'}</span>
                        </div>
                      ))}
                      {lecturers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No instructors available</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Assignments Column */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Generated Module Assignments</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`bg-white rounded-lg p-3 border-2 transition-all cursor-pointer ${
                            hoveredAssignmentId === assignment.id 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-dashed border-gray-300 hover:border-indigo-300'
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setHoveredAssignmentId(assignment.id);
                          }}
                          onDragLeave={() => setHoveredAssignmentId(null)}
                          onDrop={async (e) => {
                            e.preventDefault();
                            await reassignInstructor(assignment.id, dragLecturerId);
                            setDragLecturerId(null);
                            setHoveredAssignmentId(null);
                          }}
                        >
                          <strong className="block text-gray-800 text-sm">{assignment.module_code} - {assignment.module_name}</strong>
                          <span className="text-xs text-gray-500 block">Current: {assignment.lecturer_name || 'Unassigned'}</span>
                          <span className="text-xs text-gray-500 block">LIC: {assignment.lic_name || '-'}</span>
                          <span className="text-xs text-gray-500 block">Year/Sem: Y{assignment.academic_year}/S{assignment.semester || '-'}</span>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No assignments to reassign</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timetables Tab */}
            {activeTab === 'timetables' && (
              <div className="bg-white rounded-xl p-6 shadow-md overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Timetables for Review</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {timetables.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No timetables available</td>
                        </tr>
                      )}
                      {timetables.map((timetable) => (
                        <tr key={timetable.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{timetable.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{timetable.semester}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{timetable.year}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              timetable.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                              timetable.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {timetable.approval_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            {timetable.approval_status !== 'approved' && (
                              <>
                                <button onClick={() => approveTimetable(timetable.id)} 
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-all">
                                  ✓ Approve
                                </button>
                                <button onClick={() => rejectTimetable(timetable.id)} 
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-all">
                                  ✗ Reject
                                </button>
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

            {/* Conflicts Tab */}
            {activeTab === 'conflicts' && (
              <div className="bg-white rounded-xl p-6 shadow-md overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Scheduling Conflicts</h3>
                {highSeverityConflicts > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    ⚠️ {highSeverityConflicts} high severity conflicts require immediate attention!
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timetable</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {conflicts.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No conflicts found</td>
                        </tr>
                      )}
                      {conflicts.map((conflict) => (
                        <tr key={conflict.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{conflict.conflict_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{conflict.description}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                              conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {conflict.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{conflict.timetable_name}</td>
                          <td className="px-4 py-3">
                            {!conflict.resolved && (
                              <button onClick={() => resolveConflict(conflict.id)} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-all">
                                Resolve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="bg-white rounded-xl p-6 shadow-md overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏛️ Campus Resources</h3>
                <p className="text-sm text-gray-600 mb-2">Halls: {hallCount} • Labs: {labCount}</p>
                <button
                  onClick={importPresetHallAllocations}
                  disabled={importingHalls}
                  className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {importingHalls ? 'Importing...' : 'Import Academic Hall Allocation Structure'}
                </button>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campusStructures.map((structure) => (
                        <tr key={structure.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{structure.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {getCampusType(structure)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getFeatureValue(structure.features, 'building') || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getFeatureValue(structure.features, 'floor') || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{structure.capacity || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📆 Academic Calendar</h3>
                  <button 
                    onClick={() => setShowCalendarForm(!showCalendarForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    {showCalendarForm ? 'Cancel' : '+ Add Event'}
                  </button>
                </div>
                
                {showCalendarForm && (
                  <form onSubmit={addCalendarEvent} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <input 
                      type="text"
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800" 
                      placeholder="Event Name" 
                      value={calendarEventForm.event_name}
                      onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_name: e.target.value })} 
                      required 
                    />
                    <select 
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                      value={calendarEventForm.event_type}
                      onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_type: e.target.value })}
                    >
                      <option value="semester_start" className="text-gray-800">Semester Start</option>
                      <option value="semester_end" className="text-gray-800">Semester End</option>
                      <option value="exam_period" className="text-gray-800">Exam Period</option>
                      <option value="holiday" className="text-gray-800">Holiday</option>
                      <option value="special_event" className="text-gray-800">Special Event</option>
                    </select>
                    <input 
                      type="date" 
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800" 
                      value={calendarEventForm.start_date}
                      onChange={(e) => setCalendarEventForm({ ...calendarEventForm, start_date: e.target.value })} 
                      required 
                    />
                    <input 
                      type="date" 
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800" 
                      value={calendarEventForm.end_date}
                      onChange={(e) => setCalendarEventForm({ ...calendarEventForm, end_date: e.target.value })} 
                      required 
                    />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all">
                      Add Event
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {academicCalendar.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500 hover:shadow-md transition-all">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                        event.event_type === 'semester_start' ? 'bg-green-100 text-green-800' :
                        event.event_type === 'semester_end' ? 'bg-red-100 text-red-800' :
                        event.event_type === 'exam_period' ? 'bg-yellow-100 text-yellow-800' :
                        event.event_type === 'holiday' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {event.event_type.replace('_', ' ')}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{event.event_name}</h4>
                      <p className="text-xs text-gray-500 mb-1">
                        📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        📚 Year: {event.academic_year} | Semester: {event.semester || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-5 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-3">⚡ Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { tab: 'timetables', label: '📅 Review Timetables' },
                  { tab: 'conflicts', label: '⚠️ View Conflicts' },
                  { tab: 'resources', label: '🏛️ Manage Resources' },
                  { tab: 'calendar', label: '📆 Calendar' },
                  { tab: 'reassignment', label: '🧩 Reassign Instructors' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full text-sm transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Penalty Breakdown */}
            <div className="bg-white rounded-xl p-5 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">📊 Penalty Breakdown (w1–w5)</h3>
                <button 
                  onClick={loadPenaltyBreakdown} 
                  disabled={penaltyLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {penaltyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <PenaltyBreakdownChart breakdown={penaltyBreakdown} />
            </div>

            {/* Add Lecturer Form */}
            <div className="bg-white rounded-xl p-5 shadow-md" id="lecturerForm">
              <h3 className="font-semibold text-gray-900 mb-3">➕ Add Lecturer</h3>
              <form onSubmit={addLecturer} className="space-y-3">
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Lecturer name" 
                  value={lecturerForm.name}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })} 
                  required 
                />
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Department" 
                  value={lecturerForm.department}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, department: e.target.value })} 
                />
                <input 
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Email" 
                  value={lecturerForm.email}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} 
                />
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition-all">
                  Add Lecturer
                </button>
              </form>
            </div>

            {/* Add LIC Form */}
            <div className="bg-white rounded-xl p-5 shadow-md" id="licForm">
              <h3 className="font-semibold text-gray-900 mb-3">👔 Add LIC</h3>
              <form onSubmit={addLic} className="space-y-3">
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="LIC name" 
                  value={licForm.name}
                  onChange={(e) => setLicForm({ ...licForm, name: e.target.value })} 
                  required 
                />
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Department" 
                  value={licForm.department}
                  onChange={(e) => setLicForm({ ...licForm, department: e.target.value })} 
                />
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition-all">
                  Add LIC
                </button>
              </form>
            </div>

            {/* Add Module Form */}
            <div className="bg-white rounded-xl p-5 shadow-md" id="moduleForm">
              <h3 className="font-semibold text-gray-900 mb-3">📚 Add Module</h3>
              <form onSubmit={addModule} className="space-y-3">
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  value={selectedCatalogModule}
                  onChange={(e) => setSelectedCatalogModule(e.target.value)}
                >
                  <option value="" className="text-gray-500">Select from catalog</option>
                  {moduleCatalog.map((module) => (
                    <option key={`${module.code}-${module.name}`} value={`${module.code}::${module.name}`} className="text-gray-800">
                      {module.code} - {module.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={applyCatalogModule} 
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm transition-all">
                  Use Selected
                </button>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Module code (required)" 
                  value={moduleForm.code}
                  onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })} 
                  required 
                />
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Module name (required)" 
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} 
                  required 
                />
                <input 
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Credits (optional)" 
                  value={moduleForm.credits}
                  onChange={(e) => setModuleForm({ ...moduleForm, credits: e.target.value })} 
                />
                <input 
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  placeholder="Lectures per week (optional)" 
                  value={moduleForm.lectures_per_week}
                  onChange={(e) => setModuleForm({ ...moduleForm, lectures_per_week: e.target.value })} 
                />
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition-all">
                  Add Module
                </button>
              </form>
            </div>

            {/* Add Assignment Form */}
            <div className="bg-white rounded-xl p-5 shadow-md" id="assignmentForm">
              <h3 className="font-semibold text-gray-900 mb-3">🔗 Assign Module</h3>
              <form onSubmit={addAssignment} className="space-y-3">
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  value={assignmentForm.moduleId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })} 
                  required
                >
                  <option value="" className="text-gray-500">Select module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id} className="text-gray-800">{module.code} - {module.name}</option>
                  ))}
                </select>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  value={assignmentForm.lecturerId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, lecturerId: e.target.value })} 
                  required
                >
                  <option value="" className="text-gray-500">Select lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id} className="text-gray-800">{lecturer.name}</option>
                  ))}
                </select>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  value={assignmentForm.licId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, licId: e.target.value })} 
                  required
                >
                  <option value="" className="text-gray-500">Select LIC</option>
                  {lics.map((lic) => (
                    <option key={lic.id} value={lic.id} className="text-gray-800">{lic.name}</option>
                  ))}
                </select>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 bg-white" 
                  value={assignmentForm.academicYear}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, academicYear: e.target.value })}
                >
                  <option value="1" className="text-gray-800">Year 1</option>
                  <option value="2" className="text-gray-800">Year 2</option>
                  <option value="3" className="text-gray-800">Year 3</option>
                  <option value="4" className="text-gray-800">Year 4</option>
                </select>
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition-all">
                  Create Assignment
                </button>
              </form>
            </div>

            {/* Current Assignments */}
            <div className="bg-white rounded-xl p-5 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Current Assignments</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lecturer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year/Sem</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.slice(0, 5).map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{assignment.module_code}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{assignment.lecturer_name}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">Y{assignment.academic_year}/S{assignment.semester}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeAssignment(assignment.id)} 
                            className="text-red-600 hover:text-red-800 text-sm transition-all">
                            ✗ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hall Allocation View */}
      {mainView === 'hallAllocation' && (
        <HallAllocation apiBase={apiBase} />
      )}

      {/* 3D Visualization */}
      <div className="max-w-7xl mx-auto mt-8 bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏗️ 3D Campus Visualization</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Rotate X
            <input type="range" min="-20" max="35" step="1" value={view3d.rotateX}
              onChange={(e) => setView3d({ ...view3d, rotateX: Number(e.target.value) })} 
              className="w-full" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Rotate Z
            <input type="range" min="-45" max="45" step="1" value={view3d.rotateZ}
              onChange={(e) => setView3d({ ...view3d, rotateZ: Number(e.target.value) })} 
              className="w-full" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Zoom
            <input type="range" min="0.6" max="1.8" step="0.05" value={view3d.zoom}
              onChange={(e) => setView3d({ ...view3d, zoom: Number(e.target.value) })} 
              className="w-full" />
          </label>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 min-h-[400px] overflow-auto">
          <div className="relative min-w-[720px] min-h-[380px]" style={{
            perspective: '900px',
            transformStyle: 'preserve-3d',
          }}>
            <div className="relative w-full min-h-[380px]" style={{
              transform: `rotateX(${view3d.rotateX}deg) rotateZ(${view3d.rotateZ}deg) scale(${view3d.zoom})`,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center 75%',
            }}>
              {campusStructures.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No campus structures yet. Add one to generate the 3D layout.
                </div>
              )}
              {campusStructures.map((structure, index) => {
                const capacity = Number(structure.capacity) || 0;
                const height = Math.max(40, Math.min(160, capacity ? 28 + Math.round(capacity / 3) : 56));
                const x = (index % 6) * 74;
                const z = Math.floor(index / 6) * 66;
                const hue = (index * 37) % 360;
                return (
                  <div
                    key={structure.id || index}
                    className="absolute w-14 transition-all hover:scale-105 cursor-pointer"
                    style={{
                      height: `${height}px`,
                      left: `${x}px`,
                      bottom: `calc(30px + ${z}px)`,
                      transform: 'rotateX(57deg) rotateZ(40deg)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div className="absolute inset-0 rounded-md shadow-lg" style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 75%, 72%), hsl(${hue}, 70%, 55%))`,
                      transform: 'translateZ(18px)',
                    }}></div>
                    <div className="absolute inset-0 rounded-md opacity-95" style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${hue}, 62%, 34%))`,
                      transform: 'translateX(14px) translateY(12px) rotateY(90deg)',
                    }}></div>
                    <div className="absolute left-16 -top-1 min-w-[175px] bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
                      <strong className="text-xs block text-gray-800">{structure.name}</strong>
                      <span className="text-xs text-gray-600">Cap: {capacity || '-'}</span>
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