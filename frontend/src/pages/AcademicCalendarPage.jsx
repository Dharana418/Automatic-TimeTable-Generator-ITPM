import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Edit2, X } from 'lucide-react';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell';
import { format, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
        <option key={opt.value} value={opt.value} style={{ background: '#0f172a', color: '#f1f5f9' }}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

const EVENT_TYPES = [
  { value: 'semester_start', label: 'Semester Start' },
  { value: 'exam_period', label: 'Exam Period' },
  { value: 'holiday', label: 'Holiday / Break' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'other', label: 'Other Event' }
];

const sectionPanelStyle = {
  background: 'linear-gradient(145deg, rgba(2,6,23,0.9), rgba(15,23,42,0.82), rgba(7,89,133,0.35))',
  padding: 24,
  borderRadius: 20,
  border: '1px solid rgba(34,211,238,0.2)',
  boxShadow: '0 10px 30px rgba(2,6,23,0.28)',
  backdropFilter: 'blur(16px)',
};

/* ── Main Page Component ────────────────────────────────────────── */
export default function AcademicCalendarPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    event_name: '',
    event_type: 'semester_start',
    start_date: '',
    end_date: '',
    academic_year: '1',
    semester: '1',
    description: ''
  });

  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const isRangeInvalid = useMemo(() => {
    if (!form.start_date || !form.end_date) return false;
    return new Date(form.end_date) < new Date(form.start_date);
  }, [form.start_date, form.end_date]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/academic-coordinator/calendar`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setEvents(data.data || []);
    } catch (err) {
      console.warn('Could not load calendar events', err);
      toast.error('Failed to load academic calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!form.event_name.trim() || !form.start_date) {
      return toast.warn('Event Name and Start Date are mandatory.');
    }
    if (isRangeInvalid) {
      return toast.warn('End date cannot be earlier than start date.');
    }

    try {
      setSaving(true);
      const url = editingId 
        ? `${API_BASE}/api/academic-coordinator/calendar/${editingId}`
        : `${API_BASE}/api/academic-coordinator/calendar`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        toast.success(editingId ? 'Calendar event updated.' : 'Calendar event formally published.');
        handleCancelEdit();
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to map event');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to post event.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      event_name: ev.event_name || '',
      event_type: ev.event_type || 'semester_start',
      start_date: ev.start_date ? ev.start_date.split('T')[0] : '',
      end_date: ev.end_date ? ev.end_date.split('T')[0] : '',
      academic_year: ev.academic_year?.toString() || '1',
      semester: ev.semester?.toString() || '1',
      description: ev.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      event_name: '', event_type: 'semester_start', start_date: '',
      end_date: '', academic_year: '1', semester: '1', description: ''
    });
  };
  
  const handleDeleteEvent = async (id) => {
    if(!window.confirm("Permanently erase this event?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/academic-coordinator/calendar/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if(!res.ok) throw new Error("Delete failed");
      toast.success("Event removed from academic calendar");
      fetchEvents();
    } catch (e) {
      toast.error(e.message || "Failed to remove event");
    }
  };

  const getEventAccent = (type) => {
    switch(type) {
      case 'semester_start': return '#34d399';
      case 'exam_period': return '#f43f5e';
      case 'holiday': return '#fbbf24';
      case 'deadline': return '#c084fc';
      default: return '#38bdf8';
    }
  };

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Academic Calendar"
      subtitle="Publish and review significant academic milestones and semester boundaries."
      badge="Timeline Planner"
      themeVariant="academic"
      mainTopMarginClass="mt-9"
      contentSectionWidthClass="max-w-none"
      contentSectionClassName="lg:w-[calc(100%+21.5rem)] lg:ml-[-21.5rem]"
    >
      <style>{`
        .ac-input-hover:focus { border-color: rgba(244,114,182,0.5) !important; box-shadow: 0 0 0 3px rgba(244,114,182,0.1) !important; }
        .ac-btn-primary { transition: all 0.2s; }
        .ac-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(244,114,182,0.3); }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
        
        {/* Entry Form */}
        <section style={{ ...sectionPanelStyle, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f472b6' }}>+</span> Publish Core Event
          </h2>
          <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>The academic calendar is globally visible to the institution.</p>

          <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <DarkInput label="Event Name *" val={form.event_name} onChange={v => setForm(p => ({...p, event_name: v}))} placeholder="e.g. End Semester Exams" />
              <DarkSelect 
                label="Event Category *" 
                required 
                value={form.event_type} 
                onChange={(v) => setForm(p => ({...p, event_type: v}))}
                options={EVENT_TYPES} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 400 }}>
              <DarkInput label="Academic Year *" type="number" val={form.academic_year} onChange={v => setForm(p => ({...p, academic_year: v}))} min="1" max="4" />
              <DarkInput label="Semester *" type="number" val={form.semester} onChange={v => setForm(p => ({...p, semester: v}))} min="1" max="2" />
            </div>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Start Date *</span>
                <input type="date" value={form.start_date} min={today} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className="ac-input-hover" style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>End Date</span>
                <input type="date" value={form.end_date} min={form.start_date || today} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="ac-input-hover" style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>Leave blank for single-day event.</span>
              </label>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Optional details..."
                className="ac-input-hover"
                rows="2"
                style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.2)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 12 }}>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', color: '#f1f5f9', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X className="h-4 w-4" /> Cancel Edit
                </button>
              )}
              <button 
                type="submit" disabled={saving || isRangeInvalid} className="ac-btn-primary"
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #f472b6, #e11d48)',
                  color: '#fff', fontSize: 13, fontWeight: 800, cursor: (saving || isRangeInvalid) ? 'not-allowed' : 'pointer',
                  opacity: (saving || isRangeInvalid) ? 0.7 : 1
                }}
              >
                {saving ? 'Processing...' : (editingId ? 'Update Event' : 'Publish to Calendar')}
              </button>
            </div>
          </form>
        </section>

        {/* Existing Calendar Events */}
        <section style={sectionPanelStyle}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Upcoming Schedule</h3>

          {loading ? (
            <p style={{ color: 'rgba(148,163,184,0.7)', textAlign: 'center', padding: '40px 0' }}>Loading calendar entries...</p>
          ) : events.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((ev) => {
                const accent = getEventAccent(ev.event_type);
                const startDateStr = ev.start_date ? format(parseISO(ev.start_date), 'MMM dd, yyyy') : '';
                const endDateStr = ev.end_date ? format(parseISO(ev.end_date), 'MMM dd, yyyy') : '';
                
                return (
                  <div key={ev.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: 16, background: 'rgba(15,23,42,0.8)',
                    borderLeft: `4px solid ${accent}`, borderTop: '1px solid rgba(148,163,184,0.08)',
                    borderRight: '1px solid rgba(148,163,184,0.08)', borderBottom: '1px solid rgba(148,163,184,0.08)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{ev.event_name}</h4>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 40, border: `1px solid ${accent}40`, color: accent, background: `${accent}15`, fontWeight: 700, textTransform: 'uppercase' }}>
                          {EVENT_TYPES.find(t => t.value === ev.event_type)?.label || ev.event_type}
                        </span>
                        {(ev.academic_year || ev.semester) && (
                          <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: 40 }}>Y{ev.academic_year}S{ev.semester}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(148,163,184,0.8)', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {startDateStr} {endDateStr && `— ${endDateStr}`}
                        </span>
                      </div>
                      {ev.description && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)', lineHeight: 1.4 }}>{ev.description}</p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16 }}>
                      <button 
                        onClick={() => handleEdit(ev)}
                        style={{
                          background: 'transparent', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8',
                          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Edit2 className="h-3 w-3" style={{ marginRight: 4 }}/> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(ev.id)}
                        style={{
                          background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(148,163,184,0.6)' }}>No calendar events published yet.</p>
            </div>
          )}
        </section>

      </div>
    </FacultyCoordinatorShell>
  );
}
