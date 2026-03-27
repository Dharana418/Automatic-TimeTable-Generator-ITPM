import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Play, Users, Calendar, Layers, BookOpen, TrendingUp, Bell, ChevronRight } from 'lucide-react';
import api from '../api/scheduler.js';

const menuGroups = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: '📊', to: '/dashboard/faculty-coordinator' },
      { id: 'timetable', label: 'Timetables', icon: '🗓️', to: '/scheduler' },
      { id: 'batches', label: 'Batches', icon: '🧩', to: '/faculty/batches' },
      { id: 'staff-directory', label: 'Staff Directory', icon: '👨‍🏫', to: '/faculty/staff' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'resources', label: 'Resources', icon: '🏫', to: '/dashboard/faculty-coordinator' },
      { id: 'requests', label: 'Requests', icon: '📨', to: '/dashboard/faculty-coordinator' },
    ],
  },
  {
    title: 'Insights',
    items: [{ id: 'reports', label: 'Reports', icon: '📈', to: '/dashboard/faculty-coordinator' }],
  },
];

const quickActions = [
  {
    title: 'Start Scheduler',
    description: 'Generate a fresh timetable using optimized constraints.',
    action: 'Open Scheduler',
    icon: Calendar,
    to: '/scheduler',
    color: 'bg-blue-600 hover:bg-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Manage Batches',
    description: 'Create, edit, and organize faculty batches by specialization.',
    action: 'View Batches',
    icon: Layers,
    to: '/faculty/batches',
    color: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Staff Directory',
    description: 'Browse all lecturers, instructors, and LIC members.',
    action: 'View Directory',
    icon: BookOpen,
    to: '/faculty/staff',
    color: 'bg-violet-600 hover:bg-violet-700',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    title: 'Check Resources',
    description: 'Monitor LIC availability and instructor readiness.',
    action: 'View Resources',
    icon: Users,
    to: '/dashboard/faculty-coordinator',
    color: 'bg-amber-600 hover:bg-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

const focusItems = [
  'Review hall availability for next week',
  'Approve pending instructor requests',
  'Validate module conflict warnings',
  'Export faculty timetable snapshot',
];

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || 'Coordinator';
  const navigate = useNavigate();
  const location = useLocation();

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [savingSoftConstraints, setSavingSoftConstraints] = useState(false);
  const [softConstraintForm, setSoftConstraintForm] = useState({
    preferredDaysCsv: 'Mon,Tue,Wed,Thu,Fri',
    preferredSlotsCsv: '09:00-10:00,10:00-11:00',
    w5Weight: '15',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoadingResources(true);
        const response = await api.getLicsWithInstructors();
        if (mounted && response?.items) {
          setResources(response.items);
        }
        
        // Fetch dynamic roles from backend
        // TODO: Uncomment when backend endpoint is available
        // const rolesResponse = await api.getRoles();
        // if (mounted && rolesResponse?.roles) {
        //   setRoles(rolesResponse.roles);
        // }
      } catch (error) {
        console.error('Failed to load resources', error);
      } finally {
        if (mounted) {
          setLoadingResources(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const saveSoftConstraints = async () => {
    try {
      setSavingSoftConstraints(true);
      const preferredDays = softConstraintForm.preferredDaysCsv
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const preferredTimeSlots = softConstraintForm.preferredSlotsCsv
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      await api.saveSoftConstraints({
        preferredDays,
        preferredTimeSlots,
        w5Weight: Number(softConstraintForm.w5Weight || 0),
        notes: softConstraintForm.notes,
      });

      window.alert('Soft constraints saved and mapped to w5 penalty weight.');
    } catch (error) {
      window.alert(error.message || 'Failed to save soft constraints.');
    } finally {
      setSavingSoftConstraints(false);
    }
  };

  const totalInstructors = useMemo(
    () => resources.reduce((sum, lic) => sum + (lic.instructors || []).length, 0),
    [resources],
  );

  const handleSidebarNavigation = (to) => {
    navigate(to);
    setMobileSidebarOpen(false);
  };

  const isMenuItemActive = (to) => {
    if (to === '/dashboard/faculty-coordinator') {
      return location.pathname === '/dashboard/faculty-coordinator';
    }

    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-blue-600 p-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-700/60 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-900/30">
              FC
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Coordinator Hub</h2>
              <p className="text-[10px] text-slate-400">Faculty Scheduling System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isMenuItemActive(item.to);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSidebarNavigation(item.to)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600/90 text-white shadow-sm shadow-blue-900/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      <span className="w-5 text-center text-base leading-none">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={14} className="text-blue-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-700/60 p-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSidebarNavigation('/scheduler')}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-900/30 transition-all duration-200 hover:bg-blue-500"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Play size={15} strokeWidth={2.5} />
              Open Scheduler
            </span>
          </button>
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              {username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{username}</p>
              <p className="text-[10px] text-slate-400">Faculty Coordinator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="w-full lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between pl-12 lg:pl-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Faculty Coordinator</p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Scheduling Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{username}</p>
                <p className="text-xs text-slate-500">Faculty Coordinator</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm">
                {username.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 xl:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            {/* Welcome Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-900/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Good day,</p>
                  <h2 className="text-2xl font-bold tracking-tight mt-0.5">{username} 👋</h2>
                  <p className="mt-2 text-blue-100 text-sm max-w-md">
                    Coordinate timetables with precision, monitor resources, and optimize scheduling in real-time.
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-300/50 shrink-0" strokeWidth={1.5} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Instructors</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {loadingResources ? '—' : totalInstructors}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-white">3</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">LIC Units</p>
                  <p className="mt-1 text-2xl font-bold text-white">{resources.length}</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Active</p>
                  <p className="mt-1 text-2xl font-bold text-white">Now</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Actions</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <article key={action.title} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex items-start gap-4">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${action.iconBg}`}>
                          <Icon className={`w-5 h-5 ${action.iconColor}`} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900">{action.title}</h4>
                          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{action.description}</p>
                          <button
                            type="button"
                            onClick={() => handleSidebarNavigation(action.to)}
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 ${action.color}`}
                          >
                            {action.action}
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            {/* Campus Resources */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Campus Resources</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{resources.length} LICs</span>
              </div>

              {loadingResources ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {resources.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-3">No resources found.</p>
                  )}
                  {resources.slice(0, 5).map((lic) => (
                    <div key={lic.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 truncate">{lic.name || lic.id}</p>
                        <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                          {(lic.instructors || []).length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">{lic.department || 'General'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Today's Focus */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Today's Focus</h3>
              <ul className="space-y-2">
                {focusItems.slice(0, 4).map((item, idx) => (
                  <li key={item} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className={`h-5 w-5 shrink-0 grid place-items-center rounded-full text-[10px] font-bold ${
                      idx === 0 ? 'bg-red-100 text-red-600' : idx === 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">{item}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Soft Constraints */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Soft Constraints</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Faculty preferences via w5 penalty weight</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Days</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mon,Tue,Wed..."
                      value={softConstraintForm.preferredDaysCsv}
                      onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Slots</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="09:00-10:00..."
                      value={softConstraintForm.preferredSlotsCsv}
                      onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">W5 Weight</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={softConstraintForm.w5Weight}
                    onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    placeholder="Additional notes..."
                    value={softConstraintForm.notes}
                    onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, notes: event.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={saveSoftConstraints}
                  disabled={savingSoftConstraints}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingSoftConstraints ? 'Saving…' : 'Save Constraints'}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
