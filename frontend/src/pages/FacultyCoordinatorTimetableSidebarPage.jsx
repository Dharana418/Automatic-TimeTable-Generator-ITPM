import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Radar, SlidersHorizontal, Search, Download, RefreshCcw, Sparkles, ChevronDown, ChevronRight, Filter, Sun, Moon } from 'lucide-react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import schedulerApi from '../api/scheduler.js';
import { downloadTimetableAsCSV } from '../api/timetableGeneration.js';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND_DAYS = ['Sat', 'Sun'];
const INSTITUTION_NAME = 'Sri Lanka Institute of Information Technology';
const FILTER_PRESET_STORAGE_KEY = 'faculty_timetable_filter_presets_v1';
const FAVORITES_STORAGE_KEY = 'faculty_timetable_favorites_v1';
const REPORT_THEME_STORAGE_KEY = 'faculty_timetable_report_theme_v1';
const REPORT_SCROLL_SECTIONS = [
  { id: 'report-hero', label: 'Overview' },
  { id: 'report-signals', label: 'Signals' },
  { id: 'report-risk', label: 'Risk' },
  { id: 'report-operations', label: 'Operations' },
  { id: 'report-explorer', label: 'Explorer' },
  { id: 'report-render', label: 'Render' },
];
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

const getAllowedDaysForMode = (mode = 'ALL') => {
  if (mode === 'WD') return WEEKDAY_DAYS;
  if (mode === 'WE') return WEEKEND_DAYS;
  return DAY_ORDER;
};

const isDayAllowedForMode = (day, mode = 'ALL') => {
  const normalizedDay = normalizeDay(day);
  return getAllowedDaysForMode(mode).includes(normalizedDay);
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

const extractScheduleDayType = (row = {}) => {
  const raw = String(
    row?.day_type
      || row?.dayType
      || row?.module_day_type
      || row?.moduleDayType
      || row?.details?.day_type
      || ''
  ).trim().toLowerCase();

  if (raw === 'weekday') return 'weekday';
  if (raw === 'weekend') return 'weekend';
  return '';
};

const extractRowBatchMode = (row = {}) => {
  const keys = extractBatchKeys(row);
  let hasWeekday = false;
  let hasWeekend = false;

  keys.forEach((key) => {
    const mode = extractBatchMode(key);
    if (mode === 'WD') hasWeekday = true;
    if (mode === 'WE') hasWeekend = true;
  });

  if (hasWeekday && !hasWeekend) return 'weekday';
  if (hasWeekend && !hasWeekday) return 'weekend';
  return '';
};

const sanitizeScheduleRowsByDayType = (rows = []) => {
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const day = normalizeDay(row?.day);
    if (day === 'TBA') return true;

    const dayTypeFromBatch = extractRowBatchMode(row);
    const dayTypeFromRow = extractScheduleDayType(row);
    const effectiveDayType = dayTypeFromBatch || dayTypeFromRow;

    if (effectiveDayType === 'weekday' && WEEKEND_DAYS.includes(day)) return false;
    if (effectiveDayType === 'weekend' && WEEKDAY_DAYS.includes(day)) return false;
    return true;
  });
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
      return sanitizeScheduleRowsByDayType(pickScheduleFromObject(parsed));
    } catch {
      return [];
    }
  }

  if (typeof rawData === 'object' && rawData !== null) {
    return sanitizeScheduleRowsByDayType(pickScheduleFromObject(rawData));
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

const safeReadStorageJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const buildBatchTable = (scheduleRows = [], dayModeFilter = 'ALL') => {
  const batchMap = new Map();
  const allowedDays = getAllowedDaysForMode(dayModeFilter);

  scheduleRows.forEach((row) => {
    const day = normalizeDay(row.day);
    if (!allowedDays.includes(day)) return;

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
    const days = [...allowedDays];

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
  const allowedDays = getAllowedDaysForMode(dayModeFilter);

  scheduleRows.forEach((row) => {
    const day = normalizeDay(row.day);
    if (!allowedDays.includes(day)) return;

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
    days: [...allowedDays],
    // Use the complete campus timeline slot set for unified rendering.
    slots: [...WEEKEND_CLASS_SLOTS],
    cellMap,
  };
};

const rowMatchesModeFilter = (row, dayModeFilter = 'ALL') => {
  if (!isDayAllowedForMode(row?.day, dayModeFilter)) return false;
  if (dayModeFilter === 'ALL') return true;

  const batchKeys = extractBatchKeys(row);
  return batchKeys.some((key) => extractBatchMode(key) === dayModeFilter);
};

const buildRiskInsights = (scheduleRows = [], dayModeFilter = 'ALL') => {
  const cellCountMap = new Map();
  const hallConflictMap = new Map();
  const instructorConflictMap = new Map();

  scheduleRows.forEach((row) => {
    if (!rowMatchesModeFilter(row, dayModeFilter)) return;

    const day = normalizeDay(row.day);
    const slot = normalizeSlot(row);
    const hall = String(row.hallName || row.hallId || 'Hall TBA').trim();
    const instructor = String(row.instructorName || row.instructorId || 'Instructor TBA').trim();

    const cellKey = `${slot}::${day}`;
    cellCountMap.set(cellKey, (cellCountMap.get(cellKey) || 0) + 1);

    const hallKey = `${cellKey}::${hall}`;
    hallConflictMap.set(hallKey, (hallConflictMap.get(hallKey) || 0) + 1);

    const instructorKey = `${cellKey}::${instructor}`;
    instructorConflictMap.set(instructorKey, (instructorConflictMap.get(instructorKey) || 0) + 1);
  });

  const riskyCells = new Set();
  const hallConflicts = new Set();
  const instructorConflicts = new Set();

  cellCountMap.forEach((count, key) => {
    if (count >= 4) riskyCells.add(key);
  });

  hallConflictMap.forEach((count, key) => {
    if (count > 1) {
      hallConflicts.add(key);
      riskyCells.add(key.split('::').slice(0, 2).join('::'));
    }
  });

  instructorConflictMap.forEach((count, key) => {
    if (count > 1) {
      instructorConflicts.add(key);
      riskyCells.add(key.split('::').slice(0, 2).join('::'));
    }
  });

  return {
    riskyCells,
    hallConflicts,
    instructorConflicts,
    summary: {
      riskyCellCount: riskyCells.size,
      hallConflictCount: hallConflicts.size,
      instructorConflictCount: instructorConflicts.size,
    },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [presetName, setPresetName] = useState('');
  const [filterPresets, setFilterPresets] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showRiskHighlights, setShowRiskHighlights] = useState(true);
  const [reportViewMode, setReportViewMode] = useState('command');
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedSpecializations, setExpandedSpecializations] = useState({});
  const [pageAnimated, setPageAnimated] = useState(false);
  const [animatedInsightMetrics, setAnimatedInsightMetrics] = useState({ timetables: 0, modules: 0, groups: 0, favorites: 0 });
  const [reportTheme, setReportTheme] = useState(() => safeReadStorageJson(REPORT_THEME_STORAGE_KEY, 'light'));
  const [activeReportSection, setActiveReportSection] = useState(REPORT_SCROLL_SECTIONS[0].id);
  const [trendHoverIndex, setTrendHoverIndex] = useState(-1);
  const animatedInsightRef = useRef({ timetables: 0, modules: 0, groups: 0, favorites: 0 });

  useEffect(() => {
    setFilterPresets(safeReadStorageJson(FILTER_PRESET_STORAGE_KEY, []));
    setFavoriteIds(safeReadStorageJson(FAVORITES_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_PRESET_STORAGE_KEY, JSON.stringify(filterPresets));
  }, [filterPresets]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem(REPORT_THEME_STORAGE_KEY, JSON.stringify(reportTheme));
  }, [reportTheme]);

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
    const query = String(searchQuery || '').trim().toLowerCase();

    return timetables.filter((tt) => {
      const meta = extractTimetableMeta(tt);
      if (filterYear !== 'ALL' && meta.year !== filterYear) return false;
      if (filterSemester !== 'ALL' && meta.semester !== filterSemester) return false;
      if (filterSpecialization !== 'ALL' && meta.specialization !== filterSpecialization) return false;
      if (favoritesOnly && !favoriteIds.includes(String(tt.id))) return false;

      if (query) {
        const haystack = [
          tt.name,
          tt.status,
          tt.id,
          meta.year,
          meta.semester,
          meta.specialization,
          meta.group,
          meta.subgroup,
        ]
          .map((item) => String(item || '').toLowerCase())
          .join(' ');

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [timetables, filterYear, filterSemester, filterSpecialization, favoritesOnly, favoriteIds, searchQuery]);

  const groupedTimetableIndex = useMemo(() => {
    const yearMap = new Map();

    filteredTimetables.forEach((tt) => {
      const meta = extractTimetableMeta(tt);
      const year = String(meta.year || 'ALL').trim() || 'ALL';
      const specialization = String(meta.specialization || 'ALL').trim() || 'ALL';
      const semester = String(meta.semester || 'ALL').trim() || 'ALL';

      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const specializationMap = yearMap.get(year);

      if (!specializationMap.has(specialization)) specializationMap.set(specialization, new Map());
      const semesterMap = specializationMap.get(specialization);

      if (!semesterMap.has(semester)) semesterMap.set(semester, []);
      semesterMap.get(semester).push(tt);
    });

    const sortToken = (left, right) => {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      const leftIsNumber = Number.isFinite(leftNumber) && String(leftNumber) === String(left);
      const rightIsNumber = Number.isFinite(rightNumber) && String(rightNumber) === String(right);

      if (leftIsNumber && rightIsNumber) return leftNumber - rightNumber;
      if (leftIsNumber) return -1;
      if (rightIsNumber) return 1;
      return String(left).localeCompare(String(right));
    };

    return Array.from(yearMap.entries())
      .map(([year, specializationMap]) => {
        const specializations = Array.from(specializationMap.entries())
          .map(([specialization, semesterMap]) => {
            const semesters = Array.from(semesterMap.entries())
              .map(([semester, items]) => ({
                semester,
                items: [...items].sort(
                  (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                ),
              }))
              .sort((a, b) => sortToken(a.semester, b.semester));

            return {
              specialization,
              semesters,
              count: semesters.reduce((sum, semesterGroup) => sum + semesterGroup.items.length, 0),
            };
          })
          .sort((a, b) => String(a.specialization).localeCompare(String(b.specialization)));

        return {
          year,
          specializations,
          count: specializations.reduce((sum, specializationGroup) => sum + specializationGroup.count, 0),
        };
      })
      .sort((a, b) => sortToken(a.year, b.year));
  }, [filteredTimetables]);

  const semesterSpotlightCards = useMemo(() => {
    const cards = [];

    groupedTimetableIndex.forEach((yearGroup) => {
      yearGroup.specializations.forEach((specializationGroup) => {
        specializationGroup.semesters.forEach((semesterGroup) => {
          const latest = semesterGroup.items[0] || null;
          cards.push({
            year: yearGroup.year,
            specialization: specializationGroup.specialization,
            semester: semesterGroup.semester,
            count: semesterGroup.items.length,
            latestId: latest?.id ? String(latest.id) : '',
            latestName: latest?.name || '',
            latestCreatedAt: latest?.created_at || null,
          });
        });
      });
    });

    return cards
      .sort((left, right) => {
        const leftTime = new Date(left.latestCreatedAt || 0).getTime();
        const rightTime = new Date(right.latestCreatedAt || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 12);
  }, [groupedTimetableIndex]);

  useEffect(() => {
    if (!groupedTimetableIndex.length) {
      setExpandedYears({});
      setExpandedSpecializations({});
      return;
    }

    setExpandedYears((previous) => {
      const next = { ...previous };
      groupedTimetableIndex.slice(0, 2).forEach((yearGroup) => {
        if (next[yearGroup.year] === undefined) next[yearGroup.year] = true;
      });
      return next;
    });

    setExpandedSpecializations((previous) => {
      const next = { ...previous };
      groupedTimetableIndex.slice(0, 2).forEach((yearGroup) => {
        yearGroup.specializations.slice(0, 1).forEach((specializationGroup) => {
          const key = `${yearGroup.year}::${specializationGroup.specialization}`;
          if (next[key] === undefined) next[key] = true;
        });
      });
      return next;
    });
  }, [groupedTimetableIndex]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPageAnimated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const semesterTrend = useMemo(() => {
    const periodMap = new Map();

    filteredTimetables.forEach((tt) => {
      const meta = extractTimetableMeta(tt);
      const year = String(meta.year || '').trim();
      const semester = String(meta.semester || '').trim();
      if (!year || !semester) return;

      const key = `${year}-${semester}`;
      const label = `Y${year} S${semester}`;
      const current = periodMap.get(key) || {
        key,
        year,
        semester,
        label,
        value: 0,
      };
      current.value += 1;
      periodMap.set(key, current);
    });

    const sorted = Array.from(periodMap.values()).sort((left, right) => {
      const leftYear = Number(left.year);
      const rightYear = Number(right.year);
      if (Number.isFinite(leftYear) && Number.isFinite(rightYear) && leftYear !== rightYear) {
        return leftYear - rightYear;
      }

      const leftSemester = Number(left.semester);
      const rightSemester = Number(right.semester);
      if (Number.isFinite(leftSemester) && Number.isFinite(rightSemester) && leftSemester !== rightSemester) {
        return leftSemester - rightSemester;
      }

      return left.key.localeCompare(right.key);
    });

    const maxValue = Math.max(1, ...sorted.map((item) => item.value));
    const chartHeight = 72;
    const chartWidth = Math.max(240, sorted.length > 1 ? (sorted.length - 1) * 56 : 240);

    const points = sorted.map((item, index) => {
      const x = sorted.length <= 1 ? chartWidth / 2 : (index * chartWidth) / (sorted.length - 1);
      const y = chartHeight - (item.value / maxValue) * chartHeight;
      return {
        ...item,
        x,
        y,
      };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' ');

    const areaPath = points.length
      ? `${linePath} L${points[points.length - 1].x},${chartHeight} L${points[0].x},${chartHeight} Z`
      : '';

    return {
      points,
      linePath,
      areaPath,
      chartWidth,
      chartHeight,
      maxValue,
    };
  }, [filteredTimetables]);

  const toggleYearExpansion = (year) => {
    setExpandedYears((previous) => ({
      ...previous,
      [year]: !previous[year],
    }));
  };

  const toggleSpecializationExpansion = (year, specialization) => {
    const key = `${year}::${specialization}`;
    setExpandedSpecializations((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

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
  const scopedSchedule = useMemo(
    () => (Array.isArray(schedule) ? schedule.filter((row) => rowMatchesModeFilter(row, dayModeFilter)) : []),
    [schedule, dayModeFilter]
  );

  const batchTables = useMemo(() => buildBatchTable(schedule, dayModeFilter), [schedule, dayModeFilter]);
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
    const uniqueModules = new Set(scopedSchedule.map((row) => row.moduleName || row.moduleId || 'Module')).size;
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
  }, [filteredTimetables.length, filteredBatchTables, scopedSchedule, selectedTimetable]);

  useEffect(() => {
    const targets = {
      timetables: insightMetrics.timetables,
      modules: insightMetrics.modules,
      groups: insightMetrics.groups,
      favorites: favoriteIds.length,
    };

    const startValues = { ...animatedInsightRef.current };
    const startTime = performance.now();
    const duration = 460;

    let rafId = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedInsightMetrics({
        timetables: Math.round(startValues.timetables + (targets.timetables - startValues.timetables) * eased),
        modules: Math.round(startValues.modules + (targets.modules - startValues.modules) * eased),
        groups: Math.round(startValues.groups + (targets.groups - startValues.groups) * eased),
        favorites: Math.round(startValues.favorites + (targets.favorites - startValues.favorites) * eased),
      });

      animatedInsightRef.current = {
        timetables: Math.round(startValues.timetables + (targets.timetables - startValues.timetables) * eased),
        modules: Math.round(startValues.modules + (targets.modules - startValues.modules) * eased),
        groups: Math.round(startValues.groups + (targets.groups - startValues.groups) * eased),
        favorites: Math.round(startValues.favorites + (targets.favorites - startValues.favorites) * eased),
      };

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [insightMetrics.timetables, insightMetrics.modules, insightMetrics.groups, favoriteIds.length]);

  const planningInsights = useMemo(() => {
    const scopedRows = Array.isArray(schedule)
      ? schedule.filter((row) => rowMatchesModeFilter(row, dayModeFilter))
      : [];

    if (!scopedRows.length) {
      return {
        busiestDay: 'N/A',
        peakSlot: 'N/A',
        busiestHall: 'N/A',
        overlapCells: 0,
      };
    }

    const dayMap = new Map();
    const slotMap = new Map();
    const hallMap = new Map();
    const cellMap = new Map();

    scopedRows.forEach((row) => {
      const day = normalizeDay(row.day);
      const slot = normalizeSlot(row);
      const hall = String(row.hallName || row.hallId || 'Hall TBA').trim();

      dayMap.set(day, (dayMap.get(day) || 0) + 1);
      slotMap.set(slot, (slotMap.get(slot) || 0) + 1);
      hallMap.set(hall, (hallMap.get(hall) || 0) + 1);

      const cellKey = `${slot}::${day}`;
      cellMap.set(cellKey, (cellMap.get(cellKey) || 0) + 1);
    });

    const pickTop = (sourceMap) => {
      let label = 'N/A';
      let count = 0;
      sourceMap.forEach((value, key) => {
        if (value > count) {
          label = key;
          count = value;
        }
      });
      return `${label} (${count})`;
    };

    const overlapCells = Array.from(cellMap.values()).filter((count) => count > 1).length;

    return {
      busiestDay: pickTop(dayMap),
      peakSlot: pickTop(slotMap),
      busiestHall: pickTop(hallMap),
      overlapCells,
    };
  }, [schedule, dayModeFilter]);

  const riskInsights = useMemo(() => buildRiskInsights(schedule, dayModeFilter), [schedule, dayModeFilter]);

  const dayLoadDistribution = useMemo(() => {
    const counts = getAllowedDaysForMode(dayModeFilter).map((day) => ({ day, count: 0 }));
    const indexMap = new Map(counts.map((item, idx) => [item.day, idx]));

    schedule.forEach((row) => {
      if (!rowMatchesModeFilter(row, dayModeFilter)) return;
      const normalizedDay = normalizeDay(row.day);
      const idx = indexMap.get(normalizedDay);
      if (idx === undefined) return;
      counts[idx].count += 1;
    });

    const maxCount = Math.max(1, ...counts.map((item) => item.count));
    return counts.map((item) => ({
      ...item,
      widthPercent: Math.max(8, Math.round((item.count / maxCount) * 100)),
    }));
  }, [schedule, dayModeFilter]);

  const applyFilterPreset = (preset) => {
    const filters = preset?.filters || {};
    setFilterYear(filters.filterYear || 'ALL');
    setFilterSemester(filters.filterSemester || 'ALL');
    setFilterSpecialization(filters.filterSpecialization || 'ALL');
    setDayModeFilter(filters.dayModeFilter || 'ALL');
    setLayoutMode(filters.layoutMode || 'unified');
    setFavoritesOnly(Boolean(filters.favoritesOnly));
    setSearchQuery(filters.searchQuery || '');
  };

  const saveFilterPreset = () => {
    const name = String(presetName || '').trim();
    if (!name) return;

    const newPreset = {
      id: `${Date.now()}`,
      name,
      filters: {
        filterYear,
        filterSemester,
        filterSpecialization,
        dayModeFilter,
        layoutMode,
        favoritesOnly,
        searchQuery,
      },
    };

    setFilterPresets((prev) => [newPreset, ...prev].slice(0, 10));
    setPresetName('');
  };

  const removeFilterPreset = (presetId) => {
    setFilterPresets((prev) => prev.filter((item) => item.id !== presetId));
  };

  const toggleFavorite = (timetableId) => {
    const key = String(timetableId);
    setFavoriteIds((prev) => {
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      return [key, ...prev];
    });
  };

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

  useEffect(() => {
    const elements = REPORT_SCROLL_SECTIONS
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        setActiveReportSection(visible.target.id);
      },
      { threshold: [0.25, 0.45, 0.65], rootMargin: '-30% 0px -35% 0px' }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [loading, selectedTimetable, layoutMode, reportViewMode]);

  const activeSectionIndex = Math.max(0, REPORT_SCROLL_SECTIONS.findIndex((item) => item.id === activeReportSection));
  const sectionProgress = Math.max(10, Math.round(((activeSectionIndex + 1) / REPORT_SCROLL_SECTIONS.length) * 100));

  const jumpToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <div id="top" className={`fc-layout-stack fc-layout-stack-tight ${reportTheme === 'dark' ? 'report-theme-dark' : 'report-theme-light'}`}>
        <style>{`
          @keyframes timetableEnterUp {
            0% { opacity: 0; transform: translateY(14px) scale(0.985); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes timetableFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          .timetable-enter {
            animation: timetableEnterUp 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .timetable-fade {
            animation: timetableFadeIn 420ms ease-out both;
          }

          .report-theme-dark {
            color: #e2e8f0;
          }

          .report-theme-dark .theme-shell {
            border-color: #334155;
            background: linear-gradient(138deg, #0f172a 0%, #111827 45%, #082f49 100%);
            box-shadow: 0 20px 42px rgba(2, 6, 23, 0.5);
          }

          .report-theme-dark .theme-panel {
            border-color: #334155;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.72));
            box-shadow: 0 12px 30px rgba(2, 6, 23, 0.45);
          }

          .report-theme-dark .theme-soft {
            border-color: #475569;
            background: rgba(15, 23, 42, 0.78);
          }

          .report-theme-dark .theme-soft-plain {
            border-color: #475569;
            background: rgba(30, 41, 59, 0.62);
          }

          .report-theme-dark .theme-text-strong {
            color: #f8fafc;
          }

          .report-theme-dark .theme-text-medium {
            color: #cbd5e1;
          }

          .report-theme-dark .theme-text-soft {
            color: #94a3b8;
          }

          .report-theme-dark .theme-chip {
            border-color: #475569;
            background: rgba(15, 23, 42, 0.86);
            color: #dbeafe;
          }
        `}</style>
        <section className="theme-panel rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 theme-text-soft">Section Progress Navigator</p>
              <p className="text-[11px] text-slate-600 theme-text-medium">Scroll and jump between report sections with live progress tracking.</p>
            </div>
            <div className="w-full max-w-[300px] rounded-full bg-slate-200 theme-soft-plain">
              <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-500" style={{ width: `${sectionProgress}%` }} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {REPORT_SCROLL_SECTIONS.map((section) => {
              const isActive = section.id === activeReportSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpToSection(section.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${isActive ? 'border-sky-600 bg-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)]' : 'border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'} ${pageAnimated ? 'timetable-enter' : 'opacity-0'}`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </section>

        <section id="report-hero" className="theme-shell relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-[0_20px_45px_rgba(14,116,144,0.12)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_70%)]" />
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 theme-text-medium">Creative Timetable Studio</p>
              <h2 className="theme-text-strong mt-2 text-2xl font-extrabold text-slate-900">Timetable View Intelligence Panel</h2>
              <p className="theme-text-medium mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Explore generated timetables by year, semester, and specialization with a dynamic master grid and grouped academic layouts.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="theme-chip rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700">{animatedInsightMetrics.timetables} filtered timetable(s)</span>
                <span className="theme-chip rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">{dayModeFilter === 'WD' ? 'Weekday Mode' : dayModeFilter === 'WE' ? 'Weekend Mode' : 'All Batch Modes'}</span>
                <span className="theme-chip rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-700">Layout: {layoutMode === 'unified' ? 'Master View' : 'Grouped View'}</span>
                <button
                  type="button"
                  onClick={() => setReportTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                  className="theme-chip inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-white px-3 py-1 text-xs font-semibold text-indigo-700"
                >
                  {reportTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  {reportTheme === 'dark' ? 'Light Canvas' : 'Dark Canvas'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="theme-soft rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="theme-text-soft text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Modules</p>
                <p className="theme-text-strong mt-1 text-2xl font-extrabold text-slate-900">{animatedInsightMetrics.modules}</p>
              </div>
              <div className="theme-soft rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="theme-text-soft text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Groups</p>
                <p className="theme-text-strong mt-1 text-2xl font-extrabold text-slate-900">{animatedInsightMetrics.groups}</p>
              </div>
              <div className="theme-soft col-span-2 rounded-2xl border border-sky-200 bg-white/95 p-3">
                <p className="theme-text-soft text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last Generated</p>
                <p className="theme-text-medium mt-1 text-sm font-semibold text-slate-800">{insightMetrics.generatedAt}</p>
              </div>
              <div className="theme-soft col-span-2 rounded-2xl border border-amber-200 bg-amber-50/90 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Planning Alerts</p>
                <p className="theme-text-strong mt-1 text-sm font-semibold text-amber-900">
                  Overlapping cells: {planningInsights.overlapCells} • Risky cells: {riskInsights.summary.riskyCellCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="report-signals" className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="theme-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Busiest Day</p>
            <p className="theme-text-strong mt-2 text-base font-bold text-slate-900">{planningInsights.busiestDay}</p>
          </div>
          <div className="theme-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Peak Slot</p>
            <p className="theme-text-strong mt-2 text-base font-bold text-slate-900">{planningInsights.peakSlot}</p>
          </div>
          <div className="theme-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Most Used Hall</p>
            <p className="theme-text-strong mt-2 text-base font-bold text-slate-900">{planningInsights.busiestHall}</p>
          </div>
          <div className="theme-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Favorite Timetables</p>
            <p className="theme-text-strong mt-2 text-base font-bold text-slate-900">{animatedInsightMetrics.favorites}</p>
          </div>
        </section>

        <section id="report-risk" className="theme-panel rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-[0_8px_24px_rgba(244,63,94,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">High-Risk Conflict Detection</p>
              <p className="mt-1 text-sm text-rose-900">
                Hall conflicts: {riskInsights.summary.hallConflictCount} • Instructor conflicts: {riskInsights.summary.instructorConflictCount}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRiskHighlights((prev) => !prev)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${showRiskHighlights ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
            >
              {showRiskHighlights ? 'Risk Highlight ON' : 'Risk Highlight OFF'}
            </button>
          </div>
        </section>

        <section id="report-operations" className="theme-shell rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <Radar size={14} className="text-sky-600" /> Operations Deck
                </p>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                  Faculty Control Center
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTimetable) return;
                    downloadTimetableAsCSV(
                      scopedSchedule,
                      extractTimetableMeta(selectedTimetable).year,
                      extractTimetableMeta(selectedTimetable).semester,
                      extractTimetableMeta(selectedTimetable).group,
                      extractTimetableMeta(selectedTimetable).subgroup
                    );
                  }}
                  disabled={!selectedTimetable || !scopedSchedule.length}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={14} /> Quick Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <RefreshCcw size={14} /> Refresh Dataset
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('unified')}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${layoutMode === 'unified' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Unified Master View
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grouped')}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${layoutMode === 'grouped' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Group-by-Batch View
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                  <Search size={12} /> Search-ready
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                  <SlidersHorizontal size={12} /> Preset-enabled
                </span>
                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                  Live Risk Overlay
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Week Load Strip</p>
              <div className="mt-3 space-y-2">
                {dayLoadDistribution.map((item) => (
                  <div key={item.day} className="grid grid-cols-[34px_1fr_36px] items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">{item.day}</span>
                    <div className="h-2.5 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${item.widthPercent}%` }} />
                    </div>
                    <span className="text-right text-xs font-semibold text-slate-700">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="report-explorer" className="theme-panel rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
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
                      scopedSchedule,
                    extractTimetableMeta(selectedTimetable).year,
                    extractTimetableMeta(selectedTimetable).semester,
                    extractTimetableMeta(selectedTimetable).group,
                    extractTimetableMeta(selectedTimetable).subgroup
                  );
                }}
                disabled={!selectedTimetable || !scopedSchedule.length}
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

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
            <aside className={`h-fit rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 via-white to-slate-200 p-4 shadow-sm xl:sticky xl:top-24 ${pageAnimated ? 'timetable-enter' : 'opacity-0'}`} style={{ animationDelay: '60ms' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Display Generated Timetables</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                  <Sparkles size={14} /> Advanced View Modes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReportViewMode('command')}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${reportViewMode === 'command' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                  >
                    Command Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportViewMode('compact')}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${reportViewMode === 'compact' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                  >
                    Compact Focus
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                  placeholder="Search by name, ID, specialization, status"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFavoritesOnly((prev) => !prev)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${favoritesOnly ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                  >
                    {favoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFavoritesOnly(false);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
                  >
                    Clear Search
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
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

              <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Saved Filter Presets</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className="min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={saveFilterPreset}
                    className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                  >
                    Save Preset
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!filterPresets.length && (
                    <span className="text-xs text-slate-500">No presets saved yet.</span>
                  )}
                  {filterPresets.map((preset) => (
                    <div key={preset.id} className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => applyFilterPreset(preset)}
                        className="text-xs font-semibold text-slate-700"
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFilterPreset(preset.id)}
                        className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="theme-soft mt-3 rounded-xl border border-slate-300 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Generated Timetable Trend</p>
                  <span className="text-[11px] font-semibold text-slate-500">Per semester</span>
                </div>

                {!semesterTrend.points.length ? (
                  <p className="text-xs text-slate-500">Trend appears once timetables exist for filtered periods.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <svg
                      onMouseLeave={() => setTrendHoverIndex(-1)}
                      width={semesterTrend.chartWidth + 16}
                      height={semesterTrend.chartHeight + 28}
                      viewBox={`0 0 ${semesterTrend.chartWidth + 16} ${semesterTrend.chartHeight + 28}`}
                      className="block"
                    >
                      <defs>
                        <linearGradient id="semesterTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <g transform="translate(8 6)">
                        <line x1="0" y1={semesterTrend.chartHeight} x2={semesterTrend.chartWidth} y2={semesterTrend.chartHeight} stroke="#cbd5e1" strokeWidth="1" />
                        {semesterTrend.areaPath && <path d={semesterTrend.areaPath} fill="url(#semesterTrendFill)" />}
                        {semesterTrend.linePath && <path d={semesterTrend.linePath} fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
                        {trendHoverIndex >= 0 && semesterTrend.points[trendHoverIndex] && (
                          <g>
                            <line
                              x1={semesterTrend.points[trendHoverIndex].x}
                              y1="0"
                              x2={semesterTrend.points[trendHoverIndex].x}
                              y2={semesterTrend.chartHeight}
                              stroke="#0284c7"
                              strokeWidth="1.1"
                              strokeDasharray="4 4"
                              opacity="0.7"
                            />
                            <line
                              x1="0"
                              y1={semesterTrend.points[trendHoverIndex].y}
                              x2={semesterTrend.chartWidth}
                              y2={semesterTrend.points[trendHoverIndex].y}
                              stroke="#0f172a"
                              strokeWidth="0.8"
                              strokeDasharray="3 3"
                              opacity="0.38"
                            />
                            {(() => {
                              const point = semesterTrend.points[trendHoverIndex];
                              const tooltipX = Math.min(Math.max(point.x + 8, 4), Math.max(4, semesterTrend.chartWidth - 104));
                              const tooltipY = Math.max(point.y - 34, 4);
                              return (
                                <g transform={`translate(${tooltipX} ${tooltipY})`}>
                                  <rect width="102" height="26" rx="6" ry="6" fill="#0f172a" opacity="0.92" />
                                  <text x="8" y="16" fontSize="9" fill="#f8fafc" fontWeight="600">
                                    {`${point.label}: ${point.value}`}
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        )}
                        {semesterTrend.points.map((point, pointIndex) => (
                          <g key={`point-${point.key}`}>
                            <title>{`${point.label}: ${point.value} timetable(s)`}</title>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={trendHoverIndex === pointIndex ? '5.2' : '3.5'}
                              fill={trendHoverIndex === pointIndex ? '#0284c7' : '#0ea5e9'}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              onMouseEnter={() => setTrendHoverIndex(pointIndex)}
                              className="cursor-pointer transition-all"
                            />
                            <text x={point.x} y={semesterTrend.chartHeight + 14} textAnchor="middle" fontSize="9" fill="#475569">{point.label}</text>
                          </g>
                        ))}
                      </g>
                    </svg>
                  </div>
                )}
              </div>
            </aside>

            <div className={`rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 via-white to-slate-200 p-4 shadow-sm ${pageAnimated ? 'timetable-fade' : 'opacity-0'}`} style={{ animationDelay: '120ms' }}>
              {reportViewMode === 'command' && (
                <div className="mt-1 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">
                    <Filter size={13} /> Semester Spotlight
                  </div>
                  {!semesterSpotlightCards.length ? (
                    <p className="text-xs text-slate-500">No semester spotlight cards for the current filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {semesterSpotlightCards.map((card, index) => (
                        <button
                          key={`spotlight-${card.year}-${card.specialization}-${card.semester}`}
                          type="button"
                          onClick={() => {
                            setFilterYear(card.year);
                            setFilterSpecialization(card.specialization);
                            setFilterSemester(card.semester);
                            if (card.latestId) setSelectedId(card.latestId);
                          }}
                          className={`rounded-lg border border-indigo-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 ${pageAnimated ? 'timetable-enter' : 'opacity-0'}`}
                          style={{ animationDelay: `${140 + index * 35}ms` }}
                        >
                          <p className="text-xs font-semibold text-slate-900">Year {card.year} • {card.specialization}</p>
                          <p className="text-[11px] text-slate-600">Semester {card.semester} • {card.count} timetable(s)</p>
                          <p className="mt-1 truncate text-[11px] text-indigo-700">{card.latestName || 'Latest timetable selected'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Jump</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {groupedTimetableIndex.slice(0, 8).map((yearGroup) =>
                    yearGroup.specializations.slice(0, 2).map((specializationGroup) => (
                      <button
                        key={`jump-${yearGroup.year}-${specializationGroup.specialization}`}
                        type="button"
                        onClick={() => {
                          setFilterYear(yearGroup.year);
                          setFilterSpecialization(specializationGroup.specialization);
                          setFilterSemester('ALL');
                        }}
                        className="rounded-full border border-cyan-300 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700"
                      >
                        Y{yearGroup.year} • {specializationGroup.specialization}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className={`mt-3 grid grid-cols-1 gap-2 ${reportViewMode === 'compact' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {filteredTimetables.slice(0, 9).map((tt) => {
                const meta = extractTimetableMeta(tt);
                const active = String(selectedId) === String(tt.id);
                const isFavorite = favoriteIds.includes(String(tt.id));
                return (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => setSelectedId(String(tt.id))}
                    className={`rounded-xl border px-3 py-3 text-left transition ${active ? 'border-sky-500 bg-sky-100/70 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50'} ${pageAnimated ? 'timetable-enter' : 'opacity-0'}`}
                    style={{ animationDelay: `${220 + (Number(tt.id) % 9) * 35}ms` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{tt.name || `Timetable #${tt.id}`}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isFavorite ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                        {isFavorite ? 'STAR' : 'SAVE'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Y{meta.year} • S{meta.semester} • {meta.specialization} • G{meta.group} • SG{meta.subgroup}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-slate-500">{tt.status || 'pending'}</p>
                    <div className="mt-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(tt.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavorite(tt.id);
                        }}
                        className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700"
                      >
                        {isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                      </span>
                    </div>
                  </button>
                );
              })}
              {!filteredTimetables.length && (
                <div className="rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 to-white px-3 py-4 text-sm text-slate-600">
                  No generated timetables match this filter.
                </div>
              )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-300 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Year / Specialization / Semester Browser
              </p>

              {!groupedTimetableIndex.length ? (
                <p className="mt-2 text-xs text-slate-500">No timetable groups available for the current filters.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {groupedTimetableIndex.map((yearGroup, yearIndex) => (
                    <div key={`year-${yearGroup.year}`} className={`rounded-lg border border-slate-200 bg-slate-50 p-2 ${pageAnimated ? 'timetable-enter' : 'opacity-0'}`} style={{ animationDelay: `${260 + yearIndex * 45}ms` }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterYear(yearGroup.year);
                            toggleYearExpansion(yearGroup.year);
                          }}
                          className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                        >
                          {expandedYears[yearGroup.year] ? <ChevronDown size={12} className="inline mr-1" /> : <ChevronRight size={12} className="inline mr-1" />}
                          Year {yearGroup.year}
                        </button>
                        <span className="text-[11px] font-semibold text-slate-600">{yearGroup.count} timetable(s)</span>
                      </div>

                      {expandedYears[yearGroup.year] && (
                        <div className="mt-2 space-y-2">
                          {yearGroup.specializations.map((specializationGroup, specializationIndex) => {
                            const specKey = `${yearGroup.year}::${specializationGroup.specialization}`;
                            const isSpecExpanded = Boolean(expandedSpecializations[specKey]);
                            return (
                              <div key={`spec-${yearGroup.year}-${specializationGroup.specialization}`} className={`rounded-md border border-slate-200 bg-white p-2 ${pageAnimated ? 'timetable-fade' : 'opacity-0'}`} style={{ animationDelay: `${320 + specializationIndex * 40}ms` }}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFilterYear(yearGroup.year);
                                      setFilterSpecialization(specializationGroup.specialization);
                                      toggleSpecializationExpansion(yearGroup.year, specializationGroup.specialization);
                                    }}
                                    className="rounded-full border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700"
                                  >
                                    {isSpecExpanded ? <ChevronDown size={12} className="inline mr-1" /> : <ChevronRight size={12} className="inline mr-1" />}
                                    {specializationGroup.specialization}
                                  </button>
                                  <span className="text-[11px] font-semibold text-slate-600">{specializationGroup.count} timetable(s)</span>
                                </div>

                                {isSpecExpanded && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {specializationGroup.semesters.map((semesterGroup, semesterIndex) => (
                                      <button
                                        key={`sem-${yearGroup.year}-${specializationGroup.specialization}-${semesterGroup.semester}`}
                                        type="button"
                                        onClick={() => {
                                          setFilterYear(yearGroup.year);
                                          setFilterSpecialization(specializationGroup.specialization);
                                          setFilterSemester(semesterGroup.semester);
                                          if (semesterGroup.items[0]?.id) {
                                            setSelectedId(String(semesterGroup.items[0].id));
                                          }
                                        }}
                                        className={`rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ${pageAnimated ? 'timetable-fade' : 'opacity-0'}`}
                                        style={{ animationDelay: `${360 + semesterIndex * 32}ms` }}
                                      >
                                        Semester {semesterGroup.semester} ({semesterGroup.items.length})
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
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
          <section id="report-render" className="theme-shell overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-cyan-50/70 p-4 shadow-[0_16px_40px_rgba(5,150,105,0.14)]">
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
                          const isRiskyCell = showRiskHighlights && riskInsights.riskyCells.has(key);
                          return (
                            <td key={key} className={`border px-2 py-2 align-top ${isRiskyCell ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'}`}>
                              {!entries.length ? (
                                <span className="text-[11px] text-slate-400">-</span>
                              ) : (
                                <div className="space-y-2">
                                  {entries.map((entry, idx) => (
                                    <div
                                      key={`${entry.module}-${entry.group}-${idx}`}
                                      className={`rounded border px-2 py-1 ${(() => {
                                        if (!showRiskHighlights) return 'border-emerald-200 bg-emerald-50';
                                        const hallKey = `${timelineRow.slot}::${day}::${entry.hall}`;
                                        const instructorKey = `${timelineRow.slot}::${day}::${entry.instructor}`;
                                        if (riskInsights.hallConflicts.has(hallKey) || riskInsights.instructorConflicts.has(instructorKey)) {
                                          return 'border-rose-300 bg-rose-100';
                                        }
                                        return 'border-emerald-200 bg-emerald-50';
                                      })()}`}
                                    >
                                      <p className="text-xs font-semibold text-slate-900">{entry.module}</p>
                                      <p className="text-[11px] text-slate-600">{entry.yearSemester} • {entry.specialization} • G{entry.group}</p>
                                      <p className="text-[11px] text-slate-600">{entry.hall}</p>
                                      <p className="text-[11px] text-slate-500">{entry.instructor}</p>
                                      {showRiskHighlights && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {riskInsights.hallConflicts.has(`${timelineRow.slot}::${day}::${entry.hall}`) && (
                                            <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">Hall conflict</span>
                                          )}
                                          {riskInsights.instructorConflicts.has(`${timelineRow.slot}::${day}::${entry.instructor}`) && (
                                            <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">Instructor conflict</span>
                                          )}
                                        </div>
                                      )}
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
          <section id="report-render" className="theme-panel rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
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
                            const isRiskyCell = showRiskHighlights && riskInsights.riskyCells.has(key);
                            return (
                                <td key={key} className={`border px-2 py-2 align-top ${isRiskyCell ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'}`}>
                                {!entries.length ? (
                                  <span className="text-[11px] text-slate-400">-</span>
                                ) : (
                                  <div className="space-y-2">
                                    {entries.map((entry, idx) => (
                                        <div
                                          key={`${entry.module}-${entry.hall}-${idx}`}
                                          className={`rounded border px-2 py-1 ${(() => {
                                            if (!showRiskHighlights) return 'border-slate-200 bg-slate-50';
                                            const hallKey = `${timelineRow.slot}::${day}::${entry.hall}`;
                                            const instructorKey = `${timelineRow.slot}::${day}::${entry.instructor}`;
                                            if (riskInsights.hallConflicts.has(hallKey) || riskInsights.instructorConflicts.has(instructorKey)) {
                                              return 'border-rose-300 bg-rose-100';
                                            }
                                            return 'border-slate-200 bg-slate-50';
                                          })()}`}
                                        >
                                        <p className="text-xs font-semibold text-slate-900">{entry.module}</p>
                                        <p className="text-[11px] text-slate-600">{entry.hall}</p>
                                        <p className="text-[11px] text-slate-500">{entry.instructor}</p>
                                          {showRiskHighlights && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {riskInsights.hallConflicts.has(`${timelineRow.slot}::${day}::${entry.hall}`) && (
                                                <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">Hall conflict</span>
                                              )}
                                              {riskInsights.instructorConflicts.has(`${timelineRow.slot}::${day}::${entry.instructor}`) && (
                                                <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">Instructor conflict</span>
                                              )}
                                            </div>
                                          )}
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
