
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import api from '../api/scheduler.js';
import BatchList from '../components/BatchList.jsx';

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || 'Coordinator';
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const navigate = useNavigate();

  const totalInstructors = resources.reduce((acc, item) => acc + (item.instructors?.length || 0), 0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingResources(true);
        const res = await api.getLicsWithInstructors();
        if (mounted && res && res.items) setResources(res.items);
      } catch (e) {
        console.error('Failed to load resources', e);
      } finally {
        setLoadingResources(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-900/40 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Faculty Command Center</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Welcome back, {username}</h1>
              <p className="mt-2 text-slate-200">Manage campus resources and instructors added by Academic Coordinators.</p>
            </div>
            <button
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
              onClick={() => navigate('/scheduler')}
            >
              Open Scheduler
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-300">Campus Units</p>
              <p className="mt-1 text-2xl font-bold text-white">{resources.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-300">Instructor Pool</p>
              <p className="mt-1 text-2xl font-bold text-white">{totalInstructors}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-300">Status</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">Active</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/90 p-5 shadow-lg shadow-indigo-700/10">
                <h3 className="text-lg font-semibold text-slate-900">Timetable Management</h3>
                <p className="mt-2 text-sm text-slate-600">Create and manage timetables for your faculty.</p>
                <button
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  onClick={() => navigate('/scheduler')}
                >
                  Manage Timetable
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/90 p-5 shadow-lg shadow-indigo-700/10">
                <h3 className="text-lg font-semibold text-slate-900">Resource Allocation</h3>
                <p className="mt-2 text-sm text-slate-600">Track LIC and instructor allocations by campus unit.</p>
                <button className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
                  Review Resources
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/90 p-4 shadow-lg shadow-indigo-700/10">
              <BatchList />
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/90 p-5 shadow-lg shadow-indigo-700/10">
            <h4 className="text-lg font-semibold text-slate-900">Campus Resources</h4>
            <p className="mt-1 text-sm text-slate-500">LIC units and available instructors</p>
            {loadingResources ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : (
              <div className="mt-4 space-y-4">
                {resources.length === 0 && <div className="text-sm text-slate-500">No resources found.</div>}
                {resources.map((lic) => (
                  <div key={lic.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-slate-800">{lic.name || lic.id}</strong>
                      <span className="text-xs text-slate-500">{lic.department || ''}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(lic.instructors || []).length === 0 && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">No instructors</span>
                      )}
                      {(lic.instructors || []).slice(0,6).map((ins) => (
                        <button key={ins.id} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {ins.name || ins.email || ins.id}
                        </button>
                      ))}
                      {(lic.instructors || []).length > 6 && (
                        <span className="text-xs text-slate-500">+{(lic.instructors||[]).length - 6} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
