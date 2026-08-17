import React, { useState } from 'react';

function App() {
  const [mode, setMode] = useState('pair'); // 'single' หรือ 'pair'
  const [wordLow, setWordLow] = useState('คอ');
  const [wordHigh, setWordHigh] = useState('ขอ');
  
  // สีประจำหมู่
  const [colorMiddle, setColorMiddle] = useState('#22c55e');
  const [colorHigh, setColorHigh] = useState('#ef4444');
  const [colorLow, setColorLow] = useState('#3b82f6');

  // ข้อมูลเส้น 5 เส้น
  const lines = [
    { tone: 'เสียงจัตวา', mark: ' ', pos: 5, circle: { text: wordHigh, color: colorHigh, left: '80%' }, rightText: 'เสียงสูง', rightColor: colorHigh },
    { tone: 'เสียงตรี', mark: ' ๊ ', pos: 4, circle: { text: wordLow, color: colorLow, left: '65%' }, rightText: '', rightColor: '' },
    { 
      tone: 'เสียงโท', 
      mark: ' ่ ', 
      pos: 3, 
      multi: [
        { text: 'ค่อ', color: colorLow },
        { text: 'ข้อ', color: colorHigh }
      ],
      left: '55%',
      rightText: 'เสียงกลาง', 
      rightColor: colorMiddle 
    },
    { tone: 'เสียงเอก', mark: ' ่ ', pos: 2, circle: { text: 'ข่อ', color: colorHigh, left: '45%' }, rightText: '', rightColor: '' },
    { tone: 'เสียงสามัญ', mark: '', pos: 1, circle: { text: wordLow, color: colorLow, left: '35%' }, rightText: 'เสียงต่ำ', rightColor: colorLow },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '30px 15px', fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แผงควบคุม (Control Panel) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }}>แผงควบคุม</h3>
          
          {/* แถบตั้งค่าสีประจำหมู่ */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ height: '32px', backgroundColor: colorMiddle, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>อักษรกลาง</div>
              <div style={{ height: '32px', backgroundColor: colorHigh, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>อักษรสูง</div>
              <div style={{ height: '32px', backgroundColor: colorLow, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>อักษรต่ำ</div>
            </div>
          </div>

          {/* แถบผันวรรณยุกต์อัตโนมัติ */}
          <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '14px', color: '#4b5563' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={mode === 'single'} onChange={() => setMode('single')} />
                ผันเฉพาะคำนั้น
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={mode === 'pair'} onChange={() => setMode('pair')} />
                ผันคู่อักษรสูง-ต่ำ (เช่น คอ ขอ ค่อ/ข้อ ค้อ ขอ)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={wordLow} 
                onChange={(e) => setWordLow(e.target.value)}
                placeholder="คำหลัก เช่น คอ" 
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px' }}
              />
              <button style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                สร้างคำด้วย AI
              </button>
            </div>
          </div>
        </div>

        {/* กระดานบรรทัด 5 เส้น */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h2 style={{ textAlign: 'center', color: '#ea580c', fontSize: '28px', fontWeight: 'bold', margin: '0 0 35px 0' }}>
            ไตรยางศ์ หรือ อักษร 3 หมู่
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', marginBottom: '15px', color: '#4b5563', fontWeight: 'bold', fontSize: '15px' }}>
            <div style={{ textAlign: 'left' }}>รูปวรรณยุกต์</div>
            <div></div>
            <div></div>
          </div>

          {/* รายการเส้น 5 เส้น */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', alignItems: 'center' }}>
                
                {/* ด้านซ้าย: ชื่อเสียงและรูป */}
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                  {line.tone} <span style={{ color: '#9ca3af' }}>[{line.mark}]</span>
                </div>

                {/* กลาง: เส้นบรรทัดและวงกลมคำอ่าน */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '24px' }}>
                  <div style={{ width: '100%', height: '2px', backgroundColor: '#9ca3af' }}></div>

                  {/* วงกลมเดี่ยว */}
                  {line.circle && (
                    <div 
                      className="tone-circle"
                      style={{
                        position: 'absolute',
                        left: line.circle.left,
                        transform: 'translateX(-50%)',
                        backgroundColor: line.circle.color,
                        color: '#ffffff',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, filter 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                    >
                      {line.circle.text}
                    </div>
                  )}

                  {/* วงกลมคู่ (เสียงโท) */}
                  {line.multi && (
                    <div style={{ position: 'absolute', left: line.left, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {line.multi.map((item, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '18px' }}>/</span>}
                          <div 
                            style={{
                              backgroundColor: item.color,
                              color: '#ffffff',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '15px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease, filter 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                          >
                            {item.text}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                {/* ด้านขวา: ระดับเสียง */}
                <div style={{ textAlign: 'center', color: line.rightColor, fontWeight: 'bold', fontSize: '15px' }}>
                  {line.rightText}
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;