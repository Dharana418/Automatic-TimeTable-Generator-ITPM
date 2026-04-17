import React, { useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ClipboardList,
  Menu,
  X,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

import schedulerApi from '../api/scheduler.js';

import HallAllocation from '../components/HallAllocation.jsx';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

import { askForText, confirmDelete, showError, showSuccess, showValidationErrors, showWarning } from '../utils/alerts.js';

import backgroundImage from '../assets/room-interior-design.jpg';



const FORBIDDEN_SPECIAL_CHARS = /[~!@#$%^&*()_+]/;
const MODULE_CODE_PATTERN = /^[A-Za-z]{2}\d{4}$/;
const MODULE_NAME_PATTERN = /^[A-Za-z ]+$/;
const TWO_DIGIT_NUMBER_PATTERN = /^\d{2}$/;

const MODULE_SPECIALIZATION_OPTIONS = ['SE', 'IT', 'IME', 'General'];

const sanitizeModuleCodeInput = (value = '') => {
  const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letters = cleaned.match(/^[A-Z]{0,2}/)?.[0] || '';
  const digits = cleaned.slice(letters.length).replace(/\D/g, '').slice(0, 4);
  return `${letters}${digits}`.slice(0, 6);
};

const sanitizeModuleNameInput = (value = '') => String(value || '')
  .replace(/[^A-Za-z\s]/g, '')
  .replace(/\s{2,}/g, ' ')
  .replace(/^\s+/, '');

const sanitizeLectureCountInput = (value = '') => String(value || '').replace(/\D/g, '').slice(0, 2);

const blockedToastMessages = {
  code: {
    title: 'Module code blocked',
    text: 'Use exactly 2 English letters followed by 4 digits. Keys like ! # % $ ^ & * ( ) _ are blocked.',
  },
  name: {
    title: 'Module name blocked',
    text: 'Use English letters and spaces only. Numbers, +, -, and special characters are not allowed.',
  },
  lectures: {
    title: 'Lectures per week blocked',
    text: 'Use only 2 digits. Special characters, +, and - are not allowed.',
  },
};

const isNavigationKey = (key) => [
  'Backspace',
  'Delete',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Escape',
  'Enter',
].includes(key);

const hasModifierKey = (event) => event.ctrlKey || event.metaKey || event.altKey;

const isAllowedModuleCodeKey = (key) => /[a-zA-Z0-9]/.test(key);

const getBeforeInputText = (event) => {
  if (typeof event.data === 'string') return event.data;
  return String(event.nativeEvent?.data || '');
};

const getNextInputValue = (element, insertedValue) => {
  const currentValue = String(element?.value || '');
  const start = typeof element?.selectionStart === 'number' ? element.selectionStart : currentValue.length;
  const end = typeof element?.selectionEnd === 'number' ? element.selectionEnd : currentValue.length;
  return `${currentValue.slice(0, start)}${insertedValue}${currentValue.slice(end)}`;
};

const showBlockedModuleInputToast = (field) => {
  const meta = blockedToastMessages[field];
  if (!meta) return;
  showWarning(meta.title, meta.text);
};

const getModuleCodeCounts = (value = '') => {
  const normalized = String(value || '').toUpperCase();
  return {
    letters: (normalized.match(/[A-Z]/g) || []).length,
    digits: (normalized.match(/\d/g) || []).length,
  };
};

const handleModuleCodeKeyDown = (event, currentValue) => {
  if (hasModifierKey(event) || isNavigationKey(event.key) || event.key.length !== 1) return;

  const key = event.key;
  const { letters, digits } = getModuleCodeCounts(currentValue);

  if (!isAllowedModuleCodeKey(key)) {
    event.preventDefault();
    showBlockedModuleInputToast('code');
    return;
  }

  if (/[a-zA-Z]/.test(key)) {
    if (letters >= 2 || digits > 0) {
      event.preventDefault();
      showBlockedModuleInputToast('code');
    }
    return;
  }

  if (/\d/.test(key)) {
    if (letters < 2 || digits >= 4) {
      event.preventDefault();
      showBlockedModuleInputToast('code');
    }
  }
};

const handleModuleNameKeyDown = (event) => {
  if (hasModifierKey(event) || isNavigationKey(event.key) || event.key.length !== 1) return;

  if (!/[a-zA-Z\s]/.test(event.key)) {
    event.preventDefault();
    showBlockedModuleInputToast('name');
  }
};

const handleLecturesKeyDown = (event, currentValue) => {
  if (hasModifierKey(event) || isNavigationKey(event.key) || event.key.length !== 1) return;

  if (!/\d/.test(event.key) || String(currentValue || '').length >= 2) {
    event.preventDefault();
    showBlockedModuleInputToast('lectures');
  }
};

const handleModuleCodePaste = (event) => {
  const pasted = event.clipboardData.getData('text');
  if (sanitizeModuleCodeInput(pasted) !== String(pasted || '').toUpperCase()) {
    event.preventDefault();
    showBlockedModuleInputToast('code');
  }
};

const handleModuleNamePaste = (event) => {
  const pasted = event.clipboardData.getData('text');
  if (sanitizeModuleNameInput(pasted) !== String(pasted || '')) {
    event.preventDefault();
    showBlockedModuleInputToast('name');
  }
};

const handleLecturesPaste = (event) => {
  const pasted = event.clipboardData.getData('text');
  if (sanitizeLectureCountInput(pasted) !== String(pasted || '')) {
    event.preventDefault();
    showBlockedModuleInputToast('lectures');
  }
};

const handleModuleCodeBeforeInput = (event) => {
  const inserted = getBeforeInputText(event);
  if (!inserted) return;

  if (!/^[a-zA-Z0-9]+$/.test(inserted)) {
    event.preventDefault();
    showBlockedModuleInputToast('code');
    return;
  }

  const nextValue = getNextInputValue(event.currentTarget, inserted);
  if (sanitizeModuleCodeInput(nextValue) !== String(nextValue).toUpperCase()) {
    event.preventDefault();
    showBlockedModuleInputToast('code');
  }
};

const handleModuleNameBeforeInput = (event) => {
  const inserted = getBeforeInputText(event);
  if (!inserted) return;

  const nextValue = getNextInputValue(event.currentTarget, inserted);
  if (sanitizeModuleNameInput(nextValue) !== nextValue) {
    event.preventDefault();
    showBlockedModuleInputToast('name');
  }
};

const handleLecturesBeforeInput = (event) => {
  const inserted = getBeforeInputText(event);
  if (!inserted) return;

  const nextValue = getNextInputValue(event.currentTarget, inserted);
  if (sanitizeLectureCountInput(nextValue) !== nextValue) {
    event.preventDefault();
    showBlockedModuleInputToast('lectures');
  }
};

const handleModuleCodeInput = (event, currentValue, setModuleForm) => {
  const rawValue = String(event.currentTarget.value || '');
  const sanitizedValue = sanitizeModuleCodeInput(rawValue);
  if (sanitizedValue !== rawValue.toUpperCase()) {
    showBlockedModuleInputToast('code');
    event.currentTarget.value = sanitizedValue;
  }
  if (sanitizedValue !== currentValue) {
    setModuleForm((previous) => ({ ...previous, code: sanitizedValue }));
  }
};

const handleModuleNameInput = (event, currentValue, setModuleForm) => {
  const rawValue = String(event.currentTarget.value || '');
  const sanitizedValue = sanitizeModuleNameInput(rawValue);
  if (sanitizedValue !== rawValue) {
    showBlockedModuleInputToast('name');
  }
  if (sanitizedValue !== currentValue) {
    setModuleForm((previous) => ({ ...previous, name: sanitizedValue }));
  }
};

const handleLecturesInput = (event, currentValue, setModuleForm) => {
  const rawValue = String(event.currentTarget.value || '');
  const sanitizedValue = sanitizeLectureCountInput(rawValue);
  if (sanitizedValue !== rawValue) {
    showBlockedModuleInputToast('lectures');
  }
  if (sanitizedValue !== currentValue) {
    setModuleForm((previous) => ({ ...previous, lectures_per_week: sanitizedValue }));
  }
};

const inferAcademicYearFromModuleCode = (code = '') => {
  const firstDigit = String(code).match(/\d/)?.[0];
  const year = Number(firstDigit);
  if (![1, 2, 3, 4].includes(year)) return null;
  return String(year);
};

const inferSemesterFromModuleCode = (code = '') => {
  const digits = String(code || '').replace(/\D/g, '');
  const semesterFlag = digits[1];
  if (semesterFlag === '0') return '1';
  if (semesterFlag === '1') return '2';
  if (/\d/.test(String(semesterFlag || ''))) return '2';
  return null;
};

const inferSpecializationFromModuleCode = (code = '') => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return 'General';
  if (normalizedCode.startsWith('SE')) return 'SE';
  if (normalizedCode.startsWith('IT')) return 'IT';
  if (normalizedCode.startsWith('IE') || normalizedCode.startsWith('IM')) return 'IME';
  return 'General';
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

const Sparkline = ({ values = [], stroke = '#10b981' }) => {
  const points = values.length > 1
    ? values
        .map((value, index) => `${(index / (values.length - 1)) * 100},${100 - value}`)
        .join(' ')
    : '0,100 100,100';

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 44, display: 'block' }}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const InsightTile = ({ label, value, hint, tone = 'emerald', values = [], icon }) => {
  const toneMap = {
    emerald: { border: 'rgba(16,185,129,0.18)', glow: 'rgba(16,185,129,0.12)', text: '#34d399', stroke: '#10b981' },
    blue: { border: 'rgba(59,130,246,0.18)', glow: 'rgba(59,130,246,0.12)', text: '#93c5fd', stroke: '#3b82f6' },
    amber: { border: 'rgba(245,158,11,0.18)', glow: 'rgba(245,158,11,0.12)', text: '#fbbf24', stroke: '#f59e0b' },
    red: { border: 'rgba(248,113,113,0.18)', glow: 'rgba(248,113,113,0.12)', text: '#fca5a5', stroke: '#ef4444' },
  };
  const t = toneMap[tone] || toneMap.emerald;

  return (
    <Motion.div
      className="ac-insight-tile"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ borderColor: t.border, boxShadow: `0 16px 36px ${t.glow}` }}
    >
      <div className="ac-insight-head">
        <div className="ac-insight-copy">
          <p className="ac-insight-label">{label}</p>
          <div className="ac-insight-value">
            {icon}
            <AnimatedCounter to={value} duration={1.2} />
          </div>
          {hint && <p className="ac-insight-hint">{hint}</p>}
        </div>
        <div className="ac-insight-chart">
          <Sparkline values={values} stroke={t.stroke} />
        </div>
      </div>
    </Motion.div>
  );
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
  const location = useLocation();
  const navigate = useNavigate();

  const [_activeTab, setActiveTab] = useState('overview');

  

  // Data states

  const [lecturers, setLecturers] = useState([]);

  const [lics, setLics] = useState([]);

  const [modules, setModules] = useState([]);

  const [campusStructures, setCampusStructures] = useState([]);

  const [assignments, setAssignments] = useState([]);

  const [timetables, setTimetables] = useState([]);

  const [conflicts, setConflicts] = useState([]);

  const [_academicCalendar, setAcademicCalendar] = useState([]);

  const [mainView, setMainView] = useState('lectures');

  

  // Form states

  const [lecturerForm, setLecturerForm] = useState({ name: '', department: '', email: '' });

  const [licForm, setLicForm] = useState({ name: '', department: '' });

  const [moduleForm, setModuleForm] = useState({
    code: '',
    name: '',
    specialization: 'SE',
    academic_year: '1',
    semester: '1',
    batch_size: '',
    credits: '',
    lectures_per_week: '',
  });
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

  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [editingAssignmentForm, setEditingAssignmentForm] = useState({
    lecturerId: '',
    licId: '',
    academicYear: '1',
    semester: '1',
  });
  const [editingAssignmentLabel, setEditingAssignmentLabel] = useState('');

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

  const [moduleSidebarOpen, setModuleSidebarOpen] = useState(false);
  const [assignmentFilters, setAssignmentFilters] = useState({
    academicYear: 'all',
    semester: 'all',
    specialization: 'all',
  });

  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [activeFormId, setActiveFormId] = useState(null);
  const commandSearchValue = `${timetables.length} timetables ${assignments.length} assignments ${conflicts.length} conflicts`.toLowerCase();

  const academicNavigationGroups = useMemo(() => ([
    {
      title: 'Academic Fields',
      items: [
        { id: 'acOverview', label: 'Overview', to: '/dashboard#acOverview', type: 'section', color: '#0f5d99', icon: <ClipboardList size={16} /> },
        { id: 'main-view-panel-lectures', label: 'Modules Assignment', to: '/dashboard#main-view-panel-lectures', type: 'section', color: '#1d4ed8', icon: <BookOpen size={16} /> },
        { id: 'addedModules', label: 'Added Modules', to: '/faculty/modules/added', color: '#4f46e5', icon: <BookOpen size={16} /> },
        { id: 'main-view-panel-hallAllocation', label: 'Hall Allocation', to: '/dashboard#main-view-panel-hallAllocation', type: 'section', color: '#0f766e', icon: <Building2 size={16} /> },
      ],
    },
    {
      title: 'Review Fields',
      items: [
        { id: 'timetablePanel', label: 'Timetables', to: '/dashboard#timetablePanel', type: 'section', color: '#166534', icon: <CheckCircle2 size={16} /> },
        { id: 'acConflictsPanel', label: 'Conflicts', to: '/dashboard#acConflictsPanel', type: 'section', color: '#b91c1c', icon: <AlertTriangle size={16} /> },
        { id: 'acResourcesPanel', label: 'Resources', to: '/dashboard#acResourcesPanel', type: 'section', color: '#0f766e', icon: <Building2 size={16} /> },
        { id: 'acCalendarPanel', label: 'Academic Calendar', to: '/dashboard#acCalendarPanel', type: 'section', color: '#b45309', icon: <CalendarDays size={16} /> },
      ],
    },
  ]), []);

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

  const mainViews = ['lectures', 'hallAllocation'];
  const isCalendarRangeInvalid =
    Boolean(calendarEventForm.start_date)
    && Boolean(calendarEventForm.end_date)
    && calendarEventForm.end_date < calendarEventForm.start_date;

  const dashboardBackgroundStyle = {
    backgroundImage: `linear-gradient(rgba(9, 17, 32, 0.62), rgba(9, 17, 32, 0.72)), url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
  };

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

  const scrollToAssignmentSection = (sectionId, tab = 'overview') => {
    setActiveTab(tab);
    setModuleSidebarOpen(false);
    window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
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

        credentials: 'include',

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

      const response = await fetch(`${apiBase}/api/academic-coordinator/conflicts`, {

        credentials: 'include',

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

  const _addLecturer = async (e) => {

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



  const _addLic = async (e) => {

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

    const moduleCode = String(moduleForm.code || '').trim();
    const moduleName = String(moduleForm.name || '').trim();
    const lecturesPerWeek = String(moduleForm.lectures_per_week || '').trim();
    const credits = String(moduleForm.credits || '').trim();
    const validationErrors = [];

    if (!moduleCode) validationErrors.push('Module code is required.');
    else if (!MODULE_CODE_PATTERN.test(moduleCode)) validationErrors.push('Module code must contain 2 English letters followed by 4 digits, like IT1234.');

    if (!moduleName) validationErrors.push('Module name is required.');
    else if (!MODULE_NAME_PATTERN.test(moduleName)) validationErrors.push('Module name can contain only English letters and spaces.');

    if (!moduleForm.specialization) validationErrors.push('Specialization is required.');
    if (!moduleForm.academic_year) validationErrors.push('Academic year is required.');
    if (!moduleForm.semester) validationErrors.push('Semester is required.');
    if (!credits) validationErrors.push('Credits is required.');

    if (!lecturesPerWeek) validationErrors.push('Lectures per week is required.');
    else if (!TWO_DIGIT_NUMBER_PATTERN.test(lecturesPerWeek)) validationErrors.push('Lectures per week must contain exactly 2 digits, like 08 or 12.');

    if (validationErrors.length) {
      showValidationErrors(validationErrors, 'Module validation required');
      return;
    }

    

    const inferredAcademicYear = inferAcademicYearFromModuleCode(moduleCode);
    const modulePayload = {
      ...moduleForm,
      code: moduleCode.toUpperCase(),
      name: moduleName,
      lectures_per_week: lecturesPerWeek,
      credits,
      specialization: moduleForm.specialization,
      academic_year: moduleForm.academic_year || inferredAcademicYear || '1',
      semester: moduleForm.semester || '1',
    };

    console.log('Submitting module:', modulePayload);

    

    try {

      const response = await schedulerApi.addItem('modules', modulePayload);

      console.log('Module added response:', response);

      

      setModuleForm({
        code: '',
        name: '',
        specialization: 'SE',
        academic_year: '1',
        semester: '1',
        batch_size: '',
        credits: '',
        lectures_per_week: '',
      });

      showSuccess('Module added successfully', 'The module has been saved and is ready for assignment.');

      await loadModules();

    } catch (err) {

      console.error('Add module error:', err);

      showError('Add module failed', err.message || 'Failed to add module');

    }

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

  const startEditAssignment = (assignment) => {
    setEditingAssignmentId(String(assignment.id || ''));
    setEditingAssignmentForm({
      lecturerId: String(assignment.lecturer_id || ''),
      licId: String(assignment.lic_id || ''),
      academicYear: String(assignment.academic_year || '1'),
      semester: String(assignment.semester || '1'),
    });
    setEditingAssignmentLabel(String(assignment.module_code || assignment.module_name || assignment.id || ''));
  };

  const cancelEditAssignment = () => {
    setEditingAssignmentId('');
    setEditingAssignmentForm({
      lecturerId: '',
      licId: '',
      academicYear: '1',
      semester: '1',
    });
    setEditingAssignmentLabel('');
  };

  const updateAssignmentRecord = async (e) => {
    e.preventDefault();

    if (!editingAssignmentId) return;

    if (!editingAssignmentForm.lecturerId || !editingAssignmentForm.licId) {
      showWarning('Validation required', 'Lecturer and LIC are required to update an assignment.');
      return;
    }

    try {
      await schedulerApi.updateAssignment(editingAssignmentId, {
        lecturerId: editingAssignmentForm.lecturerId,
        licId: editingAssignmentForm.licId,
        academicYear: editingAssignmentForm.academicYear,
        semester: editingAssignmentForm.semester,
      });

      showMessage('Assignment updated successfully');
      showSuccess('Assignment updated');
      cancelEditAssignment();
      await loadAssignments();
    } catch (err) {
      showError('Update assignment failed', err.message || 'Failed to update assignment');
      showMessage(err.message || 'Failed to update assignment', 'error');
    }
  };



  const _approveTimetable = async (id) => {

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



  const _rejectTimetable = async (id) => {

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



  const _resolveConflict = async (id) => {

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



  const _addCalendarEvent = async (e) => {

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


  const pendingApprovals = timetables.filter(t => t.approval_status === 'pending' || !t.approval_status).length;

  const activeConflicts = conflicts.filter(c => !c.resolved).length;

  const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' && !c.resolved).length;

  const timetableStatusLabel = pendingApprovals > 0 ? 'Needs Review' : 'Aligned';

  const _calendarTypeIcons = {
    semester_start: CheckCircle2,
    semester_end: XCircle,
    exam_period: AlertTriangle,
    holiday: CalendarDays,
    special_event: ClipboardList,
  };

  const moduleById = useMemo(() => {
    return modules.reduce((map, module) => {
      map.set(module.id, module);
      return map;
    }, new Map());
  }, [modules]);

  const specializationOptions = useMemo(() => {
    const known = new Set(['IME', 'IT', 'SE', 'General']);
    modules.forEach((module) => {
      known.add(inferSpecializationFromModuleCode(module.code));
    });
    return Array.from(known);
  }, [modules]);

  const moduleBarChartData = useMemo(() => {
    const summary = new Map();

    modules.forEach((module) => {
      const specialization = inferSpecializationFromModuleCode(module.code);
      const year = String(module.academic_year || inferAcademicYearFromModuleCode(module.code) || 'NA');
      const semester = String(module.semester || inferSemesterFromModuleCode(module.code) || 'NA');
      const key = `${specialization}-Y${year}`;

      if (!summary.has(key)) {
        summary.set(key, {
          key,
          specialization,
          year,
          semesterOne: 0,
          semesterTwo: 0,
          total: 0,
          label: `${specialization} - Y${year}`,
        });
      }

      const entry = summary.get(key);
      if (semester === '1') entry.semesterOne += 1;
      else if (semester === '2') entry.semesterTwo += 1;
      entry.total += 1;
    });

    return Array.from(summary.values()).sort((a, b) => {
      if (a.specialization === b.specialization) return Number(a.year) - Number(b.year);
      return a.specialization.localeCompare(b.specialization);
    });
  }, [modules]);

  const filteredModulesForAssignment = useMemo(() => {
    return modules.filter((module) => {
      const moduleYear = String(module.academic_year || inferAcademicYearFromModuleCode(module.code) || '');
      const moduleSemester = String(module.semester || inferSemesterFromModuleCode(module.code) || '');
      const moduleSpecialization = inferSpecializationFromModuleCode(module.code);

      const yearMatch = assignmentFilters.academicYear === 'all' || moduleYear === assignmentFilters.academicYear;
      const semesterMatch = assignmentFilters.semester === 'all' || !moduleSemester || moduleSemester === assignmentFilters.semester;
      const specializationMatch = assignmentFilters.specialization === 'all' || moduleSpecialization === assignmentFilters.specialization;

      return yearMatch && semesterMatch && specializationMatch;
    });
  }, [assignmentFilters, modules]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const relatedModule = moduleById.get(assignment.module_id);
      const yearValue = String(assignment.academic_year || relatedModule?.academic_year || inferAcademicYearFromModuleCode(assignment.module_code) || '');
      const semesterValue = String(assignment.semester || relatedModule?.semester || '');
      const specializationValue = inferSpecializationFromModuleCode(relatedModule?.code || assignment.module_code);

      const yearMatch = assignmentFilters.academicYear === 'all' || yearValue === assignmentFilters.academicYear;
      const semesterMatch = assignmentFilters.semester === 'all' || semesterValue === assignmentFilters.semester;
      const specializationMatch = assignmentFilters.specialization === 'all' || specializationValue === assignmentFilters.specialization;

      return yearMatch && semesterMatch && specializationMatch;
    });
  }, [assignmentFilters, assignments, moduleById]);
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

  useEffect(() => {
    if (location.pathname !== '/dashboard' || !location.hash) {
      return;
    }

    const hash = location.hash.replace('#', '');
    const hashStateMap = {
      acOverview: { mainView: 'lectures', activeTab: 'overview' },
      'main-view-panel-lectures': { mainView: 'lectures', activeTab: 'overview' },
      'main-view-panel-hallAllocation': { mainView: 'hallAllocation', activeTab: 'overview' },
      timetablePanel: { mainView: 'lectures', activeTab: 'timetables' },
      acConflictsPanel: { mainView: 'lectures', activeTab: 'conflicts' },
      acResourcesPanel: { mainView: 'lectures', activeTab: 'resources' },
      acCalendarPanel: { mainView: 'lectures', activeTab: 'calendar' },
    };

    const nextState = hashStateMap[hash];
    if (nextState) {
      setMainView(nextState.mainView);
      if (nextState.mainView === 'lectures') {
        setActiveTab(nextState.activeTab);
      }
    }

    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 130);

    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);



  if (loading) {

    return (

      <Motion.div
        className="dashboard-container ac-dashboard"
        style={dashboardBackgroundStyle}
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
    <FacultyCoordinatorShell
      user={user}
      title="Academic Coordinator Workspace"
      subtitle="Govern timetables, conflicts, resources, and calendar operations"
      badge="AC Dashboard"
      brandCode="AC"
      brandTitle="Academic Coordinator"
      brandSubtitle="Governance Console"
      backgroundImage={backgroundImage}
      navigationGroups={academicNavigationGroups}
      footerNote="Quick Tip: Use the command bar for instant search and fast actions. Review conflicts before approving timetables."
    >
    <style>{`
      .ac-cyber-theme {
        color: #e2e8f0;
      }
      .ac-command-bar {
        position: sticky;
        top: 12px;
        z-index: 18;
        margin-bottom: 18px;
        border: 1px solid rgba(255,255,255,0.05);
        background: linear-gradient(135deg, rgba(2,6,23,0.92), rgba(30,41,59,0.78));
        backdrop-filter: blur(12px);
        border-radius: 20px;
        box-shadow: 0 18px 44px rgba(2,6,23,0.44);
        padding: 14px;
        display: flex;
        gap: 14px;
        align-items: center;
        justify-content: space-between;
      }
      .ac-command-search {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.05);
        background: rgba(15,23,42,0.72);
        color: #f8fafc;
      }
      .ac-command-search input {
        width: 100%;
        background: transparent;
        border: 0;
        color: inherit;
        outline: none;
        font-size: 13px;
      }
      .ac-command-search input::placeholder {
        color: rgba(203,213,225,0.58);
      }
      .ac-modules-view .ac-input::placeholder {
        color: rgba(0, 0, 0, 0.95);
        opacity: 1;
      }
      .ac-modules-view select.ac-input {
        color: rgba(0, 0, 0, 0.95);
      }
      .ac-modules-view select.ac-input option {
        color: rgba(0, 0, 0, 0.95);
        background: #ffffff;
      }
      .ac-command-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ac-command-pill {
        padding: 11px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(15,23,42,0.58);
        color: #e2e8f0;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .ac-command-pill.primary {
        background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.18));
        border-color: rgba(16,185,129,0.28);
        color: #bbf7d0;
      }
      .ac-command-pill.accent {
        background: linear-gradient(135deg, rgba(37,99,235,0.24), rgba(30,64,175,0.18));
        border-color: rgba(59,130,246,0.28);
        color: #bfdbfe;
      }
      .ac-insight-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .ac-insight-tile {
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.05);
        background: linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.74));
        backdrop-filter: blur(12px);
        padding: 16px 16px 12px;
        position: relative;
        overflow: hidden;
      }
      .ac-insight-tile::after {
        content: '';
        position: absolute;
        inset: auto -10% -30% auto;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16,185,129,0.08), transparent 72%);
        pointer-events: none;
      }
      .ac-insight-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .ac-insight-label {
        margin: 0 0 6px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(148,163,184,0.78);
      }
      .ac-insight-value {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 32px;
        font-weight: 900;
        color: #f8fafc;
        line-height: 1;
      }
      .ac-insight-hint {
        margin: 8px 0 0;
        color: rgba(203,213,225,0.75);
        font-size: 12px;
      }
      .ac-insight-chart {
        width: 78px;
        opacity: 0.9;
      }
      .ac-section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .ac-section-title h2,
      .ac-section-title h3 {
        margin: 0;
      }
      .ac-float-field {
        position: relative;
      }
      .ac-float-field input,
      .ac-float-field select,
      .ac-float-field textarea {
        width: 100%;
        padding: 18px 16px 10px 44px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(2,6,23,0.7);
        color: #f8fafc;
        outline: none;
      }
      .ac-float-field label {
        position: absolute;
        left: 44px;
        top: 14px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(148,163,184,0.72);
        pointer-events: none;
      }
      .ac-field-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(125,211,252,0.75);
      }
      .ac-table-shell,
      .ac-panel-shell {
        border: 1px solid rgba(255,255,255,0.05);
        background: linear-gradient(135deg, rgba(2,6,23,0.86), rgba(30,41,59,0.72));
        backdrop-filter: blur(12px);
        border-radius: 20px;
        box-shadow: 0 16px 42px rgba(2,6,23,0.42);
      }
      .ac-table-row {
        transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
      }
      .ac-table-row:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(59,130,246,0.14);
      }
      .ac-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 56px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .ac-pill.se { background: rgba(59,130,246,0.16); color: #bfdbfe; border-color: rgba(59,130,246,0.22); }
      .ac-pill.it { background: rgba(168,85,247,0.16); color: #e9d5ff; border-color: rgba(168,85,247,0.22); }
      .ac-pill.ise { background: rgba(236,72,153,0.16); color: #fbcfe8; border-color: rgba(236,72,153,0.22); }
      .ac-pill.general { background: rgba(148,163,184,0.12); color: #cbd5e1; border-color: rgba(148,163,184,0.2); }
      @media (max-width: 1180px) {
        .ac-insight-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ac-command-bar { flex-direction: column; align-items: stretch; }
      }
      @media (max-width: 720px) {
        .ac-insight-grid { grid-template-columns: 1fr; }
      }
    `}</style>
    <div className="ac-dashboard ac-cyber-theme" style={dashboardBackgroundStyle}>

      <Motion.div className="ac-command-bar" variants={fadeInUpVariant} layout>
        <div className="ac-command-search">
          <BarChart3 size={16} />
          <input
            type="text"
            value={commandSearchValue}
            readOnly
            aria-label="Dashboard command search"
          />
        </div>
        <div className="ac-command-actions">
          <button type="button" className="ac-command-pill primary" onClick={() => scrollToAssignmentSection('moduleForm', 'overview')}>Add Module</button>
        </div>
      </Motion.div>

      <Motion.div id="acOverview" className="dashboard-hero" variants={fadeInUpVariant}>

        <div className="hero-left">

          <h1>Academic Coordinator Dashboard</h1>

          <p className="hero-sub">Welcome, {user?.name || 'Academic Coordinator'}! Manage timetables, resolve conflicts, and coordinate academic activities.</p>

          <div className="ac-insight-grid">
            <InsightTile
              label="Total Timetables"
              value={timetables.length}
              hint="Live schedule inventory"
              tone="blue"
              values={[42, 58, 54, 61, 73, 68, 82]}
              icon={<LineChart size={16} />}
            />
            <InsightTile
              label="Timetable Status"
              value={pendingApprovals}
              hint={timetableStatusLabel}
              tone={pendingApprovals > 0 ? 'amber' : 'emerald'}
              values={[14, 22, 16, 31, 18, 27, 19]}
              icon={<ClipboardList size={16} />}
            />
            <InsightTile
              label="Active Conflicts"
              value={activeConflicts}
              hint={highSeverityConflicts > 0 ? `Alert: ${highSeverityConflicts} high severity` : 'Conflict load stable'}
              tone={activeConflicts > 0 ? 'red' : 'emerald'}
              values={[12, 8, 11, 9, 6, 7, 5]}
              icon={<AlertTriangle size={16} />}
            />
            <InsightTile
              label="Resources"
              value={campusStructures.length}
              hint="Rooms, halls, and labs"
              tone="emerald"
              values={[18, 22, 19, 27, 31, 29, 33]}
              icon={<Building2 size={16} />}
            />
          </div>

          <div className="ac-panel-shell" style={{ marginTop: 16, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.82)' }}>
                Module Distribution
              </p>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Live from Added Modules</span>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={moduleBarChartData} margin={{ top: 10, right: 20, left: 0, bottom: 36 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis
                    dataKey="label"
                    angle={-18}
                    textAnchor="end"
                    interval={0}
                    height={58}
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                    contentStyle={{
                      background: 'rgba(2,6,23,0.95)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: 10,
                      color: '#e2e8f0',
                    }}
                  />
                  <Bar dataKey="semesterOne" name="Semester 1" radius={[6, 6, 0, 0]}>
                    {moduleBarChartData.map((entry) => (
                      <Cell key={`${entry.key}-sem1`} fill="#3b82f6" />
                    ))}
                  </Bar>
                  <Bar dataKey="semesterTwo" name="Semester 2" radius={[6, 6, 0, 0]}>
                    {moduleBarChartData.map((entry) => (
                      <Cell key={`${entry.key}-sem2`} fill="#a855f7" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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

      <Motion.div className="ac-main-menu-wrap" variants={fadeInUpVariant} layout>

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
              Modules Assignment
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
    className="ac-modules-view"
    id="main-view-panel-lectures"
    role="tabpanel"
    aria-labelledby="main-view-tab-lectures"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
  >

    <div style={{ marginBottom: 14, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(135deg, rgba(2,6,23,0.84), rgba(30,41,59,0.72))', padding: '16px 18px' }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.8)' }}>Module Setup</p>
      <h3 style={{ margin: '6px 0 0', fontSize: 22, color: '#f8fafc' }}>Add Modules by Year, Specialization, and Semester</h3>
    </div>

    <div className="ac-modules-shell" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {moduleSidebarOpen && <button type="button" className="ac-modules-sidebar-overlay" aria-label="Close module sidebar" onClick={() => setModuleSidebarOpen(false)} />}

      <aside className={`panel ac-modules-sidebar ${moduleSidebarOpen ? 'is-open' : ''}`} style={{ display: 'none' }}>
        <div className="ac-modules-sidebar-header">
          <h3 className="ac-ui-title"><BookOpen size={16} />Assignment Sidebar</h3>
          <button type="button" className="ac-modules-close" onClick={() => setModuleSidebarOpen(false)} aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        <p className="ac-modules-sidebar-copy">Filter modules and assignments by year, specialization, and semester.</p>

        <label className="ac-modules-label">
          Academic Year
          <select
            className="ac-input"
            value={assignmentFilters.academicYear}
            onChange={(e) => setAssignmentFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
          >
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </label>

        <label className="ac-modules-label">
          Semester
          <select
            className="ac-input"
            value={assignmentFilters.semester}
            onChange={(e) => setAssignmentFilters((prev) => ({ ...prev, semester: e.target.value }))}
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </label>

        <label className="ac-modules-label">
          Specialization
          <select
            className="ac-input"
            value={assignmentFilters.specialization}
            onChange={(e) => setAssignmentFilters((prev) => ({ ...prev, specialization: e.target.value }))}
          >
            <option value="all">All Specializations</option>
            {specializationOptions.map((specialization) => (
              <option key={specialization} value={specialization}>{specialization}</option>
            ))}
          </select>
        </label>

        <div className="ac-modules-sidebar-stats">
          <span>Modules: {filteredModulesForAssignment.length}</span>
          <span>Assignments: {filteredAssignments.length}</span>
        </div>

        <div className="ac-modules-shortcuts">
          <button type="button" className="chip ac-ui-chip" onClick={() => scrollToAssignmentSection('moduleForm', 'overview')}>Add Module</button>
          <button type="button" className="chip ac-ui-chip" onClick={() => navigate('/faculty/modules/added')}>Added Modules Page</button>
          <button type="button" className="chip ac-ui-chip" onClick={() => scrollToAssignmentSection('assignmentForm', 'overview')}>Assign Module</button>
          <button type="button" className="chip ac-ui-chip" onClick={() => scrollToAssignmentSection('assignmentList', 'overview')}>Current Assignments</button>
        </div>
      </aside>

      <div className="ac-modules-main">
        <button type="button" className="ac-modules-toggle" onClick={() => setModuleSidebarOpen((current) => !current)} style={{ display: 'none' }}>
          <Menu size={16} />
          Sidebar
        </button>

        <div className="dashboard-main" style={{ gridTemplateColumns: 'minmax(0, 1fr)', maxWidth: '100%' }}>
        <div className="left-col" style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>



          {/* Add Module Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'moduleForm' ? 'is-active' : ''}`} id="moduleForm" initial="hidden" animate="visible" variants={formPanelVariant}>

            <h3 className="ac-ui-title" style={{ color: '#000000', fontWeight: 800, fontFamily: 'cursive' }}><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><BookPlus size={16} /></Motion.span>Add Module</h3>

            <form onSubmit={addModule} className="ac-form ac-module-form" onFocusCapture={() => activateForm('moduleForm')} onBlurCapture={(event) => deactivateForm(event, 'moduleForm')}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <select
                  className="ac-input"
                  value={moduleForm.academic_year}
                  onChange={(e) => setModuleForm({ ...moduleForm, academic_year: e.target.value })}
                  required
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>

                <select
                  className="ac-input"
                  value={moduleForm.specialization}
                  onChange={(e) => setModuleForm({ ...moduleForm, specialization: e.target.value })}
                  required
                >
                  {MODULE_SPECIALIZATION_OPTIONS.map((specializationOption) => (
                    <option key={specializationOption} value={specializationOption}>{specializationOption}</option>
                  ))}
                </select>

                <select
                  className="ac-input"
                  value={moduleForm.semester}
                  onChange={(e) => setModuleForm({ ...moduleForm, semester: e.target.value })}
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>

              <input className="ac-input" placeholder="Module code (required)" value={moduleForm.code}
                maxLength={6}

                onBeforeInput={(e) => handleModuleCodeBeforeInput(e, moduleForm.code)}
                onKeyDown={(e) => handleModuleCodeKeyDown(e, moduleForm.code)}
                onPaste={handleModuleCodePaste}
                onInput={(e) => handleModuleCodeInput(e, moduleForm.code, setModuleForm)}
                onChange={(e) => setModuleForm({ ...moduleForm, code: sanitizeModuleCodeInput(e.target.value) })} required />

              {moduleForm.code && (
                <p className="text-xs text-gray-600 -mt-1">
                  Auto Academic Year: {inferAcademicYearFromModuleCode(moduleForm.code) || 'Not detected'}
                </p>
              )}

              <input className="ac-input" placeholder="Module name (required)" value={moduleForm.name}
                maxLength={120}

                onBeforeInput={(e) => handleModuleNameBeforeInput(e, moduleForm.name)}
                onKeyDown={handleModuleNameKeyDown}
                onPaste={handleModuleNamePaste}
                onInput={(e) => handleModuleNameInput(e, moduleForm.name, setModuleForm)}
                onChange={(e) => setModuleForm({ ...moduleForm, name: sanitizeModuleNameInput(e.target.value) })} required />

              <input className="ac-input" placeholder="Credits (required)" value={moduleForm.credits}

                onChange={(e) => setModuleForm({ ...moduleForm, credits: e.target.value })} required />

              <input className="ac-input" placeholder="Lectures per week (required)" value={moduleForm.lectures_per_week}
                inputMode="numeric"
                maxLength={2}

                onBeforeInput={(e) => handleLecturesBeforeInput(e, moduleForm.lectures_per_week)}
                onKeyDown={(e) => handleLecturesKeyDown(e, moduleForm.lectures_per_week)}
                onPaste={handleLecturesPaste}
                onInput={(e) => handleLecturesInput(e, moduleForm.lectures_per_week, setModuleForm)}
                onChange={(e) => setModuleForm({ ...moduleForm, lectures_per_week: sanitizeLectureCountInput(e.target.value) })} required />

              <Motion.button className="dashboard-btn ac-ui-action ac-login-cta-btn" type="submit" {...buttonMotionProps}>
                <span className="ac-login-cta-glow" aria-hidden />
                <span className="ac-login-cta-shimmer" aria-hidden />
                <span className="ac-login-cta-content">
                  <BookPlus size={15} />
                  Add Module
                  <span className="ac-login-cta-arrow">→</span>
                </span>
              </Motion.button>

            </form>

          </Motion.div>


          <div className="panel" id="addedModulesRedirect" style={{ display: 'none' }}>
            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><BookOpen size={16} /></Motion.span>Added Modules</h3>
            <p className="ac-body-copy">The Added Modules list has been moved to its own page for a cleaner assignment dashboard.</p>
            <Motion.button className="dashboard-btn ac-inline-btn" type="button" onClick={() => navigate('/faculty/modules/added')} {...buttonMotionProps}>
              Open Added Modules Page
            </Motion.button>
          </div>



          {/* Add Assignment Form */}

          <Motion.div className={`panel ac-focus-form ${activeFormId === 'assignmentForm' ? 'is-active' : ''}`} id="assignmentForm" initial="hidden" animate="visible" variants={formPanelVariant} style={{ display: 'none' }}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><Link2 size={16} /></Motion.span>Assign Module</h3>

            <form onSubmit={addAssignment} className="ac-form" onFocusCapture={() => activateForm('assignmentForm')} onBlurCapture={(event) => deactivateForm(event, 'assignmentForm')}>

              <select className="ac-input" value={assignmentForm.moduleId}

                onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })} required>

                <option value="">Select module</option>

                {filteredModulesForAssignment.map((module) => (

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

              <select className="ac-input" value={assignmentForm.semester}

                onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: e.target.value })}>

                <option value="1">Semester 1</option>

                <option value="2">Semester 2</option>

              </select>

              <Motion.button className="dashboard-btn ac-ui-action" type="submit" {...buttonMotionProps}><Link2 size={15} />Create Assignment</Motion.button>

            </form>

          </Motion.div>



          {/* Current Assignments */}

          <div className="panel" id="assignmentList" style={{ display: 'none' }}>

            <h3 className="ac-ui-title"><Motion.span className="ac-ui-icon" initial="rest" whileHover="hover" variants={iconHoverVariant}><ClipboardList size={16} /></Motion.span>Current Assignments</h3>

            {editingAssignmentId && (
              <Motion.form
                onSubmit={updateAssignmentRecord}
                className="ac-form mb-4 p-3 rounded-xl border border-emerald-400/40 bg-emerald-900/15"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <p className="text-xs text-emerald-200 m-0">Editing Assignment: {editingAssignmentLabel}</p>

                <select
                  className="ac-input"
                  value={editingAssignmentForm.lecturerId}
                  onChange={(e) => setEditingAssignmentForm((prev) => ({ ...prev, lecturerId: e.target.value }))}
                  required
                >
                  <option value="">Select lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                  ))}
                </select>

                <select
                  className="ac-input"
                  value={editingAssignmentForm.licId}
                  onChange={(e) => setEditingAssignmentForm((prev) => ({ ...prev, licId: e.target.value }))}
                  required
                >
                  <option value="">Select LIC</option>
                  {lics.map((lic) => (
                    <option key={lic.id} value={lic.id}>{lic.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="ac-input"
                    value={editingAssignmentForm.academicYear}
                    onChange={(e) => setEditingAssignmentForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>

                  <select
                    className="ac-input"
                    value={editingAssignmentForm.semester}
                    onChange={(e) => setEditingAssignmentForm((prev) => ({ ...prev, semester: e.target.value }))}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Motion.button className="ac-approve-btn" type="submit" {...buttonMotionProps}>Update Assignment</Motion.button>
                  <Motion.button className="ac-reject-btn" type="button" onClick={cancelEditAssignment} {...buttonMotionProps}>Cancel</Motion.button>
                </div>
              </Motion.form>
            )}

            <div className="ac-table-wrapper">

              <table className="ac-table">

                <thead>

                  <tr>

                    <th>Module</th>

                    <th>Specialization</th>

                    <th>Lecturer</th>

                    <th>Year/Sem</th>

                    <th></th>

                  </tr>

                </thead>

                <tbody>

                  {filteredAssignments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="ac-empty-row">No assignments found</td>
                    </tr>
                  )}

                  {filteredAssignments.map((assignment, index) => (

                    <Motion.tr key={assignment.id} initial="hidden" animate="visible" variants={tableRowVariant} custom={index}>

                      <td>{assignment.module_code}</td>

                      <td>{inferSpecializationFromModuleCode(assignment.module_code)}</td>

                      <td>{assignment.lecturer_name}</td>

                      <td>Y{assignment.academic_year}/S{assignment.semester}</td>

                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Motion.button className="ac-approve-btn" onClick={() => startEditAssignment(assignment)} {...buttonMotionProps}>Update</Motion.button>
                          <Motion.button className="ac-remove-btn" onClick={() => removeAssignment(assignment.id)} {...buttonMotionProps}><Trash2 size={14} />Delete</Motion.button>
                        </div>
                      </td>

                    </Motion.tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

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
    <div className="ac-feature-banner ac-feature-banner-halls">
      <div className="ac-feature-banner-head ac-feature-banner-head--center">
        <h3 className="ac-hall-title"><PieChart size={18} /> Hall Allocation Control Center</h3>
      </div>
    </div>
    <HallAllocation apiBase={apiBase} />
  </Motion.div>

)}
    </div>
    </FacultyCoordinatorShell>

  );

};




export default AcademicCoordinatorDashboard;


