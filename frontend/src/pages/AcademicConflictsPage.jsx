import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, AlertTriangle, Clock, ServerCrash, ShieldCheck, X } from 'lucide-react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import { format, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AcademicConflictsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filter, setFilter] = useState('active'); // 'active' or 'resolved'

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/academic-coordinator/conflicts`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      setConflicts(json.data || []);
    } catch (err) {
      console.warn('Could not load conflicts', err);
      toast.error('Failed to load scheduling conflicts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleResolveSubmit = async (id) => {
    if (!resolutionNotes.trim()) {
      return toast.warn('You must provide notes explaining how this conflict was mathematically bypassed.');
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/academic-coordinator/conflicts/${id}/resolve`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });
      
      const json = await res.json();
      
      if (json.success || res.ok) {
        toast.success('Conflict flagged as manually resolved.');
        setResolvingId(null);
        setResolutionNotes('');
        fetchConflicts();
      } else {
        throw new Error(json.error || 'Failed to update conflict state.');
      }
    } catch (err) {
      toast.error(err.message || 'Network anomaly during resolution.');
    }
  };

  const activeConflicts = conflicts.filter(c => !c.resolved);
  const resolvedConflicts = conflicts.filter(c => c.resolved);
  const displayedData = filter === 'active' ? activeConflicts : resolvedConflicts;

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Conflict Resolution Center"
      subtitle="Investigate and mathematically resolve un-bookable bottlenecks flagged by the Timetable Generator"
      badge="Generator Triage"
      themeVariant="academic"
    >
      <style>{`
        .conflict-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .conflict-card-active:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); }
        .tab-btn { transition: all 0.2s; }
        .tab-btn.active { color: #f8fafc; border-bottom: 2px solid #3b82f6; }
        .tab-btn.inactive { color: rgba(148,163,184,0.6); border-bottom: 2px solid transparent; }
        .tab-btn.inactive:hover { color: rgba(148,163,184,0.9); border-bottom: 2px solid rgba(148,163,184,0.3); }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 24, paddingBottom: 8, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <button 
            className={`tab-btn ${filter === 'active' ? 'active' : 'inactive'}`}
            onClick={() => setFilter('active')}
            style={{ padding: '0 4px 12px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ServerCrash className="h-4 w-4" style={{ color: filter==='active' ? '#ef4444' : 'inherit' }}/>
            Active Halts
            <span style={{ padding: '2px 8px', borderRadius: 40, background: filter==='active' ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.1)', color: filter==='active' ? '#ef4444' : 'inherit', fontSize: 11 }}>{activeConflicts.length}</span>
          </button>
          <button 
            className={`tab-btn ${filter === 'resolved' ? 'active' : 'inactive'}`}
            onClick={() => setFilter('resolved')}
            style={{ padding: '0 4px 12px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShieldCheck className="h-4 w-4" style={{ color: filter==='resolved' ? '#10b981' : 'inherit' }}/>
            Bypassed / Resolved
            <span style={{ padding: '2px 8px', borderRadius: 40, background: filter==='resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.1)', color: filter==='resolved' ? '#10b981' : 'inherit', fontSize: 11 }}>{resolvedConflicts.length}</span>
          </button>
        </div>

        {/* Board View */}
        <div style={{ display: 'grid', gap: 16 }}>
          {loading ? (
             <div style={{ padding: 60, textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 20 }}>
               <p style={{ color: 'rgba(148,163,184,0.6)', margin: 0 }}>Scanning generator memory...</p>
             </div>
          ) : displayedData.length > 0 ? (
            displayedData.map(c => {
               const dateStr = c.created_at ? format(parseISO(c.created_at), 'MMM dd, yyyy HH:mm') : 'Unknown Date';
               const isResolving = resolvingId === c.id;

               return (
                  <div key={c.id} className={`conflict-card ${!c.resolved ? 'conflict-card-active' : ''}`} style={{
                    background: c.resolved ? 'rgba(15,23,42,0.4)' : 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(7,20,43,0.98))',
                    border: '1px solid',
                    borderColor: c.resolved ? 'rgba(148,163,184,0.1)' : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', position: 'relative'
                  }}>
                    {/* Status accent glow */}
                    {!c.resolved && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(to bottom, #ef4444, #f43f5e)' }} />
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: c.resolved ? '#94a3b8' : '#f8fafc' }}>
                             {c.conflict_type || 'Structural Constraint Collision'}
                           </h4>
                           <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: c.resolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: c.resolved ? '#10b981' : '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             {c.resolved ? 'Resolved' : 'Active Halt'}
                           </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: c.resolved ? 'rgba(148,163,184,0.5)' : '#cbd5e1', lineHeight: 1.6 }}>
                          {c.description || c.details || 'The generator encountered mathematical constraints that cannot be successfully mapped to the registry limits. Manual intervention required.'}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(148,163,184,0.5)', fontSize: 11, fontWeight: 600 }}>
                        <Clock className="h-3 w-3" />
                        {dateStr}
                      </div>
                    </div>

                    {/* Resolution Section */}
                    {c.resolved ? (
                      <div style={{ marginTop: 8, padding: 16, background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px dashed rgba(16,185,129,0.2)' }}>
                        <h5 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resolution Axiom</h5>
                        <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', fontStyle: 'italic' }}>{c.resolution_notes || 'No notes provided.'}</p>
                      </div>
                    ) : (
                      <>
                        {!isResolving ? (
                           <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                             <button
                               onClick={() => { setResolvingId(c.id); setResolutionNotes(''); }}
                               style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
                             >
                               <AlertTriangle className="h-4 w-4"/> Initiate Override
                             </button>
                           </div>
                        ) : (
                           <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.3s ease' }}>
                             <textarea 
                               autoFocus
                               placeholder="Log formal reasoning for bypassing generator logic. What external action was taken? (e.g. 'Hall overbooked, shifted to weekend schedule')."
                               value={resolutionNotes}
                               onChange={(e) => setResolutionNotes(e.target.value)}
                               style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.4)', color: '#f8fafc', fontSize: 13, minHeight: 80, resize: 'vertical', outline: 'none', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}
                             />
                             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button
                                  onClick={() => setResolvingId(null)}
                                  style={{ padding: '10px 16px', borderRadius: 12, background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <X className="h-3 w-3" /> Abort
                                </button>
                                <button
                                  onClick={() => handleResolveSubmit(c.id)}
                                  disabled={!resolutionNotes.trim()}
                                  style={{ padding: '10px 24px', borderRadius: 12, background: resolutionNotes.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(148,163,184,0.1)', color: resolutionNotes.trim() ? '#fff' : 'rgba(148,163,184,0.4)', border: 'none', fontSize: 13, fontWeight: 800, cursor: resolutionNotes.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                                >
                                  <CheckCircle className="h-4 w-4" /> Finalize Resolution
                                </button>
                             </div>
                           </div>
                        )}
                      </>
                    )}
                  </div>
               );
            })
          ) : (
            <div style={{ padding: 80, textAlign: 'center', background: 'linear-gradient(to bottom, rgba(16,185,129,0.05), transparent)', borderRadius: 20, borderTop: '2px dashed rgba(16,185,129,0.2)' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle className="h-8 w-8" style={{ color: '#10b981' }} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                {filter === 'active' ? 'Generator Stability Optimal' : 'No Cached History'}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>
                {filter === 'active' ? 'Zero mathematical conflicts flagged across constraint matrix.' : 'No overrides have been executed in this context.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </FacultyCoordinatorShell>
  );
}
