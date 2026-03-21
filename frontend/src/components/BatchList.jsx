import React, { useMemo, useState } from 'react';
import batches from '../data/batches.js';

const STREAMS = ['IT', 'SE', 'DS', 'Engineering'];

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

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter(b => b.id.toLowerCase().includes(q));
  }, [query]);

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

  return (
    <div className="panel batch-panel">
      <div className="batch-panel-head">
        <h4>Batch Studio</h4>
        <div className="batch-count">{list.length} shown</div>
      </div>

      <div className="batch-filter-row">
        <input
          className="search"
          placeholder="Search batch (e.g. Y2.S2.WE)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="batch-summary-row">
        {STREAMS.map((stream) => (
          <span key={stream} className="chip">{stream}: {streamBuckets[stream].length}</span>
        ))}
      </div>

      <div className="batch-lanes">
        {STREAMS.map((stream) => (
          <section key={stream} className="batch-lane">
            <div className="batch-lane-head">
              <h5>{stream} Batches</h5>
              <span>{streamBuckets[stream].length}</span>
            </div>

            <div className="batch-grid">
              {streamBuckets[stream].map((batch) => {
                const meta = getBatchMeta(batch.id);
                const occupancyPercent = Math.min(100, Math.round((batch.capacity / 120) * 100));

                return (
                  <div key={batch.id} className="batch-card">
                    <div className="batch-card-head">
                      <div className="batch-id">{batch.id}</div>
                      <span className={`batch-mode ${meta.isWeekend ? 'weekend' : 'weekday'}`}>
                        {meta.isWeekend ? 'Weekend' : 'Weekday'}
                      </span>
                    </div>

                    <div className="batch-meta-row">
                      <span>{meta.year}</span>
                      <span>{meta.semester}</span>
                      <span>{meta.department}</span>
                      <span>G{meta.group}</span>
                    </div>

                    <div className="batch-load-row">
                      <div className="batch-load-label">
                        <span>Capacity</span>
                        <span>{batch.capacity}</span>
                      </div>
                      <div className="batch-load-track">
                        <div className="batch-load-bar" style={{ width: `${occupancyPercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {streamBuckets[stream].length === 0 && (
                <div className="muted">No {stream} batches for this filter.</div>
              )}
            </div>
          </section>
        ))}

        {list.length === 0 && (
          <div className="muted">No batches match your search.</div>
        )}
      </div>
    </div>
  );
}
