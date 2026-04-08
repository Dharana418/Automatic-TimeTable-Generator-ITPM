import React, { useState, useEffect, useCallback } from 'react';
import {
  generateTimetableForYearSemester,
  getTimetablesForYearSemester,
  approveTimetable,
  rejectTimetable,
  getAvailableAlgorithms,
  downloadTimetableAsCSV,
} from '../api/timetableGeneration.js';
import { getAcademicYears, getModulesByYear } from '../api/moduleManagement.js';
import { toast } from 'react-toastify';

const parseJsonSafe = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSpecialization = (value = '') => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return 'General';

  const aliases = {
    SOFTWAREENGINEERING: 'SE',
    INFORMATIONTECHNOLOGY: 'IT',
    COMPUTERSCIENCE: 'CS',
    INFORMATICS: 'IM',
    INFORMATIONSYSTEMSENGINEERING: 'ISE',
    COMPUTER_SYSTEMS_NETWORK_ENGINEERING: 'CSNE',
    IM: 'IME',
    IE: 'IME',
    CYBERSECURITY: 'CYBER SECURITY',
    CYBER: 'CYBER SECURITY',
  };

  const compact = raw.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || raw;
};

const inferSpecializationFromModule = (module = {}) => {
  const details = parseJsonSafe(module.details, {});
  const explicit =
    details.specialization ||
    details.spec ||
    details.stream ||
    details.department ||
    module.specialization ||
    module.department;

  if (explicit) {
    return normalizeSpecialization(explicit);
  }

  const code = String(module.code || '').toUpperCase();
  if (code.startsWith('IT')) return 'IT';
  if (code.startsWith('SE')) return 'SE';
  if (code.startsWith('CS')) return 'CS';
  if (code.startsWith('IS')) return 'ISE';
  if (code.startsWith('IM') || code.startsWith('IE')) return 'IME';
  if (code.startsWith('CN')) return 'CSNE';
  return 'General';
};

const DEFAULT_SPECIALIZATIONS = ['SE', 'IT', 'CS', 'IME', 'ISE', 'CSNE', 'CYBER SECURITY', 'General'];
const WEEKDAY_FREE_DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const TimetableGenerationByYearSemester = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Generation options
  const [algorithms, setAlgorithms] = useState(['hybrid']);
  const [timetableName, setTimetableName] = useState('');
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);
  const [showExisting, setShowExisting] = useState(false);
  const [modulesFromAcademic, setModulesFromAcademic] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [loadingModules, setLoadingModules] = useState(false);
  const [categoryGenerating, setCategoryGenerating] = useState({});
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [weekdayFreeDay, setWeekdayFreeDay] = useState('Fri');

  const availableAlgorithms = getAvailableAlgorithms();
  const semesters = ['1', '2'];

  const fetchAcademicYears = useCallback(async () => {
    try {
      const response = await getAcademicYears();
      setAcademicYears(response.data || []);
    } catch {
      setError('Failed to fetch academic years');
    }
  }, []);

  const fetchExistingTimetables = useCallback(async (year, semester) => {
    try {
      const response = await getTimetablesForYearSemester(year, semester);
      setExistingTimetables(response.data || []);
    } catch (err) {
      console.error('Error fetching existing timetables:', err);
    }
  }, []);

  const fetchAcademicModules = useCallback(async (year, semester) => {
    if (!year) {
      setModulesFromAcademic([]);
      return;
    }

    try {
      setLoadingModules(true);
      const response = await getModulesByYear(year, semester || null, 'ALL');
      const mapped = (response.data || []).map((module) => ({
        ...module,
        specialization: inferSpecializationFromModule(module),
      }));
      setModulesFromAcademic(mapped);
      toast.success(`Fetched ${mapped.length} module(s) successfully`, {
        autoClose: 2200,
      });
    } catch {
      setError('Failed to fetch modules from Academic Coordinator records');
      setModulesFromAcademic([]);
    } finally {
      setLoadingModules(false);
    }
  }, []);

  // Fetch academic years on mount
  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // Fetch existing timetables when year/semester changes
  useEffect(() => {
    if (selectedYear && selectedSemester) {
      fetchExistingTimetables(selectedYear, selectedSemester);
    }

    if (selectedYear) {
      fetchAcademicModules(selectedYear, selectedSemester);
    } else {
      setModulesFromAcademic([]);
    }
  }, [
    selectedYear,
    selectedSemester,
    fetchExistingTimetables,
    fetchAcademicModules,
  ]);

  useEffect(() => {
    setSelectedSpecialization('ALL');
  }, [selectedYear]);

  const specializationOptions = React.useMemo(() => {
    const values = [...new Set([...DEFAULT_SPECIALIZATIONS, ...modulesFromAcademic.map((m) => m.specialization).filter(Boolean)])];
    return ['ALL', ...values.sort((a, b) => a.localeCompare(b))];
  }, [modulesFromAcademic]);

  const filteredAcademicModules = React.useMemo(() => {
    if (selectedSpecialization === 'ALL') return modulesFromAcademic;
    return modulesFromAcademic.filter((module) => module.specialization === selectedSpecialization);
  }, [modulesFromAcademic, selectedSpecialization]);

  const specializationCategoryRows = React.useMemo(() => {
    const counts = new Map();
    modulesFromAcademic.forEach((module) => {
      const spec = module.specialization || 'General';
      counts.set(spec, (counts.get(spec) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([specialization, moduleCount]) => ({ specialization, moduleCount }))
      .sort((a, b) => a.specialization.localeCompare(b.specialization));
  }, [modulesFromAcademic]);

  const handleAlgorithmChange = (algo) => {
    setAlgorithms((prev) =>
      prev.includes(algo)
        ? prev.filter((a) => a !== algo)
        : [...prev, algo]
    );
  };

  const handleGenerateTimetable = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setGeneratedTimetable(null);

    if (!selectedYear) {
      setError('Please select an academic year');
      return;
    }

    if (!selectedSemester) {
      setError('Please select a semester');
      return;
    }

    if (algorithms.length === 0) {
      setError('Please select at least one algorithm');
      return;
    }

    try {
      setLoading(true);
      const response = await generateTimetableForYearSemester(
        selectedYear,
        selectedSemester,
        {
          algorithms,
          timetableName: timetableName || `Timetable_${selectedYear}_Sem${selectedSemester}`,
          specialization: selectedSpecialization !== 'ALL' ? selectedSpecialization : undefined,
          weekdayFreeDay,
        }
      );

      setGeneratedTimetable(response);
      setSuccess(`Timetable generated successfully! ID: ${response.timetableId}`);
      fetchExistingTimetables(selectedYear, selectedSemester);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to generate timetable'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTimetable = async (timetableId) => {
    if (!window.confirm('Are you sure you want to approve this timetable?')) {
      return;
    }

    try {
      setLoading(true);
      await approveTimetable(timetableId);
      setSuccess('Timetable approved successfully');
      fetchExistingTimetables(selectedYear, selectedSemester);
    } catch {
      setError('Failed to approve timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTimetable = async (timetableId) => {
    const comments = window.prompt('Enter rejection reason (optional):');
    if (comments === null) return;

    try {
      setLoading(true);
      await rejectTimetable(timetableId, comments);
      setSuccess('Timetable rejected');
      fetchExistingTimetables(selectedYear, selectedSemester);
    } catch {
      setError('Failed to reject timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleExportTimetable = (schedule) => {
    if (!schedule || schedule.length === 0) {
      setError('No schedule data to export');
      return;
    }
    downloadTimetableAsCSV(schedule, selectedYear, selectedSemester);
  };

  const handleGenerateByCategory = async (specialization) => {
    if (!selectedYear || !selectedSemester || !specialization) {
      setError('Please select year and semester first.');
      return;
    }

    const key = `${selectedYear}-${selectedSemester}-${specialization}`;
    try {
      setCategoryGenerating((prev) => ({ ...prev, [key]: true }));
      setError(null);

      const response = await generateTimetableForYearSemester(selectedYear, selectedSemester, {
        algorithms,
        timetableName:
          timetableName ||
          `Timetable_Y${selectedYear}_S${selectedSemester}_${specialization.replace(/\s+/g, '_')}`,
        specialization,
        weekdayFreeDay,
      });

      setGeneratedTimetable(response);
      setSuccess(
        `Generated timetable for Year ${selectedYear}, Semester ${selectedSemester}, ${specialization}. ID: ${response.timetableId}`,
      );
      fetchExistingTimetables(selectedYear, selectedSemester);
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Failed to generate for ${specialization}`);
    } finally {
      setCategoryGenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateAllCategories = async () => {
    if (!selectedYear || !selectedSemester) {
      setError('Please select year and semester first.');
      return;
    }

    if (!specializationCategoryRows.length) {
      setError('No specialization categories with modules are available for this year and semester.');
      return;
    }

    try {
      setBulkGenerating(true);
      setError(null);

      for (const row of specializationCategoryRows) {
        await generateTimetableForYearSemester(selectedYear, selectedSemester, {
          algorithms,
          timetableName:
            timetableName ||
            `Timetable_Y${selectedYear}_S${selectedSemester}_${row.specialization.replace(/\s+/g, '_')}`,
          specialization: row.specialization,
          weekdayFreeDay,
        });
      }

      setSuccess(
        `Generated all categories for Year ${selectedYear}, Semester ${selectedSemester} (${specializationCategoryRows.length} specializations).`,
      );
      fetchExistingTimetables(selectedYear, selectedSemester);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed while generating all categories');
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generate Timetable by Specialization, Year & Semester</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Generation Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Generation Options</h2>

            <form onSubmit={handleGenerateTimetable} className="space-y-4">
              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Academic Year *
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Year --</option>
                  {academicYears.map((item) => (
                    <option key={item.academic_year} value={item.academic_year}>
                      {item.academic_year} ({item.module_count} modules)
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Semester *
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Semester --</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialization Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Specialization
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedYear || loadingModules}
                >
                  {specializationOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec === 'ALL' ? 'All Specializations' : spec}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Modules are fetched from Academic Coordinator records for the selected year, semester, and specialization filters.
                </p>
              </div>

              {/* Weekday Free Day */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Weekday Free Day
                </label>
                <select
                  value={weekdayFreeDay}
                  onChange={(e) => setWeekdayFreeDay(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WEEKDAY_FREE_DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Weekday batches will not be scheduled on this day.
                </p>
              </div>

              {/* Timetable Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Timetable Name (Optional)
                </label>
                <input
                  type="text"
                  value={timetableName}
                  onChange={(e) => setTimetableName(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Spring 2025 Final Schedule"
                />
              </div>

              {/* Algorithm Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Scheduling Algorithm(s) *
                </label>
                <div className="space-y-2 bg-gray-50 p-4 rounded">
                  {availableAlgorithms.map((algo) => (
                    <label
                      key={algo.value}
                      className="flex items-center p-2 hover:bg-white rounded"
                    >
                      <input
                        type="checkbox"
                        checked={algorithms.includes(algo.value)}
                        onChange={() => handleAlgorithmChange(algo.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{algo.label}</div>
                        <div className="text-sm text-gray-600">
                          {algo.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || !selectedYear || !selectedSemester}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Generating...' : 'Generate Timetable'}
              </button>
            </form>

            {/* Generated Timetable Summary */}
            {generatedTimetable && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-900 mb-2">
                  ✓ Timetable Generated Successfully
                </h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p>
                    <strong>Timetable ID:</strong> {generatedTimetable.timetableId}
                  </p>
                  <p>
                    <strong>Specialization:</strong>{' '}
                    {selectedSpecialization === 'ALL' ? 'All' : selectedSpecialization}
                  </p>
                  <p>
                    <strong>Modules Scheduled:</strong>{' '}
                    {generatedTimetable.summary?.modulesScheduled || 0}
                  </p>
                  <p>
                    <strong>Halls Used:</strong>{' '}
                    {generatedTimetable.summary?.hallsUsed || 0}
                  </p>
                  <p>
                    <strong>Algorithm:</strong>{' '}
                    {generatedTimetable.summary?.algorithmUsed || 'N/A'}
                  </p>
                </div>

                {generatedTimetable.results && (
                  <button
                    onClick={() =>
                      handleExportTimetable(
                        generatedTimetable.results?.hybrid?.schedule ||
                          generatedTimetable.results?.pso?.schedule ||
                          []
                      )
                    }
                    className="mt-3 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Export to CSV
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 rounded border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-blue-900">
                  Categorized Generation (Year + Semester + Specialization)
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAllCategories}
                  disabled={bulkGenerating || !selectedYear || !selectedSemester || !specializationCategoryRows.length}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {bulkGenerating ? 'Generating all...' : 'Generate All Categories'}
                </button>
              </div>

              {!selectedYear || !selectedSemester ? (
                <p className="text-sm text-blue-800">Select year and semester to show specialization categories.</p>
              ) : specializationCategoryRows.length === 0 ? (
                <p className="text-sm text-blue-800">No specialization categories found for this selection.</p>
              ) : (
                <div className="overflow-x-auto rounded border bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-blue-900">Year</th>
                        <th className="px-3 py-2 text-left font-semibold text-blue-900">Semester</th>
                        <th className="px-3 py-2 text-left font-semibold text-blue-900">Specialization</th>
                        <th className="px-3 py-2 text-left font-semibold text-blue-900">Modules</th>
                        <th className="px-3 py-2 text-left font-semibold text-blue-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specializationCategoryRows.map((row) => {
                        const key = `${selectedYear}-${selectedSemester}-${row.specialization}`;
                        return (
                          <tr key={key} className="border-t">
                            <td className="px-3 py-2">{selectedYear}</td>
                            <td className="px-3 py-2">{selectedSemester}</td>
                            <td className="px-3 py-2 font-medium">{row.specialization}</td>
                            <td className="px-3 py-2">{row.moduleCount}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleGenerateByCategory(row.specialization)}
                                disabled={Boolean(categoryGenerating[key]) || bulkGenerating}
                                className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                              >
                                {categoryGenerating[key] ? 'Generating...' : 'Generate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Existing Timetables */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Academic Coordinator Modules</h3>
              <span className="text-sm text-gray-600">
                {loadingModules ? 'Loading...' : `${filteredAcademicModules.length} module(s)`}
              </span>
            </div>

            {!selectedYear ? (
              <p className="text-gray-500 text-sm">Select year to load modules.</p>
            ) : loadingModules ? (
              <p className="text-gray-500 text-sm">Fetching modules from Academic Coordinator...</p>
            ) : filteredAcademicModules.length === 0 ? (
              <p className="text-gray-500 text-sm">No modules found for the selected filter.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Code</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Module Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Specialization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAcademicModules.map((module) => (
                      <tr key={module.id || `${module.code}-${module.name}`} className="border-t">
                        <td className="px-3 py-2 font-medium text-gray-800">{module.code || 'N/A'}</td>
                        <td className="px-3 py-2 text-gray-700">{module.name || 'Untitled Module'}</td>
                        <td className="px-3 py-2 text-gray-700">{module.specialization || 'General'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Existing Timetables</h3>
            <button
              onClick={() => setShowExisting(!showExisting)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showExisting ? 'Hide' : 'Show'} ({existingTimetables.length})
            </button>
          </div>

          {showExisting && selectedYear && selectedSemester ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {existingTimetables.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No timetables for {selectedYear}, Semester {selectedSemester}
                </p>
              ) : (
                existingTimetables.map((tt) => (
                  <div
                    key={tt.id}
                    className="p-3 border rounded bg-gray-50 text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {tt.name || `Timetable #${tt.id}`}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          tt.status === 'approved'
                            ? 'text-green-600'
                            : tt.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {tt.status}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      Created: {new Date(tt.created_at).toLocaleDateString()}
                    </div>

                    {tt.status === 'pending' && (
                      <div className="mt-2 space-x-1">
                        <button
                          onClick={() => handleApproveTimetable(tt.id)}
                          disabled={loading}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectTimetable(tt.id)}
                          disabled={loading}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : selectedYear && selectedSemester ? (
            <p className="text-gray-500 text-sm">Click Show to view timetables</p>
          ) : (
            <p className="text-gray-500 text-sm">
              Select a year and semester to view timetables
            </p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGenerationByYearSemester;
