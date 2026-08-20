import React from 'react';

function ControlPanel({
  inputText,
  setInputText,
  mode,
  setMode,
  loading,
  inputError,
  handleAnalyze,
  handleQuickSelect,
  analysisInfo,
  quickConsonants,
  longVowels,
  shortVowels,
  thaiClusters
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ส่วนป้อนคำและปุ่มคำเป็น/คำตาย */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>ป้อนคำและรูปแบบคำ</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="พิมพ์คำ เช่น กอ, ขา, คา..."
            style={{
              flex: 1, padding: '8px 12px', fontSize: '1rem',
              borderRadius: '6px', border: '1px solid #cbd5e1'
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
            }}
          >
            {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์'}
          </button>
        </div>

        {inputError && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px' }}>
            {inputError}
          </div>
        )}

        {/* ตัวเลือกคำเป็น / คำตาย */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('live')}
            style={{
              flex: 1, padding: '8px', border: '1px solid #2563eb', borderRadius: '6px',
              backgroundColor: mode === 'live' ? '#2563eb' : '#fff',
              color: mode === 'live' ? '#fff' : '#2563eb',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}
          >
            คำเป็น
          </button>
          <button
            onClick={() => setMode('dead')}
            style={{
              flex: 1, padding: '8px', border: '1px solid #dc2626', borderRadius: '6px',
              backgroundColor: mode === 'dead' ? '#dc2626' : '#fff',
              color: mode === 'dead' ? '#fff' : '#dc2626',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}
          >
            คำตาย
          </button>
        </div>
      </div>

      {/* เลือกพยัญชนะด่วน */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>พยัญชนะ (ก-ฮ)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
          {quickConsonants.map(c => (
            <button
              key={c}
              onClick={() => handleQuickSelect(c)}
              style={{
                width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '4px',
                backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* เลือกคำควบกล้ำ / อักษรนำ */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>คำควบกล้ำ / อักษรนำ</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
          {thaiClusters.map(cl => (
            <button
              key={cl}
              onClick={() => handleQuickSelect(cl)}
              style={{
                padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px',
                backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {cl}
            </button>
          ))}
        </div>
      </div>

      {/* เลือกสระด่วน (ยาว / สั้น) */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>สระเสียงยาว</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {longVowels.map(v => (
            <button
              key={v.label}
              onClick={() => handleQuickSelect(v.label)}
              style={{
                padding: '4px 8px', border: '1px solid #bbf7d0', borderRadius: '4px',
                backgroundColor: '#f0fdf4', cursor: 'pointer', fontSize: '0.8rem', color: '#166534'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>สระเสียงสั้น</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {shortVowels.map(v => (
            <button
              key={v.label}
              onClick={() => handleQuickSelect(v.label)}
              style={{
                padding: '4px 8px', border: '1px solid #fecdd3', borderRadius: '4px',
                backgroundColor: '#fff1f2', cursor: 'pointer', fontSize: '0.8rem', color: '#9f1239'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* แสดงการวิเคราะห์หลักภาษา */}
      {analysisInfo && analysisInfo.type && (
        <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#1e40af', fontSize: '0.95rem' }}>ผลการวิเคราะห์หลักภาษา</h4>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>{analysisInfo.type}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#3b82f6' }}>{analysisInfo.vowelLen}</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>{analysisInfo.desc}</p>
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
