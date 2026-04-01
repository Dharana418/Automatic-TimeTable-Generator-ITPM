import api from './scheduler.js';

/**
 * Get all academic years with module counts
 * @returns {Promise} Array of academic years with module counts
 */
export const getAcademicYears = async () => {
  try {
    const response = await api.get('/academic-coordinator/modules/years');
    return response.data;
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

/**
 * Get modules for a specific academic year
 * @param {string} academicYear - Academic year (e.g., "2024-2025")
 * @param {string} semester - Optional semester filter (e.g., "1", "2")
 * @returns {Promise} Array of modules for the year
 */
export const getModulesByYear = async (academicYear, semester = null) => {
  try {
    const params = new URLSearchParams();
    if (semester) {
      params.append('semester', semester);
    }
    
    const response = await api.get(
      `/academic-coordinator/modules/year/${academicYear}${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching modules for year ${academicYear}:`, error);
    throw error;
  }
};

/**
 * Add a new module for a specific academic year
 * Requires: Academic Coordinator role
 * @param {string} academicYear - Academic year
 * @param {Object} moduleData - Module details (code, name, credits, etc.)
 * @returns {Promise} Created module data
 */
export const addModuleForYear = async (academicYear, moduleData) => {
  try {
    const response = await api.post(
      `/academic-coordinator/modules/year/${academicYear}`,
      moduleData
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding module for year ${academicYear}:`, error);
    throw error;
  }
};

/**
 * Update an existing module for a specific academic year
 * @param {string} academicYear - Academic year
 * @param {string} moduleId - Module ID
 * @param {Object} moduleData - Updated module data
 * @returns {Promise} Updated module data
 */
export const updateModuleForYear = async (academicYear, moduleId, moduleData) => {
  try {
    const response = await api.put(
      `/academic-coordinator/modules/year/${academicYear}/${moduleId}`,
      moduleData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error updating module ${moduleId} for year ${academicYear}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete a module for a specific academic year
 * @param {string} academicYear - Academic year
 * @param {string} moduleId - Module ID
 * @returns {Promise} Deleted module data
 */
export const deleteModuleForYear = async (academicYear, moduleId) => {
  try {
    const response = await api.delete(
      `/academic-coordinator/modules/year/${academicYear}/${moduleId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting module ${moduleId} for year ${academicYear}:`,
      error
    );
    throw error;
  }
};

/**
 * Get modules summary by year and semester
 * @returns {Promise} Summary of modules organized by year and semester
 */
export const getModulesSummaryByYearSemester = async () => {
  try {
    const response = await api.get('/academic-coordinator/modules/summary/year-semester');
    return response.data;
  } catch (error) {
    console.error('Error fetching modules summary:', error);
    throw error;
  }
};

/**
 * Format year string for display
 * @param {string} year - Raw year string (e.g., "2024-2025")
 * @returns {string} Formatted year string
 */
export const formatAcademicYear = (year) => {
  if (!year) return 'N/A';
  return `${year.replace('-', ' - ')}`;
};

/**
 * Create a batch of modules for an academic year
 * @param {string} academicYear - Academic year
 * @param {Array} modules - Array of module objects to create
 * @returns {Promise} Array of created modules
 */
export const addMultipleModulesForYear = async (academicYear, modules) => {
  try {
    const results = [];
    const errors = [];

    for (const moduleData of modules) {
      try {
        const result = await addModuleForYear(academicYear, moduleData);
        results.push(result.data);
      } catch (error) {
        errors.push({
          moduleCode: moduleData.code,
          error: error.response?.data?.error || error.message,
        });
      }
    }

    return {
      success: true,
      created: results,
      failed: errors,
      total_created: results.length,
      total_failed: errors.length,
    };
  } catch (error) {
    console.error(`Error adding multiple modules for year ${academicYear}:`, error);
    throw error;
  }
};

/**
 * Export modules for a year to CSV format
 * @param {Array} modules - Array of module objects
 * @param {string} year - Academic year for the filename
 * @returns {string} CSV formatted data
 */
export const exportModulesToCSV = (modules, year) => {
  if (!modules || modules.length === 0) {
    return 'No modules to export';
  }

  let csv = 'Code,Name,Credits,Batch Size,Lectures/Week,Semester,Day Type\n';

  modules.forEach((module) => {
    csv += `"${module.code || ''}","${module.name || ''}",${module.credits || ''},"${module.batch_size || ''}","${module.lectures_per_week || ''}","${module.semester || ''}","${module.day_type || ''}"\n`;
  });

  return csv;
};

/**
 * Download modules as CSV file
 * @param {Array} modules - Array of module objects
 * @param {string} year - Academic year for the filename
 */
export const downloadModulesAsCSV = (modules, year) => {
  const csv = exportModulesToCSV(modules, year);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `modules_${year}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
