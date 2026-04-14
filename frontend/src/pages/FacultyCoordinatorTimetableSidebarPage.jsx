import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import schedulerApi from '../api/scheduler.js';
import { downloadTimetableAsCSV } from '../api/timetableGeneration.js';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const INSTITUTION_NAME = 'Sri Lanka Institute of Information Technology';
const WEEKDAY_CLASS_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '13:30-14:30',
  '14:30-15:30',
  '15:30-16:30',
  '16:30-17:30',
];
const WEEKEND_CLASS_SLOTS = [
  ...WEEKDAY_CLASS_SLOTS,
  '17:30-18:30',
  '18:30-19:30',
  '19:30-20:30',
];

const toTimelineLabel = (slot = '') => String(slot || '').replace('-', ' - ');

const buildCampusTimeline = (mode = 'ALL') => {
  const slots = mode === 'WE' ? WEEKEND_CLASS_SLOTS : mode === 'WD' ? WEEKDAY_CLASS_SLOTS : WEEKEND_CLASS_SLOTS;
  return [
    ...slots.slice(0, 3).map((slot) => ({ type: 'class', slot, label: toTimelineLabel(slot) })),
    { type: 'break', slot: '12:30-13:30', label: 'Interval 12:30 - 13:30' },
    ...slots.slice(3).map((slot) => ({ type: 'class', slot, label: toTimelineLabel(slot) })),
  ];
};

const normalizeDay = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'TBA';
  const map = {
    monday: 'Mon',
    mon: 'Mon',
    tuesday: 'Tue',
    tue: 'Tue',
    wednesday: 'Wed',
    wed: 'Wed',
    thursday: 'Thu',
    thu: 'Thu',
    friday: 'Fri',
    fri: 'Fri',
    saturday: 'Sat',
    sat: 'Sat',
    sunday: 'Sun',
    sun: 'Sun',
  };
  return map[raw] || String(value);
};

const normalizeSlot = (row) => {
  const rawSlot = row?.slot || row?.timeSlot || (Array.isArray(row?.slots) ? row.slots.join(' | ') : '');
  const slotText = String(rawSlot || '').trim();
  if (!slotText) return 'TBA';

  // Align stored scheduler slot labels to campus-facing timeline labels.
  if (slotText === '13:00-14:00') return '13:30-14:30';
  if (slotText === '14:00-15:00') return '14:30-15:30';
  if (slotText === '12:00-13:00') return '12:30-13:30';
  if (slotText === '12:30-13:30') return '12:30-13:30';

  if (/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(slotText)) {
    return slotText.replace(/\s+/g, '');
  }

  return 'TBA';
};

const extractBatchKeys = (row) => {
  if (Array.isArray(row?.batchKeys) && row.batchKeys.length) return row.batchKeys;
  if (row?.batchKey) return [row.batchKey];
  return ['UNASSIGNED'];
};

const extractGroupIdentity = (batchKey = '') => {
  const tokens = String(batchKey || '').trim().split('.');
  if (tokens.length >= 6) {
    return {
      groupKey: tokens.slice(0, 5).join('.'),
      subgroup: tokens[5],
    };
  }

  return {
    groupKey: String(batchKey || 'UNASSIGNED'),
    subgroup: '-',
  };
};

const extractYearSemesterKey = (batchKey) => {
  const text = String(batchKey || '').toUpperCase();
  const match = text.match(/Y(\d)\.S(\d)/);
  if (match) return `Y${match[1]}S${match[2]}`;
  return 'UNSPECIFIED';
};

const extractBatchMode = (batchKey = '') => {
  const tokens = String(batchKey || '').trim().split('.');
  const mode = String(tokens[2] || '').toUpperCase();
  if (mode === 'WD' || mode === 'WE') return mode;
  return 'ANY';
};

const parseBatchMeta = (batchKey = '') => {
  const tokens = String(batchKey || '').trim().split('.');
  return {
    yearSemester: tokens.length >= 2 ? `${tokens[0]}.${tokens[1]}` : 'Y?.S?',
    specialization: tokens.length >= 4 ? tokens[3] : 'GENERAL',
    group: tokens.length >= 5 ? tokens[4] : '--',
  };
};

const parseSchedule = (timetable) => {
  const rawData = timetable?.data;
  if (!rawData) return [];

  const pickScheduleFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return [];

    if (Array.isArray(obj.schedule)) return obj.schedule;

    if (Array.isArray(obj.groupedSchedules)) {
      return obj.groupedSchedules.flatMap((group) => {
        if (Array.isArray(group?.entries)) return group.entries;
        if (Array.isArray(group?.schedule)) return group.schedule;
        return [];
      });
    }

    const allResults = obj.allResults || obj.results || null;
    if (allResults && typeof allResults === 'object') {
      const prioritizedKeys = ['hybrid', 'pso', 'genetic', 'ant', 'tabu'];
      for (const key of prioritizedKeys) {
        if (Array.isArray(allResults?.[key]?.schedule)) {
          return allResults[key].schedule;
        }
      }

      for (const value of Object.values(allResults)) {
        if (Array.isArray(value?.schedule)) {
          return value.schedule;
        }
      }
    }

    return [];
  };

  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      return pickScheduleFromObject(parsed);
    } catch {
      return [];
    }
  }

  if (typeof rawData === 'object' && rawData !== null) {
    return pickScheduleFromObject(rawData);
  }

  return [];
};

const parseTimetableData = (rawData) => {
  if (!rawData) return {};
  if (typeof rawData === 'object') return rawData;

  if (typeof rawData === 'string') {
    try {
      return JSON.parse(rawData);
    } catch {
      return {};
    }
  }

  return {};
};

const extractTimetableMeta = (timetable = {}) => {
  const data = parseTimetableData(timetable.data);
  const scope = data.scope || data.timetableScope || {};
  const year = String(timetable.year || scope.year || data.academicYear || data.year || '').trim();
  const semester = String(timetable.semester || scope.semester || data.semester || '').trim();
  const specialization = String(scope.specialization || data.specialization || 'ALL').trim() || 'ALL';
  const group = String(scope.group || data.group || '').trim();
  const subgroup = String(scope.subgroup || data.subgroup || '').trim();

  return {
    year: year || 'ALL',
    semester: semester || 'ALL',
    specialization: specialization.toUpperCase(),
    group: group || 'ALL',
    subgroup: subgroup || 'ALL',
  };
};

const buildBatchTable = (scheduleRows = []) => {
  const batchMap = new Map();

  scheduleRows.forEach((row) => {
    const day = normalizeDay(row.day);
    const slot = normalizeSlot(row);

    extractBatchKeys(row).forEach((batchKey) => {
      const identity = extractGroupIdentity(batchKey);
      const key = String(identity.groupKey || 'UNASSIGNED');
      if (!batchMap.has(key)) {
        batchMap.set(key, { batchKey: key, subgroupSet: new Set(), entries: [] });
      }
      if (identity.subgroup && identity.subgroup !== '-') {
        batchMap.get(key).subgroupSet.add(identity.subgroup);
      }
      batchMap.get(key).entries.push({
        module: row.moduleName || row.moduleId || 'Module',
        hall: row.hallName || row.hallId || 'Hall TBA',
        instructor: row.instructorName || row.instructorId || 'Instructor TBA',
        day,
        slot,
      });
    });
  });

  const batches = Array.from(batchMap.values()).map((batch) => {
    const days = [...DAY_ORDER];

    const slots = [...WEEKEND_CLASS_SLOTS];

    const cellMap = new Map();
    batch.entries.forEach((entry) => {
      const idx = `${entry.slot}::${entry.day}`;
      if (!cellMap.has(idx)) cellMap.set(idx, []);
      cellMap.get(idx).push(entry);
    });

    return {
      batchKey: batch.batchKey,
      mode: extractBatchMode(batch.batchKey),
      subgroupLabel: batch.subgroupSet.size
        ? Array.from(batch.subgroupSet).sort((a, b) => a.localeCompare(b)).join(', ')
        : '-',
      yearSemester: extractYearSemesterKey(batch.batchKey),
      days,
      slots,
      cellMap,
    };
  });

  return batches.sort((a, b) => a.batchKey.localeCompare(b.batchKey));
};

const buildUnifiedTable = (scheduleRows = [], dayModeFilter = 'WD') => {
  const cellMap = new Map();
  const dedupe = new Set();

  scheduleRows.forEach((row) => {
    const day = normalizeDay(row.day);
    const slot = normalizeSlot(row);
    const rawBatchKeys = extractBatchKeys(row);

    const filteredBatchKeys = rawBatchKeys.filter((key) => {
      if (dayModeFilter === 'ALL') return true;
      return extractBatchMode(key) === dayModeFilter;
    });

    const batchKeysToUse = filteredBatchKeys.length ? filteredBatchKeys : (dayModeFilter === 'ALL' ? rawBatchKeys : []);

    batchKeysToUse.forEach((batchKey) => {
      const groupIdentity = extractGroupIdentity(batchKey);
      const meta = parseBatchMeta(batchKey);
      const uniqueKey = `${slot}::${day}::${groupIdentity.groupKey}::${row.moduleId || row.moduleName || ''}`;
      if (dedupe.has(uniqueKey)) return;
      dedupe.add(uniqueKey);

      const cellKey = `${slot}::${day}`;
      if (!cellMap.has(cellKey)) {
        cellMap.set(cellKey, []);
      }

      cellMap.get(cellKey).push({
        module: row.moduleName || row.moduleId || 'Module',
        hall: row.hallName || row.hallId || 'Hall TBA',
        instructor: row.instructorName || row.instructorId || 'Instructor TBA',
        yearSemester: meta.yearSemester,
        specialization: meta.specialization,
        group: meta.group,
      });
    });
  });

  return {
    days: [...DAY_ORDER],
    // Use the complete campus timeline slot set for unified rendering.
    slots: [...WEEKEND_CLASS_SLOTS],
    cellMap,
  };
};

const FacultyCoordinatorTimetableSidebarPage = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [generateYear, setGenerateYear] = useState('1');
  const [generateSemester, setGenerateSemester] = useState('1');
  const [generateName, setGenerateName] = useState('');
  const [generatePending, setGeneratePending] = useState(false);
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterSpecialization, setFilterSpecialization] = useState('ALL');
  const [dayModeFilter, setDayModeFilter] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState('unified');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await schedulerApi.getAcademicCoordinatorTimetables();
        const list = Array.isArray(response?.data) ? response.data : [];
        if (!mounted) return;

        const withDate = list
          .map((item) => ({ ...item, created_at: item.created_at || item.updated_at || null }))
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        setTimetables(withDate);
        const firstWithSchedule = withDate.find((tt) => parseSchedule(tt).length > 0);
        const defaultTimetable = firstWithSchedule || withDate[0] || null;
        setSelectedId(defaultTimetable?.id ? String(defaultTimetable.id) : '');
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load timetables');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const generateTimetableNow = async () => {
    try {
      setGeneratePending(true);
      setError('');

      const name = String(generateName || '').trim() || `Generated_Y${generateYear}_S${generateSemester}_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`;
      const response = await schedulerApi.runSchedulerForYearSemester({
        academicYear: Number(generateYear),
        semester: Number(generateSemester),
        algorithms: ['hybrid'],
        options: {
          moduleLimitPerSpecialization: 5,
          specialization: filterSpecialization !== 'ALL' ? filterSpecialization : undefined,
        },
        timetableName: name,
      });

      const listResponse = await schedulerApi.getAcademicCoordinatorTimetables();
      const list = Array.isArray(listResponse?.data) ? listResponse.data : [];
      const withDate = list
        .map((item) => ({ ...item, created_at: item.created_at || item.updated_at || null }))
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setTimetables(withDate);
      if (response?.timetableId) {
        setSelectedId(String(response.timetableId));
      } else if (withDate[0]?.id) {
        setSelectedId(String(withDate[0].id));
      }
    } catch (err) {
      setError(err?.message || 'Failed to generate timetable on this page');
    } finally {
      setGeneratePending(false);
    }
  };

  const yearOptions = useMemo(() => {
    const values = [...new Set(timetables.map((tt) => extractTimetableMeta(tt).year).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return ['ALL', ...values];
  }, [timetables]);

  const semesterOptions = useMemo(() => {
    const scoped = timetables.filter((tt) => {
      if (filterYear === 'ALL') return true;
      return extractTimetableMeta(tt).year === filterYear;
    });
    const values = [...new Set(scoped.map((tt) => extractTimetableMeta(tt).semester).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return ['ALL', ...values];
  }, [timetables, filterYear]);

  const specializationOptions = useMemo(() => {
    const scoped = timetables.filter((tt) => {
      const meta = extractTimetableMeta(tt);
      if (filterYear !== 'ALL' && meta.year !== filterYear) return false;
      if (filterSemester !== 'ALL' && meta.semester !== filterSemester) return false;
      return true;
    });
    const values = [...new Set(scoped.map((tt) => extractTimetableMeta(tt).specialization).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return ['ALL', ...values];
  }, [timetables, filterYear, filterSemester]);

  const filteredTimetables = useMemo(() => {
    return timetables.filter((tt) => {
      const meta = extractTimetableMeta(tt);
      if (filterYear !== 'ALL' && meta.year !== filterYear) return false;
      if (filterSemester !== 'ALL' && meta.semester !== filterSemester) return false;
      if (filterSpecialization !== 'ALL' && meta.specialization !== filterSpecialization) return false;
      return true;
    });
  }, [timetables, filterYear, filterSemester, filterSpecialization]);

  useEffect(() => {
    if (!yearOptions.includes(filterYear)) {
      setFilterYear('ALL');
    }
  }, [yearOptions, filterYear]);

  useEffect(() => {
    if (!semesterOptions.includes(filterSemester)) {
      setFilterSemester('ALL');
    }
  }, [semesterOptions, filterSemester]);

  useEffect(() => {
    if (!specializationOptions.includes(filterSpecialization)) {
      setFilterSpecialization('ALL');
    }
  }, [specializationOptions, filterSpecialization]);

  const selectedTimetable = useMemo(() => {
    if (!selectedId) return null;
    return filteredTimetables.find((tt) => String(tt.id) === String(selectedId)) || null;
  }, [selectedId, filteredTimetables]);

  const schedule = useMemo(() => parseSchedule(selectedTimetable), [selectedTimetable]);

  const batchTables = useMemo(() => buildBatchTable(schedule), [schedule]);
  const unifiedTable = useMemo(() => buildUnifiedTable(schedule, dayModeFilter), [schedule, dayModeFilter]);

  const filteredBatchTables = useMemo(() => {
    if (dayModeFilter === 'ALL') return batchTables;
    return batchTables.filter((batch) => batch.mode === dayModeFilter);
  }, [batchTables, dayModeFilter]);

  const groupedByYearSemester = useMemo(() => {
    const map = new Map();
    filteredBatchTables.forEach((batch) => {
      if (!map.has(batch.yearSemester)) {
        map.set(batch.yearSemester, []);
      }
      map.get(batch.yearSemester).push(batch);
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredBatchTables]);

  const activeTimeline = useMemo(() => buildCampusTimeline(dayModeFilter), [dayModeFilter]);

  const insightMetrics = useMemo(() => {
    const uniqueModules = new Set(schedule.map((row) => row.moduleName || row.moduleId || 'Module')).size;
    const uniqueGroups = new Set(filteredBatchTables.map((batch) => batch.batchKey)).size;
    const generatedAt = selectedTimetable?.created_at
      ? new Date(selectedTimetable.created_at).toLocaleString()
      : 'Not selected';

    return {
      timetables: filteredTimetables.length,
      modules: uniqueModules,
      groups: uniqueGroups,
      generatedAt,
    };
  }, [filteredTimetables.length, filteredBatchTables, schedule, selectedTimetable]);

  useEffect(() => {
    if (!filteredTimetables.length) {
      setSelectedId('');
      return;
    }

    const found = filteredTimetables.some((tt) => String(tt.id) === String(selectedId));
    if (!found) {
      setSelectedId(String(filteredTimetables[0].id));
    }
  }, [filteredTimetables, selectedId]);

  useEffect(() => {
    const requestedTimetableId = String(searchParams.get('timetableId') || '').trim();
    if (!requestedTimetableId || !filteredTimetables.length) return;

    const found = filteredTimetables.some((tt) => String(tt.id) === requestedTimetableId);
    if (found && String(selectedId) !== requestedTimetableId) {
      setSelectedId(requestedTimetableId);
    }
  }, [searchParams, filteredTimetables, selectedId]);

  useEffect(() => {
    if (!schedule.length) return;
    if (!filteredBatchTables.length && dayModeFilter !== 'ALL') {
      setDayModeFilter('ALL');
    }
  }, [dayModeFilter, filteredBatchTables.length, schedule.length]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Timetable Sidebar View"
      subtitle="FET-style student timetable view by year, semester, and batch"
      badge="Timetable Report"
      backgroundImage={facultyDashboardBg}
      footerNote="Faculty Coordinator timetable report view"
      sidebarTheme="timetable"
    >
      <div id="top" className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-[0_20px_45px_rgba(14,116,144,0.12)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_70%)]" />
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Creative Timetable Studio</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Timetable View Intelligence Panel</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Explore generated timetables by year, semester, and specialization with a dynamic master grid and grouped academic layouts.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700">{insightMetrics.timetables} filtered timetable(s)</span>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">{dayModeFilter === 'WD' ? 'Weekday Mode' : dayModeFilter === 'WE' ? 'Weekend Mode' : 'All Batch Modes'}</span>
                <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-700">Layout: {layoutMode === 'unified' ? 'Master View' : 'Grouped View'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Modules</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{insightMetrics.modules}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Groups</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{insightMetrics.groups}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last Generated</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{insightMetrics.generatedAt}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Institution Name</h2>
              <p className="mt-2 text-base font-semibold text-slate-900">{INSTITUTION_NAME}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Comments</h2>
              <p className="mt-2 text-base text-slate-800">Default comments</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Select Saved Timetable</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || !filteredTimetables.length}
              >
                {!filteredTimetables.length && <option value="">No filtered timetables available</option>}
                {filteredTimetables.map((tt) => (
                  <option key={tt.id} value={String(tt.id)}>
                    {tt.name || `Timetable #${tt.id}`} - {tt.status || 'pending'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!selectedTimetable) return;
                  downloadTimetableAsCSV(
                    schedule,
                    extractTimetableMeta(selectedTimetable).year,
                    extractTimetableMeta(selectedTimetable).semester,
                    extractTimetableMeta(selectedTimetable).group,
                    extractTimetableMeta(selectedTimetable).subgroup
                  );
                }}
                disabled={!selectedTimetable || !schedule.length}
                className="rounded-xl border border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:border-slate-300 disabled:from-slate-300 disabled:to-slate-400"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => navigate('/scheduler/by-year')}
                className="rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:from-slate-200 hover:to-slate-50"
              >
                View Generator
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:from-slate-200 hover:to-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 via-white to-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Generate On This Page</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
              <select
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900"
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              <select
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900"
                value={generateSemester}
                onChange={(e) => setGenerateSemester(e.target.value)}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <input
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                placeholder="Timetable name (optional)"
                value={generateName}
                onChange={(e) => setGenerateName(e.target.value)}
              />
              <button
                type="button"
                onClick={generateTimetableNow}
                disabled={generatePending}
                className="rounded-xl border border-sky-600 bg-gradient-to-r from-sky-600 to-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:bg-slate-400"
              >
                {generatePending ? 'Generating...' : 'Generate Timetable'}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 via-white to-slate-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Display Generated Timetables</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year === 'ALL' ? 'All Years' : `Year ${year}`}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900"
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
              >
                {semesterOptions.map((semester) => (
                  <option key={semester} value={semester}>{semester === 'ALL' ? 'All Semesters' : `Semester ${semester}`}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900"
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
              >
                {specializationOptions.map((spec) => (
                  <option key={spec} value={spec}>{spec === 'ALL' ? 'All Specializations' : spec}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                {filteredTimetables.length} timetable(s)
              </span>
              {filterYear !== 'ALL' && <span className="rounded-full border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-1 text-xs text-slate-700">Year {filterYear}</span>}
              {filterSemester !== 'ALL' && <span className="rounded-full border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-1 text-xs text-slate-700">Semester {filterSemester}</span>}
              {filterSpecialization !== 'ALL' && <span className="rounded-full border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-1 text-xs text-slate-700">{filterSpecialization}</span>}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
              {filteredTimetables.slice(0, 9).map((tt) => {
                const meta = extractTimetableMeta(tt);
                const active = String(selectedId) === String(tt.id);
                return (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => setSelectedId(String(tt.id))}
                    className={`rounded-xl border px-3 py-3 text-left transition ${active ? 'border-sky-500 bg-sky-100/70 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50'}`}
                  >
                    <p className="truncate text-sm font-semibold text-slate-900">{tt.name || `Timetable #${tt.id}`}</p>
                    <p className="mt-1 text-xs text-slate-600">Y{meta.year} • S{meta.semester} • {meta.specialization} • G{meta.group} • SG{meta.subgroup}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-slate-500">{tt.status || 'pending'}</p>
                  </button>
                );
              })}
              {!filteredTimetables.length && (
                <div className="rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-4 text-sm text-slate-600">
                  No generated timetables match this filter.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Batch Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                value={dayModeFilter}
                onChange={(e) => setDayModeFilter(e.target.value)}
              >
                <option value="WD">Weekday Batches</option>
                <option value="WE">Weekend Batches</option>
                <option value="ALL">All Batches</option>
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => setDayModeFilter('WD')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${dayModeFilter === 'WD' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-gradient-to-r from-slate-100 to-white text-slate-700'}`}
              >
                Weekday
              </button>
              <button
                type="button"
                onClick={() => setDayModeFilter('WE')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${dayModeFilter === 'WE' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-gradient-to-r from-slate-100 to-white text-slate-700'}`}
              >
                Weekend
              </button>
              <button
                type="button"
                onClick={() => setDayModeFilter('ALL')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${dayModeFilter === 'ALL' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-gradient-to-r from-slate-100 to-white text-slate-700'}`}
              >
                All
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Layout</span>
            <button
              type="button"
              onClick={() => setLayoutMode('unified')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${layoutMode === 'unified' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-gradient-to-r from-slate-100 to-white text-slate-700'}`}
            >
              One Master Timetable
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grouped')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${layoutMode === 'grouped' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-gradient-to-r from-slate-100 to-white text-slate-700'}`}
            >
              Group Timetables
            </button>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-600">Loading timetable data...</p>}
          {!loading && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {!loading && !!selectedTimetable && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Active Timetable Context</p>
              <p className="mt-1 text-sm text-slate-800">
                  {selectedTimetable.name || `Timetable #${selectedTimetable.id}`} • Year {extractTimetableMeta(selectedTimetable).year} • Semester {extractTimetableMeta(selectedTimetable).semester} • {extractTimetableMeta(selectedTimetable).specialization} • Group {extractTimetableMeta(selectedTimetable).group} • Subgroup {extractTimetableMeta(selectedTimetable).subgroup}
              </p>
            </div>
          )}
        </section>

        {!loading && !!selectedTimetable && layoutMode === 'unified' && (
          <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-cyan-50/70 p-4 shadow-[0_16px_40px_rgba(5,150,105,0.14)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-bold text-slate-900">Unified Timetable (All Modules)</h4>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {dayModeFilter === 'WD' ? 'Weekday' : dayModeFilter === 'WE' ? 'Weekend' : 'All'}
              </span>
            </div>

            <div className="overflow-x-auto">
              {!schedule.length ? (
                <div className="rounded-lg border border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                  No timetable rows found for this generated timetable.
                </div>
              ) : (
              <table className="min-w-full border-collapse text-sm" border="1">
                <caption className="caption-top border border-slate-300 border-b-0 bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-800">
                  {INSTITUTION_NAME}
                </caption>
                <thead>
                  <tr>
                    <td className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-3 py-2" rowSpan={2} />
                    <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-800" colSpan={Math.max(unifiedTable.days.length, 1)}>
                      Master Module Timetable
                    </th>
                  </tr>
                  <tr>
                    {unifiedTable.days.map((day) => (
                      <th key={day} className="border border-slate-300 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-700">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTimeline.map((timelineRow) => {
                    if (timelineRow.type === 'break') {
                      return (
                        <tr key={timelineRow.slot}>
                          <td className="sticky left-0 z-10 border border-slate-300 bg-amber-100 px-3 py-2 font-semibold text-amber-900">
                            {timelineRow.label}
                          </td>
                          <td className="border border-slate-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-amber-800" colSpan={Math.max(unifiedTable.days.length, 1)}>
                            Campus Interval (No Lectures)
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={timelineRow.slot}>
                        <td className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                          {timelineRow.label}
                        </td>
                        {unifiedTable.days.map((day) => {
                          const key = `${timelineRow.slot}::${day}`;
                          const entries = unifiedTable.cellMap.get(key) || [];
                          return (
                            <td key={key} className="border border-slate-300 bg-white px-2 py-2 align-top">
                              {!entries.length ? (
                                <span className="text-[11px] text-slate-400">-</span>
                              ) : (
                                <div className="space-y-2">
                                  {entries.map((entry, idx) => (
                                    <div key={`${entry.module}-${entry.group}-${idx}`} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1">
                                      <p className="text-xs font-semibold text-slate-900">{entry.module}</p>
                                      <p className="text-[11px] text-slate-600">{entry.yearSemester} • {entry.specialization} • G{entry.group}</p>
                                      <p className="text-[11px] text-slate-600">{entry.hall}</p>
                                      <p className="text-[11px] text-slate-500">{entry.instructor}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
          </section>
        )}

        {!loading && !!selectedTimetable && layoutMode === 'grouped' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-bold text-slate-900">Table of Contents</h3>
            {!groupedByYearSemester.length ? (
              <p className="mt-3 text-sm text-slate-600">
                No timetable rows for the selected batch type. Try selecting All Batches.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-700">
                {groupedByYearSemester.map(([yearSemester, batches]) => (
                  <li key={yearSemester}>
                    <p className="font-semibold text-slate-900">Year {yearSemester}</p>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      {batches.map((batch) => (
                        <li key={batch.batchKey}>
                          <a className="text-blue-700 hover:underline" href={`#batch-${batch.batchKey.replace(/[^a-zA-Z0-9]/g, '-')}`}>
                            {batch.batchKey} (Subgroups: {batch.subgroupLabel})
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && !!selectedTimetable && layoutMode === 'grouped' && filteredBatchTables.map((batch, index) => {
          const tableId = `batch-${batch.batchKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
          const isOdd = index % 2 === 0;
          const tableVisualId = `table_${index + 1}`;
          const generatedStamp = selectedTimetable?.created_at
            ? new Date(selectedTimetable.created_at).toLocaleString()
            : new Date().toLocaleString();
          return (
            <section
              id={tableId}
              key={batch.batchKey}
              className={`overflow-hidden rounded-3xl border ${isOdd ? 'border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/60' : 'border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-cyan-50/50'} p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900">{batch.batchKey}</h4>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {batch.yearSemester}
                </span>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Subgroups in this shared timetable: {batch.subgroupLabel}
              </p>

              <div className="overflow-x-auto">
                <table id={tableVisualId} className="min-w-full border-collapse text-sm" border="1">
                  <caption className="caption-top border border-slate-300 border-b-0 bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-800">
                    {INSTITUTION_NAME}
                  </caption>
                  <thead>
                    <tr>
                      <td className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-3 py-2" rowSpan={2} />
                      <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-800" colSpan={Math.max(batch.days.length, 1)}>
                        {batch.batchKey}
                      </th>
                    </tr>
                    <tr>
                      {batch.days.map((day) => (
                        <th key={day} className="border border-slate-300 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-700">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTimeline.map((timelineRow) => {
                      if (timelineRow.type === 'break') {
                        return (
                          <tr key={timelineRow.slot}>
                            <td className="sticky left-0 z-10 border border-slate-300 bg-amber-100 px-3 py-2 font-semibold text-amber-900">
                              {timelineRow.label}
                            </td>
                            <td
                              className="border border-slate-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-amber-800"
                              colSpan={Math.max(batch.days.length, 1)}
                            >
                              Campus Interval (No Lectures)
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={timelineRow.slot}>
                          <td className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                            {timelineRow.label}
                          </td>
                          {batch.days.map((day) => {
                            const key = `${timelineRow.slot}::${day}`;
                            const entries = batch.cellMap.get(key) || [];
                            return (
                              <td key={key} className="border border-slate-300 bg-white px-2 py-2 align-top">
                                {!entries.length ? (
                                  <span className="text-[11px] text-slate-400">-</span>
                                ) : (
                                  <div className="space-y-2">
                                    {entries.map((entry, idx) => (
                                      <div key={`${entry.module}-${entry.hall}-${idx}`} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                        <p className="text-xs font-semibold text-slate-900">{entry.module}</p>
                                        <p className="text-[11px] text-slate-600">{entry.hall}</p>
                                        <p className="text-[11px] text-slate-500">{entry.instructor}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className="foot">
                      <td className="border border-slate-300 bg-slate-100 px-3 py-2" />
                      <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-700" colSpan={Math.max(batch.days.length, 1)}>
                        Timetable generated with SLIIT Scheduler on {generatedStamp}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-right">
                <a href="#top" className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 hover:underline">
                  Back to the top
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorTimetableSidebarPage;
