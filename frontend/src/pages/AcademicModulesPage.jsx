import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import api from '../api/scheduler';

/* ── UI Components ──────────────────────────────────────────────── */
const DarkInput = ({ label, val, onChange, type = 'text', placeholder = '', help = '', min, max }) => (
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
        color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box'
      }}
    />
    {help && <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{help}</span>}
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
        padding: '10px 14px', borderRadius: 12, width: '100%', boxSizing: 'border-box',
        background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
        color: value ? '#f1f5f9' : 'rgba(148,163,184,0.5)', fontSize: 13, outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} style={{ background: '#0f172a', color: '#f1f5f9' }}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

/* ── Main Page Component ────────────────────────────────────────── */
export default function AcademicModulesPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    department: 'GENERAL',
    academic_year: '1',
    semester: '1',
    credits: '',
    lectures_per_week: ''
  });

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await api.listItems('modules');
      setModules(res.items || []);
    } catch (err) {
      toast.error('Failed to load module registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      return toast.warn('Module code and name are mandatory.');
    }

    try {
      setSaving(true);
      await api.addItem('modules', {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        specialization: form.department,
        academic_year: form.academic_year,
        semester: form.semester,
        credits: form.credits ? Number(form.credits) : null,
        lectures_per_week: form.lectures_per_week ? Number(form.lectures_per_week) : null,
      });
      toast.success('Module successfully registered.');
      setForm({
        code: '', name: '', department: 'GENERAL', 
        academic_year: '1', semester: '1', credits: '', lectures_per_week: ''
      });
      fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to register module.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for rendering the badge color
  const getBadgeStyle = (dep) => {
    const DEP_STYLE = {
      IT: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' },
      SE: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
      DS: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
      CSNE: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
      ISE: { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
      GENERAL: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
    };
    return DEP_STYLE[dep] || DEP_STYLE.GENERAL;
  };

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter(m => {
      const codeStr = String(m.code || '').toLowerCase();
      const nameStr = String(m.name || '').toLowerCase();
      const depStr = String(m.specialization || m.department || '').toLowerCase();
      return codeStr.includes(q) || nameStr.includes(q) || depStr.includes(q);
    });
  }, [modules, search]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Module Registry"
      subtitle="Register, update, and manage degree modules across all specializations."
      badge="Modules"
      themeVariant="academic"
    >
      <style>{`
        .ac-input-hover:focus { border-color: rgba(56,189,248,0.5) !important; box-shadow: 0 0 0 3px rgba(56,189,248,0.1) !important; }
        .ac-btn-primary { transition: all 0.2s; }
        .ac-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(56,189,248,0.3); }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Module Entry Form */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
          padding: 24, borderRadius: 20, border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#38bdf8' }}>+</span> New Module
          </h2>
          <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>Add a new course to the institute's active registry.</p>

          <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <DarkInput label="Code *" val={form.code} onChange={v => setForm(p => ({...p, code: v.toUpperCase()}))} placeholder="e.g. IT1010" />
              <DarkInput label="Name *" val={form.name} onChange={v => setForm(p => ({...p, name: v}))} placeholder="e.g. Intro to IT" />
              <DarkSelect 
                label="Specialization *" 
                required 
                value={form.department} 
                onChange={(v) => setForm(p => ({...p, department: v}))}
                options={['IM', 'DS', 'SE', 'CSNE', 'ISE', 'IT', 'CYBER SECURITY', 'GENERAL']} 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <DarkInput label="Academic Year" val={form.academic_year} onChange={v => setForm(p => ({...p, academic_year: v}))} type="number" min="1" max="4" />
              <DarkInput label="Semester" val={form.semester} onChange={v => setForm(p => ({...p, semester: v}))} type="number" min="1" max="2" />
              <DarkInput label="Credits" val={form.credits} onChange={v => setForm(p => ({...p, credits: v}))} type="number" min="1" max="10" />
              <DarkInput label="Lectures / Week" val={form.lectures_per_week} onChange={v => setForm(p => ({...p, lectures_per_week: v}))} type="number" min="1" max="10" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                type="submit" 
                disabled={saving}
                className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Registering...' : 'Register Module'}
              </button>
            </div>
          </form>
        </section>

        {/* Dynamic Ledger */}
        <section style={{
          background: 'rgba(15,23,42,0.6)', padding: 24, borderRadius: 20, 
          border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
             <div>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Module Matrix</h3>
               <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{filteredModules.length} exact records found</p>
             </div>
             <input
                type="text"
                placeholder="Find by code, name, or Dept..."
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
            <p style={{ color: 'rgba(148,163,184,0.7)', textAlign: 'center', padding: '40px 0' }}>Loading module database...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(7,20,43,0.9)' }}>
                    {['Code', 'Name', 'Specialization', 'Year/Sem', 'Credits', 'Lectures/Wk'].map((head) => (
                      <th key={head} style={{ textAlign: 'left', padding: '14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.length > 0 ? filteredModules.map(m => {
                    const dep = String(m.specialization || m.department || 'GENERAL').toUpperCase();
                    const s = getBadgeStyle(dep);
                    return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <td style={{ padding: '14px', color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>{m.code || '—'}</td>
                      <td style={{ padding: '14px', color: '#e2e8f0', fontSize: 13 }}>{m.name || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                          {dep}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: 13 }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          Y{m.academic_year || '?'} S{m.semester || '?'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: 13 }}>{m.credits || '—'}</td>
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: 13 }}>{m.lectures_per_week || '—'}</td>
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.6)' }}>No modules found.</td>
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
