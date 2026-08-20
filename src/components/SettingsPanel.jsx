import React from 'react';

function SettingsPanel({
  colorMid, setColorMid,
  colorHigh, setColorHigh,
  colorLow, setColorLow,
  circleTextColor, setCircleTextColor,
  labelFontSize, setLabelFontSize,
  bgType, setBgType,
  bgColor, setBgColor,
  bgImage, setBgImage,
  handleBgImageUpload
}) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>ปรับแต่งการแสดงผล</h3>

      {/* การตั้งค่าสีเสียง */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>อักษรกลาง</label>
          <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ width: '100%', height: '32px', cursor: 'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>อักษรสูง</label>
          <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ width: '100%', height: '32px', cursor: 'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>อักษรต่ำ</label>
          <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ width: '100%', height: '32px', cursor: 'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>ตัวหนังสือในวงกลม</label>
          <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ width: '100%', height: '32px', cursor: 'pointer' }} />
        </div>
      </div>

      {/* ขนาดฟอนต์ */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '4px' }}>
          ขนาดฟอนต์ข้อความหน้าเส้น: {labelFontSize}px
        </label>
        <input
          type="range" min="14" max="36" value={labelFontSize}
          onChange={(e) => setLabelFontSize(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* พื้นหลังกระดาน */}
      <div>
        <label style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>พื้นหลังกระดาน</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => setBgType('color')}
            style={{
              padding: '4px 12px', borderRadius: '4px', border: '1px solid #cbd5e1',
              backgroundColor: bgType === 'color' ? '#2563eb' : '#fff',
              color: bgType === 'color' ? '#fff' : '#334155', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            สีพื้นหลัง
          </button>
          <button
            onClick={() => setBgType('image')}
            style={{
              padding: '4px 12px', borderRadius: '4px', border: '1px solid #cbd5e1',
              backgroundColor: bgType === 'image' ? '#2563eb' : '#fff',
              color: bgType === 'image' ? '#fff' : '#334155', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            อัปโหลดรูป
          </button>
        </div>

        {bgType === 'color' ? (
          <input
            type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
            style={{ width: '100%', height: '32px', cursor: 'pointer' }}
          />
        ) : (
          <input
            type="file" accept="image/*" onChange={handleBgImageUpload}
            style={{ fontSize: '0.8rem' }}
          />
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;
