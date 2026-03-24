import React from 'react';

const InstructorDashboard = ({ user }) => {
  const cards = [
    { title: 'My Courses', description: 'View assigned courses', button: 'View Courses' },
    { title: 'My Schedule', description: 'Check your teaching schedule', button: 'View Schedule' },
    { title: 'Class Management', description: 'Manage class information', button: 'Manage Classes' },
    { title: 'Preferences', description: 'Set scheduling preferences', button: 'Set Preferences' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-6 shadow-2xl shadow-indigo-900/40 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Teaching Center</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Instructor Dashboard</h1>
          <p className="mt-2 text-slate-200">Welcome, {user?.username || 'User'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
              <button className="mt-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600">
                {card.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
