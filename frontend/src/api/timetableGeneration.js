const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    const response = await fetchFromAPI('/api/scheduler/run-for-year-semester', {
      method: 'POST',
      body: JSON.stringify({
        academicYear,
        semester,
        algorithms,
        timetableName: timetableName || `Timetable_${academicYear}_Semester${semester}`,
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
    const response = await fetchFromAPI('/api/scheduler/timetables');
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
export const getTimetablesForYearSemester = async (year, semester) => {
  try {
    const response = await fetchFromAPI(`/api/scheduler/timetables?year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}`);
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
    const response = await fetchFromAPI(`/api/scheduler/timetables/${encodeURIComponent(timetableId)}/approve`, {
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
    const response = await fetchFromAPI(`/api/scheduler/timetables/${encodeURIComponent(timetableId)}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ comments: comments || null }),
    });
    return response.data || response;
  } catch (error) {
    console.error(`Error rejecting timetable ${timetableId}:`, error);
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

  return {
    id: timetable.id,
    name: timetable.name || 'Unnamed',
    year: timetable.year || 'N/A',
    semester: timetable.semester || 'N/A',
    status: timetable.status || 'pending',
    created_at: timetable.created_at
      ? new Date(timetable.created_at).toLocaleDateString()
      : 'N/A',
    schedule_count: timetable.data?.schedule?.length || 0,
  };
};

/**
 * Get available algorithms for scheduling
 * @returns {array} Array of algorithm options
 */
export const getAvailableAlgorithms = () => {
  return [
    { value: 'hybrid', label: 'Hybrid (Recommended)', description: 'Combines multiple algorithms' },
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

/**
 * Download timetable as CSV
 * @param {array} schedule - Schedule array
 * @param {string} year - Academic year
 * @param {string} semester - Semester
 */
export const downloadTimetableAsCSV = (schedule, year, semester) => {
  const csv = exportTimetableToCSV(schedule);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `timetable_${year}_sem${semester}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
