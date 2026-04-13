import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wand2,
  CalendarDays,
  GraduationCap,
  Cpu,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Users,
  Layers,
} from 'lucide-react';

import {
  generateTimetableForYearSemester,
  getTimetablesForYearSemester,
  approveTimetable,
  rejectTimetable,
  downloadTimetableAsCSV,
} from '../api/timetableGeneration.js';

import {
  getAcademicYears,
  getModulesByYear,
} from '../api/moduleManagement.js';

import { listItems } from '../api/scheduler.js';
import seedBatches from '../data/batches.js';
import { toast } from 'react-toastify';

/* ---------------- HELPERS ---------------- */

const parseJsonSafe = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSpecialization = (value = '') => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return 'General';

  const aliases = {
    SOFTWAREENGINEERING: 'SE',
    INFORMATIONTECHNOLOGY: 'IT',
    COMPUTERSCIENCE: 'CS',
    INFORMATICS: 'IM',
    INFORMATIONSYSTEMSENGINEERING: 'ISE',
    COMPUTER_SYSTEMS_NETWORK_ENGINEERING: 'CSNE',
  };

  const compact = raw.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || raw;
};

const inferSpecializationFromModule = (module = {}) => {
  const details = parseJsonSafe(module.details, {});
  const explicit =
    details.specialization ||
    module.specialization ||
    module.department;

  if (explicit) return normalizeSpecialization(explicit);

  const code = String(module.code || '').toUpperCase();
  if (code.startsWith('IT')) return 'IT';
  if (code.startsWith('SE')) return 'SE';
  if (code.startsWith('CS')) return 'CS';

  return 'General';
};

const extractSpecializationFromBatch = (batch = {}) => {
  if (!batch) return 'IT';
  
  // 1. Try to get specialization directly from batch object
  if (batch.specialization && typeof batch.specialization === 'string') {
    const spec = String(batch.specialization).trim().toUpperCase();
    if (spec && spec.length > 0 && spec !== 'IT') {
      return spec;
    }
  }
  
  // 2. Try to extract from batch ID (format: Y1.S1.WD.IT.01.01)
  if (batch.id) {
    const batchId = String(batch.id || '').trim();
    if (batchId.includes('.')) {
      const tokens = batchId.split('.');
      console.log(`Parsing batch ID: ${batchId}, tokens:`, tokens);
      
      if (tokens.length >= 4) {
        const spec = tokens[3].trim().toUpperCase();
        if (spec && spec.length > 0) {
          return spec;
        }
      }
    }
  }
  
  // 3. Try department_id field
  if (batch.department_id && typeof batch.department_id === 'string') {
    const spec = String(batch.department_id).trim().toUpperCase();
    if (spec && spec.length > 0) {
      return spec;
    }
  }
  
  // 4. Try department field
  if (batch.department && typeof batch.department === 'string') {
    const spec = String(batch.department).trim().toUpperCase();
    if (spec && spec.length > 0) {
      return spec;
    }
  }
  
  // Default fallback
  return 'IT';
};

const normalizeYearToken = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const match = raw.match(/\d+/);
  return match ? String(Number(match[0])) : '';
};

const parseBatchSelectionId = (batchId = '') => {
  const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = '', subgroupToken = ''] = String(batchId || '')
    .trim()
    .split('.');

  if (!yearToken || !semesterToken || !modeToken || !specializationToken || !groupToken || !subgroupToken) {
    return null;
  }

  return {
    year: String(yearToken).replace(/^Y/i, ''),
    semester: String(semesterToken).replace(/^S/i, ''),
    mode: String(modeToken).trim().toUpperCase(),
    specialization: normalizeSpecialization(specializationToken),
    group: String(groupToken).trim(),
    subgroup: String(subgroupToken).trim(),
  };
};

const buildBatchIdFromSelection = (year, semester, specialization, group, subgroup) => {
  const yearToken = normalizeYearToken(year);
  const semesterToken = String(semester || '').trim();
  const specializationToken = normalizeSpecialization(specialization);
  const modeToken = semesterToken === '1' ? 'WD' : semesterToken === '2' ? 'WE' : '';
  const groupToken = String(group || '').trim().padStart(2, '0');
  const subgroupToken = String(subgroup || '').trim().padStart(2, '0');

  if (!yearToken || !semesterToken || !modeToken || !specializationToken || !groupToken || !subgroupToken) {
    return '';
  }

  return `Y${yearToken}.S${semesterToken}.${modeToken}.${specializationToken}.${groupToken}.${subgroupToken}`;
};

const buildTimetableNameFromSelection = (year, semester, specialization, group, subgroup) => {
  const yearToken = normalizeYearToken(year);
  const semesterToken = String(semester || '').trim();
  const specializationToken = normalizeSpecialization(specialization);
  const groupToken = String(group || '').trim().padStart(2, '0');
  const subgroupToken = String(subgroup || '').trim().padStart(2, '0');
  const scopeSuffix = [specializationToken, groupToken, subgroupToken].filter(Boolean).join('_');

  if (!yearToken || !semesterToken || !scopeSuffix) {
    return '';
  }

  return `Timetable_Y${yearToken}_S${semesterToken}_${scopeSuffix}`;
};

/* ---------------- CONSTANTS ---------------- */

const DEFAULT_SPECIALIZATIONS = ['SE', 'IT', 'CS', 'General'];
const SPECIALIZATIONS_LIST = [
  { key: 'IT', label: 'IT' },
  { key: 'SE', label: 'SE' },
  { key: 'DS', label: 'DS' },
  { key: 'ISE', label: 'ISE' },
  { key: 'CS', label: 'CS' },
  { key: 'IM', label: 'IM' },
  { key: 'CN', label: 'CN' },
  { key: 'CYBER SECURITY', label: 'Cyber Security' },
];
const WEEKDAY_FREE_DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MODULE_LIMIT_PER_SPECIALIZATION = 5;

/* ---------------- COMPONENT ---------------- */

const TimetableGenerationByYearSemester = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [modules, setModules] = useState([]);
  const algorithms = ['hybrid'];
  const [timetableName, setTimetableName] = useState('');

  // New state for specialization, group, and sub-group
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [subGroups, setSubGroups] = useState([]);
  const [selectedSubGroup, setSelectedSubGroup] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);

  const [weekdayFreeDay, setWeekdayFreeDay] = useState('Fri');

  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const matchingBatches = useMemo(() => {
    if (!selectedYear || !selectedSemester || !selectedSpecialization) {
      return [];
    }

    const yearToken = normalizeYearToken(selectedYear);
    const semesterToken = String(selectedSemester || '').trim();
    const specializationToken = normalizeSpecialization(selectedSpecialization);

    return batches.filter((batch) => {
      const identity = parseBatchSelectionId(batch.id || batch.name || '');
      if (!identity) return false;
      if (yearToken && identity.year !== yearToken) return false;
      if (semesterToken && identity.semester !== semesterToken) return false;
      if (specializationToken && identity.specialization !== specializationToken) return false;
      return true;
    });
  }, [batches, selectedYear, selectedSemester, selectedSpecialization]);

  const resolvedBatchId = useMemo(
    () => buildBatchIdFromSelection(selectedYear, selectedSemester, selectedSpecialization, selectedGroup, selectedSubGroup),
    [selectedYear, selectedSemester, selectedSpecialization, selectedGroup, selectedSubGroup]
  );

  /* ---------------- FETCH ---------------- */

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await getAcademicYears();
      setAcademicYears(res.data || []);
    } catch {
      setError('Failed to fetch academic years');
    }
  }, []);

  const fetchModules = useCallback(async () => {
    if (!selectedYear) return;

    try {
      setLoadingModules(true);

      const res = await getModulesByYear(selectedYear, selectedSemester, selectedSpecialization || null);

      const mapped = (res.data || []).map((m) => ({
        ...m,
        specialization: inferSpecializationFromModule(m),
      }));

      setModules(mapped.slice(0, MODULE_LIMIT_PER_SPECIALIZATION));
      toast.success(`Loaded ${mapped.length} modules`);
    } catch {
      setError('Failed to fetch modules');
    } finally {
      setLoadingModules(false);
    }
  }, [selectedYear, selectedSemester, selectedSpecialization]);

  const fetchExisting = useCallback(async () => {
    if (!selectedYear || !selectedSemester) return;

    const res = await getTimetablesForYearSemester(
      selectedYear,
      selectedSemester,
      {
        specialization: selectedSpecialization || null,
        group: selectedGroup || null,
        subgroup: selectedSubGroup || null,
      }
    );
    setExistingTimetables(res.data || []);
  }, [selectedYear, selectedSemester, selectedSpecialization, selectedGroup, selectedSubGroup]);

  const fetchBatches = useCallback(async () => {
    try {
      setLoadingBatches(true);
      setError(null);
      
      console.log('Fetching batches...');
      const res = await listItems('batches');
      let batchList = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
          ? res.data
          : [];

      if (!batchList.length) {
        batchList = seedBatches;
      }
      
      console.log('Raw batch data:', batchList);
      console.log('Batch count:', batchList.length);
      
      // Set batches with complete data
      setBatches(batchList);
      
      // Extract unique specializations from batches using the helper function
      const specsSet = new Set();
      
      batchList.forEach((batch) => {
        const spec = extractSpecializationFromBatch(batch);
        console.log(`Batch ${batch.id} -> Specialization: ${spec}`);
        if (spec) {
          specsSet.add(spec);
        }
      });
      
      // Always include the predefined specializations as fallback/default
      SPECIALIZATIONS_LIST.forEach(spec => {
        specsSet.add(spec.key);
      });
      
      const uniqueSpecs = Array.from(specsSet)
        .filter(Boolean)
        .sort();
      
      console.log('Final specializations:', uniqueSpecs);
      
      setSpecializations(uniqueSpecs);
      
      if (uniqueSpecs.length === 0) {
        setError('No specializations available');
      }
    } catch (err) {
      console.error('Batch fetch error:', err);
      // Fallback: use default specializations
      setBatches(seedBatches);
      setSpecializations(SPECIALIZATIONS_LIST.map(s => s.key));
      setError('Could not fetch batches - using defaults');
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    const uniqueGroups = Array.from(
      new Set(
        matchingBatches
          .map((batch) => parseBatchSelectionId(batch.id || batch.name || '')?.group)
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    setGroups(uniqueGroups);

    if (!selectedGroup || !uniqueGroups.includes(selectedGroup)) {
      if (selectedGroup) {
        setSelectedGroup('');
        setSelectedSubGroup('');
      }
      setSubGroups([]);
      setSelectedBatch('');
      return;
    }

    const uniqueSubGroups = Array.from(
      new Set(
        matchingBatches
          .map((batch) => parseBatchSelectionId(batch.id || batch.name || ''))
          .filter((identity) => identity && identity.group === selectedGroup)
          .map((identity) => identity.subgroup)
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    setSubGroups(uniqueSubGroups);

    if (selectedSubGroup && !uniqueSubGroups.includes(selectedSubGroup)) {
      setSelectedSubGroup('');
      setSelectedBatch('');
      return;
    }

    if (selectedYear && selectedSemester && selectedSpecialization && selectedGroup && selectedSubGroup) {
      const nextBatchId = matchingBatches.find((batch) => {
        const identity = parseBatchSelectionId(batch.id || batch.name || '');
        return identity && identity.group === selectedGroup && identity.subgroup === selectedSubGroup;
      })?.id || resolvedBatchId;

      if (nextBatchId !== selectedBatch) {
        setSelectedBatch(nextBatchId);
      }
    } else if (selectedBatch) {
      setSelectedBatch('');
    }
  }, [
    matchingBatches,
    resolvedBatchId,
    selectedBatch,
    selectedGroup,
    selectedSemester,
    selectedSpecialization,
    selectedSubGroup,
    selectedYear,
  ]);

  const handleSpecializationChange = (spec) => {
    setSelectedSpecialization(spec);
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
  };

  const handleGroupChange = (grp) => {
    setSelectedGroup(grp);
    setSelectedSubGroup('');
    setSelectedBatch('');
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
  };

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester);
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchBatches();
  }, [fetchAcademicYears, fetchBatches]);

  useEffect(() => {
    fetchModules();
    fetchExisting();
  }, [fetchModules, fetchExisting]);

  /* ---------------- HANDLERS ---------------- */

  const handleGenerate = async (e) => {
    e.preventDefault();

    const batchId = selectedBatch || resolvedBatchId;
    const resolvedTimetableName = (timetableName || '').trim() || buildTimetableNameFromSelection(
      selectedYear,
      selectedSemester,
      selectedSpecialization,
      selectedGroup,
      selectedSubGroup
    );

    if (!selectedYear || !selectedSemester || !selectedSpecialization || !selectedGroup || !selectedSubGroup || !batchId) {
      setError('Fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await generateTimetableForYearSemester(
        selectedYear,
        selectedSemester,
        {
          algorithms,
          timetableName: resolvedTimetableName,
          weekdayFreeDay,
          specialization: selectedSpecialization,
          group: selectedGroup,
          subgroup: selectedSubGroup,
          batchId,
        }
      );

      setGeneratedTimetable(res);
      setSuccess('Timetable generated successfully');
      fetchExisting();
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await approveTimetable(id);
    fetchExisting();
  };

  const handleReject = async (id) => {
    await rejectTimetable(id);
    fetchExisting();
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-7xl">
      {/* ALERTS */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 text-red-700 shadow-md">
          <AlertCircle size={20} className="flex-shrink-0 text-red-600" /> 
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-green-50/50 p-4 text-green-700 shadow-md">
          <CheckCircle2 size={20} className="flex-shrink-0 text-green-600" /> 
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* DEBUG PANEL */}
      <div className="mb-6 rounded-2xl border border-slate-300 bg-slate-100 p-4">
        <div className="text-xs font-mono text-slate-700">
          <div className="mb-2 font-bold">Debug Info:</div>
          <div>Status: {loadingBatches ? '🔄 Loading...' : '✓ Ready'}</div>
          <div>Specializations loaded: {specializations.length}</div>
          <div>Selected specialization: {selectedSpecialization || '(none)'}</div>
          <div>Available: {specializations.join(', ') || 'None'}</div>
          {batches.length > 0 && <div>Batches fetched: {batches.length}</div>}
        </div>
      </div>

      {/* FORM SECTION */}
      <form onSubmit={handleGenerate} className="">
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Configure Your Schedule</h2>
          
          {/* FORM LIST - VERTICAL LAYOUT */}
          <div className="space-y-4 mb-6">
            {/* YEAR SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <CalendarDays size={16} className="inline mr-2" /> Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-sky-300 hover:shadow-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y.academic_year} value={y.academic_year}>
                    {y.academic_year}
                  </option>
                ))}
              </select>
            </div>

            {/* SEMESTER SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <GraduationCap size={16} className="inline mr-2" /> Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-emerald-300 hover:shadow-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            {/* SPECIALIZATION SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <BookOpen size={16} className="inline mr-2" /> Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => handleSpecializationChange(e.target.value)}
                disabled={loadingBatches}
                className="w-full rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-indigo-300 hover:shadow-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingBatches ? 'Loading specializations...' : specializations.length === 0 ? 'No specializations available' : 'Select Specialization'}
                </option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              {specializations.length === 0 && !loadingBatches && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ Using default specializations. Check console for batch fetch details.
                </p>
              )}
            </div>

            {/* GROUP SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Users size={16} className="inline mr-2" /> Group
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                disabled={!selectedYear || !selectedSemester || !selectedSpecialization || groups.length === 0}
                className="w-full rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-rose-300 hover:shadow-lg focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedYear || !selectedSemester
                    ? 'Select Year and Semester First'
                    : !selectedSpecialization
                      ? 'Select Specialization First'
                      : groups.length === 0
                        ? 'No Groups Available'
                        : 'Select Group'}
                </option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* SUB-GROUP SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Layers size={16} className="inline mr-2" /> Sub-Group
              </label>
              <select
                value={selectedSubGroup}
                onChange={(e) => setSelectedSubGroup(e.target.value)}
                disabled={!selectedYear || !selectedSemester || !selectedSpecialization || !selectedGroup || subGroups.length === 0}
                className="w-full rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-cyan-300 hover:shadow-lg focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedYear || !selectedSemester
                    ? 'Select Year and Semester First'
                    : !selectedSpecialization
                      ? 'Select Specialization First'
                      : !selectedGroup
                        ? 'Select Group First'
                        : subGroups.length === 0
                          ? 'No Sub-Groups Available'
                          : 'Select Sub-Group'}
                </option>
                {subGroups.map((subgroup) => (
                  <option key={subgroup} value={subgroup}>
                    {subgroup}
                  </option>
                ))}
              </select>
            </div>

            {/* BATCH PREVIEW */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <GraduationCap size={16} className="inline mr-2" /> Batch
              </label>
              <div className="rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 px-4 py-3 font-semibold text-slate-900 shadow-md">
                {selectedYear && selectedSemester && selectedSpecialization && selectedGroup && selectedSubGroup
                  ? selectedBatch || resolvedBatchId || 'Batch will be generated automatically'
                  : 'Select year, semester, specialization, group, and subgroup to auto-generate the batch'}
              </div>
            </div>

            {/* TIMETABLE NAME */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <FileCheck2 size={16} className="inline mr-2" /> Schedule Name (optional)
              </label>
              <input
                value={timetableName}
                onChange={(e) => setTimetableName(e.target.value)}
                placeholder="Leave blank to auto-name by group and subgroup"
                className="w-full rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-md transition-all duration-200 hover:border-violet-300 hover:shadow-lg focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
              />
              <p className="mt-2 text-xs text-slate-500">
                Auto-generated names include year, semester, specialization, group, and subgroup.
              </p>
            </div>

            {/* FREE DAY SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Wand2 size={16} className="inline mr-2" /> Free Day
              </label>
              <select
                value={weekdayFreeDay}
                onChange={(e) => setWeekdayFreeDay(e.target.value)}
                className="w-full rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-amber-300 hover:shadow-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              >
                {WEEKDAY_FREE_DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}day</option>
                ))}
              </select>
            </div>

            {/* GENERATE BUTTON */}
            <div className="w-full pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-4 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:from-sky-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Cpu size={22} className="relative" />
                <span className="relative">{loading ? 'Generating...' : 'Generate Schedule'}</span>
              </button>
            </div>
          </div>

          {/* SELECTION SUMMARY */}
          {(selectedYear || selectedSemester || selectedSpecialization || selectedGroup || selectedSubGroup) && (
            <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-4">Your Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {selectedYear && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Year</p>
                    <p className="text-sm font-bold text-slate-900">{selectedYear}</p>
                  </div>
                )}
                {selectedSemester && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Semester</p>
                    <p className="text-sm font-bold text-slate-900">Sem {selectedSemester}</p>
                  </div>
                )}
                {selectedSpecialization && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Specialization</p>
                    <p className="text-sm font-bold text-slate-900">{selectedSpecialization}</p>
                  </div>
                )}
                {selectedGroup && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Group</p>
                    <p className="text-sm font-bold text-slate-900">{selectedGroup}</p>
                  </div>
                )}
                {selectedSubGroup && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Sub-Group</p>
                    <p className="text-sm font-bold text-slate-900">{selectedSubGroup}</p>
                  </div>
                )}
                {selectedBatch && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Batch</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBatch}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODULES INFO */}
          {loadingModules && (
            <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-sky-600 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Loading modules...</span>
            </div>
          )}
          
          {modules.length > 0 && !loadingModules && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">
                ✓ {modules.length} modules loaded from Academic Coordinator
              </p>
            </div>
          )}
        </div>
      </form>

      {/* GENERATED TIMETABLE */}
      {generatedTimetable && (
        <div className="mb-8 overflow-hidden rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <div className="border-b-2 border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 p-6">
            <h3 className="text-2xl font-bold text-green-900">✓ Timetable Generated</h3>
            <p className="mt-2 text-sm text-green-700">Schedule ID: <span className="font-mono font-bold">{generatedTimetable.timetableId}</span></p>
          </div>
          <div className="p-6">
            <div className="mb-4 inline-block rounded-full bg-green-200 px-4 py-2 text-sm font-bold text-green-800">
              Ready for review and export
            </div>
            <button
              onClick={() =>
                downloadTimetableAsCSV(
                  generatedTimetable.results?.hybrid?.schedule || [],
                  selectedYear,
                  selectedSemester,
                  selectedGroup,
                  selectedSubGroup
                )
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-3 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-green-600 hover:to-emerald-700"
            >
              <FileCheck2 size={18} />
              Download as CSV
            </button>
          </div>
        </div>
      )}

      {/* EXISTING TIMETABLES */}
      <div className="mt-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Timetable History</h2>

        {existingTimetables.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-600">No timetables generated yet. Create your first schedule above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {existingTimetables.map((t) => (
              <div
                key={t.id}
                className={`overflow-hidden rounded-2xl border-2 shadow-md transition-all duration-300 ${
                  t.status === 'pending'
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
                    : t.status === 'approved'
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100'
                }`}
              >
                <div className={`border-b-2 px-6 py-4 ${
                  t.status === 'pending'
                    ? 'border-amber-300 bg-amber-100/50'
                    : t.status === 'approved'
                    ? 'border-green-300 bg-green-100/50'
                    : 'border-slate-300 bg-slate-100/50'
                }`}>
                  <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">ID: {t.id.slice(0, 8)}...</p>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    {t.status === 'pending' && (
                      <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                        ⏱ Pending Review
                      </span>
                    )}
                    {t.status === 'approved' && (
                      <span className="rounded-full bg-green-200 px-3 py-1 text-xs font-bold text-green-800">
                        ✓ Approved
                      </span>
                    )}
                    {t.status === 'rejected' && (
                      <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-800">
                        ✗ Rejected
                      </span>
                    )}
                  </div>

                  {t.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="flex-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-green-600 hover:to-emerald-700"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(t.id)}
                        className="flex-1 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-red-600 hover:to-orange-700"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableGenerationByYearSemester;