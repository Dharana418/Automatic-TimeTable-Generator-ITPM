

import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import api from '../api/scheduler.js';
import BatchList from '../components/BatchList.jsx';

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
          <p className="hero-sub">Manage campus resources and instructors added by Academic Coordinators.</p>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="left-col">
          <div className="action-card">
            <div>
              <h3>Timetable Management</h3>
              <p>Create and manage timetables for your faculty</p>
            </div>
            <button className="action-btn">Manage</button>
          </div>
          <div className="action-card">
            <div>
              <h3>Resource Allocation</h3>
              <p>Allocate rooms, instructors, and resources</p>
            </div>
            <button className="action-btn">Allocate</button>
          </div>

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
        </aside>
      </div>
    </div>
  );
};

export default FacultyCoordinatorDashboard;
