import React, { useState, useEffect } from 'react';
import {
  getAcademicYears,
  getModulesByYear,
  addModuleForYear,
  updateModuleForYear,
  deleteModuleForYear,
  getModulesSummaryByYearSemester,
  downloadModulesAsCSV,
} from '../api/moduleManagement.js';

const ModuleManagementByYear = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: '',
    batch_size: '',
    lectures_per_week: '',
    semester: '',
    day_type: '',
  });

  // Fetch academic years on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch modules when year is selected
  useEffect(() => {
    if (selectedYear) {
      fetchModulesForYear(selectedYear);
    }
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await getAcademicYears();
      setAcademicYears(response.data || []);
    } catch (err) {
      setError('Failed to fetch academic years');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesForYear = async (year) => {
    try {
      setLoading(true);
      const response = await getModulesByYear(year);
      setModules(response.data || []);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch modules for ${year}`);
      console.error(err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!selectedYear) {
      setError('Please select an academic year first');
      return;
    }

    if (!formData.code || !formData.name) {
      setError('Module code and name are required');
      return;
    }

    try {
      setLoading(true);
      const response = await addModuleForYear(selectedYear, formData);
      setSuccess(`Module '${formData.code}' added successfully`);
      setFormData({
        code: '',
        name: '',
        credits: '',
        batch_size: '',
        lectures_per_week: '',
        semester: '',
        day_type: '',
      });
      setShowForm(false);
      fetchModulesForYear(selectedYear);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add module');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId, moduleCode) => {
    if (!window.confirm(`Are you sure you want to delete module '${moduleCode}'?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteModuleForYear(selectedYear, moduleId);
      setSuccess(`Module '${moduleCode}' deleted successfully`);
      fetchModulesForYear(selectedYear);
    } catch (err) {
      setError('Failed to delete module');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (modules.length === 0) {
      setError('No modules to export');
      return;
    }
    downloadModulesAsCSV(modules, selectedYear);
    setSuccess('Modules exported to CSV');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Module Management by Academic Year</h1>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Year Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Academic Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose an academic year --</option>
          {academicYears.map((item) => (
            <option key={item.academic_year} value={item.academic_year}>
              {item.academic_year} ({item.module_count} modules)
            </option>
          ))}
        </select>
      </div>

      {/* Add Module Button */}
      {selectedYear && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add New Module'}
          </button>
        </div>
      )}

      {/* Add Module Form */}
      {showForm && selectedYear && (
        <form
          onSubmit={handleAddModule}
          className="mb-6 p-4 border rounded bg-gray-50"
        >
          <h3 className="text-lg font-semibold mb-4">
            Add Module for {selectedYear}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Module Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., CS101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Module Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., Introduction to Programming"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credits</label>
              <input
                type="number"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Batch Size</label>
              <input
                type="number"
                value={formData.batch_size}
                onChange={(e) =>
                  setFormData({ ...formData, batch_size: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Lectures per Week
              </label>
              <input
                type="number"
                value={formData.lectures_per_week}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lectures_per_week: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Day Type</label>
              <select
                value={formData.day_type}
                onChange={(e) =>
                  setFormData({ ...formData, day_type: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Day Type</option>
                <option value="lecture">Lecture</option>
                <option value="practical">Practical</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Module'}
          </button>
        </form>
      )}

      {/* Modules List */}
      {selectedYear && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Modules for {selectedYear} ({modules.length})
            </h2>
            {modules.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Export to CSV
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500">Loading modules...</p>
          ) : modules.length === 0 ? (
            <p className="text-gray-500">No modules found for this year.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Code</th>
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-center">Credits</th>
                    <th className="border p-2 text-center">Batch Size</th>
                    <th className="border p-2 text-center">Lectures/Week</th>
                    <th className="border p-2 text-center">Semester</th>
                    <th className="border p-2 text-center">Type</th>
                    <th className="border p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium">{module.code}</td>
                      <td className="border p-2">{module.name}</td>
                      <td className="border p-2 text-center">
                        {module.credits || '-'}
                      </td>
                      <td className="border p-2 text-center">
                        {module.batch_size || '-'}
                      </td>
                      <td className="border p-2 text-center">
                        {module.lectures_per_week || '-'}
                      </td>
                      <td className="border p-2 text-center">
                        {module.semester || '-'}
                      </td>
                      <td className="border p-2 text-center">
                        {module.day_type || '-'}
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() =>
                            handleDeleteModule(module.id, module.code)
                          }
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleManagementByYear;
