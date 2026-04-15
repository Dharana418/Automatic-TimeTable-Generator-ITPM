import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/scheduler.js';
import { getSchedulingConflicts, resolveSchedulingConflict } from '../api/timetableGeneration.js';
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

  const operationalHealth = useMemo(() => {
    const healthSignals = [
      resources.length > 0,
      modulesCatalog.length > 0,
      batchesCatalog.length > 0,
      conflicts.length < 5,
      savedTimetables.length > 0,
    ].filter(Boolean).length;
    return Math.round((healthySignals / 5) * 100);
  }, [resources.length, modulesCatalog.length, batchesCatalog.length, conflicts.length, savedTimetables.length]);

  const scheduleComplianceScore = 94 + Math.min(6, savedTimetables.length * 2);
  const resourceUtilization = Math.min(100, totalInstructors * 4.2);

  /* ──────────────────────────────────────────────────────────── */
  /* HANDLERS                                                     */
  /* ──────────────────────────────────────────────────────────── */

  const handleRefreshData = async () => {
    try {
      setLoadingTimetables(true);
      setLoadingConflicts(true);

      const [timetableResponse, conflictResponse] = await Promise.all([
        api.getAcademicCoordinatorTimetables().catch(() => ({ data: [] })),
        getSchedulingConflicts(false).catch(() => ({ data: [] })),
      ]);

      setSavedTimetables(Array.isArray(timetableResponse?.data) ? timetableResponse.data : []);
      setConflicts(Array.isArray(conflictResponse?.data) ? conflictResponse.data : []);
      setLastWorkspaceSync(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoadingTimetables(false);
      setLoadingConflicts(false);
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

  const downloadTimetableAsCSV = (timetable) => {
    const schedule = Array.isArray(timetable?.data) ? timetable.data : [];
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
        { id: 'analytics', label: 'Analytics' },
        { id: 'timetables', label: 'Timetables' },
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
              title="Unresolved Conflicts"
              value={conflicts.length}
              icon={AlertCircle}
              color="amber"
              trend={conflicts.length > 0 ? -40 : 0}
              subtitle="Pending resolution"
            />
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
            <button onClick={() => navigate('/faculty/timetable-report')} className="fc-btn primary">
              View All Reports
            </button>
          </div>

          {loadingTimetables ? (
            <div className="fc-card">
              <div className="fc-card-content">
                <p className="fc-text-muted">Loading timetables...</p>
              </div>
            </div>
          ) : savedTimetables.length === 0 ? (
            <div className="fc-empty-state">
              <div className="fc-empty-state-icon">📅</div>
              <div className="fc-empty-state-title">No Timetables Found</div>
              <div className="fc-empty-state-description">
                Generate your first timetable using the scheduler
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
            <div className="fc-grid-2">
              {savedTimetables.slice(0, 6).map((timetable) => (
                <div key={timetable.id} className="fc-card">
                  <div className="fc-card-header">
                    <h3>{timetable.name || 'Timetable'}</h3>
                  </div>
                  <div className="fc-card-content">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="fc-text-muted">Year:</span>
                        <span className="font-semibold">{timetable.year || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="fc-text-muted">Semester:</span>
                        <span className="font-semibold">{timetable.semester || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="fc-text-muted">Status:</span>
                        <span className="fc-badge success">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="fc-card-footer">
                    <button
                      onClick={() => downloadTimetableAsCSV(timetable)}
                      className="fc-btn outline w-full text-center"
                    >
                      Download CSV
                    </button>
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
                onClick={handleRefreshData}
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
