import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Filter, RotateCcw, Pencil, Trash2, ChevronDown, ChevronRight, Plus, Layers } from 'lucide-react';
import { buildBatches } from '../data/batches.js';
import api from '../api/scheduler.js';

const SPECIALIZATIONS = ['IT', 'SE', 'DS', 'CS', 'ISE', 'IM', 'CSNE'];
const SPECIALIZATION_LABELS = {
  IT: 'Information Technology',
  SE: 'Software Engineering',
  DS: 'Data Science',
  CS: 'Computer Science',
  ISE: 'Information Systems Engineering',
  IM: 'Interactive Media',
  CSNE: 'Computer Systems & Network Engineering',
};
const SPECIALIZATION_COLORS = {
  IT: { badge: 'bg-blue-100 text-blue-800 border-blue-300', header: 'bg-blue-50 border-blue-200', accent: 'bg-blue-600' },
  SE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', header: 'bg-emerald-50 border-emerald-200', accent: 'bg-emerald-600' },
  DS: { badge: 'bg-violet-100 text-violet-800 border-violet-300', header: 'bg-violet-50 border-violet-200', accent: 'bg-violet-600' },
  CS: { badge: 'bg-amber-100 text-amber-800 border-amber-300', header: 'bg-amber-50 border-amber-200', accent: 'bg-amber-600' },
  ISE: { badge: 'bg-pink-100 text-pink-800 border-pink-300', header: 'bg-pink-50 border-pink-200', accent: 'bg-pink-600' },
  IM: { badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', header: 'bg-indigo-50 border-indigo-200', accent: 'bg-indigo-600' },
  CSNE: { badge: 'bg-red-100 text-red-800 border-red-300', header: 'bg-red-50 border-red-200', accent: 'bg-red-600' },
};

const DEFAULT_FORM = {
  year: '1',
  semester: '1',
  mode: 'WD',
  specialization: 'IT',
  groupNumber: '01',
  isSubgroup: false,
  subgroupNumber: '01',
  capacity: '120',
};

export default function FacultyBatchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);
  const [createError, setCreateError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editForm, setEditForm] = useState({ batchId: '', capacity: '120' });
  const [updatingBatch, setUpdatingBatch] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [newBatchForm, setNewBatchForm] = useState(DEFAULT_FORM);
  const [filters, setFilters] = useState({
    department: 'all',
    mode: 'all',
    year: 'all',
    semester: 'all',
  });
  const [batchesData, setBatchesData] = useState([]);
  const [expandedDept, setExpandedDept] = useState(null);

  const buildBatchIdFromForm = (form) => {
    const g = String(form.groupNumber || '01').padStart(2, '0');
    if (form.isSubgroup) {
      const sg = String(form.subgroupNumber || '01').padStart(2, '0');
      return `Y${form.year}.S${form.semester}.${form.mode}.${form.specialization}.${g}.${sg}`;
    }
    return `Y${form.year}.S${form.semester}.${form.mode}.${form.specialization}.${g}`;
  };

  const previewBatchId = buildBatchIdFromForm(newBatchForm);

  const parseBatchId = (batchId) => {
    const normalized = String(batchId || '').trim().toUpperCase();
    // Match group format: Y1.S1.WD.IT.01
    const groupMatch = normalized.match(/^Y(\d+)\.S(\d+)\.(WE|WD)\.([A-Z0-9]+)\.(\d{2})$/);
    if (groupMatch) {
      return {
        year: groupMatch[1],
        semester: groupMatch[2],
        mode: groupMatch[3],
        department: groupMatch[4],
        number: groupMatch[5],
        subgroup: null,
        isSubgroup: false,
        fullId: normalized,
      };
    }
    // Match subgroup format: Y1.S1.WD.IT.01.01
    const subgroupMatch = normalized.match(/^Y(\d+)\.S(\d+)\.(WE|WD)\.([A-Z0-9]+)\.(\d{2})\.(\d{2})$/);
    if (subgroupMatch) {
      return {
        year: subgroupMatch[1],
        semester: subgroupMatch[2],
        mode: subgroupMatch[3],
        department: subgroupMatch[4],
        number: subgroupMatch[5],
        subgroup: subgroupMatch[6],
        isSubgroup: true,
        fullId: normalized,
      };
    }
    return null;
  };

  const groupBatchesByDepartment = (batches) => {
    return batches.reduce((acc, batch) => {
      if (!acc[batch.department]) acc[batch.department] = [];
      acc[batch.department].push(batch);
      return acc;
    }, {});
  };

  useEffect(() => {
    let mounted = true;

    async function loadBatches() {
      try {
        const response = await api.listItems('batches');
        const dbBatches = (response?.items || [])
          .map((row) => {
            const parsed = parseBatchId(row?.name || row?.id);
            if (!parsed) return null;
            return {
              id: row?.id || null,
              ...parsed,
              capacity: Number(row?.capacity) > 0 ? Number(row.capacity) : 120,
              isReadonly: false,
            };
          })
          .filter(Boolean);

        if (mounted) {
          setBatchesData(dbBatches);
          setExpandedDept(Object.keys(groupBatchesByDepartment(dbBatches))[0] || null);
        }
      } catch {
        const staticBatches = buildBatches()
          .map((id) => {
            const parsed = parseBatchId(id);
            return parsed ? { id: null, ...parsed, capacity: 120, isReadonly: true } : null;
          })
          .filter(Boolean);

        if (mounted) {
          setBatchesData(staticBatches);
          setExpandedDept(Object.keys(groupBatchesByDepartment(staticBatches))[0] || null);
        }
      }
    }

    loadBatches();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredBatches = useMemo(() => {
    return batchesData.filter((batch) => {
      const matchesSearch = searchQuery === '' || batch.fullId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filters.department === 'all' || batch.department === filters.department;
      const matchesMode = filters.mode === 'all' || batch.mode === filters.mode;
      const matchesYear = filters.year === 'all' || batch.year === filters.year;
      const matchesSemester = filters.semester === 'all' || batch.semester === filters.semester;

      return matchesSearch && matchesDept && matchesMode && matchesYear && matchesSemester;
    });
  }, [searchQuery, filters, batchesData]);

  const groupedBatches = groupBatchesByDepartment(filteredBatches);

  const stats = useMemo(() => {
    const allGrouped = groupBatchesByDepartment(batchesData);
    return {
      totalBatches: batchesData.length,
      totalCapacity: batchesData.reduce((sum, batch) => sum + (Number(batch.capacity) || 120), 0),
      weekendCount: batchesData.filter((b) => b.mode === 'WE').length,
      weekdayCount: batchesData.filter((b) => b.mode === 'WD').length,
      departments: Object.entries(allGrouped).map(([dept, batches]) => ({ name: dept, count: batches.length })),
    };
  }, [batchesData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({ department: 'all', mode: 'all', year: 'all', semester: 'all' });
  };

  const handleCreateBatch = async (event) => {
    event.preventDefault();
    setCreateError('');
    setActionError('');

    const batchIdStr = previewBatchId;
    const parsed = parseBatchId(batchIdStr);
    if (!parsed) {
      setCreateError('Invalid batch configuration. Please check your inputs.');
      return;
    }

    if (batchesData.some((batch) => batch.fullId === parsed.fullId)) {
      setCreateError('Batch already exists.');
      return;
    }

    const capacity = Number(newBatchForm.capacity || 120);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      setCreateError('Capacity must be a positive number.');
      return;
    }

    try {
      setSavingBatch(true);
      const response = await api.addItem('batches', { name: parsed.fullId, capacity });
      const created = response?.item;
      setBatchesData((prev) => [{ id: created?.id || null, ...parsed, capacity, isReadonly: false }, ...prev]);
      setExpandedDept(parsed.department);
      setNewBatchForm(DEFAULT_FORM);
    } catch (error) {
      setCreateError(error.message || 'Failed to add batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleStartEdit = (batch) => {
    if (!batch?.id || batch?.isReadonly) {
      setActionError('This batch cannot be edited because it is not saved in the database.');
      return;
    }

    setActionError('');
    setCreateError('');
    setEditingBatchId(batch.id);
    setEditForm({ batchId: batch.fullId, capacity: String(batch.capacity || 120) });
  };

  const handleCancelEdit = () => {
    setEditingBatchId(null);
    setEditForm({ batchId: '', capacity: '120' });
  };

  const handleUpdateBatch = async (batchId) => {
    setActionError('');

    const parsed = parseBatchId(editForm.batchId);
    if (!parsed) {
      setActionError('Use format: Y2.S2.WE.IT.01');
      return;
    }

    if (batchesData.some((batch) => batch.id !== batchId && batch.fullId === parsed.fullId)) {
      setActionError('Another batch with this ID already exists.');
      return;
    }

    const capacity = Number(editForm.capacity || 120);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      setActionError('Capacity must be a positive number.');
      return;
    }

    try {
      setUpdatingBatch(true);
      await api.updateItem('batches', batchId, { name: parsed.fullId, capacity });
      setBatchesData((prev) => prev.map((batch) => (
        batch.id === batchId
          ? { ...batch, ...parsed, capacity, isReadonly: false }
          : batch
      )));
      setExpandedDept(parsed.department);
      setEditingBatchId(null);
      setEditForm({ batchId: '', capacity: '120' });
    } catch (error) {
      setActionError(error.message || 'Failed to update batch.');
    } finally {
      setUpdatingBatch(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    setActionError('');

    if (!batch?.id || batch?.isReadonly) {
      setActionError('This batch cannot be deleted because it is not saved in the database.');
      return;
    }

    if (!window.confirm(`Delete batch ${batch.fullId}?`)) return;

    try {
      setDeletingBatchId(batch.id);
      setBatchesData((prev) => prev.filter((item) => item.id !== batch.id));
      await api.deleteItem('batches', batch.id);
      if (editingBatchId === batch.id) {
        setEditingBatchId(null);
        setEditForm({ batchId: '', capacity: '120' });
      }
    } catch (error) {
      setActionError(error.message || 'Failed to delete batch.');
      const response = await api.listItems('batches').catch(() => null);
      const refreshed = (response?.items || [])
        .map((row) => {
          const parsed = parseBatchId(row?.name || row?.id);
          if (!parsed) return null;
          return {
            id: row?.id || null,
            ...parsed,
            capacity: Number(row?.capacity) > 0 ? Number(row.capacity) : 120,
            isReadonly: false,
          };
        })
        .filter(Boolean);
      if (response) setBatchesData(refreshed);
    } finally {
      setDeletingBatchId(null);
    }
  };

  const getSpecializationColors = (dept) => {
    return SPECIALIZATION_COLORS[dept] || { badge: 'bg-slate-100 text-slate-800 border-slate-300', header: 'bg-slate-50 border-slate-200', accent: 'bg-slate-600' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Page Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Faculty Coordinator</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl flex items-center gap-2">
              <Layers size={22} className="text-blue-600" />
              Batch Management
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold text-blue-600">{stats.totalBatches} batches</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Stats Row */}
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Batches</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.totalBatches}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Capacity</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.totalCapacity.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weekday Batches</p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{stats.weekdayCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weekend Batches</p>
            <p className="mt-1 text-2xl font-bold text-violet-600">{stats.weekendCount}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Create Batch Form */}
            <div className="rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
                <Plus size={16} className="text-white" />
                <h3 className="text-sm font-bold text-white">Add New Batch</h3>
              </div>
              <form onSubmit={handleCreateBatch} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Year</label>
                    <select
                      value={newBatchForm.year}
                      onChange={(e) => setNewBatchForm((prev) => ({ ...prev, year: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['1', '2', '3', '4'].map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Semester</label>
                    <select
                      value={newBatchForm.semester}
                      onChange={(e) => setNewBatchForm((prev) => ({ ...prev, semester: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">Sem 1</option>
                      <option value="2">Sem 2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'WD', label: '📚 Weekday' }, { value: 'WE', label: '📅 Weekend' }].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setNewBatchForm((prev) => ({ ...prev, mode: m.value }))}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          newBatchForm.mode === m.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Specialization</label>
                  <select
                    value={newBatchForm.specialization}
                    onChange={(e) => setNewBatchForm((prev) => ({ ...prev, specialization: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>{spec} — {SPECIALIZATION_LABELS[spec]}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Group No.</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={Number(newBatchForm.groupNumber)}
                      onChange={(e) => setNewBatchForm((prev) => ({ ...prev, groupNumber: String(e.target.value).padStart(2, '0') }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={newBatchForm.capacity}
                      onChange={(e) => setNewBatchForm((prev) => ({ ...prev, capacity: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBatchForm.isSubgroup}
                      onChange={(e) => setNewBatchForm((prev) => ({ ...prev, isSubgroup: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-600">This is a subgroup</span>
                  </label>
                  {newBatchForm.isSubgroup && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Subgroup No.</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={Number(newBatchForm.subgroupNumber)}
                        onChange={(e) => setNewBatchForm((prev) => ({ ...prev, subgroupNumber: String(e.target.value).padStart(2, '0') }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Batch ID Preview */}
                <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Batch ID Preview</p>
                  <p className="font-mono text-sm font-bold text-blue-800">{previewBatchId}</p>
                  {newBatchForm.isSubgroup && (
                    <p className="text-[10px] text-blue-600 mt-0.5">Subgroup of: {buildBatchIdFromForm({ ...newBatchForm, isSubgroup: false })}</p>
                  )}
                </div>

                {createError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</div>
                )}

                <button
                  type="submit"
                  disabled={savingBatch}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {savingBatch ? 'Adding...' : 'Create Batch'}
                </button>
              </form>
            </div>

            {/* Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Filter size={15} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Filters</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Specialization</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Specializations</option>
                    {stats.departments.map((dept) => (
                      <option key={dept.name} value={dept.name}>
                        {dept.name} — {SPECIALIZATION_LABELS[dept.name] || dept.name} ({dept.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mode</label>
                  <select
                    value={filters.mode}
                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Modes</option>
                    <option value="WD">📚 Weekday (WD)</option>
                    <option value="WE">📅 Weekend (WE)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Year</label>
                    <select
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      {['1', '2', '3', '4'].map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Semester</label>
                    <select
                      value={filters.semester}
                      onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="1">Sem 1</option>
                      <option value="2">Sem 2</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={13} /> Reset All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-4">
            {actionError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                <span className="font-bold text-slate-900">{filteredBatches.length}</span> batch{filteredBatches.length !== 1 ? 'es' : ''} shown
                {Object.keys(groupedBatches).length > 0 && (
                  <span className="ml-2 text-slate-400">across {Object.keys(groupedBatches).length} specialization{Object.keys(groupedBatches).length !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <Search size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">No batches found</p>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              Object.entries(groupedBatches)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([department, deptBatches]) => {
                  const colors = getSpecializationColors(department);
                  const isExpanded = expandedDept === department;

                  // Separate groups and subgroups
                  const groups = deptBatches.filter((b) => !b.isSubgroup).sort((a, b) => Number(a.number) - Number(b.number));
                  const subgroups = deptBatches.filter((b) => b.isSubgroup);

                  return (
                    <div key={department} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <button
                        type="button"
                        className={`w-full cursor-pointer px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b ${colors.header} ${isExpanded ? 'border-b border-slate-200' : 'border-b-0'}`}
                        onClick={() => setExpandedDept(isExpanded ? null : department)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-bold ${colors.badge}`}>
                            {department}
                          </span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-800">{SPECIALIZATION_LABELS[department] || department}</p>
                            <p className="text-xs text-slate-500">
                              {groups.length} group{groups.length !== 1 ? 's' : ''}
                              {subgroups.length > 0 && ` · ${subgroups.length} subgroup${subgroups.length !== 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                            {deptBatches.length}
                          </span>
                          {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4">
                          {/* Groups */}
                          {groups.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Groups</p>
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {groups.map((batch) => {
                                  // Find subgroups of this group
                                  const batchSubgroups = subgroups.filter((sg) => sg.number === batch.number);
                                  return (
                                    <div key={batch.id || batch.fullId} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:shadow-md transition-shadow">
                                      {editingBatchId === batch.id ? (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={editForm.batchId}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, batchId: e.target.value }))}
                                            placeholder="Y2.S2.WE.IT.01"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          <input
                                            type="number"
                                            min="1"
                                            value={editForm.capacity}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}
                                            placeholder="Capacity"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateBatch(batch.id)}
                                              disabled={updatingBatch}
                                              className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                                            >
                                              {updatingBatch ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={handleCancelEdit}
                                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <p className="font-mono text-sm font-bold text-slate-900">{batch.fullId}</p>
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                                  batch.mode === 'WE'
                                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                  {batch.mode === 'WE' ? 'Weekend' : 'Weekday'}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                                                  Y{batch.year} · S{batch.semester}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => handleStartEdit(batch)}
                                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                title="Edit"
                                              >
                                                <Pencil size={13} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteBatch(batch)}
                                                disabled={deletingBatchId === batch.id}
                                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40"
                                                title="Delete"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="mt-3 flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capacity</span>
                                            <span className="text-sm font-bold text-blue-600">{batch.capacity || 120}</span>
                                          </div>
                                          {/* Subgroups of this group */}
                                          {batchSubgroups.length > 0 && (
                                            <div className="mt-3 border-t border-slate-200 pt-3">
                                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Subgroups</p>
                                              <div className="space-y-1.5">
                                                {batchSubgroups
                                                  .sort((a, b) => Number(a.subgroup) - Number(b.subgroup))
                                                  .map((sg) => (
                                                    <div key={sg.id || sg.fullId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                                                      <p className="font-mono text-xs font-semibold text-slate-700">{sg.fullId}</p>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          type="button"
                                                          onClick={() => handleStartEdit(sg)}
                                                          className="rounded p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                          title="Edit subgroup"
                                                        >
                                                          <Pencil size={11} />
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleDeleteBatch(sg)}
                                                          disabled={deletingBatchId === sg.id}
                                                          className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                                                          title="Delete subgroup"
                                                        >
                                                          <Trash2 size={11} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Standalone subgroups (orphaned) */}
                          {subgroups.filter((sg) => !groups.some((g) => g.number === sg.number)).length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Other Subgroups</p>
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {subgroups
                                  .filter((sg) => !groups.some((g) => g.number === sg.number))
                                  .sort((a, b) => a.fullId.localeCompare(b.fullId))
                                  .map((batch) => (
                                    <div key={batch.id || batch.fullId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                                      <div>
                                        <p className="font-mono text-xs font-bold text-slate-800">{batch.fullId}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{batch.mode === 'WE' ? 'Weekend' : 'Weekday'} · Cap: {batch.capacity}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(batch)}
                                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBatch(batch)}
                                          disabled={deletingBatchId === batch.id}
                                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {groups.length === 0 && subgroups.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No batches match your current filters.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
