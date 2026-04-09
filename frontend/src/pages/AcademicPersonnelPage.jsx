import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import api from '../api/scheduler';

/* ── UI Components ──────────────────────────────────────────────── */
const DarkInput = ({ label, val, onChange, type = 'text', placeholder = '', help = '' }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>{label}</span>
    <input
      type={type}
      value={val}
      onChange={(e) => onChange(e.target.value)}
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
export default function AcademicPersonnelPage({ user }) {
  const [activeTab, setActiveTab] = useState('lecturers');
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState({ lecturers: [], lics: [] });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form States
  const [lecForm, setLecForm] = useState({ name: '', department: 'GENERAL', email: '' });
  const [licForm, setLicForm] = useState({ name: '', department: 'GENERAL' });

  const FORBIDDEN_CHARS = /[~!@#$%^&*()_+]/;
  const HAS_NUMBERS = /\d/;

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const [lecRes, licRes] = await Promise.all([
        api.listItems('instructors'),
        api.listItems('lics')
      ]);
      setPersonnel({
        lecturers: lecRes.items || [],
        lics: licRes.items || []
      });
    } catch (err) {
      toast.error('Failed to load personnel roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleAddLecturer = async (e) => {
    e.preventDefault();
    if (!lecForm.name.trim()) return toast.warn('Lecturer name is required.');
    if (FORBIDDEN_CHARS.test(lecForm.name) || FORBIDDEN_CHARS.test(lecForm.department)) {
      return toast.warn('Name/department cannot contain forbidden special characters.');
    }
    if (HAS_NUMBERS.test(lecForm.name)) {
      return toast.warn('Lecturer name cannot contain numbers.');
    }
    if (lecForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lecForm.email)) {
      return toast.warn('Please provide a valid lecturer email address.');
    }

    try {
      setSaving(true);
      await api.addItem('instructors', {
        name: lecForm.name.trim(),
        department: lecForm.department,
        email: lecForm.email.trim()
      });
      toast.success('Lecturer successfully onboarded.');
      setLecForm({ name: '', department: 'GENERAL', email: '' });
      fetchPersonnel();
    } catch (err) {
      toast.error(err.message || 'Failed to add lecturer.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLic = async (e) => {
    e.preventDefault();
    if (!licForm.name.trim()) return toast.warn('LIC name is required.');
    if (FORBIDDEN_CHARS.test(licForm.name) || FORBIDDEN_CHARS.test(licForm.department)) {
      return toast.warn('Name/department cannot contain forbidden special characters.');
    }
    if (HAS_NUMBERS.test(licForm.name)) {
      return toast.warn('LIC name cannot contain numbers.');
    }

    try {
      setSaving(true);
      await api.addItem('lics', {
        name: licForm.name.trim(),
        department: licForm.department
      });
      toast.success('Lead Instructor successfully registered.');
      setLicForm({ name: '', department: 'GENERAL' });
      fetchPersonnel();
    } catch (err) {
      toast.error(err.message || 'Failed to add LIC.');
    } finally {
      setSaving(false);
    }
  };

  // Safe lowercasing and trimming
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = activeTab === 'lecturers' ? personnel.lecturers : personnel.lics;
    return list.filter(p => {
      const nameStr = String(p.name || p.username || '').toLowerCase();
      const depStr = String(p.department || '').toLowerCase();
      const emailStr = String(p.email || '').toLowerCase();
      return nameStr.includes(q) || depStr.includes(q) || emailStr.includes(q);
    });
  }, [personnel, activeTab, search]);

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Personnel Roster"
      subtitle="Register and review Lecturer profiles and Lead Instructors (LICs)."
      badge="Network"
    >
      <style>{`
        .ac-input-hover:focus { border-color: rgba(167,139,250,0.5) !important; box-shadow: 0 0 0 3px rgba(167,139,250,0.1) !important; }
        .ac-btn-primary { transition: all 0.2s; }
        .ac-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(167,139,250,0.3); }
        .ac-tab { padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .ac-tab.active { background: rgba(167,139,250,0.15); color: #c4b5fd; border-color: rgba(167,139,250,0.3); }
        .ac-tab.inactive { color: rgba(148,163,184,0.6); }
        .ac-tab.inactive:hover { background: rgba(148,163,184,0.05); color: rgba(148,163,184,0.9); }
      `}</style>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button 
          className={`ac-tab ${activeTab === 'lecturers' ? 'active' : 'inactive'}`}
          onClick={() => { setActiveTab('lecturers'); setSearch(''); }}
        >
          Lecturers Roster
        </button>
        <button 
          className={`ac-tab ${activeTab === 'lics' ? 'active' : 'inactive'}`}
          onClick={() => { setActiveTab('lics'); setSearch(''); }}
        >
          Lead Instructors (LIC)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Entry Form */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(7,20,43,0.95))',
          padding: 24, borderRadius: 20, border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#a78bfa' }}>+</span> New {activeTab === 'lecturers' ? 'Lecturer' : 'LIC'}
          </h2>
          <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>Onboard new staff into the system to assign modules later.</p>

          {activeTab === 'lecturers' ? (
            <form onSubmit={handleAddLecturer} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <DarkInput label="Full Name *" val={lecForm.name} onChange={v => setLecForm(p => ({...p, name: v}))} placeholder="Dr. Jane Doe" />
              <DarkInput label="Email Address" val={lecForm.email} onChange={v => setLecForm(p => ({...p, email: v}))} placeholder="jane.d@sliit.lk" type="email" />
              <DarkSelect 
                label="Department *" 
                required 
                value={lecForm.department} 
                onChange={(v) => setLecForm(p => ({...p, department: v}))}
                options={['IM', 'DS', 'SE', 'CSNE', 'ISE', 'IT', 'CYBER SECURITY', 'GENERAL']} 
              />
              <button 
                type="submit" disabled={saving} className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', height: 42,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Adding...' : 'Add Lecturer'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddLic} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <DarkInput label="Full Name *" val={licForm.name} onChange={v => setLicForm(p => ({...p, name: v}))} placeholder="Dr. John Smith" />
              <DarkSelect 
                label="Department *" 
                required 
                value={licForm.department} 
                onChange={(v) => setLicForm(p => ({...p, department: v}))}
                options={['IM', 'DS', 'SE', 'CSNE', 'ISE', 'IT', 'CYBER SECURITY', 'GENERAL']} 
              />
              <button 
                type="submit" disabled={saving} className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', height: 42,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Adding...' : 'Add LIC'}
              </button>
            </form>
          )}
        </section>

        {/* Dynamic Ledger */}
        <section style={{
          background: 'rgba(15,23,42,0.6)', padding: 24, borderRadius: 20, 
          border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
             <div>
               <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                 {activeTab === 'lecturers' ? 'Lecturers Registry' : 'LICs Registry'}
               </h3>
               <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{filteredList.length} exact records found</p>
             </div>
             <input
                type="text"
                placeholder="Find by name, email, or dept..."
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
            <p style={{ color: 'rgba(148,163,184,0.7)', textAlign: 'center', padding: '40px 0' }}>Loading personnel database...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(7,20,43,0.9)' }}>
                    {['Name', 'Department', 'Email (If provided)'].map((head) => (
                      <th key={head} style={{ textAlign: 'left', padding: '14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length > 0 ? filteredList.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <td style={{ padding: '14px', color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{p.name || p.username || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd' }}>
                          {p.department || 'GENERAL'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: 13 }}>{p.email || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.6)' }}>No entries found.</td>
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
