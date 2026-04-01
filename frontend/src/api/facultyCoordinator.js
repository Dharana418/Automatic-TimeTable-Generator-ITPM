import api from './scheduler.js';

/**
 * Fetch all faculty coordinators
 * Requires: Admin or Academic Coordinator role
 * @returns {Promise} Array of faculty coordinators
 */
export const getAllFacultyCoordinators = async () => {
  try {
    const response = await api.get('/auth/faculty-coordinators');
    return response.data;
  } catch (error) {
    console.error('Error fetching faculty coordinators:', error);
    throw error;
  }
};

/**
 * Fetch a specific faculty coordinator by ID
 * @param {string} coordinatorId - The faculty coordinator's user ID
 * @returns {Promise} Faculty coordinator data
 */
export const getFacultyCoordinatorById = async (coordinatorId) => {
  try {
    const response = await api.get(`/auth/faculty-coordinators/${coordinatorId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching faculty coordinator ${coordinatorId}:`, error);
    throw error;
  }
};

/**
 * Fetch the current logged-in faculty coordinator's profile
 * @returns {Promise} Current faculty coordinator's profile
 */
export const getCurrentFacultyCoordinatorProfile = async () => {
  try {
    const response = await api.get('/auth/faculty-coordinators/profile/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current faculty coordinator profile:', error);
    throw error;
  }
};

/**
 * Format faculty coordinator data for display
 * @param {Object} coordinator - Faculty coordinator object
 * @returns {Object} Formatted coordinator data
 */
export const formatFacultyCoordinator = (coordinator) => {
  if (!coordinator) return null;

  return {
    id: coordinator.id,
    name: coordinator.name || 'N/A',
    email: coordinator.email || 'N/A',
    phone: coordinator.phonenumber || 'N/A',
    address: coordinator.address || 'N/A',
    birthday: coordinator.birthday ? new Date(coordinator.birthday).toLocaleDateString() : 'N/A',
    role: coordinator.role || 'Faculty Coordinator',
    assignedAt: coordinator.role_assigned_at ? new Date(coordinator.role_assigned_at).toLocaleDateString() : 'N/A',
    assignmentNote: coordinator.role_assignment_note || 'No note',
    createdAt: coordinator.created_at ? new Date(coordinator.created_at).toLocaleDateString() : 'N/A',
  };
};

/**
 * Transform multiple faculty coordinators for display
 * @param {Array} coordinators - Array of coordinator objects
 * @returns {Array} Formatted coordinators
 */
export const formatFacultyCoordinators = (coordinators) => {
  return coordinators.map(formatFacultyCoordinator);
};
