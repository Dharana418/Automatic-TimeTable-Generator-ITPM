import React from 'react';
import TimetableGenerationByYearSemester from '../components/TimetableGenerationByYearSemester.jsx';

/**
 * FacultyCoordinatorSchedulerPage
 * 
 * Allows faculty coordinators to:
 * 1. Generate timetables for specific year/semester combinations
 * 2. View and manage generated timetables
 * 3. Approve/Reject timetables
 * 4. Export schedules
 * 
 * This page integrates the core timetable generation workflow with
 * hall allocations and faculty soft constraints.
 */
const FacultyCoordinatorSchedulerPage = () => {
  const stats = {
    totalTimetables: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Timetable Scheduler
          </h1>
          <p className="mt-2 text-gray-600">
            Generate and manage specialization, year, and semester timetables with optimized scheduling
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Timetables</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalTimetables}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-green-600">Approved</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {stats.approvedCount}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-yellow-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pendingCount}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-red-600">Rejected</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {stats.rejectedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <TimetableGenerationByYearSemester />
      </div>

      {/* Information Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            About Timetable Generation
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
            <li>
              Select specialization, academic year, and semester to generate timetables
            </li>
            <li>
              Modules are fetched from Academic Coordinator records for Faculty Coordinator review
            </li>
            <li>
              Choose optimization algorithm(s): Hybrid (recommended), PSO, Genetic
              Algorithm, Ant Colony, or Tabu Search
            </li>
            <li>
              Hall allocations from approved timetables are automatically applied
            </li>
            <li>
              Your soft constraints (preferences) are loaded for scheduling
            </li>
            <li>
              Export generated timetables to CSV for further analysis
            </li>
            <li>
              Approve or reject timetables before they're finalized
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FacultyCoordinatorSchedulerPage;
