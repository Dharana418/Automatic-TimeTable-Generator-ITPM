import React, { useEffect, useMemo, useState } from 'react';
import schedulerApi from '../api/scheduler';

const SmartRecommendationsPanel = ({ apiBase }) => {
  const [moduleId, setModuleId] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [requiredResources, setRequiredResources] = useState('');
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const COMMON_RESOURCES = [
    'projector',
    'wifi',
    'ac',
    'lab_equipment',
    'accessibility',
    'whiteboard',
    'sound_system'
  ];

  useEffect(() => {
    let isMounted = true;

    const loadModules = async () => {
      try {
        setLoadingModules(true);
        const response = await schedulerApi.listItems('modules');
        const list = Array.isArray(response?.items) ? response.items : [];
        if (isMounted) {
          setModules(list);
        }
      } catch (error) {
        console.error('Error loading modules for recommendations:', error);
        if (isMounted) {
          setToast({ message: 'Failed to load modules list', type: 'error' });
        }
      } finally {
        if (isMounted) {
          setLoadingModules(false);
        }
      }
    };

    loadModules();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedModule = useMemo(
    () => modules.find((item) => String(item?.id || '') === String(moduleId || '')) || null,
    [modules, moduleId]
  );

  const moduleOptions = useMemo(() => {
    return modules
      .map((item) => {
        const id = String(item?.id || '').trim();
        if (!id) return null;
        const code = String(item?.code || item?.module_code || '').trim();
        const name = String(item?.name || item?.module_name || '').trim();
        const batch = Number(item?.batch_size);
        const batchLabel = Number.isFinite(batch) && batch > 0 ? ` | Batch ${batch}` : '';
        const labelMain = [code, name].filter(Boolean).join(' - ');
        const label = `${labelMain || id}${batchLabel}`;

        return { value: id, label };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [modules]);

  const handleModuleChange = (nextModuleId) => {
    setModuleId(nextModuleId);

    const picked = modules.find((item) => String(item?.id || '') === String(nextModuleId || ''));
    const inferredBatch = Number(picked?.batch_size);
    if (Number.isInteger(inferredBatch) && inferredBatch > 0) {
      setBatchSize(String(inferredBatch));
    }
  };

  const handleGetRecommendations = async (e) => {
    e.preventDefault();

    const normalizedModuleId = String(moduleId || '').trim();
    const parsedBatchSize = Number(batchSize);

    if (!normalizedModuleId) {
      setToast({ message: 'Please enter a module ID', type: 'error' });
      return;
    }

    if (!Number.isInteger(parsedBatchSize) || parsedBatchSize < 1 || parsedBatchSize > 2000) {
      setToast({ message: 'Batch size must be an integer between 1 and 2000', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const resourceList = requiredResources
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0)
        .slice(0, 20);

      if (resourceList.some((resource) => resource.length > 40)) {
        setToast({ message: 'Each resource name must be 40 characters or fewer', type: 'error' });
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('moduleId', normalizedModuleId);
      params.append('batchSize', String(parsedBatchSize));
      if (resourceList.length > 0) {
        params.append('requiredResources', JSON.stringify(resourceList));
      }

      const res = await fetch(`${apiBase}/api/halls/recommendations/suggest?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
        setShowRecommendations(true);
        setToast({ message: `Found ${data.recommendations.length} hall(s)`, type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to get recommendations', type: 'error' });
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setToast({ message: 'Error fetching recommendations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityLabel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-300' };
    if (score >= 75) return { label: 'Very Good', color: 'text-cyan-300' };
    if (score >= 60) return { label: 'Good', color: 'text-amber-300' };
    return { label: 'Fair', color: 'text-orange-300' };
  };

  const toggleResource = (resource) => {
    const resources = requiredResources.split(',').map(r => r.trim()).filter(r => r);
    const index = resources.indexOf(resource);
    
    if (index >= 0) {
      resources.splice(index, 1);
    } else {
      resources.push(resource);
    }
    
    setRequiredResources(resources.join(', '));
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-[0_14px_30px_rgba(2,6,23,0.45)]">
      <div className="mb-3">
        <h4 className="font-semibold text-cyan-100">🎯 Smart Hall Recommendations</h4>
        <p className="mt-1 text-xs text-slate-300">Get personalized hall suggestions based on class size and equipment needs</p>
      </div>

      {toast && (
        <div className={`mb-3 rounded border p-2 text-sm ${toast.type === 'success' ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200' : 'border-rose-500/60 bg-rose-950/70 text-rose-200'}`}>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleGetRecommendations} className="mb-4 space-y-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-200">Module ID *</label>
            <select
              value={moduleId}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              disabled={loadingModules}
              required
            >
              <option value="">{loadingModules ? 'Loading modules...' : 'Select a module'}</option>
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedModule && (
              <p className="mt-1 text-[11px] text-slate-400">
                Selected: {selectedModule.code || selectedModule.module_code || selectedModule.id}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-200">Batch Size *</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              placeholder="Number of students"
              min="1"
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-200">Required Equipment/Resources</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {COMMON_RESOURCES.map(resource => {
                const isSelected = requiredResources
                  .split(',')
                  .map(r => r.trim())
                  .includes(resource);
                
                return (
                  <button
                    key={resource}
                    type="button"
                    onClick={() => toggleResource(resource)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {resource.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
            <textarea
              value={requiredResources}
              onChange={(e) => setRequiredResources(e.target.value)}
              placeholder="Or enter comma-separated resources: projector, wifi, ac, lab_equipment"
              className="h-12 w-full resize-none rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:bg-slate-700"
        >
          {loading ? 'Finding halls...' : '🔍 Get Recommendations'}
        </button>
      </form>

      {showRecommendations && recommendations.length > 0 && (
        <div>
          <h5 className="mb-3 text-sm font-semibold text-cyan-100">Recommended Halls</h5>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recommendations.map((rec, idx) => {
              const suitability = getSuitabilityLabel(rec.score);
              
              return (
                <div key={`${rec.hallId}-${idx}`} className="rounded-lg border border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-slate-100">{rec.hallName}</div>
                      <div className="text-xs text-slate-300">Capacity: <span className="font-medium">{rec.capacity} students</span></div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${suitability.color}`}>{rec.score}</div>
                      <div className={`text-xs font-medium ${suitability.color}`}>{suitability.label}</div>
                    </div>
                  </div>

                  {rec.matchingResources.length > 0 && (
                    <div className="mb-2">
                      <div className="mb-1 text-xs font-medium text-emerald-300">✓ Available:</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.matchingResources.map(res => (
                          <span key={res} className="inline-block rounded border border-emerald-500/60 bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-200">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.missingResources.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-amber-300">✗ Missing:</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.missingResources.map(res => (
                          <span key={res} className="inline-block rounded border border-amber-500/60 bg-amber-950/60 px-2 py-0.5 text-xs text-amber-200">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-300">
                    <span>📦 {rec.totalResources} resources</span>
                    {' • '}
                    <span>✨ {rec.goodConditionResources} in good condition</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showRecommendations && recommendations.length === 0 && (
        <div className="rounded-lg border border-amber-500/60 bg-amber-950/60 p-3 text-xs text-amber-200">
          No halls found matching your criteria. Try increasing batch size tolerance or reducing resource requirements.
        </div>
      )}
    </div>
  );
};

export default SmartRecommendationsPanel;
