import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/facultyCoordinator.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import '../styles/enhanced-faculty-theme.css';
import { EnhancedStatCard, EnhancedTable, AdvancedFilterPanel } from '../components/EnhancedFacultyComponents.jsx';
import { Search, Plus, Edit, Trash2, Book } from 'lucide-react';

const FacultyModulesPageEnhanced = ({ user }) => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await api.getModules?.() || { items: [] };
      setModules(Array.isArray(response.items) ? response.items : []);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(
    (m) =>
      (m.code || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (m.name || '').toLowerCase().includes(filterText.toLowerCase())
  );

  const tableColumns = [
    {
      key: 'code',
      label: 'Code',
      render: (code) => <span className="font-semibold">{code}</span>,
    },
    { key: 'name', label: 'Module Name' },
    {
      key: 'credits',
      label: 'Credits',
      render: (credits) => <span className="fc-badge primary">{credits}</span>,
    },
    {
      key: 'year',
      label: 'Year',
      render: (year) => <span className="text-center font-bold">{year}</span>,
    },
    {
      key: 'semester',
      label: 'Semester',
      render: (sem) => <span className="text-center">{sem}</span>,
    },
  ];

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Faculty Module Management"
      subtitle="Manage departmental modules, credits, and academic offerings"
      badge="Modules"
      sidebarSections={[
        { id: 'overview', label: 'Overview' },
        { id: 'modules-list', label: 'Module List' },
      ]}
      headerActions={
        <button onClick={loadModules} className="fc-btn primary">
          Refresh Modules
        </button>
      }
    >
      <div className="fc-dashboard-container py-8">
        {/* Stats Section */}
        <div id="overview" className="fc-section mb-8">
          <div className="fc-dashboard-header mb-8">
            <h1>Module Management</h1>
            <p>View and manage all academic modules offered by your faculty</p>
          </div>

          <div className="fc-stats-grid mb-8">
            <EnhancedStatCard
              title="Total Modules"
              value={modules.length}
              icon={Book}
              color="blue"
            />
            <EnhancedStatCard
              title="Active This Semester"
              value={modules.filter((m) => m.semester).length}
              icon={Book}
              color="green"
            />
            <EnhancedStatCard
              title="Total Credits"
              value={modules.reduce((sum, m) => sum + (Number(m.credits) || 0), 0)}
              icon={Book}
              color="purple"
            />
          </div>
        </div>

        {/* Modules List */}
        <div id="modules-list" className="fc-section">
          <div className="fc-section-header mb-6">
            <h2 className="fc-section-title">Module Directory</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  className="fc-filter-input pl-10"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <button onClick={() => navigate('/faculty/modules/add')} className="fc-btn primary">
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>
          </div>

          <div className="fc-card">
            <div className="fc-card-content">
              <EnhancedTable
                columns={tableColumns}
                data={filteredModules}
                loading={loading}
                emptyMessage="No modules found. Start by adding a new module."
              />
            </div>
          </div>
        </div>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyModulesPageEnhanced;
