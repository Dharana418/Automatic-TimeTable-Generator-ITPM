import React, { useState, useCallback, useEffect } from 'react';

const HallResourcesPanel = ({ hallId, apiBase }) => {
  const [resources, setResources] = useState([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    resourceType: 'equipment',
    resourceName: '',
    quantity: 1,
    condition: 'good',
    notes: ''
  });
  const [toast, setToast] = useState(null);

  const RESOURCE_TYPES = [
    { id: 'equipment', label: 'Equipment' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'technology', label: 'Technology' },
    { id: 'supplies', label: 'Supplies' }
  ];

  const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/halls/${hallId}/resources`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  }, [hallId, apiBase]);

  useEffect(() => {
    if (hallId) {
      loadResources();
    }
  }, [hallId, loadResources]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    const resourceName = String(resourceForm.resourceName || '').trim();
    const quantity = Number(resourceForm.quantity);
    const notes = String(resourceForm.notes || '').trim();

    if (!resourceName) {
      setToast({ message: 'Resource name is required', type: 'error' });
      return;
    }

    if (resourceName.length < 2 || resourceName.length > 120) {
      setToast({ message: 'Resource name must be between 2 and 120 characters', type: 'error' });
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      setToast({ message: 'Quantity must be an integer between 1 and 500', type: 'error' });
      return;
    }

    if (notes.length > 500) {
      setToast({ message: 'Notes cannot exceed 500 characters', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/halls/resources`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId,
          ...resourceForm,
          resourceName,
          quantity,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Resource added successfully', type: 'success' });
        loadResources();
        setResourceForm({ resourceType: 'equipment', resourceName: '', quantity: 1, condition: 'good', notes: '' });
        setShowAddResource(false);
      } else {
        setToast({ message: data.error || 'Failed to add resource', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      setToast({ message: 'Error adding resource', type: 'error' });
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`${apiBase}/api/halls/resources/${resourceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Resource deleted', type: 'success' });
        loadResources();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      setToast({ message: 'Error deleting resource', type: 'error' });
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-slate-100 shadow-[0_12px_28px_rgba(2,6,23,0.4)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-cyan-100">📦 Hall Resources</h4>
        <button
          onClick={() => setShowAddResource(!showAddResource)}
          className="rounded-lg border border-cyan-500/60 bg-cyan-800/70 px-3 py-1 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-700/80"
        >
          {showAddResource ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>

      {toast && (
        <div className={`mb-3 rounded-lg border p-2 text-sm ${toast.type === 'success' ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200' : 'border-rose-500/60 bg-rose-950/70 text-rose-200'}`}>
          {toast.message}
        </div>
      )}

      {showAddResource && (
        <form onSubmit={handleAddResource} className="mb-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium text-slate-200">Type</label>
              <select
                value={resourceForm.resourceType}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              >
                {RESOURCE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-200">Condition</label>
              <select
                value={resourceForm.condition}
                onChange={(e) => setResourceForm({ ...resourceForm, condition: e.target.value })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium text-slate-200">Name</label>
              <input
                type="text"
                value={resourceForm.resourceName}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceName: e.target.value })}
                placeholder="e.g., Projector"
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-200">Quantity</label>
              <input
                type="number"
                min="1"
                value={resourceForm.quantity}
                onChange={(e) => setResourceForm({ ...resourceForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-slate-200">Notes</label>
            <input
              type="text"
              value={resourceForm.notes}
              onChange={(e) => setResourceForm({ ...resourceForm, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className="w-full rounded border border-emerald-500/60 bg-emerald-900/70 px-2 py-1 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-800/80">
            Add Resource
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-300">Loading resources...</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-slate-400">No resources added yet</p>
      ) : (
        <div className="space-y-2">
          {resources.map(resource => (
            <div key={resource.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-100">{resource.resource_name}</div>
                  <div className="text-xs text-slate-300">{resource.resource_type} • Qty: {resource.quantity}</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    resource.condition === 'excellent' ? 'border border-emerald-500/60 bg-emerald-950/70 text-emerald-200' :
                    resource.condition === 'good' ? 'border border-cyan-500/60 bg-cyan-950/70 text-cyan-200' :
                    resource.condition === 'fair' ? 'border border-amber-500/60 bg-amber-950/70 text-amber-200' :
                    'border border-rose-500/60 bg-rose-950/70 text-rose-200'
                  }`}>
                    {resource.condition}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="text-xs font-medium text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
              {resource.notes && <div className="mt-1 text-xs text-slate-300">Note: {resource.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallResourcesPanel;
