import React, { useCallback, useEffect, useState } from 'react';
import { 
  Users, BookOpen, Link2, Trash2, PlusCircle,
  UserPlus, BookPlus, GraduationCap
} from 'lucide-react';
import schedulerApi from '../api/scheduler.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';

const FORBIDDEN_SPECIAL_CHARS = /[~!@#$%^&*()_+]/;

const initialInstructorForm = { name: '', email: '', department: '' };
const initialModuleForm = { code: '', name: '', credits: '', lectures_per_week: '', batch_size: '' };
const initialAssignmentForm = { moduleId: '', lecturerId: '', academicYear: '1', semester: '1' };

const LICDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [instructorForm, setInstructorForm] = useState(initialInstructorForm);
  const [moduleForm, setModuleForm] = useState(initialModuleForm);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);

  // Drag and drop state
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [draggedAssignmentData, setDraggedAssignmentData] = useState(null);

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

  const addInstructor = async (event) => {
    event.preventDefault();
    if (!instructorForm.name.trim()) {
      showWarning('Validation required', 'Instructor name is required.');
      return;
    }
    if (FORBIDDEN_SPECIAL_CHARS.test(instructorForm.name.trim()) || FORBIDDEN_SPECIAL_CHARS.test(instructorForm.department.trim())) {
      showWarning('Validation required', 'Instructor name/department cannot contain ~!@#$%^&*()_+');
      return;
    }
    if (instructorForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(instructorForm.email)) {
      showWarning('Validation required', 'Please enter a valid instructor email address.');
      return;
    }

    try {
      await schedulerApi.addItem('instructors', instructorForm);
      setInstructorForm(initialInstructorForm);
      showMessage('Instructor added under your LIC scope');
      showSuccess('Instructor added');
      await loadAll();
    } catch (error) {
      showError('Add instructor failed', error.message || 'Failed to add instructor');
      showMessage(error.message || 'Failed to add instructor', 'error');
    }
  };

  const addModule = async (event) => {
    event.preventDefault();
    if (!moduleForm.code.trim() || !moduleForm.name.trim()) {
      showWarning('Validation required', 'Module code and module name are required.');
      return;
    }
    if (FORBIDDEN_SPECIAL_CHARS.test(moduleForm.code.trim()) || FORBIDDEN_SPECIAL_CHARS.test(moduleForm.name.trim())) {
      showWarning('Validation required', 'Module code/name cannot contain ~!@#$%^&*()_+');
      return;
    }

    try {
      await schedulerApi.addItem('modules', moduleForm);
      setModuleForm(initialModuleForm);
      showMessage('Module added under your LIC scope');
      showSuccess('Module added');
      await loadAll();
    } catch (error) {
      showError('Add module failed', error.message || 'Failed to add module');
      showMessage(error.message || 'Failed to add module', 'error');
    }
  };

  const addAssignment = async (event) => {
    event.preventDefault();
    if (!assignmentForm.moduleId || !assignmentForm.lecturerId) {
      showWarning('Validation required', 'Module and instructor are required.');
      showMessage('Module and instructor are required', 'error');
      return;
    }

    try {
      await schedulerApi.createAssignment(assignmentForm);
      setAssignmentForm(initialAssignmentForm);
      showMessage('Instructor linked to module successfully');
      showSuccess('Assignment created');
      await loadAll();
    } catch (error) {
      showError('Create assignment failed', error.message || 'Failed to create assignment');
      showMessage(error.message || 'Failed to create assignment', 'error');
    }
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
      showMessage('Assignment removed');
      showSuccess('Assignment removed');
      await loadAll();
    } catch (error) {
      showError('Remove assignment failed', error.message || 'Failed to remove assignment');
      showMessage(error.message || 'Failed to remove assignment', 'error');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, assignment) => {
    setDraggedAssignmentId(assignment.id);
    setDraggedAssignmentData(assignment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('assignmentId', assignment.id);
  };

  const handleDragOver = (e, targetAssignmentId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetAssignmentId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e, targetAssignment) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedAssignmentData || draggedAssignmentData.id === targetAssignment.id) {
      setDraggedAssignmentId(null);
      setDraggedAssignmentData(null);
      setDragOverId(null);
      return;
    }

    // Reorder assignments by swapping
    const draggedIndex = assignments.findIndex((a) => a.id === draggedAssignmentData.id);
    const targetIndex = assignments.findIndex((a) => a.id === targetAssignment.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newAssignments = [...assignments];
      [newAssignments[draggedIndex], newAssignments[targetIndex]] = [
        newAssignments[targetIndex],
        newAssignments[draggedIndex],
      ];
      setAssignments(newAssignments);
      showSuccess('Assignments reordered');
    }

    setDraggedAssignmentId(null);
    setDraggedAssignmentData(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedAssignmentId(null);
    setDraggedAssignmentData(null);
    setDragOverId(null);
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
          <p className="hero-sub">Welcome, {user?.name || 'LIC'}. Add and manage instructors/modules under your scope.</p>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-value">{instructors.length}</div>
              <div className="stat-label">My Instructors/Lectures</div>
            </div>
            <div className="stat">
              <div className="stat-value">{modules.length}</div>
              <div className="stat-label">My Modules</div>
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

      <div className="dashboard-main">
        <div className="left-col">
          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><UserPlus size={17} /></span>
              Add Instructor (Under You)
            </h3>
            <form onSubmit={addInstructor} className="ac-form">
              <input className="ac-input" required placeholder="Instructor name" value={instructorForm.name}
                onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })} />
              <input className="ac-input" placeholder="Instructor email" value={instructorForm.email}
                onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })} />
              <input className="ac-input" placeholder="Department" value={instructorForm.department}
                onChange={(e) => setInstructorForm({ ...instructorForm, department: e.target.value })} />
              <button className="dashboard-btn lic-btn" type="submit">
                <PlusCircle size={16} />
                Add Instructor
              </button>
            </form>
          </div>

          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><BookPlus size={17} /></span>
              Add Module (Under You)
            </h3>
            <form onSubmit={addModule} className="ac-form">
              <input className="ac-input" required placeholder="Module code" value={moduleForm.code}
                onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })} />
              <input className="ac-input" required placeholder="Module name" value={moduleForm.name}
                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} />
              <input className="ac-input" placeholder="Credits" value={moduleForm.credits}
                onChange={(e) => setModuleForm({ ...moduleForm, credits: e.target.value })} />
              <input className="ac-input" placeholder="Lectures per week" value={moduleForm.lectures_per_week}
                onChange={(e) => setModuleForm({ ...moduleForm, lectures_per_week: e.target.value })} />
              <button className="dashboard-btn lic-btn" type="submit">
                <PlusCircle size={16} />
                Add Module
              </button>
            </form>
          </div>

          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><Link2 size={17} /></span>
              Link Instructor to Module
            </h3>
            <form onSubmit={addAssignment} className="ac-form">
              <select className="ac-input" value={assignmentForm.moduleId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })} required>
                <option value="">Select module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.code} - {module.name}</option>
                ))}
              </select>
              <select className="ac-input" value={assignmentForm.lecturerId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, lecturerId: e.target.value })} required>
                <option value="">Select instructor</option>
                {instructors.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                ))}
              </select>
              <select className="ac-input" value={assignmentForm.academicYear}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, academicYear: e.target.value })}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <select className="ac-input" value={assignmentForm.semester}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: e.target.value })}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <button className="dashboard-btn lic-btn" type="submit">
                <Link2 size={16} />
                Create Assignment
              </button>
            </form>
          </div>
        </div>

        <div className="right-col">
          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><Users size={17} /></span>
              My Instructors
            </h3>
            <div className="ac-table-wrapper">
              <table className="ac-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Department</th></tr>
                </thead>
                <tbody>
                  {instructors.length === 0 && (
                    <tr><td colSpan="3" className="ac-empty-row">No instructors added yet</td></tr>
                  )}
                  {instructors.map((lecturer) => (
                    <tr key={lecturer.id}>
                      <td>{lecturer.name}</td>
                      <td>{lecturer.email || '-'}</td>
                      <td>{lecturer.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h3 className="lic-panel-title">
              <span className="lic-title-icon"><BookOpen size={17} /></span>
              My Module Assignments
            </h3>
            <div className="ac-table-wrapper">
              <table className="ac-table">
                <thead>
                  <tr><th>Module</th><th>Instructor</th><th>Year/Sem</th><th /></tr>
                </thead>
                <tbody>
                  {assignments.length === 0 && (
                    <tr><td colSpan="4" className="ac-empty-row">No assignments yet</td></tr>
                  )}
                  {assignments.map((assignment) => (
                    <tr 
                      key={assignment.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, assignment)}
                      onDragOver={(e) => handleDragOver(e, assignment.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, assignment)}
                      onDragEnd={handleDragEnd}
                      className={`assignment-row ${draggedAssignmentId === assignment.id ? 'dragging' : ''} ${dragOverId === assignment.id ? 'drag-over' : ''}`}
                      style={{
                        opacity: draggedAssignmentId === assignment.id ? 0.5 : 1,
                        backgroundColor: dragOverId === assignment.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        cursor: 'move',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <td>{assignment.module_code} - {assignment.module_name}</td>
                      <td>{assignment.lecturer_name || '-'}</td>
                      <td>Y{assignment.academic_year}/S{assignment.semester || '-'}</td>
                      <td>
                        <button
                          className="ac-remove-btn lic-remove-btn"
                          onClick={() => removeAssignment(assignment.id)}
                          aria-label="Remove assignment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
              💡 Tip: Drag assignments to reorder them
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LICDashboard;
