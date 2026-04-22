import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/facultyCoordinator.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import '../styles/enhanced-faculty-theme.css';
import { EnhancedStatCard, EnhancedTable } from '../components/EnhancedFacultyComponents.jsx';
import { Search, Users } from 'lucide-react';

const FacultyBatchesPageEnhanced = ({ user }) => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await api.getBatches?.() || { items: [] };
      setBatches(Array.isArray(response.items) ? response.items : []);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const searchStr = filterText.toLowerCase();
    return (
      (b.id || '').toLowerCase().includes(searchStr) ||
      (b.name || '').toLowerCase().includes(searchStr) ||
      (b.specialization || '').toLowerCase().includes(searchStr)
    );
  });

  const tableColumns = [
    {
      key: 'id',
      label: 'Batch ID',
      render: (id) => <span className="font-semibold font-mono text-sm">{id}</span>,
    },
    { key: 'name', label: 'Batch Name' },
    {
      key: 'year',
      label: 'Year',
      render: (year) => <span className="fc-badge primary">{year}</span>,
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (spec) => <span className="fc-badge secondary">{spec || 'General'}</span>,
    },
    {
      key: 'size',
      label: 'Students',
      render: (size) => <span className="font-semibold text-center">{size || 0}</span>,
    },
  ];

  const totalStudents = batches.reduce((sum, b) => sum + (Number(b.size) || 0), 0);
  const totalYears = new Set(batches.map((b) => b.year)).size;
  const totalSpecializations = new Set(batches.map((b) => b.specialization)).size;

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Batch Management"
      subtitle="Manage student cohorts, allocations, and specializations"
      badge="Batches"
      sidebarSections={[
        { id: 'overview', label: 'Overview' },
        { id: 'batches-list', label: 'Batch List' },
      ]}
      headerActions={
        <button onClick={loadBatches} className="fc-btn primary">
          Refresh Batches
        </button>
      }
    >
      <div className="fc-dashboard-container py-8">
        {/* Stats Section */}
        <div id="overview" className="fc-section mb-8">
          <div className="fc-dashboard-header mb-8">
            <h1>Batch Management</h1>
            <p>Coordinate student cohorts, specializations, and class allocations</p>
          </div>

          <div className="fc-stats-grid mb-8">
            <EnhancedStatCard
              title="Total Batches"
              value={batches.length}
              icon={Users}
              color="blue"
              trend={5}
              subtitle="Active batches"
            />
            <EnhancedStatCard
              title="Total Students"
              value={totalStudents}
              icon={Users}
              color="green"
              trend={12}
              subtitle="Enrolled"
            />
            <EnhancedStatCard
              title="Academic Years"
              value={totalYears}
              icon={Users}
              color="purple"
              subtitle="Years covered"
            />
            <EnhancedStatCard
              title="Specializations"
              value={totalSpecializations}
              icon={Users}
              color="amber"
              subtitle="Tracks"
            />
          </div>
        </div>

        {/* Batches List */}
        <div id="batches-list" className="fc-section">
          <div className="fc-section-header mb-6">
            <h2 className="fc-section-title">Batch Directory</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  className="fc-filter-input pl-10"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="fc-card">
            <div className="fc-card-content">
              <EnhancedTable
                columns={tableColumns}
                data={filteredBatches}
                loading={loading}
                emptyMessage="No batches found. Add batches to get started."
                onRowClick={(batch) => console.log('Batch selected:', batch)}
              />
            </div>
          </div>

          {/* Batch Summary */}
          <div className="fc-card" style={{ marginTop: '2rem' }}>
            <div className="fc-card-header">
              <h3>Batch Summary Statistics</h3>
            </div>
            <div className="fc-card-content">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="fc-text-muted text-sm mb-2">Average Batch Size</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {batches.length > 0
                      ? Math.round(totalStudents / batches.length)
                      : 0}
                  </p>
                </div>
                <div>
                  <p className="fc-text-muted text-sm mb-2">Total Capacity</p>
                  <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
                </div>
                <div>
                  <p className="fc-text-muted text-sm mb-2">Year Distribution</p>
                  <p className="text-2xl font-bold text-slate-900">{totalYears}</p>
                </div>
                <div>
                  <p className="fc-text-muted text-sm mb-2">Tracks Offered</p>
                  <p className="text-2xl font-bold text-slate-900">{totalSpecializations}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyBatchesPageEnhanced;
