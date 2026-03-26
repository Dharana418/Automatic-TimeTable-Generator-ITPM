import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Home,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  addItem,
  deleteItem,
  listItems,
  updateItem,
} from '../api/scheduler';
import Building2DView from '../components/Building2DView';

const pageStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#f8fafc', // Softer, cooler gray background
  color: '#0f172a',
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const sidebarStyle = {
  width: 260,
  background: '#ffffff',
  borderRight: '1px solid #e2e8f0',
  padding: '28px 20px',
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  boxShadow: '1px 0 10px rgba(0, 0, 0, 0.02)', // Subtle shadow separating sidebar
};

const contentWrapStyle = {
  marginLeft: 260,
  width: 'calc(100% - 260px)',
  padding: '36px 48px',
  maxWidth: '1440px', // Prevent it from stretching infinitely on ultrawide
  margin: '0 auto',
  marginLeft: '260px',
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0', // Sharper border color
  borderRadius: 16, // Smoother rounding
  padding: 24, // More breathing room
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
};

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'halls', label: 'Hall Management', icon: Building2 },
  { id: 'resources', label: 'Resources', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const emptyForm = {
  id: '',
  name: '',
  capacity: '',
  features: '',
};

function UtilizationBar({ used, total }) {
  const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: 13,
          color: '#64748b', // Lighter text for the label
          fontWeight: 500,
        }}
      >
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>Resource Utilization</span>
        <strong style={{ color: '#0f172a', fontSize: '13px' }}>{percentage}%</strong>
      </div>
      <div
        style={{
          height: 8, // Slimmer progress bar
          borderRadius: 999,
          background: '#f1f5f9', // Blends better with cards
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #6366f1)', // More modern corporate blue-to-indigo
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother transition
          }}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        {used} / {total} seats allocated
      </div>
    </div>
  );
}

const AcademicCoordinatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [selectedHallId, setSelectedHallId] = useState('');

  const buildingLayout = useMemo(() => 
    halls.map((hall, index) => ({
      id: hall.id || `hall-${index}`,
      name: hall.name || `Hall ${index + 1}`,
      capacity: Number(hall.capacity || 0),
      status: Number(hall.capacity || 0) > 0 ? 'available' : 'inactive',
    })),
  [halls]);

  const loadHalls = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listItems('halls');
      setHalls(response?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHalls();
  }, []);

  const stats = useMemo(() => {
    const totalHalls = halls.length;
    const totalCapacity = halls.reduce((sum, hall) => sum + Number(hall.capacity || 0), 0);
    const activeResources = halls.filter((hall) => Number(hall.capacity || 0) > 0).length;
    const utilizationSeed = totalCapacity ? Math.max(1, Math.floor(totalCapacity * 0.72)) : 0;

    return {
      totalHalls,
      totalCapacity,
      activeResources,
      utilizationSeed,
    };
  }, [halls]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...(form.id.trim() ? { id: form.id.trim() } : {}),
        name: form.name.trim(),
        capacity: Number(form.capacity),
        features: form.features
          ? form.features.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      };

      if (!payload.name || Number.isNaN(payload.capacity)) {
        throw new Error('Hall name and numeric capacity are required.');
      }

      if (editingId) {
        await updateItem('halls', editingId, payload);
        setSuccess('Hall updated successfully.');
      } else {
        await addItem('halls', payload);
        setSuccess('Hall added successfully.');
      }

      resetForm();
      await loadHalls();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (hall) => {
    setEditingId(hall.id);
    setForm({
      id: hall.id || '',
      name: hall.name || '',
      capacity: String(hall.capacity ?? ''),
      features: Array.isArray(hall.features) ? hall.features.join(', ') : '',
    });
    setActiveTab('halls');
  };

  const onDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await deleteItem('halls', id);
      setSuccess('Hall deleted successfully.');
      if (editingId === id) resetForm();
      await loadHalls();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const renderTable = () => (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #eef2f7' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Hall Inventory</h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 18px' }}>Hall</th>
              <th style={{ padding: '14px 18px' }}>Capacity</th>
              <th style={{ padding: '14px 18px' }}>Features</th>
              <th style={{ padding: '14px 18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((hall, index) => (
              <tr
                key={hall.id}
                style={{
                  background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = '#eef2ff';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                }}
              >
                <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', fontWeight: 600 }}>{hall.name || '-'}</td>
                <td style={{ padding: '14px 18px' }}>{hall.capacity ?? '-'}</td>
                <td style={{ padding: '14px 18px', color: '#475569' }}>
                  {Array.isArray(hall.features) ? hall.features.join(', ') : '-'}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button
                    type="button"
                    onClick={() => onEdit(hall)}
                    style={{
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      borderRadius: 8,
                      padding: '6px 10px',
                      marginRight: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(hall.id)}
                    style={{
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      background: '#fff5f5',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!halls.length && !loading && (
              <tr>
                <td colSpan={4} style={{ padding: 20, color: '#64748b' }}>
                  No halls available. Add a hall to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
            Faculty Portal
          </div>
          <h2 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800 }}>Academic Coordinator</h2>
        </div>

        <nav style={{ display: 'grid', gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  border: '1px solid transparent',
                  borderRadius: 12,
                  padding: '12px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: isActive ? '#4f46e5' : '#64748b', // Indigo active state, muted slate inactive
                  background: isActive ? '#eef2ff' : 'transparent',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'inset 2px 0 0 0 #4f46e5' : 'none' // Sidebar active accent line
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={contentWrapStyle}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Dashboard Overview
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Manage resources and maintain scheduling readiness.
          </p>
        </header>

        {error && (
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: '#ecfdf3', color: '#166534' }}>
            {success}
          </div>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 20,
            marginBottom: 24,
          }}
        >
          {[{
            label: 'Total Halls', value: stats.totalHalls,
          }, {
            label: 'Total Capacity', value: stats.totalCapacity,
          }, {
            label: 'Active Resources', value: stats.activeResources,
          }].map((item) => (
            <div
              key={item.label}
              style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 6 }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'translateY(-3px)';
                event.currentTarget.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.06)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
                event.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.03)';
              }}
            >
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{item.value}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', marginBottom: 20 }}>Hall Management Form</h3>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
              <input
                placeholder="Hall ID (optional)"
                value={form.id}
                onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                disabled={Boolean(editingId)}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14 }}
              />
              <input
                placeholder="Hall Name (e.g., F14-01 or Lab 305)"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14 }}
              />
              <input
                placeholder="Capacity (Number of Seats)"
                value={form.capacity}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14 }}
              />
              <input
                placeholder="Features (comma separated: projector, wifi)"
                value={form.features}
                onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14 }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    background: '#0f172a',
                    color: '#fff',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
                >
                  <Plus size={16} /> {editingId ? 'Update Hall' : 'Add Hall'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      background: '#fff',
                      color: '#334155',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Analytics</h3>
            <UtilizationBar used={stats.utilizationSeed} total={Math.max(stats.totalCapacity, 1)} />
          </div>
        </section>

        {(activeTab === 'overview' || activeTab === 'resources') && (
          <section style={{ marginBottom: 14 }}>
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>2D Building View</h3>
              <Building2DView
                halls={buildingLayout}
                selectedHallId={selectedHallId}
                onSelectHall={(hall) => {
                  setSelectedHallId(hall.id);
                  setActiveTab('halls');
                  const found = halls.find((h) => h.id === hall.id);
                  if (found) {
                    setForm({
                      id: found.id || '',
                      name: found.name || '',
                      capacity: String(found.capacity ?? ''),
                      features: Array.isArray(found.features) ? found.features.join(', ') : '',
                    });
                    setEditingId(found.id || '');
                  }
                }}
              />
            </div>
          </section>
        )}

        {(activeTab === 'overview' || activeTab === 'halls') && renderTable()}

        {activeTab === 'resources' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Resources</h3>
            <p style={{ marginBottom: 0, color: '#475569' }}>
              Hall and capacity data are synchronized from the hall inventory table.
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Utilization Snapshot</h3>
            <UtilizationBar used={stats.utilizationSeed} total={Math.max(stats.totalCapacity, 1)} />
          </div>
        )}

        {loading && (
          <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading halls...</div>
        )}
      </main>
    </div>
  );
};

export default AcademicCoordinatorDashboard;
