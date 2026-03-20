

import React from 'react';
import '../styles/dashboard.css';

const Stat = ({ label, value, hint }) => (
  <div className="stat">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {hint && <div className="stat-hint">{hint}</div>}
  </div>
);

const ActionCard = ({ title, desc, action }) => (
  <div className="action-card">
    <div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
    <button className="action-btn">{action}</button>
  </div>
);

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || 'Coordinator';
  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1>Welcome back, {username}</h1>
          <p className="hero-sub">Design timetables naturally — fast, clear, and conflict-free.</p>
          <div className="stat-row">
            <Stat label="Active Modules" value={42} hint="this semester" />
            <Stat label="Available Halls" value={18} hint="including labs" />
            <Stat label="Pending Requests" value={3} hint="for approval" />
          </div>
        </div>
        <div className="hero-right">
          <div className="avatar">{(username || 'U').slice(0,1)}</div>
          <div className="quick-actions">
            <button className="primary">Generate Timetable</button>
            <button className="ghost">Quick Allocate</button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="left-col">
          <ActionCard title="Timetable Management" desc="Create and manage timetables for your faculty" action="Manage" />
          <ActionCard title="Resource Allocation" desc="Allocate rooms, instructors, and resources" action="Allocate" />
          <ActionCard title="Reports & Analytics" desc="View timetable analytics and insights" action="Reports" />
        </div>

        <aside className="right-col">
          <div className="panel">
            <h4>Recent Activity</h4>
            <ul className="activity-list">
              <li>Auto-schedule run completed — 12 conflicts resolved</li>
              <li>New hall added: LT-5</li>
              <li>Module CS504 updated</li>
            </ul>
          </div>

          <div className="panel">
            <h4>Shortcuts</h4>
            <div className="shortcuts">
              <button className="chip">Add Module</button>
              <button className="chip">Add Hall</button>
              <button className="chip">Import CSV</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
