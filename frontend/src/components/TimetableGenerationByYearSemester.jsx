import React, { useState, useEffect, useCallback } from 'react';
import { Wand2, CalendarDays, GraduationCap, Cpu, FileCheck2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  generateTimetableForYearSemester,
  getTimetablesForYearSemester,
  approveTimetable,
  rejectTimetable,
  getAvailableAlgorithms,
  downloadTimetableAsCSV,
} from '../api/timetableGeneration.js';
import { getAcademicYears, getModulesByYear } from '../api/moduleManagement.js';
import { listItems } from '../api/scheduler.js';
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
const MODULE_LIMIT_PER_SPECIALIZATION = 5;
const DEFAULT_GROUP_OPTIONS = ['ALL'];
const DEFAULT_SUBGROUP_OPTIONS = ['ALL'];

const cardClass = 'rounded-3xl border border-sky-100 bg-white/95 shadow-[0_18px_40px_rgba(14,116,144,0.10)]';
const inputClass = 'w-full rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700';
const helperClass = 'mt-1 text-xs text-slate-500';

const parseBatchScope = (batchId = '') => {
  const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = '', subgroupToken = ''] = String(batchId)
    .trim()
    .split('.');

  const year = Number(String(yearToken).replace(/[^0-9]/g, ''));
  const semester = Number(String(semesterToken).replace(/[^0-9]/g, ''));

  return {
    year: Number.isInteger(year) && year > 0 ? String(year) : '',
    semester: Number.isInteger(semester) && semester > 0 ? String(semester) : '',
    mode: String(modeToken || '').trim().toUpperCase(),
    specialization: normalizeSpecialization(specializationToken || ''),
    group: String(groupToken || '').trim(),
    subgroup: String(subgroupToken || '').trim(),
  };
};

const TimetableGenerationByYearSemester = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Generation options
  const [algorithms, setAlgorithms] = useState(['gemini']);
  const [timetableName, setTimetableName] = useState('');
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);
  const [showExisting, setShowExisting] = useState(false);
  const [modulesFromAcademic, setModulesFromAcademic] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedSubgroup, setSelectedSubgroup] = useState('ALL');
  const [loadingModules, setLoadingModules] = useState(false);
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

  const fetchBatches = useCallback(async () => {
    try {
      const response = await listItems('batches');
      setBatches(response.items || []);
    } catch {
      setBatches([]);
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

      const ordered = [...mapped].sort((left, right) => {
        const leftTime = new Date(left?.created_at || 0).getTime();
        const rightTime = new Date(right?.created_at || 0).getTime();
        return rightTime - leftTime;
      });

      const buckets = new Map();
      ordered.forEach((module) => {
        const spec = module.specialization || 'General';
        if (!buckets.has(spec)) {
          buckets.set(spec, []);
        }
        buckets.get(spec).push(module);
      });

      const limited = [];
      buckets.forEach((bucket) => {
        limited.push(...bucket.slice(0, MODULE_LIMIT_PER_SPECIALIZATION));
      });

      setModulesFromAcademic(limited);
      toast.success(`Fetched ${limited.length} module(s) (${MODULE_LIMIT_PER_SPECIALIZATION} per specialization)`, {
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
    fetchBatches();
  }, [fetchAcademicYears, fetchBatches]);

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
    setSelectedGroup('ALL');
    setSelectedSubgroup('ALL');
  }, [selectedYear]);

  useEffect(() => {
    setSelectedGroup('ALL');
    setSelectedSubgroup('ALL');
  }, [selectedSemester, selectedSpecialization]);

  const specializationOptions = React.useMemo(() => {
    const values = [...new Set([...DEFAULT_SPECIALIZATIONS, ...modulesFromAcademic.map((m) => m.specialization).filter(Boolean)])];
    return ['ALL', ...values.sort((a, b) => a.localeCompare(b))];
  }, [modulesFromAcademic]);

  const filteredAcademicModules = React.useMemo(() => {
    if (selectedSpecialization === 'ALL') return modulesFromAcademic;
    return modulesFromAcademic.filter((module) => module.specialization === selectedSpecialization);
  }, [modulesFromAcademic, selectedSpecialization]);

  const matchingBatchScopes = React.useMemo(() => {
    return batches
      .map((batch) => parseBatchScope(batch?.id || batch?.name || ''))
      .filter((scope) => {
        if (!scope.year || !scope.semester) return false;
        if (selectedYear && scope.year !== String(selectedYear)) return false;
        if (selectedSemester && scope.semester !== String(selectedSemester)) return false;
        if (selectedSpecialization !== 'ALL' && scope.specialization !== selectedSpecialization) return false;
        return true;
      });
  }, [batches, selectedYear, selectedSemester, selectedSpecialization]);

  const groupOptions = React.useMemo(() => {
    const groups = [...new Set(matchingBatchScopes.map((scope) => scope.group).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return groups.length ? ['ALL', ...groups] : DEFAULT_GROUP_OPTIONS;
  }, [matchingBatchScopes]);

  const subgroupOptions = React.useMemo(() => {
    const scoped = selectedGroup === 'ALL'
      ? matchingBatchScopes
      : matchingBatchScopes.filter((scope) => scope.group === selectedGroup);
    const subgroups = [...new Set(scoped.map((scope) => scope.subgroup).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return subgroups.length ? ['ALL', ...subgroups] : DEFAULT_SUBGROUP_OPTIONS;
  }, [matchingBatchScopes, selectedGroup]);

  useEffect(() => {
    if (!groupOptions.includes(selectedGroup)) {
      setSelectedGroup('ALL');
    }
  }, [groupOptions, selectedGroup]);

  useEffect(() => {
    if (!subgroupOptions.includes(selectedSubgroup)) {
      setSelectedSubgroup('ALL');
    }
  }, [subgroupOptions, selectedSubgroup]);

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

    if (!String(timetableName || '').trim()) {
      setError('Timetable name is required');
      return;
    }

    try {
      setLoading(true);
      const resolvedTimetableName = String(timetableName).trim();

      const response = await generateTimetableForYearSemester(
        selectedYear,
        selectedSemester,
        {
          algorithms,
          timetableName: resolvedTimetableName,
          specialization: selectedSpecialization !== 'ALL' ? selectedSpecialization : undefined,
          group: selectedGroup !== 'ALL' ? selectedGroup : undefined,
          subgroup: selectedSubgroup !== 'ALL' ? selectedSubgroup : undefined,
          weekdayFreeDay,
          moduleLimitPerSpecialization: MODULE_LIMIT_PER_SPECIALIZATION,
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

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 rounded-3xl border border-sky-100/80 bg-gradient-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-[0_14px_30px_rgba(14,116,144,0.12)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 p-2.5 text-white shadow-lg shadow-sky-200">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Generate Timetable by Specialization, Year & Semester</h1>
            <p className="mt-1 text-sm text-slate-600">Create elegant, conflict-aware timetables with specialization, subgroup, semester, and hall-aware filtering.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel: Generation Form */}
        <div className="lg:col-span-2">
          <div className={`${cardClass} p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <FileCheck2 className="h-6 w-6 text-indigo-600" />
                Generation Options
              </h2>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">Academic Planner</span>
            </div>

            <form onSubmit={handleGenerateTimetable} className="space-y-4">
              {/* Year Selection */}
              <div>
                <label className={labelClass}>
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  Academic Year *
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={inputClass}
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
                <label className={labelClass}>
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Semester *
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className={inputClass}
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
                <label className={labelClass}>
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Specialization
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className={inputClass}
                  disabled={!selectedYear || loadingModules}
                >
                  {specializationOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec === 'ALL' ? 'All Specializations' : spec}
                    </option>
                  ))}
                </select>
                <p className={helperClass}>
                  Modules are fetched from Academic Coordinator records with a cap of {MODULE_LIMIT_PER_SPECIALIZATION} modules per specialization for the selected year and semester.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className={inputClass}
                  disabled={!selectedYear || !selectedSemester}
                >
                  {groupOptions.map((group) => (
                    <option key={group} value={group}>
                      {group === 'ALL' ? 'All Groups' : `Group ${group}`}
                    </option>
                  ))}
                </select>
                <p className={helperClass}>
                  Filter available groups by selected year, semester, and specialization.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Subgroup
                </label>
                <select
                  value={selectedSubgroup}
                  onChange={(e) => setSelectedSubgroup(e.target.value)}
                  className={inputClass}
                  disabled={!selectedYear || !selectedSemester}
                >
                  {subgroupOptions.map((subgroup) => (
                    <option key={subgroup} value={subgroup}>
                      {subgroup === 'ALL' ? 'All Subgroups' : `Subgroup ${subgroup}`}
                    </option>
                  ))}
                </select>
                <p className={helperClass}>
                  Generate timetable per subgroup within the selected specialization and semester.
                </p>
              </div>

              {/* Weekday Free Day */}
              <div>
                <label className={labelClass}>
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  Weekday Free Day
                </label>
                <select
                  value={weekdayFreeDay}
                  onChange={(e) => setWeekdayFreeDay(e.target.value)}
                  className={inputClass}
                >
                  {WEEKDAY_FREE_DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <p className={helperClass}>
                  Weekday batches will not be scheduled on this day.
                </p>
              </div>

              {/* Timetable Name */}
              <div>
                <label className={labelClass}>
                  <FileCheck2 className="h-4 w-4 text-sky-600" />
                  Timetable Name *
                </label>
                <input
                  type="text"
                  value={timetableName}
                  onChange={(e) => setTimetableName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Required: e.g., Semester1_Weekday_Final"
                />
              </div>

              {/* Algorithm Selection */}
              <div>
                <label className={labelClass}>
                  <Cpu className="h-4 w-4 text-sky-600" />
                  Scheduling Algorithm(s) *
                </label>
                <div className="space-y-2 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                  {availableAlgorithms.map((algo) => (
                    <label
                      key={algo.value}
                      className="flex items-center rounded-lg border border-transparent bg-white p-2 transition hover:border-sky-200 hover:bg-sky-50"
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
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(8,145,178,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate Timetable'}
              </button>
            </form>

            {/* Generated Timetable Summary */}
            {generatedTimetable && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="mb-2 font-semibold text-emerald-900">
                  ✓ Timetable Generated Successfully
                </h3>
                <div className="space-y-1 text-sm text-emerald-800">
                  <p>
                    <strong>Timetable ID:</strong> {generatedTimetable.timetableId}
                  </p>
                  <p>
                    <strong>Specialization:</strong>{' '}
                    {selectedSpecialization === 'ALL' ? 'All' : selectedSpecialization}
                  </p>
                  <p>
                    <strong>Subgroup:</strong>{' '}
                    {selectedSubgroup === 'ALL' ? 'All' : selectedSubgroup}
                  </p>
                  <p>
                    <strong>Group:</strong>{' '}
                    {selectedGroup === 'ALL' ? 'All' : selectedGroup}
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
                    className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Export to CSV
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Panel: Existing Timetables */}
        <div className="space-y-6">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-slate-900">Academic Coordinator Modules</h3>
              <span className="text-sm text-slate-600">
                {loadingModules ? 'Loading...' : `${filteredAcademicModules.length} module(s)`}
              </span>
            </div>

            {!selectedYear ? (
              <p className="text-sm text-slate-500">Select year to load modules.</p>
            ) : loadingModules ? (
              <p className="text-sm text-slate-500">Fetching modules from Academic Coordinator...</p>
            ) : filteredAcademicModules.length === 0 ? (
              <p className="text-sm text-slate-500">No modules found for the selected filter.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Code</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Module Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Specialization</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Preferred Hall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAcademicModules.map((module) => (
                      <tr key={module.id || `${module.code}-${module.name}`} className="border-t">
                        <td className="px-3 py-2 font-medium text-slate-800">{module.code || 'N/A'}</td>
                        <td className="px-3 py-2 text-slate-700">{module.name || 'Untitled Module'}</td>
                        <td className="px-3 py-2 text-slate-700">{module.specialization || 'General'}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {parseJsonSafe(module.details, {}).preferredHallIds?.[0] || 'Auto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={`${cardClass} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Existing Timetables</h3>
            <button
              onClick={() => setShowExisting(!showExisting)}
              className="text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              {showExisting ? 'Hide' : 'Show'} ({existingTimetables.length})
            </button>
          </div>

          {showExisting && selectedYear && selectedSemester ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {existingTimetables.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No timetables for {selectedYear}, Semester {selectedSemester}
                </p>
              ) : (
                existingTimetables.map((tt) => (
                  <div
                    key={tt.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm"
                  >
                    <div className="font-medium text-slate-900">
                      {tt.name || `Timetable #${tt.id}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          tt.status === 'approved'
                            ? 'text-emerald-700'
                            : tt.status === 'rejected'
                            ? 'text-rose-700'
                            : 'text-amber-700'
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
