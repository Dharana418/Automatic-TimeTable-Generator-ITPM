import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Filter, RotateCcw, Pencil, Trash2 } from 'lucide-react';
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

  const getDepartmentColor = (dept) => {
    const colors = {
      IT: 'bg-blue-100 text-blue-800 border-blue-300',
      SE: 'bg-green-100 text-green-800 border-green-300',
      DS: 'bg-purple-100 text-purple-800 border-purple-300',
      CS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ISE: 'bg-pink-100 text-pink-800 border-pink-300',
      IM: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      CSNE: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[dept] || 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Batch Management</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">📚 Batch Studio</h1>
          <p className="mt-1 text-sm text-slate-600">Search, filter, review, and create batches.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Add New Batch</h3>
              <form onSubmit={handleCreateBatch} className="space-y-3">
                <input
                  type="text"
                  value={newBatchForm.batchId}
                  onChange={(e) => setNewBatchForm((prev) => ({ ...prev, batchId: e.target.value }))}
                  placeholder="Y2.S2.WE.IT.01"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <input
                  type="number"
                  min="1"
                  value={newBatchForm.capacity}
                  onChange={(e) => setNewBatchForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Capacity"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {createError && <p className="text-xs text-red-600">{createError}</p>}
                <button
                  type="submit"
                  disabled={savingBatch}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingBatch ? 'Adding...' : 'Add Batch'}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search batch (e.g. Y2.S2.WE.IT.01)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Filter size={16} /> Filters</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Stream/Department</label>
                  <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600">
                    <option value="all">All Streams</option>
                    {stats.departments.map((dept) => (<option key={dept.name} value={dept.name}>{dept.name} ({dept.count})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Mode</label>
                  <select value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600">
                    <option value="all">All Modes</option>
                    <option value="WE">Weekend (WE)</option>
                    <option value="WD">Weekday (WD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Year</label>
                  <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600">
                    <option value="all">All Years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Semester</label>
                  <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600">
                    <option value="all">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <button onClick={handleResetFilters} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> Reset Filters
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Total Batches</p><p className="mt-1 text-xl font-semibold text-blue-600">{stats.totalBatches}</p></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Total Capacity</p><p className="mt-1 text-xl font-semibold text-blue-600">{stats.totalCapacity}</p></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Weekend / Weekday</p><p className="mt-1 text-xl font-semibold text-blue-600">{stats.weekendCount} / {stats.weekdayCount}</p></div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{filteredBatches.length} batches shown</p>
              <p className="text-xs text-slate-500">{Object.keys(groupedBatches).length} department{Object.keys(groupedBatches).length !== 1 ? 's' : ''}</p>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">No batches found</p>
                <p className="mt-2 text-sm text-slate-600">Try adjusting your filters or search query</p>
              </div>
            ) : (
              Object.entries(groupedBatches)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([department, batches]) => (
                  <div key={department} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="cursor-pointer bg-gradient-to-r from-slate-50 to-white px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-200" onClick={() => setExpandedDept(expandedDept === department ? null : department)}>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-semibold ${getDepartmentColor(department)}`}>{department}</span>
                        <p className="text-sm text-slate-600">{batches.length} batches</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{expandedDept === department ? '▼' : '▶'}</p>
                    </div>

                    {expandedDept === department && (
                      <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
                        {batches
                          .sort((a, b) => Number(a.number) - Number(b.number))
                          .map((batch) => (
                            <div key={batch.id || batch.fullId} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:shadow-md transition-shadow">
                              {editingBatchId === batch.id ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={editForm.batchId}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, batchId: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={editForm.capacity}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBatch(batch.id)}
                                      disabled={updatingBatch}
                                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                      {updatingBatch ? 'Saving...' : 'Save'}
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
                                    <p className="font-mono text-sm font-semibold text-slate-900">{batch.fullId}</p>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(batch)}
                                        className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                                        title="Edit batch"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBatch(batch)}
                                        disabled={deletingBatchId === batch.id}
                                        className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                        title="Delete batch"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                <div><p className="font-medium text-slate-700">{batch.mode === 'WE' ? '📅 Weekend' : '📚 Weekday'}</p></div>
                                <div><p className="font-medium text-slate-700">Year {batch.year}</p></div>
                                <div><p className="text-slate-600">Sem {batch.semester}</p></div>
                                <div><p className="text-slate-600">{batch.department}</p></div>
                              </div>
                              <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-2">
                                <span className="text-[10px] font-semibold uppercase text-slate-600">Capacity</span>
                                <span className="text-sm font-bold text-blue-600">{batch.capacity || 120}</span>
                              </div>
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
