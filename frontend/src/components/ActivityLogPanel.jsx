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
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'assign_resource': return 'bg-purple-100 text-purple-800';
      case 'remove_resource': return 'bg-orange-100 text-orange-800';
      case 'add_rating': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800">📋 Activity Log</h4>
        <button
          onClick={loadActivityLogs}
          className="px-3 py-1 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading activity log...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-500">No activity recorded yet</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.slice(0, 50).map((log) => {
            const isExpanded = expandedLog === log.id;
            const changes = parseChanges(log.changes);

            return (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
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
                        <span className="text-sm font-medium text-slate-800 truncate">{log.entity_name || log.entity_id}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        <span>{log.performed_by_name || 'System'}</span>
                        {' • '}
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-lg flex-shrink-0">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && changes && (
                  <div className="mt-3 p-2 bg-white rounded border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-700 mb-2">Changes:</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {Object.entries(changes).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                          const { old: oldVal, new: newVal } = value;
                          return (
                            <div key={key} className="text-slate-600">
                              <span className="font-medium">{key}:</span>
                              {oldVal !== undefined && (
                                <>
                                  {' '}
                                  <span className="line-through text-red-600">{String(oldVal).substring(0, 30)}</span>
                                  {' → '}
                                </>
                              )}
                              <span className="text-green-600 font-medium">{String(newVal).substring(0, 30)}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="text-slate-600">
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 40)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600 text-center">
        Showing latest {Math.min(logs.length, 50)} activities
      </div>
    </div>
  );
};

export default ActivityLogPanel;
