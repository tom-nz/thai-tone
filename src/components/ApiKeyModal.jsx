import React from 'react';

function ApiKeyModal({ showApiInput, setShowApiInput, tempApiKey, setTempApiKey, onSaveKey, onClearKey, apiKey }) {
  if (!showApiInput) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
        width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.25rem', color: '#1e293b' }}>
          ตั้งค่า Gemini API Key
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
          ใส่ API Key สำหรับใช้งานปัญญาประดิษฐ์ในการวิเคราะห์คำผันวรรณยุกต์
        </p>
        <input
          type="password"
          placeholder="AIzaSy..."
          value={tempApiKey}
          onChange={(e) => setTempApiKey(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '6px',
            border: '1px solid #cbd5e1', marginBottom: '16px', fontSize: '0.9rem',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            {apiKey && (
              <button
                onClick={onClearKey}
                style={{
                  padding: '8px 14px', backgroundColor: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                ลบ Key
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowApiInput(false)}
              style={{
                padding: '8px 14px', backgroundColor: '#e2e8f0', color: '#475569',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={onSaveKey}
              style={{
                padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
              }}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
