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
        <aside className="hidden w-64 border-r border-purple-100/50 bg-gradient-to-b from-white to-purple-50 p-6 backdrop-blur lg:block rounded-r-3xl">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🎓</div>
              <h2 className="text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Batch Admin</h2>
            </div>
          </div>
          <nav className="space-y-2">
            <NavLink to="/faculty/batches" label="Batch List" active icon="📦" color="purple" />
            <NavLink to="/faculty/modules" label="Modules" icon="📚" color="emerald" />
            <NavLink to="/dashboard" label="Dashboard" icon="📊" color="cyan" />
          </nav>
          <div className="mt-auto border-t border-purple-100/50 pt-6">
            <div className="rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-100 to-pink-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-900">{displayName}</p>
              <p className="mt-1 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Faculty Coordinator</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="border-b border-purple-100/50 bg-gradient-to-r from-white via-purple-50 to-white p-6 shadow-md backdrop-blur rounded-b-3xl">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📋</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Batch Management</p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-900">Batch & Specialization Control</h1>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Configure batch sizes, assign specializations, and manage campus capacity rules.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {specializations.map((item, idx) => {
                  const colors = ['from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-cyan-500 to-blue-500', 'from-orange-500 to-rose-500', 'from-indigo-500 to-purple-500', 'from-rose-500 to-pink-500', 'from-teal-500 to-green-500', 'from-amber-500 to-orange-500'];
                  return (
                    <span
                      key={item}
                      className={`rounded-2xl bg-gradient-to-r ${colors[idx % colors.length]} px-4 py-2 text-xs font-bold text-white shadow-md hover:-translate-y-0.5 transition`}
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

function NavLink({ to, label, active, icon, color }) {
  const colorClasses = {
    purple: 'from-purple-600 to-pink-600',
    emerald: 'from-emerald-600 to-teal-600',
    cyan: 'from-cyan-600 to-blue-600',
  };
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
        active
          ? `bg-gradient-to-r ${colorClasses[color]} text-white shadow-md`
          : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-purple-100 hover:text-slate-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}

export default FacultyBatchesPage;
