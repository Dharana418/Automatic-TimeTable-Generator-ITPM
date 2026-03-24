import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { askForText, confirmDelete, showError, showSuccess } from '../utils/alerts.js';

export default function AdminRoleHistoryPage({ apiBase, user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unhashedById, setUnhashedById] = useState({});
  const [loadingUnhashById, setLoadingUnhashById] = useState({});

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to load role assignment history');
      }

      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleToggleUnhash = async (historyId) => {
    if (unhashedById[historyId]) {
      setUnhashedById((prev) => {
        const next = { ...prev };
        delete next[historyId];
        return next;
      });
      return;
    }

    setLoadingUnhashById((prev) => ({ ...prev, [historyId]: true }));
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${historyId}/unhashed-password`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to reveal unhashed password');
      }

      setUnhashedById((prev) => ({ ...prev, [historyId]: data.unhashedPassword || '' }));
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoadingUnhashById((prev) => ({ ...prev, [historyId]: false }));
    }
  };

  const handleCreateHistory = async () => {
    const targetUserEmail = await askForText({
      title: 'Create Role History',
      inputLabel: 'Target staff email',
      inputPlaceholder: 'staff@example.com',
      confirmButtonText: 'Next',
      validationMessage: 'Email is required',
    });
    if (targetUserEmail === null) return;

    const role = await askForText({
      title: 'Create Role History',
      inputLabel: 'Assigned role',
      inputPlaceholder: 'Instructor / Lecturer / LIC ...',
      confirmButtonText: 'Next',
      validationMessage: 'Role is required',
    });
    if (role === null) return;

    const roleAssignmentNote = await askForText({
      title: 'Create Role History',
      inputLabel: 'Assignment note (optional)',
      inputPlaceholder: 'Optional note',
      confirmButtonText: 'Create',
      required: false,
    });
    if (roleAssignmentNote === null) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserEmail: targetUserEmail.trim(),
          role: role.trim(),
          roleAssignmentNote: roleAssignmentNote.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create role history record');
      }

      showSuccess('Created', 'Role history record created successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleEditHistory = async (item) => {
    const nextRole = await askForText({
      title: 'Edit Role History',
      inputLabel: 'Assigned role',
      inputPlaceholder: 'Role',
      confirmButtonText: 'Next',
      inputValue: item.role || '',
      validationMessage: 'Role is required',
    });
    if (nextRole === null) return;

    const nextNote = await askForText({
      title: 'Edit Role History',
      inputLabel: 'Assignment note (optional)',
      inputPlaceholder: 'Optional note',
      confirmButtonText: 'Update',
      inputValue: item.role_assignment_note || '',
      required: false,
    });
    if (nextNote === null) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: nextRole.trim(),
          roleAssignmentNote: nextNote.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update role history record');
      }

      showSuccess('Updated', 'Role history record updated successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleDeleteHistory = async (item) => {
    const confirmed = await confirmDelete({
      title: 'Delete role history record?',
      text: `${item.name} • ${item.role}`,
      confirmButtonText: 'Delete',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete role history record');
      }

      showSuccess('Deleted', 'Role history record deleted successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-gray-200 bg-white p-6 lg:flex lg:flex-col">
          <div className="mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Admin System</span>
            <h2 className="title-cursive text-2xl text-slate-900">Nexus<span className="text-brand-500">.</span></h2>
          </div>

          <nav className="space-y-1">
            <NavItem to="/dashboard" label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" active label="Role History" icon="📚" />
          </nav>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase mb-3">Session Info</p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-green-600 font-medium">● Online</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="p-4 md:p-8 lg:p-12">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Role Assignment History</h1>
              <p className="mt-2 text-slate-500">Complete details of assigned roles saved in a dedicated history table.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCreateHistory}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Create
              </button>
              <button
                onClick={fetchAssignments}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </header>

          <section className="shadow-none" style={{ border: '4px solid black' }}>
            <div className="bg-white p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
                    <p className="text-sm text-slate-500">Loading history...</p>
                  </div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-sm text-slate-500">No role assignment history found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse" style={{ border: '4px solid black' }}>
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100" style={{ borderBottom: '4px solid black' }}>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Staff</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Assigned By</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Password</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Note</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700" style={{ border: '4px solid black' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((item) => (
                        <tr key={item.id} className="transition-all hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-cyan-50/50">
                          <td className="px-6 py-4" style={{ border: '4px solid black' }}>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                                {item.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4" style={{ border: '4px solid black' }}>
                            <span className="inline-block bg-gradient-to-r from-indigo-100 to-fuchsia-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                              {item.role}
                            </span>
                          </td>
                          <td className="px-6 py-4" style={{ border: '4px solid black' }}>
                            <div>
                              <p className="font-medium text-slate-800">{item.role_assigned_by_name || 'System'}</p>
                              {item.role_assigned_by_email ? (
                                <p className="text-xs text-slate-500">{item.role_assigned_by_email}</p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700" style={{ border: '4px solid black' }}>
                            {item.role_assigned_at ? (
                              <div>
                                <p className="font-medium">{new Date(item.role_assigned_at).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-500">{new Date(item.role_assigned_at).toLocaleTimeString()}</p>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4" style={{ border: '4px solid black' }}>
                            {!item.can_unhash ? (
                              <span className="inline-block bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">N/A</span>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleToggleUnhash(item.id)}
                                  className="inline-block border-2 border-brand-300 bg-white px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 active:scale-95"
                                >
                                  {loadingUnhashById[item.id]
                                    ? 'Loading...'
                                    : unhashedById[item.id]
                                    ? 'Hide'
                                    : 'Unhash'}
                                </button>
                                {unhashedById[item.id] ? (
                                  <p className="break-all bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 px-3 py-2 text-xs font-mono text-amber-900">
                                    {unhashedById[item.id]}
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 max-w-xs" style={{ border: '4px solid black' }}>
                            {item.role_assignment_note ? (
                              <div className="bg-slate-50 p-2 text-xs italic text-slate-600 border-l-2 border-slate-300">
                                "{item.role_assignment_note}"
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4" style={{ border: '4px solid black' }}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditHistory(item)}
                                className="border-2 border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 active:scale-95"
                                title="Edit role assignment"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteHistory(item)}
                                className="border-2 border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                                title="Delete record"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function NavItem({ label, to, active, icon }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
