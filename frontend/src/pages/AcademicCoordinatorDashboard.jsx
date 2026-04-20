import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import api from '../api/scheduler';
import HallAllocation from '../components/HallAllocation.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Icons ────────────────────────────────────────────────────────── */
const IconBook = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconUsers = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconActivity = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconChevronRight = ({ className = '' }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>;

/* ── Helper Components ────────────────────────────────────────────── */
const StatCard = ({ title, value, icon, color = '#38bdf8' }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
    border: `1px solid rgba(148,163,184,0.15)`,
    borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
    boxShadow: `0 8px 30px rgba(0,0,0,0.3)`, backdropFilter: 'blur(10px)',
    position: 'relative', overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30` }}>
        {icon}
      </div>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
      <h3 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 900, color: '#f8fafc' }}>{value}</h3>
    </div>
  </div>
);

const ActionTile = ({ to, title, desc, icon, color }) => (
  <Link to={to} className="ac-action-tile" style={{ textDecoration: 'none' }}>
    <div style={{
      background: 'linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,8,23,0.85))',
      border: '1px solid rgba(148,163,184,0.12)', borderRadius: 20, padding: 28,
      position: 'relative', overflow: 'hidden', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="ac-glow-bg" style={{ position: 'absolute', inset: 0, opacity: 0, background: `radial-gradient(120% 120% at 50% -20%, ${color}12 0%, transparent 70%)`, transition: 'opacity 0.3s' }} />
      <div style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(148,163,184,0.3)', transition: 'all 0.3s' }} className="ac-arrow">
        <IconChevronRight className="w-5 h-5" />
      </div>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30`, marginBottom: 20 }}>
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{title}</h3>
      <p style={{ margin: '10px 0 0', fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.5, flex: 1 }}>{desc}</p>
    </div>
  </Link>
);

/* ── Page Component ───────────────────────────────────────────────── */
export default function AcademicCoordinatorDashboard({ user }) {
  const [stats, setStats] = useState({ modules: 0, lecturers: 0, assignments: 0 });
  
  useEffect(() => {
    // Attempt to load basic stats just for flavor
    const loadStats = async () => {
      try {
        const [modRes, lecRes, asgRes] = await Promise.all([
          api.listItems('modules'),
          api.listItems('instructors'),
          api.listAssignments()
        ]);
        setStats({
          modules: Array.isArray(modRes?.items) ? modRes.items.length : 0,
          lecturers: Array.isArray(lecRes?.items) ? lecRes.items.length : 0,
          assignments: Array.isArray(asgRes?.assignments) ? asgRes.assignments.length : 0,
        });
      } catch (err) {
        console.warn('Could not load dashboard stats', err);
      }
    };
    loadStats();
  }, []);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Academic Coordinator Dashboard"
      subtitle="Mission Control for managing modules, personnel, and academic assignments"
      badge="Academic Workspace"
      brandCode="AC"
      brandTitle="Academic Coordinator"
      brandSubtitle="Operations Console"
      themeVariant="academic"
    >
      <style>{`
        .ac-action-tile { display: block; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .ac-action-tile:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .ac-action-tile:hover .ac-glow-bg { opacity: 1 !important; }
        .ac-action-tile:hover .ac-arrow { color: #f1f5f9 !important; transform: translateX(4px); }
        .ac-greeting { animation: acFadeIn 0.8s ease-out; }
        @keyframes acFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Banner Section */}
        <div className="ac-greeting" style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(167,139,250,0.1))',
          border: '1px solid rgba(148,163,184,0.15)',
          borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#f8fafc' }}>
            Welcome back, {user?.name || user?.username || 'Coordinator'}!
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(148,163,184,0.9)', maxWidth: 600, lineHeight: 1.6 }}>
            You are now in the updated Academic Operations Console. From here, you can manage the module registry, maintain the lecturer roster, and securely map module assignments.
          </p>
        </div>

        {/* Stats Row */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <StatCard title="Total Modules" value={stats.modules} icon={<IconBook />} color="#38bdf8" />
            <StatCard title="Roster Size" value={stats.lecturers} icon={<IconUsers />} color="#a78bfa" />
            <StatCard title="Active Assignments" value={stats.assignments} icon={<IconActivity />} color="#f59e0b" />
          </div>
        </div>

        {/* Workspaces */}
        <div>
          <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.6)' }}>Operations Matrix</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            <ActionTile 
              to="/academic/assignments" 
              title="Module Assignments" 
              desc="Map modules to Lecturers and LICs. Ensure all teaching loads align perfectly with the semester plan." 
              icon={<IconActivity />} 
              color="#f59e0b" 
            />
            <ActionTile 
              to="/academic/modules" 
              title="Module Registry" 
              desc="Create, edit, and maintain the database of degree modules across various specializations and years." 
              icon={<IconBook />} 
              color="#38bdf8" 
            />
            <ActionTile 
              to="/academic/personnel" 
              title="Personnel Roster" 
              desc="Onboard and manage teaching staff including Lecturers and Lead Instructors (LICs)." 
              icon={<IconUsers />} 
              color="#a78bfa" 
            />
            <ActionTile 
              to="/academic/calendar" 
              title="Academic Calendar" 
              desc="Plan semseter key dates, exam weeks, holidays, and schedule adjustments." 
              icon={<IconCalendar />} 
              color="#f472b6" 
            />
            <ActionTile 
              to="/academic/hall-allocations" 
              title="Hall Allocations" 
              desc="Review SLIIT campus hall allocations that feed the scheduler engine." 
              icon={<IconCalendar />} 
              color="#0f766e" 
            />
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(148,163,184,0.6)' }}>
            Hall Allocations
          </h3>
          <div style={{
            border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 24,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
            padding: 16,
          }}>
            <HallAllocation apiBase={API_BASE} />
          </div>
        </div>

      </div>
    </FacultyCoordinatorShell>
  );
}