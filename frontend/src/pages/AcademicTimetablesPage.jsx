import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toScope = (row) => {
  const data = row?.data && typeof row.data === 'object' ? row.data : {};
  const scope = data?.scope && typeof data.scope === 'object' ? data.scope : {};
  return {
    year: scope.year || data.year || row.year || '-',
    semester: scope.semester || data.semester || row.semester || '-',
    specialization: scope.specialization || data.specialization || '-',
    group: scope.group || data.group || '-',
    subgroup: scope.subgroup || data.subgroup || '-',
  };
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
};

const sectionPanelStyle = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.9), rgba(15,23,42,0.82), rgba(7,89,133,0.35))',
  padding: 24,
  borderRadius: 20,
  border: '1px solid rgba(34,211,238,0.2)',
  boxShadow: '0 10px 30px rgba(2,6,23,0.28)',
  backdropFilter: 'blur(16px)',
};

const statTileStyle = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.55)',
};

const timetableCardStyle = {
  borderRadius: 18,
  border: '1px solid rgba(56,189,248,0.22)',
  background: 'linear-gradient(145deg, rgba(2,6,23,0.86), rgba(15,23,42,0.84), rgba(8,47,73,0.4))',
  boxShadow: '0 10px 30px rgba(2,6,23,0.32)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const AcademicTimetablesPage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [activeEditId, setActiveEditId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  const loadTimetables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/academic-coordinator/timetables`, {
        credentials: 'include',
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || 'Failed to fetch timetables.');
      }
      const rows = Array.isArray(json?.data) ? json.data : [];
      setTimetables(rows);
    } catch (error) {
      toast.error(error.message || 'Failed to load timetables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, []);

  const counts = useMemo(() => {
    const summary = { total: timetables.length, approved: 0, rejected: 0, pending: 0 };
    timetables.forEach((row) => {
      const status = String(row?.status || '').toLowerCase();
      if (status === 'approved') summary.approved += 1;
      else if (status === 'rejected') summary.rejected += 1;
      else summary.pending += 1;
    });
    return summary;
  }, [timetables]);

  const updateTimetableStatus = async (id, action) => {
    try {
      setSavingId(id);
      const isReject = action === 'reject';
      const response = await fetch(`${API_BASE}/api/academic-coordinator/timetables/${id}/${action}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isReject ? { comments: rejectComment.trim() || undefined } : {}),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || `Failed to ${action} timetable.`);
      }

      toast.success(`Timetable ${action}ed successfully.`);
      setActiveEditId(null);
      setRejectComment('');
      await loadTimetables();
    } catch (error) {
      toast.error(error.message || 'Update failed.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Time Tables"
      subtitle="Review and manage the academic timetable overview from one place."
      badge="Scheduling View"
      themeVariant="academic"
      contentSectionWidthClass="max-w-none"
      contentSectionClassName="lg:w-[calc(100%+21.5rem)] lg:ml-[-21.5rem]"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section style={sectionPanelStyle}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#f8fafc' }}>Time Tables</h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(148,163,184,0.8)', maxWidth: 720, lineHeight: 1.7 }}>
            Generated timetables are listed below in card view. Use Edit on each card to approve or reject quickly.
          </p>
        </section>

        <section style={{ ...sectionPanelStyle, color: '#e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          <div style={statTileStyle}>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{counts.total}</div>
          </div>
          <div style={{ ...statTileStyle, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(167,243,208,0.95)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approved</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{counts.approved}</div>
          </div>
          <div style={{ ...statTileStyle, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(254,202,202,0.95)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rejected</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{counts.rejected}</div>
          </div>
          <div style={{ ...statTileStyle, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(191,219,254,0.95)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{counts.pending}</div>
          </div>
        </section>

        <section style={sectionPanelStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loading && (
            <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: 14, gridColumn: '1 / -1' }}>Loading generated timetables...</div>
          )}

          {!loading && timetables.length === 0 && (
            <div style={{
              padding: 20,
              borderRadius: 16,
              border: '1px dashed rgba(148,163,184,0.35)',
              background: 'rgba(15,23,42,0.55)',
              color: 'rgba(148,163,184,0.92)',
              gridColumn: '1 / -1'
            }}>
              No generated timetables found.
            </div>
          )}

          {!loading && timetables.map((row) => {
            const scope = toScope(row);
            const isOpen = activeEditId === row.id;
            return (
              <article
                key={row.id}
                style={timetableCardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.name || `Timetable ${row.id}`}
                    </div>
                    <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.85)', fontSize: 12 }}>
                      Created: {formatDate(row.created_at)}
                    </div>
                  </div>
                  <span style={{
                    alignSelf: 'flex-start',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#e2e8f0',
                    border: '1px solid rgba(148,163,184,0.28)',
                    background: 'rgba(30,41,59,0.6)'
                  }}>
                    {row.status || 'pending'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.88)' }}>Year: <strong style={{ color: '#e2e8f0' }}>{scope.year}</strong></div>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.88)' }}>Semester: <strong style={{ color: '#e2e8f0' }}>{scope.semester}</strong></div>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.88)' }}>Specialization: <strong style={{ color: '#e2e8f0' }}>{scope.specialization}</strong></div>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.88)' }}>Group: <strong style={{ color: '#e2e8f0' }}>{scope.group}.{scope.subgroup}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEditId(isOpen ? null : row.id);
                      setRejectComment('');
                    }}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(56,189,248,0.45)',
                      background: 'rgba(56,189,248,0.12)',
                      color: '#67e8f9',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder="Optional rejection comment"
                      rows={3}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        borderRadius: 10,
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: 'rgba(15,23,42,0.68)',
                        color: '#e2e8f0',
                        fontSize: 13,
                        padding: 10,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => updateTimetableStatus(row.id, 'approve')}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(16,185,129,0.45)',
                          background: 'rgba(16,185,129,0.15)',
                          color: '#86efac',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '8px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        {savingId === row.id ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => updateTimetableStatus(row.id, 'reject')}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(239,68,68,0.45)',
                          background: 'rgba(239,68,68,0.15)',
                          color: '#fca5a5',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '8px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        {savingId === row.id ? 'Saving...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          </div>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default AcademicTimetablesPage;