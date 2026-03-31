import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Activity, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
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

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleToggleUnhash = async (historyId) => {
    if (unhashedById[historyId]) {
      setUnhashedById(prev => { const n = { ...prev }; delete n[historyId]; return n; });
      return;
    }
    setLoadingUnhashById(prev => ({ ...prev, [historyId]: true }));
    try {
      const response = await fetch(`${apiBase}/api/auth/admin/role-assignments/${historyId}/unhashed-password`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reveal failed');
      setUnhashedById(prev => ({ ...prev, [historyId]: data.unhashedPassword }));
    } catch (err) { showError('Error', err.message); }
    finally { setLoadingUnhashById(prev => ({ ...prev, [historyId]: false })); }
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
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete role history record');

      showSuccess('Deleted', 'Role history record deleted successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[240px_1fr]">
        
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen border-r border-gray-200 bg-white p-4 lg:flex lg:flex-col dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-gray-300 bg-gray-50 text-[#059669] dark:border-gray-700 dark:bg-gray-900">
              <KeyRound size={16} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin</h2>
          </div>
          <nav className="space-y-0.5">
            <NavItem to="/dashboard" label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" active label="Role History" icon="📜" />
          </nav>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">
          <header className="mb-6 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-300 bg-gray-50 text-[#059669] dark:border-gray-700 dark:bg-gray-900">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Role Management</p>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Assignment Logs</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Audit trail of faculty role assignments and security records.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={fetchAssignments} className="rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                Refresh
              </button>
              <button onClick={handleCreateHistory} className="rounded border border-[#059669] bg-[#059669] px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 dark:border-green-600 dark:bg-green-700 dark:hover:bg-green-600">
                + New Entry
              </button>
            </div>
          </header>

          <section className="mb-6 border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#059669]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Distribution</p>
            </div>
            <div className="space-y-2">
              {groupedAssignments.map(([roleName, roleAssignments]) => {
                const percentage = Math.max(2, Math.round((roleAssignments.length / totalAssignments) * 100));
                return (
                  <div key={`distribution-${roleName}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>{roleName}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-200 dark:bg-gray-800">
                      <div className="h-1.5 rounded bg-[#059669]" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : assignments.length === 0 ? (
              <EmptyState />
            ) : (
              groupedAssignments.map(([roleName, roleAssignments]) => (
                <div key={roleName} className="overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{roleName}</h2>
                    <span className="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {roleAssignments.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                          <th className="border-r border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Staff</th>
                          <th className="border-r border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Email</th>
                          <th className="border-r border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Role</th>
                          <th className="border-r border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Assigned By</th>
                          <th className="border-r border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Timestamp</th>
                          <th className="border-r border-gray-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-800 dark:text-gray-400">Security</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {roleAssignments.map((item) => (
                          <tr key={item.id} className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900">
                            <td className="border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-gray-100 font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                  {item.name?.[0]?.toUpperCase()}
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                              </div>
                            </td>
                            <td className="border-r border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">{item.email}</td>
                            <td className="border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                              <span className="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {item.role}
                              </span>
                            </td>
                            <td className="border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.role_assigned_by_name || 'System'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.role_assigned_by_email}</p>
                            </td>
                            <td className="border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(item.role_assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{new Date(item.role_assigned_at).toLocaleTimeString()}</p>
                            </td>
                            <td className="border-r border-gray-200 px-4 py-3 text-center dark:border-gray-800">
                              {item.can_unhash ? (
                                <div className="relative inline-block group/unhash">
                                  <button
                                    onClick={() => handleToggleUnhash(item.id)}
                                    className={`rounded border px-2 py-1 text-xs font-semibold transition-all duration-200 ${
                                      unhashedById[item.id]
                                        ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    {loadingUnhashById[item.id] ? '...' : unhashedById[item.id] ? 'Hide' : 'Reveal'}
                                  </button>
                                  {unhashedById[item.id] && (
                                    <div className="absolute left-1/2 top-full z-50 mt-2 w-max max-w-[180px] -translate-x-1/2 rounded border border-gray-300 bg-gray-900 p-2 text-xs font-mono text-white shadow-lg dark:border-gray-700">
                                      {unhashedById[item.id]}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleEditHistory(item)} 
                                  className="inline-flex items-center gap-1 rounded border border-[#059669] px-2 py-1 text-xs font-semibold text-[#059669] transition-colors hover:bg-green-50 dark:hover:bg-gray-900"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteHistory(item)} 
                                  className="inline-flex items-center gap-1 rounded border border-red-400 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-gray-900"
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
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-2 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 w-full rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-950">
    <div className="text-4xl mb-3 opacity-40">📋</div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No records found</h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">Assignment history will appear here once faculty are assigned.</p>
  </div>
);

function NavItem({ label, to, active, icon }) {
  return (
    <Link to={to} className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold transition-all ${
      active
        ? 'bg-[#059669] text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
    }`}>
      <span className="text-sm">{icon}</span> {label}
    </Link>
  );
}
