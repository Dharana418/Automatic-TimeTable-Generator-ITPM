import React from 'react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import HallAllocation from '../components/HallAllocation.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FacultyHallAllocationPage = ({ user }) => {
  return (
    <FacultyCoordinatorShell
      user={user}
      title="Hall Allocation Workspace"
      subtitle="Manage hall availability, maintenance windows, and allocation status."
      badge="Resource Allocation"
      footerNote="Faculty Coordinator hall allocation workspace"
    >
      <HallAllocation apiBase={API_BASE} />
    </FacultyCoordinatorShell>
  );
};

export default FacultyHallAllocationPage;
