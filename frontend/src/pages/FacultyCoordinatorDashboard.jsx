import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Play, AlertCircle, Users, Calendar } from 'lucide-react';
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
  },
  {
    title: 'Check Resources',
    description: 'Monitor LIC availability and instructor readiness.',
    action: 'View Resources',
    icon: Users,
    to: '/dashboard',
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
    if (to === '/dashboard') {
      return location.pathname === '/dashboard';
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-80 flex-col border-r border-slate-200 bg-slate-900 backdrop-blur-sm text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-700 px-6 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">Workspace</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Coordinator Hub</h2>
          <p className="mt-1 text-xs text-slate-400">Navigation & Resources</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {menuGroups.map((group) => (
            <section key={group.title} className="rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-sm">
              <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isMenuItemActive(item.to);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSidebarNavigation(item.to)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <button
            type="button"
            onClick={() => handleSidebarNavigation('/scheduler')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Play size={16} strokeWidth={2} />
              Open Scheduler
            </span>
          </button>
        </div>
      </aside>

      <main className="w-full lg:pl-80">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between pl-12 lg:pl-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Faculty Coordinator</p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Scheduling Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{username}</p>
                <p className="text-xs text-slate-600">Role: Faculty Coordinator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                {username.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 xl:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, {username}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Coordinate timetables with precision, monitor resources, and optimize scheduling in real-time.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Total Instructors</p>
                      <p className="mt-3 text-4xl font-semibold text-blue-600">{totalInstructors}</p>
                      <p className="mt-1 text-xs text-slate-600">Available for allocation</p>
                    </div>
                    <Users className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Pending Approvals</p>
                      <p className="mt-3 text-4xl font-semibold text-blue-600">3</p>
                      <p className="mt-1 text-xs text-slate-600">Need coordinator action</p>
                    </div>
                    <AlertCircle className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <article key={action.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                        <button
                          type="button"
                          onClick={() => handleSidebarNavigation(action.to)}
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700"
                        >
                          {action.action}
                        </button>
                      </div>
                      <Icon className="w-10 h-10 text-slate-300 ml-4" strokeWidth={1.5} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Campus Resources</h3>
              <p className="mt-1 text-xs text-slate-600">LIC units and available instructors</p>

              {loadingResources ? (
                <p className="mt-4 text-xs text-slate-600">Loading resources...</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {resources.length === 0 && <p className="text-xs text-slate-600">No resources found.</p>}
                  {resources.slice(0, 5).map((lic) => (
                    <div key={lic.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-900">{lic.name || lic.id}</p>
                        <span className="text-[10px] text-slate-600">{lic.department || 'N/A'}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {(lic.instructors || []).length} instructor{(lic.instructors || []).length === 1 ? '' : 's'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Today's Focus</h3>
              <ul className="mt-3 space-y-2">
                {focusItems.slice(0, 3).map((item) => (
                  <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Soft Constraints</h3>
              <p className="mt-1 text-xs text-slate-600">Faculty preferences penalized through w5 component</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Preferred days"
                    value={softConstraintForm.preferredDaysCsv}
                    onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Preferred slots"
                    value={softConstraintForm.preferredSlotsCsv}
                    onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: event.target.value })}
                  />
                </div>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                  type="number"
                  min="0"
                  placeholder="w5 weight"
                  value={softConstraintForm.w5Weight}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: event.target.value })}
                />
                <textarea
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                  rows={2}
                  placeholder="Notes"
                  value={softConstraintForm.notes}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, notes: event.target.value })}
                />
                <button
                  type="button"
                  onClick={saveSoftConstraints}
                  disabled={savingSoftConstraints}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingSoftConstraints ? 'Saving...' : 'Save Constraints'}
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
