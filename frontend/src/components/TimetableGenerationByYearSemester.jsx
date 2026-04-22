import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  downloadTimetableAsCSV,
  validateCoordinatorTimetableRequest,
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

const buildBatchIdFromSelection = (year, semester, mode, specialization, group, subgroup) => {
  const yearToken = normalizeYearToken(year);
  const semesterToken = String(semester || '').trim();
  const modeToken = String(mode || '').trim().toUpperCase();
  const specializationToken = normalizeSpecialization(specialization);
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

const parseTimetableSchedule = (timetable) => {
  const rawData = timetable?.data;
  if (!rawData) return [];

  const pickScheduleFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    if (Array.isArray(obj.schedule)) return obj.schedule;

    if (Array.isArray(obj.groupedSchedules)) {
      return obj.groupedSchedules.flatMap((group) => {
        if (Array.isArray(group?.entries)) return group.entries;
        if (Array.isArray(group?.schedule)) return group.schedule;
        return [];
      });
    }

    const allResults = obj.allResults || obj.results || null;
    if (allResults && typeof allResults === 'object') {
      const prioritizedKeys = ['hybrid', 'pso', 'genetic', 'ant', 'tabu'];
      for (const key of prioritizedKeys) {
        if (Array.isArray(allResults?.[key]?.schedule)) {
          return allResults[key].schedule;
        }
      }

      for (const value of Object.values(allResults)) {
        if (Array.isArray(value?.schedule)) {
          return value.schedule;
        }
      }
    }

    return [];
  };

  if (typeof rawData === 'string') {
    try {
      return pickScheduleFromObject(JSON.parse(rawData));
    } catch {
      return [];
    }
  }

  if (typeof rawData === 'object' && rawData !== null) {
    return pickScheduleFromObject(rawData);
  }

  return [];
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
  const navigate = useNavigate();
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
  const [selectedBatchMode, setSelectedBatchMode] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);

  const [weekdayFreeDay, setWeekdayFreeDay] = useState('Fri');

  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingSpecializationGraph, setLoadingSpecializationGraph] = useState(false);
  const [specializationModuleCounts, setSpecializationModuleCounts] = useState([]);
  const [chartHover, setChartHover] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Detect if a timetable already exists for the current selection
  const alreadyGenerated = useMemo(() => {
    if (!selectedYear || !selectedSemester || !selectedSpecialization) return null;
    return existingTimetables.find((t) => {
      const tYear = String(t.year || '').trim();
      const tSem  = String(t.semester || '').trim();
      const tData = typeof t.data === 'object' ? t.data : {};
      const tSpec = String(tData?.scope?.specialization || tData?.specialization || '').toUpperCase();
      const selSpec = normalizeSpecialization(selectedSpecialization);
      const yearMatch = tYear === String(selectedYear).trim();
      const semMatch  = tSem  === String(selectedSemester).trim();
      const specMatch = !tSpec || tSpec === selSpec;
      return yearMatch && semMatch && specMatch;
    }) || null;
  }, [existingTimetables, selectedYear, selectedSemester, selectedSpecialization]);

  const matchingBatches = useMemo(() => {
    if (!selectedYear || !selectedSemester || !selectedBatchMode || !selectedSpecialization) {
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
      if (selectedBatchMode && identity.mode !== selectedBatchMode) return false;
      if (specializationToken && identity.specialization !== specializationToken) return false;
      return true;
    });
  }, [batches, selectedYear, selectedSemester, selectedBatchMode, selectedSpecialization]);

  const resolvedBatchId = useMemo(
    () => buildBatchIdFromSelection(selectedYear, selectedSemester, selectedBatchMode, selectedSpecialization, selectedGroup, selectedSubGroup),
    [selectedYear, selectedSemester, selectedBatchMode, selectedSpecialization, selectedGroup, selectedSubGroup]
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
    if (!selectedYear || !selectedSemester || !selectedSpecialization) {
      setModules([]);
      return;
    }

    try {
      setLoadingModules(true);

      // Primary attempt: fetch from academic-coordinator endpoint
      let res;
      try {
        res = await getModulesByYear(selectedYear, selectedSemester, selectedSpecialization || null);
      } catch (err) {
        console.warn('getModulesByYear failed, falling back to scheduler modules', err);
        res = { data: [] };
      }

      let modulesData = Array.isArray(res?.data) ? res.data : [];
      let usedFallback = false;

      // Fallback: if academic-coordinator endpoint returned no modules,
      // try the scheduler `modules` list and filter locally.
      if (modulesData.length === 0) {
        try {
          const schedRes = await listItems('modules', {
            year: selectedYear,
            semester: selectedSemester,
            specialization: selectedSpecialization,
          });
          const rawModules = Array.isArray(schedRes?.items)
            ? schedRes.items
            : Array.isArray(schedRes?.data)
            ? schedRes.data
            : [];

          const yearMatches = (selYear, modYear) => {
            const sel = String(selYear || '').trim();
            const mod = String(modYear || '').trim();
            if (!sel || !mod) return false;
            const selToken = normalizeYearToken(sel);
            const modToken = normalizeYearToken(mod);
            if (selToken && modToken) return selToken === modToken;
            const fmt = (s) => String(s).toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
            return fmt(sel) === fmt(mod) || fmt(mod).includes(fmt(sel));
          };

          modulesData = rawModules.filter((m) => {
            const details = parseJsonSafe(m.details, {});
            const moduleYearRaw = m.academic_year || details.academic_year || m.academicYear || '';
            const moduleSemesterRaw = String(m.semester || details.semester || '').trim();

            if (!yearMatches(selectedYear, moduleYearRaw)) return false;
            if (selectedSemester && String(selectedSemester).trim() !== String(moduleSemesterRaw).trim()) return false;

            if (selectedSpecialization) {
              const selSpec = normalizeSpecialization(selectedSpecialization);
              const modSpec = normalizeSpecialization(inferSpecializationFromModule(m) || m.department || m.department_id || details.specialization || '');
              if (selSpec !== 'ALL' && selSpec && modSpec && selSpec !== modSpec) return false;
            }

            return true;
          });

          if (modulesData.length > 0) usedFallback = true;
        } catch (err) {
          console.warn('Fallback scheduler modules fetch failed', err);
        }
      }

      const mapped = (modulesData || []).map((m) => ({
        ...m,
        specialization: inferSpecializationFromModule(m),
      }));

      const filteredByMode = mapped.filter((module) => {
        if (!selectedBatchMode) return true;
        const details = parseJsonSafe(module.details, {});
        const dayType = String(module.day_type || details.day_type || 'weekday').trim().toLowerCase();

        // Weekend batches should use the same modules as weekday students
        if (selectedBatchMode === 'WE') {
          return ['weekday', 'any', 'both', ''].includes(dayType);
        }

        return ['weekday', 'any', 'both', ''].includes(dayType);
      });

      // Do not enforce a minimum or mandatory cap client-side — show all matching modules
      const limitedModules = filteredByMode; // intentionally not sliced to a fixed cap
      setModules(limitedModules);
      const message = `${limitedModules.length} modules have been fetched successfully${usedFallback ? ' (using fallback list)' : ''}`;
      setSuccess(message);
      toast.success(message);
    } catch (err) {
      console.error('fetchModules error:', err);
      setError('Failed to fetch modules');
    } finally {
      setLoadingModules(false);
    }
  }, [selectedYear, selectedSemester, selectedSpecialization, selectedBatchMode]);

  const fetchSpecializationModuleCounts = useCallback(async () => {
    if (!selectedYear || !selectedSemester || !selectedSpecialization) {
      setSpecializationModuleCounts([]);
      return;
    }

    try {
      setLoadingSpecializationGraph(true);
      const res = await getModulesByYear(selectedYear, selectedSemester, null);
      const allModules = Array.isArray(res?.data) ? res.data : [];

      const countsMap = allModules.reduce((acc, module) => {
        const specialization = normalizeSpecialization(inferSpecializationFromModule(module));
        acc[specialization] = (acc[specialization] || 0) + 1;
        return acc;
      }, {});

      const knownSpecializations = Array.from(
        new Set([
          ...SPECIALIZATIONS_LIST.map((item) => normalizeSpecialization(item.key)),
          ...Object.keys(countsMap),
        ])
      );

      const graphRows = knownSpecializations
        .map((specialization) => {
          const count = countsMap[specialization] || 0;
          return {
            specialization,
            count,
            atLimit: count >= MODULE_LIMIT_PER_SPECIALIZATION,
          };
        })
        .sort((left, right) => right.count - left.count || left.specialization.localeCompare(right.specialization));

      setSpecializationModuleCounts(graphRows);
    } catch {
      setSpecializationModuleCounts([]);
    } finally {
      setLoadingSpecializationGraph(false);
    }
  }, [selectedYear, selectedSemester, selectedSpecialization]);

  const fetchExisting = useCallback(async () => {
    if (!selectedYear || !selectedSemester) return;

    const res = await getTimetablesForYearSemester(
      selectedYear,
      selectedSemester,
      {
        specialization: selectedSpecialization || null,
        mode: selectedBatchMode || null,
        group: selectedGroup || null,
        subgroup: selectedSubGroup || null,
      }
    );
    setExistingTimetables(res.data || []);
  }, [selectedYear, selectedSemester, selectedSpecialization, selectedBatchMode, selectedGroup, selectedSubGroup]);

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

    if (selectedYear && selectedSemester && selectedBatchMode && selectedSpecialization && selectedGroup && selectedSubGroup) {
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
    selectedBatchMode,
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
    setSelectedBatchMode('');
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
  };

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester);
    const autoMode = semester === '1' ? 'WD' : semester === '2' ? 'WE' : '';
    setSelectedBatchMode(autoMode);
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
    // Weekend batches do not have a weekday free day
    if (autoMode === 'WE') {
      setWeekdayFreeDay('');
    } else {
      // ensure a sensible default for weekday batches
      if (!weekdayFreeDay) setWeekdayFreeDay('Fri');
    }
  };

  const handleBatchModeChange = (mode) => {
    setSelectedBatchMode(mode);
    setSelectedGroup('');
    setSelectedSubGroup('');
    setSelectedBatch('');
    // Clear free day for weekend mode; restore default for weekday
    if (mode === 'WE') {
      setWeekdayFreeDay('');
    } else {
      if (!weekdayFreeDay) setWeekdayFreeDay('Fri');
    }
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchBatches();
  }, [fetchAcademicYears, fetchBatches]);

  useEffect(() => {
    fetchModules();
    fetchSpecializationModuleCounts();
    fetchExisting();
  }, [fetchModules, fetchSpecializationModuleCounts, fetchExisting]);

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

    const validation = (() => {
      try {
        // Weekend batches do not have a weekday free day — validate without it
        const freeDayToValidate = selectedBatchMode === 'WE' ? '' : weekdayFreeDay;

        return validateCoordinatorTimetableRequest({
          academicYear: selectedYear,
          semester: selectedSemester,
          batchMode: selectedBatchMode,
          specialization: selectedSpecialization,
          group: selectedGroup,
          subgroup: selectedSubGroup,
          batchId,
          timetableName: resolvedTimetableName,
          weekdayFreeDay: freeDayToValidate,
        });
      } catch (validationError) {
        setError(validationError.message || 'Fill all required fields');
        return null;
      }
    })();

    if (!validation) {
      return;
    }

    try {
      setLoading(true);

      const optionsPayload = {
        algorithms,
        timetableName: validation.timetableName,
        batchMode: validation.batchMode,
        specialization: validation.specialization,
        group: validation.group,
        subgroup: validation.subgroup,
        batchId: validation.batchId,
      };

      // Only include weekdayFreeDay for non-weekend batches
      if (validation.batchMode !== 'WE' && validation.weekdayFreeDay) {
        optionsPayload.weekdayFreeDay = validation.weekdayFreeDay;
      }

      const res = await generateTimetableForYearSemester(
        validation.academicYear,
        validation.semester,
        optionsPayload
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

  const openTimetableReport = (timetableId = '') => {
    const idQuery = timetableId ? `?timetableId=${encodeURIComponent(String(timetableId))}` : '';
    navigate(`/faculty/timetable-report${idQuery}`);
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

      {/* WD / WE SHARED MODULES INFO */}
      {selectedBatchMode && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-4 shadow-sm">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">i</span>
          <div>
            <p className="text-sm font-bold text-sky-800">Weekday &amp; Weekend batches share the same module set</p>
            <p className="mt-0.5 text-xs text-sky-600">Both WD and WE batches of the same year / semester / specialization use identical modules. Only the schedule time-slots differ.</p>
          </div>
        </div>
      )}

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

            {/* BATCH TYPE SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Layers size={16} className="inline mr-2" /> Batch Type
              </label>
              <select
                value={selectedBatchMode}
                onChange={(e) => handleBatchModeChange(e.target.value)}
                disabled={!selectedYear || !selectedSemester}
                className="w-full rounded-xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-fuchsia-300 hover:shadow-lg focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedYear || !selectedSemester ? 'Select Year and Semester First' : 'Select Batch Type'}
                </option>
                <option value="WD">Weekday (WD)</option>
                <option value="WE">Weekend (WE)</option>
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
                disabled={!selectedYear || !selectedSemester || !selectedBatchMode || !selectedSpecialization || groups.length === 0}
                className="w-full rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-rose-300 hover:shadow-lg focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedYear || !selectedSemester
                    ? 'Select Year and Semester First'
                    : !selectedBatchMode
                      ? 'Select Batch Type First'
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
                disabled={!selectedYear || !selectedSemester || !selectedBatchMode || !selectedSpecialization || !selectedGroup || subGroups.length === 0}
                className="w-full rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-cyan-300 hover:shadow-lg focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedYear || !selectedSemester
                    ? 'Select Year and Semester First'
                    : !selectedBatchMode
                      ? 'Select Batch Type First'
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
                {selectedYear && selectedSemester && selectedBatchMode && selectedSpecialization && selectedGroup && selectedSubGroup
                  ? selectedBatch || resolvedBatchId || 'Batch will be generated automatically'
                  : 'Select year, semester, batch type, specialization, group, and subgroup to auto-generate the batch'}
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
              {selectedBatchMode === 'WE' ? (
                <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 font-semibold text-slate-900 shadow-md">
                  Not applicable for weekend batches
                </div>
              ) : (
                <select
                  value={weekdayFreeDay}
                  onChange={(e) => setWeekdayFreeDay(e.target.value)}
                  className="w-full rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-amber-300 hover:shadow-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                >
                  {WEEKDAY_FREE_DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}day</option>
                  ))}
                </select>
              )}
            </div>

            {/* ALREADY GENERATED BANNER */}
            {alreadyGenerated && (
              <div className="w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-5 w-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-amber-900">Timetable Already Generated</p>
                    <p className="mt-1 text-xs text-amber-700">A timetable for <strong>Year {selectedYear} · Sem {selectedSemester} · {selectedSpecialization}</strong> already exists: <span className="font-mono font-semibold">{alreadyGenerated.name}</span></p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openTimetableReport(alreadyGenerated.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors">
                        <CalendarDays size={13}/> View Existing
                      </button>
                      <span className="inline-flex items-center rounded-lg border border-amber-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-800">You may still generate a new one below ↓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GENERATE BUTTON */}
            <div className="w-full pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-4 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:from-sky-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Cpu size={22} className="relative" />
                <span className="relative">{loading ? 'Generating…' : alreadyGenerated ? 'Re-Generate Schedule' : 'Generate Schedule'}</span>
              </button>
            </div>
          </div>

          {/* SELECTION SUMMARY */}
          {(selectedYear || selectedSemester || selectedBatchMode || selectedSpecialization || selectedGroup || selectedSubGroup) && (
            <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-4">Your Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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
                {selectedBatchMode && (
                  <div className="rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-slate-600">Batch Type</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBatchMode === 'WD' ? 'Weekday' : 'Weekend'}</p>
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

          {selectedYear && selectedSemester && selectedSpecialization && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 shadow-xl">
              {/* Chart header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Module Distribution</p>
                  <p className="mt-0.5 text-base font-bold text-white">Modules by Specialization</p>
                </div>
                <div className="rounded-lg bg-indigo-800/60 px-3 py-1.5 text-xs font-semibold text-indigo-200">
                  Y{selectedYear} · Sem {selectedSemester}
                </div>
              </div>

              {loadingSpecializationGraph ? (
                <div className="flex items-center gap-3 py-6">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  <span className="text-sm text-indigo-300">Loading chart…</span>
                </div>
              ) : specializationModuleCounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-indigo-400">No module data for selected scope.</p>
              ) : (() => {
                const maxCount = Math.max(...specializationModuleCounts.map(r => r.count), MODULE_LIMIT_PER_SPECIALIZATION);
                const BAR_H = 28;
                const GAP = 10;
                const LABEL_W = 72;
                const VAL_W = 36;
                const chartW = 340;
                const totalH = specializationModuleCounts.length * (BAR_H + GAP);
                const COLORS = [
                  ['#6366f1','#818cf8'], ['#0ea5e9','#38bdf8'], ['#10b981','#34d399'],
                  ['#f59e0b','#fbbf24'], ['#ec4899','#f472b6'], ['#8b5cf6','#a78bfa'],
                  ['#14b8a6','#2dd4bf'], ['#f97316','#fb923c'],
                ];
                return (
                  <div className="overflow-x-auto">
                    <svg width="100%" viewBox={`0 0 ${LABEL_W + chartW + VAL_W + 8} ${totalH}`} className="block">
                      {/* Grid lines */}
                      {[0,25,50,75,100].map(pct => {
                        const x = LABEL_W + (pct / 100) * chartW;
                        return (
                          <g key={pct}>
                            <line x1={x} y1={0} x2={x} y2={totalH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            {pct > 0 && <text x={x} y={totalH + 14} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">{pct}%</text>}
                          </g>
                        );
                      })}
                      {specializationModuleCounts.map((row, i) => {
                        const y = i * (BAR_H + GAP);
                        const pct = Math.min(100, (row.count / maxCount) * 100);
                        const limitPct = Math.min(100, (MODULE_LIMIT_PER_SPECIALIZATION / maxCount) * 100);
                        const isSelected = normalizeSpecialization(selectedSpecialization) === row.specialization;
                        const [c1, c2] = COLORS[i % COLORS.length];
                        const gradId = `g${i}`;
                        const barW = (pct / 100) * chartW;
                        const isHov = chartHover === i;
                        return (
                          <g key={row.specialization}
                            onMouseEnter={() => setChartHover(i)}
                            onMouseLeave={() => setChartHover(null)}
                            style={{cursor:'default'}}>
                            <defs>
                              <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor={c1}/>
                                <stop offset="100%" stopColor={c2}/>
                              </linearGradient>
                            </defs>
                            {/* Label */}
                            <text x={LABEL_W - 8} y={y + BAR_H/2 + 4} textAnchor="end" fontSize="10"
                              fontWeight={isSelected ? '700' : '500'}
                              fill={isSelected ? '#a5b4fc' : 'rgba(255,255,255,0.65)'}>
                              {row.specialization}
                            </text>
                            {/* Track */}
                            <rect x={LABEL_W} y={y + 4} width={chartW} height={BAR_H - 8}
                              rx="6" fill="rgba(255,255,255,0.05)" />
                            {/* Bar */}
                            {barW > 0 && (
                              <rect x={LABEL_W} y={y + 4} width={barW} height={BAR_H - 8}
                                rx="6" fill={`url(#${gradId})`}
                                opacity={isHov ? 1 : 0.85}
                                style={{transition:'width 0.5s cubic-bezier(.4,0,.2,1)'}}/>
                            )}
                            {/* Limit marker */}
                            <line
                              x1={LABEL_W + (limitPct/100)*chartW}
                              y1={y + 2}
                              x2={LABEL_W + (limitPct/100)*chartW}
                              y2={y + BAR_H - 2}
                              stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeDasharray="3,2" />
                            {/* Selected ring */}
                            {isSelected && (
                              <rect x={LABEL_W} y={y + 2} width={chartW} height={BAR_H - 4}
                                rx="7" fill="none" stroke="#818cf8" strokeWidth="1.5" />
                            )}
                            {/* Count label */}
                            <text x={LABEL_W + chartW + 6} y={y + BAR_H/2 + 4}
                              fontSize="10" fontWeight="700"
                              fill={row.atLimit ? '#fbbf24' : 'rgba(255,255,255,0.8)'}>
                              {row.count}/{MODULE_LIMIT_PER_SPECIALIZATION}
                            </text>
                            {/* Hover tooltip */}
                            {isHov && (
                              <g>
                                <rect x={LABEL_W + barW - 2} y={y - 22} width={90} height={18}
                                  rx="4" fill="#1e1b4b" opacity="0.95" />
                                <text x={LABEL_W + barW + 43} y={y - 9}
                                  textAnchor="middle" fontSize="9" fill="#c7d2fe">
                                  {row.count} module{row.count !== 1 ? 's' : ''} · {Math.round(pct)}% full
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    {/* Legend */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-indigo-300">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-5 rounded bg-gradient-to-r from-indigo-400 to-indigo-300"/>
                        Modules loaded
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-0 w-5 border-t border-dashed border-amber-400"/>
                        Suggested cap ({MODULE_LIMIT_PER_SPECIALIZATION})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded border border-indigo-400 bg-transparent"/>
                        Selected
                      </span>
                    </div>
                  </div>
                );
              })()}
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
              Saved successfully. Open report page to view or download.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openTimetableReport(generatedTimetable.timetableId)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-3 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-sky-600 hover:to-blue-700"
              >
                <CalendarDays size={18} />
                View in Report Page
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTimetableAsCSV(
                    generatedTimetable.results?.hybrid?.schedule || [],
                    selectedYear,
                    selectedSemester,
                    selectedGroup,
                    selectedSubGroup
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-3 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-green-600 hover:to-emerald-700"
              >
                <FileCheck2 size={18} />
                Download as CSV
              </button>
            </div>
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
                className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md transition-all duration-300"
              >
                <div className="border-b-2 border-slate-300 bg-slate-100/50 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">ID: {String(t.id ?? '').slice(0, 8)}...</p>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-full bg-sky-200 px-3 py-1 text-xs font-bold text-sky-800">
                      Saved Timetable
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openTimetableReport(t.id)}
                      className="flex-1 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-sky-600 hover:to-blue-700"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const schedule = parseTimetableSchedule(t);
                        downloadTimetableAsCSV(
                          schedule,
                          t.year || selectedYear,
                          t.semester || selectedSemester,
                          t.group || selectedGroup,
                          t.subgroup || selectedSubGroup
                        );
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-green-600 hover:to-emerald-700"
                    >
                      Download
                    </button>
                  </div>
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