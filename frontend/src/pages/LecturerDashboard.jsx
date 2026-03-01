import React from 'react';
import CommonDashboard from './CommonDashboard';

const LecturerDashboard = ({ user }) => (
  <CommonDashboard user={user} role="Lecturer" />
);

export default LecturerDashboard;
