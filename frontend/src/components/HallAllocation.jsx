import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import ToastMessage from './ToastMessage.jsx';
import HallResourcesPanel from './HallResourcesPanel.jsx';
import HallRatingsPanel from './HallRatingsPanel.jsx';
import ActivityLogPanel from './ActivityLogPanel.jsx';
import SmartRecommendationsPanel from './SmartRecommendationsPanel.jsx';
import Building2DView from './Building2DView.jsx';

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
const FLOOR_REGEX = /^[A-Za-z0-9][A-Za-z0-9 .,&()/-]{0,28}$/;

const getPrimaryFloatingButtonMotion = (delay = 0) => ({
  animate: {
    y: [0, -6, 0],
    boxShadow: [
      '0 8px 18px rgba(14, 116, 144, 0.22)',
      '0 14px 28px rgba(14, 116, 144, 0.32)',
      '0 8px 18px rgba(14, 116, 144, 0.22)',
    ],
  },
  transition: {
    duration: 2.2,
    repeat: Infinity,
    repeatType: 'loop',
    ease: 'easeInOut',
    delay,
  },
  whileHover: { y: -10, scale: 1.05 },
  whileTap: { y: -2, scale: 0.96 },
});

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

  if (normalized.floor) {
    if (normalized.floor.length > 30) {
      return 'Floor cannot exceed 30 characters.';
    }
    if (!FLOOR_REGEX.test(normalized.floor)) {
      return 'Floor can only include letters, numbers, spaces, and . , & ( ) / -';
    }
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
  const [editTargetHallId, setEditTargetHallId] = useState('');
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
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [updatingStatusHallId, setUpdatingStatusHallId] = useState('');
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
  const todayDate = new Date().toISOString().split('T')[0];

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
    const hallId = String(hall?.id || '').trim();

    return timetables.filter((t) => {
      if (String(t?.hall_id || '').trim() === hallId) return true;

      const rawData = t?.data;
      if (typeof rawData === 'string') {
        return rawData.includes(hallId);
      }

      if (rawData && typeof rawData === 'object') {
        try {
          return JSON.stringify(rawData).includes(hallId);
        } catch {
          return false;
        }
      }

      return false;
    }).length;
  }, [timetables]);

  const getHallAvailability = useCallback((hall) => {
    const today = new Date().toISOString().split('T')[0];
    const maintenanceStart = String(hall.maintenanceStart || '').trim();
    const maintenanceEnd = String(hall.maintenanceEnd || '').trim();
    const inMaintenanceRange = Boolean(
      maintenanceStart && maintenanceEnd && today >= maintenanceStart && today <= maintenanceEnd
    );

    if (hall.status === 'maintenance' || inMaintenanceRange) {
      return { status: 'maintenance', label: 'Under Maintenance', color: 'bg-red-100 text-red-800' };
    }

    if (hall.status === 'unavailable') {
      return { status: 'unavailable', label: 'Unavailable', color: 'bg-slate-200 text-slate-800' };
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

      if (!hallRes.ok) {
        throw new Error(hallsData?.error || hallsData?.message || `Failed to load halls (${hallRes.status})`);
      }

      if (!timetableRes.ok) {
        throw new Error(timetableData?.error || timetableData?.message || `Failed to load timetables (${timetableRes.status})`);
      }

      const dbHalls = hallsData.items || hallsData.data || [];
      setHalls(Array.isArray(dbHalls) ? dbHalls.map(normalizeHall) : []);

      const rows = timetableData.data || timetableData.items || [];
      setTimetables(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Hall allocation load error:', err);
      setToast({ message: err?.message || 'Failed to load hall allocation data.', type: 'error' });
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

    const normalizedHallName = normalizedForm.hallId.toLowerCase();
    const duplicateHallExists = halls.some((hall) => {
      const existingName = String(hall?.name || hall?.id || '').trim().toLowerCase();
      return existingName === normalizedHallName;
    });

    if (duplicateHallExists) {
      setHallError('A hall with this name already exists. Please use a different hall name.');
      return;
    }

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
    if (!editTargetHallId) {
      setEditHallError('Unable to update hall. Please close and reopen the edit form.');
      return;
    }

    setSubmittingEditHall(true);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls/${editTargetHallId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editHallForm.hallId,
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
      setEditTargetHallId('');
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

    if (!editTargetHallId) {
      setEditHallError('Unable to update hall. Please close and reopen the edit form.');
      return;
    }

    const validationError = validateHallFormPayload(editHallForm, { validateId: true });
    if (validationError) {
      setEditHallError(validationError);
      return;
    }

    const normalizedHallId = String(editHallForm.hallId || '').trim().toLowerCase();
    const duplicateHallExists = halls.some((hall) => {
      const existingId = String(hall?.id || '').trim().toLowerCase();
      return existingId === normalizedHallId && String(hall?.id || '') !== String(editTargetHallId);
    });

    if (duplicateHallExists) {
      setEditHallError('A hall with this ID already exists. Please use a different hall ID.');
      return;
    }

    setShowEditConfirmModal(true);
  };

  const openEditHallModal = (hall) => {
    setEditTargetHallId(hall.id);
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

  const openMaintenanceModal = (hall) => {
    setMaintenanceHallId(hall.id);
    setEditHallForm({
      hallId: hall.id,
      hallType: hall.features?.hallType || '',
      capacity: hall.capacity?.toString() || '',
      building: hall.features?.building || '',
      floor: hall.features?.floor || hall.floor || '',
      amenities: hall.features?.amenities || {},
      status: hall.status || 'available',
      maintenanceStart: '',
      maintenanceEnd: '',
    });
    setShowMaintenanceModal(true);
  };

  const requestDeleteHall = (hallId) => {
    setHallToDelete(hallId);
    setShowDeleteConfirmModal(true);
  };

  const updateHallStatus = async (hall, nextStatus) => {
    setUpdatingStatusHallId(hall.id);
    try {
      const response = await fetch(`${apiBase}/api/scheduler/halls/${hall.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hall.name || hall.id,
          capacity: Number(hall.capacity),
          features: {
            hallType: hall.features?.hallType || '',
            building: hall.features?.building || '',
            floor: hall.features?.floor || hall.floor || '',
            amenities: hall.features?.amenities || {},
          },
          status: nextStatus,
          maintenanceStart: nextStatus === 'maintenance' ? hall.maintenanceStart : '',
          maintenanceEnd: nextStatus === 'maintenance' ? hall.maintenanceEnd : '',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update hall status');
      }

      setHalls((previous) =>
        previous.map((item) =>
          item.id === hall.id
            ? {
                ...item,
                status: nextStatus,
                maintenanceStart: nextStatus === 'maintenance' ? item.maintenanceStart : '',
                maintenanceEnd: nextStatus === 'maintenance' ? item.maintenanceEnd : '',
              }
            : item
        )
      );

      setToast({ message: `Hall ${hall.id} status changed to ${nextStatus}.`, type: 'success' });
    } catch (error) {
      console.error('Update status error:', error);
      setToast({ message: error.message || 'Failed to update hall status', type: 'error' });
    } finally {
      setUpdatingStatusHallId('');
    }
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

  useEffect(() => {
    if (selectedHall && !halls.some((hall) => hall.id === selectedHall.id)) {
      setSelectedHall(null);
    }
  }, [halls, selectedHall]);

  useEffect(() => {
    setCompareSelection((previous) => previous.filter((hallId) => halls.some((hall) => hall.id === hallId)).slice(0, 2));
  }, [halls]);

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
    }, { available: 0, occupied: 0, maintenance: 0, unavailable: 0 });
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
    <div className="hall-allocation-container p-4 sm:p-5">
      <div className="mb-5 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Hall Allocation</h2>
            <p className="mt-1 text-sm font-medium text-slate-700">Manage halls with clearer controls, better visibility, and quick insights.</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            className="dashboard-btn hall-primary-btn flex-1 sm:flex-none"
            onClick={() => setShowRecommendationsModal(true)}
            style={{ willChange: 'transform' }}
            {...getPrimaryFloatingButtonMotion(0)}
          >
             Get Recommendations
          </Motion.button>
          <Motion.button
            type="button"
            className="dashboard-btn hall-primary-btn flex-1 sm:flex-none"
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
            style={{ willChange: 'transform' }}
            {...getPrimaryFloatingButtonMotion(0.3)}
          >
            + Add Hall
          </button>
          </div>
        </div>
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Halls */}
        <div className="panel xl:col-span-2">
          <div className="hall-control-panel mx-auto mb-6 mt-3 max-w-6xl rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex flex-col gap-1 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Available Halls</h3>
                <p className="text-sm text-slate-600">Search, filter, and switch between card, table, or campus views.</p>
              </div>
              <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                {filteredHalls.length} hall(s)
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-12">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Search</label>
                <input
                  type="text"
                  placeholder="Search by ID, name, type, or building..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Min Capacity</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Max Capacity</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  >
                    <option value="name">Name</option>
                    <option value="capacity">Capacity</option>
                    <option value="building">Building</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  >
                    <option value="building">Building</option>
                    <option value="floor">Floor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:col-span-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="lg:max-w-[180px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">View Mode</label>
                      <p className="text-xs text-slate-500">Choose how the hall list should be displayed.</p>
                    </div>
                    <div className="lg:min-w-[260px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700 lg:sr-only">Select View</label>
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="hall-view-select w-full max-w-[220px] text-black"
                        aria-label="Select view mode"
                      >
                        <option value="card" className="text-black">Card</option>
                        <option value="table" className="text-black">Table</option>
                        <option value="campus" className="text-black">Campus 2D</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700">Compare</label>
                    <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                      {compareSelection.length}/2 selected
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700">Page</label>
                    <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900">
                      {currentPage}/{totalPages}
                    </div>
                  </div>
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
          {viewMode === 'campus' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-sky-100 via-sky-50 to-white p-4">
                <h4 className="text-base font-semibold text-slate-800">Campus 2D View</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Halls are arranged floor-by-floor for quick 2D hall allocation review.
                </p>
              </div>

              {filteredHalls.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  No hall records available for campus view.
                </div>
              )}

              {filteredHalls.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-100 p-4">
                  <Building2DView
                    halls={filteredHalls}
                    selectedHallId={selectedHall?.id}
                    onSelectHall={setSelectedHall}
                  />
                </div>
              )}
            </div>
          )}

          {viewMode !== 'campus' && groupKeys.map((groupKey) => {
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
                    <div className="mt-1 text-sm font-medium text-slate-700">Capacity: {hall.capacity || '-'}</div>
                    <div className="text-sm font-medium text-slate-700">Type: {hall.features?.hallType || '-'}</div>
                    <div className="text-sm font-medium text-slate-700">Building: {hall.features?.building || '-'}</div>
                    <div className="text-sm font-medium text-slate-700">Floor: {getHallFloor(hall)}</div>

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
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block ${availability.color}`}>
                            {availability.label}
                          </div>
                          <button
                            type="button"
                            className="hall-action-btn"
                            disabled={updatingStatusHallId === hall.id || hall.status === 'available'}
                            onClick={() => updateHallStatus(hall, 'available')}
                          >
                            {updatingStatusHallId === hall.id ? 'Saving...' : 'Set Available'}
                          </button>
                          <button
                            type="button"
                            className="hall-action-btn hall-action-btn--warning"
                            disabled={updatingStatusHallId === hall.id || hall.status === 'unavailable'}
                            onClick={() => updateHallStatus(hall, 'unavailable')}
                          >
                            {updatingStatusHallId === hall.id ? 'Saving...' : 'Set Unavailable'}
                          </button>
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
                        onClick={() => openMaintenanceModal(hall)}
                      >
                        Set Maintenance
                      </button>
                      <button
                        type="button"
                        className="hall-action-btn hall-action-btn--info"
                        onClick={() => setSelectedHall(hall)}
                      >
                        Details
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
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${availability.color}`}>
                                    {availability.label}
                                  </span>
                                  <button
                                    type="button"
                                    className="hall-action-btn"
                                    disabled={updatingStatusHallId === hall.id || hall.status === 'available'}
                                    onClick={() => updateHallStatus(hall, 'available')}
                                  >
                                    {updatingStatusHallId === hall.id ? 'Saving...' : 'Available'}
                                  </button>
                                  <button
                                    type="button"
                                    className="hall-action-btn hall-action-btn--warning"
                                    disabled={updatingStatusHallId === hall.id || hall.status === 'unavailable'}
                                    onClick={() => updateHallStatus(hall, 'unavailable')}
                                  >
                                    {updatingStatusHallId === hall.id ? 'Saving...' : 'Unavailable'}
                                  </button>
                                </div>
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
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredHalls.length)} of {filteredHalls.length}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  className="hall-pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <div className="rounded-lg border border-cyan-200 bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-900">
                  Page {currentPage} / {totalPages}
                </div>
                <button
                  type="button"
                  className="hall-pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
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
              <div className="rounded-lg border border-slate-300 bg-slate-100 p-3">
                <div className="text-xs text-slate-700">Unavailable</div>
                <div className="text-xl font-bold text-slate-800">{statusBreakdown.unavailable}</div>
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
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-cyan-700 via-teal-700 to-sky-700 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-50">
                    Hall Form
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">Add a New Hall</h3>
                  <p className="mt-1 max-w-xl text-sm text-cyan-50/90">
                    Create a new hall record with clearly labeled details, amenities, and status information.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  onClick={() => {
                    setShowAddHallModal(false);
                    setHallError('');
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAddHall} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Hall</span> ID
                  </label>
                  <input
                    type="text"
                    name="hallId"
                    value={hallForm.hallId}
                    onChange={handleHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="e.g. H101"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Capacity</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={hallForm.capacity}
                    onChange={handleHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Hall</span> Type
                  </label>
                  <input
                    type="text"
                    name="hallType"
                    value={hallForm.hallType}
                    onChange={handleHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="e.g. Lecture Theatre"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Floor</span>
                  </label>
                  <input
                    type="text"
                    name="floor"
                    value={hallForm.floor}
                    onChange={handleHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="e.g. 1st Floor"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Building</span>
                  </label>
                  <input
                    type="text"
                    name="building"
                    value={hallForm.building}
                    onChange={handleHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    placeholder="e.g. Main Building"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Amenities</div>
                    <div className="text-xs text-slate-600">Highlight the facilities this hall supports.</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {AMENITIES.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                    >
                      <input
                        type="checkbox"
                        checked={hallForm.amenities[amenity.id] || false}
                        onChange={() => handleAmenityToggle(amenity.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-200"
                      />
                      <span className="text-base">{amenity.icon}</span>
                      <span className="font-medium text-slate-800">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {hallError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{hallError}</p>}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => {
                    setShowAddHallModal(false);
                    setHallError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn hall-primary-btn px-5 py-2.5" disabled={submittingHall}>
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
            setEditTargetHallId('');
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 via-cyan-800 to-teal-800 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-50">
                    Hall Form
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">Edit Hall Details</h3>
                  <p className="mt-1 max-w-xl text-sm text-cyan-50/90">
                    Update hall information, capacity, and available amenities with clear, editable fields.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  onClick={() => {
                    setShowEditHallModal(false);
                    setEditHallError('');
                    setEditTargetHallId('');
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleEditHall} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Hall</span> ID
                  </label>
                  <input
                    type="text"
                    name="hallId"
                    value={editHallForm.hallId}
                    onChange={handleEditHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Capacity</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={editHallForm.capacity}
                    onChange={handleEditHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Hall</span> Type
                  </label>
                  <input
                    type="text"
                    name="hallType"
                    value={editHallForm.hallType}
                    onChange={handleEditHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Floor</span>
                  </label>
                  <input
                    type="text"
                    name="floor"
                    value={editHallForm.floor}
                    onChange={handleEditHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-800">
                    <span className="text-cyan-700">Building</span>
                  </label>
                  <input
                    type="text"
                    name="building"
                    value={editHallForm.building}
                    onChange={handleEditHallInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Amenities</div>
                    <div className="text-xs text-slate-600">Keep the facility flags accurate for allocation decisions.</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {AMENITIES.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                    >
                      <input
                        type="checkbox"
                        checked={editHallForm.amenities[amenity.id] || false}
                        onChange={() => handleEditAmenityToggle(amenity.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-200"
                      />
                      <span className="text-base">{amenity.icon}</span>
                      <span className="font-medium text-slate-800">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editHallError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{editHallError}</p>}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => {
                    setShowEditHallModal(false);
                    setEditHallError('');
                    setEditTargetHallId('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-btn hall-primary-btn px-5 py-2.5" disabled={submittingEditHall}>
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
              onSubmit={async (e) => {
                e.preventDefault();
                const maintenanceValidationError = validateHallFormPayload(editHallForm, { validateId: false });
                if (maintenanceValidationError) {
                  setToast({ message: maintenanceValidationError, type: 'error' });
                  return;
                }
                if (editHallForm.maintenanceStart && editHallForm.maintenanceStart < todayDate) {
                  setToast({ message: 'Maintenance start date must be today or later.', type: 'error' });
                  return;
                }
                setSubmittingMaintenance(true);
                try {
                  const response = await fetch(`${apiBase}/api/scheduler/halls/${maintenanceHallId}`, {
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
                      status: 'maintenance',
                      maintenanceStart: editHallForm.maintenanceStart,
                      maintenanceEnd: editHallForm.maintenanceEnd,
                    }),
                  });

                  const data = await response.json();
                  if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to set maintenance period');
                  }

                  setHalls((previous) =>
                    previous.map((hall) =>
                      hall.id === maintenanceHallId
                        ? {
                            ...hall,
                            status: 'maintenance',
                            maintenanceStart: editHallForm.maintenanceStart,
                            maintenanceEnd: editHallForm.maintenanceEnd,
                          }
                        : hall
                    )
                  );
                  setToast({ message: `Hall ${maintenanceHallId} set to maintenance.`, type: 'success' });
                  await notifyUser('Maintenance Scheduled', `Hall ${maintenanceHallId} is now under maintenance.`);
                } catch (error) {
                  console.error('Set maintenance error:', error);
                  const errorMessage = error.message || 'Failed to set maintenance period';
                  setToast({ message: errorMessage, type: 'error' });
                  await notifyUser('Maintenance Update Failed', errorMessage);
                  return;
                } finally {
                  setSubmittingMaintenance(false);
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
                  min={todayDate}
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
                  min={editHallForm.maintenanceStart || todayDate}
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
                <button type="submit" className="dashboard-btn" disabled={submittingMaintenance}>
                  {submittingMaintenance ? 'Saving...' : 'Set Maintenance'}
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