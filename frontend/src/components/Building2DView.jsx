import React from 'react';

const MAIN_BUILDING_FLOORS = 8;
const NEW_BUILDING_FLOORS = 14;

const getRoomType = (hall) => {
  const explicitKind = String(hall.roomKind || hall.typeKind || hall.roomType || '').toLowerCase();
  if (explicitKind === 'lab') return 'lab';
  if (explicitKind === 'lecture_hall' || explicitKind === 'lecturehall') return 'lecture_hall';
  if (explicitKind === 'hall_a') return 'hall_a';
  if (explicitKind === 'hall_b') return 'hall_b';

  const name = (hall.name || '').toLowerCase();
  const features = Array.isArray(hall.features) ? hall.features.map((feature) => feature.toLowerCase()) : [];
  const matches = (keyword) => name.includes(keyword) || features.some((feature) => feature.includes(keyword));

  if (matches('lab') || matches('computer') || matches('practical')) return 'lab';
  if (matches('lecture') || matches('auditorium') || matches('theater')) return 'lecture_hall';
  if (matches('type a') || matches('a type') || matches('hall a')) return 'hall_a';
  if (matches('type b') || matches('b type') || matches('hall b')) return 'hall_b';
  return 'hall';
};

const getFloor = (hall) => {
  const explicitFloor = Number(hall.floor || hall.level);
  if (Number.isFinite(explicitFloor) && explicitFloor > 0) return explicitFloor;

  const name = String(hall.name || '').trim();
  const explicitMatch = name.match(/f\s*(\d+)|floor\s*(\d+)/i);
  if (explicitMatch) return parseInt(explicitMatch[1] || explicitMatch[2], 10);

  const numMatch = name.match(/\d+/);
  if (numMatch) {
    const numStr = numMatch[0];
    if (numStr.length === 3) return parseInt(numStr.charAt(0), 10);
    if (numStr.length === 4) return parseInt(numStr.substring(0, 2), 10);
    if (numStr.length <= 2) return parseInt(numStr, 10);
  }

  return 1;
};

const getTypeStyles = (type, isSelected) => {
  const baseStyles = {
    lab: { bg: '#f0fdfa', border: '#14b8a6', hover: '#ccfbf1', color: '#0f766e', typeBg: '#134e4a' },
    lecture_hall: { bg: '#fffbeb', border: '#f59e0b', hover: '#fef3c7', color: '#b45309', typeBg: '#78350f' },
    hall_a: { bg: '#eef2ff', border: '#6366f1', hover: '#e0e7ff', color: '#4338ca', typeBg: '#312e81' },
    hall_b: { bg: '#fdf2f8', border: '#db2777', hover: '#fce7f3', color: '#be185d', typeBg: '#831843' },
    hall: { bg: '#f8fafc', border: '#64748b', hover: '#f1f5f9', color: '#334155', typeBg: '#1e293b' },
  };

  const style = baseStyles[type] || baseStyles.hall;

  return {
    background: isSelected ? style.hover : style.bg,
    border: `1px solid ${isSelected ? style.border : '#cbd5e1'}`,
    borderLeft: `4px solid ${style.border}`,
    color: '#0f172a',
    typeColor: style.typeBg,
    hoverBg: style.hover,
  };
};

const getBuildingName = (hall) => {
  const building = String(hall.building || hall.features?.building || '').trim();
  if (building) return building;
  const name = String(hall.name || '').toLowerCase();
  if (name.includes('main')) return 'Main Building';
  return 'New Building';
};

const makeDummyMainFloors = () => {
  const floors = Array.from({ length: MAIN_BUILDING_FLOORS }, (_, index) => index + 1);
  return floors.map((floor) => [
    { id: `MB-${floor}01A`, name: `MB-${floor}01A`, floor, capacity: 42 + floor, building: 'Main Building', roomKind: 'hall_a' },
    { id: `MB-${floor}02B`, name: `MB-${floor}02B`, floor, capacity: 36 + floor, building: 'Main Building', roomKind: 'hall_b' },
    { id: `MB-L${floor}`, name: `MB-L${floor}`, floor, capacity: 28 + (floor % 3) * 2, building: 'Main Building', roomKind: 'lab' },
  ]).flat();
};

const renderBuildingSection = ({ title, subtitle, floorCount, rooms, selectedHallId, onSelectHall }) => {
  const floors = Array.from({ length: floorCount }, (_, index) => floorCount - index);
  const hallsByFloor = floors.reduce((acc, floor) => {
    acc[floor] = [];
    return acc;
  }, {});

  rooms.forEach((hall) => {
    const floor = Math.max(1, Math.min(floorCount, getFloor(hall)));
    if (hallsByFloor[floor]) hallsByFloor[floor].push(hall);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{title}</h4>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>
        </div>
        <div style={{ borderRadius: '999px', border: '1px solid #bae6fd', background: '#ecfeff', padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#155e75', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {floorCount} floors
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '620px', overflowY: 'auto' }}>
        {floors.map((floorNum) => (
          <div key={`${title}-floor-${floorNum}`} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
            <div style={{ width: '56px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '10px', color: '#334155', border: '1px solid #cbd5e1', borderRight: '3px solid #94a3b8' }}>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Floor</span>
              <span style={{ fontSize: '18px', fontWeight: 800 }}>{floorNum}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', flexGrow: 1, minHeight: '78px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {hallsByFloor[floorNum].length > 0 ? (
                hallsByFloor[floorNum].map((hall) => {
                  const isSelected = selectedHallId === hall.id;
                  const roomType = getRoomType(hall);
                  const styles = getTypeStyles(roomType, isSelected);

                  return (
                    <button
                      key={hall.id}
                      type="button"
                      onClick={() => onSelectHall(hall)}
                      style={{ padding: '12px 10px', borderRadius: '10px', border: styles.border, borderLeft: styles.borderLeft, background: styles.background, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: isSelected ? '0 6px 16px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.03)', opacity: hall.status === 'inactive' ? 0.55 : 1, transform: isSelected ? 'translateY(-1px)' : 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: styles.color }}>{hall.name}</span>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '999px', color: '#475569', fontWeight: 700, border: '1px solid #e2e8f0' }}>{hall.capacity}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: styles.typeColor, fontWeight: 700, opacity: 0.9 }}>
                        {roomType.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gridColumn: '1 / -1', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', minHeight: '78px' }}>
                  No allocated rooms on this floor
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Building2DView = ({ halls = [], selectedHallId, onSelectHall }) => {
  const normalizedHalls = halls.map((hall) => ({
    ...hall,
    building: getBuildingName(hall),
  }));

  const mainBuildingActualRooms = normalizedHalls.filter((hall) => hall.building.toLowerCase().includes('main'));
  const newBuildingRooms = normalizedHalls.filter((hall) => !hall.building.toLowerCase().includes('main'));
  const mainBuildingRooms = mainBuildingActualRooms.length > 0 ? mainBuildingActualRooms : makeDummyMainFloors();
  const newBuildingRoomsFinal = newBuildingRooms.length > 0 ? newBuildingRooms : [];

  const legendItems = [
    { label: 'Labs', background: '#f0fdfa', border: '#14b8a6' },
    { label: 'Lecture Halls', background: '#fffbeb', border: '#f59e0b' },
    { label: 'A Type Halls', background: '#eef2ff', border: '#6366f1' },
    { label: 'B Type Halls', background: '#fdf2f8', border: '#db2777' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13px', background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <strong style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>Legend:</strong>
        {legendItems.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', background: item.background, borderLeft: `3px solid ${item.border}`, borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', borderRadius: '4px' }} />
            <span style={{ color: '#475569', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
          {renderBuildingSection({
            title: 'New Building',
            subtitle: 'Existing campus block with full hall coverage.',
            floorCount: NEW_BUILDING_FLOORS,
            rooms: newBuildingRoomsFinal,
            selectedHallId,
            onSelectHall,
          })}
        </div>

        <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
          {renderBuildingSection({
            title: 'Main Building',
            subtitle: '8 floors with A/B halls, lecture halls, and labs.',
            floorCount: MAIN_BUILDING_FLOORS,
            rooms: mainBuildingRooms,
            selectedHallId,
            onSelectHall,
          })}
        </div>
      </div>
    </div>
  );
};

export default Building2DView;
