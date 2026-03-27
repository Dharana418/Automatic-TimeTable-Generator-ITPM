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
    <div className="relative min-h-screen overflow-hidden bg-[#070F2B] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-white/15 bg-white/10 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/15 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Faculty Coordinator</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Dashboard</h2>
        </div>

        <nav className="space-y-6 px-4 py-5">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.16em] text-slate-300">{group.title}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      location.pathname === item.to
                        ? 'bg-gradient-to-r from-cyan-400/30 to-indigo-500/30 text-white ring-1 ring-cyan-200/45'
                        : 'text-slate-100 hover:bg-white/15'
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
        <header className="sticky top-0 z-20 border-b border-white/15 bg-[#070F2B]/65 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white lg:hidden"
              >
                Menu
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Academic Coordination</p>
                <h1 className="text-xl font-bold text-white">Faculty Coordinator Workspace</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{username}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">Coordinator</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-bold text-[#070F2B]">
                {username[0] || 'C'}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-5 p-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl xl:col-span-12">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="LIC Units" value={resources.length} />
              <SummaryCard label="Instructors" value={totalInstructors} />
              <SummaryCard label="Resources Loaded" value={resources.length > 0 ? 'Yes' : 'No'} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl xl:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Batch Management</p>
            <h3 className="mt-1 text-lg font-bold text-white">Manage All Batch Details in Batches Page</h3>
            <p className="mt-2 text-sm text-slate-200/90">
              Batch sizes and specialization sizes are now managed only in the dedicated Batches page.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/faculty/batches')}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-[#070F2B] transition hover:brightness-110"
              >
                Open Batches Page
              </button>
              <button
                type="button"
                onClick={() => navigate('/scheduler')}
                className="rounded-xl border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Open Timetables
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl xl:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Soft Constraints</p>
            <h3 className="mt-1 text-lg font-bold text-white">w5 Preferences</h3>

            <div className="mt-4 space-y-3">
              <Input
                label="Preferred Days"
                val={softConstraintForm.preferredDaysCsv}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredDaysCsv: v })}
              />
              <Input
                label="Preferred Slots"
                val={softConstraintForm.preferredSlotsCsv}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, preferredSlotsCsv: v })}
              />
              <Input
                label="w5 Weight"
                type="number"
                val={softConstraintForm.w5Weight}
                onChange={(v) => setSoftConstraintForm({ ...softConstraintForm, w5Weight: v })}
              />

              <button
                type="button"
                onClick={saveSoftConstraints}
                disabled={savingSoftConstraints}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-[#070F2B] transition hover:brightness-110 disabled:opacity-60"
              >
                {savingSoftConstraints ? 'Saving...' : 'Save Constraints'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="rounded-xl border border-white/25 bg-[#0C183F]/65 p-3">
    <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200/85">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
  </div>
);

const Input = ({ label, val, onChange, type = 'text' }) => (
  <div>
    <label className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/85">{label}</label>
    <input
      type={type}
      className="mt-1 w-full rounded-xl border border-white/25 bg-[#0C183F]/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-300/60 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
      value={val}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default FacultyCoordinatorDashboard;