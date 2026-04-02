import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api/scheduler.js';

const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#818cf8', '#ec4899', '#14b8a6'];

const DEFAULT_CAPACITY = 120;

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

const parseBatchId = (id) => {
  const parts = String(id).split('.');
  if (parts.length < 4) return null;
  
  return {
    year: parts[0],
    semester: parts[1],
    type: parts[2],
    specialization: parts[3],
  };
};

const aggregateBatches = (batches, groupBy = 'yearSemester') => {
  const aggregated = {};
  
  batches.forEach((batch) => {
    const parsed = parseBatchId(batch.name || batch.id);
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
    aggregated[key] += DEFAULT_CAPACITY;
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
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const response = await api.listItems('batches');
        if (Array.isArray(response?.items)) {
          setBatches(response.items);
        }
      } catch (err) {
        setError('Failed to load batch data');
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

  const getCurrentData = () => chartData[activeChart] || [];
  
  const getData = () => {
    const data = getCurrentData();
    if (activeChart === 'specialization' || activeChart === 'yearSpecialization') {
      return data.map((item, idx) => ({
        ...item,
        fill: activeChart === 'specialization' ? getSpecializationColor(item.name) : COLORS[idx % COLORS.length],
      }));
    }
    return data;
  };

  const totalStudents = useMemo(() => {
    return getCurrentData().reduce((sum, item) => sum + item.value, 0);
  }, [getCurrentData]);

  const chartButton = ({ id, label, isActive }) => (
    <button
      onClick={() => setActiveChart(id)}
      style={{
        padding: '10px 16px',
        borderRadius: '10px',
        border: 'none',
        background: isActive ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.05)',
        color: isActive ? '#38bdf8' : 'rgba(148,163,184,0.7)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        fontSize: '13px',
        fontWeight: isActive ? '600' : '500',
        borderBottom: isActive ? '2px solid #38bdf8' : 'none',
      }}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'rgba(148,163,184,0.6)' }}>
        Loading batch statistics...
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Chart Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {chartButton({ id: 'yearSemester', label: 'Year & Semester', isActive: activeChart === 'yearSemester' })}
        {chartButton({ id: 'year', label: 'By Year', isActive: activeChart === 'year' })}
        {chartButton({ id: 'specialization', label: 'By Specialization', isActive: activeChart === 'specialization' })}
        {chartButton({ id: 'yearSpecialization', label: 'Year & Specialization', isActive: activeChart === 'yearSpecialization' })}
      </div>

      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '14px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', marginBottom: '6px' }}>Total Students</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>{totalStudents}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: '14px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', marginBottom: '6px' }}>Batch Groups</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#a78bfa' }}>{batches.length}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,211,153,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(34,211,153,0.3)',
          borderRadius: '14px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', marginBottom: '6px' }}>Categories</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399' }}>{getCurrentData().length}</div>
        </div>
      </div>

      {/* Pie Chart Container */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(7,20,43,0.96))',
        border: '1px solid rgba(148,163,184,0.1)',
        borderRadius: '22px',
        padding: '32px',
        minHeight: '550px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <ResponsiveContainer width="100%" height={480}>
          <PieChart>
            <Pie
              data={getData()}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, value, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={140}
              innerRadius={60}
              fill="#38bdf8"
              dataKey="value"
              paddingAngle={2}
            >
              {getData().map((item, index) => (
                <Cell key={`cell-${index}`} fill={item.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '2px solid rgba(56,189,248,0.5)',
                borderRadius: '12px',
                color: '#e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
              formatter={(value) => [`${value} students`, 'Count']}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
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

      {/* Statistics Summary Grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(7,20,43,0.96))',
        border: '1px solid rgba(148,163,184,0.1)',
        borderRadius: '22px',
        padding: '28px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0', fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Detailed Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {getCurrentData().map((item, idx) => {
            const percentage = ((item.value / totalStudents) * 100).toFixed(1);
            const dataItem = getData()[idx];
            return (
              <div key={idx} style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.05))',
                borderRadius: '14px',
                border: `2px solid ${dataItem?.fill || COLORS[idx % COLORS.length]}40`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: dataItem?.fill || COLORS[idx % COLORS.length],
                }}>
                </div>
                <div style={{ marginLeft: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', marginBottom: '8px', fontWeight: '600' }}>{item.name}</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: dataItem?.fill || COLORS[idx % COLORS.length], marginBottom: '8px' }}>
                    {item.value}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(148,163,184,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      height: '6px',
                      borderRadius: '3px',
                      background: dataItem?.fill || COLORS[idx % COLORS.length],
                      width: `${percentage}%`,
                      maxWidth: '80px',
                    }}></div>
                    <span>{percentage}%</span>
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
