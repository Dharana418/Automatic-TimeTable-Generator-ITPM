import BatchList from '../components/BatchList.jsx';
import { Link } from 'react-router-dom';

const specializations = ['IT', 'SE', 'DS', 'ISE', 'CS', 'Computer Science', 'IM', 'CN'];

const FacultyBatchesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-blue-50 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-12 blur-3xl animate-float-medium" />
      <div className="pointer-events-none absolute left-1/4 -bottom-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-15 blur-3xl animate-float-slow-reverse" />

      <div className="pointer-events-none absolute inset-0 bg-grid opacity-3 animate-grid-shift" />
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-indigo-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 p-6 backdrop-blur lg:block rounded-r-3xl shadow-2xl">
          {/* Sidebar Header */}
          <div className="mb-8 border-b border-indigo-500/30 pb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Batch</p>
                <h2 className="text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Manager</h2>
              </div>
            </div>
          </div>

          <nav className="space-y-3">
            {[
              { to: '/faculty/batches', label: 'Batch List', icon: '📦', color: 'from-blue-600/40 to-blue-500/30', border: 'border-l-4 border-blue-500' },
              { to: '/faculty/modules', label: 'Modules', icon: '📚', color: 'from-purple-600/40 to-purple-500/30', border: 'border-l-4 border-purple-500' },
              { to: '/dashboard', label: 'Dashboard', icon: '📊', color: 'from-cyan-600/40 to-cyan-500/30', border: 'border-l-4 border-cyan-500' }
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                isActive={window.location.pathname === item.to}
                gradientColor={item.color}
                borderColor={item.border}
              />
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6 border-t border-indigo-500/30 bg-gradient-to-t from-indigo-950/60 to-slate-900 pt-6 rounded-br-3xl">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">User</p>
              <p className="mt-2 text-sm font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{displayName}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-indigo-400/80">⭐ Coordinator</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="border-b border-indigo-200/50 bg-gradient-to-r from-white via-indigo-50/50 to-white p-6 shadow-md backdrop-blur rounded-b-3xl">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 text-3xl shadow-lg">📋</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Batch Management</p>
                  <h1 className="mt-0.5 text-3xl font-bold text-slate-900">Batch & Specialization Control</h1>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Configure batch sizes, assign specializations, and manage campus capacity rules.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {specializations.map((item, idx) => {
                  const colorGroups = [
                    'from-blue-600 to-blue-500',
                    'from-purple-600 to-purple-500',
                    'from-cyan-600 to-cyan-500',
                    'from-indigo-600 to-indigo-500',
                    'from-violet-600 to-violet-500',
                    'from-pink-600 to-pink-500',
                    'from-emerald-600 to-emerald-500',
                    'from-amber-600 to-amber-500'
                  ];
                  return (
                    <span
                      key={item}
                      className={`rounded-2xl bg-gradient-to-r ${colorGroups[idx % colorGroups.length]} px-4 py-2 text-xs font-bold text-white shadow-md hover:-translate-y-0.5 transition border-l-4 ${
                        idx % 2 === 0 ? 'border-l-white/40' : 'border-l-slate-200/40'
                      }`}
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mx-auto max-w-7xl">
              <BatchList />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

function NavLink({ to, label, isActive, icon, gradientColor, borderColor }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${borderColor} ${
        isActive
          ? `bg-gradient-to-r ${gradientColor} ring-1 ring-white/20 font-semibold text-white shadow-lg`
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}

export default FacultyBatchesPage;
