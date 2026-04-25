const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VALID_SEMESTERS = new Set(['1', '2']);
const VALID_BATCH_MODES = new Set(['WD', 'WE']);
const VALID_FREE_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
const VALID_SPECIALIZATIONS = new Set(['IT', 'SE', 'CS', 'ISE', 'IME', 'IM', 'CN', 'DS', 'CYBER SECURITY', 'GENERAL']);

const GENERATION_YEAR_REGEX = /^([Yy]?(?:[1-9]|1[0-2])|\d{4}-\d{4})$/;
const GENERATION_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9 _.-]{2,119}$/;
const GROUP_TOKEN_REGEX = /^\d{1,2}$/;
const BATCH_ID_REGEX = /^Y\d{1,2}\.S[12]\.(WD|WE)\.[A-Z0-9 ]+\.\d{2}\.\d{2}$/;

const normalizeText = (value = '') => String(value || '').trim();

const normalizeSpecialization = (value = '') => normalizeText(value).toUpperCase();

export const validateCoordinatorTimetableRequest = (payload = {}) => {
  const academicYear = normalizeText(payload.academicYear ?? payload.year);
  const semester = normalizeText(payload.semester);
  const specialization = normalizeSpecialization(payload.specialization);
  const batchMode = normalizeSpecialization(payload.batchMode);
  const group = normalizeText(payload.group);
  const subgroup = normalizeText(payload.subgroup);
  const timetableName = normalizeText(payload.timetableName);
  const weekdayFreeDay = normalizeText(payload.weekdayFreeDay || payload.freeDay);
  const batchId = normalizeText(payload.batchId);

  if (!academicYear) {
    throw new Error('Academic year is required');
  }
  if (!GENERATION_YEAR_REGEX.test(academicYear)) {
    throw new Error('Academic year must be a valid year level or range, such as 1, 2, 3, 4, or 2024-2025');
  }
  if (!semester) {
    throw new Error('Semester is required');
  }
  if (!VALID_SEMESTERS.has(semester)) {
    throw new Error('Semester must be 1 or 2');
  }
  if (!batchMode) {
    throw new Error('Batch mode is required');
  }
  if (!VALID_BATCH_MODES.has(batchMode)) {
    throw new Error('Batch mode must be WD or WE');
  }
  if (!specialization) {
    throw new Error('Specialization is required');
  }
  if (!VALID_SPECIALIZATIONS.has(specialization)) {
    throw new Error('Specialization is not allowed');
  }
  if (!GROUP_TOKEN_REGEX.test(group)) {
    throw new Error('Group must be a numeric value between 1 and 99');
  }
  if (!GROUP_TOKEN_REGEX.test(subgroup)) {
    throw new Error('Sub-group must be a numeric value between 1 and 99');
  }
  if (timetableName && !GENERATION_NAME_REGEX.test(timetableName)) {
    throw new Error('Schedule name must be 3-120 characters and contain only letters, numbers, spaces, dots, hyphens, or underscores');
  }
  if (weekdayFreeDay && !VALID_FREE_DAYS.has(weekdayFreeDay)) {
    throw new Error('Free day must be one of Mon, Tue, Wed, Thu, or Fri');
  }
  if (batchId && !BATCH_ID_REGEX.test(batchId)) {
    throw new Error('Batch ID must follow the format Y{year}.S{semester}.{mode}.{specialization}.{group}.{subgroup}');
  }

  return {
    academicYear,
    semester,
    specialization,
    batchMode,
    group,
    subgroup,
    timetableName,
    weekdayFreeDay,
    batchId,
  };
};

export const validateCoordinatorTimetableFilters = (filters = {}) => {
  const year = normalizeText(filters.year ?? filters.academicYear);
  const semester = normalizeText(filters.semester);
  const specialization = normalizeSpecialization(filters.specialization);
  const group = normalizeText(filters.group);
  const subgroup = normalizeText(filters.subgroup);

  if (year && !GENERATION_YEAR_REGEX.test(year)) {
    throw new Error('Year filter must be a valid year level or academic year range');
  }
  if (semester && !VALID_SEMESTERS.has(semester)) {
    throw new Error('Semester filter must be 1 or 2');
  }
  if (specialization && !VALID_SPECIALIZATIONS.has(specialization)) {
    throw new Error('Specialization filter is not allowed');
  }
  if (group && !GROUP_TOKEN_REGEX.test(group)) {
    throw new Error('Group filter must be numeric');
  }
  if (subgroup && !GROUP_TOKEN_REGEX.test(subgroup)) {
    throw new Error('Sub-group filter must be numeric');
  }

  return { year, semester, specialization, group, subgroup };
};

const validateReviewNote = (value, fieldName) => {
  const note = normalizeText(value);
  if (!note) return null;
  if (note.length < 5 || note.length > 500) {
    throw new Error(`${fieldName} must be between 5 and 500 characters`);
  }
  return note;
};

/**
 * Generic fetch helper for API calls
 */
const fetchFromAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

/**
 * Generate timetable for a specific academic year and semester
 * @param {string} academicYear - Academic year (e.g., "2024-2025")
 * @param {string} semester - Semester (e.g., "1", "2")
 * @param {object} options - Generation options
 * @returns {Promise} Generated timetable response
 */
export const generateTimetableForYearSemester = async (
  academicYear,
  semester,
  options = {}
) => {
  try {
    const {
      algorithms = ['hybrid'],
      timetableName = null,
      ...otherOptions
    } = options;

    const validated = validateCoordinatorTimetableRequest({
      academicYear,
      semester,
      timetableName,
      ...otherOptions,
    });

    const response = await fetchFromAPI('/api/scheduler/run-for-year-semester', {
      method: 'POST',
      body: JSON.stringify({
        academicYear: validated.academicYear,
        semester: validated.semester,
        algorithms,
        timetableName: validated.timetableName || `Timetable_${validated.academicYear}_Semester${validated.semester}`,
        options: otherOptions,
      }),
    });

    return response.data || response;
  } catch (error) {
    console.error(
      `Error generating timetable for ${academicYear}, semester ${semester}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all timetables
 * @returns {Promise} Array of timetables
 */
export const getAllTimetables = async () => {
  try {
    const response = await fetchFromAPI('/api/academic-coordinator/timetables');
    return {
      data: response.data || [],
    };
  } catch (error) {
    console.error('Error fetching timetables:', error);
    throw error;
  }
};

/**
 * Get timetables for a specific year and semester
 * @param {string} year - Academic year
 * @param {string} semester - Semester
 * @returns {Promise} Filtered timetables
 */
export const getTimetablesForYearSemester = async (year, semester, filters = {}) => {
  try {
    validateCoordinatorTimetableFilters({ year, semester, ...filters });

    const params = new URLSearchParams({
      year: String(year),
      semester: String(semester),
    });

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });

    const response = await fetchFromAPI(`/api/academic-coordinator/timetables?${params.toString()}`);
    const timetables = response.data || [];

    return {
      data: timetables,
      total: timetables.length,
      year,
      semester,
    };
  } catch (error) {
    console.error('Error fetching timetables for year/semester:', error);
    throw error;
  }
};

/**
 * Approve a timetable
 * @param {number} timetableId - Timetable ID
 * @returns {Promise} Updated timetable
 */
export const approveTimetable = async (timetableId) => {
  try {
    if (!Number.isInteger(Number(timetableId)) || Number(timetableId) <= 0) {
      throw new Error('Timetable ID must be a positive integer');
    }
    const response = await fetchFromAPI(`/api/academic-coordinator/timetables/${encodeURIComponent(timetableId)}/approve`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    return response.data || response;
  } catch (error) {
    console.error(`Error approving timetable ${timetableId}:`, error);
    throw error;
  }
};

/**
 * Reject a timetable with optional comments
 * @param {number} timetableId - Timetable ID
 * @param {string} comments - Optional rejection comments
 * @returns {Promise} Updated timetable
 */
export const rejectTimetable = async (timetableId, comments = '') => {
  try {
    if (!Number.isInteger(Number(timetableId)) || Number(timetableId) <= 0) {
      throw new Error('Timetable ID must be a positive integer');
    }
    const note = validateReviewNote(comments, 'Rejection note');
    const response = await fetchFromAPI(`/api/academic-coordinator/timetables/${encodeURIComponent(timetableId)}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ comments: note }),
    });
    return response.data || response;
  } catch (error) {
    console.error(`Error rejecting timetable ${timetableId}:`, error);
    throw error;
  }
};

/**
 * Get scheduling conflicts with optional resolved filter
 * @param {boolean|null} resolved - true for resolved, false for unresolved, null for all
 * @returns {Promise<{data: Array}>}
 */
export const getSchedulingConflicts = async (resolved = null) => {
  try {
    const params = new URLSearchParams();
    if (resolved === true || resolved === false) {
      params.set('resolved', String(resolved));
    }

    const query = params.toString();
    const response = await fetchFromAPI(`/api/academic-coordinator/conflicts${query ? `?${query}` : ''}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
    };
  } catch (error) {
    console.error('Error fetching scheduling conflicts:', error);
    throw error;
  }
};

/**
 * Mark a scheduling conflict as resolved
 * @param {number|string} conflictId - Conflict identifier
 * @param {string} resolutionNotes - Optional resolution details
 * @returns {Promise<object>}
 */
export const resolveSchedulingConflict = async (conflictId, resolutionNotes = '') => {
  try {
    if (!Number.isInteger(Number(conflictId)) || Number(conflictId) <= 0) {
      throw new Error('Conflict ID must be a positive integer');
    }
    const note = validateReviewNote(resolutionNotes, 'Resolution note');
    const response = await fetchFromAPI(`/api/academic-coordinator/conflicts/${encodeURIComponent(conflictId)}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution_notes: note }),
    });
    return response.data || response;
  } catch (error) {
    console.error(`Error resolving conflict ${conflictId}:`, error);
    throw error;
  }
};

/**
 * Format timetable data for display
 * @param {object} timetable - Timetable object
 * @returns {object} Formatted timetable
 */
export const formatTimetable = (timetable) => {
  if (!timetable) return null;

  const timetableScope = timetable.data?.scope || timetable.data?.timetableScope || {};
  const groupedScheduleCount = Array.isArray(timetable.data?.groupedSchedules)
    ? timetable.data.groupedSchedules.reduce((total, group) => total + (Array.isArray(group?.entries) ? group.entries.length : 0), 0)
    : 0;

  return {
    id: timetable.id,
    name: timetable.name || 'Unnamed',
    year: timetable.year || 'N/A',
    semester: timetable.semester || 'N/A',
    specialization: timetableScope.specialization || timetable.data?.specialization || 'N/A',
    group: timetableScope.group || timetable.data?.group || 'N/A',
    subgroup: timetableScope.subgroup || timetable.data?.subgroup || 'N/A',
    status: timetable.status || 'pending',
    created_at: timetable.created_at
      ? new Date(timetable.created_at).toLocaleDateString()
      : 'N/A',
    schedule_count: timetable.data?.schedule?.length || groupedScheduleCount || 0,
  };
};

/**
 * Get available algorithms for scheduling
 * @returns {array} Array of algorithm options
 */
export const getAvailableAlgorithms = () => {
  return [
    { value: 'hybrid', label: 'Hybrid (Legacy)', description: 'Combines multiple algorithms' },
    { value: 'pso', label: 'Particle Swarm Optimization', description: 'PSO algorithm' },
    { value: 'genetic', label: 'Genetic Algorithm', description: 'GA approach' },
    { value: 'ant', label: 'Ant Colony', description: 'Ant colony optimization' },
    { value: 'tabu', label: 'Tabu Search', description: 'Tabu search algorithm' },
  ];
};

/**
 * Export timetable schedule to CSV
 * @param {array} schedule - Schedule array from timetable data
 * @param {string} year - Academic year
 * @param {string} semester - Semester
 * @returns {string} CSV formatted data
 */
export const exportTimetableToCSV = (schedule) => {
  if (!schedule || schedule.length === 0) {
    return 'No schedule data to export';
  }

  let csv = 'Module,Hall,Day,Start Time,End Time,Lecturer,Batch,Duration\n';

  schedule.forEach((entry) => {
    csv += `"${entry.moduleId || ''}","${entry.hallId || ''}","${entry.day || ''}","${entry.startTime || ''}","${entry.endTime || ''}","${entry.lecturer || ''}","${entry.batch || ''}","${entry.duration || ''}"\n`;
  });

  return csv;
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const parseGroupIdentity = (batchKey = '') => {
  const tokens = String(batchKey || '').trim().split('.');
  if (tokens.length >= 6) {
    return {
      groupKey: tokens.slice(0, 5).join('.'),
      subgroup: tokens[5],
    };
  }

  if (tokens.length >= 5) {
    return {
      groupKey: tokens.slice(0, 5).join('.'),
      subgroup: '',
    };
  }

  return {
    groupKey: String(batchKey || 'UNASSIGNED'),
    subgroup: '',
  };
};

const extractEntryGroupRecords = (entry = {}) => {
  const rawBatchKeys = [];

  if (Array.isArray(entry.batchKeys) && entry.batchKeys.length) {
    rawBatchKeys.push(...entry.batchKeys);
  } else if (entry.batchKey) {
    rawBatchKeys.push(entry.batchKey);
  } else if (entry.batch) {
    rawBatchKeys.push(entry.batch);
  }

  if (!rawBatchKeys.length) {
    return [{ groupKey: 'UNASSIGNED', subgroup: '' }];
  }

  const deduped = new Map();
  rawBatchKeys.forEach((key) => {
    const identity = parseGroupIdentity(key);
    if (!deduped.has(identity.groupKey)) {
      deduped.set(identity.groupKey, new Set());
    }
    if (identity.subgroup) {
      deduped.get(identity.groupKey).add(identity.subgroup);
    }
  });

  return Array.from(deduped.entries()).map(([groupKey, subgroupSet]) => ({
    groupKey,
    subgroups: Array.from(subgroupSet).sort((a, b) => a.localeCompare(b)),
  }));
};

/**
 * Download timetable as CSV
 * @param {array} schedule - Schedule array
 * @param {string} year - Academic year
 * @param {string} semester - Semester
 */
export const downloadTimetableAsCSV = (schedule, year, semester, group = '', subgroup = '') => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    const csv = exportTimetableToCSV(schedule);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const scopeSuffix = [group, subgroup].filter(Boolean).join('_');

    link.setAttribute('href', url);
    link.setAttribute('download', `timetable_${year}_sem${semester}${scopeSuffix ? `_${scopeSuffix}` : ''}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const groupedEntries = new Map();

  schedule.forEach((entry) => {
    const groupRecords = extractEntryGroupRecords(entry);
    groupRecords.forEach((record) => {
      if (!groupedEntries.has(record.groupKey)) {
        groupedEntries.set(record.groupKey, {
          rows: [],
          subgroupSet: new Set(),
        });
      }

      record.subgroups.forEach((subgroup) => groupedEntries.get(record.groupKey).subgroupSet.add(subgroup));
      groupedEntries.get(record.groupKey).rows.push(entry);
    });
  });

  groupedEntries.forEach((groupData, groupKey) => {
    let csv = 'Module,Hall,Day,Start Time,End Time,Lecturer,Group,Subgroups,Duration\n';

    const subgroupLabel = Array.from(groupData.subgroupSet).sort((a, b) => a.localeCompare(b)).join('|');

    groupData.rows.forEach((entry) => {
      const startTime = entry.startTime || String(entry.slot || '').split('-')[0] || '';
      const endTime = entry.endTime || String(entry.slot || '').split('-')[1] || '';
      const duration = entry.duration || entry.durationSlots || '';

      csv += [
        escapeCsv(entry.moduleName || entry.moduleId || ''),
        escapeCsv(entry.hallName || entry.hallId || ''),
        escapeCsv(entry.day || ''),
        escapeCsv(startTime),
        escapeCsv(endTime),
        escapeCsv(entry.instructorName || entry.lecturer || entry.instructorId || ''),
        escapeCsv(groupKey),
        escapeCsv(subgroupLabel),
        escapeCsv(duration),
      ].join(',') + '\n';
    });

    const safeGroupKey = String(groupKey || 'UNASSIGNED').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    const scopeSuffix = [group, subgroup].filter(Boolean).join('_');
    link.setAttribute('download', `timetable_${year}_sem${semester}${scopeSuffix ? `_${scopeSuffix}` : ''}_${safeGroupKey}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};
