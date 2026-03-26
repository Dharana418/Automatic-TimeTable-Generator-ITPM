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
    const nextRole = await askForText({
      title: 'Edit Role History',
      inputLabel: 'Assigned role',
      inputPlaceholder: 'Role',
      confirmButtonText: 'Next',
      inputValue: item.role || '',
      validator: (value) => {
        if (!value || !String(value).trim()) return 'Role is required';
        return undefined;
      },
    });
    if (nextRole === null) return;

    const nextNote = await askForText({
      title: 'Edit Role History',
      inputLabel: 'Assignment note (optional)',
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
          role: String(nextRole).trim(),
          roleAssignmentNote: String(nextNote || '').trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to update role history record');

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
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete role history record');

      showSuccess('Deleted', 'Role history record deleted successfully');
      await fetchAssignments();
    } catch (err) {
      showError('Error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#581c87] text-white antialiased">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar (Matching Dashboard) */}
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-white/5 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-indigo-200 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <KeyRound size={18} className="drop-shadow" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Nexus<span className="text-indigo-300">.</span></h2>
          </div>
          <nav className="space-y-1">
            <NavItem to="/dashboard" label="Create Staff" icon="👤" />
            <NavItem to="/admin/role-history" active label="Role History" icon="📜" />
          </nav>
        </aside>

        <main className="p-6 md:p-10 lg:p-16">
          <header className="mb-8 rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-indigo-200 shadow-lg">
                <Activity size={26} className="drop-shadow" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Command Center</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">Assignment Logs</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300">Comprehensive audit trail of faculty role assignments and security credentials.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={fetchAssignments} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:scale-95">
                Refresh Grid
              </button>
              <button onClick={handleCreateHistory} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95">
                + Manual Entry
              </button>
            </div>
          </header>

          <section className="mb-8 rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-200 drop-shadow" />
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Role Distribution</p>
            </div>
            <div className="space-y-3">
              {groupedAssignments.map(([roleName, roleAssignments]) => {
                const percentage = Math.max(2, Math.round((roleAssignments.length / totalAssignments) * 100));
                return (
                  <div key={`distribution-${roleName}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>{roleName}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${percentage}%` }} />
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
                <div key={roleName} className="overflow-hidden rounded-3xl border border-white/10 border-t-[1px] border-t-white/20 bg-white/5 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                    <h2 className="text-lg font-extrabold text-white">{roleName}</h2>
                    <span className="rounded-full border border-indigo-300/40 bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200">
                      {roleAssignments.length} {roleAssignments.length === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Staff Member</th>
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Role</th>
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Authorized By</th>
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Timestamp</th>
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-center text-slate-400">Security</th>
                          <th className="px-6 py-5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {roleAssignments.map((item) => (
                          <tr key={item.id} className="group transition-all duration-200 hover:bg-white/10">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 font-bold text-indigo-200">
                                  {item.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-xs font-medium text-slate-400">{item.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="inline-flex rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-200">
                                {item.role}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-100">{item.role_assigned_by_name || 'System'}</p>
                              <p className="text-[10px] text-slate-400">{item.role_assigned_by_email}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-medium text-slate-200">{new Date(item.role_assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{new Date(item.role_assigned_at).toLocaleTimeString()}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                              {item.can_unhash ? (
                                <div className="relative inline-block group/unhash">
                                  <button
                                    onClick={() => handleToggleUnhash(item.id)}
                                    className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all duration-200 active:scale-95 ${unhashedById[item.id] ? 'bg-amber-300/25 text-amber-200' : 'bg-white/10 text-slate-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white'}`}
                                  >
                                    {loadingUnhashById[item.id] ? '...' : unhashedById[item.id] ? 'Hide' : 'Reveal'}
                                  </button>
                                  {unhashedById[item.id] && (
                                    <div className="absolute top-full left-1/2 z-50 mt-2 w-max max-w-[150px] -translate-x-1/2 rounded bg-slate-950 p-2 text-[10px] font-mono text-white shadow-xl">
                                      {unhashedById[item.id]}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-xs text-slate-500">—</span>}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <button onClick={() => handleEditHistory(item)} className="inline-flex items-center gap-1 rounded-full border border-indigo-300/40 bg-indigo-500/20 px-2.5 py-1 text-[10px] font-bold text-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500/35 active:scale-95"><Pencil size={12} /> Edit</button>
                                <button onClick={() => handleDeleteHistory(item)} className="inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500/35 active:scale-95"><Trash2 size={12} /> Delete</button>
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
      <div key={i} className="h-12 w-full rounded-lg bg-white/10 animate-pulse" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="py-20 flex flex-col items-center text-center">
    <div className="text-6xl mb-4 grayscale opacity-20">📋</div>
    <h3 className="text-lg font-bold text-slate-300">No records found</h3>
    <p className="text-sm text-slate-400">Assignment history will appear here once faculty are provisioned.</p>
  </div>
);

function NavItem({ label, to, active, icon }) {
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${active ? 'bg-indigo-500/20 text-indigo-200 shadow-sm shadow-indigo-900/30' : 'text-slate-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:shadow-sm'} active:scale-95`}>
      <span className="text-lg">{icon}</span> {label}
    </Link>
  );
}