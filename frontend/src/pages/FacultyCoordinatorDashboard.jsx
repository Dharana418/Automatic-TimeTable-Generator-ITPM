import React from 'react';
import '../styles/dashboard.css';

const FacultyCoordinatorDashboard = ({ user }) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Faculty Coordinator Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Timetable Management</h2>
          <p>Create and manage timetables for your faculty</p>
          <button className="dashboard-btn">Manage Timetables</button>
        </div>

        <div className="dashboard-card">
          <h2>Resource Allocation</h2>
          <p>Allocate rooms, instructors, and resources</p>
          <button className="dashboard-btn">Allocate Resources</button>
        </div>

        <div className="dashboard-card">
          <h2>Reports & Analytics</h2>
          <p>View timetable analytics and reports</p>
          <button className="dashboard-btn">View Reports</button>
        </div>

        <div className="dashboard-card">
          <h2>Faculty Settings</h2>
          <p>Configure faculty-specific settings</p>
          <button className="dashboard-btn">Settings</button>
        </div>
      </div>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
