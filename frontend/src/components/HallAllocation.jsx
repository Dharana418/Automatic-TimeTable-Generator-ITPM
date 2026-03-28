import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastMessage from './ToastMessage.jsx';
import HallResourcesPanel from './HallResourcesPanel.jsx';
import HallRatingsPanel from './HallRatingsPanel.jsx';
import ActivityLogPanel from './ActivityLogPanel.jsx';
import SmartRecommendationsPanel from './SmartRecommendationsPanel.jsx';

const AMENITIES = [
  { id: 'projector', label: 'Projector', icon: '🎬' },
  { id: 'wifi', label: 'WiFi', icon: '📡' },
  { id: 'ac', label: 'AC', icon: '❄️' },
  { id: 'lab_equipment', label: 'Lab Equipment', icon: '🔬' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
  { id: 'whiteboard', label: 'Whiteboard', icon: '⚪' },
  { id: 'sound_system', label: 'Sound System', icon: '🔊' },
];

const HALL_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/;
const HALL_TEXT_REGEX = /^[A-Za-z0-9][A-Za-z0-9 .,&()/-]{1,79}$/;

const normalizeHallForm = (form) => ({
  hallId: String(form.hallId || '').trim(),
  hallType: String(form.hallType || '').trim(),
  capacity: String(form.capacity || '').trim(),
  building: String(form.building || '').trim(),
  floor: String(form.floor || '').trim(),
  amenities: form.amenities || {},
  maintenanceStart: String(form.maintenanceStart || '').trim(),
  maintenanceEnd: String(form.maintenanceEnd || '').trim(),
});

const validateHallFormPayload = (form, { validateId = true } = {}) => {
  const normalized = normalizeHallForm(form);

  if (validateId && !HALL_ID_REGEX.test(normalized.hallId)) {
    return 'Hall ID must be 2-40 characters with letters, numbers, underscore, or hyphen.';
  }

  if (!normalized.hallType || normalized.hallType.length < 2 || normalized.hallType.length > 60) {
    return 'Hall type must be between 2 and 60 characters.';
  }

  if (!normalized.building || normalized.building.length < 2 || normalized.building.length > 80) {
    return 'Building must be between 2 and 80 characters.';
  }

  if (!HALL_TEXT_REGEX.test(normalized.hallType) || !HALL_TEXT_REGEX.test(normalized.building)) {
    return 'Hall type and building can only include letters, numbers, spaces, and . , & ( ) / -';
  }

  if (normalized.floor && normalized.floor.length > 30) {
    return 'Floor cannot exceed 30 characters.';
  }

  const capacityValue = Number(normalized.capacity);
  if (!Number.isInteger(capacityValue) || capacityValue < 1 || capacityValue > 2000) {
    return 'Capacity must be an integer between 1 and 2000.';
  }

  if ((normalized.maintenanceStart && !normalized.maintenanceEnd) || (!normalized.maintenanceStart && normalized.maintenanceEnd)) {
    return 'Please provide both maintenance start and end dates.';
  }

  if (normalized.maintenanceStart && normalized.maintenanceEnd && normalized.maintenanceEnd < normalized.maintenanceStart) {
    return 'Maintenance end date must be on or after the start date.';
  }

  return null;
};

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
    floor: '',
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
    floor: '',
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
  const [groupBy, setGroupBy] = useState('building');
  const [viewMode, setViewMode] = useState('card');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [compareSelection, setCompareSelection] = useState([]);
  const [similarCapacity, setSimilarCapacity] = useState('');
  const [capacityTolerance, setCapacityTolerance] = useState('15');
  const [selectedHall, setSelectedHall] = useState(null);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const pageSize = 8;

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

  const getHallBookingCount = useCallback((hall) => {
    return timetables.filter((t) => t.hall_id === hall.id || t.data?.includes(hall.id)).length;
  }, [timetables]);

  const getHallAvailability = useCallback((hall) => {
    if (hall.status === 'maintenance') {
      return { status: 'maintenance', label: 'Under Maintenance', color: 'bg-red-100 text-red-800' };
    }

    const bookingCount = getHallBookingCount(hall);

    if (bookingCount > 0) {
      return { status: 'occupied', label: `Occupied (${bookingCount} booking)`, color: 'bg-yellow-100 text-yellow-800' };
    }

    return { status: 'available', label: 'Available', color: 'bg-green-100 text-green-800' };
  }, [getHallBookingCount]);

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

    const validationError = validateHallFormPayload(hallForm, { validateId: true });
    if (validationError) {
      setHallError(validationError);
      return;
    }

    const normalizedForm = normalizeHallForm(hallForm);
    const capacityValue = Number(normalizedForm.capacity);

    setSubmittingHall(true);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: normalizedForm.hallId,
          name: normalizedForm.hallId,
          capacity: capacityValue,
          features: {
            hallType: normalizedForm.hallType,
            building: normalizedForm.building,
            floor: normalizedForm.floor,
            amenities: normalizedForm.amenities,
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
        floor: '',
        amenities: {},
        status: 'available',
        maintenanceStart: '',
        maintenanceEnd: '',
      });
      setShowAddHallModal(false);
      setToast({ message: 'Hall added successfully.', type: 'success' });
      await notifyUser('Hall Added', `Hall ${normalizedForm.hallId} was added successfully.`);
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
            floor: editHallForm.floor,
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

    const validationError = validateHallFormPayload(editHallForm, { validateId: false });
    if (validationError) {
      setEditHallError(validationError);
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
      floor: hall.features?.floor || hall.floor || '',
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

  const getFilteredAndSortedHalls = useCallback(() => {
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
  }, [halls, searchQuery, minCapacity, maxCapacity, sortBy]);

  const getHallFloor = useCallback((hall) => {
    return hall.features?.floor || hall.floor || 'Unspecified Floor';
  }, []);

  const getGroupValue = useCallback((hall) => {
    if (groupBy === 'floor') {
      return getHallFloor(hall);
    }
    return hall.features?.building || 'Unspecified Building';
  }, [getHallFloor, groupBy]);

  const filteredHalls = useMemo(() => getFilteredAndSortedHalls(), [getFilteredAndSortedHalls]);
  const totalPages = Math.max(1, Math.ceil(filteredHalls.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, minCapacity, maxCapacity, sortBy, groupBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedHalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHalls.slice(start, start + pageSize);
  }, [filteredHalls, currentPage]);

  const groupedHalls = useMemo(() => {
    return paginatedHalls.reduce((acc, hall) => {
      const group = getGroupValue(hall);
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(hall);
      return acc;
    }, {});
  }, [paginatedHalls, getGroupValue]);

  const groupKeys = useMemo(() => Object.keys(groupedHalls).sort((a, b) => a.localeCompare(b)), [groupedHalls]);

  useEffect(() => {
    setCollapsedSections((prev) => {
      const next = { ...prev };
      groupKeys.forEach((key) => {
        if (typeof next[key] === 'undefined') {
          next[key] = false;
        }
      });
      return next;
    });
  }, [groupKeys]);

  const toggleCompareHall = (hallId) => {
    setCompareSelection((prev) => {
      if (prev.includes(hallId)) {
        return prev.filter((id) => id !== hallId);
      }
      if (prev.length >= 2) {
        return [prev[1], hallId];
      }
      return [...prev, hallId];
    });
  };

  const comparedHalls = useMemo(() => {
    return halls.filter((hall) => compareSelection.includes(hall.id));
  }, [halls, compareSelection]);

  const totalHallCount = halls.length;

  const typeBreakdown = useMemo(() => {
    return halls.reduce((acc, hall) => {
      const key = hall.features?.hallType || 'Unspecified Type';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [halls]);

  const buildingBreakdown = useMemo(() => {
    return halls.reduce((acc, hall) => {
      const key = hall.features?.building || 'Unspecified Building';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [halls]);

  const statusBreakdown = useMemo(() => {
    return halls.reduce((acc, hall) => {
      const availability = getHallAvailability(hall);
      acc[availability.status] = (acc[availability.status] || 0) + 1;
      return acc;
    }, { available: 0, occupied: 0, maintenance: 0 });
  }, [halls, getHallAvailability]);

  const totalCapacity = useMemo(() => {
    return halls.reduce((sum, hall) => sum + (Number(hall.capacity) || 0), 0);
  }, [halls]);

  const occupiedCapacity = useMemo(() => {
    return halls.reduce((sum, hall) => {
      if (getHallBookingCount(hall) > 0) {
        return sum + (Number(hall.capacity) || 0);
      }
      return sum;
    }, 0);
  }, [halls, getHallBookingCount]);

  const capacityUtilizationPercent = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0;

  const buildingUtilization = useMemo(() => {
    const base = halls.reduce((acc, hall) => {
      const building = hall.features?.building || 'Unspecified Building';
      const cap = Number(hall.capacity) || 0;
      if (!acc[building]) {
        acc[building] = { total: 0, occupied: 0 };
      }
      acc[building].total += cap;
      if (getHallBookingCount(hall) > 0) {
        acc[building].occupied += cap;
      }
      return acc;
    }, {});

    return Object.entries(base)
      .map(([building, values]) => ({
        building,
        total: values.total,
        occupied: values.occupied,
        percent: values.total > 0 ? Math.round((values.occupied / values.total) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [halls, getHallBookingCount]);

  const similarCapacityHalls = useMemo(() => {
    const target = Number(similarCapacity);
    const tolerance = Number(capacityTolerance);
    if (!Number.isFinite(target) || target <= 0) {
      return [];
    }

    const windowSize = Number.isFinite(tolerance) && tolerance >= 0 ? tolerance : 15;
    return halls
      .map((hall) => {
        const hallCapacity = Number(hall.capacity) || 0;
        return { hall, diff: Math.abs(hallCapacity - target) };
      })
      .filter((item) => item.diff <= windowSize)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 8);
  }, [halls, similarCapacity, capacityTolerance]);

  if (loading) return <div className="p-4">Loading Hall Allocation...</div>;

  return (
    <div className="hall-allocation-container p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">🏛️ Hall Allocation</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="dashboard-btn hall-primary-btn"
            onClick={() => setShowRecommendationsModal(true)}
          >
            🎯 Get Recommendations
          </button>
          <button
            type="button"
            className="dashboard-btn hall-primary-btn"
            onClick={() => {
              setHallForm({
                hallId: '',
                hallType: '',
                capacity: '',
                building: '',
                floor: '',
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
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Halls */}
        <div className="panel xl:col-span-2">
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
                  {filteredHalls.length} hall(s)
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="building">Building</option>
                  <option value="floor">Floor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">View Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-sm border ${viewMode === 'card' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'}`}
                    onClick={() => setViewMode('card')}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-sm border ${viewMode === 'table' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'}`}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Compare</label>
                <div className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center">
                  {compareSelection.length}/2 selected
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Page</label>
                <div className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center justify-center">
                  {currentPage}/{totalPages}
                </div>
              </div>
            </div>

            {comparedHalls.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Hall Comparison</h4>
                  <button
                    type="button"
                    className="text-xs text-slate-600 hover:text-slate-900"
                    onClick={() => setCompareSelection([])}
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparedHalls.map((hall) => (
                    <div key={hall.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-sm font-semibold text-slate-800">{hall.name || hall.id}</div>
                      <div className="mt-2 text-xs text-slate-600">Capacity: <span className="font-medium">{hall.capacity || '-'}</span></div>
                      <div className="text-xs text-slate-600">Type: <span className="font-medium">{hall.features?.hallType || '-'}</span></div>
                      <div className="text-xs text-slate-600">Building: <span className="font-medium">{hall.features?.building || '-'}</span></div>
                      <div className="text-xs text-slate-600">Floor: <span className="font-medium">{getHallFloor(hall)}</span></div>
                    </div>
                  ))}
                  {comparedHalls.length === 1 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500 flex items-center justify-center">
                      Select one more hall to compare side by side.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {halls.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No halls found.</div>
          )}
          {filteredHalls.length === 0 && halls.length > 0 && (
            <div className="p-2 text-sm text-gray-500">No halls match your search or filter criteria.</div>
          )}
          {groupKeys.map((groupKey) => {
            const hallsInGroup = groupedHalls[groupKey] || [];
            const isCollapsed = collapsedSections[groupKey];

            return (
              <div key={groupKey} className="border rounded-lg overflow-hidden mb-3">
                <button
                  type="button"
                  className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 flex items-center justify-between text-left"
                  onClick={() => setCollapsedSections((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                >
                  <span className="font-semibold text-slate-800">{groupBy === 'floor' ? 'Floor' : 'Building'}: {groupKey}</span>
                  <span className="text-xs text-slate-600">{hallsInGroup.length} hall(s) {isCollapsed ? '▸' : '▾'}</span>
                </button>

                {!isCollapsed && viewMode === 'card' && hallsInGroup.map((hall) => (
                  <div key={hall.id} className="p-3 border-b last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-base">{hall.name || hall.id}</strong>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded-md border ${compareSelection.includes(hall.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                        onClick={() => toggleCompareHall(hall.id)}
                      >
                        {compareSelection.includes(hall.id) ? 'Selected' : 'Compare'}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Capacity: {hall.capacity || '-'}</div>
                    <div className="text-sm text-gray-600">Type: {hall.features?.hallType || '-'}</div>
                    <div className="text-sm text-gray-600">Building: {hall.features?.building || '-'}</div>
                    <div className="text-sm text-gray-600">Floor: {getHallFloor(hall)}</div>

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

                    <div className="mt-2 flex gap-2 flex-wrap">
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
                      <button
                        type="button"
                        className="hall-action-btn"
                        style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                        onClick={() => setSelectedHall(hall)}
                      >
                        📋 Details
                      </button>
                    </div>
                  </div>
                ))}

                {!isCollapsed && viewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Hall</th>
                          <th className="px-3 py-2 text-left font-semibold">Capacity</th>
                          <th className="px-3 py-2 text-left font-semibold">Type</th>
                          <th className="px-3 py-2 text-left font-semibold">Floor</th>
                          <th className="px-3 py-2 text-left font-semibold">Status</th>
                          <th className="px-3 py-2 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hallsInGroup.map((hall) => {
                          const availability = getHallAvailability(hall);
                          return (
                            <tr key={hall.id} className="border-t">
                              <td className="px-3 py-2 font-medium text-slate-800">{hall.name || hall.id}</td>
                              <td className="px-3 py-2">{hall.capacity || '-'}</td>
                              <td className="px-3 py-2">{hall.features?.hallType || '-'}</td>
                              <td className="px-3 py-2">{getHallFloor(hall)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${availability.color}`}>
                                  {availability.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    className={`px-2 py-1 text-xs rounded-md border ${compareSelection.includes(hall.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                                    onClick={() => toggleCompareHall(hall.id)}
                                  >
                                    {compareSelection.includes(hall.id) ? 'Selected' : 'Compare'}
                                  </button>
                                  <button type="button" className="hall-action-btn" onClick={() => openEditHallModal(hall)}>Edit</button>
                                  <button
                                    type="button"
                                    className="hall-action-btn hall-action-btn--danger"
                                    disabled={deletingHallId === hall.id}
                                    onClick={() => requestDeleteHall(hall.id)}
                                  >
                                    {deletingHallId === hall.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {filteredHalls.length > pageSize && (
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div className="text-xs text-slate-600">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredHalls.length)} of {filteredHalls.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timetables */}
        <div className="space-y-4">
          <div className="panel xl:sticky xl:top-4">
            <h3 className="mb-3">Insights</h3>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-600">Total Halls</div>
                <div className="text-xl font-bold text-slate-900">{totalHallCount}</div>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="text-xs text-green-700">Available</div>
                <div className="text-xl font-bold text-green-800">{statusBreakdown.available}</div>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <div className="text-xs text-yellow-700">Occupied</div>
                <div className="text-xl font-bold text-yellow-800">{statusBreakdown.occupied}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="text-xs text-red-700">Maintenance</div>
                <div className="text-xl font-bold text-red-800">{statusBreakdown.maintenance}</div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 mb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Capacity Utilization</div>
                  <div className="text-xs text-slate-600">Booked vs total seats</div>
                </div>
                <div className="text-lg font-bold text-slate-900">{capacityUtilizationPercent}%</div>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${capacityUtilizationPercent}%` }} />
              </div>
              <div className="mt-2 text-xs text-slate-600">{occupiedCapacity} / {totalCapacity} seats allocated</div>

              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">By Building</div>
                <div className="space-y-2">
                  {buildingUtilization.map((item) => (
                    <div key={item.building}>
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span>{item.building}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                  {buildingUtilization.length === 0 && <div className="text-xs text-slate-500">No utilization data yet.</div>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">Breakdown by Hall Type</div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {Object.entries(typeBreakdown).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{type}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(typeBreakdown).length === 0 && <div className="text-xs text-slate-500">No type data.</div>}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">Breakdown by Building</div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {Object.entries(buildingBreakdown).map(([building, count]) => (
                    <div key={building} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{building}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(buildingBreakdown).length === 0 && <div className="text-xs text-slate-500">No building data.</div>}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-sm font-semibold text-slate-800 mb-2">Find Similar Capacity Halls</div>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="number"
                  placeholder="Target capacity"
                  value={similarCapacity}
                  onChange={(e) => setSimilarCapacity(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Tolerance (+/-)"
                  value={capacityTolerance}
                  onChange={(e) => setCapacityTolerance(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="text-xs text-slate-700">Example: target 120, tolerance 20</div>
              </div>
              {similarCapacityHalls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {similarCapacityHalls.map(({ hall, diff }) => (
                    <button
                      key={hall.id}
                      type="button"
                      className="px-2 py-1 rounded-full text-xs border border-blue-300 bg-white text-slate-800"
                      onClick={() => toggleCompareHall(hall.id)}
                    >
                      {hall.name || hall.id} ({hall.capacity}) diff {diff}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                <label className="block text-sm font-medium mb-1">Floor</label>
                <input
                  type="text"
                  name="floor"
                  value={hallForm.floor}
                  onChange={handleHallInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. 1st Floor"
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
                <label className="block text-sm font-medium mb-1">Floor</label>
                <input
                  type="text"
                  name="floor"
                  value={editHallForm.floor}
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
                const maintenanceValidationError = validateHallFormPayload(editHallForm, { validateId: false });
                if (maintenanceValidationError) {
                  setToast({ message: maintenanceValidationError, type: 'error' });
                  return;
                }
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

      {/* Hall Detail View Modal */}
      {selectedHall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mt-4 mb-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-slate-800">
                🏛️ {selectedHall.name || selectedHall.id}
              </h2>
              <button
                onClick={() => setSelectedHall(null)}
                className="text-2xl text-slate-600 hover:text-slate-900 font-light"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-xs text-slate-600">Capacity</div>
                  <div className="text-lg font-bold text-slate-800">{selectedHall.capacity}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Type</div>
                  <div className="text-lg font-bold text-slate-800">{selectedHall.features?.hallType || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Building</div>
                  <div className="text-lg font-bold text-slate-800">{selectedHall.features?.building || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Status</div>
                  <div className={`text-sm font-bold px-2 py-1 rounded inline-block ${getHallAvailability(selectedHall).color}`}>
                    {getHallAvailability(selectedHall).label}
                  </div>
                </div>
              </div>

              {/* New Feature Panels */}
              <div className="space-y-4">
                <HallResourcesPanel 
                  hallId={selectedHall.id} 
                  apiBase={apiBase}
                  onRefresh={() => loadData()}
                />
                
                <HallRatingsPanel 
                  hallId={selectedHall.id} 
                  apiBase={apiBase}
                />
                
                <ActivityLogPanel 
                  hallId={selectedHall.id} 
                  apiBase={apiBase}
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedHall(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations Modal */}
      {showRecommendationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-6">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-slate-800">
                🎯 Smart Hall Recommendations
              </h2>
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="text-2xl text-slate-600 hover:text-slate-900 font-light"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <SmartRecommendationsPanel apiBase={apiBase} />
            </div>

            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallAllocation;