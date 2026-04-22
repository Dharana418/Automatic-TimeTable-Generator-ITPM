import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ITEMS_PER_PAGE = 6;

const normalizeDayLabel = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Unspecified';
  if (raw.startsWith('mon')) return 'Mon';
  if (raw.startsWith('tue')) return 'Tue';
  if (raw.startsWith('wed')) return 'Wed';
  if (raw.startsWith('thu')) return 'Thu';
  if (raw.startsWith('fri')) return 'Fri';
  if (raw.startsWith('sat')) return 'Sat';
  if (raw.startsWith('sun')) return 'Sun';
  return String(value || 'Unspecified');
};

const timeToMinutes = (label) => {
  const text = String(label || '');
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 60 + Number(match[2]);
};

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

const normalizeScheduleRow = (item = {}) => {
  const day = item.day || item.dayOfWeek || item.weekday || '-';
  const time = item.timeSlot || item.slot || item.time || item.timeslot || '-';
  const moduleCode = item.moduleCode || item.module_id || item.moduleId || item.code || '';
  const moduleName = item.moduleName || item.module_name || item.name || '';
  const hall = item.hallName || item.hall_id || item.hallId || item.room || 'Hall TBA';
  const lecturer = item.lecturerName || item.instructorName || item.lecturer || item.instructor || 'TBA';
  const batch = item.batch || item.batchName || item.group || '-';

  const moduleNumberMatch = String(moduleCode).match(/module[_\s-]*([0-9]+)/i);
  const moduleNumber = moduleNumberMatch ? moduleNumberMatch[1] : '';
  const cleanModuleName = String(moduleName || '').trim();

  let moduleDisplay = 'Module TBA';
  if (moduleNumber && cleanModuleName) {
    moduleDisplay = `Module ${moduleNumber} - ${cleanModuleName}`;
  } else if (cleanModuleName) {
    moduleDisplay = cleanModuleName;
  } else if (moduleNumber) {
    moduleDisplay = `Module ${moduleNumber}`;
  }

  return {
    day: normalizeDayLabel(day),
    time,
    module: moduleDisplay,
    hall,
    lecturer,
    batch,
  };
};

const toScope = (row) => {
  const data = parseTimetableData(row?.data);
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [editHistory, setEditHistory] = useState([]);
  const [activeEditId, setActiveEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalScheduleRows, setModalScheduleRows] = useState([]);
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [dragOverCellKey, setDragOverCellKey] = useState(null);
  const [pendingSwap, setPendingSwap] = useState(null);

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
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.message || 'Failed to load timetables.');
    } finally {
      setLoading(false);
    }
  };

  const loadEditHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API_BASE}/api/academic-coordinator/timetables/edit-history?limit=50`, {
        credentials: 'include',
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || 'Failed to fetch edit history.');
      }
      setEditHistory(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load edit history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
    loadEditHistory();
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(timetables.length / ITEMS_PER_PAGE)), [timetables.length]);

  const paginatedTimetables = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return timetables.slice(start, start + ITEMS_PER_PAGE);
  }, [timetables, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeTimetable = useMemo(
    () => timetables.find((item) => item.id === activeEditId) || null,
    [timetables, activeEditId]
  );

  const activeScheduleRows = useMemo(
    () => (
      activeTimetable
        ? parseScheduleRows(activeTimetable).map((row, index) => ({
            ...normalizeScheduleRow(row),
            rowId: `${activeTimetable.id}-${index}`,
            rawRow: row,
          }))
        : []
    ),
    [activeTimetable]
  );

  useEffect(() => {
    setModalScheduleRows(activeScheduleRows);
    setDraggedRowId(null);
    setDragOverRowId(null);
    setDragOverCellKey(null);
    setPendingSwap(null);
  }, [activeScheduleRows]);

  const clearDragState = () => {
    setDraggedRowId(null);
    setDragOverRowId(null);
    setDragOverCellKey(null);
  };

  const getRowSummary = (rowId) => {
    const row = modalScheduleRows.find((item) => item.rowId === rowId);
    if (!row) return 'Unknown slot';
    return `${row.day} ${row.time}`;
  };

  const requestSwapConfirmation = (sourceRowId, targetRowId) => {
    if (!sourceRowId || !targetRowId || sourceRowId === targetRowId) return;

    setPendingSwap({
      sourceRowId,
      targetRowId,
      sourceSummary: getRowSummary(sourceRowId),
      targetSummary: getRowSummary(targetRowId),
    });
  };

  const requestMoveConfirmation = (sourceRowId, targetTime, targetDay) => {
    if (!sourceRowId || !targetTime || !targetDay) return;
    const source = modalScheduleRows.find((row) => row.rowId === sourceRowId);
    if (!source) return;
    if (source.time === targetTime && source.day === targetDay) return;

    setPendingSwap({
      sourceRowId,
      targetRowId: null,
      targetTime,
      targetDay,
      sourceSummary: getRowSummary(sourceRowId),
      targetSummary: `${targetDay} ${targetTime}`,
    });
  };

  const cancelSwapConfirmation = () => {
    setPendingSwap(null);
  };

  const confirmSwap = () => {
    if (!pendingSwap) return;
    if (pendingSwap.targetRowId) {
      swapRows(pendingSwap.sourceRowId, pendingSwap.targetRowId);
    } else if (pendingSwap.targetTime && pendingSwap.targetDay) {
      moveRowToCell(pendingSwap.sourceRowId, pendingSwap.targetTime, pendingSwap.targetDay);
      toast.success('Timetable slot moved successfully.');
    }
    setPendingSwap(null);
  };

  const swapRows = (sourceRowId, targetRowId) => {
    if (!sourceRowId || !targetRowId || sourceRowId === targetRowId) return;

    let didSwap = false;
    setModalScheduleRows((prev) => {
      const source = prev.find((row) => row.rowId === sourceRowId);
      const target = prev.find((row) => row.rowId === targetRowId);
      if (!source || !target) return prev;

      didSwap = true;

      return prev.map((row) => {
        if (row.rowId === sourceRowId) {
          return { ...row, day: target.day, time: target.time };
        }
        if (row.rowId === targetRowId) {
          return { ...row, day: source.day, time: source.time };
        }
        return row;
      });
    });

    if (didSwap) {
      toast.success('Timetable slots swapped successfully.');
    }
  };

  const moveRowToCell = (sourceRowId, targetTime, targetDay) => {
    if (!sourceRowId || !targetTime || !targetDay) return;

    setModalScheduleRows((prev) => {
      const source = prev.find((row) => row.rowId === sourceRowId);
      if (!source) return prev;
      if (source.time === targetTime && source.day === targetDay) return prev;

      return prev.map((row) => {
        if (row.rowId === sourceRowId) {
          return { ...row, time: targetTime, day: targetDay };
        }
        return row;
      });
    });
  };

  const timetableMatrix = useMemo(() => {
    const daySet = new Set();
    const timeSet = new Set();
    const cellMap = new Map();

    modalScheduleRows.forEach((entry) => {
      const day = entry.day || 'Unspecified';
      const time = entry.time || '-';
      daySet.add(day);
      timeSet.add(time);
      const key = `${time}__${day}`;
      const list = cellMap.get(key) || [];
      list.push(entry);
      cellMap.set(key, list);
    });

    const days = [...daySet].sort((a, b) => {
      const ia = DAY_ORDER.indexOf(a);
      const ib = DAY_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });

    const times = [...timeSet].sort((a, b) => {
      const diff = timeToMinutes(a) - timeToMinutes(b);
      if (Number.isFinite(diff) && diff !== 0) return diff;
      return String(a).localeCompare(String(b));
    });

    return { days, times, cellMap };
  }, [modalScheduleRows]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (pendingSwap) {
        setPendingSwap(null);
        return;
      }
      if (activeEditId) {
        setActiveEditId(null);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [activeEditId, pendingSwap]);

  const cancelModalEdit = () => {
    setPendingSwap(null);
    setActiveEditId(null);
  };

  const buildEditableSchedulePayload = () => modalScheduleRows.map((entry) => {
    const base = entry.rawRow && typeof entry.rawRow === 'object' ? { ...entry.rawRow } : {};

    return {
      ...base,
      day: entry.day,
      dayOfWeek: entry.day,
      weekday: entry.day,
      timeSlot: entry.time,
      slot: entry.time,
      time: entry.time,
      timeslot: entry.time,
    };
  });

  const acceptModalEdit = async () => {
    if (!activeTimetable) return;

    try {
      setIsSavingEdit(true);
      const response = await fetch(`${API_BASE}/api/academic-coordinator/timetables/${activeTimetable.id}/edit`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: buildEditableSchedulePayload() }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || 'Failed to save timetable edits.');
      }

      setTimetables((prev) => prev.map((row) => (row.id === activeTimetable.id ? json.data : row)));
      await loadEditHistory();
      toast.success('Timetable edits accepted.');
      setPendingSwap(null);
      setActiveEditId(null);
    } catch (error) {
      toast.error(error.message || 'Failed to save timetable edits.');
    } finally {
      setIsSavingEdit(false);
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
            Generated timetables are listed below in card view. Use Edit on each card to review and adjust slot assignments.
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

          {!loading && paginatedTimetables.map((row) => {
            const scope = toScope(row);
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
                      setActiveEditId(row.id);
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
              </article>
            );
          })}
          </div>

          {!loading && timetables.length > ITEMS_PER_PAGE && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, timetables.length)} of {timetables.length}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.7)',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 12px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  Prev
                </button>
                <span style={{ color: '#bae6fd', fontSize: 12, fontWeight: 700 }}>
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(56,189,248,0.45)',
                    background: 'rgba(56,189,248,0.12)',
                    color: '#67e8f9',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 12px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <section style={sectionPanelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 900 }}>Edit History</h3>
            <button
              type="button"
              onClick={loadEditHistory}
              disabled={historyLoading}
              style={{
                borderRadius: 10,
                border: '1px solid rgba(56,189,248,0.45)',
                background: 'rgba(56,189,248,0.12)',
                color: '#67e8f9',
                fontSize: 12,
                fontWeight: 700,
                padding: '7px 10px',
                cursor: historyLoading ? 'not-allowed' : 'pointer',
                opacity: historyLoading ? 0.6 : 1,
              }}
            >
              {historyLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {historyLoading && (
            <div style={{ color: 'rgba(148,163,184,0.88)', fontSize: 13 }}>Loading edit history...</div>
          )}

          {!historyLoading && editHistory.length === 0 && (
            <div
              style={{
                borderRadius: 14,
                border: '1px dashed rgba(148,163,184,0.35)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(148,163,184,0.92)',
                padding: 14,
                fontSize: 13,
              }}
            >
              No timetable edits recorded yet.
            </div>
          )}

          {!historyLoading && editHistory.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {editHistory.map((entry) => {
                const timetableName = entry?.timetable_name || `Timetable ${entry?.timetable_id || '-'}`;
                const editorName = entry?.editor_name || 'Unknown user';
                const previousCount = Number(entry?.previous_count || 0);
                const updatedCount = Number(entry?.updated_count || 0);

                return (
                  <article
                    key={`edit-history-${entry.id}`}
                    style={{
                      borderRadius: 14,
                      border: '1px solid rgba(56,189,248,0.22)',
                      background: 'rgba(2,6,23,0.55)',
                      padding: 12,
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#f8fafc', fontSize: 13 }}>{timetableName}</strong>
                      <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>{formatDate(entry?.edited_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: '#cbd5e1', fontSize: 12 }}>
                      <span>Edited By: {editorName}</span>
                      <span>Rows: {previousCount}{' -> '}{updatedCount}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {activeTimetable && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setActiveEditId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,6,23,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 80,
              padding: '18px 20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              overflowY: 'auto',
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: 'min(1380px, 100%)',
                maxHeight: '92vh',
                overflow: 'auto',
                position: 'relative',
                borderRadius: 20,
                border: '1px solid rgba(56,189,248,0.35)',
                background: 'linear-gradient(155deg, rgba(2,6,23,0.96), rgba(15,23,42,0.92), rgba(8,47,73,0.55))',
                boxShadow: '0 24px 70px rgba(2,6,23,0.6)',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 900 }}>
                    {activeTimetable.name || `Timetable ${activeTimetable.id}`}
                  </h3>
                  <p style={{ margin: '3px 0 0', color: 'rgba(148,163,184,0.9)', fontSize: 11 }}>
                    Full timetable details · Created {formatDate(activeTimetable.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEditId(null)}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.7)',
                    color: '#e2e8f0',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{
                borderRadius: 12,
                border: '1px solid rgba(56,189,248,0.22)',
                background: 'rgba(2,6,23,0.55)',
                overflowX: 'auto'
              }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(148,163,184,0.18)', color: '#bae6fd', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Timetable Sessions ({modalScheduleRows.length})
                </div>

                {modalScheduleRows.length > 0 ? (
                  <div style={{ padding: 6 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `126px repeat(${Math.max(timetableMatrix.days.length, 1)}, minmax(156px, 1fr))`,
                        gap: 5,
                        minWidth: Math.max(860, timetableMatrix.days.length * 176 + 136),
                      }}
                    >
                      <div style={{ padding: '6px 7px', borderRadius: 10, background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.2)', color: 'rgba(148,163,184,0.88)', fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Time
                      </div>

                      {timetableMatrix.days.map((day) => (
                        <div key={`head-${day}`} style={{ padding: '6px 7px', borderRadius: 10, background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.2)', color: '#bae6fd', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {day}
                        </div>
                      ))}

                      {timetableMatrix.times.map((time) => (
                        <React.Fragment key={`row-${time}`}>
                          <div style={{ padding: '6px 7px', borderRadius: 10, background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(148,163,184,0.18)', color: '#cbd5e1', fontSize: 10, fontWeight: 700 }}>
                            {time}
                          </div>

                          {timetableMatrix.days.map((day) => {
                            const entries = timetableMatrix.cellMap.get(`${time}__${day}`) || [];
                            const cellKey = `${time}__${day}`;
                            return (
                              <div
                                key={`cell-${time}-${day}`}
                                onDragOver={(event) => {
                                  event.preventDefault();
                                  event.dataTransfer.dropEffect = 'move';
                                  setDragOverCellKey(cellKey);
                                  setDragOverRowId(null);
                                }}
                                onDragLeave={() => {
                                  setDragOverCellKey((prev) => (prev === cellKey ? null : prev));
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  if (draggedRowId && entries.length === 0) {
                                    requestMoveConfirmation(draggedRowId, time, day);
                                  }
                                  clearDragState();
                                }}
                                style={{
                                  minHeight: 62,
                                  borderRadius: 12,
                                  border: dragOverCellKey === cellKey ? '1px solid rgba(34,211,238,0.65)' : '1px solid rgba(56,189,248,0.18)',
                                  background: dragOverCellKey === cellKey ? 'rgba(8,47,73,0.62)' : 'rgba(2,6,23,0.45)',
                                  padding: 5,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 3,
                                }}
                              >
                                {entries.length === 0 ? (
                                  <div style={{ color: 'rgba(148,163,184,0.55)', fontSize: 9 }}>No session</div>
                                ) : (
                                  entries.map((entry, idx) => (
                                    <div
                                      key={entry.rowId || `entry-${time}-${day}-${idx}`}
                                      draggable
                                      onDragStart={(event) => {
                                        setDraggedRowId(entry.rowId);
                                        setDragOverRowId(null);
                                        setDragOverCellKey(null);
                                        event.dataTransfer.effectAllowed = 'move';
                                      }}
                                      onDragEnd={clearDragState}
                                      onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'move';
                                        setDragOverRowId(entry.rowId);
                                        setDragOverCellKey(null);
                                      }}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        if (draggedRowId && draggedRowId !== entry.rowId) {
                                          requestSwapConfirmation(draggedRowId, entry.rowId);
                                        }
                                        clearDragState();
                                      }}
                                      title="Drag to another session card to swap positions"
                                      style={{
                                        borderRadius: 10,
                                        border: dragOverRowId === entry.rowId ? '1px solid rgba(34,211,238,0.85)' : '1px solid rgba(34,211,238,0.25)',
                                        background: dragOverRowId === entry.rowId ? 'rgba(8,47,73,0.76)' : 'rgba(15,23,42,0.75)',
                                        padding: 5,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        cursor: 'grab',
                                        opacity: draggedRowId === entry.rowId ? 0.75 : 1,
                                      }}
                                    >
                                      <div style={{ color: '#93c5fd', fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>Hall: {entry.hall}</div>
                                      <div style={{ color: '#f8fafc', fontSize: 9, lineHeight: 1.2 }}>{entry.module}</div>
                                      <div style={{ color: '#cbd5e1', fontSize: 9 }}>Lecturer: {entry.lecturer}</div>
                                      <div style={{ color: '#86efac', fontSize: 9 }}>Batch: {entry.batch}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 12, color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>
                    No timetable sessions found in this record.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={cancelModalEdit}
                  disabled={isSavingEdit}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.72)',
                    color: '#e2e8f0',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '7px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={acceptModalEdit}
                  disabled={isSavingEdit}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(34,197,94,0.45)',
                    background: 'rgba(34,197,94,0.16)',
                    color: '#86efac',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '7px 10px',
                    cursor: 'pointer'
                  }}
                >
                  {isSavingEdit ? 'Saving...' : 'Accept Edit'}
                </button>
              </div>

              {pendingSwap && (
                <div
                  onClick={cancelSwapConfirmation}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(2,6,23,0.72)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      width: 'min(520px, 100%)',
                      borderRadius: 18,
                      border: '1px solid rgba(34,211,238,0.4)',
                      background: 'linear-gradient(155deg, rgba(2,6,23,0.96), rgba(15,23,42,0.95), rgba(8,47,73,0.52))',
                      boxShadow: '0 20px 60px rgba(2,6,23,0.65)',
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 900 }}>Confirm Slot Swap</h4>
                    <p style={{ margin: 0, color: 'rgba(191,219,254,0.95)', fontSize: 13, lineHeight: 1.6 }}>
                      {pendingSwap.targetRowId
                        ? 'Are you sure you want to swap these timetable slots?'
                        : 'Are you sure you want to move this timetable slot to the empty position?'}
                    </p>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.65)', padding: '8px 10px', color: '#e2e8f0', fontSize: 12 }}>
                        <strong style={{ color: '#7dd3fc' }}>From:</strong> {pendingSwap.sourceSummary}
                      </div>
                      <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.65)', padding: '8px 10px', color: '#e2e8f0', fontSize: 12 }}>
                        <strong style={{ color: '#7dd3fc' }}>With:</strong> {pendingSwap.targetSummary}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        type="button"
                        onClick={cancelSwapConfirmation}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(148,163,184,0.35)',
                          background: 'rgba(15,23,42,0.75)',
                          color: '#e2e8f0',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '8px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        No, Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmSwap}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(34,197,94,0.45)',
                          background: 'rgba(34,197,94,0.16)',
                          color: '#86efac',
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '8px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        {pendingSwap.targetRowId ? 'Yes, Swap' : 'Yes, Move'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FacultyCoordinatorShell>
  );
};

export default AcademicTimetablesPage;