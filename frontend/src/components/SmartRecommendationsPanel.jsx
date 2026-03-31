import React, { useState } from 'react';

const SmartRecommendationsPanel = ({ apiBase }) => {
  const [moduleId, setModuleId] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [requiredResources, setRequiredResources] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const COMMON_RESOURCES = [
    'projector',
    'wifi',
    'ac',
    'lab_equipment',
    'whiteboard',
    'sound_system',
    'computers',
    'microscopes'
  ];

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
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { label: 'Very Good', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Good', color: 'text-yellow-600' };
    return { label: 'Fair', color: 'text-orange-600' };
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 mt-4">
      <div className="mb-3">
        <h4 className="font-semibold text-slate-800">🎯 Smart Hall Recommendations</h4>
        <p className="text-xs text-slate-600 mt-1">Get personalized hall suggestions based on class size and equipment needs</p>
      </div>

      {toast && (
        <div className={`mb-3 p-2 rounded text-sm ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleGetRecommendations} className="space-y-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Module ID *</label>
            <input
              type="text"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="e.g., CS101"
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Batch Size *</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              placeholder="Number of students"
              min="1"
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium mb-2 block">Required Equipment/Resources</label>
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
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
              className="w-full border rounded px-2 py-1.5 text-xs h-12 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Finding halls...' : '🔍 Get Recommendations'}
        </button>
      </form>

      {showRecommendations && recommendations.length > 0 && (
        <div>
          <h5 className="font-semibold text-slate-800 mb-3 text-sm">Recommended Halls</h5>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recommendations.map((rec, idx) => {
              const suitability = getSuitabilityLabel(rec.score);
              
              return (
                <div key={`${rec.hallId}-${idx}`} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-slate-800">{rec.hallName}</div>
                      <div className="text-xs text-slate-600">Capacity: <span className="font-medium">{rec.capacity} students</span></div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${suitability.color}`}>{rec.score}</div>
                      <div className={`text-xs font-medium ${suitability.color}`}>{suitability.label}</div>
                    </div>
                  </div>

                  {rec.matchingResources.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-green-700 mb-1">✓ Available:</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.matchingResources.map(res => (
                          <span key={res} className="inline-block px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.missingResources.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-orange-700 mb-1">✗ Missing:</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.missingResources.map(res => (
                          <span key={res} className="inline-block px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-600">
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
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          No halls found matching your criteria. Try increasing batch size tolerance or reducing resource requirements.
        </div>
      )}
    </div>
  );
};

export default SmartRecommendationsPanel;
