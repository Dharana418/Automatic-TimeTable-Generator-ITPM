import React, { useState } from 'react';
import TimetableGenerationByYearSemester from '../components/TimetableGenerationByYearSemester.jsx';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const stats = [
  { label: 'Academic Years', value: 'Y1 - Y4', note: 'Scheduling scope', icon: 'calendar', color: 'sky' },
  { label: 'Specializations', value: '3 Active', note: 'IT • SE • CS', icon: 'branch', color: 'emerald' },
  { label: 'Module Sync', value: 'Live', note: 'Real-time Academic data', icon: 'pulse', color: 'violet' },
  { label: 'Export Format', value: 'CSV', note: 'Analysis ready', icon: 'download', color: 'amber' },
];

const workflow = [
  { step: 1, title: 'Configure Parameters', desc: 'Select academic year, semester, and specialization filters' },
  { step: 2, title: 'Preview Modules', desc: 'Review Academic Coordinator module set with constraints' },
  { step: 3, title: 'Generate Schedule', desc: 'Run advanced scheduling algorithms with real-time optimization' },
  { step: 4, title: 'Save, View & Export', desc: 'Open saved timetable report and view or download final output' },
];

const capabilities = [
  { title: 'Multi-Algorithm Generation', desc: 'Hybrid, Genetic, PSO, Ant Colony & Tabu Search', badge: 'Advanced' },
  { title: 'Constraint-Based Planning', desc: 'Hall capacity, instructor availability, specialization rules', badge: 'Smart' },
  { title: 'Real-time Sync', desc: 'Automatic module updates from Academic Coordinator', badge: 'Live' },
];

// Icon Components
const Icons = {
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  branch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  pulse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><polyline points="20 6 9 17 4 12"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

const FacultyCoordinatorSchedulerPage = ({ user }) => {
  const [expandedStat, setExpandedStat] = useState(null);

  const colorMaps = {
    sky: { bg: 'from-sky-50 to-blue-50', border: 'border-sky-200', icon: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
    emerald: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    violet: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    amber: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Advanced Scheduling Workspace"
      subtitle="Enterprise-grade timetable generation with multi-algorithm optimization."
      badge="Timetable Planning"
      backgroundImage={facultyDashboardBg}
      footerNote="Faculty Coordinator advanced scheduling workspace"
    >
      <div className="flex flex-col gap-8">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-8 text-slate-900 shadow-lg md:p-12">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-sky-200/20 to-cyan-200/20 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 flex flex-wrap gap-2">
                {['Multi-Algorithm', 'Real-time Sync', 'Constraint-based', 'CSV Export'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur-sm">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Advanced Timetable Generation</p>
              <h1 className="mt-4 text-5xl font-bold leading-tight text-slate-900 lg:text-6xl">
                Generate intelligent schedules
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Leverage advanced multi-algorithm scheduling with real-time Academic Coordinator data synchronization, constraint-based optimization, and comprehensive export capabilities for enterprise-scale timetable planning.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 backdrop-blur-sm lg:min-w-[320px]">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <div className="rounded-full bg-sky-100 p-2">{Icons.zap}</div>
                Quick Workflow
              </div>
              <ol className="mt-5 space-y-3">
                {workflow.map((item) => (
                  <li key={item.step} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white shadow-md">
                      {item.step}
                    </span>
                    <div className="text-sm leading-5">
                      <p className="font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ADVANCED STATS SECTION */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => {
            const colors = colorMaps[item.color];
            return (
              <div
                key={item.label}
                onClick={() => setExpandedStat(expandedStat === index ? null : index)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`absolute inset-0 opacity-0 bg-gradient-to-br ${colors.bg} transition-opacity duration-300 group-hover:opacity-30`} />
                <div className="relative z-10">
                  <div className={`mb-4 inline-block rounded-xl ${colors.badge} p-3`}>
                    <div className={`h-6 w-6 ${colors.icon}`}>{Icons[item.icon]}</div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                  <h3 className="mt-3 text-3xl font-bold text-slate-900">{item.value}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                </div>
                <div className="absolute bottom-0 right-0 h-20 w-20 rounded-tl-2xl bg-gradient-to-tl from-slate-100/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
          })}
        </section>

        {/* CAPABILITIES SHOWCASE */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:border-sky-300">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{cap.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{cap.desc}</p>
                </div>
              </div>
              <div className="mt-4 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                {cap.badge}
              </div>
            </div>
          ))}
        </section>

        {/* MAIN GENERATION SECTION */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-lg">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Advanced Generator</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">Generate Timetables</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Configure parameters, preview modules, and run multi-algorithm scheduling with constraint optimization and real-time validation.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700">System Ready</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <TimetableGenerationByYearSemester />
            </div>
          </div>

          {/* SIDEBAR PANELS */}
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50/40 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-sky-700">
                  <div className="rounded-lg bg-sky-100 p-2">{Icons.check}</div>
                  Coordinator Features
                </div>
              </div>
              <ul className="divide-y divide-slate-100 p-4">
                <li className="flex gap-3 pb-3 last:pb-0">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600">{Icons.check}</div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Module Filtering</p>
                    <p className="text-xs text-slate-500">Year, semester & specialization</p>
                  </div>
                </li>
                <li className="flex gap-3 py-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">{Icons.check}</div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Smart Grouping</p>
                    <p className="text-xs text-slate-500">Specialization-aware clustering</p>
                  </div>
                </li>
                <li className="flex gap-3 pt-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600">{Icons.check}</div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Report Workflow</p>
                    <p className="text-xs text-slate-500">Save, view, and download</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 shadow-md">
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                  <div className="rounded-lg bg-blue-100 p-2">{Icons.info}</div>
                  System Status
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-slate-600">Module Sync</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-slate-600">Data Updated</span>
                    <span className="text-xs text-slate-500">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorSchedulerPage;
