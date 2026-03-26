import React from 'react';
import { BookOpen, Calendar, Users, Settings, ArrowRight } from 'lucide-react';

const InstructorDashboard = ({ user }) => {
  const cards = [
    { title: 'My Courses', description: 'View assigned courses', button: 'View Courses', icon: BookOpen },
    { title: 'My Schedule', description: 'Check your teaching schedule', button: 'View Schedule', icon: Calendar },
    { title: 'Class Management', description: 'Manage class information', button: 'Manage Classes', icon: Users },
    { title: 'Preferences', description: 'Set scheduling preferences', button: 'Set Preferences', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border-2 border-black bg-white/90 backdrop-blur-sm p-6 shadow-2xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Teaching Center — Course Management</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Instructor Dashboard</h1>
          <p className="mt-2 text-slate-700 font-semibold">Welcome, {user?.username || 'User'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div key={card.title} className="rounded-2xl border-2 border-black bg-white/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <IconComponent size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm text-slate-700 font-medium">{card.description}</p>
                <button className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-blue-600 px-4 py-2 text-sm font-black text-white transition-all duration-200 hover:bg-blue-700 active:scale-95">
                  {card.button}
                  <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
