import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Activity, ShieldCheck, Pencil, Trash2, UserCog, ChartNoAxesCombined, RefreshCcw, Plus } from 'lucide-react';
import { askForText, confirmDelete, showError, showSuccess } from '../utils/alerts.js';

export default function AdminRoleHistoryPage({ apiBase }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unhashedById, setUnhashedById] = useState({});
  const [loadingUnhashById, setLoadingUnhashById] = useState({});

  const groupedAssignments = useMemo(() => {
    const grouped = assignments.reduce((accumulator, item) => {
      const roleName = String(item.role || 'Unassigned').trim() || 'Unassigned';
      if (!accumulator[roleName]) accumulator[roleName] = [];
      accumulator[roleName].push(item);
      return accumulator;
    }, {});

    return Object.entries(grouped).sort(([roleA], [roleB]) => roleA.localeCompare(roleB));
  }, [assignments]);

  const totalAssignments = assignments.length || 1;

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to load data');
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
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${historyId}/unhashed-password`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reveal failed');
      setUnhashedById((prev) => ({ ...prev, [historyId]: data.unhashedPassword }));
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
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return 'Enter a valid email';
        return undefined;
      },
    });
    if (targetUserEmail === null) return;

    const role = await askForText({
      title: 'Create Role History',
      inputLabel: 'Assigned role',
      inputPlaceholder: 'Instructor / Lecturer / LIC ...',
      confirmButtonText: 'Next',
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Role is required';
        return undefined;
      },
    });
    if (role === null) return;

    const roleAssignmentNote = await askForText({
      title: 'Create Role History',
      inputLabel: 'Assignment note (optional)',
      inputPlaceholder: 'Optional note',
      confirmButtonText: 'Create',
      inputValue: '',
      validator: () => undefined,
    });
    if (roleAssignmentNote === null) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserEmail: String(targetUserEmail).trim(),
          role: String(role).trim(),
          roleAssignmentNote: String(roleAssignmentNote || '').trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to create role history record');

      showSuccess('Created', 'Role history record created successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleEditHistory = async (item) => {
    const nextName = await askForText({
      title: 'Edit Staff Member',
      inputLabel: 'Full Name',
      inputPlaceholder: 'Enter full name',
      confirmButtonText: 'Next',
      inputValue: item.name || '',
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Full name is required';
        if (String(value).trim().length < 3) return 'Name must be at least 3 characters';
        if (/[~!@#$%^&*()_+]/.test(String(value))) return 'Name cannot contain special characters';
        return undefined;
      },
    });
    if (nextName === null) return;

    const nextEmail = await askForText({
      title: 'Edit Staff Member',
      inputLabel: 'Email Address',
      inputPlaceholder: 'Enter email',
      confirmButtonText: 'Next',
      inputValue: item.email || '',
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return 'Invalid email address';
        return undefined;
      },
    });
    if (nextEmail === null) return;

    const nextPhone = await askForText({
      title: 'Edit Staff Member',
      inputLabel: 'Phone Number (10 digits)',
      inputPlaceholder: 'Enter phone number',
      confirmButtonText: 'Next',
      inputValue: item.phonenumber || '',
      validator: (value) => {
        if (value && !/^\d+$/.test(String(value))) return 'Phone number must contain only digits';
        if (value && String(value).length > 10) return 'Phone number must be max 10 digits';
        return undefined;
      },
    });
    if (nextPhone === null) return;

    const nextRole = await askForText({
      title: 'Edit Staff Member',
      inputLabel: 'Assigned Role',
      inputPlaceholder: 'e.g., Instructor, Lecturer, LIC',
      confirmButtonText: 'Next',
      inputValue: item.role || '',
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Role is required';
        return undefined;
      },
    });
    if (nextRole === null) return;

    const nextNote = await askForText({
      title: 'Edit Staff Member',
      inputLabel: 'Assignment Note (optional)',
      inputPlaceholder: 'Optional note',
      confirmButtonText: 'Update',
      inputValue: item.role_assignment_note || '',
      validator: () => undefined,
    });
    if (nextNote === null) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(nextName).trim(),
          email: String(nextEmail).trim(),
          phonenumber: String(nextPhone || '').trim() || null,
          role: String(nextRole).trim(),
          roleAssignmentNote: String(nextNote || '').trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to update staff member');

      showSuccess('Updated', 'Staff member details updated successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleDeleteHistory = async (item) => {
    const confirmed = await confirmDelete({
      title: 'Delete role history record?',
      text: `${item.name} - ${item.role}`,
      confirmButtonText: 'Delete',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete role history record');

      showSuccess('Deleted', 'Role history record deleted successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute -bottom-28 left-12 h-96 w-96 rounded-full bg-cyan-200/45 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-full max-w-[1600px] lg:grid-cols-[290px_1fr]">
        <aside className="hidden h-full flex-col border-r border-cyan-700/35 bg-slate-900 px-6 py-8 lg:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-cyan-300 shadow-sm">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">University Admin</p>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Control Suite</h2>
            </div>
          </div>

          <nav className="space-y-1.5">
            <NavItem to="/dashboard" label="Create Staff" icon={UserCog} />
            <NavItem to="/admin/role-history" active label="Role History" icon={ChartNoAxesCombined} />
          </nav>
        </aside>

        <main className="px-4 py-6 sm:px-6 md:px-10 lg:px-14 lg:py-10">
          <header className="mb-6 rounded-3xl border border-emerald-100/90 bg-white/88 p-6 shadow-xl shadow-slate-300/40 ring-1 ring-white/80 backdrop-blur md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/35">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Role Management</p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">Assignment Logs</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-600">Audit-ready history of faculty role assignments with secure credential controls.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={fetchAssignments} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/60">
                  <RefreshCcw size={13} /> Refresh
                </button>
                <button onClick={handleCreateHistory} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-400/35 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-cyan-700">
                  <Plus size={13} /> New Entry
                </button>
              </div>
            </div>
          </header>

          <section className="mb-6 rounded-3xl border border-cyan-100/90 bg-white/88 p-5 shadow-lg shadow-slate-300/30 ring-1 ring-white/80 backdrop-blur md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role Distribution</p>
            </div>
            <div className="space-y-3">
              {groupedAssignments.map(([roleName, roleAssignments]) => {
                const percentage = Math.max(2, Math.round((roleAssignments.length / totalAssignments) * 100));
                return (
                  <div key={`distribution-${roleName}`}>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{roleName}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full border border-cyan-100 bg-slate-100">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-5">
            {loading ? (
              <LoadingSkeleton />
            ) : assignments.length === 0 ? (
              <EmptyState />
            ) : (
              groupedAssignments.map(([roleName, roleAssignments]) => (
                <div key={roleName} className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-200/80 via-cyan-200/75 to-indigo-200/80 p-[1px] shadow-lg shadow-slate-300/25">
                  <div className="rounded-2xl bg-white/95 backdrop-blur">
                  <div className="flex items-center justify-between border-b border-cyan-100 bg-gradient-to-r from-emerald-50/70 via-cyan-50/60 to-indigo-50/60 px-4 py-3">
                    <h2 className="text-sm font-bold text-slate-900">{roleName}</h2>
                    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-semibold text-cyan-800">
                      {roleAssignments.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-cyan-100 bg-slate-50/90">
                          <th className="border-r border-cyan-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Staff</th>
                          <th className="border-r border-cyan-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Email</th>
                          <th className="border-r border-cyan-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Role</th>
                          <th className="border-r border-cyan-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Assigned By</th>
                          <th className="border-r border-cyan-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                          <th className="border-r border-cyan-100 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Security</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-50">
                        {roleAssignments.map((item) => (
                          <tr key={item.id} className="bg-white transition-colors hover:bg-slate-50/80">
                            <td className="border-r border-cyan-100 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 font-semibold text-cyan-800">
                                  {item.name?.[0]?.toUpperCase()}
                                </div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                              </div>
                            </td>
                            <td className="border-r border-cyan-100 px-4 py-3 text-sm text-slate-600">{item.email}</td>
                            <td className="border-r border-cyan-100 px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                {item.role}
                              </span>
                            </td>
                            <td className="border-r border-cyan-100 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{item.role_assigned_by_name || 'System'}</p>
                              <p className="text-xs text-slate-500">{item.role_assigned_by_email}</p>
                            </td>
                            <td className="border-r border-cyan-100 px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">{new Date(item.role_assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs font-mono text-slate-500">{new Date(item.role_assigned_at).toLocaleTimeString()}</p>
                            </td>
                            <td className="border-r border-cyan-100 px-4 py-3 text-center">
                              {item.can_unhash ? (
                                <div className="relative inline-block">
                                  <button
                                    onClick={() => handleToggleUnhash(item.id)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                                      unhashedById[item.id]
                                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                                        : 'border-cyan-200 bg-white text-slate-600 hover:bg-cyan-50/60'
                                    }`}
                                  >
                                    {loadingUnhashById[item.id] ? '...' : unhashedById[item.id] ? 'Hide' : 'Reveal'}
                                  </button>
                                  {unhashedById[item.id] && (
                                    <div className="absolute left-1/2 top-full z-50 mt-2 w-max max-w-[180px] -translate-x-1/2 rounded-lg border border-cyan-200/70 bg-slate-900 p-2 text-xs font-mono text-white shadow-xl">
                                      {unhashedById[item.id]}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-xs text-slate-400">-</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditHistory(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteHistory(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-3 rounded-2xl border border-cyan-100 bg-white/90 p-5 shadow-lg shadow-slate-300/20 ring-1 ring-white/80">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center rounded-2xl border border-cyan-100 bg-white/90 px-6 py-12 text-center shadow-lg shadow-slate-300/20 ring-1 ring-white/80">
    <div className="mb-3 text-4xl opacity-40">📋</div>
    <h3 className="text-sm font-semibold text-slate-900">No records found</h3>
    <p className="text-xs text-slate-600">Assignment history will appear here once faculty are assigned.</p>
  </div>
);

function NavItem({ label, to, active, icon }) {
  const Icon = icon;
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-700/35'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}>
      <span>{Icon ? <Icon size={16} /> : null}</span>
      {label}
    </Link>
  );
}
