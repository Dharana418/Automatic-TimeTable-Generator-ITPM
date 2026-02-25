import React from 'react';
import '../styles/dashboard.css';

const AcademicCoordinatorDashboard = ({ user }) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Academic Coordinator Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Academic Calendar</h2>
          <p>Manage academic calendar and schedules</p>
          <button className="dashboard-btn">View Calendar</button>
        </div>

        <div className="dashboard-card">
          <h2>Program Management</h2>
          <p>Manage academic programs</p>
          <button className="dashboard-btn">Manage Programs</button>
        </div>

        <div className="dashboard-card">
          <h2>Compliance Tracking</h2>
          <p>Track compliance and regulations</p>
          <button className="dashboard-btn">View Compliance</button>
        </div>

        <div className="dashboard-card">
          <h2>Reports</h2>
          <p>Generate academic reports</p>
          <button className="dashboard-btn">Generate Reports</button>
        </div>
      </div>
    </div>
  );
};

export default AcademicCoordinatorDashboard;
