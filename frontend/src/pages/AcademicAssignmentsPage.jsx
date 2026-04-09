import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Edit2, X } from 'lucide-react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import api from '../api/scheduler';

/* ── UI Components ──────────────────────────────────────────────── */
const DarkInput = ({ label, val, onChange, type = 'text', placeholder = '', min, max }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>{label}</span>
    <input
      type={type}
      value={val}
      min={min}
      max={max}
      onChange={(e) => {
        let v = e.target.value;
        if (type === 'number' && typeof max !== 'undefined' && Number(v) > Number(max)) v = max;
        if (type === 'number' && typeof min !== 'undefined' && v !== '' && Number(v) < Number(min)) v = min;
        onChange(v);
      }}
      placeholder={placeholder}
      className="ac-input-hover"
      style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
        color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s'
      }}
    />
  </label>
);

const DarkSelect = ({ label, value, onChange, options, required = false }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ac-input-hover"
      style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
        color: value ? '#f1f5f9' : 'rgba(148,163,184,0.5)', fontSize: 13, outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#0f172a', color: '#f1f5f9' }}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

/* ── Main Page Component ────────────────────────────────────────── */
export default function AcademicAssignmentsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ modules: [], instructors: [], lics: [], assignments: [] });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    moduleId: '',
    lecturerId: '',
    licId: '',
    academicYear: '1',
    semester: '1'
  });

  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, instRes, licsRes, assignRes] = await Promise.all([
        api.listItems('modules'),
        api.listItems('instructors'),
        api.listItems('lics'),
        api.listAssignments()
      ]);

      setData({
        modules: modulesRes.items || [],
        instructors: instRes.items || [],
        lics: licsRes.items || [],
        assignments: assignRes.items || []
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignment registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!form.moduleId || !form.lecturerId || !form.academicYear) {
      return toast.warn('Module, Lecturer, and Academic Year are mandatory fields.');
    }
    try {
      setSaving(true);
      if (editingId) {
        await api.updateAssignment(editingId, form);
        toast.success('Assignment safely updated in the registry.');
      } else {
        await api.createAssignment(form);
        toast.success('Assignment safely mapped to the registry.');
      }
      handleCancelEdit();
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error mapping assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setForm({
      moduleId: a.module_id || '',
      lecturerId: a.lecturer_id || '',
      licId: a.lic_id || '',
      academicYear: a.academic_year?.toString() || '1',
      semester: a.semester?.toString() || '1'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ moduleId: '', lecturerId: '', licId: '', academicYear: '1', semester: '1' });
  };

  const handleDeleteAssignment = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this assignment?");
    if (!isConfirmed) return;
    try {
      await api.deleteAssignment(id);
      toast.success('Assignment removed successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove assignment.');
    }
  };

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.assignments.filter((a) => {
      const moduleStr = `${a.module_code} ${a.module_name}`.toLowerCase();
      const lecStr = String(a.lecturer_name || '').toLowerCase();
      const licStr = String(a.lic_name || '').toLowerCase();
      return moduleStr.includes(q) || lecStr.includes(q) || licStr.includes(q);
    });
  }, [data.assignments, search]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Module Assignments Matrix"
      subtitle="Map instructional staff to specific modules to ensure a complete teaching load."
      badge="Assignments"
    >
      <style>{`
        .ac-input-hover:focus { border-color: rgba(245,158,11,0.5) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important; }
        .ac-btn-primary { transition: all 0.2s; }
        .ac-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.3); }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Assignment Creation Form */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
          padding: 24, borderRadius: 20, border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>+</span> New Assigment
          </h2>
          <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>Select the module and attach the relevant teaching staff.</p>

          <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <DarkSelect 
                label="Module" 
                required 
                value={form.moduleId} 
                onChange={(v) => setForm(p => ({...p, moduleId: v}))}
                options={data.modules.map(m => ({ value: m.id, label: `${m.code} - ${m.name}` }))} 
              />
              <DarkSelect 
                label="Lecturer" 
                required 
                value={form.lecturerId} 
                onChange={(v) => setForm(p => ({...p, lecturerId: v}))}
                options={data.instructors.map(i => ({ value: i.id, label: `${i.name || i.username} (${i.role})` }))} 
              />
              <DarkSelect 
                label="LIC (Optional)" 
                value={form.licId} 
                onChange={(v) => setForm(p => ({...p, licId: v}))}
                options={data.lics.map(l => ({ value: l.id, label: l.name || l.email }))} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: '600px' }}>
              <DarkInput label="Academic Year *" val={form.academicYear} onChange={v => setForm(p => ({...p, academicYear: v}))} type="number" min="1" max="4" />
              <DarkInput label="Semester" val={form.semester} onChange={v => setForm(p => ({...p, semester: v}))} type="number" min="1" max="2" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 12 }}>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', color: '#f1f5f9', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={saving}
                className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Processing...' : (editingId ? 'Update Assignment' : 'Map Assignment')}
              </button>
            </div>
          </form>
        </section>

        {/* Existing Assignments Registry */}
        <section style={{
          background: 'rgba(15,23,42,0.6)', padding: 24, borderRadius: 20, 
          border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
             <div>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Active Matrix</h3>
               <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{filteredAssignments.length} exact records found</p>
             </div>
             <input
                type="text"
                placeholder="Search module or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '10px 16px', borderRadius: 20, width: 260,
                  background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none'
                }}
              />
          </div>

          {loading ? (
            <p style={{ color: 'rgba(148,163,184,0.7)', textAlign: 'center', padding: '40px 0' }}>Loading assignment matrix...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(7,20,43,0.9)' }}>
                    {['Module', 'Year/Sem', 'Lecturer', 'LIC', 'Actions'].map((head) => (
                      <th key={head} style={{ textAlign: 'left', padding: '14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.length > 0 ? filteredAssignments.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <td style={{ padding: '14px' }}>
                        <p style={{ margin: 0, color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{a.module_code}</p>
                        <p style={{ margin: '2px 0 0', color: 'rgba(148,163,184,0.8)', fontSize: 11 }}>{a.module_name}</p>
                      </td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: 13 }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          Y{a.academic_year || '?'} S{a.semester || '?'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#e2e8f0', fontSize: 13 }}>{a.lecturer_name || '—'}</td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: 13 }}>{a.lic_name ? <span style={{ color: '#a78bfa' }}>{a.lic_name}</span> : '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => handleEdit(a)}
                            style={{
                              background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
                              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAssignment(a.id)}
                            style={{
                              background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.6)' }}>No assignments found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </FacultyCoordinatorShell>
  );
}
