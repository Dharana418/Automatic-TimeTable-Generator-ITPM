import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import { confirmDelete, showError, showSuccess, showWarning } from '../utils/alerts.js';

const FORBIDDEN_SPECIAL_CHARS = /[~!@#$%^&*()_+]/;

const menuGroups = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'timetable', label: 'Timetables', icon: '🗓️' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'resources', label: 'Resources', icon: '🏫' },
      { id: 'batches', label: 'Batches', icon: '🧩' },
      { id: 'requests', label: 'Requests', icon: '📨' },
    ],
  },
  {
    title: 'Insights',
    items: [{ id: 'reports', label: 'Reports', icon: '📈' }],
  },
];

const FacultyBatchesPage = ({ user }) => {
  const username = user?.username || 'Coordinator';
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingCrud, setLoadingCrud] = useState(false);
  const [crudError, setCrudError] = useState('');
  const [creatingBulkBatches, setCreatingBulkBatches] = useState(false);
  const [bulkStatusMessage, setBulkStatusMessage] = useState('');

  const [departmentForm, setDepartmentForm] = useState({ id: null, code: '', name: '' });
  const [batchForm, setBatchForm] = useState({ id: null, name: '', department_id: '', capacity: 120 });

  const departmentMap = useMemo(
    () => departments.reduce((acc, department) => ({ ...acc, [department.id]: department }), {}),
    [departments],
  );

  const groupedBatches = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const key = batch.department_id || 'unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(batch);
      return acc;
    }, {});
  }, [batches]);

  const loadCrudData = async () => {
    try {
      setLoadingCrud(true);
      setCrudError('');
      const [departmentRes, batchRes] = await Promise.all([
        api.listItems('departments'),
        api.listItems('batches'),
      ]);

      setDepartments(departmentRes?.items || []);
      setBatches(batchRes?.items || []);
    } catch (error) {
      setCrudError(error.message || 'Failed to load batch and department data');
    } finally {
      setLoadingCrud(false);
    }
  };

  useEffect(() => {
    loadCrudData();
  }, []);

  const resetDepartmentForm = () => {
    setDepartmentForm({ id: null, code: '', name: '' });
  };

  const resetBatchForm = () => {
    setBatchForm({ id: null, name: '', department_id: '', capacity: 120 });
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    const name = departmentForm.name.trim();
    if (!name) {
      const message = 'Department name is required.';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }
    if (FORBIDDEN_SPECIAL_CHARS.test(name) || FORBIDDEN_SPECIAL_CHARS.test(departmentForm.code.trim())) {
      const message = 'Department name/code cannot contain ~!@#$%^&*()_+';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }

    try {
      setCrudError('');
      const payload = {
        code: departmentForm.code.trim(),
        name,
      };

      if (departmentForm.id) {
        await api.updateItem('departments', departmentForm.id, payload);
      } else {
        await api.addItem('departments', payload);
      }

      resetDepartmentForm();
      await loadCrudData();
      showSuccess('Department saved', departmentForm.id ? 'Department updated successfully.' : 'Department created successfully.');
    } catch (error) {
      const message = error.message || 'Failed to save department';
      setCrudError(message);
      showError('Save failed', message);
    }
  };

  const submitBatch = async (event) => {
    event.preventDefault();
    const name = batchForm.name.trim();
    const capacity = Number(batchForm.capacity);
    if (!name) {
      const message = 'Batch name is required.';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }
    if (FORBIDDEN_SPECIAL_CHARS.test(name)) {
      const message = 'Batch name cannot contain ~!@#$%^&*()_+';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }
    if (Number.isNaN(capacity) || capacity < 1) {
      const message = 'Batch capacity must be at least 1.';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }

    try {
      setCrudError('');
      const payload = {
        name,
        department_id: batchForm.department_id || null,
        capacity,
      };

      if (batchForm.id) {
        await api.updateItem('batches', batchForm.id, payload);
      } else {
        await api.addItem('batches', payload);
      }

      resetBatchForm();
      await loadCrudData();
      showSuccess('Batch saved', batchForm.id ? 'Batch updated successfully.' : 'Batch created successfully.');
    } catch (error) {
      const message = error.message || 'Failed to save batch';
      setCrudError(message);
      showError('Save failed', message);
    }
  };

  const editDepartment = (department) => {
    setDepartmentForm({
      id: department.id,
      code: department.code || '',
      name: department.name || '',
    });
  };

  const editBatch = (batch) => {
    setBatchForm({
      id: batch.id,
      name: batch.name || '',
      department_id: batch.department_id || '',
      capacity: batch.capacity || 120,
    });
  };

  const deleteDepartment = async (id) => {
    const confirmed = await confirmDelete({
      title: 'Delete department?',
      text: 'This will remove the selected department.',
      confirmButtonText: 'Delete department',
    });
    if (!confirmed) return;

    try {
      setCrudError('');
      await api.deleteItem('departments', id);
      if (departmentForm.id === id) resetDepartmentForm();
      await loadCrudData();
      showSuccess('Department deleted');
    } catch (error) {
      const message = error.message || 'Failed to delete department';
      setCrudError(message);
      showError('Delete failed', message);
    }
  };

  const deleteBatch = async (id) => {
    const confirmed = await confirmDelete({
      title: 'Delete batch?',
      text: 'This will permanently remove the selected batch.',
      confirmButtonText: 'Delete batch',
    });
    if (!confirmed) return;

    try {
      setCrudError('');
      await api.deleteItem('batches', id);
      if (batchForm.id === id) resetBatchForm();
      await loadCrudData();
      showSuccess('Batch deleted');
    } catch (error) {
      const message = error.message || 'Failed to delete batch';
      setCrudError(message);
      showError('Delete failed', message);
    }
  };

  const generateCreativeBatches = async () => {
    if (departments.length === 0) {
      const message = 'Please add at least one department before generating batches.';
      setCrudError(message);
      showWarning('Validation required', message);
      return;
    }

    const streamTags = ['WD', 'WE', 'DS', 'SE', 'CS', 'AI', 'CY', 'NE'];

    try {
      setCreatingBulkBatches(true);
      setCrudError('');
      setBulkStatusMessage('');

      const existingBatchNames = new Set(
        batches.map((batch) => String(batch.name || '').trim().toLowerCase()),
      );

      const payloads = [];
      let sequence = 1;
      let guard = 0;

      while (payloads.length < 130 && guard < 10000) {
        const department = departments[payloads.length % departments.length];
        const departmentCode = (department.code || department.name || 'GEN')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 4) || 'GEN';

        const year = ((sequence - 1) % 4) + 1;
        const semester = ((sequence - 1) % 2) + 1;
        const stream = streamTags[(sequence - 1) % streamTags.length];
        const serial = String(sequence).padStart(3, '0');
        const name = `Y${year}.S${semester}.${stream}.${departmentCode}.${serial}`;
        const normalizedName = name.toLowerCase();

        if (!existingBatchNames.has(normalizedName)) {
          payloads.push({
            name,
            department_id: department.id,
            capacity: 60 + ((sequence - 1) % 6) * 20,
          });
          existingBatchNames.add(normalizedName);
        }

        sequence += 1;
        guard += 1;
      }

      if (payloads.length < 130) {
        throw new Error('Could not generate 130 unique batch names.');
      }

      for (let index = 0; index < payloads.length; index += 20) {
        const chunk = payloads.slice(index, index + 20);
        await Promise.all(chunk.map((payload) => api.addItem('batches', payload)));
      }

      setBulkStatusMessage('Successfully created 130 creative batches.');
      await loadCrudData();
      showSuccess('Bulk creation completed', '130 batches were created successfully.');
    } catch (error) {
      const message = error.message || 'Failed to generate creative batches';
      setCrudError(message);
      showError('Bulk creation failed', message);
    } finally {
      setCreatingBulkBatches(false);
    }
  };

  const handleSidebarNavigation = (itemId) => {
    if (itemId === 'overview') navigate('/dashboard');
    if (itemId === 'timetable') navigate('/scheduler');
    if (itemId === 'batches') navigate('/faculty/batches');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="flex">
        <button
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          className="fixed left-3 top-20 z-50 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? '✕ Close' : '☰ Sidebar'}
        </button>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-slate-800 px-5 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Faculty Hub</p>
            <h2 className="mt-2 text-xl font-bold">Coordinator Panel</h2>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            {menuGroups.map((group) => (
              <section key={group.title} className="rounded-xl border border-slate-800 bg-slate-900/30 p-2">
                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = item.id === 'batches';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSidebarNavigation(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                          isActive
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => navigate('/scheduler')}
              className="w-full rounded-xl border border-indigo-500/20 bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Open Scheduler
            </button>
          </div>
        </aside>

        <main className={`w-full transition-[padding] duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'}`}>
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Faculty Coordinator</p>
                <h1 className="text-lg font-black text-slate-900 md:text-xl">Batches Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">{username}</p>
                  <p className="text-xs text-slate-500">Role: Faculty Coordinator</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Batch & Department Management</h3>
                  <p className="text-sm text-slate-500">Create, edit, and delete departments and batches.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateCreativeBatches}
                    disabled={creatingBulkBatches || loadingCrud}
                    className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingBulkBatches ? 'Creating 130...' : 'Create 130 Batches'}
                  </button>
                  <button
                    type="button"
                    onClick={loadCrudData}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {crudError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {crudError}
                </div>
              )}

              {bulkStatusMessage && (
                <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
                  {bulkStatusMessage}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Departments</h4>
                  <form className="mt-3 grid gap-2" onSubmit={submitDepartment}>
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Department code (e.g. IT)"
                      value={departmentForm.code}
                      onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value }))}
                    />
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Department name"
                      value={departmentForm.name}
                      onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                    <div className="flex gap-2">
                      <button className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700" type="submit">
                        {departmentForm.id ? 'Update Department' : 'Add Department'}
                      </button>
                      {departmentForm.id && (
                        <button className="rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300" type="button" onClick={resetDepartmentForm}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="mt-3 space-y-2">
                    {loadingCrud && <p className="text-xs text-slate-500">Loading departments...</p>}
                    {!loadingCrud && departments.length === 0 && <p className="text-xs text-slate-500">No departments yet.</p>}
                    {departments.map((department) => (
                      <div key={department.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 ring-1 ring-slate-200">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{department.name}</p>
                          <p className="text-xs text-slate-500">{department.code || 'No code'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editDepartment(department)} className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600">Edit</button>
                          <button type="button" onClick={() => deleteDepartment(department.id)} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Batches</h4>
                  <form className="mt-3 grid gap-2" onSubmit={submitBatch}>
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Batch name (e.g. Y2.S1.WD.IT.01)"
                      value={batchForm.name}
                      onChange={(event) => setBatchForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                    <select
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={batchForm.department_id}
                      onChange={(event) => setBatchForm((current) => ({ ...current, department_id: event.target.value }))}
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      placeholder="Capacity"
                      value={batchForm.capacity}
                      onChange={(event) => setBatchForm((current) => ({ ...current, capacity: event.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700" type="submit">
                        {batchForm.id ? 'Update Batch' : 'Add Batch'}
                      </button>
                      {batchForm.id && (
                        <button className="rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300" type="button" onClick={resetBatchForm}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="mt-4 rounded-xl bg-white/80 p-3 ring-1 ring-slate-200">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        Total Batches: {batches.length}
                      </span>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        Departments: {Object.keys(groupedBatches).length}
                      </span>
                    </div>

                    {loadingCrud && <p className="text-xs text-slate-500">Loading batches...</p>}
                    {!loadingCrud && batches.length === 0 && <p className="text-xs text-slate-500">No batches yet.</p>}

                    {Object.entries(groupedBatches).map(([departmentId, group]) => {
                      const departmentName = departmentId === 'unassigned'
                        ? 'Unassigned Department'
                        : (departmentMap[departmentId]?.name || 'Unknown Department');

                      return (
                        <div key={departmentId} className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{departmentName}</p>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {group.length}
                            </span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {group.map((batch) => (
                              <div key={batch.id} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-sm font-semibold text-slate-800">{batch.name}</p>
                                <p className="mt-1 text-xs text-slate-500">Capacity: {batch.capacity ?? 0}</p>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                    style={{ width: `${Math.min(100, Math.max(10, Math.round(((batch.capacity ?? 0) / 180) * 100)))}%` }}
                                  />
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button type="button" onClick={() => editBatch(batch)} className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600">Edit</button>
                                  <button type="button" onClick={() => deleteBatch(batch.id)} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyBatchesPage;
