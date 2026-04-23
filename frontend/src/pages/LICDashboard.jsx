import React, { useCallback, useEffect, useState } from 'react';
import { 
  BookOpen, Link2, Trash2, Pencil, Save, X, GraduationCap, Menu
} from 'lucide-react';
import schedulerApi from '../api/scheduler.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';
import '../styles/lic-dashboard.css';
import licBackgroundImage from '../assets/SLIIT-Building.jpg';

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
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draggedLecturer, setDraggedLecturer] = useState(null);
  const [dragHoverModuleId, setDragHoverModuleId] = useState('');
  const [dragAssignmentForm, setDragAssignmentForm] = useState(null);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

  const licBackgroundStyle = {
    backgroundImage: `linear-gradient(rgba(9, 17, 32, 0.58), rgba(9, 17, 32, 0.72)), url(${licBackgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
  };

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

  const validateAssignment = (formData = assignmentForm) => {
    if (!formData.moduleId || !formData.lecturerId) {
      return 'Module and lecturer are required.';
    }

    const parsedHours = Number(formData.hoursPerWeek);
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 22) {
      return 'Hours per week must be a whole number between 1 and 22.';
    }

    if (!formData.preferredDays.length) {
      return 'At least one preferred day must be selected.';
    }

    if (!formData.preferredTimeSlots.length) {
      return 'At least one preferred time slot is required.';
    }

    return null;
  };

  const buildAssignmentPayload = (formData) => ({
    ...formData,
    hoursPerWeek: Number(formData.hoursPerWeek),
    preferredDays: formData.preferredDays,
    preferredTimeSlots: formData.preferredTimeSlots,
  });

  const saveAssignment = async ({
    formData,
    assignmentId = '',
    successMessage,
    successTitle,
    errorTitle,
    resetForm,
  }) => {
    const validationError = validateAssignment(formData);
    if (validationError) {
      showWarning('Validation required', validationError);
      showMessage(validationError, 'error');
      return false;
    }

    const duplicateAssignment = assignments.find((assignment) => (
      String(assignment.id) !== String(assignmentId || '')
      && String(assignment.module_id) === String(formData.moduleId)
      && String(assignment.lecturer_id) === String(formData.lecturerId)
    ));

    if (duplicateAssignment) {
      const duplicateMessage = 'This lecturer is already assigned to that module.';
      showWarning('Duplicate assignment', duplicateMessage);
      showMessage(duplicateMessage, 'error');
      return false;
    }

    try {
      if (assignmentId) {
        await schedulerApi.updateAssignment(assignmentId, buildAssignmentPayload(formData));
      } else {
        await schedulerApi.createAssignment(buildAssignmentPayload(formData));
      }

      if (typeof resetForm === 'function') {
        resetForm();
      }

      showMessage(successMessage);
      showSuccess(successTitle);
      await loadAll();
      return true;
    } catch (error) {
      showError(errorTitle, error.message || 'Failed to save assignment');
      showMessage(error.message || 'Failed to save assignment', 'error');
      return false;
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();

    await saveAssignment({
      formData: assignmentForm,
      assignmentId: editingAssignmentId,
      successMessage: editingAssignmentId ? 'Assignment updated successfully' : 'Lecturer assignment created successfully',
      successTitle: editingAssignmentId ? 'Assignment updated' : 'Assignment created',
      errorTitle: editingAssignmentId ? 'Update assignment failed' : 'Create assignment failed',
      resetForm: () => {
        setAssignmentForm(initialAssignmentForm);
        setEditingAssignmentId('');
      },
    });
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

  const resetManualForm = () => {
    cancelEditAssignment();
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

  const toggleDragPreferredDay = (day) => {
    setDragAssignmentForm((prev) => {
      if (!prev) return prev;
      const exists = prev.preferredDays.includes(day);
      return {
        ...prev,
        preferredDays: exists
          ? prev.preferredDays.filter((item) => item !== day)
          : [...prev.preferredDays, day],
      };
    });
  };

  const toggleDragPreferredTimeSlot = (slot) => {
    setDragAssignmentForm((prev) => {
      if (!prev) return prev;
      const exists = prev.preferredTimeSlots.includes(slot);
      return {
        ...prev,
        preferredTimeSlots: exists
          ? prev.preferredTimeSlots.filter((item) => item !== slot)
          : [...prev.preferredTimeSlots, slot],
      };
    });
  };

  const closeDragAssignmentModal = () => {
    setDragAssignmentForm(null);
    setDraggedLecturer(null);
    setDragHoverModuleId('');
  };

  const openDragAssignmentModal = (module, lecturer) => {
    setDragAssignmentForm({
      ...initialAssignmentForm,
      moduleId: String(module.id || ''),
      lecturerId: String(lecturer.id || ''),
      academicYear: String(module.academic_year || '1'),
      semester: String(module.semester || '1'),
    });
  };

  const handleLecturerDragStart = (event, lecturer) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(lecturer.id));
    setDraggedLecturer(lecturer);
  };

  const handleModuleDrop = (event, module) => {
    event.preventDefault();

    const lecturerId = event.dataTransfer.getData('text/plain') || String(draggedLecturer?.id || '');
    const lecturer = instructors.find((item) => String(item.id) === lecturerId);

    setDragHoverModuleId('');

    if (!lecturer) {
      showWarning('Lecturer missing', 'Select and drag a lecturer card first.');
      return;
    }

    openDragAssignmentModal(module, lecturer);
    setDraggedLecturer(null);
  };

  const submitDragAssignment = async (event) => {
    event.preventDefault();
    if (!dragAssignmentForm) return;

    await saveAssignment({
      formData: dragAssignmentForm,
      successMessage: 'Drag and drop assignment created successfully',
      successTitle: 'Assignment created',
      errorTitle: 'Create assignment failed',
      resetForm: () => {
        closeDragAssignmentModal();
        setActiveView('dashboard');
      },
    });
  };

  const selectedDragModule = dragAssignmentForm
    ? modules.find((module) => String(module.id) === dragAssignmentForm.moduleId)
    : null;
  const selectedDragLecturer = dragAssignmentForm
    ? instructors.find((lecturer) => String(lecturer.id) === dragAssignmentForm.lecturerId)
    : null;
  const filteredInstructors = instructors.filter((lecturer) => {
    const searchValue = lecturerSearch.trim().toLowerCase();
    if (!searchValue) return true;

    return [lecturer.name, lecturer.role_label]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });
  const filteredModules = modules.filter((module) => {
    const searchValue = moduleSearch.trim().toLowerCase();
    if (!searchValue) return true;

    return [module.code, module.name, module.academic_year, module.semester]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });
  const assignmentCountByModule = assignments.reduce((accumulator, assignment) => {
    const moduleId = String(assignment.module_id || '');
    if (!moduleId) return accumulator;

    return {
      ...accumulator,
      [moduleId]: (accumulator[moduleId] || 0) + 1,
    };
  }, {});
  const heroDescription = activeView === 'dragdrop'
    ? 'Drag a lecturer card onto a module card, then complete the same assignment preferences in a quick popup form.'
    : `Welcome, ${user?.name || 'LIC'}. Assign lecturers to existing modules with preferred working days and times.`;

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
    <div className="dashboard-container lic-dashboard-shell" style={licBackgroundStyle}>
      <div
        className={`lic-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`lic-sidebar ${sidebarOpen ? 'is-open' : 'is-closed'}`}>
        <div className="lic-sidebar-header">
          <div>
            <div className="lic-sidebar-kicker">LIC Workspace</div>
            <div className="lic-sidebar-name">Lecturer Allocation</div>
          </div>
        </div>

        <nav className="lic-sidebar-nav" aria-label="LIC navigation">
          <button
            type="button"
            className={`lic-sidebar-link ${activeView === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveView('dashboard');
              setSidebarOpen(false);
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`lic-sidebar-link ${activeView === 'dragdrop' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveView('dragdrop');
              setSidebarOpen(false);
            }}
          >
            Drag and Drop Allocation
          </button>
        </nav>
      </aside>

      <div className="lic-workspace">
        <div className="lic-topbar">
          <button
            type="button"
            className="lic-menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu size={18} />
          </button>
          <div className="lic-topbar-copy">
            <div className="lic-topbar-title">
              {activeView === 'dragdrop' ? 'Drag and Drop Assignment Allocation' : 'LIC Dashboard'}
            </div>
            <div className="lic-topbar-subtitle">
              {activeView === 'dragdrop' ? 'Build assignments by dragging lecturers into module cards.' : 'Manage lecturer assignments and review current allocations.'}
            </div>
          </div>
        </div>

        <div className="dashboard-hero lic-hero-card">
          <div className="hero-left">
            <h1 className="lic-hero-title">
              <span className="lic-title-icon lic-title-icon-lg"><GraduationCap size={20} /></span>
              {activeView === 'dragdrop' ? 'Drag and Drop Allocation' : 'LIC Dashboard'}
            </h1>
            <p className="hero-sub">{heroDescription}</p>
            <div className="stat-row lic-stat-row">
              <div className="stat lic-stat-card lic-stat-card-lecturers">
                <div className="stat-value">{instructors.length}</div>
                <div className="stat-label">Available Lecturers</div>
              </div>
              <div className="stat lic-stat-card lic-stat-card-modules">
                <div className="stat-value">{modules.length}</div>
                <div className="stat-label">Available Modules</div>
              </div>
              <div className="stat lic-stat-card lic-stat-card-assignments">
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

        {activeView === 'dashboard' ? (
          <div className="dashboard-main lic-dashboard-main">
            <div className="left-col lic-left-col">
              <div className="panel lic-panel-card lic-panel-form">
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
                  <div className="lic-form-actions">
                    <button className="dashboard-btn lic-btn lic-btn-sm" type="submit">
                      {editingAssignmentId ? <Save size={15} /> : <Link2 size={15} />}
                      {editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}
                    </button>
                    <button className="dashboard-btn lic-btn lic-btn-secondary lic-btn-sm" type="button" onClick={resetManualForm}>
                      <X size={15} />
                      Reset Form
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel lic-panel-card lic-panel-table">
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
        ) : (
          <div className="lic-dnd-layout">
            <div className="panel lic-panel-card lic-dnd-panel">
              <h3 className="lic-panel-title">
                <span className="lic-title-icon"><GraduationCap size={17} /></span>
                Drag Lecturers
              </h3>
              <p className="lic-panel-note">Pick a lecturer card from this scrollable list and drag it into a module card.</p>
              <div className="lic-search-box">
                <input
                  type="text"
                  className="ac-input lic-search-input"
                  placeholder="Search lecturers by name or role"
                  value={lecturerSearch}
                  onChange={(event) => setLecturerSearch(event.target.value)}
                />
              </div>
              <div className="lic-dnd-scroll">
                {filteredInstructors.length === 0 && (
                  <div className="lic-empty-search">No lecturers match this search.</div>
                )}
                {filteredInstructors.map((lecturer) => (
                  <button
                    key={lecturer.id}
                    type="button"
                    draggable
                    onDragStart={(event) => handleLecturerDragStart(event, lecturer)}
                    onDragEnd={() => {
                      setDraggedLecturer(null);
                      setDragHoverModuleId('');
                    }}
                    className={`lic-dnd-card ${String(draggedLecturer?.id || '') === String(lecturer.id) ? 'is-dragging' : ''}`}
                  >
                    <span className="lic-dnd-card-title">{lecturer.name}</span>
                    <span className="lic-dnd-card-subtitle">{lecturer.role_label || 'Lecturer'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel lic-panel-card lic-dnd-panel">
              <h3 className="lic-panel-title">
                <span className="lic-title-icon"><BookOpen size={17} /></span>
                Drop Into Modules
              </h3>
              <p className="lic-panel-note">Each module card accepts a lecturer drop. After drop, complete hours, preferred days, and preferred time slots in the popup.</p>
              <div className="lic-search-box">
                <input
                  type="text"
                  className="ac-input lic-search-input"
                  placeholder="Search modules by code, name, year, or semester"
                  value={moduleSearch}
                  onChange={(event) => setModuleSearch(event.target.value)}
                />
              </div>
              <div className="lic-dnd-scroll">
                {filteredModules.length === 0 && (
                  <div className="lic-empty-search">No modules match this search.</div>
                )}
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className={`lic-drop-card ${dragHoverModuleId === String(module.id) ? 'is-over' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragHoverModuleId(String(module.id));
                    }}
                    onDragLeave={() => {
                      if (dragHoverModuleId === String(module.id)) {
                        setDragHoverModuleId('');
                      }
                    }}
                    onDrop={(event) => handleModuleDrop(event, module)}
                  >
                    <div className="lic-drop-card-header">
                      <div className="lic-drop-card-code">{module.code}</div>
                      <div className="lic-drop-card-badges">
                        {Boolean(assignmentCountByModule[String(module.id)]) && (
                          <div className="lic-drop-card-badge lic-drop-card-badge-assigned">
                            {assignmentCountByModule[String(module.id)]} assigned
                          </div>
                        )}
                        <div className="lic-drop-card-badge">Drop lecturer here</div>
                      </div>
                    </div>
                    <div className="lic-drop-card-name">{module.name}</div>
                    <div className="lic-drop-card-meta">
                      Year {module.academic_year || '-'} | Semester {module.semester || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {dragAssignmentForm && (
        <div className="lic-modal-backdrop" onClick={closeDragAssignmentModal}>
          <div className="lic-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="lic-modal-header">
              <div>
                <div className="lic-modal-kicker">Drag and Drop Allocation</div>
                <h3 className="lic-modal-title">Complete Lecturer Assignment</h3>
              </div>
              <button type="button" className="lic-modal-close" onClick={closeDragAssignmentModal} aria-label="Close popup">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitDragAssignment} className="ac-form lic-modal-form">
              <label className="lic-field-title">Module</label>
              <div className="lic-static-field">
                {selectedDragModule ? `${selectedDragModule.code} - ${selectedDragModule.name}` : 'Selected module'}
              </div>

              <label className="lic-field-title">Lecturer</label>
              <div className="lic-static-field">
                {selectedDragLecturer
                  ? `${selectedDragLecturer.name}${selectedDragLecturer.role_label ? ` (${selectedDragLecturer.role_label})` : ''}`
                  : 'Selected lecturer'}
              </div>

              <label className="lic-field-title">Hours Per Week (1-22)</label>
              <input
                className="ac-input"
                type="number"
                min="1"
                max="22"
                placeholder="Hours per week"
                value={dragAssignmentForm.hoursPerWeek}
                onChange={(event) => setDragAssignmentForm({ ...dragAssignmentForm, hoursPerWeek: event.target.value })}
                required
              />

              <div className="lic-preference-section">
                <label className="lic-field-title">Preferred Days</label>
                <div className="lic-day-selector lic-days-selector">
                  {DAYS.map((day) => (
                    <label key={day} className="lic-day-checkbox">
                      <input
                        type="checkbox"
                        checked={dragAssignmentForm.preferredDays.includes(day)}
                        onChange={() => toggleDragPreferredDay(day)}
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
                        checked={dragAssignmentForm.preferredTimeSlots.includes(slot)}
                        onChange={() => toggleDragPreferredTimeSlot(slot)}
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="lic-modal-actions">
                <button className="dashboard-btn lic-btn" type="submit">
                  <Save size={16} />
                  Save Assignment
                </button>
                <button className="dashboard-btn lic-btn lic-btn-secondary" type="button" onClick={closeDragAssignmentModal}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LICDashboard;
