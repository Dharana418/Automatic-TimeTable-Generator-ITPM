import React from 'react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import HallAllocation from '../components/HallAllocation.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AcademicHallAllocationPage = ({ user }) => {
  return (
    <FacultyCoordinatorShell
      user={user}
      title="Hall Allocations Workspace"
      subtitle="Manage hall availability, maintenance windows, and allocation status for the academic coordinator side."
      badge="Resource Allocation"
      backgroundImage={facultyDashboardBg}
      footerNote="Academic Coordinator hall allocation workspace"
      brandCode="AC"
      brandTitle="Academic Coordinator"
      brandSubtitle="Resource Allocation Console"
      themeVariant="academic"
    >
      <HallAllocation apiBase={API_BASE} />
    </FacultyCoordinatorShell>
  );
};

export default AcademicHallAllocationPage;