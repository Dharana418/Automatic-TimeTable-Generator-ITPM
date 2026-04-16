import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import {
  approveTimetable,
  getSchedulingConflicts,
  getTimetablesForYearSemester,
  rejectTimetable,
  resolveSchedulingConflict,
} from '../api/timetableGeneration.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import '../styles/enhanced-faculty-theme.css';
import {
  EnhancedStatCard,
  TimetableUtilizationChart,
  SchedulingConflictsChart,
  ModuleDistributionChart,
  ScheduleComplianceChart,
  EnhancedTable,
  AdvancedFilterPanel,
} from '../components/EnhancedFacultyComponents.jsx';
import { Users, Calendar, Book, Zap, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const extractScheduleRows = (timetable) => {
  const rawData = timetable?.data;
  const parsedData = typeof rawData === 'string'
    ? (() => {
        try {
          return JSON.parse(rawData);
        } catch {
          return {};
        }
      })()
    : (rawData || {});

  if (Array.isArray(parsedData.schedule)) return parsedData.schedule;
  if (Array.isArray(parsedData.data)) return parsedData.data;
  return [];
};

const downloadTimetableCsv = (timetable) => {
  const schedule = extractScheduleRows(timetable);
  if (!schedule.length) {
    window.alert('No schedule data available');
    return;
  }

  const headers = ['Module', 'Hall', 'Day', 'Slot', 'Instructor', 'Batch'];
  const rows = schedule.map((row) => [
    row.moduleName || row.moduleId || '',
    row.hallName || row.hallId || '',
    row.day || '',
    row.slot || (Array.isArray(row.slots) ? row.slots.join(' | ') : ''),
    row.instructorName || row.instructorId || '',
    Array.isArray(row.batchKeys) ? row.batchKeys.join(' | ') : '',
  ]);

  const csv = [headers, ...rows]
    .map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${String(timetable?.name || 'timetable').replace(/[^a-zA-Z0-9-_]/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const FacultyCoordinatorDashboardEnhanced = ({ user }) => {
  const username = user?.username || user?.name || 'Coordinator';
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [modulesCatalog, setModulesCatalog] = useState([]);
  const [batchesCatalog, setBatchesCatalog] = useState([]);
  const [lastWorkspaceSync, setLastWorkspaceSync] = useState(null);
  const [savedTimetables, setSavedTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loadingTimetables, setLoadingTimetables] = useState(false);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [_loadingResources, setLoadingResources] = useState(false);
  const [timetableFilters, setTimetableFilters] = useState({
    year: '',
    semester: '',
    specialization: '',
  });
  const [actioningTimetableId, setActioningTimetableId] = useState('');

  // Load initial data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoadingResources(true);
        setLoadingTimetables(true);
        setLoadingConflicts(true);

        const [resourceResponse, timetableResponse, conflictResponse, moduleResponse, batchResponse] = await Promise.all([
          api.getLicsWithInstructors().catch(() => ({ items: [] })),
          api.getAcademicCoordinatorTimetables().catch(() => ({ data: [] })),
          getSchedulingConflicts(false).catch(() => ({ data: [] })),
          api.listItems('modules').catch(() => ({ items: [] })),
          api.listItems('batches').catch(() => ({ items: [] })),
        ]);

        if (mounted) {
          setResources(Array.isArray(resourceResponse?.items) ? resourceResponse.items : []);
          setSavedTimetables(Array.isArray(timetableResponse?.data) ? timetableResponse.data : []);
          setConflicts(Array.isArray(conflictResponse?.data) ? conflictResponse.data : []);
          setModulesCatalog(Array.isArray(moduleResponse?.items) ? moduleResponse.items : []);
          setBatchesCatalog(Array.isArray(batchResponse?.items) ? batchResponse.items : []);
          setLastWorkspaceSync(new Date());
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (mounted) {
          setLoadingResources(false);
          setLoadingTimetables(false);
          setLoadingConflicts(false);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  /* ──────────────────────────────────────────────────────────── */
  /* COMPUTED VALUES                                              */
  /* ──────────────────────────────────────────────────────────── */

  const totalInstructors = useMemo(
    () => resources.reduce((sum, lic) => sum + (lic.instructors?.length || 0), 0),
    [resources]
  );

  const pendingReviewTimetables = useMemo(
    () => savedTimetables.filter((timetable) => {
      const status = normalizeStatus(timetable.status);
      return !status || status === 'pending';
    }),
    [savedTimetables]
  );

  const filteredTimetables = useMemo(() => {
    return savedTimetables.filter((timetable) => {
      const timetableYear = String(timetable.year || timetable.academicYear || '').trim();
      const timetableSemester = String(timetable.semester || '').trim();
      const timetableSpecialization = String(
        timetable.specialization || timetable?.data?.scope?.specialization || timetable?.data?.specialization || '',
      ).trim().toLowerCase();

      if (timetableFilters.year && timetableYear !== timetableFilters.year.trim()) return false;
      if (timetableFilters.semester && timetableSemester !== timetableFilters.semester.trim()) return false;
      if (
        timetableFilters.specialization &&
        timetableSpecialization !== timetableFilters.specialization.trim().toLowerCase()
      ) return false;

      return true;
    });
  }, [savedTimetables, timetableFilters]);

  const operationalHealth = useMemo(() => {
    const healthSignals = [
      resources.length > 0,
      modulesCatalog.length > 0,
      batchesCatalog.length > 0,
      conflicts.length < 5,
      savedTimetables.length > 0,
    ].filter(Boolean).length;
    return Math.round((healthSignals / 5) * 100);
  }, [resources.length, modulesCatalog.length, batchesCatalog.length, conflicts.length, savedTimetables.length]);

  const scheduleComplianceScore = 94 + Math.min(6, savedTimetables.length * 2);
  const resourceUtilization = Math.min(100, totalInstructors * 4.2);
  const reviewQueueLoad = Math.min(100, pendingReviewTimetables.length * 20 + conflicts.length * 8);

  const timetableColumns = [
    {
      key: 'name',
      label: 'Timetable',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name || 'Timetable'}</div>
          <div className="text-xs text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleString() : 'Recently generated'}</div>
        </div>
      ),
    },
    {
      key: 'scope',
      label: 'Scope',
      render: (_, row) => {
        const specialization = row.specialization || row?.data?.scope?.specialization || row?.data?.specialization || 'General';
        return (
          <div className="text-sm text-slate-700">
            <div>{String(row.year || row.academicYear || 'N/A')} / Sem {String(row.semester || 'N/A')}</div>
            <div className="text-xs text-slate-500">{specialization}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = normalizeStatus(row.status);
        const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
        const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'amber';
        return <span className={`fc-badge ${tone}`}>{label}</span>;
      },
    },
    {
      key: 'entries',
      label: 'Entries',
      render: (_, row) => <span className="font-semibold text-slate-900">{extractScheduleRows(row).length}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isBusy = actioningTimetableId === String(row.id);
        const status = normalizeStatus(row.status);
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadTimetableCsv(row)}
              className="fc-btn secondary"
              disabled={isBusy}
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => handleApproveTimetable(row)}
              className="fc-btn primary"
              disabled={isBusy || status === 'approved'}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleRejectTimetable(row)}
              className="fc-btn secondary"
              disabled={isBusy || status === 'rejected'}
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  /* ──────────────────────────────────────────────────────────── */
  /* HANDLERS                                                     */
  /* ──────────────────────────────────────────────────────────── */

  const refreshTimetables = async (filters = timetableFilters) => {
    setLoadingTimetables(true);
    try {
      const year = String(filters.year || '').trim();
      const semester = String(filters.semester || '').trim();
      const specialization = String(filters.specialization || '').trim();

      let response;
      if (year && semester) {
        response = await getTimetablesForYearSemester(year, semester, specialization ? { specialization } : {});
      } else {
        response = await api.getAcademicCoordinatorTimetables();
      }

      setSavedTimetables(Array.isArray(response?.data) ? response.data : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      console.error('Failed to refresh timetables:', error);
      window.alert(error.message || 'Failed to refresh timetables');
    } finally {
      setLoadingTimetables(false);
    }
  };

  const refreshConflicts = async () => {
    setLoadingConflicts(true);
    try {
      const response = await getSchedulingConflicts(false);
      setConflicts(Array.isArray(response?.data) ? response.data : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      console.error('Failed to refresh conflicts:', error);
      window.alert(error.message || 'Failed to refresh conflicts');
    } finally {
      setLoadingConflicts(false);
    }
  };

  const refreshWorkspace = async () => {
    try {
      setLoadingResources(true);
      setLoadingTimetables(true);
      setLoadingConflicts(true);

      const [resourceResponse, timetableResponse, conflictResponse, moduleResponse, batchResponse] = await Promise.all([
        api.getLicsWithInstructors().catch(() => ({ items: [] })),
        api.getAcademicCoordinatorTimetables().catch(() => ({ data: [] })),
        getSchedulingConflicts(false).catch(() => ({ data: [] })),
        api.listItems('modules').catch(() => ({ items: [] })),
        api.listItems('batches').catch(() => ({ items: [] })),
      ]);

      setResources(Array.isArray(resourceResponse?.items) ? resourceResponse.items : []);
      setSavedTimetables(Array.isArray(timetableResponse?.data) ? timetableResponse.data : []);
      setConflicts(Array.isArray(conflictResponse?.data) ? conflictResponse.data : []);
      setModulesCatalog(Array.isArray(moduleResponse?.items) ? moduleResponse.items : []);
      setBatchesCatalog(Array.isArray(batchResponse?.items) ? batchResponse.items : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      console.error('Failed to refresh workspace:', error);
      window.alert(error.message || 'Failed to refresh workspace');
    } finally {
      setLoadingResources(false);
      setLoadingTimetables(false);
      setLoadingConflicts(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([refreshTimetables(), refreshConflicts()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleResolveConflict = async (conflictId) => {
    const confirmed = window.confirm('Mark this conflict as resolved?');
    if (!confirmed) return;

    try {
      await resolveSchedulingConflict(conflictId, 'Resolved by coordinator');
      await handleRefreshData();
    } catch (error) {
      window.alert('Failed to resolve conflict: ' + error.message);
    }
  };

  const handleApproveTimetable = async (timetable) => {
    const confirmed = window.confirm(`Approve ${timetable?.name || 'this timetable'}?`);
    if (!confirmed) return;

    try {
      setActioningTimetableId(String(timetable.id));
      await approveTimetable(timetable.id);
      await refreshTimetables();
    } catch (error) {
      window.alert('Failed to approve timetable: ' + error.message);
    } finally {
      setActioningTimetableId('');
    }
  };

  const handleRejectTimetable = async (timetable) => {
    const reason = window.prompt(`Reject ${timetable?.name || 'this timetable'} with a short note:`, '');
    if (reason === null) return;

    try {
      setActioningTimetableId(String(timetable.id));
      await rejectTimetable(timetable.id, reason);
      await refreshTimetables();
    } catch (error) {
      window.alert('Failed to reject timetable: ' + error.message);
    } finally {
      setActioningTimetableId('');
    }
  };

  const resetTimetableFilters = async () => {
    const cleared = { year: '', semester: '', specialization: '' };
    setTimetableFilters(cleared);
    await refreshTimetables(cleared);
  };

  /* ──────────────────────────────────────────────────────────── */
  /* RENDER                                                       */
  /* ──────────────────────────────────────────────────────────── */

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Coordinator Workspace"
      subtitle="Professional timetable management and scheduling coordination"
      badge="FC Dashboard Enhanced"
      sidebarSections={[
        { id: 'overview', label: 'Overview' },
        { id: 'command-center', label: 'Command Center' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'timetables', label: 'Timetables' },
        { id: 'review-queue', label: 'Review Queue' },
        { id: 'conflicts', label: 'Conflicts' },
        { id: 'operations', label: 'Operations' },
      ]}
      headerActions={
        <button
          onClick={() => navigate('/scheduler/by-year')}
          className="fc-btn primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Calendar className="w-4 h-4" />
          Open Scheduler
        </button>
      }
    >
      <div className="fc-dashboard-container py-8">
        {/* ──── Welcome Section ──── */}
        <div id="overview" className="fc-section">
          <div className="fc-dashboard-header">
            <h1>Welcome back, {username}</h1>
            <p>Manage timetables, resolve conflicts, and coordinate faculty scheduling with advanced analytics</p>
          </div>

          {/* Quick Stats */}
          <div className="fc-stats-grid">
            <EnhancedStatCard
              title="Total Modules"
              value={modulesCatalog.length}
              icon={Book}
              color="blue"
              trend={12}
              subtitle="Active modules"
            />
            <EnhancedStatCard
              title="Batches"
              value={batchesCatalog.length}
              icon={Users}
              color="green"
              trend={8}
              subtitle="Student cohorts"
            />
            <EnhancedStatCard
              title="Schedule Compliance"
              value={`${scheduleComplianceScore}%`}
              icon={TrendingUp}
              color="purple"
              trend={3}
              subtitle="Health score"
            />
            <EnhancedStatCard
              title="Review Queue"
              value={pendingReviewTimetables.length}
              icon={Calendar}
              color="amber"
              trend={pendingReviewTimetables.length > 0 ? -12 : 4}
              subtitle="Pending approvals"
            />
            <EnhancedStatCard
              title="Unresolved Conflicts"
              value={conflicts.length}
              icon={AlertCircle}
              color="amber"
              trend={conflicts.length > 0 ? -40 : 0}
              subtitle="Pending resolution"
            />
          </div>
        </div>

        <div id="command-center" className="fc-section">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Coordinator Command Center</h2>
            <button
              onClick={refreshWorkspace}
              className="fc-btn secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Workspace
            </button>
          </div>

          <div className="fc-grid-2">
            <div className="fc-card">
              <div className="fc-card-header">
                <h3>Operational Snapshot</h3>
              </div>
              <div className="fc-card-content">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="fc-text-muted text-xs mb-2">Health Score</p>
                    <p className="font-bold text-slate-900">{operationalHealth}%</p>
                  </div>
                  <div>
                    <p className="fc-text-muted text-xs mb-2">Resource Utilization</p>
                    <p className="font-bold text-slate-900">{Math.round(resourceUtilization)}%</p>
                  </div>
                  <div>
                    <p className="fc-text-muted text-xs mb-2">Review Queue</p>
                    <p className="font-bold text-slate-900">{reviewQueueLoad}%</p>
                  </div>
                  <div>
                    <p className="fc-text-muted text-xs mb-2">Last Sync</p>
                    <p className="font-bold text-slate-900">{lastWorkspaceSync ? lastWorkspaceSync.toLocaleTimeString() : 'Never'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fc-card">
              <div className="fc-card-header">
                <h3>Priority Actions</h3>
              </div>
              <div className="fc-card-content">
                <div className="space-y-3">
                  <button onClick={() => navigate('/faculty/batches')} className="fc-btn outline w-full text-left">Review Batches</button>
                  <button onClick={() => navigate('/faculty/modules')} className="fc-btn outline w-full text-left">Review Modules</button>
                  <button onClick={() => navigate('/scheduler/by-year')} className="fc-btn outline w-full text-left">Generate New Timetable</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──── Analytics Section ──── */}
        <div id="analytics" className="fc-section">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Analytics & Insights</h2>
            <button
              onClick={handleRefreshData}
              className="fc-btn secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="fc-grid-2">
            <TimetableUtilizationChart />
            <SchedulingConflictsChart />
          </div>

          <div className="fc-grid-2" style={{ marginTop: '1.5rem' }}>
            <ModuleDistributionChart />
            <ScheduleComplianceChart />
          </div>
        </div>

        {/* ──── Timetables Section ──── */}
        <div id="timetables" className="fc-section">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Saved Timetables</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/faculty/timetable-report')} className="fc-btn primary">
                View All Reports
              </button>
              <button onClick={refreshTimetables} className="fc-btn secondary">
                Refresh Table
              </button>
            </div>
          </div>

          <div className="mb-5">
            <AdvancedFilterPanel
              filters={timetableFilters}
              onFilterChange={(key, value) => setTimetableFilters((prev) => ({ ...prev, [key]: value }))}
              onApply={refreshTimetables}
              onReset={resetTimetableFilters}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="fc-card p-4">
              <p className="fc-text-muted text-xs mb-2">Loaded Timetables</p>
              <p className="font-bold text-slate-900">{savedTimetables.length}</p>
            </div>
            <div className="fc-card p-4">
              <p className="fc-text-muted text-xs mb-2">Filtered Results</p>
              <p className="font-bold text-slate-900">{filteredTimetables.length}</p>
            </div>
            <div className="fc-card p-4">
              <p className="fc-text-muted text-xs mb-2">Pending Review</p>
              <p className="font-bold text-slate-900">{pendingReviewTimetables.length}</p>
            </div>
            <div className="fc-card p-4">
              <p className="fc-text-muted text-xs mb-2">Conflict Count</p>
              <p className="font-bold text-slate-900">{conflicts.length}</p>
            </div>
          </div>

          {loadingTimetables ? (
            <div className="fc-card">
              <div className="fc-card-content">
                <p className="fc-text-muted">Loading timetables...</p>
              </div>
            </div>
          ) : filteredTimetables.length === 0 ? (
            <div className="fc-empty-state">
              <div className="fc-empty-state-icon">📅</div>
              <div className="fc-empty-state-title">No Timetables Found</div>
              <div className="fc-empty-state-description">
                Generate your first timetable or adjust the filters to inspect a specific review set
              </div>
              <button
                onClick={() => navigate('/scheduler/by-year')}
                className="fc-btn primary"
                style={{ marginTop: '1rem' }}
              >
                Launch Scheduler
              </button>
            </div>
          ) : (
            <EnhancedTable
              columns={timetableColumns}
              data={filteredTimetables}
              emptyMessage="No timetables match the active filter set"
            />
          )}
        </div>

        <div id="review-queue" className="fc-section">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Review Queue</h2>
            <button onClick={refreshTimetables} className="fc-btn secondary">
              Sync Queue
            </button>
          </div>

          {pendingReviewTimetables.length === 0 ? (
            <div className="fc-empty-state">
              <div className="fc-empty-state-icon">✅</div>
              <div className="fc-empty-state-title">No Pending Reviews</div>
              <div className="fc-empty-state-description">All timetables in the queue are already reviewed or have been filtered out.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewTimetables.slice(0, 5).map((timetable) => (
                <div key={timetable.id} className="fc-card">
                  <div className="fc-card-content">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{timetable.name || 'Pending timetable'}</h4>
                        <p className="text-sm text-slate-600">
                          {String(timetable.year || timetable.academicYear || 'N/A')} · Semester {String(timetable.semester || 'N/A')} · {timetable.specialization || timetable?.data?.scope?.specialization || 'General'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => downloadTimetableCsv(timetable)} className="fc-btn outline">
                          Export CSV
                        </button>
                        <button onClick={() => handleApproveTimetable(timetable)} className="fc-btn primary" disabled={actioningTimetableId === String(timetable.id)}>
                          Approve
                        </button>
                        <button onClick={() => handleRejectTimetable(timetable)} className="fc-btn secondary" disabled={actioningTimetableId === String(timetable.id)}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──── Conflicts Section ──── */}
        <div id="conflicts" className="fc-section">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Scheduling Conflicts</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {conflicts.length > 0 && (
                <span className="fc-badge danger">{conflicts.length} Unresolved</span>
              )}
              <button
                onClick={refreshConflicts}
                className="fc-btn secondary"
                disabled={loadingConflicts}
              >
                {loadingConflicts ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loadingConflicts ? (
            <div className="fc-card">
              <div className="fc-card-content">
                <p className="fc-text-muted">Loading conflicts...</p>
              </div>
            </div>
          ) : conflicts.length === 0 ? (
            <div className="fc-empty-state">
              <div className="fc-empty-state-icon">✅</div>
              <div className="fc-empty-state-title">No Conflicts</div>
              <div className="fc-empty-state-description">
                All scheduling conflicts have been resolved
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="fc-card">
                  <div className="fc-card-content">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">
                          {conflict.conflict_type || 'Scheduling Conflict'}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {conflict.description || conflict.message || 'No details provided'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleResolveConflict(conflict.id)}
                        className="fc-btn secondary whitespace-nowrap"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──── Operations Section ──── */}
        <div id="operations" className="fc-section pb-12">
          <div className="fc-section-header">
            <h2 className="fc-section-title">Quick Operations</h2>
          </div>

          <div className="fc-grid-3">
            <div className="fc-card">
              <div className="fc-card-header">
                <h3>Batch Management</h3>
              </div>
              <div className="fc-card-content">
                <p className="text-sm text-slate-600 mb-4">
                  Manage student cohorts, capacities, and specializations
                </p>
              </div>
              <div className="fc-card-footer">
                <button
                  onClick={() => navigate('/faculty/batches')}
                  className="fc-btn primary w-full text-center"
                >
                  Open Batches
                </button>
              </div>
            </div>

            <div className="fc-card">
              <div className="fc-card-header">
                <h3>Module Management</h3>
              </div>
              <div className="fc-card-content">
                <p className="text-sm text-slate-600 mb-4">
                  Review and manage department modules and credits
                </p>
              </div>
              <div className="fc-card-footer">
                <button
                  onClick={() => navigate('/faculty/modules')}
                  className="fc-btn primary w-full text-center"
                >
                  Open Modules
                </button>
              </div>
            </div>

            <div className="fc-card">
              <div className="fc-card-header">
                <h3>Timetable Scheduler</h3>
              </div>
              <div className="fc-card-content">
                <p className="text-sm text-slate-600 mb-4">
                  Launch advanced scheduling engine with optimization
                </p>
              </div>
              <div className="fc-card-footer">
                <button
                  onClick={() => navigate('/scheduler/by-year')}
                  className="fc-btn primary w-full text-center"
                >
                  Launch Scheduler
                </button>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="fc-card" style={{ marginTop: '2rem' }}>
            <div className="fc-card-header">
              <h3>System Status</h3>
            </div>
            <div className="fc-card-content">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="fc-text-muted text-xs mb-2">Last Sync</p>
                  <p className="font-bold text-slate-900">
                    {lastWorkspaceSync
                      ? lastWorkspaceSync.toLocaleTimeString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="fc-text-muted text-xs mb-2">LIC Resources</p>
                  <p className="font-bold text-slate-900">{resources.length}</p>
                </div>
                <div>
                  <p className="fc-text-muted text-xs mb-2">Health Score</p>
                  <p className="font-bold text-green-600">{operationalHealth}%</p>
                </div>
                <div>
                  <p className="fc-text-muted text-xs mb-2">Compliance</p>
                  <p className="font-bold text-blue-600">{scheduleComplianceScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorDashboardEnhanced;
