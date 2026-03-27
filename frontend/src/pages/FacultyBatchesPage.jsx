import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Filter, RotateCcw, Pencil, Trash2, Plus, Layers } from 'lucide-react';
import { buildBatches } from '../data/batches.js';
import api from '../api/scheduler.js';

export default function FacultyBatchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);
  const [createError, setCreateError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editForm, setEditForm] = useState({ batchId: '', capacity: '120' });
  const [updatingBatch, setUpdatingBatch] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [newBatchForm, setNewBatchForm] = useState({ batchId: '', capacity: '120' });
  const [filters, setFilters] = useState({
    department: 'all',
    mode: 'all',
    year: 'all',
    semester: 'all',
  });
  const [batchesData, setBatchesData] = useState([]);
  const [expandedDept, setExpandedDept] = useState(null);

  const parseBatchId = (batchId) => {
    const normalized = String(batchId || '').trim().toUpperCase();
    const match = normalized.match(/^Y(\d+)\.S(\d+)\.(WE|WD)\.([A-Z0-9]+)\.(\d{2})$/);
    if (!match) return null;

    return {
      year: match[1],
      semester: match[2],
      mode: match[3],
      department: match[4],
      number: match[5],
      fullId: normalized,
    };
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

    const parsed = parseBatchId(newBatchForm.batchId);
    if (!parsed) {
      setCreateError('Use format: Y2.S2.WE.IT.01');
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
      setNewBatchForm({ batchId: '', capacity: '120' });
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

  const DEPT_COLOR_MAP = {
    IT: { badge: 'bg-blue-100 text-blue-800 border-blue-300', header: 'from-blue-50', accent: 'bg-blue-600' },
    SE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', header: 'from-emerald-50', accent: 'bg-emerald-600' },
    DS: { badge: 'bg-violet-100 text-violet-800 border-violet-300', header: 'from-violet-50', accent: 'bg-violet-600' },
    CS: { badge: 'bg-amber-100 text-amber-800 border-amber-300', header: 'from-amber-50', accent: 'bg-amber-600' },
    ISE: { badge: 'bg-pink-100 text-pink-800 border-pink-300', header: 'from-pink-50', accent: 'bg-pink-600' },
    IM: { badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', header: 'from-indigo-50', accent: 'bg-indigo-600' },
    CSNE: { badge: 'bg-rose-100 text-rose-800 border-rose-300', header: 'from-rose-50', accent: 'bg-rose-600' },
  };

  const getDepartmentColor = (dept) => {
    return DEPT_COLOR_MAP[dept] || { badge: 'bg-slate-100 text-slate-800 border-slate-300', header: 'from-slate-50', accent: 'bg-slate-600' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Page Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Faculty Coordinator</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              <span className="mr-2">🧩</span>Batch Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              {stats.totalBatches} batches
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 text-white shadow-lg shadow-indigo-600/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200">Total Batches</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.totalBatches}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-4 text-white shadow-lg shadow-violet-600/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-200">Total Capacity</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.totalCapacity}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-lg shadow-emerald-600/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200">Weekday Batches</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.weekdayCount}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 p-4 text-white shadow-lg shadow-amber-600/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200">Weekend Batches</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.weekendCount}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Add Batch */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                  <Plus size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add New Batch</h3>
              </div>
              <form onSubmit={handleCreateBatch} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Batch ID</label>
                  <input
                    type="text"
                    value={newBatchForm.batchId}
                    onChange={(e) => setNewBatchForm((prev) => ({ ...prev, batchId: e.target.value }))}
                    placeholder="Y2.S2.WE.IT.01"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchForm.capacity}
                    onChange={(e) => setNewBatchForm((prev) => ({ ...prev, capacity: e.target.value }))}
                    placeholder="120"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                {createError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{createError}</p>
                )}
                <button
                  type="submit"
                  disabled={savingBatch}
                  className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingBatch ? 'Adding...' : '+ Add Batch'}
                </button>
              </form>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search batch ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Filter size={14} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Filters</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="all">All Departments</option>
                    {stats.departments.map((dept) => (
                      <option key={dept.name} value={dept.name}>{dept.name} ({dept.count})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mode</label>
                  <select
                    value={filters.mode}
                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="all">All Modes</option>
                    <option value="WE">Weekend (WE)</option>
                    <option value="WD">Weekday (WD)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Year</label>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="all">All Years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Semester</label>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="all">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100"
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-4">
            {actionError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} shown
              </p>
              <p className="text-xs text-slate-400">
                {Object.keys(groupedBatches).length} department{Object.keys(groupedBatches).length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Layers className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
                <p className="text-base font-bold text-slate-700">No batches found</p>
                <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search query</p>
              </div>
            ) : (
              Object.entries(groupedBatches)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([department, batches]) => {
                  const colors = getDepartmentColor(department);
                  return (
                    <div key={department} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <button
                        type="button"
                        className={`w-full cursor-pointer bg-gradient-to-r ${colors.header} to-white px-5 py-4 flex items-center justify-between hover:brightness-95 transition-all border-b border-slate-100`}
                        onClick={() => setExpandedDept(expandedDept === department ? null : department)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-bold ${colors.badge}`}>
                            {department}
                          </span>
                          <span className="text-sm text-slate-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {expandedDept === department ? '▼' : '▶'}
                        </span>
                      </button>

                      {expandedDept === department && (
                        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
                          {batches
                            .sort((a, b) => Number(a.number) - Number(b.number))
                            .map((batch) => (
                              <div
                                key={batch.id || batch.fullId}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                              >
                                {editingBatchId === batch.id ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      value={editForm.batchId}
                                      onChange={(e) => setEditForm((prev) => ({ ...prev, batchId: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      value={editForm.capacity}
                                      onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBatch(batch.id)}
                                        disabled={updatingBatch}
                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                                      >
                                        {updatingBatch ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="font-mono text-sm font-bold text-slate-900">{batch.fullId}</p>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(batch)}
                                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                          title="Edit batch"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBatch(batch)}
                                          disabled={deletingBatchId === batch.id}
                                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-60"
                                          title="Delete batch"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-3 space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Mode</span>
                                        <span className="font-semibold text-slate-700">
                                          {batch.mode === 'WE' ? '📅 Weekend' : '📚 Weekday'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Year / Sem</span>
                                        <span className="font-semibold text-slate-700">Y{batch.year} / S{batch.semester}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Department</span>
                                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                                          {batch.department}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-100">
                                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Capacity</span>
                                      <span className={`text-sm font-extrabold ${colors.accent.replace('bg-', 'text-')}`}>
                                        {batch.capacity || 120}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
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
