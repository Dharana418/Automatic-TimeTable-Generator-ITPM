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
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar (Deep Navy/Slate-900 for Portal Feel) */}
        <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-slate-900 p-6 lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-blue-300 shadow-sm transition-all duration-200">
              <KeyRound size={18} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Admin Panel</h2>
          </div>
          <nav className="space-y-1">
            <NavItem to="/dashboard" label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" active label="Role History" icon="📜" />
          </nav>
        </aside>

        <main className="p-6 md:p-10 lg:p-16">
          <header className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-blue-50 text-blue-700 shadow-sm">
                <Activity size={26} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Command Center</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Assignment Logs</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Comprehensive audit trail of faculty role assignments and security credentials.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={fetchAssignments} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 active:scale-95">
                Refresh Grid
              </button>
              <button onClick={handleCreateHistory} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-95">
                + Manual Entry
              </button>
            </div>
          </header>

          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Role Distribution</p>
            </div>
            <div className="space-y-3">
              {groupedAssignments.map(([roleName, roleAssignments]) => {
                const percentage = Math.max(2, Math.round((roleAssignments.length / totalAssignments) * 100));
                return (
                  <div key={`distribution-${roleName}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{roleName}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : assignments.length === 0 ? (
              <EmptyState />
            ) : (
              groupedAssignments.map(([roleName, roleAssignments]) => (
                <div key={roleName} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h2 className="text-lg font-extrabold text-slate-900">{roleName}</h2>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                      {roleAssignments.length} {roleAssignments.length === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border-2 border-black">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Staff Member</th>
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Authorized By</th>
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                          <th className="border-2 border-black px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Security</th>
                          <th className="border-2 border-black px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roleAssignments.map((item) => (
                          <tr key={item.id} className="bg-white transition-colors hover:bg-slate-50">
                            <td className="border-2 border-black px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                                  {item.name?.[0]?.toUpperCase()}
                                </div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                              </div>
                            </td>
                            <td className="border-2 border-black px-6 py-5">
                              <p className="text-sm font-medium text-slate-700">{item.email}</p>
                            </td>
                            <td className="border-2 border-black px-6 py-5">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                {item.role}
                              </span>
                            </td>
                            <td className="border-2 border-black px-6 py-5">
                              <p className="text-sm font-semibold text-slate-900">{item.role_assigned_by_name || 'System'}</p>
                              <p className="text-xs text-slate-500">{item.role_assigned_by_email}</p>
                            </td>
                            <td className="border-2 border-black px-6 py-5">
                              <p className="text-sm font-medium text-slate-900">{new Date(item.role_assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs font-mono text-slate-500">{new Date(item.role_assigned_at).toLocaleTimeString()}</p>
                            </td>
                            <td className="border-2 border-black px-6 py-5 text-center">
                              {item.can_unhash ? (
                                <div className="relative inline-block group/unhash">
                                  <button
                                    onClick={() => handleToggleUnhash(item.id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all duration-200 active:scale-95 ${unhashedById[item.id] ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                                  >
                                    {loadingUnhashById[item.id] ? '...' : unhashedById[item.id] ? 'Hide' : 'Reveal'}
                                  </button>
                                  {unhashedById[item.id] && (
                                    <div className="absolute top-full left-1/2 z-50 mt-2 w-max max-w-[180px] -translate-x-1/2 rounded-md border border-slate-200 bg-slate-900 p-3 text-xs font-mono text-white shadow-lg">
                                      {unhashedById[item.id]}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-xs text-slate-400">—</span>}
                            </td>
                            <td className="border-2 border-black px-6 py-5">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleEditHistory(item)} 
                                  className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors duration-200 inline-flex items-center gap-1"
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteHistory(item)} 
                                  className="text-rose-600 font-semibold text-sm hover:text-rose-700 transition-colors duration-200 inline-flex items-center gap-1"
                                >
                                  <Trash2 size={14} /> Delete
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
  <div className="p-10 space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 w-full rounded-lg bg-slate-100 animate-pulse" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="py-20 flex flex-col items-center text-center">
    <div className="text-6xl mb-4 grayscale opacity-30">📋</div>
    <h3 className="text-lg font-bold text-slate-700">No records found</h3>
    <p className="text-sm text-slate-500">Assignment history will appear here once faculty are provisioned.</p>
  </div>
);

function NavItem({ label, to, active, icon }) {
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'} active:scale-95`}>
      <span className="text-lg">{icon}</span> {label}
    </Link>
  );
}