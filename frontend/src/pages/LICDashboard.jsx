import React, { useCallback, useEffect, useState } from 'react';
import { 
  Users, BookOpen, Link2, Trash2, PlusCircle,
  LayoutDashboard, Calendar,
  Settings, LogOut, GraduationCap,
  Search, Bell, User as UserIcon
} from 'lucide-react';
import schedulerApi from '../api/scheduler.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';

const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070';
const DEPARTMENT_OPTIONS = [
  'Computer Systems and Network Engineering',
  'Information Technology',
  'Software Engineering',
  'Interactive Multimedia',
  'Cyber Security',
  'Data Science',
  'Information Systems Engineering',
];

const LICDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('1');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [dragInstructorId, setDragInstructorId] = useState(null);
  const [hoveredModuleId, setHoveredModuleId] = useState(null);
  const [savingDrop, setSavingDrop] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [addingInstructor, setAddingInstructor] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ name: '', email: '', department: '' });
  const [assignmentForm, setAssignmentForm] = useState({ moduleId: '', lecturerId: '', academicYear: '1', semester: '1' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, modRes, asgnRes] = await Promise.all([
        schedulerApi.listItems('instructors'),
        schedulerApi.listItems('modules'),
        schedulerApi.listAssignments(),
      ]);
      setInstructors(instRes.items || []);
      setModules(modRes.items || []);
      setAssignments(asgnRes.items || []);
    } catch {
      showError('Sync Error', 'Could not refresh dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const scopedAssignments = assignments.filter(
    (item) =>
      String(item.academic_year) === String(selectedAcademicYear) &&
      String(item.semester || '') === String(selectedSemester)
  );

  const getAssignmentForModule = (moduleId) =>
    scopedAssignments.find((item) => String(item.module_id) === String(moduleId));

  const resolveLicId = () => {
    const moduleLic = modules.find((moduleItem) => moduleItem?.lic_id)?.lic_id;
    const assignmentLic = assignments.find((item) => item?.lic_id)?.lic_id;
    return moduleLic || assignmentLic || null;
  };

  const handleQuickAssignSubmit = async (event) => {
    event.preventDefault();

    if (!assignmentForm.moduleId || !assignmentForm.lecturerId || !assignmentForm.academicYear) {
      showWarning('Missing Fields', 'Please select module, lecturer, and academic year.');
      return;
    }

    const existingAssignment = assignments.find(
      (item) =>
        String(item.module_id) === String(assignmentForm.moduleId) &&
        String(item.academic_year) === String(assignmentForm.academicYear) &&
        String(item.semester || '') === String(assignmentForm.semester || '')
    );

    const licId = resolveLicId();

    try {
      setSubmittingAssignment(true);

      if (existingAssignment) {
        await schedulerApi.updateAssignment(existingAssignment.id, {
          lecturerId: assignmentForm.lecturerId,
          academicYear: assignmentForm.academicYear,
          semester: assignmentForm.semester,
          ...(licId ? { licId } : {}),
        });
        showSuccess('Assignment Updated');
      } else {
        await schedulerApi.createAssignment({
          moduleId: assignmentForm.moduleId,
          lecturerId: assignmentForm.lecturerId,
          academicYear: assignmentForm.academicYear,
          semester: assignmentForm.semester,
          ...(licId ? { licId } : {}),
        });
        showSuccess('Assigned');
      }

      setAssignmentForm((previous) => ({ ...previous, moduleId: '', lecturerId: '' }));
      await loadAll();
    } catch (error) {
      showError('Assignment Failed', error.message || 'Could not save assignment.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleQuickOnboardSubmit = async () => {
    if (!instructorForm.name.trim()) {
      showWarning('Missing Name', 'Please enter instructor name.');
      return;
    }

    try {
      setAddingInstructor(true);
      await schedulerApi.addItem('instructors', {
        name: instructorForm.name.trim(),
        email: instructorForm.email.trim() || null,
        department: instructorForm.department.trim() || null,
      });
      setInstructorForm({ name: '', email: '', department: '' });
      showSuccess('Instructor Added');
      await loadAll();
    } catch (error) {
      showError('Add Staff Failed', error.message || 'Could not add instructor.');
    } finally {
      setAddingInstructor(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Assignment?',
      text: 'This assignment will be removed from the schedule.',
      confirmButtonText: 'Delete',
    });

    if (!isConfirmed) return;

    try {
      await schedulerApi.deleteAssignment(assignmentId);
      showSuccess('Assignment Deleted');
      await loadAll();
    } catch (error) {
      showError('Delete Failed', error.message || 'Could not delete assignment.');
    }
  };

  const handleDropToModule = async (moduleId) => {
    if (!dragInstructorId || savingDrop) return;

    const existingAssignment = getAssignmentForModule(moduleId);

    try {
      setSavingDrop(true);

      if (existingAssignment) {
        if (String(existingAssignment.lecturer_id) === String(dragInstructorId)) {
          showWarning('Already Assigned', 'This instructor is already assigned to the selected module.');
          return;
        }

        await schedulerApi.updateAssignment(existingAssignment.id, {
          lecturerId: dragInstructorId,
          academicYear: selectedAcademicYear,
          semester: selectedSemester,
          ...(resolveLicId() ? { licId: resolveLicId() } : {}),
        });
        showSuccess('Assignment Updated');
      } else {
        await schedulerApi.createAssignment({
          moduleId,
          lecturerId: dragInstructorId,
          academicYear: selectedAcademicYear,
          semester: selectedSemester,
          ...(resolveLicId() ? { licId: resolveLicId() } : {}),
        });
        showSuccess('Instructor Assigned');
      }

      await loadAll();
    } catch (error) {
      showError('Assignment Failed', error.message || 'Could not assign instructor.');
    } finally {
      setSavingDrop(false);
      setDragInstructorId(null);
      setHoveredModuleId(null);
    }
  };

  if (loading) return <div className="loader">Loading Academic Workspace...</div>;

  return (
    <div className="app-shell">
      <style>{`
        :root {
          --sidebar-width: 280px;
          --primary: #2563eb;
          --primary-light: #eff6ff;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --bg-soft: #f8fafc;
          --card-bg: rgba(255, 255, 255, 0.9);
          --border: #e2e8f0;
        }

        .app-shell {
          display: flex;
          min-height: 100vh;
          background: url('${BACKGROUND_IMAGE_URL}');
          background-size: cover;
          background-position: center;
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-main);
        }

        /* SIDEBAR */
        .sidebar {
          width: var(--sidebar-width);
          background: white;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 10;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 3rem;
          color: var(--primary);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: var(--text-muted);
          text-decoration: none;
          transition: 0.2s;
          margin-bottom: 4px;
          cursor: pointer;
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .nav-item:hover:not(.active) { background: #f1f5f9; color: var(--text-main); }

        /* MAIN CONTENT AREA */
        .main-content {
          flex: 1;
          background: rgba(248, 250, 252, 0.85); /* Light overlay over background */
          backdrop-filter: blur(8px);
          padding: 2rem 3rem;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-box {
          background: white;
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 300px;
        }

        .search-box input { border: none; outline: none; width: 100%; font-size: 0.9rem; }

        /* GRID LAYOUT */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }

        .panel {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04);
          margin-bottom: 2rem;
        }

        .table-modern {
          width: 100%;
          border-collapse: collapse;
        }

        .table-modern th {
          text-align: left;
          padding: 12px;
          color: var(--text-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          border-bottom: 2px solid var(--bg-soft);
        }

        .table-modern td { padding: 16px 12px; border-bottom: 1px solid var(--bg-soft); }

        /* FORM STYLES */
        .form-group { margin-bottom: 1rem; }
        .label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .input-modern {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          transition: 0.2s;
        }
        .input-modern:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

        .btn-action {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: 0.2s;
        }
        .btn-action:hover { background: #1d4ed8; }

        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: bold; }

        .drag-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 1.25rem;
        }

        .drag-column-title {
          margin: 0 0 0.8rem 0;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .drag-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 520px;
          overflow: auto;
          padding-right: 0.25rem;
        }

        .draggable-instructor {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
          cursor: grab;
          transition: 0.2s;
        }

        .draggable-instructor:hover {
          border-color: #bfdbfe;
          background: #f8fbff;
        }

        .drop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.9rem;
        }

        .drop-card {
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          background: #fff;
          padding: 0.85rem;
          min-height: 124px;
          transition: 0.2s;
        }

        .drop-card.active {
          border-color: var(--primary);
          background: #eff6ff;
        }

        .drop-helper {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .assignment-pill {
          margin-top: 0.45rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 4px 10px;
          background: #e0e7ff;
          color: #3730a3;
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-area">
          <GraduationCap size={32} strokeWidth={2.5} />
          <h2 style={{fontSize: '1.4rem', fontWeight: 800}}>EduFlow</h2>
        </div>

        <nav style={{flex: 1}}>
          <div className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <LayoutDashboard size={20}/> Dashboard
          </div>
          <div className={`nav-item ${activeSection === 'dragdrop' ? 'active' : ''}`} onClick={() => setActiveSection('dragdrop')}>
            <Link2 size={20}/> Drag & Drop Assign
          </div>
          <div className="nav-item"><Calendar size={20}/> Time Table</div>
          <div className="nav-item"><Users size={20}/> Faculty</div>
          <div className="nav-item"><BookOpen size={20}/> Modules</div>
          <div className="nav-item"><Settings size={20}/> Settings</div>
        </nav>

        <div className="nav-item" style={{color: '#ef4444'}}>
          <LogOut size={20}/> Logout
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-box">
            <Search size={18} color="#94a3b8"/>
            <input type="text" placeholder="Search modules or staff..." />
          </div>
          <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
            <Bell size={20} color="#64748b" />
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{user?.name || 'Academic Lead'}</div>
                <div style={{fontSize: '0.75rem', color: '#64748b'}}>LIC Coordinator</div>
              </div>
              <div style={{width: 40, height: 40, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {activeSection === 'dashboard' ? (
          <>
            <section className="stats-row">
              <div className="stat-card">
                <div className="stat-icon-circle"><Users size={24}/></div>
                <div><h3 style={{margin: 0, fontSize: '1.5rem'}}>{instructors.length}</h3><p style={{margin: 0, color: '#64748b', fontSize: '0.85rem'}}>Faculty Members</p></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-circle"><BookOpen size={24}/></div>
                <div><h3 style={{margin: 0, fontSize: '1.5rem'}}>{modules.length}</h3><p style={{margin: 0, color: '#64748b', fontSize: '0.85rem'}}>Active Modules</p></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-circle"><Link2 size={24}/></div>
                <div><h3 style={{margin: 0, fontSize: '1.5rem'}}>{assignments.length}</h3><p style={{margin: 0, color: '#64748b', fontSize: '0.85rem'}}>Assignments</p></div>
              </div>
            </section>

            <div className="content-grid">
              {/* Left Column - Table */}
              <div className="panel">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                  <h3 style={{margin: 0}}>Recent Assignments</h3>
                  <button style={{background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer'}}>View All</button>
                </div>
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Assigned Lecturer</th>
                      <th>Schedule Info</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(asgn => (
                      <tr key={asgn.id}>
                        <td>
                          <div style={{fontWeight: 700}}>{asgn.module_code}</div>
                          <div style={{fontSize: '0.8rem', color: '#64748b'}}>{asgn.module_name}</div>
                        </td>
                        <td>{asgn.lecturer_name}</td>
                        <td>
                          <span style={{background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600}}>
                            Year {asgn.academic_year} · Sem {asgn.semester}
                          </span>
                        </td>
                        <td>
                          <button style={{color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer'}} 
                            onClick={() => handleDeleteAssignment(asgn.id)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Column - Forms */}
              <aside>
                <div className="panel" style={{border: '1px solid var(--primary-light)'}}>
                  <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <PlusCircle size={18} color="var(--primary)"/> Quick Assign
                  </h4>
                  <form onSubmit={handleQuickAssignSubmit}>
                    <div className="form-group">
                      <label className="label">Module</label>
                      <select
                        className="input-modern"
                        required
                        value={assignmentForm.moduleId}
                        onChange={(e) => setAssignmentForm((previous) => ({ ...previous, moduleId: e.target.value }))}
                      >
                        <option value="">Choose Module...</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.code}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Lecturer</label>
                      <select
                        className="input-modern"
                        required
                        value={assignmentForm.lecturerId}
                        onChange={(e) => setAssignmentForm((previous) => ({ ...previous, lecturerId: e.target.value }))}
                      >
                        <option value="">Choose Lecturer...</option>
                        {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Academic Year</label>
                      <select
                        className="input-modern"
                        value={assignmentForm.academicYear}
                        onChange={(e) => setAssignmentForm((previous) => ({ ...previous, academicYear: e.target.value }))}
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Semester</label>
                      <select
                        className="input-modern"
                        value={assignmentForm.semester}
                        onChange={(e) => setAssignmentForm((previous) => ({ ...previous, semester: e.target.value }))}
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-action" disabled={submittingAssignment}>
                      {submittingAssignment ? 'Saving...' : 'Confirm Assignment'}
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <h4 style={{marginTop: 0}}>Quick Onboard</h4>
                  <input
                    className="input-modern"
                    placeholder="Instructor Name"
                    style={{marginBottom: '10px'}}
                    value={instructorForm.name}
                    onChange={(e) => setInstructorForm((previous) => ({ ...previous, name: e.target.value }))}
                  />
                  <input
                    className="input-modern"
                    placeholder="Email Address"
                    style={{marginBottom: '10px'}}
                    value={instructorForm.email}
                    onChange={(e) => setInstructorForm((previous) => ({ ...previous, email: e.target.value }))}
                  />
                  <select
                    className="input-modern"
                    style={{marginBottom: '10px'}}
                    value={instructorForm.department}
                    onChange={(e) => setInstructorForm((previous) => ({ ...previous, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENT_OPTIONS.map((departmentName) => (
                      <option key={departmentName} value={departmentName}>
                        {departmentName}
                      </option>
                    ))}
                  </select>
                  <button className="btn-action" style={{background: '#10b981'}} disabled={addingInstructor} onClick={handleQuickOnboardSubmit}>
                    {addingInstructor ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <section className="panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem'}}>
              <div>
                <h3 style={{margin: 0}}>Drag & Drop Instructor Assignment</h3>
                <p style={{margin: '0.4rem 0 0 0', color: '#64748b', fontSize: '0.85rem'}}>
                  After timetable generation, drag an instructor card and drop it on a module to assign or reassign.
                </p>
              </div>
              <div style={{display: 'flex', gap: '0.6rem'}}>
                <select className="input-modern" value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)}>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
                <select className="input-modern" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>

            <div className="drag-layout">
              <div>
                <h4 className="drag-column-title">Instructors</h4>
                <div className="drag-list">
                  {instructors.length === 0 ? (
                    <div className="drop-helper">No instructors found.</div>
                  ) : (
                    instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        className="draggable-instructor"
                        draggable
                        onDragStart={() => setDragInstructorId(instructor.id)}
                        onDragEnd={() => {
                          setDragInstructorId(null);
                          setHoveredModuleId(null);
                        }}
                      >
                        <div style={{fontWeight: 700, fontSize: '0.9rem'}}>{instructor.name}</div>
                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>{instructor.department || 'No Department'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="drag-column-title">Drop on Modules</h4>
                <div className="drop-grid">
                  {modules.length === 0 ? (
                    <div className="drop-helper">No modules available.</div>
                  ) : (
                    modules.map((moduleItem) => {
                      const moduleAssignment = getAssignmentForModule(moduleItem.id);

                      return (
                        <div
                          key={moduleItem.id}
                          className={`drop-card ${hoveredModuleId === moduleItem.id ? 'active' : ''}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setHoveredModuleId(moduleItem.id);
                          }}
                          onDragLeave={() => setHoveredModuleId(null)}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleDropToModule(moduleItem.id);
                          }}
                        >
                          <div style={{fontWeight: 700}}>{moduleItem.code || 'N/A'}</div>
                          <div style={{fontSize: '0.8rem', color: '#64748b'}}>{moduleItem.name || 'Untitled Module'}</div>

                          {moduleAssignment ? (
                            <div className="assignment-pill">
                              <Users size={14} />
                              {moduleAssignment.lecturer_name || 'Assigned'}
                            </div>
                          ) : (
                            <div className="drop-helper">Unassigned · Drop instructor here</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            {savingDrop ? <div className="drop-helper" style={{marginTop: '0.9rem'}}>Saving assignment...</div> : null}
          </section>
        )}
      </main>
    </div>
  );
};

export default LICDashboard;