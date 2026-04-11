import React from 'react';

const DashboardCards = ({ cards }) => (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card, idx) => (
      <div
        className="group rounded-2xl border border-white/30 bg-white/90 p-6 shadow-lg shadow-indigo-500/10 transition hover:-translate-y-1 hover:shadow-xl"
        key={idx}
      >
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg text-indigo-600">
          ✦
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
        <p className="mt-2 min-h-12 text-sm text-slate-600">{card.description}</p>
        <button className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-indigo-700">
          {card.button}
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md md:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">TimeTable Hub</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{role} Dashboard</h1>
            <p className="mt-2 text-indigo-100">Welcome, {user?.username || 'User'}</p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white">
            Active Session
          </span>
        </div>

        <DashboardCards cards={cards} />
      </div>
    </div>
  );
};

export default CommonDashboard;
