import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/scheduler.js';
import seedBatches from '../data/batches.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';

const GROUP_CAPACITY = 120;
const SUBGROUP_CAPACITY = 60;
const DEFAULT_CAPACITY = SUBGROUP_CAPACITY;

const SPECIALIZATIONS = [
  { key: 'IT', label: 'IT' },
  { key: 'SE', label: 'SE' },
  { key: 'DS', label: 'DS' },
  { key: 'ISE', label: 'ISE' },
  { key: 'CS', label: 'CS' },
  { key: 'IM', label: 'IM' },
  { key: 'CN', label: 'CN' },
  { key: 'CYBER SECURITY', label: 'Cyber Security' },
];

const SPECIALIZATION_CLOUD_TAGS = [
  { key: 'IT', label: 'IT' },
  { key: 'SE', label: 'SE' },
  { key: 'DS', label: 'DS' },
  { key: 'ISE', label: 'ISE' },
  { key: 'CS', label: 'CS' },
  { key: 'CS', label: 'Computer Science' },
  { key: 'IM', label: 'IM' },
  { key: 'CN', label: 'CN' },
];

const SPECIALIZATION_CHIP_STYLE = 'border-slate-300 bg-white text-slate-700';

const YEAR_OPTIONS = ['1', '2', '3', '4'];
const SEMESTER_OPTIONS = ['1', '2'];
const MODE_ORDER = { WD: 0, WE: 1 };
const FILTER_ALL = 'ALL';

const SORT_OPTIONS = [
  { value: 'id_asc', label: 'Batch ID (A-Z)' },
  { value: 'id_desc', label: 'Batch ID (Z-A)' },
  { value: 'capacity_desc', label: 'Capacity (High-Low)' },
  { value: 'capacity_asc', label: 'Capacity (Low-High)' },
  { value: 'group_asc', label: 'Group/Subgroup (Low-High)' },
  { value: 'group_desc', label: 'Group/Subgroup (High-Low)' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const toUpper = (value = '') => String(value).trim().toUpperCase();
const SUBGROUP_INPUT_PATTERN = /^(0?[1-2])?$/;
const cleanTwoDigitGroupValue = (value = '') => String(value || '').replace(/[^0-9]/g, '').slice(0, 2);

const parseBatchIdTokens = (batchId = '') => {
  const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = '', subgroupToken = ''] = String(batchId)
    .trim()
    .split('.');

  const year = Number(String(yearToken).replace(/[^0-9]/g, ''));
  const semester = Number(String(semesterToken).replace(/[^0-9]/g, ''));
  const group = Number(String(groupToken).replace(/[^0-9]/g, ''));
  const subgroup = Number(String(subgroupToken).replace(/[^0-9]/g, ''));

  return {
    year: Number.isFinite(year) ? year : 0,
    semester: Number.isFinite(semester) ? semester : 0,
    mode: toUpper(modeToken),
    specialization: normalizeSpecialization(specializationToken),
    group: Number.isFinite(group) ? group : 0,
    subgroup: Number.isFinite(subgroup) ? subgroup : 0,
  };
};

const inferSpecializationFromId = (batchId = '') => {
  const tokens = String(batchId).trim().split('.');
  return toUpper(tokens[3] || '');
};

const normalizeSpecialization = (raw = '') => {
  const key = toUpper(raw);
  if (key === 'IY') return 'ISE';
  return SPECIALIZATIONS.some((item) => item.key === key) ? key : 'IT';
};

const normalizeBatch = (item) => {
  const id = String(item?.id || '').trim();
  const tokens = parseBatchIdTokens(id);
  return {
    id,
    mode: tokens.mode || 'WD',
    specialization: normalizeSpecialization(item?.department_id || tokens.specialization || inferSpecializationFromId(id)),
    year: String(tokens.year || 1),
    semester: String(tokens.semester || 1),
    group: tokens.group ? String(tokens.group).padStart(2, '0') : '',
    subgroup: tokens.subgroup ? String(tokens.subgroup).padStart(2, '0') : '',
    capacity: Number(item?.capacity || 0),
  };
};

const formDefaults = {
  id: '',
  specialization: 'IT',
  year: '1',
  semester: '1',
  mode: 'WD',
  group: '',
  subgroup: '',
  studentCount: '',
};

const buildBatchId = ({ year, semester, mode, specialization, group, subgroup }) => {
  const parts = [
    `Y${String(year || '').trim()}`,
    `S${String(semester || '').trim()}`,
    String(mode || '').trim().toUpperCase(),
    normalizeSpecialization(specialization),
    String(group || '').trim(),
    String(subgroup || '').trim(),
  ];

  return parts.filter(Boolean).join('.');
};

const parseBatchIdentity = (batchId = '') => {
  const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = '', subgroupToken = ''] = String(batchId)
    .trim()
    .split('.');

  if (!yearToken || !semesterToken || !modeToken || !specializationToken || !groupToken || !subgroupToken) {
    return null;
  }

  return {
    scopeKey: [yearToken, semesterToken, toUpper(modeToken), toUpper(specializationToken), groupToken].join('.'),
    subgroup: subgroupToken,
  };
};

const compareBatchIds = (leftId = '', rightId = '') => {
  const left = parseBatchIdTokens(leftId);
  const right = parseBatchIdTokens(rightId);

  if (left.year !== right.year) return left.year - right.year;
  if (left.semester !== right.semester) return left.semester - right.semester;

  const leftModeRank = MODE_ORDER[left.mode] ?? 99;
  const rightModeRank = MODE_ORDER[right.mode] ?? 99;
  if (leftModeRank !== rightModeRank) return leftModeRank - rightModeRank;

  const specCompare = String(left.specialization).localeCompare(String(right.specialization));
  if (specCompare !== 0) return specCompare;

  if (left.group !== right.group) return left.group - right.group;
  if (left.subgroup !== right.subgroup) return left.subgroup - right.subgroup;

  return String(leftId).localeCompare(String(rightId));
};

const splitStudentsIntoSubgroupCapacities = (studentCount, maxCapacity = SUBGROUP_CAPACITY) => {
  const capacities = [];
  let remaining = Number(studentCount || 0);

  while (remaining > 0) {
    const next = Math.min(maxCapacity, remaining);
    capacities.push(next);
    remaining -= next;
  }

  return capacities;
};

const generateBatchRowsFromStudents = ({
  year,
  semester,
  mode,
  specialization,
  startGroup,
  studentCount,
  existingIds,
}) => {
  const capacities = splitStudentsIntoSubgroupCapacities(studentCount);
  const generatedRows = [];
  const occupiedIds = new Set(existingIds || []);
  let nextGroup = Number(startGroup || 1);
  let subgroupIndexWithinGroup = 0;

  const subgroupTokens = ['01', '02'];

  for (const capacity of capacities) {
    while (nextGroup <= 9999) {
      const groupToken = String(nextGroup).padStart(2, '0');
      const subgroupToken = subgroupTokens[subgroupIndexWithinGroup % subgroupTokens.length];
      const id = buildBatchId({
        year,
        semester,
        mode,
        specialization,
        group: groupToken,
        subgroup: subgroupToken,
      });

      if (occupiedIds.has(id)) {
        subgroupIndexWithinGroup += 1;
        if (subgroupIndexWithinGroup % subgroupTokens.length === 0) {
          nextGroup += 1;
        }
        continue;
      }

      occupiedIds.add(id);
      generatedRows.push({ id, capacity });

      subgroupIndexWithinGroup += 1;
      if (subgroupIndexWithinGroup % subgroupTokens.length === 0) {
        nextGroup += 1;
      }

      break;
    }
  }

  return generatedRows;
};

export default function BatchList({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [batches, setBatches] = useState(seedBatches.map(normalizeBatch));
  const [isLoading, setIsLoading] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [form, setForm] = useState(formDefaults);
  const [filters, setFilters] = useState({
    specialization: FILTER_ALL,
    year: FILTER_ALL,
    semester: FILTER_ALL,
    mode: FILTER_ALL,
  });
  const [sortBy, setSortBy] = useState('id_asc');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const loadBatches = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await api.listItems('batches');
      if (Array.isArray(response?.items)) {
        setBatches(response.items.map(normalizeBatch));
      }
    } catch {
      setErrorMessage('Unable to load batches from server. Showing local data.');
      setBatches(seedBatches.map(normalizeBatch));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...batches]
      .filter((batch) => {
        const matchesQuery =
          !q || (`${batch.id} ${batch.specialization} Y${batch.year} S${batch.semester} ${batch.mode}`).toLowerCase().includes(q);
        const matchesSpecialization =
          filters.specialization === FILTER_ALL || normalizeSpecialization(batch.specialization) === filters.specialization;
        const matchesYear = filters.year === FILTER_ALL || String(batch.year) === String(filters.year);
        const matchesSemester = filters.semester === FILTER_ALL || String(batch.semester) === String(filters.semester);
        const matchesMode = filters.mode === FILTER_ALL || String(batch.mode || '').toUpperCase() === filters.mode;

        return matchesQuery && matchesSpecialization && matchesYear && matchesSemester && matchesMode;
      })
      .sort((a, b) => {
        if (sortBy === 'id_desc') return compareBatchIds(b.id, a.id);
        if (sortBy === 'capacity_desc') return Number(b.capacity || 0) - Number(a.capacity || 0);
        if (sortBy === 'capacity_asc') return Number(a.capacity || 0) - Number(b.capacity || 0);
        if (sortBy === 'group_desc') {
          const groupCompare = Number(b.group || 0) - Number(a.group || 0);
          if (groupCompare !== 0) return groupCompare;
          return Number(b.subgroup || 0) - Number(a.subgroup || 0);
        }
        if (sortBy === 'group_asc') {
          const groupCompare = Number(a.group || 0) - Number(b.group || 0);
          if (groupCompare !== 0) return groupCompare;
          return Number(a.subgroup || 0) - Number(b.subgroup || 0);
        }
        return compareBatchIds(a.id, b.id);
      });
  }, [batches, query, filters, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters, sortBy, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredList.length / pageSize)),
    [filteredList.length, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const listMetrics = useMemo(() => {
    const totalStudents = filteredList.reduce((sum, batch) => sum + Number(batch.capacity || 0), 0);
    const weekdayBatches = filteredList.filter((batch) => String(batch.mode || '').toUpperCase() === 'WD').length;
    const weekendBatches = filteredList.filter((batch) => String(batch.mode || '').toUpperCase() === 'WE').length;

    const uniqueGroups = new Set(
      filteredList.map((batch) => {
        const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = ''] = String(batch.id)
          .split('.')
          .slice(0, 5);
        return [yearToken, semesterToken, modeToken, specializationToken, groupToken].join('.');
      }),
    );

    return {
      totalStudents,
      weekdayBatches,
      weekendBatches,
      totalGroups: uniqueGroups.size,
    };
  }, [filteredList]);

  const specializationCounts = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const key = normalizeSpecialization(batch.specialization);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [batches]);

  const specializationChartData = useMemo(
    () => SPECIALIZATION_CLOUD_TAGS.map((tag) => ({ label: tag.label, value: specializationCounts[tag.key] || 0 })),
    [specializationCounts],
  );

  const specializationChartMax = useMemo(
    () => Math.max(1, ...specializationChartData.map((item) => item.value)),
    [specializationChartData],
  );

  const generatedBatchPreview = useMemo(() => {
    if (editingId) return [];

    const studentCount = Number(form.studentCount || 0);
    if (!Number.isFinite(studentCount) || studentCount <= 0) return [];

    const startGroup = /^\d+$/.test(String(form.group || '').trim())
      ? Number(String(form.group || '').trim())
      : 1;

    return generateBatchRowsFromStudents({
      year: String(form.year || '').trim(),
      semester: String(form.semester || '').trim(),
      mode: String(form.mode || 'WD').trim().toUpperCase(),
      specialization: normalizeSpecialization(form.specialization),
      startGroup,
      studentCount,
      existingIds: batches.map((batch) => batch.id),
    });
  }, [batches, editingId, form.group, form.mode, form.semester, form.specialization, form.studentCount, form.year]);

  const resetForm = () => {
    setEditingId('');
    setIsEditDialogOpen(false);
    setForm(formDefaults);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const nextId = buildBatchId(form);
    if (!editingId && !nextId) {
      showWarning('Validation required', 'Batch ID is required.');
      return;
    }

    const year = String(form.year);
    const semester = String(form.semester);
    const mode = String(form.mode || '').toUpperCase();
    const group = String(form.group || '').trim();
    const subgroup = String(form.subgroup || '').trim();
    const studentCount = Number(form.studentCount || 0);
    const isBulkCreateMode = !editingId && Number.isFinite(studentCount) && studentCount > 0;

    if (!YEAR_OPTIONS.includes(year) || !SEMESTER_OPTIONS.includes(semester)) {
      showWarning('Validation required', 'Please select a valid year and semester.');
      return;
    }

    if (!['WD', 'WE'].includes(mode)) {
      showWarning('Validation required', 'Mode must be WD or WE.');
      return;
    }

    if (!group) {
      showWarning('Validation required', 'Group is required.');
      return;
    }

    if (!isBulkCreateMode) {
      if (!subgroup) {
        showWarning('Validation required', 'Subgroup is required.');
        return;
      }

      if (!SUBGROUP_INPUT_PATTERN.test(subgroup)) {
        showWarning('Validation required', 'Subgroup must be 1 or 2 (e.g. 01 or 02).');
        return;
      }
    }

    if (!isBulkCreateMode) {
      const candidateIdentity = parseBatchIdentity(nextId);
      if (!candidateIdentity) {
        showWarning('Validation required', 'Batch ID format is invalid.');
        return;
      }

      const peers = batches.filter((batch) => batch.id !== editingId);
      const siblingSubgroups = new Set();

      for (const batch of peers) {
        const identity = parseBatchIdentity(batch.id);
        if (!identity || identity.scopeKey !== candidateIdentity.scopeKey) {
          continue;
        }

        siblingSubgroups.add(identity.subgroup);
        if (identity.subgroup === candidateIdentity.subgroup) {
          showWarning('Validation required', 'This subgroup already exists for the selected group.');
          return;
        }
      }

      if (!siblingSubgroups.has(candidateIdentity.subgroup) && siblingSubgroups.size >= 2) {
        showWarning('Validation required', 'A group cannot have more than 2 subgroups.');
        return;
      }
    }

    const expectedPrefix = `Y${year}.S${semester}.`;
    if (!toUpper(nextId).startsWith(expectedPrefix)) {
      showWarning('Validation required', `Batch ID must start with ${expectedPrefix}`);
      return;
    }

    const specialization = normalizeSpecialization(form.specialization);
    const payload = {
      name: nextId,
      department_id: specialization,
      capacity: DEFAULT_CAPACITY,
    };

    try {
      setSavePending(true);
      setErrorMessage('');

      if (editingId) {
        const duplicateIdExists = nextId !== editingId && batches.some((batch) => batch.id === nextId);
        if (duplicateIdExists) {
          showWarning('Validation required', `Batch ID ${nextId} already exists.`);
          return;
        }

        if (nextId === editingId) {
          await api.updateItem('batches', editingId, payload);
          showSuccess('Batch updated', 'Batch details were updated successfully.');
        } else {
          await api.addItem('batches', { id: nextId, ...payload });
          await api.deleteItem('batches', editingId);
          showSuccess('Batch updated', `Batch ID changed from ${editingId} to ${nextId}.`);
        }
      } else if (isBulkCreateMode) {
        const rowsToCreate = generateBatchRowsFromStudents({
          year,
          semester,
          mode,
          specialization,
          startGroup: /^\d+$/.test(group) ? Number(group) : 1,
          studentCount,
          existingIds: batches.map((batch) => batch.id),
        });

        if (!rowsToCreate.length) {
          showWarning('Validation required', 'No group IDs were generated for the provided student count.');
          return;
        }

        for (const row of rowsToCreate) {
          await api.addItem('batches', {
            id: row.id,
            name: row.id,
            department_id: specialization,
            capacity: row.capacity,
          });
        }

        const generatedGroupCount = new Set(
          rowsToCreate.map((row) => row.id.split('.').slice(0, 5).join('.')),
        ).size;
        showSuccess(
          'Batches created',
          `${generatedGroupCount} groups (${rowsToCreate.length} subgroups) created from ${studentCount} students.`,
        );
      } else {
        await api.addItem('batches', { id: nextId, ...payload });
        showSuccess('Batch created', 'New batch was added successfully.');
      }

      await loadBatches();
      resetForm();
    } catch (error) {
      showError('Save failed', error.message || 'Failed to save batch.');
    } finally {
      setSavePending(false);
    }
  };

  const handleEdit = (batch) => {
    const [, , mode = 'WD', , group = '', subgroup = ''] = batch.id.split('.');
    setEditingId(batch.id);
    setIsEditDialogOpen(true);
    setForm({
      id: batch.id,
      specialization: batch.specialization,
      year: batch.year,
      semester: batch.semester,
      mode: toUpper(mode) || 'WD',
      group,
      subgroup,
      studentCount: String(batch.capacity || ''),
    });
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete({
      title: 'Delete batch?',
      text: `Batch ${id} will be permanently removed.`,
      confirmButtonText: 'Delete batch',
    });
    if (!confirmed) return;

    try {
      setSavePending(true);
      await api.deleteItem('batches', id);
      showSuccess('Batch deleted', `Batch ${id} was removed.`);
      await loadBatches();
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      showError('Delete failed', error.message || 'Failed to delete batch.');
    } finally {
      setSavePending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold tracking-tight text-slate-900">Batch List</h4>
            <p className="mt-1 text-sm text-slate-600">Manage only the required fields: Batch ID, specialization, year, and semester.</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            {filteredList.length} / {batches.length} visible
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Students</p>
            <p className="mt-1 text-base font-bold text-slate-900">{listMetrics.totalStudents}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Groups</p>
            <p className="mt-1 text-base font-bold text-slate-900">{listMetrics.totalGroups}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Weekday</p>
            <p className="mt-1 text-base font-bold text-slate-900">{listMetrics.weekdayBatches}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Weekend</p>
            <p className="mt-1 text-base font-bold text-slate-900">{listMetrics.weekendBatches}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Specialization Cloud</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPECIALIZATION_CLOUD_TAGS.map((tag, index) => (
              <span
                key={`${tag.label}-${index}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${SPECIALIZATION_CHIP_STYLE}`}
              >
                <span>{tag.label}</span>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {specializationCounts[tag.key] || 0}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Registered Counts</p>
            <div className="mt-2 space-y-2">
              {specializationChartData.map((item, index) => {
                const width = Math.round((item.value / specializationChartMax) * 100);
                return (
                  <div key={`${item.label}-${index}`} className="grid grid-cols-[140px_1fr_28px] items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-right text-xs font-bold text-slate-700">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="border-b border-slate-200 p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
          >
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.semester}
            onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
          >
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>Semester {semester}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.mode}
            onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
          >
            <option value="WD">Weekday (WD)</option>
            <option value="WE">Weekend (WE)</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.specialization}
            onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
          >
            {SPECIALIZATIONS.map((specialization) => (
              <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
            ))}
          </select>

          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="Group start (2 digits)"
            value={form.group}
            inputMode="numeric"
            maxLength={2}
            onChange={(e) => setForm((prev) => ({ ...prev, group: cleanTwoDigitGroupValue(e.target.value) }))}
          />

          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="Subgroup (2 digits)"
            value={form.subgroup}
            inputMode="numeric"
            maxLength={2}
            disabled={Number(form.studentCount || 0) > 0}
            onChange={(e) => {
              const nextValue = cleanTwoDigitGroupValue(e.target.value);
              setForm((prev) => ({ ...prev, subgroup: nextValue }));
            }}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            type="number"
            min="0"
            placeholder="Students to add (auto-generate groups)"
            value={form.studentCount}
            onChange={(e) => setForm((prev) => ({ ...prev, studentCount: e.target.value }))}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
            Enter student count to auto-generate groups: each group has 2 subgroups (01, 02) and each subgroup has 60 students.
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-600">
          Batch ID will be generated automatically: {buildBatchId(form) || 'Y?.S?.WD.IT.01.01'}
        </p>

        {generatedBatchPreview.length > 0 && (
          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs font-semibold text-sky-700">Generated Subgroup IDs ({generatedBatchPreview.length})</p>
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {generatedBatchPreview.slice(0, 20).map((row) => (
                <p key={row.id} className="font-mono text-xs text-slate-700">{row.id} • {row.capacity} students</p>
              ))}
              {generatedBatchPreview.length > 20 && (
                <p className="text-xs text-slate-500">...and {generatedBatchPreview.length - 20} more</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <button
            type="submit"
            disabled={savePending}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-700 bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow disabled:opacity-60"
          >
            {savePending ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>

      {errorMessage && (
        <p className="border-y border-amber-300 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-700">
          {errorMessage}
        </p>
      )}

      {isLoading && (
        <p className="border-b border-slate-200 px-6 py-3 text-sm text-slate-600">Loading batches...</p>
      )}

      <div className="border-b border-slate-200 p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="Search by Batch ID, specialization, year, or semester"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={filters.specialization}
            onChange={(e) => setFilters((prev) => ({ ...prev, specialization: e.target.value }))}
          >
            <option value={FILTER_ALL}>All Specializations</option>
            {SPECIALIZATIONS.map((specialization) => (
              <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={filters.year}
            onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
          >
            <option value={FILTER_ALL}>All Years</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={filters.semester}
            onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
          >
            <option value={FILTER_ALL}>All Semesters</option>
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>Semester {semester}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={filters.mode}
            onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value }))}
          >
            <option value={FILTER_ALL}>All Modes</option>
            <option value="WD">Weekday (WD)</option>
            <option value="WE">Weekend (WE)</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-600">
            Showing {paginatedList.length} of {filteredList.length} filtered batches
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-slate-600" htmlFor="batch-page-size">Rows</label>
            <select
              id="batch-page-size"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSortBy('id_asc');
                setFilters({
                  specialization: FILTER_ALL,
                  year: FILTER_ALL,
                  semester: FILTER_ALL,
                  mode: FILTER_ALL,
                });
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-100/70 p-3">
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900 text-white">
            <tr>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Batch ID</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Specialization</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Year</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Semester</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Mode</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Group</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Subgroup</th>
              <th className="border-r border-slate-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Actions</th>
            </tr>
            </thead>
            <tbody>
              {paginatedList.map((batch, idx) => (
                <tr
                  key={batch.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} transition-colors hover:bg-sky-50`}
                >
                  <td className="border-r border-t border-slate-200 px-4 py-4 font-mono text-sm font-semibold text-slate-900">{batch.id}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">{batch.specialization}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">Y{batch.year}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">S{batch.semester}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">{batch.mode || '--'}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">{batch.group || '--'}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">{batch.subgroup || '--'}</td>
                  <td className="border-r border-t border-slate-200 px-4 py-4 text-sm text-slate-700">{batch.capacity || '--'}</td>
                  <td className="border-t border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(batch)}
                      className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(batch.id)}
                      className="rounded-lg border border-red-900 bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-50 shadow-sm transition hover:-translate-y-0.5 hover:border-red-950 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredList.length === 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No batches match your current search.</p>
          </div>
        )}
      </div>

      {filteredList.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <p className="text-xs font-semibold text-slate-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isEditDialogOpen && typeof document !== 'undefined' && createPortal((
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h5 className="text-lg font-semibold text-slate-900">Edit Batch Details</h5>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  value={form.semester}
                  onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
                >
                  {SEMESTER_OPTIONS.map((semester) => (
                    <option key={semester} value={semester}>Semester {semester}</option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  value={form.mode}
                  onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="WD">Weekday (WD)</option>
                  <option value="WE">Weekend (WE)</option>
                </select>

                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  value={form.specialization}
                  onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
                >
                  {SPECIALIZATIONS.map((specialization) => (
                    <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
                  ))}
                </select>

                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Group (2 digits)"
                  value={form.group}
                  inputMode="numeric"
                  maxLength={2}
                  onChange={(e) => setForm((prev) => ({ ...prev, group: cleanTwoDigitGroupValue(e.target.value) }))}
                />

                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Subgroup (01 or 02)"
                  value={form.subgroup}
                  inputMode="numeric"
                  maxLength={2}
                  onChange={(e) => {
                    const nextValue = cleanTwoDigitGroupValue(e.target.value);
                    setForm((prev) => ({ ...prev, subgroup: nextValue }));
                  }}
                />
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-600">
                Updated Batch ID: {buildBatchId(form) || 'Y?.S?.WD.IT.01.01'}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePending}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-black hover:to-slate-900 hover:shadow disabled:opacity-60"
                >
                  {savePending ? 'Saving...' : 'Update Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
