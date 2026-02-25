import React from 'react';
import '../styles/dashboard.css';

const LICDashboard = ({ user }) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>LIC Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Course Management</h2>
          <p>Manage and organize courses</p>
          <button className="dashboard-btn">Manage Courses</button>
        </div>

        <div className="dashboard-card">
          <h2>Instructor Assignment</h2>
          <p>Assign instructors to courses</p>
          <button className="dashboard-btn">Assign Instructors</button>
        </div>

        <div className="dashboard-card">
          <h2>Schedule Optimization</h2>
          <p>Optimize course scheduling</p>
          <button className="dashboard-btn">Optimize Schedule</button>
        </div>

        <div className="dashboard-card">
          <h2>Conflict Resolution</h2>
          <p>Resolve scheduling conflicts</p>
          <button className="dashboard-btn">View Conflicts</button>
        </div>
      </div>
    </div>
  );
};

export default LICDashboard;
