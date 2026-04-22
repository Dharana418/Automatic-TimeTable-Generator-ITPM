import React from 'react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import HallAllocation from '../components/HallAllocation.jsx';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const sectionPanelStyle = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.9), rgba(15,23,42,0.82), rgba(7,89,133,0.35))',
  padding: 24,
  borderRadius: 20,
  border: '1px solid rgba(34,211,238,0.2)',
  boxShadow: '0 10px 30px rgba(2,6,23,0.28)',
  backdropFilter: 'blur(16px)',
};

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
      mainTopMarginClass="mt-9"
      contentSectionWidthClass="max-w-none"
      contentSectionClassName="lg:w-[calc(100%+21.5rem)] lg:ml-[-21.5rem]"
    >
      <section style={sectionPanelStyle}>
        <HallAllocation apiBase={API_BASE} />
      </section>
    </FacultyCoordinatorShell>
  );
};

export default AcademicHallAllocationPage;