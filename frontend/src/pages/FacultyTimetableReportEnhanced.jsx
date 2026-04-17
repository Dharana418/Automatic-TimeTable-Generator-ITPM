import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import '../styles/enhanced-faculty-theme.css';
import { EnhancedStatCard, EnhancedTable } from '../components/EnhancedFacultyComponents.jsx';
import { Calendar, Download, Share2, Eye } from 'lucide-react';

const parseTimetableData = (rawData) => {
  if (!rawData) return {};
  if (typeof rawData === 'object') return rawData;

  if (typeof rawData === 'string') {
    try {
      return JSON.parse(rawData);
    } catch {
      return {};
    }
  }

  return {};
};

const parseScheduleRows = (timetable = {}) => {
  const data = parseTimetableData(timetable.data);

  if (Array.isArray(data?.schedule)) return data.schedule;
  if (Array.isArray(data?.groupedSchedules)) {
    return data.groupedSchedules.flatMap((group) => {
      if (Array.isArray(group?.entries)) return group.entries;
      if (Array.isArray(group?.schedule)) return group.schedule;
      return [];
    });
  }

  return Array.isArray(timetable?.data) ? timetable.data : [];
};

const extractTimetableMeta = (timetable = {}) => {
  const data = parseTimetableData(timetable.data);
  const scope = data.scope || data.timetableScope || {};

  return {
    year: String(timetable.year || scope.year || data.year || data.academicYear || '').trim() || 'ALL',
    semester: String(timetable.semester || scope.semester || data.semester || '').trim() || 'ALL',
    specialization: String(scope.specialization || data.specialization || 'ALL').trim().toUpperCase() || 'ALL',
  };
};

const FacultyTimetableReportEnhanced = ({ user }) => {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = async () => {
    try {
      setLoading(true);
      const response = await api.getAcademicCoordinatorTimetables?.() || { data: [] };
      setTimetables(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimetables = timetables.filter((t) => {
    const meta = extractTimetableMeta(t);
    if (filterYear && meta.year !== filterYear) return false;
    if (filterSemester && meta.semester !== filterSemester) return false;
    if (filterSpecialization && meta.specialization !== filterSpecialization) return false;
    return true;
  });

  const groupedTimetables = React.useMemo(() => {
    const yearMap = new Map();

    filteredTimetables.forEach((timetable) => {
      const meta = extractTimetableMeta(timetable);

      if (!yearMap.has(meta.year)) yearMap.set(meta.year, new Map());
      const specializationMap = yearMap.get(meta.year);

      if (!specializationMap.has(meta.specialization)) specializationMap.set(meta.specialization, new Map());
      const semesterMap = specializationMap.get(meta.specialization);

      if (!semesterMap.has(meta.semester)) semesterMap.set(meta.semester, []);
      semesterMap.get(meta.semester).push(timetable);
    });

    return Array.from(yearMap.entries())
      .map(([year, specializationMap]) => ({
        year,
        specializations: Array.from(specializationMap.entries())
          .map(([specialization, semesterMap]) => ({
            specialization,
            semesters: Array.from(semesterMap.entries())
              .map(([semester, items]) => ({ semester, items }))
              .sort((a, b) => String(a.semester).localeCompare(String(b.semester))),
          }))
          .sort((a, b) => String(a.specialization).localeCompare(String(b.specialization))),
      }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [filteredTimetables]);

  const tableColumns = [
    {
      key: 'name',
      label: 'Timetable Name',
      render: (name) => <span className="font-semibold">{name}</span>,
    },
    {
      key: 'year',
      label: 'Year',
      render: (_, row) => <span className="fc-badge primary">{extractTimetableMeta(row).year}</span>,
    },
    {
      key: 'semester',
      label: 'Semester',
      render: (_, row) => <span className="fc-badge secondary">{extractTimetableMeta(row).semester}</span>,
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (_, row) => <span className="fc-badge secondary">{extractTimetableMeta(row).specialization}</span>,
    },
    {
      key: 'createdAt',
      label: 'Generated',
      render: (date) => {
        const d = new Date(date);
        return <span className="text-sm text-slate-600">{d.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewTimetable(row)}
            className="fc-btn secondary text-xs"
            title="View details"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDownloadTimetable(row)}
            className="fc-btn secondary text-xs"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewTimetable = (timetable) => {
    navigate('/faculty/timetable-report', { state: { selectedTimetable: timetable } });
  };

  const handleDownloadTimetable = (timetable) => {
    const schedule = parseScheduleRows(timetable);
    if (!schedule.length) {
      window.alert('No schedule data available');
      return;
    }

    const headers = ['Module', 'Hall', 'Day', 'Slot', 'Instructor', 'Batch'];
    const rows = schedule.map((row) => [
      row.moduleName || '',
      row.hallName || '',
      row.day || '',
      row.slot || '',
      row.instructorName || '',
      Array.isArray(row.batchKeys) ? row.batchKeys.join('; ') : '',
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${timetable.name || 'timetable'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const years = [...new Set(timetables.map((t) => extractTimetableMeta(t).year))];
  const semesters = [...new Set(timetables.map((t) => extractTimetableMeta(t).semester))];
  const specializations = [...new Set(timetables.map((t) => extractTimetableMeta(t).specialization))];
  const averageSlotsPerDay = timetables.length > 0
    ? Math.round(
        timetables.reduce((sum, t) => {
          const schedule = parseScheduleRows(t);
          return sum + schedule.length;
        }, 0) / timetables.length
      )
    : 0;

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Timetable Reports & History"
      subtitle="View, analyze, and export generated timetables"
      badge="Timetable Reports"
      sidebarSections={[
        { id: 'overview', label: 'Overview' },
        { id: 'filters', label: 'Filters' },
        { id: 'history', label: 'History' },
      ]}
      headerActions={
        <button onClick={loadTimetables} className="fc-btn primary">
          Refresh Reports
        </button>
      }
    >
      <div className="fc-dashboard-container py-8">
        {/* Overview Section */}
        <div id="overview" className="fc-section mb-8">
          <div className="fc-dashboard-header mb-8">
            <h1>Timetable Reports & Analytics</h1>
            <p>Access generated timetables, view details, and export schedules</p>
          </div>

          <div className="fc-stats-grid mb-8">
            <EnhancedStatCard
              title="Total Timetables"
              value={timetables.length}
              icon={Calendar}
              color="blue"
              subtitle="Generated schedules"
            />
            <EnhancedStatCard
              title="Academic Years"
              value={years.length}
              icon={Calendar}
              color="green"
              subtitle="Coverage"
            />
            <EnhancedStatCard
              title="Semesters"
              value={semesters.length}
              icon={Calendar}
              color="purple"
              subtitle="Terms"
            />
            <EnhancedStatCard
              title="Avg Slots/Day"
              value={averageSlotsPerDay}
              icon={Calendar}
              color="amber"
              subtitle="Per timetable"
            />
          </div>
        </div>

        {/* Filter Section */}
        <div id="filters" className="fc-section mb-8">
          <h2 className="fc-section-title mb-4">Filter Timetables</h2>
          <div className="fc-card">
            <div className="fc-card-content">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="fc-filter-label">Academic Year</label>
                  <select
                    className="fc-filter-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fc-filter-label">Semester</label>
                  <select
                    className="fc-filter-select"
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                  >
                    <option value="">All Semesters</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fc-filter-label">Specialization</label>
                  <select
                    className="fc-filter-select"
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <button
                    onClick={() => {
                      setFilterYear('');
                      setFilterSemester('');
                      setFilterSpecialization('');
                    }}
                    className="fc-btn secondary flex-1"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timetable History */}
        <div id="history" className="fc-section">
          <div className="fc-section-header mb-6">
            <h2 className="fc-section-title">Timetable History</h2>
            <span className="fc-badge primary">{filteredTimetables.length} Results</span>
          </div>

          <div className="fc-card">
            <div className="fc-card-content">
              <EnhancedTable
                columns={tableColumns}
                data={filteredTimetables}
                loading={loading}
                emptyMessage="No timetables found. Generate one from the scheduler."
              />
            </div>
          </div>

          <div className="fc-card" style={{ marginTop: '1rem' }}>
            <div className="fc-card-header">
              <h3>Year by Year / Specialization / Per Semester View</h3>
            </div>
            <div className="fc-card-content">
              {groupedTimetables.length === 0 ? (
                <p className="text-sm text-slate-600">No grouped timetable data found for the selected filters.</p>
              ) : (
                <div className="space-y-3">
                  {groupedTimetables.map((yearGroup) => (
                    <div key={`y-${yearGroup.year}`} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">Year {yearGroup.year}</p>
                      <div className="mt-2 space-y-2">
                        {yearGroup.specializations.map((specGroup) => (
                          <div key={`s-${yearGroup.year}-${specGroup.specialization}`} className="rounded-lg border border-slate-200 p-2">
                            <p className="text-xs font-semibold text-slate-700">{specGroup.specialization}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {specGroup.semesters.map((semesterGroup) => (
                                <button
                                  key={`sem-${yearGroup.year}-${specGroup.specialization}-${semesterGroup.semester}`}
                                  className="fc-btn secondary text-xs"
                                  onClick={() => {
                                    const selected = semesterGroup.items[0];
                                    if (!selected) return;
                                    navigate(`/faculty/timetable-report?timetableId=${encodeURIComponent(String(selected.id || ''))}`);
                                  }}
                                >
                                  Semester {semesterGroup.semester} ({semesterGroup.items.length})
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          {filteredTimetables.length > 0 && (
            <div className="fc-card" style={{ marginTop: '2rem' }}>
              <div className="fc-card-header">
                <h3>Bulk Operations</h3>
              </div>
              <div className="fc-card-content">
                <p className="text-sm text-slate-600 mb-4">
                  Export all {filteredTimetables.length} timetable(s) as CSV files for offline analysis or sharing.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      filteredTimetables.forEach((t) => handleDownloadTimetable(t));
                    }}
                    className="fc-btn primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Download className="w-4 h-4" />
                    Export All as CSV
                  </button>
                  <button
                    className="fc-btn secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyTimetableReportEnhanced;
