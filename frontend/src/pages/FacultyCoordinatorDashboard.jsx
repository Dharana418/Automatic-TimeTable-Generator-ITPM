

import React, { useEffect, useState } from 'react';
import api from '../api/scheduler.js';
import BatchList from '../components/BatchList.jsx';

const Stat = ({ label, value, hint }) => (
  <div className="stat">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {hint && <div className="stat-hint">{hint}</div>}
  </div>
);

const ActionCard = ({ title, desc, action }) => (
  <div className="action-card">
    <div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
    <button className="action-btn">{action}</button>
  </div>
);

const FacultyCoordinatorDashboard = ({ user }) => {
  const username = user?.username || 'Coordinator';
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingResources(true);
        const res = await api.getLicsWithInstructors();
        if (mounted && res && res.items) setResources(res.items);
      } catch (e) {
        console.error('Failed to load resources', e);
      } finally {
        setLoadingResources(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-left">
          <h1>Welcome back, {username}</h1>
          <p className="hero-sub">Design timetables naturally — fast, clear, and conflict-free.</p>
          <div className="stat-row">
            <Stat label="LICs" value={resources.length} hint="resource groups" />
            <Stat
              label="Instructors"
              value={resources.reduce((sum, lic) => sum + ((lic.instructors || []).length), 0)}
              hint="available"
            />
            <Stat label="Pending Requests" value={3} hint="for approval" />
          </div>
        </div>
        <div className="hero-right">
          <div className="avatar">{(username || 'U').slice(0,1)}</div>
          <div className="quick-actions">
            <button className="primary">Generate Timetable</button>
            <button className="ghost">Quick Allocate</button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="left-col">
          <ActionCard title="Timetable Management" desc="Create and manage timetables for your faculty" action="Manage" />
          <ActionCard title="Resource Allocation" desc="Allocate rooms, instructors, and resources" action="Allocate" />
          <ActionCard title="Reports & Analytics" desc="View timetable analytics and insights" action="Reports" />
          <BatchList />
        </div>

        <aside className="right-col">
          <div className="panel">
            <h4>Campus Resources</h4>
            {loadingResources ? (
              <div>Loading...</div>
            ) : (
              <div>
                {resources.length === 0 && <div className="muted">No resources found.</div>}
                {resources.map((lic) => (
                  <div key={lic.id} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <strong>{lic.name || lic.id}</strong>
                      <span className="stat-hint">{lic.department || ''}</span>
                    </div>
                    <div style={{marginTop:6, display:'flex',gap:8,flexWrap:'wrap'}}>
                      {(lic.instructors || []).length === 0 && <span className="chip">No instructors</span>}
                      {(lic.instructors || []).slice(0,6).map((ins) => (
                        <button key={ins.id} className="chip">{ins.name || ins.email || ins.id}</button>
                      ))}
                      {(lic.instructors || []).length > 6 && <span className="stat-hint">+{(lic.instructors||[]).length - 6} more</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h4>Shortcuts</h4>
            <div className="shortcuts">
              <button className="chip">Add Module</button>
              <button className="chip">Add Hall</button>
              <button className="chip">Import CSV</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
