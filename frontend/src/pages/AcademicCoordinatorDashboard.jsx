import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import schedulerApi from '../api/scheduler.js';
import moduleCatalog from '../data/moduleCatalog.js';

const AcademicCoordinatorDashboard = ({ user }) => {
  const [lecturers, setLecturers] = useState([]);
  const [lics, setLics] = useState([]);
  const [modules, setModules] = useState([]);
  const [campusStructures, setCampusStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [lecturerForm, setLecturerForm] = useState({ name: '', department: '', email: '' });
  const [licForm, setLicForm] = useState({ name: '', department: '' });
  const [moduleForm, setModuleForm] = useState({ code: '', name: '' });
  const [selectedCatalogModule, setSelectedCatalogModule] = useState('');
  const [campusForm, setCampusForm] = useState({
    name: '',
    capacity: '',
    building: '',
    floor: '',
    roomType: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    moduleId: '',
    lecturerId: '',
    licId: '',
    academicYear: '1',
    semester: '1',
  });
  const [view3d, setView3d] = useState({ rotateX: 10, rotateZ: -18, zoom: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
  };

  const loadData = async () => {
    try {
      const [lecturerRes, licRes, moduleRes, hallRes, assignmentRes] = await Promise.all([
        schedulerApi.listItems('instructors'),
        schedulerApi.listItems('lics'),
        schedulerApi.listItems('modules'),
        schedulerApi.listItems('halls'),
        schedulerApi.listAssignments(),
      ]);

      setLecturers(lecturerRes.items || []);
      setLics(licRes.items || []);
      setModules(moduleRes.items || []);
      setCampusStructures(hallRes.items || []);
      setAssignments(assignmentRes.items || []);
    } catch (err) {
      showMessage(err.message || 'Failed to load coordinator data', 'error');
    }
  };

  const addLecturer = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('instructors', lecturerForm);
      setLecturerForm({ name: '', department: '', email: '' });
      showMessage('Lecturer added successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to add lecturer', 'error');
    }
  };

  const addLic = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('lics', licForm);
      setLicForm({ name: '', department: '' });
      showMessage('LIC added successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to add LIC', 'error');
    }
  };

  const addModule = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('modules', moduleForm);
      setModuleForm({ code: '', name: '' });
      showMessage('Module added successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to add module', 'error');
    }
  };

  const applyCatalogModule = () => {
    if (!selectedCatalogModule) return;
    const [code, name] = selectedCatalogModule.split('::');
    setModuleForm({ code, name });
  };

  const addCampusStructure = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.addItem('halls', {
        name: campusForm.name,
        capacity: Number(campusForm.capacity) || null,
        features: {
          building: campusForm.building,
          floor: campusForm.floor,
          roomType: campusForm.roomType,
        },
      });

      setCampusForm({
        name: '',
        capacity: '',
        building: '',
        floor: '',
        roomType: '',
      });
      showMessage('Campus structure added successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to add campus structure', 'error');
    }
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    try {
      await schedulerApi.createAssignment(assignmentForm);
      showMessage('Module assignment created');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to create assignment', 'error');
    }
  };

  const removeAssignment = async (id) => {
    try {
      await schedulerApi.deleteAssignment(id);
      showMessage('Assignment removed');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to remove assignment', 'error');
    }
  };

  const update3dView = (key, value) => {
    setView3d((prev) => ({ ...prev, [key]: value }));
  };

  const reset3dView = () => {
    setView3d({ rotateX: 10, rotateZ: -18, zoom: 1 });
  };

  const getFeatureValue = (features, key) => {
    if (!features) return '';
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return parsed?.[key] || '';
      } catch {
        return '';
      }
    }
    return features?.[key] || '';
  };

  const getCampusType = (structure) => {
    const roomType = getFeatureValue(structure.features, 'roomType')?.toLowerCase() || '';
    const name = (structure.name || '').toLowerCase();

    if (roomType.includes('lab') || name.includes('lab')) return 'Lab';
    if (roomType.includes('hall') || name.includes('hall')) return 'Hall';
    return roomType ? roomType.charAt(0).toUpperCase() + roomType.slice(1) : 'Other';
  };

  const hallCount = campusStructures.filter((item) => getCampusType(item) === 'Hall').length;
  const labCount = campusStructures.filter((item) => getCampusType(item) === 'Lab').length;
  const uniqueFloorCount = new Set(
    campusStructures
      .map((item) => getFeatureValue(item.features, 'floor'))
      .filter((value) => value !== null && value !== undefined && value !== '')
  ).size;

  return (
    <div className="dashboard-container ac-dashboard">
      <div className="dashboard-header">
        <h1>Academic Coordinator Dashboard</h1>
        <p>Welcome, {user?.name || 'User'} • Plan, assign, and track teaching ownership smoothly</p>
        {message.text && <p className={`ac-message ${message.type === 'error' ? 'ac-message-error' : 'ac-message-success'}`}>{message.text}</p>}
      </div>

      <div className="ac-stats-grid">
        <div className="ac-stat-card">
          <h3>Lecturers</h3>
          <p>{lecturers.length}</p>
        </div>
        <div className="ac-stat-card">
          <h3>LICs</h3>
          <p>{lics.length}</p>
        </div>
        <div className="ac-stat-card">
          <h3>Modules</h3>
          <p>{modules.length}</p>
        </div>
        <div className="ac-stat-card">
          <h3>Campus Structures</h3>
          <p>{campusStructures.length}</p>
        </div>
        <div className="ac-stat-card">
          <h3>Assignments</h3>
          <p>{assignments.length}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Add Lecturer</h2>
          <p>Add professors and lecturers with department details</p>
          <form onSubmit={addLecturer} className="ac-form">
            <input
              className="ac-input"
              placeholder="Lecturer name"
              value={lecturerForm.name}
              onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })}
              required
            />
            <input
              className="ac-input"
              placeholder="Department"
              value={lecturerForm.department}
              onChange={(e) => setLecturerForm({ ...lecturerForm, department: e.target.value })}
            />
            <input
              className="ac-input"
              placeholder="Email (optional)"
              value={lecturerForm.email}
              onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })}
            />
            <button className="dashboard-btn" type="submit">Add Lecturer</button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Add LIC</h2>
          <p>Create module leadership records for allocation</p>
          <form onSubmit={addLic} className="ac-form">
            <input
              className="ac-input"
              placeholder="LIC name"
              value={licForm.name}
              onChange={(e) => setLicForm({ ...licForm, name: e.target.value })}
              required
            />
            <input
              className="ac-input"
              placeholder="Department"
              value={licForm.department}
              onChange={(e) => setLicForm({ ...licForm, department: e.target.value })}
            />
            <button className="dashboard-btn" type="submit">Add LIC</button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Add Module</h2>
          <p>Pick from module catalog or enter custom module details</p>
          <form onSubmit={addModule} className="ac-form">
            <select
              className="ac-input"
              value={selectedCatalogModule}
              onChange={(e) => setSelectedCatalogModule(e.target.value)}
            >
              <option value="">Select module from catalog</option>
              {moduleCatalog.map((module) => (
                <option key={`${module.code}-${module.name}`} value={`${module.code}::${module.name}`}>
                  {module.code} - {module.name}
                </option>
              ))}
            </select>
            <button className="dashboard-btn ac-inline-btn" type="button" onClick={applyCatalogModule}>
              Use Selected Catalog Module
            </button>
            <input
              className="ac-input"
              placeholder="Module code (e.g. IT1120)"
              value={moduleForm.code}
              onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
              required
            />
            <input
              className="ac-input"
              placeholder="Module name"
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
              required
            />
            <button className="dashboard-btn" type="submit">Add Module</button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Add Campus Structure</h2>
          <p>Create lecture halls, labs, and rooms used by scheduling</p>
          <form onSubmit={addCampusStructure} className="ac-form">
            <input
              className="ac-input"
              placeholder="Structure name (e.g. NB-501 Lab)"
              value={campusForm.name}
              onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
              required
            />
            <input
              className="ac-input"
              type="number"
              placeholder="Capacity"
              value={campusForm.capacity}
              onChange={(e) => setCampusForm({ ...campusForm, capacity: e.target.value })}
            />
            <input
              className="ac-input"
              placeholder="Building (e.g. Main Building / NB)"
              value={campusForm.building}
              onChange={(e) => setCampusForm({ ...campusForm, building: e.target.value })}
            />
            <input
              className="ac-input"
              placeholder="Floor"
              value={campusForm.floor}
              onChange={(e) => setCampusForm({ ...campusForm, floor: e.target.value })}
            />
            <input
              className="ac-input"
              placeholder="Room type (Lecture Hall / Lab / Tutorial)"
              value={campusForm.roomType}
              onChange={(e) => setCampusForm({ ...campusForm, roomType: e.target.value })}
            />
            <button className="dashboard-btn" type="submit">Add Campus Structure</button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Assign Module</h2>
          <p>Map each module to a lecturer, LIC, year, and semester</p>
          <form onSubmit={addAssignment} className="ac-form">
            <select
              className="ac-input"
              value={assignmentForm.moduleId}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, moduleId: e.target.value })}
              required
            >
              <option value="">Select module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>{module.code} - {module.name}</option>
              ))}
            </select>

            <select
              className="ac-input"
              value={assignmentForm.lecturerId}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, lecturerId: e.target.value })}
              required
            >
              <option value="">Select lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
              ))}
            </select>

            <select
              className="ac-input"
              value={assignmentForm.licId}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, licId: e.target.value })}
              required
            >
              <option value="">Select LIC</option>
              {lics.map((lic) => (
                <option key={lic.id} value={lic.id}>{lic.name}</option>
              ))}
            </select>

            <select
              className="ac-input"
              value={assignmentForm.academicYear}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, academicYear: e.target.value })}
              required
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              className="ac-input"
              value={assignmentForm.semester}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: e.target.value })}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            <button className="dashboard-btn" type="submit">Create Assignment</button>
          </form>
        </div>
      </div>

      <div className="dashboard-card ac-3d-card">
        <h2>3D Campus Structure</h2>
        <p>Live visual map of your added campus spaces (halls, labs, rooms)</p>
        <div className="ac-3d-controls">
          <label>
            Rotate X
            <input
              type="range"
              min="-20"
              max="35"
              step="1"
              value={view3d.rotateX}
              onChange={(e) => update3dView('rotateX', Number(e.target.value))}
            />
          </label>
          <label>
            Rotate Z
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={view3d.rotateZ}
              onChange={(e) => update3dView('rotateZ', Number(e.target.value))}
            />
          </label>
          <label>
            Zoom
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={view3d.zoom}
              onChange={(e) => update3dView('zoom', Number(e.target.value))}
            />
          </label>
          <button className="dashboard-btn ac-view-btn" type="button" onClick={reset3dView}>Reset View</button>
        </div>
        <div className="ac-3d-scene-wrap">
          <div
            className="ac-3d-scene"
            style={{
              '--rx': `${view3d.rotateX}deg`,
              '--rz': `${view3d.rotateZ}deg`,
              '--zoom': view3d.zoom,
            }}
          >
            <div className="ac-3d-camera">
            {campusStructures.length === 0 && (
              <div className="ac-3d-empty">No campus structures yet. Add one to generate the 3D layout.</div>
            )}
            {campusStructures.map((structure, index) => {
              const capacity = Number(structure.capacity) || 0;
              const height = Math.max(40, Math.min(160, capacity ? 28 + Math.round(capacity / 3) : 56));
              const x = (index % 6) * 74;
              const z = Math.floor(index / 6) * 66;
              const building = getFeatureValue(structure.features, 'building') || 'Building';
              const floor = getFeatureValue(structure.features, 'floor') || '-';
              const roomType = getFeatureValue(structure.features, 'roomType') || 'Space';

              return (
                <div
                  key={structure.id || `${structure.name}-${index}`}
                  className="ac-3d-block"
                  style={{
                    '--x': `${x}px`,
                    '--z': `${z}px`,
                    '--h': `${height}px`,
                    '--hue': `${(index * 37) % 360}`,
                  }}
                >
                  <div className="ac-3d-label">
                    <strong>{structure.name}</strong>
                    <span>{building} • Floor {floor}</span>
                    <span>{roomType} • Cap {capacity || '-'}</span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card ac-assignment-card">
        <h2>Campus Structures (Halls, Labs, Floors)</h2>
        <p>Halls: {hallCount} • Labs: {labCount} • Floors: {uniqueFloorCount}</p>
        <div className="ac-table-wrapper">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {campusStructures.length === 0 && (
                <tr>
                  <td colSpan="5" className="ac-empty-row">No halls/labs/floors added yet.</td>
                </tr>
              )}
              {campusStructures.map((structure) => {
                const building = getFeatureValue(structure.features, 'building') || '-';
                const floor = getFeatureValue(structure.features, 'floor') || '-';
                const type = getCampusType(structure);

                return (
                  <tr key={structure.id}>
                    <td>{structure.name || '-'}</td>
                    <td><span className="ac-type-pill">{type}</span></td>
                    <td>{building}</td>
                    <td>{floor}</td>
                    <td>{structure.capacity || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-card ac-assignment-card">
        <h2>Current Module Assignments</h2>
        <p>Review all assignments and remove outdated mappings</p>
        <div className="ac-table-wrapper">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Lecturer</th>
                <th>LIC</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan="6" className="ac-empty-row">No assignments yet. Create your first mapping above.</td>
                </tr>
              )}
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.module_code || '-'} {assignment.module_name ? `- ${assignment.module_name}` : ''}</td>
                  <td>{assignment.lecturer_name || '-'}</td>
                  <td>{assignment.lic_name || '-'}</td>
                  <td>Year {assignment.academic_year}</td>
                  <td>{assignment.semester ? `Semester ${assignment.semester}` : '-'}</td>
                  <td>
                    <button className="dashboard-btn ac-remove-btn" onClick={() => removeAssignment(assignment.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcademicCoordinatorDashboard;
