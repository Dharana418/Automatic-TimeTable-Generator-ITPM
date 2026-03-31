import BatchList from '../components/BatchList.jsx';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

const specializationTags = ['IT', 'SE', 'DS', 'ISE', 'CS', 'Computer Science', 'IM', 'CN'];

const FacultyBatchesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Batch & Specialization Control"
      subtitle="Institutional workspace for managing batch records and specialization structure"
      badge="Batch Management"
    >
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white/88 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Coordinator Console</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Faculty Batch Registry</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Maintain standardized batch definitions, monitor specialization balance, and review group and subgroup composition within a single institutional control panel.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Managed By</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{displayName}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Specialization Cloud</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {specializationTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.09)] sm:p-5">
          <BatchList />
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyBatchesPage;
