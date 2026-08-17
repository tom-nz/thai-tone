import React, { useState } from 'react';

function App() {
  const [word] = useState({
    low: 'คอ',
    high: 'ขอ'
  });

  const lines = [
    { tone: 'เสียงจัตวา', mark: '  ้ ', pos: 5, circle: { text: word.high, color: '#dc3545', align: '80%' }, rightText: 'เสียงสูง', rightColor: '#dc3545' },
    { tone: 'เสียงตรี', mark: '  ๊ ', pos: 4, circle: { text: word.low, color: '#007bff', align: '65%' }, rightText: '', rightColor: '' },
    { 
      tone: 'เสียงโท', 
      mark: '  ่ ', 
      pos: 3, 
      multiCircle: [
        { text: 'ค่อ', color: '#007bff', align: '55%' },
        { text: '/', isDivider: true, align: '60%' },
        { text: 'ข้อ', color: '#dc3545', align: '65%' }
      ],
      rightText: 'เสียงกลาง', 
      rightColor: '#28a745' 
    },
    { tone: 'เสียงเอก', mark: '  ่ ', pos: 2, circle: { text: 'ข่อ', color: '#dc3545', align: '45%' }, rightText: '', rightColor: '' },
    { tone: 'เสียงสามัญ', mark: '', pos: 1, circle: { text: word.low, color: '#007bff', align: '35%' }, rightText: 'เสียงต่ำ', rightColor: '#007bff' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', maxWidth: '850px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        {/* หัวข้อหลัก */}
        <h1 style={{ textAlign: 'center', color: '#e65100', fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>
          ไตรยางศ์ หรือ อักษร 3 หมู่
        </h1>

        {/* หัวคอลัมน์ */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', marginBottom: '15px', color: '#333', fontWeight: 'bold' }}>
          <div style={{ textAlign: 'center' }}>รูปวรรณยุกต์</div>
          <div></div>
          <div style={{ textAlign: 'center' }}></div>
        </div>

        {/* ตารางบรรทัด 5 เส้น */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {lines.map((line, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', alignItems: 'center' }}>
              
              {/* ชื่อเสียงและรูปวรรณยุกต์ */}
              <div style={{ color: '#333', fontSize: '16px', fontWeight: '500' }}>
                {line.tone} <span style={{ color: '#666' }}>[{line.mark}]</span>
              </div>

              {/* เส้นบรรทัดแนวนอนและวงกลมคำ */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }}>
                {/* เส้นเทาแนวนอน */}
                <div style={{ width: '100%', height: '2px', backgroundColor: '#9ca3af' }}></div>

                {/* แสดงวงกลมเดี่ยว */}
                {line.circle && (
                  <div style={{
                    position: 'absolute',
                    left: line.circle.align,
                    transform: 'translateX(-50%)',
                    backgroundColor: line.circle.color,
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {line.circle.text}
                  </div>
                )}

                {/* แสดงกรณีมี 2 วงกลม (เสียงโท) */}
                {line.multiCircle && (
                  <div style={{ position: 'absolute', left: '58%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ backgroundColor: '#007bff', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      ค่อ
                    </div>
                    <span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 'bold' }}>/</span>
                    <div style={{ backgroundColor: '#dc3545', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      ข้อ
                    </div>
                  </div>
                )}
              </div>

              {/* ข้อความกำกับหมู่ทางขวา */}
              <div style={{ textAlign: 'center', color: line.rightColor, fontWeight: 'bold', fontSize: '16px' }}>
                {line.rightText}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default App;