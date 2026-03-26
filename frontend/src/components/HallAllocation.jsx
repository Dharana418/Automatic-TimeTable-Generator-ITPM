import React, { useCallback, useEffect, useState } from 'react';
import ToastMessage from './ToastMessage.jsx';

const AMENITIES = [
  { id: 'projector', label: 'Projector', icon: '🎬' },
  { id: 'wifi', label: 'WiFi', icon: '📡' },
  { id: 'ac', label: 'AC', icon: '❄️' },
  { id: 'lab_equipment', label: 'Lab Equipment', icon: '🔬' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
  { id: 'whiteboard', label: 'Whiteboard', icon: '⚪' },
  { id: 'sound_system', label: 'Sound System', icon: '🔊' },
];

const HallAllocation = ({ apiBase }) => {
  const [halls, setHalls] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddHallModal, setShowAddHallModal] = useState(false);
  const [showEditHallModal, setShowEditHallModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceHallId, setMaintenanceHallId] = useState('');
  const [hallForm, setHallForm] = useState({
    hallId: '',
    hallType: '',
    capacity: '',
    building: '',
    amenities: {},
    status: 'available',
    maintenanceStart: '',
    maintenanceEnd: '',
  });
  const [editHallForm, setEditHallForm] = useState({
    hallId: '',
    hallType: '',
    capacity: '',
    building: '',
    amenities: {},
    status: 'available',
    maintenanceStart: '',
    maintenanceEnd: '',
  });
  const [hallError, setHallError] = useState('');
  const [editHallError, setEditHallError] = useState('');
  const [submittingHall, setSubmittingHall] = useState(false);
  const [submittingEditHall, setSubmittingEditHall] = useState(false);
  const [deletingHallId, setDeletingHallId] = useState('');
  const [hallToDelete, setHallToDelete] = useState('');
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const normalizeHall = useCallback((hall) => {
    let features = hall?.features;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch {
        features = {};
      }
    }
    
    // Ensure amenities is an object, not a string
    if (features && typeof features.amenities === 'string') {
      try {
        features.amenities = JSON.parse(features.amenities);
      } catch {
        features.amenities = {};
      }
    }
    
    return { ...hall, features: features || {}, status: hall.status || 'available' };
  }, []);

  const getHallAvailability = useCallback((hall) => {
    if (hall.status === 'maintenance') {
      return { status: 'maintenance', label: 'Under Maintenance', color: 'bg-red-100 text-red-800' };
    }

    const bookingCount = timetables.filter(t =>
      t.hall_id === hall.id || t.data?.includes(hall.id)
    ).length;

    if (bookingCount > 0) {
      return { status: 'occupied', label: `Occupied (${bookingCount} booking)`, color: 'bg-yellow-100 text-yellow-800' };
    }

    return { status: 'available', label: 'Available', color: 'bg-green-100 text-green-800' };
  }, [timetables]);

  const notifyUser = useCallback(async (title, body) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        new Notification(title, { body });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hallRes, timetableRes] = await Promise.all([
        fetch(`${apiBase}/api/scheduler/halls`, { credentials: 'include' }),
        fetch(`${apiBase}/api/academic-coordinator/timetables`, { credentials: 'include' })
      ]);

      const hallsData = await hallRes.json();
      const timetableData = await timetableRes.json();

      if (hallsData.success) {
        const dbHalls = hallsData.items || hallsData.data || [];
        setHalls(dbHalls.map(normalizeHall));
      }
      if (timetableData.success) setTimetables(timetableData.data || []);
    } catch (err) {
      console.error('Hall allocation load error:', err);
      setToast({ message: 'Failed to load hall allocation data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [apiBase, normalizeHall]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHallInputChange = (e) => {
    const { name, value } = e.target;
    setHallForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditHallInputChange = (e) => {
    const { name, value } = e.target;
    setEditHallForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenityId) => {
    setHallForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityId]: !prev.amenities[amenityId],
      },
    }));
  };

  const handleEditAmenityToggle = (amenityId) => {
    setEditHallForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityId]: !prev.amenities[amenityId],
      },
    }));
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    setHallError('');

    if (!hallForm.hallId || !hallForm.hallType || !hallForm.capacity || !hallForm.building) {
      setHallError('Please fill all hall fields.');
      return;
    }

    const capacityValue = Number(hallForm.capacity);
    if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      setHallError('Capacity must be a positive number.');
      return;
    }

    setSubmittingHall(true);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: hallForm.hallId,
          name: hallForm.hallId,
          capacity: capacityValue,
          features: {
            hallType: hallForm.hallType,
            building: hallForm.building,
            amenities: hallForm.amenities,
          },
          status: hallForm.status,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add hall');
      }

      await loadData();
      setHallForm({
        hallId: '',
        hallType: '',
        capacity: '',
        building: '',
        amenities: {},
        status: 'available',
        maintenanceStart: '',
        maintenanceEnd: '',
      });
      setShowAddHallModal(false);
      setToast({ message: 'Hall added successfully.', type: 'success' });
      await notifyUser('Hall Added', `Hall ${hallForm.hallId} was added successfully.`);
    } catch (err) {
      console.error('Add hall error:', err);
      const errorMessage = err.message || 'Failed to add hall';
      setHallError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      await notifyUser('Hall Add Failed', errorMessage);
    } finally {
      setSubmittingHall(false);
    }
  };

  const executeEditHall = async () => {
    setSubmittingEditHall(true);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls/${editHallForm.hallId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editHallForm.hallId,
          capacity: Number(editHallForm.capacity),
          features: {
            hallType: editHallForm.hallType,
            building: editHallForm.building,
            amenities: editHallForm.amenities,
          },
          status: editHallForm.status,
          maintenanceStart: editHallForm.maintenanceStart,
          maintenanceEnd: editHallForm.maintenanceEnd,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update hall');
      }

      await loadData();
      setShowEditConfirmModal(false);
      setShowEditHallModal(false);
      setToast({ message: 'Hall updated successfully.', type: 'success' });
      await notifyUser('Hall Updated', `Hall ${editHallForm.hallId} was updated successfully.`);
    } catch (err) {
      console.error('Update hall error:', err);
      const errorMessage = err.message || 'Failed to update hall';
      setEditHallError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      await notifyUser('Hall Update Failed', errorMessage);
    } finally {
      setSubmittingEditHall(false);
    }
  };

  const handleEditHall = async (e) => {
    e.preventDefault();
    setEditHallError('');

    if (!editHallForm.hallId || !editHallForm.hallType || !editHallForm.capacity || !editHallForm.building) {
      setEditHallError('Please fill all hall fields.');
      return;
    }

    const capacityValue = Number(editHallForm.capacity);
    if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      setEditHallError('Capacity must be a positive number.');
      return;
    }

    setShowEditConfirmModal(true);
  };

  const openEditHallModal = (hall) => {
    setEditHallForm({
      hallId: hall.id,
      hallType: hall.features?.hallType || '',
      capacity: hall.capacity?.toString() || '',
      building: hall.features?.building || '',
      amenities: hall.features?.amenities || {},
      status: hall.status || 'available',
      maintenanceStart: hall.maintenanceStart || '',
      maintenanceEnd: hall.maintenanceEnd || '',
    });
    setEditHallError('');
    setShowEditHallModal(true);
  };

  const requestDeleteHall = (hallId) => {
    setHallToDelete(hallId);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteHall = async (hallId) => {
    setDeletingHallId(hallId);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls/${hallId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete hall');
      }

      await loadData();
      setShowDeleteConfirmModal(false);
      setHallToDelete('');
      setToast({ message: `Hall ${hallId} deleted successfully.`, type: 'success' });
      await notifyUser('Hall Deleted', `Hall ${hallId} was deleted successfully.`);
    } catch (err) {
      console.error('Delete hall error:', err);
      const errorMessage = err.message || 'Failed to delete hall';
      setToast({ message: errorMessage, type: 'error' });
      await notifyUser('Hall Delete Failed', errorMessage);
    } finally {
      setDeletingHallId('');
    }
  };

  const getFilteredAndSortedHalls = () => {
    let filtered = halls.filter((hall) => {
      const matchesSearch =
        !searchQuery ||
        hall.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hall.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hall.features?.hallType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hall.features?.building?.toLowerCase().includes(searchQuery.toLowerCase());

      const minCap = minCapacity ? Number(minCapacity) : 0;
      const maxCap = maxCapacity ? Number(maxCapacity) : Infinity;
      const hallCapacity = hall.capacity || 0;
      const matchesCapacity = hallCapacity >= minCap && hallCapacity <= maxCap;

      return matchesSearch && matchesCapacity;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'capacity') {
        return (a.capacity || 0) - (b.capacity || 0);
      } else if (sortBy === 'building') {
        return (a.features?.building || '').localeCompare(b.features?.building || '');
      } else {
        return (a.name || '').localeCompare(b.name || '');
      }
    });
  };

  if (loading) return <div className="p-4">Loading Hall Allocation...</div>;

  return (
    <div className="hall-allocation-container p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">🏛️ Hall Allocation</h2>
        <button
          type="button"
          className="dashboard-btn hall-primary-btn"
          onClick={() => {
            setHallForm({
              hallId: '',
              hallType: '',
              capacity: '',
              building: '',
              amenities: {},
              status: 'available',
              maintenanceStart: '',
              maintenanceEnd: '',
            });
            setHallError('');
            setShowAddHallModal(true);
          }}
        >
          + Add Hall
        </button>
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 gap-4">
        {/* Halls */}
        <div className="panel">
          <div className="mb-4">
            <h3 className="mb-3">Available Halls</h3>

            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search by ID, name, type, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Filter and Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Min Capacity</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Max Capacity</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="name">Name</option>
                  <option value="capacity">Capacity</option>
                  <option value="building">Building</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Results</label>
                <div className="flex items-center justify-center h-8 text-sm font-semibold text-slate-700">
                  {getFilteredAndSortedHalls().length} hall(s)
                </div>
              </div>
            </div>
          </div>

          {halls.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No halls found.</div>
          )}
          {getFilteredAndSortedHalls().length === 0 && halls.length > 0 && (
            <div className="p-2 text-sm text-gray-500">No halls match your search or filter criteria.</div>
          )}
          {getFilteredAndSortedHalls().map((hall) => (
            <div key={hall.id} className="p-3 border-b">
              <strong className="text-base">{hall.name || hall.id}</strong>
              <div className="text-sm text-gray-600 mt-1">Capacity: {hall.capacity || '-'}</div>
              <div className="text-sm text-gray-600">Type: {hall.features?.hallType || '-'}</div>
              <div className="text-sm text-gray-600">Building: {hall.features?.building || '-'}</div>

              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Amenities:</div>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => {
                    const isAvailable = hall.features?.amenities?.[amenity.id];
                    return (
                      <div
                        key={amenity.id}
                        className={`inline-flex items-center text-xs rounded-full px-2 py-1 font-medium ${
                          isAvailable
                            ? 'bg-green-100 text-green-900'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        <span>{amenity.icon}</span>
                        <span className="ml-1">{amenity.label}</span>
                        {!isAvailable && <span className="ml-1 text-xs">(unavailable)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const availability = getHallAvailability(hall);
                return (
                  <div className={`mt-2 px-3 py-1 rounded-lg text-sm font-semibold inline-block ${availability.color}`}>
                    {availability.label}
                  </div>
                );
              })()}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="hall-action-btn"
                  onClick={() => openEditHallModal(hall)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="hall-action-btn hall-action-btn--danger"
                  disabled={deletingHallId === hall.id}
                  onClick={() => requestDeleteHall(hall.id)}
                >
                  {deletingHallId === hall.id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="hall-action-btn hall-action-btn--warning"
                  onClick={() => {
                    setMaintenanceHallId(hall.id);
                    setEditHallForm({
                      ...editHallForm,
                      hallId: hall.id,
                      maintenanceStart: '',
                      maintenanceEnd: '',
                    });
                    setShowMaintenanceModal(true);
                  }}
                >
                  Set Maintenance
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Timetables */}
        <div className="panel">
          <h3>Timetables</h3>
          {timetables.map((t) => (
            <div key={t.id} className="p-2 border-b">
              <strong>{t.name}</strong>
              <div>Year {t.year} - Sem {t.semester}</div>
            </div>
          ))}
        </div>
      </div>

      {showAddHallModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowAddHallModal(false);
            setHallError('');
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Hall</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setShowAddHallModal(false);
                  setHallError('');
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHall} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Hall ID</label>
                <input
                  type="text"
                  name="hallId"
                  value={hallForm.hallId}
                  onChange={handleHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. H101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hall Type</label>
                <input
                  type="text"
                  name="hallType"
                  value={hallForm.hallType}
                  onChange={handleHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. Lecture Theatre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={hallForm.capacity}
                  onChange={handleHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Building</label>
                <input
                  type="text"
                  name="building"
                  value={hallForm.building}
                  onChange={handleHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. Main Building"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((amenity) => (
                    <label key={amenity.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={hallForm.amenities[amenity.id] || false}
                        onChange={() => handleAmenityToggle(amenity.id)}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span>{amenity.icon} {amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {hallError && <p className="text-sm text-red-600">{hallError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => {
                    setShowAddHallModal(false);
                    setHallError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn" disabled={submittingHall}>
                  {submittingHall ? 'Saving...' : 'Save Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditHallModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowEditHallModal(false);
            setEditHallError('');
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Hall</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setShowEditHallModal(false);
                  setEditHallError('');
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditHall} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Hall ID</label>
                <input
                  type="text"
                  name="hallId"
                  value={editHallForm.hallId}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hall Type</label>
                <input
                  type="text"
                  name="hallType"
                  value={editHallForm.hallType}
                  onChange={handleEditHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={editHallForm.capacity}
                  onChange={handleEditHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Building</label>
                <input
                  type="text"
                  name="building"
                  value={editHallForm.building}
                  onChange={handleEditHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((amenity) => (
                    <label key={amenity.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={editHallForm.amenities[amenity.id] || false}
                        onChange={() => handleEditAmenityToggle(amenity.id)}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span>{amenity.icon} {amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editHallError && <p className="text-sm text-red-600">{editHallError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => {
                    setShowEditHallModal(false);
                    setEditHallError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn" disabled={submittingEditHall}>
                  {submittingEditHall ? 'Updating...' : 'Update Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowEditConfirmModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-slate-800">Confirm Hall Update</h3>
            <p className="mt-2 text-sm text-slate-600">
              Save changes for hall <span className="font-semibold text-slate-800">{editHallForm.hallId}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700"
                onClick={() => setShowEditConfirmModal(false)}
              >
                Back
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={executeEditHall}
                disabled={submittingEditHall}
              >
                {submittingEditHall ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowDeleteConfirmModal(false);
            setHallToDelete('');
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-red-700">Delete Hall</h3>
            <p className="mt-2 text-sm text-slate-600">
              This action will permanently remove hall <span className="font-semibold text-slate-800">{hallToDelete}</span>.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setHallToDelete('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={() => executeDeleteHall(hallToDelete)}
                disabled={!hallToDelete || deletingHallId === hallToDelete}
              >
                {deletingHallId === hallToDelete ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMaintenanceModal(false);
            setMaintenanceHallId('');
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Set Maintenance Period</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setMaintenanceHallId('');
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const hallIndex = halls.findIndex(h => h.id === maintenanceHallId);
                if (hallIndex >= 0) {
                  const updatedHalls = [...halls];
                  updatedHalls[hallIndex] = {
                    ...updatedHalls[hallIndex],
                    status: 'maintenance',
                    maintenanceStart: editHallForm.maintenanceStart,
                    maintenanceEnd: editHallForm.maintenanceEnd,
                  };
                  setHalls(updatedHalls);
                  setToast({ message: `Hall ${maintenanceHallId} set to maintenance.`, type: 'success' });
                  notifyUser('Maintenance Scheduled', `Hall ${maintenanceHallId} is now under maintenance.`);
                }
                setShowMaintenanceModal(false);
                setMaintenanceHallId('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Maintenance Start Date</label>
                <input
                  type="date"
                  value={editHallForm.maintenanceStart}
                  onChange={(e) => {
                    const updatedForm = { ...editHallForm, maintenanceStart: e.target.value };
                    setEditHallForm(updatedForm);
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Maintenance End Date</label>
                <input
                  type="date"
                  value={editHallForm.maintenanceEnd}
                  onChange={(e) => {
                    const updatedForm = { ...editHallForm, maintenanceEnd: e.target.value };
                    setEditHallForm(updatedForm);
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setMaintenanceHallId('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn">
                  Set Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallAllocation;