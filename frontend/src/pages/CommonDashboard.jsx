import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

const DashboardCards = ({ cards }) => (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card, idx) => (
      <div
        className="group rounded-2xl border-2 border-black bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl"
        key={idx}
      >
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Zap size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-slate-900">{card.title}</h2>
        <p className="mt-2 min-h-12 text-sm text-slate-700 font-medium">{card.description}</p>
        <button className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-blue-600 px-4 py-2 text-sm font-black text-white transition-all duration-200 transform hover:bg-blue-700 active:scale-95">
          {card.button}
          <ArrowRight size={16} strokeWidth={3} />
        </button>
      </div>
    ))}
  </div>
);

const CommonDashboard = ({ user, role }) => {
  // Define cards for each role
  const cards = role === 'LIC' || role === 'Senior Lecturer'
    ? [
        { title: 'Course Management', description: 'Manage and organize courses', button: 'Manage Courses' },
        { title: 'Instructor Assignment', description: 'Assign instructors to courses', button: 'Assign Instructors' },
        { title: 'Schedule Optimization', description: 'Optimize course scheduling', button: 'Optimize Schedule' },
        { title: 'Conflict Resolution', description: 'Resolve scheduling conflicts', button: 'View Conflicts' },
      ]
    : [
        { title: 'My Schedule', description: 'View your lecture schedule', button: 'View Schedule' },
        { title: 'Class Sessions', description: 'Manage class sessions and materials', button: 'Manage Sessions' },
        { title: 'Course Content', description: 'Upload and manage course content', button: 'Manage Content' },
        { title: 'Availability', description: 'Set your availability preferences', button: 'Set Availability' },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-3xl border-2 border-black bg-white/90 backdrop-blur-sm p-6 shadow-2xl md:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">TimeTable Hub — Academic Scheduler</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">{role} Dashboard</h1>
            <p className="mt-2 text-slate-700 font-semibold">Welcome, {user?.username || 'User'}</p>
          </div>
          <span className="rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black text-slate-900">
            Active Session
          </span>
        </div>

        <DashboardCards cards={cards} />
      </div>
    </div>
  );
};

export default CommonDashboard;
