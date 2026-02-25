import React from 'react';
import '../styles/dashboard.css';

const LecturerDashboard = ({ user }) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Lecturer Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>My Schedule</h2>
          <p>View your lecture schedule</p>
          <button className="dashboard-btn">View Schedule</button>
        </div>

        <div className="dashboard-card">
          <h2>Class Sessions</h2>
          <p>Manage class sessions and materials</p>
          <button className="dashboard-btn">Manage Sessions</button>
        </div>

        <div className="dashboard-card">
          <h2>Course Content</h2>
          <p>Upload and manage course content</p>
          <button className="dashboard-btn">Manage Content</button>
        </div>

        <div className="dashboard-card">
          <h2>Availability</h2>
          <p>Set your availability preferences</p>
          <button className="dashboard-btn">Set Availability</button>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
