import React from 'react';
import '../styles/dashboard.css';

const DashboardCards = ({ cards }) => (
  <div className="dashboard-grid">
    {cards.map((card, idx) => (
      <div className="dashboard-card" key={idx}>
        <h2>{card.title}</h2>
        <p>{card.description}</p>
        <button className="dashboard-btn">{card.button}</button>
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{role} Dashboard</h1>
        <p>Welcome, {user?.username || 'User'}</p>
      </div>
      <DashboardCards cards={cards} />
    </div>
  );
};

export default CommonDashboard;
