import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import schedulerApi from '../api/scheduler.js';
import moduleCatalog from '../data/moduleCatalog.js';

const DEPARTMENTS = ['SE', 'CSNE', 'IT', 'DS', 'ISE', 'IM', 'CS'];

const normalizeDepartment = (value) => {
  if (!value) return '';
  const up = String(value).trim().toUpperCase();
  if (up.includes('CYBER')) return 'CS';
  return up;
};

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
  const [draggedLecturerId, setDraggedLecturerId] = useState('');
  const [dragTargetModuleId, setDragTargetModuleId] = useState('');
  const [dragAssignmentMeta, setDragAssignmentMeta] = useState({
    department: 'ALL',
    licId: '',
    academicYear: '1',
    semester: '1',
  });

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

  const editLecturer = async (lecturer) => {
    const name = window.prompt('Lecturer name', lecturer.name || '');
    if (name === null) return;
    const department = window.prompt('Department', lecturer.department || '');
    if (department === null) return;
    const email = window.prompt('Email (optional)', lecturer.email || '');
    if (email === null) return;

    try {
      await schedulerApi.updateItem('instructors', lecturer.id, {
        name: name.trim(),
        department: department.trim(),
        email: email.trim(),
      });
      showMessage('Lecturer updated successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to update lecturer', 'error');
    }
  };

  const deleteLecturer = async (id) => {
    if (!window.confirm('Delete this lecturer?')) return;
    try {
      await schedulerApi.deleteItem('instructors', id);
      showMessage('Lecturer deleted successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to delete lecturer', 'error');
    }
  };

  const editLic = async (lic) => {
    const name = window.prompt('LIC name', lic.name || '');
    if (name === null) return;
    const department = window.prompt('Department', lic.department || '');
    if (department === null) return;

    try {
      await schedulerApi.updateItem('lics', lic.id, {
        name: name.trim(),
        department: department.trim(),
      });
      showMessage('LIC updated successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to update LIC', 'error');
    }
  };

  const deleteLic = async (id) => {
    if (!window.confirm('Delete this LIC?')) return;
    try {
      await schedulerApi.deleteItem('lics', id);
      showMessage('LIC deleted successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to delete LIC', 'error');
    }
  };

  const editModule = async (moduleItem) => {
    const code = window.prompt('Module code', moduleItem.code || '');
    if (code === null) return;
    const name = window.prompt('Module name', moduleItem.name || '');
    if (name === null) return;

    try {
      await schedulerApi.updateItem('modules', moduleItem.id, {
        code: code.trim(),
        name: name.trim(),
      });
      showMessage('Module updated successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to update module', 'error');
    }
  };

  const deleteModule = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      await schedulerApi.deleteItem('modules', id);
      showMessage('Module deleted successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to delete module', 'error');
    }
  };

  const editCampusStructure = async (structure) => {
    const currentBuilding = getFeatureValue(structure.features, 'building') || '';
    const currentFloor = getFeatureValue(structure.features, 'floor') || '';
    const currentRoomType = getFeatureValue(structure.features, 'roomType') || '';

    const name = window.prompt('Structure name', structure.name || '');
    if (name === null) return;
    const capacityInput = window.prompt('Capacity', structure.capacity || '');
    if (capacityInput === null) return;
    const building = window.prompt('Building', currentBuilding);
    if (building === null) return;
    const floor = window.prompt('Floor', currentFloor);
    if (floor === null) return;
    const roomType = window.prompt('Room type', currentRoomType);
    if (roomType === null) return;

    try {
      await schedulerApi.updateItem('halls', structure.id, {
        name: name.trim(),
        capacity: capacityInput ? Number(capacityInput) : null,
        features: {
          building: building.trim(),
          floor: floor.trim(),
          roomType: roomType.trim(),
        },
      });
      showMessage('Campus structure updated successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to update campus structure', 'error');
    }
  };

  const deleteCampusStructure = async (id) => {
    if (!window.confirm('Delete this campus structure?')) return;
    try {
      await schedulerApi.deleteItem('halls', id);
      showMessage('Campus structure deleted successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to delete campus structure', 'error');
    }
  };

  const editAssignment = async (assignment) => {
    const moduleId = window.prompt('Module ID', assignment.module_id || '');
    if (moduleId === null) return;
    const lecturerId = window.prompt('Lecturer ID', assignment.lecturer_id || '');
    if (lecturerId === null) return;
    const licId = window.prompt('LIC ID', assignment.lic_id || '');
    if (licId === null) return;
    const academicYear = window.prompt('Academic year (1-4)', assignment.academic_year || '1');
    if (academicYear === null) return;
    const semester = window.prompt('Semester (1-2)', assignment.semester || '1');
    if (semester === null) return;

    try {
      await schedulerApi.updateAssignment(assignment.id, {
        moduleId: moduleId.trim(),
        lecturerId: lecturerId.trim(),
        licId: licId.trim(),
        academicYear: String(academicYear).trim(),
        semester: String(semester).trim(),
      });
      showMessage('Assignment updated successfully');
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to update assignment', 'error');
    }
  };

  const inferModuleDepartment = (module) => {
    if (!module) return '';

    const details = typeof module.details === 'string'
      ? (() => {
          try {
            return JSON.parse(module.details);
          } catch {
            return null;
          }
        })()
      : module.details;

    const fromDetails = normalizeDepartment(details?.department);
    if (fromDetails && DEPARTMENTS.includes(fromDetails)) return fromDetails;

    const code = String(module.code || '').toUpperCase();
    const match = DEPARTMENTS.find((dep) => code.startsWith(dep));
    if (match) return match;

    return '';
  };

  const lecturersWithDepartment = lecturers.map((lecturer) => ({
    ...lecturer,
    normalizedDepartment: normalizeDepartment(lecturer.department),
  }));

  const modulesWithDepartment = modules.map((module) => ({
    ...module,
    normalizedDepartment: inferModuleDepartment(module),
  }));

  const filteredLecturers = dragAssignmentMeta.department === 'ALL'
    ? lecturersWithDepartment
    : lecturersWithDepartment.filter((lecturer) => lecturer.normalizedDepartment === dragAssignmentMeta.department);

  const filteredModules = dragAssignmentMeta.department === 'ALL'
    ? modulesWithDepartment
    : modulesWithDepartment.filter((module) => module.normalizedDepartment === dragAssignmentMeta.department);

  const filteredLics = dragAssignmentMeta.department === 'ALL'
    ? lics
    : lics.filter((lic) => normalizeDepartment(lic.department) === dragAssignmentMeta.department);

  const handleTeacherDragStart = (lecturerId) => {
    setDraggedLecturerId(lecturerId);
  };

  const handleTeacherDragEnd = () => {
    setDraggedLecturerId('');
    setDragTargetModuleId('');
  };

  const handleDropOnModule = async (moduleId) => {
    if (!draggedLecturerId) return;

    const lecturer = lecturersWithDepartment.find((item) => item.id === draggedLecturerId);
    const module = modulesWithDepartment.find((item) => item.id === moduleId);

    if (!lecturer || !module) {
      showMessage('Invalid drag target. Please try again.', 'error');
      return;
    }

    if (module.normalizedDepartment && lecturer.normalizedDepartment && module.normalizedDepartment !== lecturer.normalizedDepartment) {
      showMessage('Department mismatch. Drop teacher on a module in the same department.', 'error');
      return;
    }

    let licId = dragAssignmentMeta.licId;
    if (!licId) {
      const matchedLic = lics.find((lic) => normalizeDepartment(lic.department) === lecturer.normalizedDepartment);
      licId = matchedLic?.id || '';
    }

    if (!licId) {
      showMessage('Select an LIC before dropping teacher to create assignment.', 'error');
      return;
    }

    try {
      await schedulerApi.createAssignment({
        moduleId,
        lecturerId: lecturer.id,
        licId,
        academicYear: dragAssignmentMeta.academicYear,
        semester: dragAssignmentMeta.semester,
      });
      showMessage(`Assigned ${lecturer.name} to ${module.code || module.name}`);
      await loadData();
    } catch (err) {
      showMessage(err.message || 'Failed to create drag-and-drop assignment', 'error');
    } finally {
      setDraggedLecturerId('');
      setDragTargetModuleId('');
    }
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
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-6 shadow-2xl shadow-indigo-900/40 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Management Hub</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Academic Coordinator Dashboard</h1>
          <p className="mt-2 text-slate-300">Welcome, {user?.name || 'User'} • Plan, assign, and track teaching ownership smoothly</p>
          {message.text && (
            <p className={`mt-4 rounded-lg px-4 py-3 font-medium ${
              message.type === 'error' 
                ? 'bg-red-500/20 text-red-200' 
                : 'bg-emerald-500/20 text-emerald-200'
            }`}>
              {message.text}
            </p>
          )}
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">Manage Core Records</h2>
          <p className="mt-2 text-slate-400">Full CRUD for lecturers, LICs, and modules</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <h3 className="text-lg font-semibold text-white">Lecturers</h3>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {lecturers.length === 0 && <p className="text-sm text-slate-400">No lecturers available.</p>}
                {lecturers.map((lecturer) => (
                  <div key={lecturer.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <p className="font-semibold text-white">{lecturer.name || '-'}</p>
                    <p className="text-xs text-slate-400">{lecturer.department || '-'}</p>
                    <p className="text-xs text-slate-500">{lecturer.email || 'No email'}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30" onClick={() => editLecturer(lecturer)}>Edit</button>
                      <button className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30" onClick={() => deleteLecturer(lecturer.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <h3 className="text-lg font-semibold text-white">LICs</h3>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {lics.length === 0 && <p className="text-sm text-slate-400">No LICs available.</p>}
                {lics.map((lic) => (
                  <div key={lic.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <p className="font-semibold text-white">{lic.name || '-'}</p>
                    <p className="text-xs text-slate-400">{lic.department || '-'}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30" onClick={() => editLic(lic)}>Edit</button>
                      <button className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30" onClick={() => deleteLic(lic.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <h3 className="text-lg font-semibold text-white">Modules</h3>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {modules.length === 0 && <p className="text-sm text-slate-400">No modules available.</p>}
                {modules.map((moduleItem) => (
                  <div key={moduleItem.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <p className="font-semibold text-white">{moduleItem.code || '-'}</p>
                    <p className="text-xs text-slate-400">{moduleItem.name || '-'}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30" onClick={() => editModule(moduleItem)}>Edit</button>
                      <button className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30" onClick={() => deleteModule(moduleItem.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/40 to-violet-900/40 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-indigo-300">Lecturers</p>
            <p className="mt-2 text-3xl font-bold text-white">{lecturers.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-cyan-300">LICs</p>
            <p className="mt-2 text-3xl font-bold text-white">{lics.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-amber-300">Modules</p>
            <p className="mt-2 text-3xl font-bold text-white">{modules.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/40 to-emerald-900/40 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-green-300">Structures</p>
            <p className="mt-2 text-3xl font-bold text-white">{campusStructures.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-pink-900/40 to-rose-900/40 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-pink-300">Assignments</p>
            <p className="mt-2 text-3xl font-bold text-white">{assignments.length}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Lecturer Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Add Lecturer</h2>
            <p className="mt-1 text-sm text-slate-400">Add professors and lecturers with department details</p>
            <form onSubmit={addLecturer} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Lecturer name"
                value={lecturerForm.name}
                onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })}
                required
              />
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                value={lecturerForm.department}
                onChange={(e) => setLecturerForm({ ...lecturerForm, department: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Email (optional)"
                value={lecturerForm.email}
                onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })}
              />
              <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600" type="submit">Add Lecturer</button>
            </form>
          </div>

          {/* Add LIC Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Add LIC</h2>
            <p className="mt-1 text-sm text-slate-400">Create module leadership records for allocation</p>
            <form onSubmit={addLic} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="LIC name"
                value={licForm.name}
                onChange={(e) => setLicForm({ ...licForm, name: e.target.value })}
                required
              />
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                value={licForm.department}
                onChange={(e) => setLicForm({ ...licForm, department: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600" type="submit">Add LIC</button>
            </form>
          </div>

          {/* Add Module Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Add Module</h2>
            <p className="mt-1 text-sm text-slate-400">Pick from catalog or enter custom details</p>
            <form onSubmit={addModule} className="mt-4 space-y-3">
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
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
              <button className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" type="button" onClick={applyCatalogModule}>
                Use Selected Catalog
              </button>
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Module code (e.g. IT1120)"
                value={moduleForm.code}
                onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
                required
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Module name"
                value={moduleForm.name}
                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                required
              />
              <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600" type="submit">Add Module</button>
            </form>
          </div>

          {/* Add Campus Structure Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Add Campus Structure</h2>
            <p className="mt-1 text-sm text-slate-400">Create lecture halls, labs, and rooms</p>
            <form onSubmit={addCampusStructure} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Structure name (e.g. NB-501 Lab)"
                value={campusForm.name}
                onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                required
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                type="number"
                placeholder="Capacity"
                value={campusForm.capacity}
                onChange={(e) => setCampusForm({ ...campusForm, capacity: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Building (e.g. Main / NB)"
                value={campusForm.building}
                onChange={(e) => setCampusForm({ ...campusForm, building: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Floor"
                value={campusForm.floor}
                onChange={(e) => setCampusForm({ ...campusForm, floor: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-400 backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                placeholder="Room type (Lecture Hall / Lab / Tutorial)"
                value={campusForm.roomType}
                onChange={(e) => setCampusForm({ ...campusForm, roomType: e.target.value })}
              />
              <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600" type="submit">Add Structure</button>
            </form>
          </div>

          {/* Assign Module Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Assign Module</h2>
            <p className="mt-1 text-sm text-slate-400">Map modules to lecturers, LIC, year, and semester</p>
            <form onSubmit={addAssignment} className="mt-4 space-y-3">
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
                value={assignmentForm.semester}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: e.target.value })}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>

              <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600" type="submit">Create Assignment</button>
            </form>
          </div>
        </div>

        {/* Drag & Drop Teacher Assignment */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">Drag & Drop Teacher Assignment</h2>
          <p className="mt-2 text-slate-400">Drag a teacher card and drop onto a module to create assignment by department</p>
          <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-4">
            <select
              className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
              value={dragAssignmentMeta.department}
              onChange={(e) => setDragAssignmentMeta((prev) => ({ ...prev, department: e.target.value, licId: '' }))}
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>

            <select
              className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
              value={dragAssignmentMeta.licId}
              onChange={(e) => setDragAssignmentMeta((prev) => ({ ...prev, licId: e.target.value }))}
            >
              <option value="">Auto/Select LIC</option>
              {filteredLics.map((lic) => (
                <option key={lic.id} value={lic.id}>{lic.name} ({lic.department || '-'})</option>
              ))}
            </select>

            <select
              className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
              value={dragAssignmentMeta.academicYear}
              onChange={(e) => setDragAssignmentMeta((prev) => ({ ...prev, academicYear: e.target.value }))}
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white backdrop-blur transition focus:border-indigo-500 focus:outline-none"
              value={dragAssignmentMeta.semester}
              onChange={(e) => setDragAssignmentMeta((prev) => ({ ...prev, semester: e.target.value }))}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 backdrop-blur">
              <h3 className="font-semibold text-white">Teachers ({filteredLecturers.length})</h3>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {filteredLecturers.length === 0 && <p className="text-slate-400 text-sm">No teachers in this department.</p>}
                {filteredLecturers.map((lecturer) => (
                  <div
                    key={lecturer.id}
                    className={`cursor-grab rounded-lg border border-white/20 bg-gradient-to-r from-indigo-900/50 to-violet-900/50 p-3 transition ${draggedLecturerId === lecturer.id ? 'opacity-50' : 'hover:border-indigo-400'}`}
                    draggable
                    onDragStart={() => handleTeacherDragStart(lecturer.id)}
                    onDragEnd={handleTeacherDragEnd}
                  >
                    <strong className="block text-white">{lecturer.name}</strong>
                    <span className="text-xs text-indigo-300">{lecturer.normalizedDepartment || '-'}</span>
                    <span className="block text-xs text-slate-400">{lecturer.email || 'No email'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 backdrop-blur">
              <h3 className="font-semibold text-white">Modules ({filteredModules.length})</h3>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {filteredModules.length === 0 && <p className="text-slate-400 text-sm">No modules in this department.</p>}
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className={`rounded-lg border-2 p-3 transition ${dragTargetModuleId === module.id ? 'border-green-400 bg-green-900/30' : 'border-dashed border-white/20 bg-slate-700/30 hover:border-cyan-400'}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragTargetModuleId(module.id);
                    }}
                    onDragLeave={() => setDragTargetModuleId('')}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnModule(module.id);
                    }}
                  >
                    <strong className="block text-white">{module.code || '-'}</strong>
                    <span className="block text-sm text-slate-300">{module.name || '-'}</span>
                    <span className="text-xs text-cyan-300">Dept: {module.normalizedDepartment || 'Unspecified'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campus Structures Table */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">Campus Structures (Halls, Labs, Floors)</h2>
        <p className="mt-2 text-slate-400">Halls: {hallCount} • Labs: {labCount} • Floors: {uniqueFloorCount}</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50">
                <th className="px-6 py-4 text-left font-semibold text-white">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Building</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Floor</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Capacity</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {campusStructures.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No halls/labs/floors added yet.</td>
                </tr>
              )}
              {campusStructures.map((structure) => {
                const building = getFeatureValue(structure.features, 'building') || '-';
                const floor = getFeatureValue(structure.features, 'floor') || '-';
                const type = getCampusType(structure);

                return (
                  <tr key={structure.id} className="border-b border-white/10 hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 text-white">{structure.name || '-'}</td>
                    <td className="px-6 py-4"><span className="inline-block rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">{type}</span></td>
                    <td className="px-6 py-4 text-slate-300">{building}</td>
                    <td className="px-6 py-4 text-slate-300">{floor}</td>
                    <td className="px-6 py-4 text-slate-300">{structure.capacity || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/30" onClick={() => editCampusStructure(structure)}>Edit</button>
                        <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300 transition hover:bg-red-500/30" onClick={() => deleteCampusStructure(structure.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Module Assignments Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-2xl font-bold text-white">Current Module Assignments</h2>
        <p className="mt-2 text-slate-400">Review all assignments and remove outdated mappings</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50">
                <th className="px-6 py-4 text-left font-semibold text-white">Module</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Lecturer</th>
                <th className="px-6 py-4 text-left font-semibold text-white">LIC</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Year</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Semester</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No assignments yet. Create your first mapping above.</td>
                </tr>
              )}
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-white/10 hover:bg-slate-800/20 transition">
                  <td className="px-6 py-4 text-white">{assignment.module_code || '-'} {assignment.module_name ? `- ${assignment.module_name}` : ''}</td>
                  <td className="px-6 py-4 text-slate-300">{assignment.lecturer_name || '-'}</td>
                  <td className="px-6 py-4 text-slate-300">{assignment.lic_name || '-'}</td>
                  <td className="px-6 py-4 text-slate-300">Year {assignment.academic_year}</td>
                  <td className="px-6 py-4 text-slate-300">{assignment.semester ? `Semester ${assignment.semester}` : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/30" onClick={() => editAssignment(assignment)}>Edit</button>
                      <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300 transition hover:bg-red-500/30" onClick={() => removeAssignment(assignment.id)}>Remove</button>
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
  );
};

export default AcademicCoordinatorDashboard;
