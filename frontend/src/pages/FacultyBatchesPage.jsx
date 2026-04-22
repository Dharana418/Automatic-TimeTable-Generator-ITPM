import BatchList from '../components/BatchList.jsx';
import BatchStatisticsPieCharts from '../components/BatchStatisticsPieCharts.jsx';
import FacultyCoordinatorShell from '../components/FacultyCoordinatorShell.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const specializationTags = [
  { label: 'IT',             color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)'  },
  { label: 'SE',             color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  { label: 'DS',             color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  { label: 'ISE',            color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
  { label: 'CS',             color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  { label: 'Computer Science', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  { label: 'IM',             color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  { label: 'CN',             color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
];

const InfoChip = ({ label, value, accent = '#38bdf8' }) => (
  <div style={{
    padding: '12px 18px', borderRadius: 14,
    background: `rgba(${accent === '#38bdf8' ? '56,189,248' : '148,163,184'},0.06)`,
    border: `1px solid ${accent}25`,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.6)' }}>{label}</span>
    <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>{value}</span>
  </div>
);

const FacultyBatchesPage = ({ user }) => {
  const displayName = user?.name || user?.username || 'Faculty Coordinator';
  const [activeSpec, setActiveSpec] = useState(null);
  const navigate = useNavigate();

  return (
    <FacultyCoordinatorShell
      user={user}
      title="Batch & Specialization Control"
      subtitle="Institutional workspace for managing batch records and specialization structure"
      badge="Batch Management"
      sidebarSections={[
        { id: 'batchOverview', label: 'Overview' },
        { id: 'batchAnalytics', label: 'Analytics' },
        { id: 'batchSpecialization', label: 'Specializations' },
        { id: 'batchRegistry', label: 'Batch Registry' },
      ]}
      headerActions={
        <button
          type="button"
          onClick={() => navigate('/scheduler/by-year')}
          className="rounded-xl border border-cyan-300/70 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-700 transition hover:bg-cyan-100"
        >
          Open Scheduler
        </button>
      }
    >
      <style>{`
        .fc-spec-tag { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .fc-spec-tag:hover { transform: translateY(-2px) scale(1.04); }
        .fc-section-card { background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(7,20,43,0.96)); border: 1px solid rgba(148,163,184,0.1); border-radius: 22px; backdrop-filter: blur(20px); box-shadow: 0 8px 40px rgba(0,0,0,0.35); }
      `}</style>

      <div className="fc-layout-stack fc-layout-stack-tight">

        {/* ── Hero header card ── */}
        <section id="batchOverview" className="fc-section-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          {/* decorative glow */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>
                Coordinator Console
              </p>
              <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2 }}>
                Faculty Batch Registry
              </h2>
              <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(148,163,184,0.8)', maxWidth: 560, lineHeight: 1.7 }}>
                Maintain standardized batch definitions, monitor specialization balance, and review
                group and subgroup composition within a single institutional control panel.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              <div style={{
                padding: '10px 18px', borderRadius: 14, textAlign: 'right',
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.12)',
              }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.6)' }}>Managed By</p>
                <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{displayName}</p>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
                background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                fontSize: 11, fontWeight: 700, color: '#34d399',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} className="fc-pulse-dot" />
                Registry Active
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginTop: 26 }}>
            <InfoChip label="Total Specs" value={specializationTags.length} accent="#38bdf8" />
            <InfoChip label="Active Now" value={activeSpec || 'All'} accent="#a78bfa" />
            <InfoChip label="Coordinator" value="You" accent="#34d399" />
            <InfoChip label="Status" value="Ready" accent="#f59e0b" />
          </div>
        </section>

        {/* ── Batch Statistics Pie Charts ── */}
        <section id="batchAnalytics" className="fc-section-card" style={{ padding: '26px' }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#38bdf8' }}>Analytics & Insights</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Student Distribution by Batch Composition</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>Visualize total student enrollment across different grouping dimensions</p>
          </div>
          <BatchStatisticsPieCharts />
        </section>

        {/* ── Specialization cloud ── */}
        <section id="batchSpecialization" className="fc-section-card" style={{ padding: '26px' }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a78bfa' }}>Specialization Cloud</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Available Specializations</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>Click a tag to filter batches by specialization</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {/* All filter */}
            <button
              type="button"
              className="fc-spec-tag"
              onClick={() => setActiveSpec(null)}
              style={{
                padding: '8px 18px', borderRadius: 40, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: !activeSpec ? 'linear-gradient(90deg, rgba(56,189,248,0.3), rgba(99,102,241,0.25))' : 'rgba(15,23,42,0.5)',
                border: !activeSpec ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(148,163,184,0.15)',
                color: !activeSpec ? '#38bdf8' : 'rgba(148,163,184,0.6)',
                boxShadow: !activeSpec ? '0 0 16px rgba(56,189,248,0.2)' : 'none',
              }}
            >
              All
            </button>

            {specializationTags.map((tag) => {
              const isActive = activeSpec === tag.label;
              return (
                <button
                  key={tag.label}
                  type="button"
                  className="fc-spec-tag"
                  onClick={() => setActiveSpec(isActive ? null : tag.label)}
                  style={{
                    padding: '8px 18px', borderRadius: 40, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: isActive ? tag.bg : 'rgba(15,23,42,0.5)',
                    border: `1px solid ${isActive ? tag.border : 'rgba(148,163,184,0.15)'}`,
                    color: isActive ? tag.color : 'rgba(148,163,184,0.65)',
                    boxShadow: isActive ? `0 0 16px ${tag.bg}` : 'none',
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Batch list ── */}
        <section id="batchRegistry" className="fc-section-card" style={{ padding: '26px' }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b' }}>Batch Registry</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
              {activeSpec ? `Batches — ${activeSpec}` : 'All Batches'}
            </h3>
          </div>
          <BatchList />
        </section>

      </div>
    </FacultyCoordinatorShell>
  );
};

export default FacultyBatchesPage;
