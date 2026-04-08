import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import api from '../api/scheduler.js';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import backgroundImage from '../assets/room-interior-design.jpg';

const normalizeDep = (value = '') => String(value || '').trim().toUpperCase();

const parseDetails = (details) => {
  if (!details) return {};
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
};

const inferDep = (code = '') => {
  const match = String(code || '').trim().match(/^([A-Za-z]+)/);
  if (!match) return 'GENERAL';
  const p = match[1].toUpperCase();
  const depMap = { IT: 'IT', SE: 'SE', IE: 'IME', CS: 'CS', CN: 'CN', IM: 'IME', DS: 'DS' };
  return depMap[p] || p;
};

const getDep = (module = {}) => {
  const dep = module.department || module.department_id || module.departmentId || module.specialization || module.specialization_id || module.stream;
  return dep ? normalizeDep(dep) : inferDep(module.code);
};

const toView = (module = {}) => {
  const details = parseDetails(module.details);
  return {
    id: String(module.id || `${module.code}-${module.name}`),
    code: String(module.code || module.id || '').trim(),
    name: String(module.name || module.title || module.code || 'Untitled Module').trim(),
    department: getDep(module),
    credits: module.credits || details.credits || '',
    lecturesPerWeek: module.lectures_per_week || details.lectures_per_week || '',
    academicYear: String(module.academic_year || details.academic_year || ''),
    semester: String(module.semester || details.semester || ''),
    createdAt: module.created_at || module.createdAt || null,
  };
};

const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const FacultyAddedModulesPage = ({ user }) => {
  const roleKey = normalizeRoleKey(user?.role);
  const canManageModules = roleKey === 'academiccoordinator';
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [editingId, setEditingId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [editingForm, setEditingForm] = useState({
    code: '',
    name: '',
    department: 'GENERAL',
    academicYear: '1',
    semester: '1',
    credits: '',
    lecturesPerWeek: '',
  });

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.listItems('modules');
      const items = Array.isArray(response?.items) ? response.items : [];
      setModules(items.map(toView));
    } catch (err) {
      setError(err.message || 'Failed to load added modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const startEdit = (module) => {
    clearMessages();
    setEditingId(module.id);
    setEditingForm({
      code: module.code || '',
      name: module.name || '',
      department: module.department || 'GENERAL',
      academicYear: module.academicYear || '1',
      semester: module.semester || '1',
      credits: module.credits === '' ? '' : String(module.credits),
      lecturesPerWeek: module.lecturesPerWeek === '' ? '' : String(module.lecturesPerWeek),
    });
  };

  const cancelEdit = () => {
    setEditingId('');
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    if (!editingForm.code.trim() || !editingForm.name.trim()) {
      setError('Module code and name are required.');
      return;
    }

    try {
      setSavingId(editingId);
      clearMessages();
      await api.updateItem('modules', editingId, {
        code: editingForm.code.trim(),
        name: editingForm.name.trim(),
        specialization: editingForm.department,
        academic_year: editingForm.academicYear,
        semester: editingForm.semester,
        credits: editingForm.credits ? Number(editingForm.credits) : null,
        lectures_per_week: editingForm.lecturesPerWeek ? Number(editingForm.lecturesPerWeek) : null,
      });
      setSuccess('Module updated successfully.');
      setEditingId('');
      await loadModules();
    } catch (err) {
      setError(err.message || 'Failed to update module.');
    } finally {
      setSavingId('');
    }
  };

  const deleteModule = async (moduleId) => {
    const confirmed = window.confirm('Delete this module? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(moduleId);
      clearMessages();
      await api.deleteItem('modules', moduleId);
      if (editingId === moduleId) {
        setEditingId('');
      }
      setSuccess('Module deleted successfully.');
      await loadModules();
    } catch (err) {
      setError(err.message || 'Failed to delete module.');
    } finally {
      setDeletingId('');
    }
  };

  const departments = useMemo(() => {
    const set = new Set(modules.map((m) => m.department).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [modules]);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((module) => {
      const matchDepartment = selectedDepartment === 'ALL' || module.department === selectedDepartment;
      const searchableText = `${module.code} ${module.name} ${module.department} ${module.academicYear}`.toLowerCase();
      return matchDepartment && (!q || searchableText.includes(q));
    });
  }, [modules, search, selectedDepartment]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Added Modules"
      subtitle="Govern and maintain the academic module registry"
      badge="Governance Control Center"
      backgroundImage={backgroundImage}
      footerNote={canManageModules ? 'Use Update for corrections and Delete for retired modules only.' : 'View-only mode: modules are managed by Academic Coordinator.'}
    >
      <style>{`
        .am-glass-card {
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          background: linear-gradient(135deg, rgba(2,6,23,0.84), rgba(30,41,59,0.74));
          backdrop-filter: blur(12px);
          box-shadow: 0 16px 44px rgba(2,6,23,0.45);
        }
        .am-header {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.88);
          margin: 0;
        }
        .am-title {
          margin: 8px 0 4px;
          font-size: 28px;
          font-weight: 900;
          color: #f8fafc;
        }
        .am-filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }
        .am-input,
        .am-select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(15,23,42,0.78);
          color: #f8fafc;
          outline: none;
          box-sizing: border-box;
        }
        .am-table-shell {
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          background: linear-gradient(180deg, rgba(2,6,23,0.9), rgba(15,23,42,0.84));
          backdrop-filter: blur(12px);
          box-shadow: 0 16px 42px rgba(2,6,23,0.45);
        }
        .am-table-row {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .am-table-row:nth-child(odd) {
          background: rgba(2,6,23,0.52);
        }
        .am-table-row:nth-child(even) {
          background: rgba(15,23,42,0.52);
        }
        .am-table-row:hover {
          transform: translateY(-1px);
          background: rgba(30,41,59,0.82) !important;
          box-shadow: 0 8px 22px rgba(59,130,246,0.14);
        }
        .am-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .am-pill-se { background: rgba(59,130,246,0.18); color: #bfdbfe; border: 1px solid rgba(59,130,246,0.26); }
        .am-pill-it { background: rgba(168,85,247,0.18); color: #e9d5ff; border: 1px solid rgba(168,85,247,0.26); }
        .am-pill-other { background: rgba(148,163,184,0.14); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.22); }
        .am-action-btn {
          padding: 8px 13px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
          transition: transform 0.2s ease, filter 0.2s ease;
          border: 1px solid transparent;
        }
        .am-action-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .am-update-btn {
          border-color: rgba(59,130,246,0.55);
          background: linear-gradient(135deg, rgba(30,58,138,0.92), rgba(30,64,175,0.84));
          color: #dbeafe;
        }
        .am-delete-btn {
          border-color: rgba(248,113,113,0.55);
          background: linear-gradient(135deg, rgba(127,29,29,0.94), rgba(153,27,27,0.86));
          color: #fee2e2;
        }
        @media (max-width: 920px) {
          .am-filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section className="am-glass-card" style={{ padding: 24 }}>
          <p className="am-header">Governance Ledger</p>
          <h2 className="am-title">Added Modules Registry</h2>
          <p style={{ margin: 0, color: 'rgba(203,213,225,0.82)', fontSize: 13 }}>
            Data-centric review and control for all module records.
          </p>
        </section>

        <section className="am-glass-card am-filters-grid" style={{ padding: 16 }}>
          <input
            className="am-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, department or year"
          />
          <select className="am-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departments.map((dep) => (
              <option key={dep} value={dep} style={{ background: '#0f172a' }}>
                {dep === 'ALL' ? 'All Departments' : dep}
              </option>
            ))}
          </select>
        </section>

        {(error || success) && (
          <div
            className="am-glass-card"
            style={{
              padding: '12px 14px',
              background: error ? 'rgba(220,38,38,0.14)' : 'rgba(16,185,129,0.14)',
              borderColor: error ? 'rgba(252,165,165,0.35)' : 'rgba(110,231,183,0.35)',
              color: error ? '#fecaca' : '#a7f3d0',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {error || success}
          </div>
        )}

        {!canManageModules && (
          <div
            className="am-glass-card"
            style={{
              padding: '10px 14px',
              color: '#cbd5e1',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderColor: 'rgba(125,211,252,0.2)',
              background: 'rgba(15,23,42,0.6)',
            }}
          >
            Faculty Coordinator View: Added modules are read-only and managed by Academic Coordinator.
          </div>
        )}

        <section className="am-table-shell">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(186,230,253,0.95)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {loading ? 'Loading modules' : `${filteredModules.length} modules shown`}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.97), rgba(30,41,59,0.9))' }}>
                  {['Code', 'Name', 'Department', 'Academic Year', 'Semester', 'Credits', 'Lectures/Week', 'Created', ...(canManageModules ? ['Actions'] : [])].map((head) => (
                    <th
                      key={head}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'rgba(148,163,184,0.9)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && filteredModules.length === 0 && (
                  <tr>
                    <td colSpan={canManageModules ? 9 : 8} style={{ padding: '30px 14px', textAlign: 'center', color: 'rgba(148,163,184,0.9)', fontSize: 14 }}>
                      No modules found for this filter.
                    </td>
                  </tr>
                )}

                {filteredModules.map((module) => (
                  <Fragment key={module.id}>
                    <tr className="am-table-row">
                      <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 700 }}>{module.code || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'rgba(226,232,240,0.95)' }}>{module.name || '-'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={String(module.department || '').toLowerCase() === 'se' ? 'am-pill am-pill-se' : String(module.department || '').toLowerCase() === 'it' ? 'am-pill am-pill-it' : 'am-pill am-pill-other'}>
                          {module.department || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{module.academicYear || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{module.semester || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{module.credits || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{module.lecturesPerWeek || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'rgba(148,163,184,0.85)' }}>
                        {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : '-'}
                      </td>
                      {canManageModules && (
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => startEdit(module)} className="am-action-btn am-update-btn">
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteModule(module.id)}
                              disabled={deletingId === module.id}
                              className="am-action-btn am-delete-btn"
                              style={{ opacity: deletingId === module.id ? 0.7 : 1, cursor: deletingId === module.id ? 'not-allowed' : 'pointer' }}
                            >
                              {deletingId === module.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {canManageModules && editingId === module.id && (
                      <tr style={{ background: 'rgba(15,23,42,0.82)' }}>
                        <td colSpan={9} style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <form onSubmit={saveEdit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                            <input className="am-input" value={editingForm.code} onChange={(e) => setEditingForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="Code" />
                            <input className="am-input" value={editingForm.name} onChange={(e) => setEditingForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" />
                            <input className="am-input" value={editingForm.department} onChange={(e) => setEditingForm((prev) => ({ ...prev, department: e.target.value.toUpperCase() }))} placeholder="Department" />
                            <input className="am-input" value={editingForm.academicYear} onChange={(e) => setEditingForm((prev) => ({ ...prev, academicYear: e.target.value }))} placeholder="Academic Year" />
                            <input className="am-input" value={editingForm.semester} onChange={(e) => setEditingForm((prev) => ({ ...prev, semester: e.target.value }))} placeholder="Semester" />
                            <input className="am-input" value={editingForm.credits} onChange={(e) => setEditingForm((prev) => ({ ...prev, credits: e.target.value }))} placeholder="Credits" />
                            <input className="am-input" value={editingForm.lecturesPerWeek} onChange={(e) => setEditingForm((prev) => ({ ...prev, lecturesPerWeek: e.target.value }))} placeholder="Lectures / Week" />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" disabled={savingId === module.id} className="am-action-btn am-update-btn" style={{ cursor: savingId === module.id ? 'not-allowed' : 'pointer' }}>
                                {savingId === module.id ? 'Saving...' : 'Save'}
                              </button>
                              <button type="button" onClick={cancelEdit} className="am-action-btn" style={{ border: '1px solid rgba(148,163,184,0.45)', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1' }}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyAddedModulesPage;
