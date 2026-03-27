import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Play, AlertCircle, Users, Calendar, BookOpen, Layers, BarChart3, Settings, ChevronRight } from 'lucide-react';
import api from '../api/scheduler.js';

const menuGroups = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: '📊', to: '/dashboard' },
      { id: 'timetable', label: 'Timetables', icon: '🗓️', to: '/scheduler' },
      { id: 'batches', label: 'Batches', icon: '🧩', to: '/faculty/batches' },
      { id: 'staff-directory', label: 'Staff Directory', icon: '👨‍🏫', to: '/faculty/staff' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'resources', label: 'Resources', icon: '🏫', to: '/dashboard' },
      { id: 'requests', label: 'Requests', icon: '📨', to: '/dashboard' },
    ],
  },
  {
    title: 'Insights',
    items: [{ id: 'reports', label: 'Reports', icon: '📈', to: '/dashboard' }],
  },
];

const quickActions = [
  {
    title: 'Start Scheduler',
    description: 'Generate a fresh timetable using optimized constraints.',
    action: 'Open Scheduler',
    icon: Calendar,
    to: '/scheduler',
    color: 'from-indigo-500 to-blue-600',
    lightColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Manage Batches',
    description: 'Create, edit, and organise academic batches and sub-groups.',
    action: 'View Batches',
    icon: Layers,
    to: '/faculty/batches',
    color: 'from-violet-500 to-purple-600',
    lightColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    title: 'Staff Directory',
    description: 'Browse lecturers, instructors, and LIC availability.',
    action: 'View Staff',
    icon: Users,
    to: '/faculty/staff',
    color: 'from-emerald-500 to-teal-600',
    lightColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Check Resources',
    description: 'Monitor LIC availability and instructor readiness.',
    action: 'View Resources',
    icon: BookOpen,
    to: '/dashboard',
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const focusItems = [
  { text: 'Review hall availability for next week', icon: '🏫' },
  { text: 'Approve pending instructor requests', icon: '✅' },
  { text: 'Validate module conflict warnings', icon: '⚠️' },
  { text: 'Export faculty timetable snapshot', icon: '📤' },
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
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/faculty-coordinator';
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:bg-indigo-700 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-slate-700/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-lg">
              FC
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Coordinator Hub</p>
              <p className="text-[10px] text-slate-400">Faculty Coordinator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
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
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={14} className="opacity-60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-700/60 p-4">
          <button
            type="button"
            onClick={() => handleSidebarNavigation('/scheduler')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:brightness-110"
          >
            <Play size={15} strokeWidth={2} />
            Open Scheduler
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between pl-12 lg:pl-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Faculty Coordinator</p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Scheduling Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{username}</p>
                <p className="text-xs text-slate-500">Faculty Coordinator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-md">
                {username.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Welcome Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Good Day</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Welcome back, {username} 👋</h2>
                <p className="mt-2 max-w-lg text-sm text-indigo-100">
                  Coordinate timetables with precision, monitor resources, and optimise scheduling in real-time.
                </p>
              </div>
              <div className="hidden shrink-0 sm:block">
                <BarChart3 className="h-16 w-16 text-indigo-300/50" strokeWidth={1} />
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Instructors', value: totalInstructors, icon: '👨‍🏫' },
                { label: 'Pending Approvals', value: 3, icon: '📋' },
                { label: 'Active Batches', value: '—', icon: '🧩' },
                { label: 'Scheduled Modules', value: '—', icon: '📚' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-lg">{stat.icon}</p>
                  <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <article
                        key={action.title}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${action.lightColor}`}>
                          <Icon className={`h-5 w-5 ${action.iconColor}`} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{action.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{action.description}</p>
                        <button
                          type="button"
                          onClick={() => handleSidebarNavigation(action.to)}
                          className={`mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${action.color} px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110`}
                        >
                          {action.action}
                          <ChevronRight size={13} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Soft Constraints */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Soft Constraints</h3>
                </div>
                <p className="mb-4 text-xs text-slate-500">Faculty scheduling preferences penalized through the w5 component.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Preferred Days</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="Mon,Tue,Wed,Thu,Fri"
                        value={softConstraintForm.preferredDaysCsv}
                        onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Preferred Slots</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="09:00-10:00,10:00-11:00"
                        value={softConstraintForm.preferredSlotsCsv}
                        onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: event.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">W5 Weight</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      type="number"
                      min="0"
                      placeholder="15"
                      value={softConstraintForm.w5Weight}
                      onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      rows={2}
                      placeholder="Additional scheduling notes..."
                      value={softConstraintForm.notes}
                      onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, notes: event.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveSoftConstraints}
                    disabled={savingSoftConstraints}
                    className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {savingSoftConstraints ? 'Saving...' : 'Save Constraints'}
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Campus Resources */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Campus Resources</h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    {resources.length} LICs
                  </span>
                </div>
                <p className="mb-3 text-[11px] text-slate-500">LIC units and available instructors</p>

                {loadingResources ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    Loading resources...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.length === 0 && (
                      <p className="text-xs text-slate-500">No resources found.</p>
                    )}
                    {resources.slice(0, 5).map((lic) => (
                      <div key={lic.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{lic.name || lic.id}</p>
                          <p className="text-[10px] text-slate-500">{lic.department || 'N/A'}</p>
                        </div>
                        <span className="rounded-lg bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">
                          {(lic.instructors || []).length} staff
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Today's Focus */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Today's Focus</h3>
                <ul className="space-y-2">
                  {focusItems.map((item) => (
                    <li key={item.text} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="mt-0.5 text-base">{item.icon}</span>
                      <span className="text-xs leading-relaxed text-slate-700">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
