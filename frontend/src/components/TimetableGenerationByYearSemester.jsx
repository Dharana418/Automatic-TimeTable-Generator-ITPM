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
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold mb-4">
        Timetable Generator
      </h1>

      {/* ALERTS */}
      {error && (
        <div className="bg-red-100 p-3 mb-3 flex gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 p-3 mb-3 flex gap-2">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">Select Year</option>
          {academicYears.map((y) => (
            <option key={y.academic_year} value={y.academic_year}>
              {y.academic_year}
            </option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="">Select Semester</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>

        <input
          value={timetableName}
          onChange={(e) => setTimetableName(e.target.value)}
          placeholder="Timetable Name"
        />

        <select
          value={weekdayFreeDay}
          onChange={(e) => setWeekdayFreeDay(e.target.value)}
        >
          {WEEKDAY_FREE_DAY_OPTIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <button disabled={loading}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {/* GENERATED */}
      {generatedTimetable && (
        <div className="mt-4 p-4 bg-green-50">
          <p>ID: {generatedTimetable.timetableId}</p>

          <button
            onClick={() =>
              downloadTimetableAsCSV(
                generatedTimetable.results?.hybrid?.schedule || [],
                selectedYear,
                selectedSemester
              )
            }
          >
            Export CSV
          </button>
        </div>
      )}

      {/* EXISTING */}
      <div className="mt-6">
        <h2 className="text-xl font-bold">Existing Timetables</h2>

        {existingTimetables.map((t) => (
          <div key={t.id} className="border p-2 mt-2">
            <p>{t.name}</p>
            <p>{t.status}</p>

            {t.status === 'pending' && (
              <>
                <button onClick={() => handleApprove(t.id)}>
                  Approve
                </button>
                <button onClick={() => handleReject(t.id)}>
                  Reject
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableGenerationByYearSemester;