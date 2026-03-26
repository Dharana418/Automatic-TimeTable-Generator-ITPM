import React from 'react';

// Helper to determine room type from name or features
const getRoomType = (hall) => {
  const name = (hall.name || '').toLowerCase();
  const features = Array.isArray(hall.features) ? hall.features.map(f => f.toLowerCase()) : [];
  const matches = (keyword) => name.includes(keyword) || features.some(f => f.includes(keyword));

  if (matches('lab') || matches('computer') || matches('practical')) return 'lab';
  if (matches('lecture') || matches('auditorium') || matches('theater')) return 'lecture_hall';
  return 'hall';
};

// Helper to guess floor from hall name (e.g., "102" -> floor 1, "1401" -> floor 14)
const getFloor = (hall) => {
  const name = String(hall.name || '').trim();
  
  // Look for explicit floor markers like "F14" or "Floor 14"
  const explicitMatch = name.match(/f\s*(\d+)|floor\s*(\d+)/i);
  if (explicitMatch) {
    return parseInt(explicitMatch[1] || explicitMatch[2], 10);
  }
  
  // Extract the first sequence of numbers found in the name
  const numMatch = name.match(/\d+/);
  if (numMatch) {
    const numStr = numMatch[0];
    // If it's a 3-digit number (e.g., "102", "305", "412") -> floor is the first digit
    if (numStr.length === 3) {
      return parseInt(numStr.charAt(0), 10);
    }
    // If it's a 4-digit number (e.g., "1401", "1002") -> floor is the first two digits
    if (numStr.length === 4) {
      return parseInt(numStr.substring(0, 2), 10);
    }
    // If it's 1 or 2 digits, assume it might be directly the floor number or ground floor
    if (numStr.length <= 2) {
      return parseInt(numStr, 10);
    }
  }
  
  // Default to ground floor if no pattern matches
  return 1; 
};

const getTypeStyles = (type, isSelected) => {
  const baseStyles = {
    // Professional Teal for Labs (focuses on precision/science)
    lab: { bg: '#f0fdfa', border: '#14b8a6', hover: '#ccfbf1', color: '#0f766e', typeBg: '#134e4a' },
    // Professional Amber for Lecture Halls (focuses on energy/attention)
    lecture_hall: { bg: '#fffbeb', border: '#f59e0b', hover: '#fef3c7', color: '#b45309', typeBg: '#78350f' },
    // Professional Slate Blue for Standard Halls (focuses on calm/standard)
    hall: { bg: '#f8fafc', border: '#64748b', hover: '#f1f5f9', color: '#334155', typeBg: '#1e293b' },
  };

  const style = baseStyles[type] || baseStyles.hall;

  return {
    background: isSelected ? style.hover : style.bg,
    border: `1px solid ${isSelected ? style.border : '#cbd5e1'}`,
    borderLeft: `4px solid ${style.border}`, // Sleeker side-border instead of top-border
    color: '#0f172a', 
    typeColor: style.typeBg, // Darker text for the type badge
    hoverBg: style.hover
  };
};

const Building2DView = ({ halls = [], selectedHallId, onSelectHall }) => {
  // Generate an array of 14 floors (14 down to 1 so top floor is physically at the top)
  const floors = Array.from({ length: 14 }, (_, i) => 14 - i);

  // Group halls by floor
  const hallsByFloor = floors.reduce((acc, floor) => {
    acc[floor] = [];
    return acc;
  }, {});

  halls.forEach((hall) => {
    let floor = getFloor(hall);
    // Limit to 1-14 floors
    floor = Math.max(1, Math.min(14, floor));
    if (hallsByFloor[floor]) {
      hallsByFloor[floor].push(hall);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', 
        fontSize: '13px', background: '#ffffff', padding: '12px 16px', 
        borderRadius: '10px', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <strong style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>Legend:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', background: '#f0fdfa', borderLeft: '3px solid #14b8a6', borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', borderRadius: '4px' }}></div>
          <span style={{ color: '#475569', fontWeight: 500 }}>Labs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', background: '#fffbeb', borderLeft: '3px solid #f59e0b', borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', borderRadius: '4px' }}></div>
          <span style={{ color: '#475569', fontWeight: 500 }}>Lecture Halls</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', background: '#f8fafc', borderLeft: '3px solid #64748b', borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', borderRadius: '4px' }}></div>
          <span style={{ color: '#475569', fontWeight: 500 }}>Standard Halls</span>
        </div>
      </div>
      
      {/* 14-Story Building Map */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#f1f5f9',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}
      >
        {floors.map((floorNum) => (
          <div key={`floor-${floorNum}`} style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            
            {/* Floor Indicator */}
            <div style={{ 
              width: '54px', 
              flexShrink: 0, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: '8px',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRight: '3px solid #94a3b8', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Floor</span>
              <span style={{ fontSize: '18px', fontWeight: '800' }}>{floorNum}</span>
            </div>

            {/* Rooms Container */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              flexGrow: 1,
              minHeight: '76px',
              background: '#ffffff',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
            }}>
              {hallsByFloor[floorNum].length > 0 ? (
                hallsByFloor[floorNum].map((hall) => {
                  const isSelected = selectedHallId === hall.id;
                  const roomType = getRoomType(hall);
                  const styles = getTypeStyles(roomType, isSelected);

                  return (
                    <button
                      key={hall.id}
                      onClick={() => onSelectHall(hall)}
                      onMouseEnter={(e) => {
                        if(!isSelected) e.currentTarget.style.background = styles.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if(!isSelected) e.currentTarget.style.background = styles.background;
                      }}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '8px',
                        border: styles.border,
                        borderLeft: styles.borderLeft,
                        background: styles.background,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                        opacity: hall.status === 'inactive' ? 0.5 : 1,
                        transform: isSelected ? 'translateY(-1px)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: styles.color }}>
                          {hall.name}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#475569', 
                          fontWeight: 600,
                          border: '1px solid #e2e8f0'
                        }}>
                          {hall.capacity}
                        </span>
                      </div>
                      
                      <span style={{ 
                        fontSize: '10px', 
                        color: styles.typeColor, 
                        fontWeight: '600',
                        display: 'inline-block',
                        opacity: 0.8
                      }}>
                        {roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gridColumn: '1 / -1', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                  No allocated rooms on this floor
                </div>
              )}
            </div>
            
          </div>
        ))}
        {/* Structural ground indicator */}
        <div style={{ height: '6px', background: '#cbd5e1', borderRadius: '3px', marginTop: '4px', width: '100%' }}></div>
      </div>
    </div>
  );
};

export default Building2DView;
