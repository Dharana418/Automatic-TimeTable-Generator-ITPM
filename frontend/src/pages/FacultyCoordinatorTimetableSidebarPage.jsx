import React, { useEffect, useMemo, useState } from 'react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import schedulerApi from '../api/scheduler.js';
import facultyDashboardBg from '../assets/Gemini_Generated_Image_hqfdrqhqfdrqhqfd.png';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CAMPUS_TIMELINE = [
  { type: 'class', slot: '09:00-10:00', label: '09:00 - 10:00' },
  { type: 'class', slot: '10:00-11:00', label: '10:00 - 11:00' },
  { type: 'class', slot: '11:00-12:00', label: '11:00 - 12:00' },
  { type: 'break', slot: '12:30-13:30', label: 'Interval 12:30 - 13:30' },
  { type: 'class', slot: '13:30-14:30', label: '13:30 - 14:30' },
  { type: 'class', slot: '14:30-15:30', label: '14:30 - 15:30' },
];

const CAMPUS_CLASS_SLOTS = CAMPUS_TIMELINE.filter((row) => row.type === 'class').map((row) => row.slot);

const normalizeDay = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'TBA';
  const map = {
    monday: 'Mon',
    mon: 'Mon',
    tuesday: 'Tue',
    tue: 'Tue',
    wednesday: 'Wed',
    wed: 'Wed',
    thursday: 'Thu',
    thu: 'Thu',
    friday: 'Fri',
    fri: 'Fri',
    saturday: 'Sat',
    sat: 'Sat',
    sunday: 'Sun',
    sun: 'Sun',
  };
  return map[raw] || String(value);
};

const normalizeSlot = (row) => {
  const rawSlot = row?.slot || row?.timeSlot || (Array.isArray(row?.slots) ? row.slots.join(' | ') : '');
  const slotText = String(rawSlot || '').trim();
  if (!slotText) return 'TBA';

  // Align stored scheduler slot labels to campus-facing timeline labels.
  if (slotText === '13:00-14:00') return '13:30-14:30';
  if (slotText === '14:00-15:00') return '14:30-15:30';
  if (slotText === '12:00-13:00') return '12:30-13:30';
  if (slotText === '12:30-13:30') return '12:30-13:30';

  if (/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(slotText)) {
    return slotText.replace(/\s+/g, '');
  }

  return 'TBA';
};

const parseSlotStartMinutes = (slot) => {
  const text = String(slot || '');
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 60 + Number(match[2]);
};

const extractBatchKeys = (row) => {
  if (Array.isArray(row?.batchKeys) && row.batchKeys.length) return row.batchKeys;
  if (row?.batchKey) return [row.batchKey];
  return ['UNASSIGNED'];
};

const extractYearSemesterKey = (batchKey) => {
  const text = String(batchKey || '').toUpperCase();
  const match = text.match(/Y(\d)\.S(\d)/);
  if (match) return `Y${match[1]}S${match[2]}`;
  return 'UNSPECIFIED';
};

const parseSchedule = (timetable) => {
  const rawData = timetable?.data;
  if (!rawData) return [];

  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      return Array.isArray(parsed?.schedule) ? parsed.schedule : [];
    } catch {
      return [];
    }
  }

  if (typeof rawData === 'object' && rawData !== null) {
    return Array.isArray(rawData.schedule) ? rawData.schedule : [];
  }

  return [];
};

const buildBatchTable = (scheduleRows = []) => {
  const batchMap = new Map();

  scheduleRows.forEach((row) => {
    const day = normalizeDay(row.day);
    const slot = normalizeSlot(row);

    extractBatchKeys(row).forEach((batchKey) => {
      const key = String(batchKey || 'UNASSIGNED');
      if (!batchMap.has(key)) {
        batchMap.set(key, { batchKey: key, entries: [] });
      }
      batchMap.get(key).entries.push({
        module: row.moduleName || row.moduleId || 'Module',
        hall: row.hallName || row.hallId || 'Hall TBA',
        instructor: row.instructorName || row.instructorId || 'Instructor TBA',
        day,
        slot,
      });
    });
  });

  const batches = Array.from(batchMap.values()).map((batch) => {
    const days = Array.from(new Set(batch.entries.map((entry) => entry.day))).sort((a, b) => {
      const left = DAY_ORDER.indexOf(a);
      const right = DAY_ORDER.indexOf(b);
      if (left === -1 && right === -1) return a.localeCompare(b);
      if (left === -1) return 1;
      if (right === -1) return -1;
      return left - right;
    });

    const slots = [...CAMPUS_CLASS_SLOTS];

    const cellMap = new Map();
    batch.entries.forEach((entry) => {
      const idx = `${entry.slot}::${entry.day}`;
      if (!cellMap.has(idx)) cellMap.set(idx, []);
      cellMap.get(idx).push(entry);
    });

    return {
      batchKey: batch.batchKey,
      yearSemester: extractYearSemesterKey(batch.batchKey),
      days,
      slots,
      cellMap,
    };
  });

  return batches.sort((a, b) => a.batchKey.localeCompare(b.batchKey));
};

const FacultyCoordinatorTimetableSidebarPage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await schedulerApi.getAcademicCoordinatorTimetables();
        const list = Array.isArray(response?.data) ? response.data : [];
        if (!mounted) return;

        const withDate = list
          .map((item) => ({ ...item, created_at: item.created_at || item.updated_at || null }))
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        setTimetables(withDate);
        setSelectedId(withDate[0]?.id ? String(withDate[0].id) : '');
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load timetables');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTimetable = useMemo(() => {
    if (!selectedId) return null;
    return timetables.find((tt) => String(tt.id) === String(selectedId)) || null;
  }, [selectedId, timetables]);

  const schedule = useMemo(() => parseSchedule(selectedTimetable), [selectedTimetable]);

  const batchTables = useMemo(() => buildBatchTable(schedule), [schedule]);

  const groupedByYearSemester = useMemo(() => {
    const map = new Map();
    batchTables.forEach((batch) => {
      if (!map.has(batch.yearSemester)) {
        map.set(batch.yearSemester, []);
      }
      map.get(batch.yearSemester).push(batch);
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [batchTables]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Timetable Sidebar View"
      subtitle="FET style student timetable view by year, semester, and batch"
      badge="Timetable Report"
      backgroundImage={facultyDashboardBg}
      footerNote="Faculty Coordinator timetable report view"
    >
      <div id="top" className="flex flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Institution Name</h2>
              <p className="mt-2 text-base font-semibold text-slate-900">Sri Lanka Institute of Information Technology</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Comments</h2>
              <p className="mt-2 text-base text-slate-800">Default comments</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Select Saved Timetable</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || !timetables.length}
              >
                {!timetables.length && <option value="">No timetables available</option>}
                {timetables.map((tt) => (
                  <option key={tt.id} value={String(tt.id)}>
                    {tt.name || `Timetable #${tt.id}`} - {tt.status || 'pending'}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-600">Loading timetable data...</p>}
          {!loading && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

        {!loading && !!selectedTimetable && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Table of Contents</h3>
            {!groupedByYearSemester.length ? (
              <p className="mt-3 text-sm text-slate-600">No schedule rows in this timetable.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-700">
                {groupedByYearSemester.map(([yearSemester, batches]) => (
                  <li key={yearSemester}>
                    <p className="font-semibold text-slate-900">Year {yearSemester}</p>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      {batches.map((batch) => (
                        <li key={batch.batchKey}>
                          <a className="text-blue-700 hover:underline" href={`#batch-${batch.batchKey.replace(/[^a-zA-Z0-9]/g, '-')}`}>
                            {batch.batchKey}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && !!selectedTimetable && batchTables.map((batch, index) => {
          const tableId = `batch-${batch.batchKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
          const isOdd = index % 2 === 0;
          return (
            <section
              id={tableId}
              key={batch.batchKey}
              className={`overflow-hidden rounded-2xl border ${isOdd ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/30'} p-4 shadow-sm`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900">{batch.batchKey}</h4>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {batch.yearSemester}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">Time</th>
                      {batch.days.map((day) => (
                        <th key={day} className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPUS_TIMELINE.map((timelineRow) => {
                      if (timelineRow.type === 'break') {
                        return (
                          <tr key={timelineRow.slot}>
                            <td className="sticky left-0 z-10 border border-slate-300 bg-amber-100 px-3 py-2 font-semibold text-amber-900">
                              {timelineRow.label}
                            </td>
                            <td
                              className="border border-slate-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-amber-800"
                              colSpan={Math.max(batch.days.length, 1)}
                            >
                              Campus Interval (No Lectures)
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={timelineRow.slot}>
                          <td className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                            {timelineRow.label}
                          </td>
                          {batch.days.map((day) => {
                            const key = `${timelineRow.slot}::${day}`;
                            const entries = batch.cellMap.get(key) || [];
                            return (
                              <td key={key} className="border border-slate-300 bg-white px-2 py-2 align-top">
                                {!entries.length ? (
                                  <span className="text-[11px] text-slate-400">-</span>
                                ) : (
                                  <div className="space-y-2">
                                    {entries.map((entry, idx) => (
                                      <div key={`${entry.module}-${entry.hall}-${idx}`} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                        <p className="text-xs font-semibold text-slate-900">{entry.module}</p>
                                        <p className="text-[11px] text-slate-600">{entry.hall}</p>
                                        <p className="text-[11px] text-slate-500">{entry.instructor}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-right">
                <a href="#top" className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 hover:underline">
                  Back to the top
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyCoordinatorTimetableSidebarPage;
