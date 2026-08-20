import React from 'react';

function ToneBoard({
  linesData,
  hoveredRowId,
  setHoveredRowId,
  labelFontSize,
  circleTextColor,
  bgType,
  bgColor,
  bgImage,
  viewLayout
}) {
  const isPresentMode = viewLayout === 'present';

  const boardStyle = {
    backgroundColor: bgType === 'color' ? bgColor : 'transparent',
    backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '12px',
    padding: isPresentMode ? '32px' : '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    minHeight: isPresentMode ? 'calc(100vh - 120px)' : '500px',
    position: 'relative'
  };

  return (
    <div style={boardStyle}>
      {linesData.map((item, idx) => {
        const isHovered = hoveredRowId === item.id;
        const currentFontSize = isHovered ? labelFontSize * 1.4 : labelFontSize;

        return (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: isPresentMode
                ? 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)'
                : '220px 1fr 110px',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setHoveredRowId(prev => prev === item.id ? null : item.id)}
          >
            {/* ชื่อเสียงและรูปวรรณยุกต์หน้าเส้น */}
            <div style={{
              fontSize: `${currentFontSize}px`,
              fontWeight: isHovered ? 'bold' : 'normal',
              color: isHovered ? '#1e293b' : '#334155',
              transition: 'font-size 0.2s ease, color 0.2s ease'
            }}>
              {item.tone} <span style={{ fontSize: '0.85em', color: '#64748b' }}>({item.mark})</span>
            </div>

            {/* เส้นบรรทัดและวงกลม */}
            <div style={{ position: 'relative', width: '100%', height: '30px', display: 'flex', alignItems: 'center' }}>
              {/* เส้นบรรทัด */}
              <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                height: isHovered ? '4px' : '2px',
                backgroundColor: isHovered ? '#3b82f6' : '#94a3b8',
                transform: 'translateY(-50%)',
                transition: 'all 0.2s ease'
              }} />

              {/* วงกลมพร้อมคำ */}
              {item.show && (
                <div style={{
                  position: 'absolute',
                  left: item.leftPos,
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.3 : 1})`,
                  width: isPresentMode ? '54px' : '44px',
                  height: isPresentMode ? '54px' : '44px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  color: circleTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: isPresentMode ? '1.4rem' : '1.1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  zIndex: 10
                }}>
                  {item.word}
                </div>
              )}
            </div>

            {/* ตำแหน่งเปอร์เซ็นต์ / ข้อมูลทางขวา */}
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
              {item.show ? item.leftPos : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ToneBoard;
