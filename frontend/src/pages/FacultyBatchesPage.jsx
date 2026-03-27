import BatchList from '../components/BatchList.jsx';
import { Link } from 'react-router-dom';

const specializations = ['IT', 'SE', 'DS', 'ISE', 'CS', 'Computer Science', 'IM', 'CN'];

const FacultyBatchesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="flex min-h-screen">
        {/* Dark Slate Sidebar */}
        <aside className="hidden w-64 border-r border-[#E2E8F0] bg-slate-900 p-6 dark:border-gray-800 lg:block">
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Batch Admin</h2>
          </div>
          <nav className="space-y-1">
            <NavLink to="/faculty/batches" label="Batch List" active icon="📦" />
            <NavLink to="/faculty/modules" label="Modules" icon="📚" />
            <NavLink to="/dashboard" label="Dashboard" icon="📊" />
          </nav>
          <div className="mt-auto border-t border-[#E2E8F0] pt-6 dark:border-gray-800">
            <div className="rounded border border-[#E2E8F0] bg-slate-800 p-3 dark:border-gray-700">
              <p className="text-xs font-semibold text-slate-100">{displayName}</p>
              <p className="mt-1 text-xs text-slate-400">Faculty Coordinator</p>
            </div>
          </div>
        </aside>

        {/* Main Content 12-Column Grid */}
        <main className="flex-1">
          <div className="border-b border-[#E2E8F0] bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Batch Management</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Batch & Specialization Control</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Configure batch sizes, assign specializations, and manage campus capacity rules.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {specializations.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-[#E2E8F0] bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    {item}
                  </span>
                ))}
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

function NavLink({ to, label, active, icon }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export default FacultyBatchesPage;
