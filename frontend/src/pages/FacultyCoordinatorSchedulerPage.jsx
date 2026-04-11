import React from 'react';
import TimetableGenerationByYearSemester from '../components/TimetableGenerationByYearSemester.jsx';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const stats = [
  { label: 'Year / Semester', value: 'Y1 - Y4', note: 'Filtered scheduling scope' },
  { label: 'Specializations', value: 'IT • SE • CS', note: 'Department-aware planning' },
  { label: 'Academic Modules', value: 'Live Sync', note: 'Fetched from Academic Coordinator' },
  { label: 'Export Mode', value: 'CSV Ready', note: 'Download and review output' },
];

const workflow = [
  'Select the academic year, semester, and specialization.',
  'Review the module set fetched from Academic Coordinator records.',
  'Choose the scheduling algorithm mix and generate the timetable.',
  'Approve, reject, or export the generated result after review.',
];

const accentChips = ['Specialization-aware', 'Academic Coordinator sync', 'Approval workflow', 'CSV export'];

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const FacultyCoordinatorSchedulerPage = ({ user }) => {
  return (
    <FacultyCoordinatorShell
      user={user}
      title="Schedule Generation Workspace"
      subtitle="Plan specialization, year, and semester timetables from Academic Coordinator module data."
      badge="Timetable Planning"
      backgroundImage={facultyDashboardBg}
      footerNote="Faculty Coordinator scheduling workspace"
    >
      <div className="flex flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-sky-100/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 text-slate-900 shadow-[0_22px_60px_rgba(14,116,144,0.14)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                {accentChips.map((chip) => (
                  <span key={chip} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Faculty Coordinator Scheduler</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Build timetables by year, semester, and specialization.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                This workspace is designed for scheduling review and generation. Modules are fetched from the Academic Coordinator data set, then filtered by academic year and specialization before timetable generation.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white/85 p-4 backdrop-blur-sm lg:min-w-[290px]">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <InfoIcon />
                Quick Workflow
              </div>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                {workflow.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                      {index + 1}
                    </span>
                    <span className="leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.value}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.1)] backdrop-blur md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Timetable Generator</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Year and Semester Scheduling</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Use the controls below to select the academic year, semester, and specialization. The system will preview modules, run the selected algorithm mix, and keep the coordinator view synchronized with approval status.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 shadow-sm">
                Academic module sync enabled
              </div>
            </div>

            <TimetableGenerationByYearSemester />
          </div>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Review Focus</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">What the Faculty Coordinator sees</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">Academic Coordinator modules filtered by year and semester.</li>
                <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">Specialization-specific module grouping for clean generation.</li>
                <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">Generated timetable approvals and rejections in one place.</li>
                <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">CSV export for timetable analysis and reporting.</li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-white to-cyan-50 p-5 text-slate-900 shadow-[0_18px_42px_rgba(14,116,144,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Why this page matters</p>
              <h3 className="mt-2 text-xl font-bold">Designed for operational review</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The timetable generation page is now aligned with the Faculty Coordinator workflow, so the coordinator can inspect available modules before producing a final schedule.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorSchedulerPage;
