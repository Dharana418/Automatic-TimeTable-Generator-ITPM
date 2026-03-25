import React, { useEffect, useState } from 'react';

const HallAllocation = ({ apiBase }) => {
  const [halls, setHalls] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hallRes, timetableRes] = await Promise.all([
        fetch(`${apiBase}/api/halls`, { credentials: 'include' }),
        fetch(`${apiBase}/api/academic-coordinator/timetables`, { credentials: 'include' })
      ]);

      const hallsData = await hallRes.json();
      const timetableData = await timetableRes.json();

      if (hallsData.success) setHalls(hallsData.data || []);
      if (timetableData.success) setTimetables(timetableData.data || []);
    } catch (err) {
      console.error('Hall allocation load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading Hall Allocation...</div>;

  return (
    <div className="hall-allocation-container">
      <h2>🏛️ Hall Allocation</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Halls */}
        <div className="panel">
          <h3>Available Halls</h3>
          {halls.map((hall) => (
            <div key={hall.id} className="p-2 border-b">
              <strong>{hall.name}</strong>
              <div>Capacity: {hall.capacity || '-'}</div>
            </div>
          ))}
        </div>

        {/* Timetables */}
        <div className="panel">
          <h3>Timetables</h3>
          {timetables.map((t) => (
            <div key={t.id} className="p-2 border-b">
              <strong>{t.name}</strong>
              <div>Year {t.year} - Sem {t.semester}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HallAllocation;