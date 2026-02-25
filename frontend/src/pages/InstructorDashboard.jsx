import React from 'react';
import '../styles/dashboard.css';

const InstructorDashboard = ({ user }) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>My Courses</h2>
          <p>View assigned courses</p>
          <button className="dashboard-btn">View Courses</button>
        </div>

        <div className="dashboard-card">
          <h2>My Schedule</h2>
          <p>Check your teaching schedule</p>
          <button className="dashboard-btn">View Schedule</button>
        </div>

        <div className="dashboard-card">
          <h2>Class Management</h2>
          <p>Manage class information</p>
          <button className="dashboard-btn">Manage Classes</button>
        </div>

        <div className="dashboard-card">
          <h2>Preferences</h2>
          <p>Set scheduling preferences</p>
          <button className="dashboard-btn">Set Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
