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
    <div className="rounded-lg border border-slate-200 bg-white p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800">📦 Hall Resources</h4>
        <button
          onClick={() => setShowAddResource(!showAddResource)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddResource ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>

      {toast && (
        <div className={`mb-3 p-2 rounded text-sm ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {showAddResource && (
        <form onSubmit={handleAddResource} className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium">Type</label>
              <select
                value={resourceForm.resourceType}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                {RESOURCE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Condition</label>
              <select
                value={resourceForm.condition}
                onChange={(e) => setResourceForm({ ...resourceForm, condition: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs font-medium">Name</label>
              <input
                type="text"
                value={resourceForm.resourceName}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceName: e.target.value })}
                placeholder="e.g., Projector"
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                value={resourceForm.quantity}
                onChange={(e) => setResourceForm({ ...resourceForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium">Notes</label>
            <input
              type="text"
              value={resourceForm.notes}
              onChange={(e) => setResourceForm({ ...resourceForm, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <button type="submit" className="w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            Add Resource
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading resources...</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-slate-500">No resources added yet</p>
      ) : (
        <div className="space-y-2">
          {resources.map(resource => (
            <div key={resource.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-800">{resource.resource_name}</div>
                  <div className="text-xs text-slate-600">{resource.resource_type} • Qty: {resource.quantity}</div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    resource.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                    resource.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                    resource.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {resource.condition}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                >
                  Delete
                </button>
              </div>
              {resource.notes && <div className="text-xs text-slate-600 mt-1">Note: {resource.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallResourcesPanel;
