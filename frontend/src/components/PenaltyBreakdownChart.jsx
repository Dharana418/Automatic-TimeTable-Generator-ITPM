import React from 'react';

const KEYS = ['w1', 'w2', 'w3', 'w4', 'w5'];

const PenaltyBreakdownChart = ({ breakdown }) => {
  if (!breakdown) {
    return <p className="text-sm text-slate-500">No optimization run available yet.</p>;
  }

  const rows = KEYS
    .map((key) => ({
      key,
      ...(breakdown[key] || { label: key, violations: 0, score: 0 }),
    }))
    .map((row) => ({ ...row, violations: Number(row.violations || 0) }));

  const maxViolation = Math.max(1, ...rows.map((row) => row.violations));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{row.key.toUpperCase()} · {row.label}</span>
            <span>{row.violations} violations</span>
          </div>
          <div className="mt-1 h-2.5 w-full rounded bg-slate-200">
            <div
              className="h-2.5 rounded bg-blue-600"
              style={{ width: `${(row.violations / maxViolation) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="pt-2 text-xs font-semibold text-slate-700">
        Total Penalty: {Number(breakdown.totalPenalty || 0).toFixed(2)}
      </div>
    </div>
  );
};

export default PenaltyBreakdownChart;