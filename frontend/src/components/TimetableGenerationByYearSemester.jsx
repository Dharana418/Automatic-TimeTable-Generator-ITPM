import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wand2,
  CalendarDays,
  GraduationCap,
  Cpu,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import {
  generateTimetableForYearSemester,
  getTimetablesForYearSemester,
  approveTimetable,
  rejectTimetable,
  getAvailableAlgorithms,
  downloadTimetableAsCSV,
} from '../api/timetableGeneration.js';

import {
  getAcademicYears,
  getModulesByYear,
} from '../api/moduleManagement.js';

import { listItems } from '../api/scheduler.js';
import { toast } from 'react-toastify';

/* ---------------- HELPERS ---------------- */

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
  };

  const compact = raw.replace(/[^A-Z0-9]/g, '');
  return aliases[compact] || raw;
};

const inferSpecializationFromModule = (module = {}) => {
  const details = parseJsonSafe(module.details, {});
  const explicit =
    details.specialization ||
    module.specialization ||
    module.department;

  if (explicit) return normalizeSpecialization(explicit);

  const code = String(module.code || '').toUpperCase();
  if (code.startsWith('IT')) return 'IT';
  if (code.startsWith('SE')) return 'SE';
  if (code.startsWith('CS')) return 'CS';

  return 'General';
};

/* ---------------- CONSTANTS ---------------- */

const DEFAULT_SPECIALIZATIONS = ['SE', 'IT', 'CS', 'General'];
const WEEKDAY_FREE_DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MODULE_LIMIT_PER_SPECIALIZATION = 5;

/* ---------------- COMPONENT ---------------- */

const TimetableGenerationByYearSemester = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [modules, setModules] = useState([]);
  const [algorithms, setAlgorithms] = useState(['hybrid']);
  const [timetableName, setTimetableName] = useState('');

  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);

  const [weekdayFreeDay, setWeekdayFreeDay] = useState('Fri');

  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const availableAlgorithms = useMemo(() => getAvailableAlgorithms(), []);

  /* ---------------- FETCH ---------------- */

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await getAcademicYears();
      setAcademicYears(res.data || []);
    } catch {
      setError('Failed to fetch academic years');
    }
  }, []);

  const fetchModules = useCallback(async () => {
    if (!selectedYear) return;

    try {
      setLoadingModules(true);

      const res = await getModulesByYear(selectedYear, selectedSemester);

      const mapped = (res.data || []).map((m) => ({
        ...m,
        specialization: inferSpecializationFromModule(m),
      }));

      setModules(mapped.slice(0, MODULE_LIMIT_PER_SPECIALIZATION));
      toast.success(`Loaded ${mapped.length} modules`);
    } catch {
      setError('Failed to fetch modules');
    } finally {
      setLoadingModules(false);
    }
  }, [selectedYear, selectedSemester]);

  const fetchExisting = useCallback(async () => {
    if (!selectedYear || !selectedSemester) return;

    const res = await getTimetablesForYearSemester(
      selectedYear,
      selectedSemester
    );
    setExistingTimetables(res.data || []);
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  useEffect(() => {
    fetchModules();
    fetchExisting();
  }, [fetchModules, fetchExisting]);

  /* ---------------- HANDLERS ---------------- */

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!selectedYear || !selectedSemester || !timetableName) {
      setError('Fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await generateTimetableForYearSemester(
        selectedYear,
        selectedSemester,
        {
          algorithms,
          timetableName,
          weekdayFreeDay,
        }
      );

      setGeneratedTimetable(res);
      setSuccess('Timetable generated successfully');
      fetchExisting();
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await approveTimetable(id);
    fetchExisting();
  };

  const handleReject = async (id) => {
    await rejectTimetable(id);
    fetchExisting();
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-7xl">
      {/* ALERTS */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 text-red-700 shadow-md">
          <AlertCircle size={20} className="flex-shrink-0 text-red-600" /> 
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-green-50/50 p-4 text-green-700 shadow-md">
          <CheckCircle2 size={20} className="flex-shrink-0 text-green-600" /> 
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* FORM SECTION */}
      <form onSubmit={handleGenerate} className="">
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Configure Your Schedule</h2>
          
          {/* FORM LIST - VERTICAL LAYOUT */}
          <div className="space-y-4 mb-6">
            {/* YEAR SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <CalendarDays size={16} className="inline mr-2" /> Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-sky-300 hover:shadow-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y.academic_year} value={y.academic_year}>
                    {y.academic_year}
                  </option>
                ))}
              </select>
            </div>

            {/* SEMESTER SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <GraduationCap size={16} className="inline mr-2" /> Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-emerald-300 hover:shadow-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            {/* TIMETABLE NAME */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <FileCheck2 size={16} className="inline mr-2" /> Schedule Name
              </label>
              <input
                value={timetableName}
                onChange={(e) => setTimetableName(e.target.value)}
                placeholder="e.g., Y1-Sem1-IT"
                className="w-full rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-md transition-all duration-200 hover:border-violet-300 hover:shadow-lg focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
              />
            </div>

            {/* FREE DAY SELECT */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Wand2 size={16} className="inline mr-2" /> Free Day
              </label>
              <select
                value={weekdayFreeDay}
                onChange={(e) => setWeekdayFreeDay(e.target.value)}
                className="w-full rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 font-semibold text-slate-900 shadow-md transition-all duration-200 hover:border-amber-300 hover:shadow-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              >
                {WEEKDAY_FREE_DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}day</option>
                ))}
              </select>
            </div>

            {/* GENERATE BUTTON */}
            <div className="w-full pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-4 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:from-sky-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Cpu size={22} className="relative" />
                <span className="relative">{loading ? 'Generating...' : 'Generate Schedule'}</span>
              </button>
            </div>
          </div>

          {/* MODULES INFO */}
          {loadingModules && (
            <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-sky-600 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Loading modules...</span>
            </div>
          )}
          
          {modules.length > 0 && !loadingModules && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">
                ✓ {modules.length} modules loaded from Academic Coordinator
              </p>
            </div>
          )}
        </div>
      </form>

      {/* GENERATED TIMETABLE */}
      {generatedTimetable && (
        <div className="mb-8 overflow-hidden rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <div className="border-b-2 border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 p-6">
            <h3 className="text-2xl font-bold text-green-900">✓ Timetable Generated</h3>
            <p className="mt-2 text-sm text-green-700">Schedule ID: <span className="font-mono font-bold">{generatedTimetable.timetableId}</span></p>
          </div>
          <div className="p-6">
            <div className="mb-4 inline-block rounded-full bg-green-200 px-4 py-2 text-sm font-bold text-green-800">
              Ready for review and export
            </div>
            <button
              onClick={() =>
                downloadTimetableAsCSV(
                  generatedTimetable.results?.hybrid?.schedule || [],
                  selectedYear,
                  selectedSemester
                )
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-3 font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-green-600 hover:to-emerald-700"
            >
              <FileCheck2 size={18} />
              Download as CSV
            </button>
          </div>
        </div>
      )}

      {/* EXISTING TIMETABLES */}
      <div className="mt-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Timetable History</h2>

        {existingTimetables.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-600">No timetables generated yet. Create your first schedule above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {existingTimetables.map((t) => (
              <div
                key={t.id}
                className={`overflow-hidden rounded-2xl border-2 shadow-md transition-all duration-300 ${
                  t.status === 'pending'
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
                    : t.status === 'approved'
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100'
                }`}
              >
                <div className={`border-b-2 px-6 py-4 ${
                  t.status === 'pending'
                    ? 'border-amber-300 bg-amber-100/50'
                    : t.status === 'approved'
                    ? 'border-green-300 bg-green-100/50'
                    : 'border-slate-300 bg-slate-100/50'
                }`}>
                  <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">ID: {t.id.slice(0, 8)}...</p>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    {t.status === 'pending' && (
                      <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                        ⏱ Pending Review
                      </span>
                    )}
                    {t.status === 'approved' && (
                      <span className="rounded-full bg-green-200 px-3 py-1 text-xs font-bold text-green-800">
                        ✓ Approved
                      </span>
                    )}
                    {t.status === 'rejected' && (
                      <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-800">
                        ✗ Rejected
                      </span>
                    )}
                  </div>

                  {t.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="flex-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-green-600 hover:to-emerald-700"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(t.id)}
                        className="flex-1 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-red-600 hover:to-orange-700"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableGenerationByYearSemester;