import React, { useState, useEffect } from 'react';
import {
  getUnassignedModules,
  initializeModulesWithYear,
} from '../api/moduleManagement.js';

/**
 * ModuleYearAssignment Component
 * Allows Academic Coordinators to assign academic years to existing modules
 * This is necessary to populate the academic_year field for all modules
 */
const ModuleYearAssignment = () => {
  const [unassignedModules, setUnassignedModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState(new Set());
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('1');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const semesters = ['1', '2'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const start = currentYear - 2 + i;
    return `${start}-${start + 1}`;
  });

  useEffect(() => {
    loadUnassignedModules();
  }, []);

  const loadUnassignedModules = async () => {
    try {
      setLoading(true);
      const response = await getUnassignedModules();
      setUnassignedModules(response.data || []);
    } catch (err) {
      setError('Failed to load unassigned modules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModule = (moduleId) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedModules.size === unassignedModules.length) {
      setSelectedModules(new Set());
    } else {
      setSelectedModules(new Set(unassignedModules.map((m) => m.id)));
    }
  };

  const handleAssignYear = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!academicYear) {
      setError('Please select an academic year');
      return;
    }

    if (selectedModules.size === 0) {
      setError('Please select at least one module');
      return;
    }

    try {
      setProcessing(true);
      const result = await initializeModulesWithYear(
        academicYear,
        Array.from(selectedModules),
        semester
      );

      setSuccess(
        `Successfully assigned ${result.totalInitialized} module(s) to ${academicYear}, Semester ${semester}`
      );
      setAcademicYear('');
      setSelectedModules(new Set());
      await loadUnassignedModules();
    } catch (err) {
      setError('Failed to assign modules: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Assign Academic Years to Modules</h1>
      <p className="text-gray-600 mb-6">
        Assign existing modules to academic years and semesters for timetable management
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          ✓ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assignment Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Assignment Settings</h2>

            <form onSubmit={handleAssignYear} className="space-y-4">
              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Academic Year *
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Year --</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary */}
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-900">
                  <strong>{selectedModules.size}</strong> module(s) selected
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || selectedModules.size === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {processing ? 'Assigning...' : 'Assign Selected Modules'}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
              <h3 className="font-semibold text-amber-900 mb-2">ℹ️ Info</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Select an academic year first</li>
                <li>• Check modules to assign</li>
                <li>• Click button to save</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Modules List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Unassigned Modules ({unassignedModules.length})
              </h2>
              {unassignedModules.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedModules.size === unassignedModules.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              )}
            </div>

            {unassignedModules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">✓ All modules have been assigned to academic years!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedModules.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModules.has(module.id)}
                      onChange={() => handleSelectModule(module.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {module.code}
                      </div>
                      <div className="text-sm text-gray-600">{module.name}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {module.credits} cr • {module.batch_size} batch
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleYearAssignment;
