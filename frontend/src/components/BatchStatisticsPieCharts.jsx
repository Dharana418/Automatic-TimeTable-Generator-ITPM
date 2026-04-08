import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/scheduler.js';
import { Users, Calendar, BookOpen, Zap, BarChart3, TrendingUp } from 'lucide-react';

const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#818cf8', '#ec4899', '#14b8a6', '#6366f1', '#f97316'];

const getSpecializationColor = (spec) => {
  const colors = {
    'IT': '#38bdf8',
    'SE': '#a78bfa',
    'DS': '#f59e0b',
    'ISE': '#f472b6',
    'CS': '#60a5fa',
    'CSNE': '#34d399',
    'IM': '#fb923c',
    'CN': '#818cf8',
  };
  return colors[spec] || '#94a3b8';
};

const getIconForChartType = (chartType) => {
  const icons = {
    'yearSemester': <Calendar size={20} />,
    'year': <BarChart3 size={20} />,
    'specialization': <BookOpen size={20} />,
    'yearSpecialization': <TrendingUp size={20} />,
  };
  return icons[chartType] || <BarChart3 size={20} />;
};

const parseBatchId = (id) => {
  const parts = String(id).split('.');
  if (parts.length < 4) return null;
  
  return {
    year: parts[0],
    semester: parts[1],
    type: parts[2],
    specialization: parts[3],
    group: parts[4],
    subgroup: parts[5],
    isSubgroup: parts.length === 6,
  };
};

const getCapacity = (batch) => {
  const directCapacity = Number(batch?.capacity);
  if (Number.isFinite(directCapacity) && directCapacity > 0) {
    return directCapacity;
  }

  const batchId = batch?.name || batch?.id;
  const parsed = parseBatchId(batchId);
  if (!parsed) return 0;
  return parsed.isSubgroup ? 60 : 120;
};

const aggregateBatches = (batches, groupBy = 'yearSemester') => {
  const aggregated = {};
  
  batches.forEach((batch) => {
    const batchId = batch.name || batch.id;
    const parsed = parseBatchId(batchId);
    if (!parsed) return;
    
    let key = '';
    if (groupBy === 'year') {
      key = parsed.year;
    } else if (groupBy === 'specialization') {
      key = parsed.specialization;
    } else if (groupBy === 'yearSpecialization') {
      key = `${parsed.year} - ${parsed.specialization}`;
    } else {
      key = `${parsed.year} - ${parsed.semester}`;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = 0;
    }
    aggregated[key] += getCapacity(batch);
  });
  
  return Object.entries(aggregated).map(([label, value]) => ({
    name: label,
    value,
    label,
  }));
};

const BatchStatisticsPieCharts = () => {
  const [activeChart, setActiveChart] = useState('yearSemester');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const response = await api.listItems('batches');
        if (Array.isArray(response?.items)) {
          setBatches(response.items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBatches();
  }, []);

  const chartData = useMemo(() => ({
    year: aggregateBatches(batches, 'year'),
    yearSemester: aggregateBatches(batches, 'yearSemester'),
    specialization: aggregateBatches(batches, 'specialization'),
    yearSpecialization: aggregateBatches(batches, 'yearSpecialization'),
  }), [batches]);

  const intakeSummary = useMemo(() => {
    const yearTotals = chartData.year.reduce((acc, item) => {
      acc[item.name] = item.value;
      return acc;
    }, {});

    const streamBatches = batches.filter((batch) => {
      const parsed = parseBatchId(batch.name || batch.id);
      return parsed && ['3', '4'].includes(parsed.year);
    });

    const streamTotals = aggregateBatches(streamBatches, 'specialization');

    return {
      yearTotals,
      streamTotals,
      streamTotal: streamTotals.reduce((sum, item) => sum + item.value, 0),
    };
  }, [batches, chartData.year]);

  const getCurrentData = () => chartData[activeChart] || [];
  
  const getData = () => {
    const data = getCurrentData();
    if (activeChart === 'specialization' || activeChart === 'yearSpecialization') {
      return data.map((item, idx) => {
        let color = COLORS[idx % COLORS.length];
        if (activeChart === 'specialization') {
          const spec = item.name.split(' - ')[item.name.split(' - ').length - 1];
          color = getSpecializationColor(spec);
        }
        return { ...item, fill: color };
      });
    }
    return data.map((item, idx) => ({
      ...item,
      fill: COLORS[idx % COLORS.length],
    }));
  };

  const totalStudents = useMemo(() => {
    return getCurrentData().reduce((sum, item) => sum + item.value, 0);
  }, [getCurrentData]);

  const chartButton = ({ id, label, isActive }) => (
    <button
      onClick={() => setActiveChart(id)}
      style={{
        padding: '12px 18px',
        borderRadius: '12px',
        border: 'none',
        background: isActive ? 'rgba(56,189,248,0.25)' : 'rgba(148,163,184,0.08)',
        color: isActive ? '#38bdf8' : 'rgba(148,163,184,0.7)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        fontSize: '13px',
        fontWeight: isActive ? '600' : '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: isActive ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(148,163,184,0.15)',
        boxShadow: isActive ? '0 0 20px rgba(56,189,248,0.2)' : 'none',
      }}
    >
      {getIconForChartType(id)}
      {label}
    </button>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'rgba(148,163,184,0.6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTop: '3px solid #38bdf8', animation: 'spin 1s linear infinite' }}></div>
          <span>Loading batch statistics...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'rgba(148,163,184,0.6)' }}>
        No batches added yet. Create some batches to see statistics.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Chart Controls with Icons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {chartButton({ id: 'yearSemester', label: 'Year & Semester', isActive: activeChart === 'yearSemester' })}
        {chartButton({ id: 'year', label: 'By Year', isActive: activeChart === 'year' })}
        {chartButton({ id: 'specialization', label: 'By Specialization', isActive: activeChart === 'specialization' })}
        {chartButton({ id: 'yearSpecialization', label: 'Year & Specialization', isActive: activeChart === 'yearSpecialization' })}
      </div>

      {/* Header Stats with Icons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(56,189,248,0.4)',
          borderRadius: '16px',
          padding: '18px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(148,163,184,0.6)' }}>
            <Users size={16} />
            <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Students</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8' }}>{totalStudents}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: '16px',
          padding: '18px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(148,163,184,0.6)' }}>
            <BookOpen size={16} />
            <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Batch Groups</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#a78bfa' }}>{batches.length}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,211,153,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(34,211,153,0.4)',
          borderRadius: '16px',
          padding: '18px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(148,163,184,0.6)' }}>
            <BarChart3 size={16} />
            <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Categories</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#34d399' }}>{getCurrentData().length}</div>
        </div>
      </div>

      {/* Requested intake snapshot */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
      }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(56,189,248,0.22)', borderRadius: '16px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Year 1 Intake</div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#38bdf8', marginTop: '6px' }}>{intakeSummary.yearTotals['1'] || 0}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: '16px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Year 2 Intake</div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#a78bfa', marginTop: '6px' }}>{intakeSummary.yearTotals['2'] || 0}</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '16px', padding: '18px', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>Year 3-4 Specialization Stream</div>
          <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {intakeSummary.streamTotals.map((item, index) => (
              <span key={`${item.name}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: COLORS[index % COLORS.length] }}>{item.name}</span>
                <span>{item.value}</span>
              </span>
            ))}
            <span style={{ marginLeft: 'auto', color: '#f8fafc', fontSize: '12px', fontWeight: 700 }}>
              Total: {intakeSummary.streamTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Main Pie Chart */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,20,43,0.98))',
        border: '2px solid rgba(56,189,248,0.2)',
        borderRadius: '24px',
        padding: '40px',
        minHeight: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow Effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}></div>
        
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={getData()}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, value, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              innerRadius={70}
              fill="#38bdf8"
              dataKey="value"
              paddingAngle={2}
            >
              {getData().map((item, index) => (
                <Cell key={`cell-${index}`} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.98)',
                border: '2px solid rgba(56,189,248,0.6)',
                borderRadius: '14px',
                color: '#e2e8f0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                padding: '12px 16px',
              }}
              formatter={(value) => [`${value} students`, 'Count']}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '30px',
              }}
              formatter={(value, payload) => (
                <span style={{ 
                  color: 'rgba(148,163,184,0.8)', 
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {payload.payload.name}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown Grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,20,43,0.98))',
        border: '2px solid rgba(56,189,248,0.2)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <TrendingUp size={18} color="#38bdf8" />
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Detailed Breakdown
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {getCurrentData().map((item, idx) => {
            const percentage = ((item.value / totalStudents) * 100).toFixed(1);
            const dataItem = getData()[idx];
            return (
              <div key={idx} style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.05))',
                borderRadius: '16px',
                border: `2px solid ${dataItem?.fill || COLORS[idx % COLORS.length]}50`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${dataItem?.fill}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  background: dataItem?.fill || COLORS[idx % COLORS.length],
                  borderRadius: '16px 0 0 16px',
                }}>
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.65)', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.03em' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: dataItem?.fill || COLORS[idx % COLORS.length], marginBottom: '12px', lineHeight: 1 }}>
                    {item.value}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(90deg, ${dataItem?.fill || COLORS[idx % COLORS.length]}, ${dataItem?.fill || COLORS[idx % COLORS.length]}40)`,
                      width: `${Math.min(percentage * 2, 100)}%`,
                      flex: 1,
                    }}></div>
                    <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)', fontWeight: '600', minWidth: '35px', textAlign: 'right' }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BatchStatisticsPieCharts;
