import { useEffect, useMemo, useState } from 'react';
import api from '../api/scheduler.js';
import seedBatches from '../data/batches.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';

const DEFAULT_CAPACITY = 120;

const SPECIALIZATIONS = [
  { key: 'IT', label: 'IT' },
  { key: 'SE', label: 'SE' },
  { key: 'DS', label: 'DS' },
  { key: 'ISE', label: 'ISE' },
  { key: 'CS', label: 'CS' },
  { key: 'IM', label: 'IM' },
  { key: 'CN', label: 'CN' },
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

const toUpper = (value = '') => String(value).trim().toUpperCase();

const getBatchMeta = (batchId = '') => {
  const normalized = String(batchId).trim();
  const match = normalized.match(/^Y(\d+)\.S(\d+)\./i);
  return {
    year: match ? match[1] : '',
    semester: match ? match[2] : '',
  };
};

const inferSpecializationFromId = (batchId = '') => {
  const tokens = String(batchId).trim().split('.');
  return toUpper(tokens[3] || '');
};

const normalizeSpecialization = (raw = '') => {
  const key = toUpper(raw);
  return SPECIALIZATIONS.some((item) => item.key === key) ? key : 'IT';
};

const normalizeBatch = (item) => {
  const id = String(item?.id || '').trim();
  const meta = getBatchMeta(id);
  const tokens = id.split('.');
  return {
    id,
    specialization: normalizeSpecialization(item?.department_id || inferSpecializationFromId(id)),
    year: meta.year || '1',
    semester: meta.semester || '1',
    group: tokens[4] || '',
    subgroup: tokens[5] || '',
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

export default function BatchList({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [batches, setBatches] = useState(seedBatches.map(normalizeBatch));
  const [isLoading, setIsLoading] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(formDefaults);

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

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...batches]
      .filter((batch) => {
        if (!q) return true;
        return (`${batch.id} ${batch.specialization} Y${batch.year} S${batch.semester}`).toLowerCase().includes(q);
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [batches, query]);

  const specializationCounts = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const key = normalizeSpecialization(batch.specialization);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [batches]);

  const resetForm = () => {
    setEditingId('');
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

    if (!subgroup) {
      showWarning('Validation required', 'Subgroup is required.');
      return;
    }

    if (!/^\d+$/.test(subgroup)) {
      showWarning('Validation required', 'Subgroup must be numeric.');
      return;
    }

    const expectedPrefix = `Y${year}.S${semester}.`;
    if (!toUpper(nextId).startsWith(expectedPrefix)) {
      showWarning('Validation required', `Batch ID must start with ${expectedPrefix}`);
      return;
    }

    const specialization = normalizeSpecialization(form.specialization);
    const payload = {
      // Backend still requires these fields even though UI only asks for four values.
      name: editingId || nextId,
      department_id: specialization,
      capacity: DEFAULT_CAPACITY,
    };

    try {
      setSavePending(true);
      setErrorMessage('');

      if (editingId) {
        await api.updateItem('batches', editingId, payload);
        showSuccess('Batch updated', 'Batch details were updated successfully.');
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
    const [, , mode = 'WD', specialization = batch.specialization, group = '', subgroup = ''] = batch.id.split('.');
    setEditingId(batch.id);
    setForm({
      id: batch.id,
      specialization: batch.specialization,
      year: batch.year,
      semester: batch.semester,
      mode: toUpper(mode) || 'WD',
      group,
      subgroup,
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
            {list.length} batches
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
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="border-b border-slate-200 p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
            disabled={Boolean(editingId)}
          >
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.semester}
            onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
            disabled={Boolean(editingId)}
          >
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>Semester {semester}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.mode}
            onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
            disabled={Boolean(editingId)}
          >
            <option value="WD">Weekday (WD)</option>
            <option value="WE">Weekend (WE)</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            value={form.specialization}
            onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
            disabled={Boolean(editingId)}
          >
            {SPECIALIZATIONS.map((specialization) => (
              <option key={specialization.key} value={specialization.key}>{specialization.label}</option>
            ))}
          </select>

          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="Group (e.g. 01)"
            value={form.group}
            onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
            disabled={Boolean(editingId)}
          />

          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            placeholder="Subgroup (e.g. 01)"
            value={form.subgroup}
            onChange={(e) => setForm((prev) => ({ ...prev, subgroup: e.target.value }))}
            disabled={Boolean(editingId)}
          />
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-600">
          Batch ID will be generated automatically: {buildBatchId(form) || 'Y?.S?.WD.IT.01.01'}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <button
            type="submit"
            disabled={savePending}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-700 bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow disabled:opacity-60"
          >
            {savePending ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
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
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Search by Batch ID, specialization, year, or semester"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border-b border-slate-200">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Batch ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Specialization</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Year</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Semester</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Group</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Subgroup</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((batch, idx) => (
              <tr key={batch.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-4 py-4 font-mono text-sm font-semibold text-slate-900">{batch.id}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{batch.specialization}</td>
                <td className="px-4 py-4 text-sm text-slate-700">Y{batch.year}</td>
                <td className="px-4 py-4 text-sm text-slate-700">S{batch.semester}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{batch.group || '--'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{batch.subgroup || '--'}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(batch)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(batch.id)}
                      className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.length === 0 && (
          <div className="border-t border-slate-200 bg-white px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No batches match your current search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
