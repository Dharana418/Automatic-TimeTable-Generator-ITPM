import React, { useState, useCallback, useEffect } from 'react';

const ActivityLogPanel = ({ hallId, apiBase }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);

  const loadActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/halls/${hallId}/logs`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [hallId, apiBase]);

  useEffect(() => {
    if (hallId) {
      loadActivityLogs();
      const interval = setInterval(loadActivityLogs, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [hallId, loadActivityLogs]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '✨';
      case 'update': return '📝';
      case 'delete': return '🗑️';
      case 'assign_resource': return '📦';
      case 'remove_resource': return '📤';
      case 'add_rating': return '⭐';
      default: return '📋';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'assign_resource': return 'Resource Added';
      case 'remove_resource': return 'Resource Removed';
      case 'add_rating': return 'Rating Added';
      default: return 'Modified';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'border border-emerald-500/60 bg-emerald-950/70 text-emerald-200';
      case 'update': return 'border border-cyan-500/60 bg-cyan-950/70 text-cyan-200';
      case 'delete': return 'border border-rose-500/60 bg-rose-950/70 text-rose-200';
      case 'assign_resource': return 'border border-violet-500/60 bg-violet-950/70 text-violet-200';
      case 'remove_resource': return 'border border-amber-500/60 bg-amber-950/70 text-amber-200';
      case 'add_rating': return 'border border-yellow-500/60 bg-yellow-950/70 text-yellow-200';
      default: return 'border border-slate-500/60 bg-slate-800/80 text-slate-200';
    }
  };

  const parseChanges = (changes) => {
    try {
      if (typeof changes === 'string') {
        return JSON.parse(changes);
      }
      return changes;
    } catch {
      return null;
    }
  };

  const getRatingDetails = (changes) => {
    if (!changes || typeof changes !== 'object') return [];

    const ratingFieldMap = {
      rating: 'Overall Rating',
      cleanliness_rating: 'Cleanliness',
      facility_condition: 'Facility Condition',
      equipment_working: 'Equipment Working',
      comment: 'Comment'
    };

    return Object.entries(ratingFieldMap)
      .map(([field, label]) => {
        const rawValue = changes[field];
        if (typeof rawValue === 'undefined' || rawValue === null || rawValue === '') {
          return null;
        }

        let value = rawValue;
        if (field === 'equipment_working') {
          value = rawValue ? 'Yes' : 'No';
        } else if (field === 'facility_condition') {
          value = String(rawValue).replace(/_/g, ' ');
          value = value.charAt(0).toUpperCase() + value.slice(1);
        }

        return {
          key: field,
          label,
          value: String(value)
        };
      })
      .filter(Boolean);
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-slate-100 shadow-[0_12px_28px_rgba(2,6,23,0.4)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-cyan-100">📋 Activity Log</h4>
        <button
          onClick={loadActivityLogs}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-300">Loading activity log...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-400">No activity recorded yet</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.slice(0, 50).map((log) => {
            const isExpanded = expandedLog === log.id;
            const changes = parseChanges(log.changes);
            const isRatingLog = log.action === 'add_rating' || log.entity_type === 'hall_rating';
            const ratingDetails = isRatingLog ? getRatingDetails(changes) : [];

            return (
              <div key={log.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <div
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  className="cursor-pointer flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{getActionIcon(log.action)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-sm font-medium text-slate-100 truncate">{log.entity_name || log.entity_id}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span>{log.performed_by_name || 'System'}</span>
                        {' • '}
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 text-lg flex-shrink-0">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && changes && (
                  <div className="mt-3 rounded border border-slate-700 bg-slate-900/80 p-2 text-xs">
                    <div className="mb-2 font-semibold text-slate-200">{isRatingLog ? 'Rating Details:' : 'Changes:'}</div>
                    {isRatingLog ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {ratingDetails.length > 0 ? (
                          ratingDetails.map((item) => (
                            <div key={item.key} className="text-slate-300">
                              <span className="font-medium">{item.label}:</span> {item.value.substring(0, 120)}
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400">No user-facing rating details available.</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {Object.entries(changes).map(([key, value]) => {
                          if (typeof value === 'object' && value !== null) {
                            const { old: oldVal, new: newVal } = value;
                            return (
                              <div key={key} className="text-slate-300">
                                <span className="font-medium">{key}:</span>
                                {oldVal !== undefined && (
                                  <>
                                    {' '}
                                    <span className="line-through text-rose-300">{String(oldVal).substring(0, 30)}</span>
                                    {' → '}
                                  </>
                                )}
                                <span className="font-medium text-emerald-300">{String(newVal).substring(0, 30)}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={key} className="text-slate-300">
                              <span className="font-medium">{key}:</span> {String(value).substring(0, 40)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-center text-xs text-slate-400">
        Showing latest {Math.min(logs.length, 50)} activities
      </div>
    </div>
  );
};

export default ActivityLogPanel;
