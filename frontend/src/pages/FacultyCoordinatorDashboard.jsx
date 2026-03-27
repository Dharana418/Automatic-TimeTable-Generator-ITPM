import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';

const menuGroups = [
  {
    title: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', to: '/dashboard' },
      { id: 'timetable', label: 'Timetables', to: '/scheduler' },
    ],
  },
  {
    title: 'Coordination',
    items: [
      { id: 'batches', label: 'Batches', to: '/faculty/batches' },
      { id: 'modules', label: 'Modules', to: '/faculty/modules' },
      { id: 'resources', label: 'Resources', to: '/dashboard' },
    ],
  },
];

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || user?.name || 'Coordinator';
  const navigate = useNavigate();
  const location = useLocation();

  const [resources, setResources] = useState([]);
  const [_loadingResources, setLoadingResources] = useState(false);
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
    const loadData = async () => {
      try {
        setLoadingResources(true);
        const response = await api.getLicsWithInstructors();
        if (mounted && response?.items) setResources(response.items);
      } catch (err) {
        console.error('Resource load failed', err);
      } finally {
        if (mounted) setLoadingResources(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalInstructors = useMemo(
    () => resources.reduce((sum, lic) => sum + (lic.instructors?.length || 0), 0),
    [resources]
  );

  const saveSoftConstraints = async () => {
    try {
      setSavingSoftConstraints(true);
      const payload = {
        preferredDays: softConstraintForm.preferredDaysCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredTimeSlots: softConstraintForm.preferredSlotsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        w5Weight: Number(softConstraintForm.w5Weight || 0),
        notes: softConstraintForm.notes,
      };
      await api.saveSoftConstraints(payload);
      window.alert('Constraints updated successfully.');
    } catch (error) {
      window.alert(error.message || 'Update failed.');
    } finally {
      setSavingSoftConstraints(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-purple-50 to-blue-50 text-slate-800">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-20 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 opacity-15 blur-3xl animate-float-medium" />
      <div className="pointer-events-none absolute left-1/3 -bottom-40 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-20 blur-3xl animate-float-slow-reverse" />
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-15 blur-3xl animate-float-fast" />

      {/* Animated Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-5 animate-grid-shift" />

      {/* Floating Particles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-40 top-1/4 left-1/4 animate-float-particle-1" />
        <div className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full opacity-30 top-1/3 right-1/4 animate-float-particle-2" />
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-40 bottom-1/4 left-1/3 animate-float-particle-3" />
        <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-35 top-1/2 right-1/3 animate-float-particle-4" />
        <div className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-25 bottom-1/3 right-1/4 animate-float-particle-5" />
      </div>

      {/* 3D Floating Schedule Cards */}
      <div className="pointer-events-none absolute inset-0 perspective-3d">
        <div className="card-3d card-3d-1 absolute top-1/4 left-1/4 w-32 h-40 border border-blue-200/40 flex items-center justify-center text-xs font-semibold text-blue-400/60">📅</div>
        <div className="card-3d card-3d-2 absolute top-1/3 right-1/4 w-32 h-40 border border-purple-200/40 flex items-center justify-center text-xs font-semibold text-purple-400/60">⏰</div>
        <div className="card-3d card-3d-3 absolute bottom-1/4 left-1/3 w-32 h-40 border border-indigo-200/40 flex items-center justify-center text-xs font-semibold text-indigo-400/60">📋</div>
        <div className="card-3d card-3d-4 absolute top-1/2 right-1/3 w-32 h-40 border border-cyan-200/40 flex items-center justify-center text-xs font-semibold text-cyan-400/60">🗓️</div>
        <div className="card-3d card-3d-5 absolute bottom-1/3 right-1/4 w-32 h-40 border border-emerald-200/40 flex items-center justify-center text-xs font-semibold text-emerald-400/60">✓</div>
        <div className="card-3d card-3d-6 absolute top-2/3 left-1/4 w-32 h-40 border border-pink-200/40 flex items-center justify-center text-2xl">🎓</div>
      </div>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-blue-100/50 bg-white/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 rounded-r-3xl ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-blue-100/50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Faculty Coordinator</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h2>
        </div>

        <nav className="space-y-6 px-4 py-5">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">{group.title}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      location.pathname === item.to
                        ? 'bg-gradient-to-r from-blue-500/20 to-sky-400/20 text-blue-700 ring-1 ring-blue-200/60 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="relative z-10 lg:pl-80">
        <header className="sticky top-0 z-20 border-b border-blue-100/50 bg-white/70 px-6 py-4 backdrop-blur-md shadow-sm rounded-b-3xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 lg:hidden"
              >
                Menu
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-medium">Academic Coordination</p>
                <h1 className="text-xl font-bold text-slate-900">Faculty Coordinator Workspace</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-blue-100/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{username}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-600">Coordinator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-bold text-white shadow-md">
                {username[0] || 'C'}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 p-6 xl:grid-cols-12">
          <section className="xl:col-span-12">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="LIC Units"
                value={resources.length}
                icon="🏢"
                gradient="from-indigo-500 to-purple-600"
              />
              <SummaryCard
                label="Instructors"
                value={totalInstructors}
                icon="👨‍🏫"
                gradient="from-emerald-500 to-teal-600"
              />
              <SummaryCard
                label="Resources Loaded"
                value={resources.length > 0 ? 'Yes' : 'No'}
                icon={resources.length > 0 ? "✅" : "⏳"}
                gradient="from-orange-500 to-rose-600"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-purple-100/70 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-7 shadow-lg backdrop-blur xl:col-span-8">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">📦 Batch Management</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Manage Batch Details</h3>
              </div>
              <div className="text-3xl">📋</div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Configure batch sizes, assign specializations, and manage campus capacity rules in the dedicated Batches page.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/faculty/batches')}
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition shadow-lg hover:-translate-y-1 hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:translate-y-0"
              >
                🎯 Open Batches Page
              </button>
              <button
                type="button"
                onClick={() => navigate('/scheduler')}
                className="rounded-2xl border-2 border-purple-300 bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 hover:border-purple-400"
              >
                📅 Open Timetables
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-100/70 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-7 shadow-lg backdrop-blur xl:col-span-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">⚙️ Soft Constraints</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">w5 Preferences</h3>
              </div>
              <div className="text-2xl">🎛️</div>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                label="📅 Preferred Days"
                val={softConstraintForm.preferredDaysCsv}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: v })}
              />
              <Input
                label="⏰ Preferred Slots"
                val={softConstraintForm.preferredSlotsCsv}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: v })}
              />
              <Input
                label="⚖️ w5 Weight"
                type="number"
                val={softConstraintForm.w5Weight}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: v })}
              />

              <button
                type="button"
                onClick={saveSoftConstraints}
                disabled={savingSoftConstraints}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition shadow-lg hover:-translate-y-1 hover:shadow-xl hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {savingSoftConstraints ? '💾 Saving...' : '✨ Save Constraints'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, gradient }) => (
  <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-6 shadow-lg backdrop-blur border border-white/30 transition hover:-translate-y-2 hover:shadow-xl`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">{label}</p>
        <p className="mt-3 text-4xl font-bold text-white">{value}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

const Input = ({ label, val, onChange, type = 'text' }) => (
  <div>
    <label className="text-[10px] uppercase tracking-[0.14em] font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">{label}</label>
    <input
      type={type}
      className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 hover:border-slate-300"
      value={val}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default FacultyCoordinatorDashboard;