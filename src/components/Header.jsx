import React from 'react';

function Header({ viewLayout, setViewLayout, setShowApiInput, apiKey, openDisplayWindow }) {
  return (
    <header className="app-header" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px', backgroundColor: '#1e293b', color: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
          ระบบวิเคราะห์และผันวรรณยุกต์ไทย
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* เลือกโหมดแสดงผล */}
        <div style={{ display: 'flex', backgroundColor: '#334155', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setViewLayout('standard')}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
              backgroundColor: viewLayout === 'standard' ? '#2563eb' : 'transparent',
              color: '#fff', fontSize: '0.85rem', fontWeight: 500
            }}
          >
            ปกติ
          </button>
          <button
            onClick={() => setViewLayout('split')}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
              backgroundColor: viewLayout === 'split' ? '#2563eb' : 'transparent',
              color: '#fff', fontSize: '0.85rem', fontWeight: 500
            }}
          >
            สองจอ (Split)
          </button>
          <button
            onClick={() => setViewLayout('present')}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
              backgroundColor: viewLayout === 'present' ? '#2563eb' : 'transparent',
              color: '#fff', fontSize: '0.85rem', fontWeight: 500
            }}
          >
            เฉพาะบอร์ด
          </button>
        </div>

        {/* ปุ่มเปิดหน้าจอแยก */}
        <button
          onClick={openDisplayWindow}
          style={{
            padding: '6px 12px', backgroundColor: '#0d9488', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          🖥️ หน้าจอแยก
        </button>

        {/* ปุ่ม API Key */}
        <button
          onClick={() => setShowApiInput(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: apiKey ? '#16a34a' : '#475569',
            color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          {apiKey ? '🔑 Key แล้ว' : '⚙️ ตั้งค่า Key'}
        </button>
      </div>
    </header>
  );
}

export default Header;
