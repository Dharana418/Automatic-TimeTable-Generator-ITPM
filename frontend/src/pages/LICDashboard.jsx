import React, { useCallback, useEffect, useState } from 'react';
import { 
  BookOpen, Link2, Trash2, Pencil, Save, X, GraduationCap
} from 'lucide-react';
import schedulerApi from '../api/scheduler.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';
import '../styles/lic-dashboard.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '13:00-15:00',
  '15:00-17:00',
  '17:00-19:00',
];

const initialAssignmentForm = {
  moduleId: '',
  lecturerId: '',
  hoursPerWeek: '',
  preferredDays: [],
  preferredTimeSlots: [],
  academicYear: '1',
  semester: '1',
};

const LICDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [editingAssignmentId, setEditingAssignmentId] = useState('');

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [instructorRes, moduleRes, assignmentRes] = await Promise.all([
        schedulerApi.listItems('instructors'),
        schedulerApi.listItems('modules'),
        schedulerApi.listAssignments(),
      ]);

      setInstructors(instructorRes.items || []);
      setModules(moduleRes.items || []);
      setAssignments(assignmentRes.items || []);
    } catch (error) {
      showMessage(error.message || 'Failed to load LIC data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const validateAssignment = () => {
    if (!assignmentForm.moduleId || !assignmentForm.lecturerId) {
      return 'Module and lecturer are required.';
    }

    const parsedHours = Number(assignmentForm.hoursPerWeek);
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 22) {
      return 'Hours per week must be a whole number between 1 and 22.';
    }

    if (!assignmentForm.preferredDays.length) {
      return 'At least one preferred day must be selected.';
    }

    if (!assignmentForm.preferredTimeSlots.length) {
      return 'At least one preferred time slot is required.';
    }

    return null;
  };

  const submitAssignment = async (event) => {
    event.preventDefault();

    const validationError = validateAssignment();
    if (validationError) {
      showWarning('Validation required', validationError);
      showMessage(validationError, 'error');
      return;
    }

    const payload = {
      ...assignmentForm,
      hoursPerWeek: Number(assignmentForm.hoursPerWeek),
      preferredDays: assignmentForm.preferredDays,
      preferredTimeSlots: assignmentForm.preferredTimeSlots,
    };

    try {
      if (editingAssignmentId) {
        await schedulerApi.updateAssignment(editingAssignmentId, payload);
        showMessage('Assignment updated successfully');
        showSuccess('Assignment updated');
      } else {
        await schedulerApi.createAssignment(payload);
        showMessage('Lecturer assignment created successfully');
        showSuccess('Assignment created');
      }
      setAssignmentForm(initialAssignmentForm);
      setEditingAssignmentId('');
      await loadAll();
    } catch (error) {
      const actionLabel = editingAssignmentId ? 'Update assignment failed' : 'Create assignment failed';
      showError(actionLabel, error.message || 'Failed to save assignment');
      showMessage(error.message || 'Failed to save assignment', 'error');
    }
  };

  const startEditAssignment = (assignment) => {
    setEditingAssignmentId(String(assignment.id || ''));
    setAssignmentForm({
      moduleId: String(assignment.module_id || ''),
      lecturerId: String(assignment.lecturer_id || ''),
      hoursPerWeek: String(assignment.hours_per_week || ''),
      preferredDays: Array.isArray(assignment.preferred_days) ? assignment.preferred_days : [],
      preferredTimeSlots: String(assignment.preferred_times || '')
        .split(',')
        .map((slot) => slot.trim())
        .filter(Boolean),
      academicYear: String(assignment.academic_year || '1'),
      semester: String(assignment.semester || '1'),
    });
  };

  const cancelEditAssignment = () => {
    setEditingAssignmentId('');
    setAssignmentForm(initialAssignmentForm);
  };

  const togglePreferredDay = (day) => {
    setAssignmentForm((prev) => {
      const exists = prev.preferredDays.includes(day);
      return {
        ...prev,
        preferredDays: exists
          ? prev.preferredDays.filter((item) => item !== day)
          : [...prev.preferredDays, day],
      };
    });
  };

  const togglePreferredTimeSlot = (slot) => {
    setAssignmentForm((prev) => {
      const exists = prev.preferredTimeSlots.includes(slot);
      return {
        ...prev,
        preferredTimeSlots: exists
          ? prev.preferredTimeSlots.filter((item) => item !== slot)
          : [...prev.preferredTimeSlots, slot],
      };
    });
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
      if (String(id) === editingAssignmentId) {
        cancelEditAssignment();
      }
      showMessage('Assignment removed');
      showSuccess('Assignment removed');
      await loadAll();
    } catch (error) {
      showError('Remove assignment failed', error.message || 'Failed to remove assignment');
      showMessage(error.message || 'Failed to remove assignment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Loading LIC workspace...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1 className="lic-hero-title">
            <span className="lic-title-icon lic-title-icon-lg"><GraduationCap size={20} /></span>
            LIC Dashboard
          </h1>
          <p className="hero-sub">Welcome, {user?.name || 'LIC'}. Assign lecturers to existing modules with preferred working days and times.</p>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-value">{instructors.length}</div>
              <div className="stat-label">Available Lecturers</div>
            </div>
            <div className="stat">
              <div className="stat-value">{modules.length}</div>
              <div className="stat-label">Available Modules</div>
            </div>
            <div className="stat">
              <div className="stat-value">{assignments.length}</div>
              <div className="stat-label">My Assignments</div>
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`ac-message ${message.type === 'error' ? 'ac-message-error' : 'ac-message-success'}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-main lic-dashboard-main">
        <div className="left-col lic-left-col">
          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><Link2 size={17} /></span>
              Lecturer Assignment Management
            </h3>
            <form onSubmit={submitAssignment} className="ac-form">
              <label className="lic-field-title">Module</label>
              <select className="ac-input" value={assignmentForm.moduleId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })} required>
                <option value="">Select module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.code} - {module.name}</option>
                ))}
              </select>

              <label className="lic-field-title">Lecturer</label>
              <select className="ac-input" value={assignmentForm.lecturerId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, lecturerId: e.target.value })} required>
                <option value="">Select lecturer</option>
                {instructors.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}{lecturer.role_label ? ` (${lecturer.role_label})` : ''}
                  </option>
                ))}
              </select>

              <label className="lic-field-title">Hours Per Week (1-22)</label>
              <input
                className="ac-input"
                type="number"
                min="1"
                max="22"
                placeholder="Hours per week"
                value={assignmentForm.hoursPerWeek}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, hoursPerWeek: e.target.value })}
                required
              />

              <div className="lic-preference-section">
                <label className="lic-field-title">Preferred Days</label>
                <div className="lic-day-selector lic-days-selector">
                  {DAYS.map((day) => (
                    <label key={day} className="lic-day-checkbox">
                      <input
                        type="checkbox"
                        checked={assignmentForm.preferredDays.includes(day)}
                        onChange={() => togglePreferredDay(day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="lic-preference-section">
                <label className="lic-field-title">Preferred Time Slots</label>
                <div className="lic-day-selector lic-time-slot-selector">
                  {TIME_SLOTS.map((slot) => (
                    <label key={slot} className="lic-day-checkbox">
                      <input
                        type="checkbox"
                        checked={assignmentForm.preferredTimeSlots.includes(slot)}
                        onChange={() => togglePreferredTimeSlot(slot)}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="dashboard-btn lic-btn" type="submit">
                {editingAssignmentId ? <Save size={16} /> : <Link2 size={16} />}
                {editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}
              </button>
              {editingAssignmentId && (
                <button className="dashboard-btn lic-btn lic-btn-secondary" type="button" onClick={cancelEditAssignment}>
                  <X size={16} />
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><BookOpen size={17} /></span>
              My Lecturer Assignments
            </h3>
            <div className="ac-table-wrapper">
              <table className="ac-table">
                <thead>
                  <tr><th>Module</th><th>Lecturer</th><th>Hours</th><th>Preferred Days</th><th>Preferred Time Slots</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {assignments.length === 0 && (
                    <tr><td colSpan="6" className="ac-empty-row">No assignments yet</td></tr>
                  )}
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.module_code} - {assignment.module_name}</td>
                      <td>{assignment.lecturer_name || '-'}</td>
                      <td>{assignment.hours_per_week || '-'}</td>
                      <td>{Array.isArray(assignment.preferred_days) && assignment.preferred_days.length ? assignment.preferred_days.join(', ') : '-'}</td>
                      <td>{String(assignment.preferred_times || '').split(',').map((slot) => slot.trim()).filter(Boolean).join(', ') || '-'}</td>
                      <td>
                        <div className="lic-action-buttons">
                          <button
                            className="ac-remove-btn lic-remove-btn lic-edit-btn"
                            onClick={() => startEditAssignment(assignment)}
                            aria-label="Edit assignment"
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="ac-remove-btn lic-remove-btn"
                            onClick={() => removeAssignment(assignment.id)}
                            aria-label="Remove assignment"
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LICDashboard;
