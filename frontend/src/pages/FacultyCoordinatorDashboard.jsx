import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Play, Layers, Calendar, AlertCircle, ArrowRight, Zap, Users } from 'lucide-react';
import api from '../api/scheduler.js';
import BatchList from '../components/BatchList.jsx';

const menuGroups = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: '📊', to: '/dashboard' },
      { id: 'timetable', label: 'Timetables', icon: '🗓️', to: '/scheduler' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'resources', label: 'Resources', icon: '🏫', to: '/dashboard' },
      { id: 'batches', label: 'Batches', icon: '🧩', to: '/faculty/batches' },
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
    to: '/scheduler',
  },
  {
    title: 'Manage Batches',
    description: 'Create and organize department batches in one place.',
    action: 'Open Batches',
    to: '/faculty/batches',
  },
  {
    title: 'Resource View',
    description: 'Check LIC and instructor readiness for upcoming weeks.',
    action: 'View Resources',
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border-2 border-black bg-blue-600 p-2 text-sm font-black text-white shadow-lg transition-all duration-200 hover:bg-blue-700 active:scale-95 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} strokeWidth={3} />
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-80 flex-col border-r-2 border-r-black bg-white/95 backdrop-blur-sm text-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b-2 border-b-black px-6 py-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Workspace</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Coordinator Hub</h2>
          <p className="mt-1 text-xs text-slate-600 font-medium">Navigation & Quick Actions</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {menuGroups.map((group) => (
            <section key={group.title} className="rounded-xl border-2 border-black bg-slate-50 p-2 shadow-md">
              <p className="px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = isMenuItemActive(item.to);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSidebarNavigation(item.to)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-black transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white border-2 border-black'
                          : 'text-slate-700 hover:bg-slate-200 border-2 border-transparent hover:border-black'
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

        <div className="border-t-2 border-t-black p-4">
          <button
            type="button"
            onClick={() => handleSidebarNavigation('/scheduler')}
            className="w-full rounded-xl border-2 border-black bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-95"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Play size={16} strokeWidth={3} />
              Open Scheduler
            </span>
          </button>
        </div>
      </aside>

      <main className="w-full lg:pl-80">
        <header className="sticky top-0 z-20 border-b-2 border-b-black bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between pl-12 lg:pl-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Faculty Coordinator</p>
              <h1 className="text-lg font-black tracking-tight text-slate-900 md:text-xl">Scheduling Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-slate-900">{username}</p>
                <p className="text-xs text-slate-600 font-semibold">Role: Faculty Coordinator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-black bg-blue-600 text-sm font-black text-white">
                {username.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 xl:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <div className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-5 shadow-lg">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Welcome back, {username}</h2>
              <p className="mt-2 text-sm text-slate-700 font-semibold">
                Coordinate timetables with precision, monitor resources, and optimize scheduling in real-time.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">LIC Units</p>
                      <p className="mt-2 text-3xl font-black text-slate-900">{resources.length}</p>
                      <p className="mt-1 text-xs text-slate-600 font-semibold">Registered campus groups</p>
                    </div>
                    <Layers className="w-10 h-10 text-blue-600" strokeWidth={2} />
                  </div>
                </div>
                <div className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Instructors</p>
                      <p className="mt-2 text-3xl font-black text-slate-900">{totalInstructors}</p>
                      <p className="mt-1 text-xs text-slate-600 font-semibold">Available for allocation</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-600" strokeWidth={2} />
                  </div>
                </div>
                <div className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Pending Approvals</p>
                      <p className="mt-2 text-3xl font-black text-slate-900">3</p>
                      <p className="mt-1 text-xs text-slate-600 font-semibold">Need coordinator action</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-red-600" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => (
                <article key={action.title} className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-5 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                  <h3 className="text-lg font-black text-slate-900">{action.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 font-semibold">{action.description}</p>
                  <button
                    type="button"
                    onClick={() => handleSidebarNavigation(action.to)}
                    className="mt-4 rounded-xl border-2 border-black bg-blue-600 px-4 py-2 text-sm font-black text-white transition-all duration-200 hover:bg-blue-700 active:scale-95"
                  >
                    {action.action}
                  </button>
                </article>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <BatchList />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-5 shadow-lg">
              <h3 className="text-lg font-black text-slate-900">Campus Resources</h3>
              <p className="mt-1 text-sm text-slate-700 font-semibold">LIC units and available instructors</p>

              {loadingResources ? (
                <p className="mt-4 text-sm text-slate-600 font-semibold">Loading resources...</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {resources.length === 0 && <p className="text-sm text-slate-600">No resources found.</p>}
                  {resources.slice(0, 5).map((lic) => (
                    <div key={lic.id} className="rounded-lg border-2 border-black bg-slate-50 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-900">{lic.name || lic.id}</p>
                        <span className="text-xs text-slate-600 font-semibold">{lic.department || 'N/A'}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 font-semibold">
                        {(lic.instructors || []).length} instructor{(lic.instructors || []).length === 1 ? '' : 's'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-5 shadow-lg">
              <h3 className="text-lg font-black text-slate-900">Today's Focus</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {focusItems.map((item) => (
                  <li key={item} className="rounded-lg border-2 border-black bg-slate-50 px-3 py-2 shadow-sm font-semibold">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border-2 border-black bg-white/90 backdrop-blur-sm p-5 shadow-lg">
              <h3 className="text-lg font-black text-slate-900">Soft Constraints → w5</h3>
              <p className="mt-1 text-sm text-slate-700 font-semibold">Faculty preferences are penalized through fitness component w5.</p>
              <div className="mt-3 space-y-2">
                <input
                  className="w-full rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Preferred days (Mon,Tue,...)"
                  value={softConstraintForm.preferredDaysCsv}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: event.target.value })}
                />
                <input
                  className="w-full rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Preferred slots (09:00-10:00,...)"
                  value={softConstraintForm.preferredSlotsCsv}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: event.target.value })}
                />
                <input
                  className="w-full rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600"
                  type="number"
                  min="0"
                  placeholder="w5 weight"
                  value={softConstraintForm.w5Weight}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: event.target.value })}
                />
                <textarea
                  className="w-full rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={2}
                  placeholder="Notes"
                  value={softConstraintForm.notes}
                  onChange={(event) => setSoftConstraintForm({ ...softConstraintForm, notes: event.target.value })}
                />
                <button
                  type="button"
                  onClick={saveSoftConstraints}
                  disabled={savingSoftConstraints}
                  className="w-full rounded-xl border-2 border-black bg-blue-600 px-4 py-2 text-sm font-black text-white transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                >
                  {savingSoftConstraints ? 'Saving...' : 'Save Soft Constraints'}
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
