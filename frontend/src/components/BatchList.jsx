import { useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';
import seedBatches from '../data/batches.js';
import { confirmDelete, showError, showSuccess, showWarning, editBatchPrompt } from '../utils/alerts.js';

const STREAMS = ['IT', 'SE', 'DS', 'Engineering'];
const MODES = ['ALL', 'Weekday', 'Weekend'];
const SORT_OPTIONS = [
  { value: 'id-asc', label: 'Batch ID (A-Z)' },
  { value: 'id-desc', label: 'Batch ID (Z-A)' },
  { value: 'capacity-desc', label: 'Capacity (High-Low)' },
  { value: 'capacity-asc', label: 'Capacity (Low-High)' },
];

const SPECIALIZATIONS = [
  { key: 'IT', label: 'IT' },
  { key: 'SE', label: 'SE' },
  { key: 'DS', label: 'DS' },
  { key: 'ISE', label: 'ISE' },
  { key: 'CS', label: 'CS' },
  { key: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { key: 'IM', label: 'IM' },
  { key: 'CN', label: 'CN' },
];

const SPECIALIZATION_ALIASES = {
  COMPUTER_SCIENCE: 'COMPUTER_SCIENCE',
  COMPUTERSCIENCE: 'COMPUTER_SCIENCE',
  CSNE: 'CN',
  CN: 'CN',
};

const getDepartmentLane = (department) => {
  if (department === 'IT' || department === 'SE' || department === 'DS') {
    return department;
  }
  return 'Engineering';
};

const getBatchMeta = (batchId) => {
  const parts = batchId.split('.');
  const year = parts[0] || 'Y?';
  const semester = parts[1] || 'S?';
  const mode = parts[2] || '';
  const token4 = parts[3] || '';
  const token5 = parts[4] || '';
  const token6 = parts[5] || '';

  const token4IsNumeric = /^\d+$/.test(token4);
  const token5IsNumeric = /^\d+$/.test(token5);
  const token4LooksDepartment = /^[A-Za-z_]+$/.test(token4);

  let department = '';
  let group = '--';
  let subgroup = '';

  // New format:
  // Group:    Y1.S1.WD.01
  // Subgroup: Y1.S1.WD.01.01
  if (token4IsNumeric) {
    group = token4;
    subgroup = token5IsNumeric ? token5 : '';
  }

  // Legacy format:
  // Y2.S2.WD.IT.01
  if (!token4IsNumeric && token4LooksDepartment) {
    department = token4;
    group = token5 || '--';
    subgroup = token6 || '';
  }

  return {
    year,
    semester,
    mode,
    department,
    group,
    subgroup,
    isSubgroup: Boolean(subgroup),
    isWeekend: mode === 'WE',
  };
};

const DEFAULT_CAPACITY = 120;
const MAX_SUBGROUP_SIZE = 60;
const MAX_GROUP_SIZE = 120;

const getCapacityLimitForBatchId = (batchId = '') =>
  getBatchMeta(String(batchId)).isSubgroup ? MAX_SUBGROUP_SIZE : MAX_GROUP_SIZE;

const toNumeric = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return num;
};

const getSpecializationTotal = (specializationSizes = {}) =>
  Object.values(specializationSizes).reduce((sum, value) => sum + toNumeric(value), 0);

const inferDepartmentFromId = (id = '') => {
  const meta = getBatchMeta(String(id));
  return meta.department || 'GEN';
};

const normalizeSpecializationKey = (raw = '') => {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  if (!cleaned) return '';

  if (SPECIALIZATIONS.some((item) => item.key === cleaned)) {
    return cleaned;
  }

  return SPECIALIZATION_ALIASES[cleaned] || '';
};

const inferSpecializationFromBatchId = (id = '') => {
  const meta = getBatchMeta(String(id));
  return normalizeSpecializationKey(meta.department || '');
};

const getBatchSpecializationKeys = (batch) => {
  const keys = SPECIALIZATIONS
    .filter((specialization) => toNumeric(batch.specialization_sizes?.[specialization.key]) > 0)
    .map((specialization) => specialization.key);

  if (keys.length > 0) {
    return keys;
  }

  const fallback =
    normalizeSpecializationKey(batch.department_id) ||
    inferSpecializationFromBatchId(batch.id) ||
    normalizeSpecializationKey(getBatchMeta(batch.id).department);

  return fallback ? [fallback] : [];
};

const getBatchLane = (batch) => {
  const primary = getBatchSpecializationKeys(batch)[0];
  if (primary) {
    return getDepartmentLane(primary);
  }

  const department = String(batch.department_id || getBatchMeta(batch.id).department || '').toUpperCase();
  return getDepartmentLane(department);
};

const normalizeBatch = (item) => {
  const id = String(item?.id || '').trim();
  const department = item?.department_id || inferDepartmentFromId(id);
  const specializationSizesFromItem = item?.specialization_sizes || item?.specializationSizes || {};

  const specialization_sizes = SPECIALIZATIONS.reduce((acc, specialization) => {
    const raw = specializationSizesFromItem[specialization.key];
    acc[specialization.key] = String(raw ?? '');
    return acc;
  }, {});

  const hasAnySpecialization = SPECIALIZATIONS.some(
    (specialization) => toNumeric(specialization_sizes[specialization.key]) > 0,
  );

  if (!hasAnySpecialization) {
    const inferredSpecialization = inferSpecializationFromBatchId(id) || normalizeSpecializationKey(department);
    if (inferredSpecialization) {
      specialization_sizes[inferredSpecialization] = String(item?.capacity || DEFAULT_CAPACITY);
    }
  }

  const specializationTotal = getSpecializationTotal(specialization_sizes);

  return {
    id,
    name: item?.name || id,
    department_id: department,
    specialization_sizes,
    capacity: Number(item?.capacity || specializationTotal || DEFAULT_CAPACITY),
  };
};

const toPayload = (form) => {
  const chosenSpecialization = normalizeSpecializationKey(form.specialization_key);
  const chosenSpecializationSize = toNumeric(form.specialization_size);

  const specialization_sizes = SPECIALIZATIONS.reduce((acc, specialization) => {
    acc[specialization.key] = specialization.key === chosenSpecialization ? chosenSpecializationSize : 0;
    return acc;
  }, {});

  const specializationTotal = getSpecializationTotal(specialization_sizes);
  const batchCapacity = toNumeric(form.capacity || specializationTotal || DEFAULT_CAPACITY);

  return {
    name: form.name.trim(),
    department_id: form.department_id.trim().toUpperCase(),
    capacity: batchCapacity,
    specialization_sizes,
  };
};

export default function BatchList({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');
  const [batches, setBatches] = useState(seedBatches.map(normalizeBatch));
  const [isLoading, setIsLoading] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [batchForm, setBatchForm] = useState({
    id: '',
    name: '',
    department_id: 'IT',
    capacity: String(DEFAULT_CAPACITY),
    specialization_key: 'IT',
    specialization_size: '',
  });

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

  const years = useMemo(() => {
    const values = new Set();
    batches.forEach((batch) => values.add(getBatchMeta(batch.id).year));
    return ['ALL', ...Array.from(values).sort()];
  }, [batches]);

  const semesters = useMemo(() => {
    const values = new Set();
    batches.forEach((batch) => values.add(getBatchMeta(batch.id).semester));
    return ['ALL', ...Array.from(values).sort()];
  }, [batches]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = batches.filter((batch) => {
      const meta = getBatchMeta(batch.id);
      const lane = getBatchLane(batch);
      const specializationKeys = getBatchSpecializationKeys(batch);
      const specializationLabels = specializationKeys
        .map((key) => SPECIALIZATIONS.find((item) => item.key === key)?.label || key)
        .join(' ');
      const modeLabel = meta.isWeekend ? 'Weekend' : 'Weekday';
      const searchable = `${batch.id} ${batch.name} ${batch.department_id} ${meta.year} ${meta.semester} ${modeLabel} ${specializationKeys.join(' ')} ${specializationLabels}`.toLowerCase();
      const matchesSpecialization =
        selectedSpecialization === 'ALL' ||
        specializationKeys.includes(selectedSpecialization);

      const matchesQuery = !q || searchable.includes(q);
      const matchesStream = selectedStream === 'ALL' || lane === selectedStream;
      const matchesMode = selectedMode === 'ALL' || modeLabel === selectedMode;
      const matchesYear = selectedYear === 'ALL' || meta.year === selectedYear;
      const matchesSemester = selectedSemester === 'ALL' || meta.semester === selectedSemester;

      return (
        matchesQuery &&
        matchesStream &&
        matchesSpecialization &&
        matchesMode &&
        matchesYear &&
        matchesSemester
      );
    });

    const sorted = [...filtered];
    if (sortBy === 'id-asc') sorted.sort((a, b) => a.id.localeCompare(b.id));
    if (sortBy === 'id-desc') sorted.sort((a, b) => b.id.localeCompare(a.id));
    if (sortBy === 'capacity-desc') sorted.sort((a, b) => b.capacity - a.capacity);
    if (sortBy === 'capacity-asc') sorted.sort((a, b) => a.capacity - b.capacity);

    return sorted;
  }, [
    batches,
    query,
    selectedMode,
    selectedSemester,
    selectedSpecialization,
    selectedStream,
    selectedYear,
    sortBy,
  ]);

  const streamBuckets = useMemo(() => {
    const seeded = STREAMS.reduce((acc, stream) => {
      acc[stream] = [];
      return acc;
    }, {});

    list.forEach((batch) => {
      const lane = getBatchLane(batch);
      seeded[lane].push(batch);
    });

    return seeded;
  }, [list]);

  const specializationBuckets = useMemo(() => {
    const seeded = SPECIALIZATIONS.reduce((acc, specialization) => {
      acc[specialization.key] = [];
      return acc;
    }, {});

    list.forEach((batch) => {
      const specializationKeys = getBatchSpecializationKeys(batch);
      specializationKeys.forEach((key) => {
        if (seeded[key]) {
          seeded[key].push(batch);
        }
      });
    });

    return seeded;
  }, [list]);

  const totalCapacity = useMemo(
    () => list.reduce((sum, batch) => sum + (batch.capacity || 0), 0),
    [list],
  );

  const totalWeekend = useMemo(
    () => list.filter((batch) => getBatchMeta(batch.id).isWeekend).length,
    [list],
  );

  const clearFilters = () => {
    setQuery('');
    setSelectedStream('ALL');
    setSelectedSpecialization('ALL');
    setSelectedMode('ALL');
    setSelectedYear('ALL');
    setSelectedSemester('ALL');
    setSortBy('id-asc');
  };

  const resetForm = () => {
    setEditingId('');
    setBatchForm({
      id: '',
      name: '',
      department_id: 'IT',
      capacity: String(DEFAULT_CAPACITY),
      specialization_key: 'IT',
      specialization_size: '',
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!batchForm.name.trim()) {
      showWarning('Validation required', 'Batch name is required.');
      return;
    }

    if (!editingId && !batchForm.id.trim()) {
      showWarning('Validation required', 'Batch ID is required for new batches.');
      return;
    }

    const specializationSize = toNumeric(batchForm.specialization_size);
    if (specializationSize <= 0) {
      showWarning(
        'Validation required',
        'Please provide specialization size for the selected specialization.'
      );
      return;
    }

    const batchIdForValidation = editingId || batchForm.id;
    const maxCapacityForType = getCapacityLimitForBatchId(batchIdForValidation);
    const specializationTotal = specializationSize;
    const effectiveBatchSize = toNumeric(batchForm.capacity || specializationTotal || DEFAULT_CAPACITY);

    if (effectiveBatchSize > maxCapacityForType) {
      showWarning(
        'Batch size exceeds campus limit',
        maxCapacityForType === MAX_SUBGROUP_SIZE
          ? 'This subgroup can have a maximum of 60 students.'
          : 'One group can have a maximum of 120 students.'
      );
      return;
    }

    if (specializationSize > maxCapacityForType) {
      showWarning(
        'Specialization size exceeds subgroup limit',
        `${batchForm.specialization_key} cannot exceed ${maxCapacityForType} students for this batch type.`
      );
      return;
    }

    try {
      setSavePending(true);
      setErrorMessage('');
      const payload = toPayload(batchForm);

      if (editingId) {
        await api.updateItem('batches', editingId, payload);
        showSuccess('Batch updated', 'Batch details were updated successfully.');
      } else {
        await api.addItem('batches', { id: batchForm.id.trim(), ...payload });
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

  const handleEdit = async (batch) => {
    const currentSpecialization =
      SPECIALIZATIONS.find((specialization) => toNumeric(batch.specialization_sizes?.[specialization.key]) > 0)?.key ||
      inferSpecializationFromBatchId(batch.id) ||
      'IT';

    const formData = await editBatchPrompt({
      batchId: batch.id,
      batchName: batch.name || batch.id,
      capacity: String(batch.capacity || DEFAULT_CAPACITY),
      specializationKey: currentSpecialization,
      specializationSize: String(toNumeric(batch.specialization_sizes?.[currentSpecialization])),
      specializations: SPECIALIZATIONS,
    });

    if (!formData) {
      return;
    }

    // Validate
    if (!formData.name.trim()) {
      showWarning('Validation required', 'Batch name is required.');
      return;
    }

    const specializationSize = toNumeric(formData.specialization_size);
    if (specializationSize <= 0) {
      showWarning(
        'Validation required',
        'Please provide specialization size for the selected specialization.'
      );
      return;
    }

    const maxCapacityForType = getCapacityLimitForBatchId(batch.id);
    const effectiveBatchSize = toNumeric(formData.capacity || specializationSize || DEFAULT_CAPACITY);

    if (effectiveBatchSize > maxCapacityForType) {
      showWarning(
        'Batch size exceeds campus limit',
        maxCapacityForType === MAX_SUBGROUP_SIZE
          ? 'This subgroup can have a maximum of 60 students.'
          : 'One group can have a maximum of 120 students.'
      );
      return;
    }

    if (specializationSize > maxCapacityForType) {
      showWarning(
        'Specialization size exceeds subgroup limit',
        `${formData.specialization_key} cannot exceed ${maxCapacityForType} students for this batch type.`
      );
      return;
    }

    // Submit the update
    try {
      setSavePending(true);
      const payload = {
        name: formData.name.trim(),
        department_id: String(formData.specialization_key || batch.department_id || 'IT').trim().toUpperCase(),
        capacity: effectiveBatchSize,
        specialization_sizes: SPECIALIZATIONS.reduce((acc, specialization) => {
          acc[specialization.key] = specialization.key === formData.specialization_key ? specializationSize : 0;
          return acc;
        }, {}),
      };

      await api.updateItem('batches', batch.id, payload);
      showSuccess('Batch updated', 'Batch details were updated successfully.');
      await loadBatches();
    } catch (error) {
      showError('Update failed', error.message || 'Failed to update batch.');
    } finally {
      setSavePending(false);
    }
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
    <div className="border-b border-[#E2E8F0] bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-[#E2E8F0] p-6 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Batch Operations</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create, update, delete, and manage academic batches and their specialization allocations.</p>
          </div>
          <div className="border border-[#E2E8F0] bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {list.length} shown · {totalCapacity} capacity
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="border-b border-[#E2E8F0] p-6 dark:border-gray-800">
        <div className="grid gap-3 xl:grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_auto]">
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          placeholder="Batch ID (Y1.S1.WD.01 or Y1.S1.WD.01.01)"
          value={batchForm.id}
          disabled={Boolean(editingId)}
          onChange={(e) => setBatchForm((prev) => ({ ...prev, id: e.target.value }))}
        />
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          placeholder="Batch Name"
          value={batchForm.name}
          onChange={(e) => setBatchForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm uppercase text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          placeholder="Department"
          value={batchForm.department_id}
          onChange={(e) => setBatchForm((prev) => ({ ...prev, department_id: e.target.value }))}
        />
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          type="number"
          min="0"
          placeholder="Batch Size (Total)"
          value={batchForm.capacity}
          onChange={(e) => setBatchForm((prev) => ({ ...prev, capacity: e.target.value }))}
        />
        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={batchForm.specialization_key}
          onChange={(e) => {
            const nextKey = e.target.value;
            setBatchForm((prev) => ({ ...prev, specialization_key: nextKey, department_id: nextKey }));
          }}
        >
          {SPECIALIZATIONS.map((specialization) => (
            <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
          ))}
        </select>
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          type="number"
          min="0"
          placeholder="Specialization Size"
          value={batchForm.specialization_size}
          onChange={(e) => setBatchForm((prev) => ({ ...prev, specialization_size: e.target.value }))}
        />
        <div className="flex w-full items-stretch gap-2 xl:w-auto xl:items-end xl:justify-end">
          <button
            type="submit"
            disabled={savePending}
            className="inline-flex min-h-10 flex-1 items-center justify-center border border-[#059669] bg-[#059669] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60 xl:min-w-[96px] xl:flex-none"
          >
            {savePending ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-10 flex-1 items-center justify-center border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 xl:min-w-[96px] xl:flex-none"
            >
              Cancel
            </button>
          )}
        </div>
        </div>

        <p className="mt-3 border border-[#E2E8F0] bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          Campus rule: One group has subgroups 1.1 and 1.2. Each subgroup can have a maximum of 60 students (group total max 120).
        </p>
      </form>

      {errorMessage && (
        <p className="border-b border-[#E2E8F0] border-t border-amber-300 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-700 dark:border-y-gray-700 dark:bg-gray-900 dark:text-amber-400">
          {errorMessage}
        </p>
      )}

      {isLoading && (
        <p className="border-b border-[#E2E8F0] px-6 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">Loading batches...</p>
      )}

      <div className="border-b border-[#E2E8F0] p-6 dark:border-gray-800">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
        <input
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-emerald-900"
          placeholder="Search batch (e.g. Y1.S1.WD.01 or Y1.S1.WD.01.01)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
        >
          <option value="ALL">All Streams</option>
          {STREAMS.map((stream) => (
            <option key={stream} value={stream}>{stream}</option>
          ))}
        </select>

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
        >
          <option value="ALL">All Specializations</option>
          {SPECIALIZATIONS.map((specialization) => (
            <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
          ))}
        </select>

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          {MODES.map((mode) => (
            <option key={mode} value={mode}>{mode === 'ALL' ? 'All Modes' : mode}</option>
          ))}
        </select>

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year === 'ALL' ? 'All Years' : year}</option>
          ))}
        </select>

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {semesters.map((semester) => (
            <option key={semester} value={semester}>{semester === 'ALL' ? 'All Semesters' : semester}</option>
          ))}
        </select>

        <select
          className="border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#059669] focus:ring-1 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((specialization) => (
              <button
                key={specialization.key}
                type="button"
                onClick={() =>
                  setSelectedSpecialization((current) =>
                    current === specialization.key ? 'ALL' : specialization.key
                  )
                }
                className={`border px-3 py-1 text-xs font-semibold transition-all ${
                  selectedSpecialization === specialization.key
                    ? 'border-[#059669] bg-[#059669] text-white'
                    : 'border-[#E2E8F0] bg-white text-gray-600 hover:border-[#059669] hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-600'
                }`}
              >
                {specialization.label}: {specializationBuckets[specialization.key].length}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="border-b border-[#E2E8F0] p-6 dark:border-gray-800">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-[#E2E8F0] bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Total Capacity</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{totalCapacity}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Weekend Batches</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{totalWeekend}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Weekday Batches</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{list.length - totalWeekend}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-[#E2E8F0] dark:border-gray-800">
        {SPECIALIZATIONS.map((specialization) => {
          const specializationBatchList = specializationBuckets[specialization.key];
          const weekdayBatches = specializationBatchList.filter((batch) => !getBatchMeta(batch.id).isWeekend);
          const weekendBatches = specializationBatchList.filter((batch) => getBatchMeta(batch.id).isWeekend);

          const renderBatchCard = (batch) => {
            const meta = getBatchMeta(batch.id);
            const occupancyPercent = Math.min(100, Math.round((batch.capacity / 120) * 100));
            const subgroup11 = Math.ceil((batch.capacity || 0) / 2);
            const subgroup12 = Math.floor((batch.capacity || 0) / 2);
            const specializationTags = SPECIALIZATIONS
              .map((specialization) => ({
                label: specialization.label,
                value: toNumeric(batch.specialization_sizes?.[specialization.key]),
              }))
              .filter((entry) => entry.value > 0);

            return (
              <div key={batch.id} className="border-b border-[#E2E8F0] bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{batch.id}</div>
                  <span className={`px-2 py-0.5 text-[11px] font-semibold border ${
                    meta.isWeekend
                      ? 'border-[#F59E0B] bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-gray-900 dark:text-amber-400'
                      : 'border-[#10B981] bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-400'
                  }`}>
                    {meta.isWeekend ? '📅 Weekend' : '🏢 Weekday'}
                  </span>
                </div>

                <p className="mt-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">{batch.name}</p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  <span className="border border-[#E2E8F0] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">{meta.year}</span>
                  <span className="border border-[#E2E8F0] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">{meta.semester}</span>
                  <span className="border border-[#E2E8F0] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">G{meta.group}</span>
                  {meta.subgroup && (
                    <span className="border border-[#E2E8F0] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      SG{meta.subgroup}
                    </span>
                  )}
                  {batch.department_id && (
                    <span className="border border-[#E2E8F0] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {batch.department_id}
                    </span>
                  )}
                </div>

                {specializationTags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {specializationTags.map((entry) => {
                      const specKey = SPECIALIZATIONS.find(s => s.label === entry.label)?.key;
                      return (
                        <button
                          key={`${batch.id}-${entry.label}`}
                          type="button"
                          onClick={() => setSelectedSpecialization(specKey || 'ALL')}
                          className="border border-[#059669] bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition-all cursor-pointer hover:bg-emerald-100 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        >
                          {entry.label}: {entry.value}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Capacity</span>
                    <span className="font-semibold">{batch.capacity} / 120</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden border border-[#E2E8F0] bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                    <div
                      className="h-full bg-[#059669] transition-all duration-300"
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                    {meta.isSubgroup ? (
                      <span className="border border-[#059669] bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-400">
                        Subgroup {meta.subgroup}
                      </span>
                    ) : (
                      <>
                        <span className="border border-[#059669] bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:border-emerald-600 dark:bg-gray-900 dark:text-emerald-400">
                          1.1: {subgroup11}
                        </span>
                        <span className="border border-[#F59E0B] bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:border-amber-600 dark:bg-gray-900 dark:text-amber-400">
                          1.2: {subgroup12}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(batch)}
                    className="inline-flex min-h-8 items-center justify-center border border-[#059669] bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(batch.id)}
                    className="inline-flex min-h-8 items-center justify-center border border-[#EF4444] bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 dark:border-red-600 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-gray-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          };

          return (
            <section key={specialization.key} className="border-b border-[#E2E8F0] dark:border-gray-800">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <h5 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                  {specialization.label} Batches
                </h5>
                <span className="border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                  {specializationBatchList.length}
                </span>
              </div>

              <div className="bg-white dark:bg-gray-950">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">📅 Weekday</p>
                    <span className="border border-[#E2E8F0] bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      {weekdayBatches.length}
                    </span>
                  </div>
                  {weekdayBatches.length === 0 ? (
                    <div className="border-b border-[#E2E8F0] px-4 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      No weekday {specialization.label} batches.
                    </div>
                  ) : (
                    <div>
                      {weekdayBatches.map(renderBatchCard)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">🌙 Weekend</p>
                    <span className="border border-[#E2E8F0] bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      {weekendBatches.length}
                    </span>
                  </div>
                  {weekendBatches.length === 0 ? (
                    <div className="border-b border-[#E2E8F0] px-4 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      No weekend {specialization.label} batches.
                    </div>
                  ) : (
                    <div>
                      {weekendBatches.map(renderBatchCard)}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {list.length === 0 && (
          <div className="border-b border-[#E2E8F0] bg-white px-6 py-8 text-center dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-500 dark:text-gray-400">No batches match your current search and filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
