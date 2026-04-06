import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  BookOpen,
  Building2,
  UserPlus,
  Users,
  BookPlus,
  Link2,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  ClipboardList,
} from 'lucide-react';

import schedulerApi from '../api/scheduler.js';

import moduleCatalog from '../data/moduleCatalog.js';

import HallAllocation from '../components/HallAllocation.jsx';

import { askForText, confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';



const FORBIDDEN_SPECIAL_CHARS = /[~!@#$%^&*()_+]/;

const inferAcademicYearFromModuleCode = (code = '') => {
  const firstDigit = String(code).match(/\d/)?.[0];
  const year = Number(firstDigit);
  if (![1, 2, 3, 4].includes(year)) return null;
  return String(year);
};

// Animated Counter Component
const AnimatedCounter = ({ from = 0, to, duration = 1.2 }) => {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(from + (to - from) * progress);
      setDisplayValue(current);

      if (progress >= 1) clearInterval(interval);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [to, from, duration]);

  return <Motion.span className="inline-block">{displayValue}</Motion.span>;
};

// Skeleton Components
const SkeletonStats = () => (
  <div className="stat-row">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="stat">
        <div className="skeleton-stat"></div>
        <div className="skeleton h-4 mt-3 w-2/3 rounded"></div>
      </div>
    ))}
  </div>
);

const SkeletonTable = ({ rows = 3 }) => (
  <div className="ac-table-wrapper">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton-cell" style={{ width: '20%' }}></div>
        <div className="skeleton-cell" style={{ width: '20%' }}></div>
        <div className="skeleton-cell" style={{ width: '20%' }}></div>
        <div className="skeleton-cell" style={{ width: '20%' }}></div>
        <div className="skeleton-cell" style={{ width: '20%' }}></div>
      </div>
    ))}
  </div>
);

const SkeletonCard = () => (
  <div className="action-card">
    <div>
      <div className="skeleton h-6 w-1/2 mb-2"></div>
      <div className="skeleton h-4 w-3/4"></div>
    </div>
    <div className="skeleton h-10 w-24"></div>
  </div>
);



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

  const [academicCalendar, setAcademicCalendar] = useState([]);

  const [mainView, setMainView] = useState('lectures');

  

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
  const [activeFormId, setActiveFormId] = useState(null);

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  const staggerContainerVariant = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.04 },
    },
  };

  const buttonMotionProps = {
    whileHover: { scale: 1.05, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)' },
    whileTap: { scale: 0.96 },
    transition: { duration: 0.2 },
  };

  const tableRowVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { delay: index * 0.06, duration: 0.3, ease: 'easeOut' },
    }),
  };

  const formPanelVariant = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const iconHoverVariant = {
    rest: { rotate: 0, scale: 1 },
    hover: { rotate: 10, scale: 1.15, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const floatingAvatarVariant = {
    animate: { y: [0, -8, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  };

  const floatingIdleVariant = (delay = 0) => ({
    animate: { 
      y: [0, -6, 0], 
      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay } 
    },
  });

  const mainViews = ['lectures', 'hallAllocation'];
  const isFormOverlayActive = showCalendarForm || Boolean(activeFormId);
  const isCalendarRangeInvalid =
    Boolean(calendarEventForm.start_date)
    && Boolean(calendarEventForm.end_date)
    && calendarEventForm.end_date < calendarEventForm.start_date;

  const activateForm = (formId) => setActiveFormId(formId);
  const deactivateForm = (event, formId) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setActiveFormId((current) => (current === formId ? null : current));
    }
  };

  const focusMainViewButton = (view) => {
    const tabButton = document.querySelector(`[data-main-view="${view}"]`);
    tabButton?.focus();
  };

  const handleMainViewKeyDown = (event) => {
    const currentIndex = mainViews.indexOf(mainView);
    if (currentIndex < 0) return;

    let targetIndex = null;
    if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % mainViews.length;
    if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + mainViews.length) % mainViews.length;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = mainViews.length - 1;

    if (targetIndex === null) return;

    event.preventDefault();
    const nextView = mainViews[targetIndex];
    setMainView(nextView);
    requestAnimationFrame(() => focusMainViewButton(nextView));
  };



  const showMessage = (text, type = 'success') => {

    setMessage({ text, type });

    setTimeout(() => setMessage({ text: '', type: '' }), 5000);

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

    if (!lecturerForm.name.trim()) {

      showWarning('Validation required', 'Lecturer name is required.');

      return;

    }

    if (FORBIDDEN_SPECIAL_CHARS.test(lecturerForm.name.trim()) || FORBIDDEN_SPECIAL_CHARS.test(lecturerForm.department.trim())) {

      showWarning('Validation required', 'Lecturer name/department cannot contain ~!@#$%^&*()_+');

      return;

    }

    if (lecturerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lecturerForm.email)) {

      showWarning('Validation required', 'Please provide a valid lecturer email address.');

      return;

    }



    try {

      await schedulerApi.addItem('instructors', lecturerForm);

      setLecturerForm({ name: '', department: '', email: '' });

      showMessage('Lecturer added successfully');

      showSuccess('Lecturer added');

      await loadLecturers();

    } catch (err) {

      console.error('Add lecturer error:', err);

      showError('Add lecturer failed', err.message || 'Failed to add lecturer');

      showMessage(err.message || 'Failed to add lecturer', 'error');

    }

  };



  const addLic = async (e) => {

    e.preventDefault();

    if (!licForm.name.trim()) {

      showWarning('Validation required', 'LIC name is required.');

      return;

    }

    if (FORBIDDEN_SPECIAL_CHARS.test(licForm.name.trim()) || FORBIDDEN_SPECIAL_CHARS.test(licForm.department.trim())) {

      showWarning('Validation required', 'LIC name/department cannot contain ~!@#$%^&*()_+');

      return;

    }



    try {

      await schedulerApi.addItem('lics', licForm);

      setLicForm({ name: '', department: '' });

      showMessage('LIC added successfully');

      showSuccess('LIC added');

      await loadLics();

    } catch (err) {

      console.error('Add LIC error:', err);

      showError('Add LIC failed', err.message || 'Failed to add LIC');

      showMessage(err.message || 'Failed to add LIC', 'error');

    }

  };



  const addModule = async (e) => {

    e.preventDefault();

    

    if (!moduleForm.code || !moduleForm.name) {

      showWarning('Validation required', 'Module code and name are required.');

      showMessage('Module code and name are required', 'error');

      return;

    }

    if (FORBIDDEN_SPECIAL_CHARS.test(moduleForm.code.trim()) || FORBIDDEN_SPECIAL_CHARS.test(moduleForm.name.trim())) {

      showWarning('Validation required', 'Module code/name cannot contain ~!@#$%^&*()_+');

      return;

    }

    

    const inferredAcademicYear = inferAcademicYearFromModuleCode(moduleForm.code);
    const modulePayload = {
      ...moduleForm,
      academic_year: inferredAcademicYear,
    };

    console.log('Submitting module:', modulePayload);

    

    try {

      const response = await schedulerApi.addItem('modules', modulePayload);

      console.log('Module added response:', response);

      

      setModuleForm({ code: '', name: '', batch_size: '', credits: '', lectures_per_week: '' });

      showMessage('Module added successfully');

      showSuccess('Module added');

      await loadModules();

    } catch (err) {

      console.error('Add module error:', err);

      showError('Add module failed', err.message || 'Failed to add module');

      showMessage(err.message || 'Failed to add module', 'error');

    }

  };



  const applyCatalogModule = () => {

    if (!selectedCatalogModule) return;

    const [code, name] = selectedCatalogModule.split('::');

    setModuleForm({ ...moduleForm, code, name });

  };



  const _addCampusStructure = async (e) => {

    e.preventDefault();

    if (!campusForm.name.trim()) {

      showWarning('Validation required', 'Campus structure name is required.');

      return;

    }

    if (FORBIDDEN_SPECIAL_CHARS.test(campusForm.name.trim())) {

      showWarning('Validation required', 'Campus structure name cannot contain ~!@#$%^&*()_+');

      return;

    }

    if (campusForm.capacity && Number(campusForm.capacity) < 1) {

      showWarning('Validation required', 'Capacity must be at least 1.');

      return;

    }



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

      showSuccess('Campus structure added');

      await loadCampusStructures();

    } catch (err) {

      showError('Add structure failed', err.message || 'Failed to add campus structure');

      showMessage(err.message || 'Failed to add campus structure', 'error');

    }

  };



  const addAssignment = async (e) => {

    e.preventDefault();

    if (!assignmentForm.moduleId || !assignmentForm.lecturerId || !assignmentForm.licId) {

      showWarning('Validation required', 'Please fill all required assignment fields.');

      showMessage('Please fill all required fields', 'error');

      return;

    }

    try {

      await schedulerApi.createAssignment(assignmentForm);

      showMessage('Module assignment created');

      showSuccess('Assignment created');

      setAssignmentForm({ moduleId: '', lecturerId: '', licId: '', academicYear: '1', semester: '1' });

      await loadAssignments();

    } catch (err) {

      showError('Create assignment failed', err.message || 'Failed to create assignment');

      showMessage(err.message || 'Failed to create assignment', 'error');

    }

  };



  const removeAssignment = async (id) => {

    const confirmed = await confirmDelete({

      title: 'Remove assignment?',

      text: 'This assignment will be permanently removed.',

      confirmButtonText: 'Remove assignment',

    });

    if (!confirmed) return;



    try {

      await schedulerApi.deleteAssignment(id);

      showMessage('Assignment removed');

      showSuccess('Assignment removed');

      await loadAssignments();

    } catch (err) {

      showError('Remove assignment failed', err.message || 'Failed to remove assignment');

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

        showSuccess('Timetable approved');

        await loadTimetables();

      } else {

        showError('Approve failed', data.message || 'Failed to approve timetable');

        showMessage(data.message || 'Failed to approve', 'error');

      }

    } catch (err) {

      showMessage('Failed to approve timetable', 'error',err);

    }

  };



  const rejectTimetable = async (id) => {

    const reason = await askForText({

      title: 'Reject timetable',

      inputLabel: 'Reason for rejection',

      inputPlaceholder: 'Enter rejection reason',

      confirmButtonText: 'Reject',

      validationMessage: 'Reason is required to reject the timetable.',

    });

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

        showSuccess('Timetable rejected');

        await loadTimetables();

      } else {

        showError('Reject failed', data.message || 'Failed to reject timetable');

        showMessage(data.message || 'Failed to reject', 'error');

      }

    } catch (err) {

      showMessage('Failed to reject timetable', 'error',err);

    }

  };



  const resolveConflict = async (id) => {

    const resolution = await askForText({

      title: 'Resolve conflict',

      inputLabel: 'Resolution notes',

      inputPlaceholder: 'Describe how this conflict was resolved',

      confirmButtonText: 'Resolve',

      validationMessage: 'Resolution notes are required.',

    });

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

        showSuccess('Conflict resolved');

        await loadConflicts();

      } else {

        showError('Resolve failed', data.message || 'Failed to resolve conflict');

        showMessage(data.message || 'Failed to resolve', 'error');

      }

    } catch (err) {

      showMessage('Failed to resolve conflict', 'error', err);

    }

  };



  const addCalendarEvent = async (e) => {

    e.preventDefault();

    if (isCalendarRangeInvalid) {

      showWarning('Validation required', 'End date cannot be earlier than start date.');

      showMessage('End date cannot be earlier than start date', 'error');

      return;

    }

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

        showSuccess('Calendar event added');

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

        showError('Add event failed', data.message || 'Failed to add event');

        showMessage(data.message || 'Failed to add event', 'error');

      }

    } catch (err) {

      showMessage('Failed to add calendar event', 'error',err);

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



  const pendingApprovals = timetables.filter(t => t.approval_status === 'pending' || !t.approval_status).length;

  const activeConflicts = conflicts.filter(c => !c.resolved).length;

  const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' && !c.resolved).length;

  const calendarTypeIcons = {
    semester_start: CheckCircle2,
    semester_end: XCircle,
    exam_period: AlertTriangle,
    holiday: CalendarDays,
    special_event: ClipboardList,
  };

  useEffect(() => {
    const loadInitialData = async () => {
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
          loadAcademicCalendar(),
        ]);
      } catch (err) {
        console.error('Failed to load some data:', err);
        showMessage('Failed to load some data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // Run once on mount for initial dashboard hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showCalendarForm) {
      setActiveFormId('calendarForm');
      return;
    }
    setActiveFormId((current) => (current === 'calendarForm' ? null : current));
  }, [showCalendarForm]);



  if (loading) {

    return (

      <Motion.div
        className="dashboard-container ac-dashboard"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariant}
      >

        <Motion.div className="dashboard-hero" variants={fadeInUpVariant}>

          <div className="hero-left">

            <div className="skeleton h-10 w-1/3 mb-4 rounded"></div>

            <div className="skeleton h-6 w-2/3 mb-6 rounded"></div>

            <SkeletonStats />

          </div>

          <div className="hero-right">

            <div className="skeleton h-16 w-16 rounded-full"></div>

            <div className="skeleton h-10 w-40 mt-4 rounded-lg"></div>

          </div>

        </Motion.div>

        <Motion.div className="ac-main-menu-wrap" variants={fadeInUpVariant}>

          <div className="skeleton h-12 w-full rounded-xl"></div>

        </Motion.div>

        <Motion.div variants={fadeInUpVariant}>

          <div className="left-col">

            <div className="panel">

              <div className="skeleton h-6 w-1/4 mb-4"></div>

              <SkeletonTable rows={3} />

            </div>

          </div>

        </Motion.div>

      </Motion.div>

    );

  }



  return (

    <Motion.div
      className={`dashboard-container ac-dashboard ${isFormOverlayActive ? 'ac-form-overlay-active' : ''}`}
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariant}
    >

      <div className="ac-form-overlay-backdrop" aria-hidden="true" />

      <Motion.div className="dashboard-hero" variants={fadeInUpVariant}>

        <div className="hero-left">

          <h1>Academic Coordinator Dashboard</h1>

          <p className="hero-sub">Welcome, {user?.name || 'Academic Coordinator'}! Manage timetables, resolve conflicts, and coordinate academic activities.</p>

          <div className="stat-row">

            <Motion.div className="stat" animate="animate" variants={floatingIdleVariant(0)}>

              <div className="stat-value"><AnimatedCounter to={timetables.length} duration={1.2} /></div>

              <div className="stat-label">Total Timetables</div>

            </Motion.div>

            <Motion.div className="stat" animate="animate" variants={floatingIdleVariant(0.2)}>

              <div className="stat-value" style={{ color: pendingApprovals > 0 ? '#f59e0b' : '#10b981' }}><AnimatedCounter to={pendingApprovals} duration={1.2} /></div>

              <div className="stat-label">Pending Approval</div>

            </Motion.div>

            <Motion.div className="stat" animate="animate" variants={floatingIdleVariant(0.4)}>

              <div className="stat-value" style={{ color: activeConflicts > 0 ? '#ef4444' : '#10b981' }}><AnimatedCounter to={activeConflicts} duration={1.2} /></div>

              <div className="stat-label">Active Conflicts</div>

              {highSeverityConflicts > 0 && <div className="stat-hint">Alert: {highSeverityConflicts} high severity</div>}

            </Motion.div>

            <Motion.div className="stat" animate="animate" variants={floatingIdleVariant(0.6)}>

              <div className="stat-value"><AnimatedCounter to={campusStructures.length} duration={1.2} /></div>

              <div className="stat-label">Resources</div>

            </Motion.div>

          </div>

        </div>

        <div className="hero-right">

          <Motion.div className="avatar" animate="animate" variants={floatingAvatarVariant}>{user?.name?.charAt(0) || 'A'}</Motion.div>

          <div className="quick-actions">

            <Motion.button className="primary" onClick={() => setActiveTab('timetables')} {...buttonMotionProps}>Review Timetables</Motion.button>

          </div>

        </div>

      </Motion.div>



      {message.text && (

        <div className={`ac-message ${message.type === 'error' ? 'ac-message-error' : 'ac-message-success'}`}>

          {message.text}

        </div>

      )}

      {/* Top Menu */}

      <Motion.div className="ac-main-menu-wrap" variants={fadeInUpVariant}>

        <div className="ac-main-menu" role="tablist" aria-label="Main dashboard views">

          <button

            id="main-view-tab-lectures"

            type="button"

            role="tab"

            aria-selected={mainView === 'lectures'}

            aria-controls="main-view-panel-lectures"

            tabIndex={mainView === 'lectures' ? 0 : -1}

            data-main-view="lectures"

            onClick={() => setMainView('lectures')}

            onKeyDown={handleMainViewKeyDown}

            className={`ac-main-menu-btn ${mainView === 'lectures' ? 'is-active' : ''}`}

          >

            <span className="ac-menu-btn-content">
              <BookOpen size={16} />
              Lectures
            </span>

          </button>



          <button

            id="main-view-tab-hallAllocation"

            type="button"

            role="tab"

            aria-selected={mainView === 'hallAllocation'}

            aria-controls="main-view-panel-hallAllocation"

            tabIndex={mainView === 'hallAllocation' ? 0 : -1}

            data-main-view="hallAllocation"

            onClick={() => setMainView('hallAllocation')}

            onKeyDown={handleMainViewKeyDown}

            className={`ac-main-menu-btn ${mainView === 'hallAllocation' ? 'is-active' : ''}`}

          >

            <span className="ac-menu-btn-content">
              <Building2 size={16} />
              Hall Allocation
            </span>

          </button>

        </div>

      </Motion.div>

{mainView === 'lectures' && (

  <Motion.div
    key="lectures-view"
    className="dashboard-main"
    id="main-view-panel-lectures"
    role="tabpanel"
    aria-labelledby="main-view-tab-lectures"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
  >

        <div className="left-col">

          {/* Overview Tab Content */}

          {activeTab === 'overview' && (

            <>

              <Motion.div className="action-card" animate="animate" variants={floatingIdleVariant(0)}>

                <div>

                  <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><UserPlus size={16} /></Motion.span>Add Lecturer</h3>

                  <p>Add professors and lecturers with department details</p>

                </div>

                <Motion.button className="action-btn ac-lecture-action-btn" onClick={() => document.getElementById('lecturerForm').scrollIntoView({ behavior: 'smooth' })} {...buttonMotionProps}>Add Now</Motion.button>

              </Motion.div>

              

              <Motion.div className="action-card" animate="animate" variants={floatingIdleVariant(0.15)}>

                <div>

                  <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Users size={16} /></Motion.span>Add LIC</h3>

                  <p>Create module leadership records for allocation</p>

                </div>

                <Motion.button className="action-btn ac-lecture-action-btn" onClick={() => document.getElementById('licForm').scrollIntoView({ behavior: 'smooth' })} {...buttonMotionProps}>Add Now</Motion.button>

              </Motion.div>

              

              <Motion.div className="action-card" animate="animate" variants={floatingIdleVariant(0.3)}>

                <div>

                  <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><BookPlus size={16} /></Motion.span>Add Module</h3>

                  <p>Add new modules from catalog or custom</p>

                </div>

                <Motion.button className="action-btn ac-lecture-action-btn" onClick={() => document.getElementById('moduleForm').scrollIntoView({ behavior: 'smooth' })} {...buttonMotionProps}>Add Now</Motion.button>

              </Motion.div>

              

              <Motion.div className="action-card" animate="animate" variants={floatingIdleVariant(0.45)}>

                <div>

                  <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Link2 size={16} /></Motion.span>Assign Module</h3>

                  <p>Map modules to lecturers and LICs</p>

                </div>

                <Motion.button className="action-btn ac-lecture-action-btn" onClick={() => document.getElementById('assignmentForm').scrollIntoView({ behavior: 'smooth' })} {...buttonMotionProps}>Assign Now</Motion.button>

              </Motion.div>

            </>

          )}



          {/* Timetables Tab Content */}

          {activeTab === 'timetables' && (

            <div className={`panel ac-focus-form ${showCalendarForm || activeFormId === 'calendarForm' ? 'is-active' : ''}`}>

              <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><ClipboardList size={16} /></Motion.span>Timetables for Review</h3>

              <div className="ac-table-wrapper">

                <table className="ac-table">

                  <thead>

                    <tr>

                      <th>Name</th>

                      <th>Semester</th>

                      <th>Year</th>

                      <th>Status</th>

                      <th>Actions</th>

                    </tr>

                  </thead>

                  <tbody>

                    {timetables.length === 0 && (

                      <tr>

                        <td colSpan="5" className="ac-empty-row">No timetables available</td>

                      </tr>

                    )}

                    {timetables.map((timetable, index) => (

                      <Motion.tr key={timetable.id} initial="hidden" animate="visible" variants={tableRowVariant} custom={index}>

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

                              <Motion.button className="ac-approve-btn" onClick={() => approveTimetable(timetable.id)} {...buttonMotionProps}><CheckCircle2 size={14} />Approve</Motion.button>

                              <Motion.button className="ac-reject-btn" onClick={() => rejectTimetable(timetable.id)} {...buttonMotionProps}><XCircle size={14} />Reject</Motion.button>

                            </>

                          )}

                        </td>

                      </Motion.tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* Conflicts Tab Content */}

          {activeTab === 'conflicts' && (

            <div className="panel">

              <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><AlertTriangle size={16} /></Motion.span>Scheduling Conflicts</h3>

              {highSeverityConflicts > 0 && (

                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">

                  Alert: {highSeverityConflicts} high severity conflicts require immediate attention!

                </div>

              )}

              <div className="ac-table-wrapper">

                <table className="ac-table">

                  <thead>

                    <tr>

                      <th>Type</th>

                      <th>Description</th>

                      <th>Severity</th>

                      <th>Timetable</th>

                      <th>Action</th>

                    </tr>

                  </thead>

                  <tbody>

                    {conflicts.length === 0 && (

                      <tr>

                        <td colSpan="5" className="ac-empty-row">No conflicts found</td>

                      </tr>

                    )}

                    {conflicts.map((conflict, index) => (

                      <Motion.tr key={conflict.id} initial="hidden" animate="visible" variants={tableRowVariant} custom={index}>

                        <td>{conflict.conflict_type}</td>

                        <td>{conflict.description}</td>

                        <td><span className={`ac-severity ${conflict.severity}`}>{conflict.severity}</span></td>

                        <td>{conflict.timetable_name}</td>

                        <td>

                          {!conflict.resolved && (

                            <Motion.button className="ac-resolve-btn" onClick={() => resolveConflict(conflict.id)} {...buttonMotionProps}>Resolve</Motion.button>

                          )}

                        </td>

                      </Motion.tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* Resources Tab Content */}

          {activeTab === 'resources' && (

            <div className="panel">

              <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Building2 size={16} /></Motion.span>Campus Resources</h3>

              <p>Halls: {hallCount} | Labs: {labCount} | Floors: {uniqueFloorCount}</p>

              <div className="ac-table-wrapper">

                <table className="ac-table">

                  <thead>

                    <tr>

                      <th>Name</th>

                      <th>Type</th>

                      <th>Building</th>

                      <th>Floor</th>

                      <th>Capacity</th>

                    </tr>

                  </thead>

                  <tbody>

                    {campusStructures.map((structure, index) => (

                      <Motion.tr key={structure.id} initial="hidden" animate="visible" variants={tableRowVariant} custom={index}>

                        <td>{structure.name}</td>

                        <td><span className="ac-type-pill">{getCampusType(structure)}</span></td>

                        <td>{getFeatureValue(structure.features, 'building') || '-'}</td>

                        <td>{getFeatureValue(structure.features, 'floor') || '-'}</td>

                        <td>{structure.capacity || '-'}</td>

                      </Motion.tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* Calendar Tab Content */}

          {activeTab === 'calendar' && (

            <div className="panel">

              <div className="flex justify-between items-center mb-4">

                <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><CalendarDays size={16} /></Motion.span>Academic Calendar</h3>

                <Motion.button className="primary" onClick={() => setShowCalendarForm(!showCalendarForm)} {...buttonMotionProps}>

                  {showCalendarForm ? 'Cancel' : '+ Add Event'}

                </Motion.button>

              </div>

              

              {showCalendarForm && (

                <Motion.form onSubmit={addCalendarEvent} className="mb-5 p-4 bg-gray-50 rounded-lg" onFocusCapture={() => activateForm('calendarForm')} onBlurCapture={(event) => deactivateForm(event, 'calendarForm')} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: 'easeOut' }}>

                  <input className="ac-input mb-2" placeholder="Event Name" value={calendarEventForm.event_name}

                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_name: e.target.value })} required />

                  <select className="ac-input mb-2" value={calendarEventForm.event_type}

                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, event_type: e.target.value })}>

                    <option value="semester_start">Semester Start</option>

                    <option value="semester_end">Semester End</option>

                    <option value="exam_period">Exam Period</option>

                    <option value="holiday">Holiday</option>

                    <option value="special_event">Special Event</option>

                  </select>

                  <input className="ac-input mb-2" type="date" placeholder="Start Date" value={calendarEventForm.start_date}

                    onChange={(e) => {
                      const nextStartDate = e.target.value;
                      setCalendarEventForm((prev) => ({
                        ...prev,
                        start_date: nextStartDate,
                        end_date: prev.end_date && nextStartDate && prev.end_date < nextStartDate ? nextStartDate : prev.end_date,
                      }));
                    }} required />

                  <input className="ac-input mb-2" type="date" placeholder="End Date" value={calendarEventForm.end_date}

                    min={calendarEventForm.start_date || undefined}

                    aria-invalid={isCalendarRangeInvalid}

                    onChange={(e) => setCalendarEventForm({ ...calendarEventForm, end_date: e.target.value })} required />

                  {isCalendarRangeInvalid && (
                    <p className="text-xs text-red-600 mb-2">End date cannot be earlier than start date.</p>
                  )}

                  <Motion.button className="dashboard-btn w-full" type="submit" {...buttonMotionProps}>Add Event</Motion.button>

                </Motion.form>

              )}



              <div className="ac-calendar-grid">

                {academicCalendar.map((event) => {
                  const CalendarTypeIcon = calendarTypeIcons[event.event_type] || CalendarDays;
                  const eventTypeLabel = String(event.event_type || 'event').replace(/_/g, ' ');

                  return (
                    <div key={event.id} className="ac-calendar-card">
                      <div className={`ac-calendar-type ${event.event_type}`}>
                        <CalendarTypeIcon size={12} />
                        <span>{eventTypeLabel}</span>
                      </div>

                      <h3>{event.event_name}</h3>

                      <p>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</p>

                      <p>Year: {event.academic_year} | Semester: {event.semester || 'N/A'}</p>
                    </div>
                  );
                })}

              </div>

            </div>

          )}

        </div>



        <div className="right-col">

          {/* Quick Actions */}

          <div className="panel">

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><ClipboardList size={16} /></Motion.span>Quick Actions</h3>

            <div className="shortcuts">

              <Motion.div animate="animate" variants={floatingIdleVariant(0)}>
                <Motion.button type="button" className="chip ac-ui-chip" onClick={() => setActiveTab('timetables')} {...buttonMotionProps}><Motion.span initial="rest" whileHover="hover" variants={iconHoverVariant}><ClipboardList size={14} /></Motion.span>Review Timetables</Motion.button>
              </Motion.div>

              <Motion.div animate="animate" variants={floatingIdleVariant(0.1)}>
                <Motion.button type="button" className="chip ac-ui-chip" onClick={() => setActiveTab('conflicts')} {...buttonMotionProps}><Motion.span initial="rest" whileHover="hover" variants={iconHoverVariant}><AlertTriangle size={14} /></Motion.span>View Conflicts</Motion.button>
              </Motion.div>

              <Motion.div animate="animate" variants={floatingIdleVariant(0.2)}>
                <Motion.button type="button" className="chip ac-ui-chip" onClick={() => setActiveTab('resources')} {...buttonMotionProps}><Motion.span initial="rest" whileHover="hover" variants={iconHoverVariant}><Building2 size={14} /></Motion.span>Manage Resources</Motion.button>
              </Motion.div>

              <Motion.div animate="animate" variants={floatingIdleVariant(0.3)}>
                <Motion.button type="button" className="chip ac-ui-chip" onClick={() => setActiveTab('calendar')} {...buttonMotionProps}><Motion.span initial="rest" whileHover="hover" variants={iconHoverVariant}><CalendarDays size={14} /></Motion.span>Calendar</Motion.button>
              </Motion.div>

            </div>

          </div>



          {/* Add Lecturer Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'lecturerForm' ? 'is-active' : ''}`} id="lecturerForm" initial="hidden" animate="visible" variants={formPanelVariant}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><UserPlus size={16} /></Motion.span>Add Lecturer</h3>

            <form onSubmit={addLecturer} className="ac-form" onFocusCapture={() => activateForm('lecturerForm')} onBlurCapture={(event) => deactivateForm(event, 'lecturerForm')}>

              <input className="ac-input" placeholder="Lecturer name" value={lecturerForm.name}

                onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })} required />

              <input className="ac-input" placeholder="Department" value={lecturerForm.department}

                onChange={(e) => setLecturerForm({ ...lecturerForm, department: e.target.value })} />

              <input className="ac-input" placeholder="Email" value={lecturerForm.email}

                onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} />

              <Motion.button className="dashboard-btn ac-ui-action" type="submit" {...buttonMotionProps}><UserPlus size={15} />Add Lecturer</Motion.button>

            </form>

          </Motion.div>



          {/* Add LIC Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'licForm' ? 'is-active' : ''}`} id="licForm" initial="hidden" animate="visible" variants={formPanelVariant}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Users size={16} /></Motion.span>Add LIC</h3>

            <form onSubmit={addLic} className="ac-form" onFocusCapture={() => activateForm('licForm')} onBlurCapture={(event) => deactivateForm(event, 'licForm')}>

              <input className="ac-input" placeholder="LIC name" value={licForm.name}

                onChange={(e) => setLicForm({ ...licForm, name: e.target.value })} required />

              <input className="ac-input" placeholder="Department" value={licForm.department}

                onChange={(e) => setLicForm({ ...licForm, department: e.target.value })} />

              <Motion.button className="dashboard-btn ac-ui-action" type="submit" {...buttonMotionProps}><Users size={15} />Add LIC</Motion.button>

            </form>

          </Motion.div>



          {/* Add Module Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'moduleForm' ? 'is-active' : ''}`} id="moduleForm" initial="hidden" animate="visible" variants={formPanelVariant}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><BookPlus size={16} /></Motion.span>Add Module</h3>

            <form onSubmit={addModule} className="ac-form" onFocusCapture={() => activateForm('moduleForm')} onBlurCapture={(event) => deactivateForm(event, 'moduleForm')}>

              <select className="ac-input" value={selectedCatalogModule}

                onChange={(e) => setSelectedCatalogModule(e.target.value)}>

                <option value="">Select from catalog</option>

                {moduleCatalog.map((module) => (

                  <option key={`${module.code}-${module.name}`} value={`${module.code}::${module.name}`}>

                    {module.code} - {module.name}

                  </option>

                ))}

              </select>

              <Motion.button type="button" className="dashboard-btn ac-inline-btn" onClick={applyCatalogModule} {...buttonMotionProps}>

                Use Selected

              </Motion.button>

              <input className="ac-input" placeholder="Module code (required)" value={moduleForm.code}

                onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })} required />

              {moduleForm.code && (
                <p className="text-xs text-gray-600 -mt-1">
                  Auto Academic Year: {inferAcademicYearFromModuleCode(moduleForm.code) || 'Not detected'}
                </p>
              )}

              <input className="ac-input" placeholder="Module name (required)" value={moduleForm.name}

                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} required />

              <input className="ac-input" placeholder="Credits (optional)" value={moduleForm.credits}

                onChange={(e) => setModuleForm({ ...moduleForm, credits: e.target.value })} />

              <input className="ac-input" placeholder="Lectures per week (optional)" value={moduleForm.lectures_per_week}

                onChange={(e) => setModuleForm({ ...moduleForm, lectures_per_week: e.target.value })} />

              <Motion.button className="dashboard-btn ac-ui-action" type="submit" {...buttonMotionProps}><BookPlus size={15} />Add Module</Motion.button>

            </form>

          </Motion.div>



          {/* Add Assignment Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'assignmentForm' ? 'is-active' : ''}`} id="assignmentForm" initial="hidden" animate="visible" variants={formPanelVariant}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Link2 size={16} /></Motion.span>Assign Module</h3>

            <form onSubmit={addAssignment} className="ac-form" onFocusCapture={() => activateForm('assignmentForm')} onBlurCapture={(event) => deactivateForm(event, 'assignmentForm')}>

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

              <Motion.button className="dashboard-btn ac-ui-action" type="submit" {...buttonMotionProps}><Link2 size={15} />Create Assignment</Motion.button>

            </form>

          </Motion.div>



          {/* Current Assignments */}

          <div className="panel">

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><ClipboardList size={16} /></Motion.span>Current Assignments</h3>

            <div className="ac-table-wrapper">

              <table className="ac-table">

                <thead>

                  <tr>

                    <th>Module</th>

                    <th>Lecturer</th>

                    <th>Year/Sem</th>

                    <th></th>

                  </tr>

                </thead>

                <tbody>

                  {assignments.slice(0, 5).map((assignment, index) => (

                    <Motion.tr key={assignment.id} initial="hidden" animate="visible" variants={tableRowVariant} custom={index}>

                      <td>{assignment.module_code}</td>

                      <td>{assignment.lecturer_name}</td>

                      <td>Y{assignment.academic_year}/S{assignment.semester}</td>

                      <td><Motion.button className="ac-remove-btn" onClick={() => removeAssignment(assignment.id)} {...buttonMotionProps}><Trash2 size={14} />Remove</Motion.button></td>

                    </Motion.tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </Motion.div>

)}

{mainView === 'hallAllocation' && (

  <Motion.div
    key="hall-allocation-view"
    id="main-view-panel-hallAllocation"
    role="tabpanel"
    aria-labelledby="main-view-tab-hallAllocation"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
  >
    <HallAllocation apiBase={apiBase} />
  </Motion.div>

)}

      {/* 3D Visualization Section */}

      <Motion.div className="ac-3d-card" variants={fadeInUpVariant}>

        <h2>3D Campus Visualization</h2>

        <div className="ac-3d-controls">

          <label>Rotate X <input type="range" min="-20" max="35" step="1" value={view3d.rotateX}

            onChange={(e) => setView3d({ ...view3d, rotateX: Number(e.target.value) })} /></label>

          <label>Rotate Z <input type="range" min="-45" max="45" step="1" value={view3d.rotateZ}

            onChange={(e) => setView3d({ ...view3d, rotateZ: Number(e.target.value) })} /></label>

          <label>Zoom <input type="range" min="0.6" max="1.8" step="0.05" value={view3d.zoom}

            onChange={(e) => setView3d({ ...view3d, zoom: Number(e.target.value) })} /></label>

          <Motion.button className="dashboard-btn" onClick={() => setView3d({ rotateX: 10, rotateZ: -18, zoom: 1 })} {...buttonMotionProps}>Reset View</Motion.button>

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

      </Motion.div>

    </Motion.div>

  );

};



export default AcademicCoordinatorDashboard;


