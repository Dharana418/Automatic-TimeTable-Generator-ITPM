import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import api from '../api/scheduler';
import { persistAllModulesToDatabase } from '../api/moduleManagement';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const MAX_MODULES_PER_SCOPE = 5;

const normalizeSpecializationCode = (value = '') => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return 'GENERAL';

  const aliases = {
    SOFTWAREENGINEERING: 'SE',
    SOFTWARE_ENG: 'SE',
    INFORMATIONTECHNOLOGY: 'IT',
    INTERACTIVEMEDIA: 'IME',
    COMPUTERSCIENCE: 'CS',
    INFORMATIONSYSTEMSENGINEERING: 'ISE',
    COMPUTER_SYSTEMS_NETWORK_ENGINEERING: 'CSNE',
    INFORMATICS: 'IM',
    IM: 'IME',
    IE: 'IME',
    CYBERSECURITY: 'CYBER SECURITY',
    CYBER: 'CYBER SECURITY',
    GENERAL: 'GENERAL',
  };

  const compact = normalized.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || normalized;
};

const buildScopeKey = (specialization, academicYear, semester) => {
  const normalizedSpecialization = normalizeSpecializationCode(specialization);
  const year = Number(academicYear || 0);
  const sem = Number(semester || 0);
  if (!normalizedSpecialization || ![1, 2, 3, 4].includes(year) || ![1, 2].includes(sem)) {
    return '';
  }
  return `${normalizedSpecialization}::${year}::${sem}`;
};

const normalizeModuleRecord = (module = {}) => {
  let details = module.details;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }
  if (!details || typeof details !== 'object') details = {};

  const specialization =
    module.specialization ||
    module.department ||
    details.specialization ||
    details.spec ||
    details.stream ||
    'GENERAL';

  const academicYear = module.academic_year || module.academicYear || details.academic_year || details.academicYear || '';
  const semester = module.semester || details.semester || '';

  return {
    ...module,
    id: module.id || module.module_id || module.moduleId || module.code || module.name,
    details,
    specialization,
    academic_year: academicYear,
    semester,
  };
};

/* ── UI Components ──────────────────────────────────────────────── */
const DarkInput = ({ label, val, onChange, type = 'text', placeholder = '', help = '', min, max }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>{label}</span>
    <input
      type={type}
      value={val}
      min={min}
      max={max}
      onChange={(e) => {
        let v = e.target.value;
        if (type === 'number' && typeof max !== 'undefined' && Number(v) > Number(max)) v = max;
        if (type === 'number' && typeof min !== 'undefined' && v !== '' && Number(v) < Number(min)) v = min;
        onChange(v);
      }}
      placeholder={placeholder}
      className="ac-input-hover"
      style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
        color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box'
      }}
    />
    {help && <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{help}</span>}
  </label>
);

const DarkSelect = ({ label, value, onChange, options, required = false }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ac-input-hover"
      style={{
        padding: '10px 14px', borderRadius: 12, width: '100%', boxSizing: 'border-box',
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
        color: value ? '#f1f5f9' : 'rgba(148,163,184,0.5)', fontSize: 13, outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} style={{ background: '#0f172a', color: '#f1f5f9' }}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

const sectionPanelStyle = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.9), rgba(15,23,42,0.82), rgba(7,89,133,0.35))',
  padding: 24,
  borderRadius: 20,
  border: '1px solid rgba(34,211,238,0.2)',
  boxShadow: '0 10px 30px rgba(2,6,23,0.28)',
  backdropFilter: 'blur(16px)',
};

/* ── Main Page Component ────────────────────────────────────────── */
export default function AcademicModulesPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDataQualityOnly, setShowDataQualityOnly] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    code: '',
    name: '',
    specialization: 'GENERAL',
    academic_year: '1',
    semester: '1',
    credits: '',
    lectures_per_week: ''
  });
  const [updatingModuleId, setUpdatingModuleId] = useState(null);
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [persistingAllModules, setPersistingAllModules] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    department: 'GENERAL',
    academic_year: '1',
    semester: '1',
    credits: '',
    lectures_per_week: ''
  });

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await api.listItems('modules');
      const normalized = Array.isArray(res.items) ? res.items.map((item) => normalizeModuleRecord(item)) : [];
      setModules(normalized);
    } catch {
      toast.error('Failed to load module registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === 'Escape' && isEditModalOpen) {
        cancelEditModule();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isEditModalOpen]);

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      return toast.warn('Module code and name are mandatory.');
    }

    const yearValue = Number(form.academic_year || 0);
    const semesterValue = Number(form.semester || 0);
    const specializationValue = normalizeSpecializationCode(form.department || 'GENERAL');
    const scopeKey = buildScopeKey(specializationValue, yearValue, semesterValue);

    if (!scopeKey) {
      return toast.warn('Select a valid specialization, academic year (1-4), and semester (1-2).');
    }

    if ((moduleScopeCounts[scopeKey] || 0) >= MAX_MODULES_PER_SCOPE) {
      return toast.warn(`Scope limit reached: ${specializationValue} Year ${yearValue} Semester ${semesterValue} already has ${MAX_MODULES_PER_SCOPE} modules.`);
    }

    try {
      setSaving(true);
      await api.addItem('modules', {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        specialization: form.department,
        academic_year: form.academic_year,
        semester: form.semester,
        credits: form.credits ? Number(form.credits) : null,
        lectures_per_week: form.lectures_per_week ? Number(form.lectures_per_week) : null,
      });
      toast.success('Module successfully registered.');
      setForm({
        code: '', name: '', department: 'GENERAL', 
        academic_year: '1', semester: '1', credits: '', lectures_per_week: ''
      });
      fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to register module.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for rendering the badge color
  const getBadgeStyle = (dep) => {
    const DEP_STYLE = {
      IT: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' },
      SE: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
      DS: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
      CSNE: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
      ISE: { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
      GENERAL: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
    };
    return DEP_STYLE[dep] || DEP_STYLE.GENERAL;
  };

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter(m => {
      const codeStr = String(m.code || '').toLowerCase();
      const nameStr = String(m.name || '').toLowerCase();
      const depStr = String(m.specialization || m.department || '').toLowerCase();
      const yearStr = String(m.academic_year || '');
      const semStr = String(m.semester || '');

      const textMatched = !q || codeStr.includes(q) || nameStr.includes(q) || depStr.includes(q);
      const specializationMatched =
        specializationFilter === 'ALL' ||
        String(m.specialization || m.department || 'GENERAL').toUpperCase() === specializationFilter;
      const yearMatched = yearFilter === 'ALL' || yearStr === yearFilter;
      const semesterMatched = semesterFilter === 'ALL' || semStr === semesterFilter;

      const hasPlanningGaps =
        !m.code || !m.name ||
        !m.academic_year || !m.semester ||
        m.credits === null || m.credits === undefined || m.credits === '' ||
        m.lectures_per_week === null || m.lectures_per_week === undefined || m.lectures_per_week === '';
      const qualityMatched = !showDataQualityOnly || hasPlanningGaps;

      return textMatched && specializationMatched && yearMatched && semesterMatched && qualityMatched;
    });
  }, [modules, search, specializationFilter, yearFilter, semesterFilter, showDataQualityOnly]);

  const moduleScopeCounts = useMemo(() => {
    return modules.reduce((acc, module) => {
      const key = buildScopeKey(
        module.specialization || module.department || 'GENERAL',
        module.academic_year,
        module.semester
      );
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [modules]);

  const activeFormScopeKey = useMemo(
    () => buildScopeKey(form.department, form.academic_year, form.semester),
    [form.department, form.academic_year, form.semester]
  );

  const activeFormScopeCount = activeFormScopeKey ? (moduleScopeCounts[activeFormScopeKey] || 0) : 0;
  const isAddScopeAtLimit = activeFormScopeKey && activeFormScopeCount >= MAX_MODULES_PER_SCOPE;

  const duplicateCodeSet = useMemo(() => {
    const counts = {};
    modules.forEach((m) => {
      const code = String(m.code || '').trim().toUpperCase();
      if (!code) return;
      counts[code] = (counts[code] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((code) => counts[code] > 1));
  }, [modules]);

  const governanceStats = useMemo(() => {
    const withCredits = filteredModules.filter((m) => Number(m.credits) > 0);
    const withLectures = filteredModules.filter((m) => Number(m.lectures_per_week) > 0);
    const qualityIssues = filteredModules.filter(
      (m) =>
        !m.code || !m.name ||
        !m.academic_year || !m.semester ||
        m.credits === null || m.credits === undefined || m.credits === '' ||
        m.lectures_per_week === null || m.lectures_per_week === undefined || m.lectures_per_week === '' ||
        duplicateCodeSet.has(String(m.code || '').trim().toUpperCase())
    ).length;

    const uniqueSpecializations = new Set(
      filteredModules.map((m) => String(m.specialization || m.department || 'GENERAL').toUpperCase())
    ).size;

    return {
      totalRegistry: modules.length,
      visibleRecords: filteredModules.length,
      uniqueSpecializations,
      avgCredits: withCredits.length
        ? (withCredits.reduce((acc, m) => acc + Number(m.credits || 0), 0) / withCredits.length).toFixed(1)
        : '0.0',
      avgLectures: withLectures.length
        ? (withLectures.reduce((acc, m) => acc + Number(m.lectures_per_week || 0), 0) / withLectures.length).toFixed(1)
        : '0.0',
      qualityIssues,
      duplicateCodes: duplicateCodeSet.size
    };
  }, [filteredModules, modules.length, duplicateCodeSet]);

  const specializationOptions = useMemo(() => {
    const set = new Set(
      modules
        .map((m) => String(m.specialization || m.department || 'GENERAL').toUpperCase())
        .filter(Boolean)
    );
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [modules]);

  const chartData = useMemo(() => {
    const rows = {};
    filteredModules.forEach((m) => {
      const specialization = String(m.specialization || m.department || 'GENERAL').toUpperCase();
      const yearNum = Number(m.academic_year || 0);
      if (!rows[specialization]) {
        rows[specialization] = {
          specialization,
          y1: 0,
          y2: 0,
          y3: 0,
          y4: 0,
          total: 0
        };
      }
      if (yearNum >= 1 && yearNum <= 4) {
        rows[specialization][`y${yearNum}`] += 1;
      }
      rows[specialization].total += 1;
    });

    return Object.values(rows).sort((a, b) => b.total - a.total || a.specialization.localeCompare(b.specialization));
  }, [filteredModules]);

  const barColors = ['#38bdf8', '#22d3ee', '#818cf8', '#f59e0b', '#34d399', '#f87171', '#c084fc'];

  const sortedModules = useMemo(() => {
    const arr = [...filteredModules];
    const getSortableValue = (m) => {
      if (sortBy === 'code') return String(m.code || '').toUpperCase();
      if (sortBy === 'name') return String(m.name || '').toUpperCase();
      if (sortBy === 'specialization') return String(m.specialization || m.department || 'GENERAL').toUpperCase();
      if (sortBy === 'yearSemester') return Number(m.academic_year || 0) * 10 + Number(m.semester || 0);
      if (sortBy === 'credits') return Number(m.credits || 0);
      if (sortBy === 'lectures') return Number(m.lectures_per_week || 0);
      return String(m.code || '').toUpperCase();
    };

    arr.sort((a, b) => {
      const aVal = getSortableValue(a);
      const bVal = getSortableValue(b);
      let comp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') comp = aVal - bVal;
      else comp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comp : -comp;
    });

    return arr;
  }, [filteredModules, sortBy, sortDirection]);

  const resetViewControls = () => {
    setSearch('');
    setSpecializationFilter('ALL');
    setYearFilter('ALL');
    setSemesterFilter('ALL');
    setSortBy('code');
    setSortDirection('asc');
    setShowDataQualityOnly(false);
  };

  const exportFilteredToCsv = () => {
    if (!sortedModules.length) {
      toast.info('No modules available in current view to export.');
      return;
    }

    const header = ['Code', 'Name', 'Specialization', 'Academic Year', 'Semester', 'Credits', 'Lectures Per Week'];
    const rows = sortedModules.map((m) => [
      m.code || '',
      m.name || '',
      m.specialization || m.department || 'GENERAL',
      m.academic_year || '',
      m.semester || '',
      m.credits ?? '',
      m.lectures_per_week ?? ''
    ]);

    const csv = [header, ...rows]
      .map((cols) => cols.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `academic-modules-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePersistAllModules = async () => {
    if (!modules.length) {
      toast.info('No modules available to persist.');
      return;
    }

    try {
      setPersistingAllModules(true);
      const payload = modules.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        specialization: m.specialization || m.department || 'GENERAL',
        academic_year: m.academic_year,
        semester: m.semester,
        credits: m.credits,
        lectures_per_week: m.lectures_per_week,
        batch_size: m.batch_size,
        day_type: m.day_type,
        details: m.details || {},
      }));

      const result = await persistAllModulesToDatabase(payload);
      const skippedCount = Array.isArray(result?.skipped) ? result.skipped.length : 0;

      toast.success(
        `Module registry saved to database. Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${skippedCount}`
      );

      await fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to persist modules to database.');
    } finally {
      setPersistingAllModules(false);
    }
  };

  const startEditModule = (module) => {
    if (!module) {
      toast.error('Unable to open editor for this module.');
      return;
    }
    const moduleId = String(module?.id || module?.module_id || module?.moduleId || '').trim() || null;
    setEditingRecord(module || null);
    setEditingModuleId(moduleId);
    setIsEditModalOpen(true);
    setEditErrors({});
    setEditingForm({
      code: String(module.code || '').toUpperCase(),
      name: String(module.name || ''),
      specialization: String(module.specialization || module.department || 'GENERAL').toUpperCase(),
      academic_year: String(module.academic_year || '1'),
      semester: String(module.semester || '1'),
      credits: module.credits ?? '',
      lectures_per_week: module.lectures_per_week ?? ''
    });
  };

  const cancelEditModule = () => {
    setIsEditModalOpen(false);
    setEditErrors({});
    setEditingRecord(null);
    setEditingModuleId(null);
    setUpdatingModuleId(null);
    setEditingForm({
      code: '',
      name: '',
      specialization: 'GENERAL',
      academic_year: '1',
      semester: '1',
      credits: '',
      lectures_per_week: ''
    });
  };

  const saveEditedModule = async (moduleId) => {
    const resolvedId = String(
      moduleId ||
      editingModuleId ||
      editingRecord?.id ||
      editingRecord?.module_id ||
      modules.find((m) => String(m.code || '').trim().toUpperCase() === String(editingForm.code || '').trim().toUpperCase())?.id ||
      ''
    ).trim();
    if (!resolvedId) {
      toast.error('Unable to update: module id is missing for this record.');
      return;
    }
    if (!editingForm.code.trim() || !editingForm.name.trim()) {
      toast.warn('Module code and name are mandatory for update.');
      return;
    }

    const validationErrors = {};
    const codeValue = String(editingForm.code || '').trim().toUpperCase();
    const nameValue = String(editingForm.name || '').trim();
    const yearValue = Number(editingForm.academic_year || 0);
    const semesterValue = Number(editingForm.semester || 0);
    const creditsValue = editingForm.credits === '' ? null : Number(editingForm.credits);
    const lecturesValue = editingForm.lectures_per_week === '' ? null : Number(editingForm.lectures_per_week);

    if (!/^[A-Z0-9-]{3,20}$/.test(codeValue)) {
      validationErrors.code = 'Use 3-20 chars: A-Z, 0-9, or -';
    }
    if (nameValue.length < 3) {
      validationErrors.name = 'Name should be at least 3 characters.';
    }
    if (yearValue < 1 || yearValue > 4) {
      validationErrors.academic_year = 'Academic year must be between 1 and 4.';
    }
    if (semesterValue < 1 || semesterValue > 2) {
      validationErrors.semester = 'Semester must be 1 or 2.';
    }
    if (creditsValue !== null && (creditsValue < 1 || creditsValue > 10)) {
      validationErrors.credits = 'Credits must be between 1 and 10.';
    }
    if (lecturesValue !== null && (lecturesValue < 1 || lecturesValue > 10)) {
      validationErrors.lectures_per_week = 'Lectures/week must be between 1 and 10.';
    }

    if (Object.keys(validationErrors).length) {
      setEditErrors(validationErrors);
      toast.warn('Please fix validation errors before saving.');
      return;
    }

    const targetSpecialization = normalizeSpecializationCode(editingForm.specialization || 'GENERAL');
    const matchingScopeCount = modules.filter((module) => {
      if (String(module.id) === String(resolvedId)) return false;
      const moduleSpecialization = normalizeSpecializationCode(module.specialization || module.department || 'GENERAL');
      const moduleYear = Number(module.academic_year || 0);
      const moduleSemester = Number(module.semester || 0);
      return moduleSpecialization === targetSpecialization
        && moduleYear === yearValue
        && moduleSemester === semesterValue;
    }).length;

    if (matchingScopeCount >= MAX_MODULES_PER_SCOPE) {
      toast.warn(`Scope limit reached: ${targetSpecialization} Year ${yearValue} Semester ${semesterValue} already has ${MAX_MODULES_PER_SCOPE} modules.`);
      return;
    }

    setEditErrors({});

    try {
      setUpdatingModuleId(resolvedId);
      await api.updateItem('modules', resolvedId, {
        code: codeValue,
        name: nameValue,
        specialization: editingForm.specialization,
        academic_year: yearValue,
        semester: semesterValue,
        credits: creditsValue,
        lectures_per_week: lecturesValue,
      });
      toast.success('Module updated successfully.');
      cancelEditModule();
      await fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to update module.');
    } finally {
      setUpdatingModuleId(null);
    }
  };

  const deleteModule = async (module) => {
    setDeleteTarget(module);
    setDeleteConfirmCode('');
    setDeleteReason('');
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteConfirmCode('');
    setDeleteReason('');
  };

  const confirmDeleteModule = async () => {
    if (!deleteTarget?.id) {
      toast.error('Unable to delete: module id is missing.');
      return;
    }

    const expectedCode = String(deleteTarget.code || '').trim().toUpperCase();
    const enteredCode = String(deleteConfirmCode || '').trim().toUpperCase();
    if (!expectedCode || enteredCode !== expectedCode) {
      toast.warn('Confirmation code does not match the module code.');
      return;
    }

    if (!String(deleteReason || '').trim()) {
      toast.warn('Please provide a short reason before deleting.');
      return;
    }

    try {
      setDeletingModuleId(deleteTarget.id);
      await api.deleteItem('modules', deleteTarget.id);
      toast.success('Module deleted successfully.');
      if (editingModuleId === deleteTarget.id) {
        cancelEditModule();
      }
      closeDeleteModal();
      await fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to delete module.');
    } finally {
      setDeletingModuleId(null);
    }
  };

  const activeEditingModule = useMemo(
    () => modules.find((m) => m.id === editingModuleId) || null,
    [modules, editingModuleId]
  );

  const activeEditingSource = activeEditingModule || editingRecord;

  const editChangeSummary = useMemo(() => {
    if (!activeEditingSource) return [];

    const current = {
      code: String(activeEditingSource.code || '').trim().toUpperCase(),
      name: String(activeEditingSource.name || '').trim(),
      specialization: String(activeEditingSource.specialization || activeEditingSource.department || 'GENERAL').toUpperCase(),
      academic_year: String(activeEditingSource.academic_year || ''),
      semester: String(activeEditingSource.semester || ''),
      credits: activeEditingSource.credits === null || activeEditingSource.credits === undefined ? '' : String(activeEditingSource.credits),
      lectures_per_week: activeEditingSource.lectures_per_week === null || activeEditingSource.lectures_per_week === undefined ? '' : String(activeEditingSource.lectures_per_week)
    };

    const next = {
      code: String(editingForm.code || '').trim().toUpperCase(),
      name: String(editingForm.name || '').trim(),
      specialization: String(editingForm.specialization || 'GENERAL').toUpperCase(),
      academic_year: String(editingForm.academic_year || ''),
      semester: String(editingForm.semester || ''),
      credits: editingForm.credits === '' ? '' : String(editingForm.credits),
      lectures_per_week: editingForm.lectures_per_week === '' ? '' : String(editingForm.lectures_per_week)
    };

    const labels = {
      code: 'Code',
      name: 'Name',
      specialization: 'Specialization',
      academic_year: 'Academic Year',
      semester: 'Semester',
      credits: 'Credits',
      lectures_per_week: 'Lectures / Week'
    };

    return Object.keys(labels)
      .filter((key) => current[key] !== next[key])
      .map((key) => ({
        key,
        label: labels[key],
        from: current[key] || '-',
        to: next[key] || '-'
      }));
  }, [activeEditingSource, editingForm]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Module Registry"
      subtitle="Register, update, and manage degree modules across all specializations."
      badge="Modules"
      themeVariant="academic"
      mainTopMarginClass="mt-9"
      contentSectionWidthClass="max-w-none"
      contentSectionClassName="lg:w-[calc(100%+21.5rem)] lg:ml-[-21.5rem]"
    >
      <style>{`
        .ac-input-hover:focus { border-color: rgba(56,189,248,0.5) !important; box-shadow: 0 0 0 3px rgba(56,189,248,0.1) !important; }
        .ac-btn-primary { transition: all 0.2s; }
        .ac-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(56,189,248,0.3); }
        .ac-select-filter {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(148,163,184,0.22);
          background: rgba(15,23,42,0.72);
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          outline: none;
          min-width: 130px;
        }
        .ac-select-filter:focus {
          border-color: rgba(56,189,248,0.5);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
        }
        .ac-card-kpi {
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 14px;
          padding: 14px;
          background: linear-gradient(160deg, rgba(2,6,23,0.78), rgba(15,23,42,0.82));
        }
        .ac-cell-input {
          width: 100%;
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(148,163,184,0.24);
          color: #e2e8f0;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 12px;
          outline: none;
        }
        .ac-cell-input:focus {
          border-color: rgba(56,189,248,0.55);
          box-shadow: 0 0 0 2px rgba(56,189,248,0.14);
        }
        .ac-action-btn {
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.25);
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          background: rgba(15,23,42,0.78);
          color: #e2e8f0;
        }
        .ac-edit-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .ac-edit-modal {
          width: min(840px, 100%);
          max-height: 92vh;
          overflow: auto;
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.24);
          background: linear-gradient(160deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96));
          box-shadow: 0 24px 70px rgba(2,6,23,0.6);
        }
        .ac-edit-modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
        }
        .ac-error-text {
          margin: 4px 0 0;
          color: #fda4af;
          font-size: 11px;
          font-weight: 700;
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Module Entry Form */}
        <section style={{ ...sectionPanelStyle, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#38bdf8' }}>+</span> New Module
          </h2>
          <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>Add a new course to the institute's active registry.</p>

          <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <DarkInput label="Code *" val={form.code} onChange={v => setForm(p => ({...p, code: v.toUpperCase()}))} placeholder="e.g. IT1010" />
              <DarkInput label="Name *" val={form.name} onChange={v => setForm(p => ({...p, name: v}))} placeholder="e.g. Intro to IT" />
              <DarkSelect 
                label="Specialization *" 
                required 
                value={form.department} 
                onChange={(v) => setForm(p => ({...p, department: v}))}
                options={['IM', 'DS', 'SE', 'CSNE', 'ISE', 'IT', 'CYBER SECURITY', 'GENERAL']} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <DarkInput label="Academic Year" val={form.academic_year} onChange={v => setForm(p => ({...p, academic_year: v}))} type="number" min="1" max="4" />
              <DarkInput label="Semester" val={form.semester} onChange={v => setForm(p => ({...p, semester: v}))} type="number" min="1" max="2" />
              <DarkInput label="Credits" val={form.credits} onChange={v => setForm(p => ({...p, credits: v}))} type="number" min="1" max="10" />
              <DarkInput label="Lectures / Week" val={form.lectures_per_week} onChange={v => setForm(p => ({...p, lectures_per_week: v}))} type="number" min="1" max="10" />
            </div>

            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${isAddScopeAtLimit ? 'rgba(248,113,113,0.45)' : 'rgba(56,189,248,0.35)'}`,
                background: isAddScopeAtLimit ? 'rgba(127,29,29,0.24)' : 'rgba(14,116,144,0.14)',
                color: isAddScopeAtLimit ? '#fecaca' : '#bae6fd',
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Scope capacity: {normalizeSpecializationCode(form.department || 'GENERAL')} · Year {Number(form.academic_year || 0) || '-'} · Semester {Number(form.semester || 0) || '-'} = {activeFormScopeCount}/{MAX_MODULES_PER_SCOPE}
              {isAddScopeAtLimit ? ' (limit reached, update existing modules to make changes)' : ''}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                type="submit" 
                disabled={saving || isAddScopeAtLimit}
                className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: (saving || isAddScopeAtLimit) ? 'not-allowed' : 'pointer',
                  opacity: (saving || isAddScopeAtLimit) ? 0.7 : 1
                }}
              >
                {saving ? 'Registering...' : isAddScopeAtLimit ? 'Scope Limit Reached' : 'Register Module'}
              </button>
            </div>
          </form>
        </section>

        {/* Dynamic Ledger */}
        <section style={sectionPanelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
             <div>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Module Matrix</h3>
               <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{filteredModules.length} added modules in current view</p>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by module code, name, or specialization"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)',
                color: '#f1f5f9', fontSize: 13, outline: 'none', width: '100%'
              }}
            />

            <select className="ac-select-filter" value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
              {specializationOptions.map((option) => (
                <option key={option} value={option} style={{ background: '#0f172a', color: '#e2e8f0' }}>
                  {option === 'ALL' ? 'All Specializations' : option}
                </option>
              ))}
            </select>

            <select className="ac-select-filter" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="ALL" style={{ background: '#0f172a', color: '#e2e8f0' }}>All Years</option>
              <option value="1" style={{ background: '#0f172a', color: '#e2e8f0' }}>Year 1</option>
              <option value="2" style={{ background: '#0f172a', color: '#e2e8f0' }}>Year 2</option>
              <option value="3" style={{ background: '#0f172a', color: '#e2e8f0' }}>Year 3</option>
              <option value="4" style={{ background: '#0f172a', color: '#e2e8f0' }}>Year 4</option>
            </select>

            <select className="ac-select-filter" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
              <option value="ALL" style={{ background: '#0f172a', color: '#e2e8f0' }}>All Semesters</option>
              <option value="1" style={{ background: '#0f172a', color: '#e2e8f0' }}>Semester 1</option>
              <option value="2" style={{ background: '#0f172a', color: '#e2e8f0' }}>Semester 2</option>
            </select>

            <select className="ac-select-filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="code" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Code</option>
              <option value="name" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Name</option>
              <option value="specialization" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Specialization</option>
              <option value="yearSemester" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Year and Semester</option>
              <option value="credits" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Credits</option>
              <option value="lectures" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sort: Lectures per Week</option>
            </select>

            <select className="ac-select-filter" value={sortDirection} onChange={(e) => setSortDirection(e.target.value)}>
              <option value="asc" style={{ background: '#0f172a', color: '#e2e8f0' }}>Order: Ascending</option>
              <option value="desc" style={{ background: '#0f172a', color: '#e2e8f0' }}>Order: Descending</option>
            </select>

            <button
              type="button"
              className="ac-select-filter"
              onClick={() => setShowDataQualityOnly((prev) => !prev)}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: 800,
                color: showDataQualityOnly ? '#0f172a' : '#fde68a',
                background: showDataQualityOnly ? '#facc15' : 'rgba(15,23,42,0.72)',
                borderColor: showDataQualityOnly ? '#fde68a' : 'rgba(148,163,184,0.22)'
              }}
            >
              {showDataQualityOnly ? 'Quality View: ON' : 'Show Data Quality Gaps'}
            </button>

            <button
              type="button"
              className="ac-select-filter"
              onClick={resetViewControls}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              Reset Filters
            </button>

            <button
              type="button"
              className="ac-select-filter"
              onClick={exportFilteredToCsv}
              style={{ textAlign: 'center', cursor: 'pointer', color: '#86efac' }}
            >
              Export View (CSV)
            </button>

            <button
              type="button"
              className="ac-select-filter"
              onClick={handlePersistAllModules}
              disabled={persistingAllModules}
              style={{
                textAlign: 'center',
                cursor: persistingAllModules ? 'not-allowed' : 'pointer',
                color: '#67e8f9',
                opacity: persistingAllModules ? 0.7 : 1,
              }}
            >
              {persistingAllModules ? 'Saving All to DB...' : 'Save All Modules to Database'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Registry Total</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#e2e8f0', fontWeight: 900 }}>{governanceStats.totalRegistry}</p>
            </div>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Visible Records</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#bae6fd', fontWeight: 900 }}>{governanceStats.visibleRecords}</p>
            </div>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Specializations</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#c7d2fe', fontWeight: 900 }}>{governanceStats.uniqueSpecializations}</p>
            </div>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Average Credits</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#86efac', fontWeight: 900 }}>{governanceStats.avgCredits}</p>
            </div>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Avg Lectures / Week</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#fcd34d', fontWeight: 900 }}>{governanceStats.avgLectures}</p>
            </div>
            <div className="ac-card-kpi">
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Quality Alerts</p>
              <p style={{ margin: '6px 0 0', fontSize: 24, color: '#fca5a5', fontWeight: 900 }}>{governanceStats.qualityIssues}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(252,165,165,0.82)' }}>Duplicate codes: {governanceStats.duplicateCodes}</p>
            </div>
          </div>

          <div
            style={{
              marginBottom: 18,
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 16,
              background: 'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.15), rgba(15,23,42,0.88) 38%)',
              padding: '16px 14px 8px'
            }}
          >
            <p style={{ margin: '0 0 8px', color: '#93c5fd', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
              Added Module Distribution
            </p>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 800 }}>
              Specialization Load by Academic Year
            </h4>
            <p style={{ margin: '4px 0 12px', color: 'rgba(148,163,184,0.85)', fontSize: 12 }}>
              Stacked bars show how registered modules are spread across Year 1-4.
            </p>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
                  <defs>
                    <linearGradient id="yearOneBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.95} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="yearTwoBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.95} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="yearThreeBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.95} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="yearFourBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.95} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" vertical={false} />
                  <XAxis dataKey="specialization" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(148,163,184,0.35)' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.35)' }} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.09)' }}
                    contentStyle={{
                      background: 'rgba(2,6,23,0.94)',
                      border: '1px solid rgba(148,163,184,0.35)',
                      borderRadius: 12,
                      color: '#e2e8f0',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.35)'
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 11, paddingTop: 8 }} />
                  <Bar name="Year 1" dataKey="y1" stackId="years" fill="url(#yearOneBar)" radius={[4, 4, 0, 0]} animationDuration={900} />
                  <Bar name="Year 2" dataKey="y2" stackId="years" fill="url(#yearTwoBar)" radius={[4, 4, 0, 0]} animationDuration={1100} />
                  <Bar name="Year 3" dataKey="y3" stackId="years" fill="url(#yearThreeBar)" radius={[4, 4, 0, 0]} animationDuration={1300} />
                  <Bar name="Year 4" dataKey="y4" stackId="years" fill="url(#yearFourBar)" radius={[4, 4, 0, 0]} animationDuration={1500}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.specialization}-${index}`} fill={barColors[index % barColors.length]} fillOpacity={0.18} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'rgba(148,163,184,0.7)', textAlign: 'center', padding: '40px 0' }}>Loading module database...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 1040, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(7,20,43,0.9)' }}>
                    {['Code', 'Name', 'Specialization', 'Year/Sem', 'Credits', 'Lectures/Wk', 'Actions'].map((head) => (
                      <th key={head} style={{ textAlign: 'left', padding: '14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedModules.length > 0 ? sortedModules.map(m => {
                    const dep = String(m.specialization || m.department || 'GENERAL').toUpperCase();
                    const s = getBadgeStyle(dep);
                    const isDuplicateCode = duplicateCodeSet.has(String(m.code || '').trim().toUpperCase());
                    const hasDataGap =
                      !m.academic_year || !m.semester ||
                      m.credits === null || m.credits === undefined || m.credits === '' ||
                      m.lectures_per_week === null || m.lectures_per_week === undefined || m.lectures_per_week === '';
                    return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', background: isDuplicateCode ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                      <td style={{ padding: '14px', color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>{m.code || '—'}</td>
                      <td style={{ padding: '14px', color: '#e2e8f0', fontSize: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span>{m.name || '—'}</span>
                          {isDuplicateCode && (
                            <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Duplicate module code
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                          {dep}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: 13 }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          Y{m.academic_year || '?'} S{m.semester || '?'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: hasDataGap ? '#fda4af' : '#94a3b8', fontSize: 13 }}>{m.credits || '—'}</td>
                      <td style={{ padding: '14px', color: hasDataGap ? '#fda4af' : '#94a3b8', fontSize: 13 }}>{m.lectures_per_week || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="ac-action-btn"
                            onClick={() => startEditModule(m)}
                            disabled={deletingModuleId === m.id}
                            style={{ color: '#93c5fd', borderColor: 'rgba(147,197,253,0.35)' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ac-action-btn"
                            onClick={() => deleteModule(m)}
                            disabled={deletingModuleId === m.id || isEditModalOpen || Boolean(deleteTarget)}
                            style={{ color: '#fca5a5', borderColor: 'rgba(252,165,165,0.35)' }}
                          >
                            {deletingModuleId === m.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.6)' }}>No modules found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isEditModalOpen && typeof document !== 'undefined' && createPortal((
          <div className="ac-edit-overlay" onClick={cancelEditModule}>
            <div className="ac-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 20, borderBottom: '1px solid rgba(148,163,184,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#93c5fd' }}>
                    Advanced Module Editor
                  </p>
                  <h4 style={{ margin: '6px 0 0', color: '#f8fafc', fontSize: 20, fontWeight: 900 }}>
                    Update Module Details
                  </h4>
                  <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.82)', fontSize: 12 }}>
                    Record ID: {activeEditingSource?.id || activeEditingSource?.module_id || editingModuleId || 'Unavailable'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ac-action-btn"
                  onClick={cancelEditModule}
                >
                  Close
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="ac-edit-modal-grid">
                  <div>
                    <DarkInput
                      label="Module Code"
                      val={editingForm.code}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, code: String(v || '').toUpperCase() }))}
                      placeholder="ITXXXX"
                      help="Use a unique code for scheduling integrity"
                    />
                    {editErrors.code && <p className="ac-error-text">{editErrors.code}</p>}
                  </div>
                  <div>
                    <DarkInput
                      label="Module Name"
                      val={editingForm.name}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, name: v }))}
                      placeholder="Module title"
                    />
                    {editErrors.name && <p className="ac-error-text">{editErrors.name}</p>}
                  </div>
                  <div>
                    <DarkSelect
                      label="Specialization"
                      value={editingForm.specialization}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, specialization: v }))}
                      options={['IM', 'DS', 'SE', 'CSNE', 'ISE', 'IT', 'CYBER SECURITY', 'GENERAL']}
                    />
                  </div>
                </div>

                <div className="ac-edit-modal-grid">
                  <div>
                    <DarkInput
                      label="Academic Year"
                      type="number"
                      min="1"
                      max="4"
                      val={editingForm.academic_year}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, academic_year: v }))}
                    />
                    {editErrors.academic_year && <p className="ac-error-text">{editErrors.academic_year}</p>}
                  </div>
                  <div>
                    <DarkInput
                      label="Semester"
                      type="number"
                      min="1"
                      max="2"
                      val={editingForm.semester}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, semester: v }))}
                    />
                    {editErrors.semester && <p className="ac-error-text">{editErrors.semester}</p>}
                  </div>
                  <div>
                    <DarkInput
                      label="Credits"
                      type="number"
                      min="1"
                      max="10"
                      val={editingForm.credits}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, credits: v }))}
                      help="Leave empty only if not finalized"
                    />
                    {editErrors.credits && <p className="ac-error-text">{editErrors.credits}</p>}
                  </div>
                  <div>
                    <DarkInput
                      label="Lectures / Week"
                      type="number"
                      min="1"
                      max="10"
                      val={editingForm.lectures_per_week}
                      onChange={(v) => setEditingForm((prev) => ({ ...prev, lectures_per_week: v }))}
                    />
                    {editErrors.lectures_per_week && <p className="ac-error-text">{editErrors.lectures_per_week}</p>}
                  </div>
                </div>

                <div style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, background: 'rgba(15,23,42,0.5)', padding: '12px 14px' }}>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: 12, fontWeight: 700 }}>Live Preview</p>
                  <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.88)', fontSize: 12 }}>
                    {editingForm.code || 'NO-CODE'} | {editingForm.name || 'Untitled Module'} | {editingForm.specialization || 'GENERAL'} | Y{editingForm.academic_year || '?'} S{editingForm.semester || '?'} | {editingForm.credits || '-'} Credits | {editingForm.lectures_per_week || '-'} Lectures/Week
                  </p>
                </div>

                <div style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, background: 'rgba(15,23,42,0.5)', padding: '12px 14px' }}>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: 12, fontWeight: 700 }}>Change Summary</p>
                  {editChangeSummary.length ? (
                    <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                      {editChangeSummary.map((item) => (
                        <p key={item.key} style={{ margin: 0, fontSize: 12, color: '#e2e8f0' }}>
                          <strong style={{ color: '#bae6fd' }}>{item.label}:</strong> {item.from} → {item.to}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.88)' }}>
                      No changes yet. Update one or more fields to enable a meaningful save.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ padding: 20, borderTop: '1px solid rgba(148,163,184,0.18)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="ac-action-btn"
                  onClick={cancelEditModule}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ac-action-btn"
                  onClick={() => saveEditedModule(editingModuleId)}
                  disabled={updatingModuleId === editingModuleId || !editChangeSummary.length}
                  style={{ color: '#86efac', borderColor: 'rgba(134,239,172,0.4)' }}
                >
                  {updatingModuleId === editingModuleId ? 'Saving Changes...' : 'Save Module Changes'}
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

        {deleteTarget && typeof document !== 'undefined' && createPortal((
          <div className="ac-edit-overlay" onClick={closeDeleteModal}>
            <div className="ac-edit-modal" style={{ width: 'min(640px, 100%)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 20, borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fda4af' }}>
                  Destructive Action
                </p>
                <h4 style={{ margin: '6px 0 0', color: '#fee2e2', fontSize: 20, fontWeight: 900 }}>
                  Confirm Module Deletion
                </h4>
                <p style={{ margin: '8px 0 0', color: 'rgba(254,202,202,0.9)', fontSize: 13 }}>
                  You are about to permanently remove <strong>{deleteTarget.code || deleteTarget.id}</strong>. This cannot be undone.
                </p>
              </div>

              <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                <DarkInput
                  label="Type Module Code To Confirm"
                  val={deleteConfirmCode}
                  onChange={setDeleteConfirmCode}
                  placeholder={String(deleteTarget.code || '').toUpperCase()}
                  help="Delete button unlocks only when this matches exactly"
                />
                <DarkInput
                  label="Deletion Reason"
                  val={deleteReason}
                  onChange={setDeleteReason}
                  placeholder="e.g. merged with new curriculum module"
                  help="Required for coordinator accountability"
                />
              </div>

              <div style={{ padding: 20, borderTop: '1px solid rgba(148,163,184,0.18)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="ac-action-btn" onClick={closeDeleteModal}>Cancel</button>
                <button
                  type="button"
                  className="ac-action-btn"
                  onClick={confirmDeleteModule}
                  disabled={
                    deletingModuleId === deleteTarget.id ||
                    String(deleteConfirmCode || '').trim().toUpperCase() !== String(deleteTarget.code || '').trim().toUpperCase() ||
                    !String(deleteReason || '').trim()
                  }
                  style={{ color: '#fca5a5', borderColor: 'rgba(252,165,165,0.4)' }}
                >
                  {deletingModuleId === deleteTarget.id ? 'Deleting...' : 'Delete Module Permanently'}
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

      </div>
    </FacultyCoordinatorShell>
  );
}
