const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'API error');
  return json;
}

export const addItem = (type, payload) => request(`/api/scheduler/${type}`, { method: 'POST', body: JSON.stringify(payload) });
export const listItems = (type) => request(`/api/scheduler/${type}`, { method: 'GET' });
export const getLicsWithInstructors = () => request(`/api/scheduler/lics-with-instructors`, { method: 'GET' });
export const listAssignments = () => request(`/api/scheduler/assignments`, { method: 'GET' });
export const createAssignment = (payload) => request(`/api/scheduler/assignments`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteAssignment = (id) => request(`/api/scheduler/assignments/${id}`, { method: 'DELETE' });
export const runScheduler = (algorithms = ['hybrid'], options = {}) => request('/api/scheduler/run', { method: 'POST', body: JSON.stringify({ algorithms, options }) });
export const resetSchedulerData = () => request('/api/scheduler/reset', { method: 'POST' });

export default {
  addItem,
  listItems,
  getLicsWithInstructors,
  listAssignments,
  createAssignment,
  deleteAssignment,
  runScheduler,
  resetSchedulerData,
};
