import React, { useMemo, useState } from 'react';
import batches from '../data/batches.js';

const STREAMS = ['IT', 'SE', 'DS', 'Engineering'];
const MODES = ['ALL', 'Weekday', 'Weekend'];
const SORT_OPTIONS = [
  { value: 'id-asc', label: 'Batch ID (A-Z)' },
  { value: 'id-desc', label: 'Batch ID (Z-A)' },
  { value: 'capacity-desc', label: 'Capacity (High-Low)' },
  { value: 'capacity-asc', label: 'Capacity (Low-High)' },
];

const getDepartmentLane = (department) => {
  if (department === 'IT' || department === 'SE' || department === 'DS') {
    return department;
  }
  return 'Engineering';
};

const getBatchMeta = (batchId) => {
  const parts = batchId.split('.');
  const year = parts[0] || 'Y?';
  const semester = parts[1] || 'S?';
  const mode = parts[2] || '';
  const department = parts[3] || 'GEN';
  const group = parts[4] || '--';

  return {
    year,
    semester,
    mode,
    department,
    group,
    isWeekend: mode === 'WE',
  };
};

export default function BatchList({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');

  const years = useMemo(() => {
    const values = new Set();
    batches.forEach((batch) => values.add(getBatchMeta(batch.id).year));
    return ['ALL', ...Array.from(values).sort()];
  }, []);

  const semesters = useMemo(() => {
    const values = new Set();
    batches.forEach((batch) => values.add(getBatchMeta(batch.id).semester));
    return ['ALL', ...Array.from(values).sort()];
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = batches.filter((batch) => {
      const meta = getBatchMeta(batch.id);
      const lane = getDepartmentLane(meta.department);
      const modeLabel = meta.isWeekend ? 'Weekend' : 'Weekday';
      const searchable = `${batch.id} ${meta.department} ${meta.year} ${meta.semester} ${modeLabel}`.toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesStream = selectedStream === 'ALL' || lane === selectedStream;
      const matchesMode = selectedMode === 'ALL' || modeLabel === selectedMode;
      const matchesYear = selectedYear === 'ALL' || meta.year === selectedYear;
      const matchesSemester = selectedSemester === 'ALL' || meta.semester === selectedSemester;

      return matchesQuery && matchesStream && matchesMode && matchesYear && matchesSemester;
    });

    const sorted = [...filtered];
    if (sortBy === 'id-asc') sorted.sort((a, b) => a.id.localeCompare(b.id));
    if (sortBy === 'id-desc') sorted.sort((a, b) => b.id.localeCompare(a.id));
    if (sortBy === 'capacity-desc') sorted.sort((a, b) => b.capacity - a.capacity);
    if (sortBy === 'capacity-asc') sorted.sort((a, b) => a.capacity - b.capacity);

    return sorted;
  }, [query, selectedMode, selectedSemester, selectedStream, selectedYear, sortBy]);

  const streamBuckets = useMemo(() => {
    const seeded = STREAMS.reduce((acc, stream) => {
      acc[stream] = [];
      return acc;
    }, {});

    list.forEach((batch) => {
      const meta = getBatchMeta(batch.id);
      const lane = getDepartmentLane(meta.department);
      seeded[lane].push(batch);
    });

    return seeded;
  }, [list]);

  const totalCapacity = useMemo(
    () => list.reduce((sum, batch) => sum + (batch.capacity || 0), 0),
    [list],
  );

  const totalWeekend = useMemo(
    () => list.filter((batch) => getBatchMeta(batch.id).isWeekend).length,
    [list],
  );

  const clearFilters = () => {
    setQuery('');
    setSelectedStream('ALL');
    setSelectedMode('ALL');
    setSelectedYear('ALL');
    setSelectedSemester('ALL');
    setSortBy('id-asc');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold tracking-tight text-slate-900">Batch Studio</h4>
          <p className="text-sm text-slate-500">Search, filter, and review faculty batches with quick drilldown.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {list.length} shown
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
        <input
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="Search batch (e.g. Y2.S2.WE.IT.01)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
        >
          <option value="ALL">All Streams</option>
          {STREAMS.map((stream) => (
            <option key={stream} value={stream}>{stream}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          {MODES.map((mode) => (
            <option key={mode} value={mode}>{mode === 'ALL' ? 'All Modes' : mode}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year === 'ALL' ? 'All Years' : year}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {semesters.map((semester) => (
            <option key={semester} value={semester}>{semester === 'ALL' ? 'All Semesters' : semester}</option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STREAMS.map((stream) => (
            <button
              key={stream}
              type="button"
              onClick={() => setSelectedStream((current) => (current === stream ? 'ALL' : stream))}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                selectedStream === stream
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {stream}: {streamBuckets[stream].length}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700"
        >
          Reset Filters
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Capacity</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{totalCapacity}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weekend Batches</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{totalWeekend}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weekday Batches</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{list.length - totalWeekend}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {STREAMS.map((stream) => (
          <section key={stream} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="text-sm font-semibold tracking-tight text-slate-800">{stream} Batches</h5>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {streamBuckets[stream].length}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {streamBuckets[stream].map((batch) => {
                const meta = getBatchMeta(batch.id);
                const occupancyPercent = Math.min(100, Math.round((batch.capacity / 120) * 100));

                return (
                  <div key={batch.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-800">{batch.id}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        meta.isWeekend
                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        {meta.isWeekend ? 'Weekend' : 'Weekday'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">{meta.year}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">{meta.semester}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">{meta.department}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">G{meta.group}</span>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                        <span>Capacity</span>
                        <span>{batch.capacity}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {streamBuckets[stream].length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                  No {stream} batches for this filter.
                </div>
              )}
            </div>
          </section>
        ))}

        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            No batches match your current search and filters.
          </div>
        )}
      </div>
    </div>
  );
}
