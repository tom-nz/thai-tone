import React, { useState } from 'react';

function App() {
  // สถานะการตั้งค่าและข้อมูลในแอป
  const [selectedGroup, setSelectedGroup] = useState('middle'); // middle, high, low
  const [inputWord, setInputWord] = useState('ขอ');
  const [colors, setColors] = useState({
    middle: '#28a745', // เขียว
    high: '#dc3545',   // แดง
    low: '#007bff'     // น้ำเงิน
  });

  // ตัวอย่างจำลองการผันเสียง 5 ระดับ (สามารถปรับแต่งคำนวณจริงได้ตามต้องการ)
  const tones = [
    { name: 'เสียงจัตวา', label: 'จัตวา', color: colors.high, text: inputWord ? `${inputWord} (จัตวา)` : '—' },
    { name: 'เสียงเอก', label: 'เอก', color: colors.low, text: inputWord ? `${inputWord} (เอก)` : '—' },
    { name: 'เสียงโท', label: 'โท', color: colors.high, text: inputWord ? `${inputWord} (โท)` : '—' },
    { name: 'เสียงสามัญ', label: 'สามัญ', color: colors.blue || '#007bff', text: inputWord ? `${inputWord} (สามัญ)` : '—' },
    { name: 'เสียงตรี', label: 'ตรี', color: colors.high, text: inputWord ? `${inputWord} (ตรี)` : '—' }
  ];

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* ส่วนหัวข้อ */}
      <h2 style={{ textAlign: 'center', color: '#333' }}>แผงควบคุม ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
      
      {/* ส่วนตั้งค่าสี */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🎨 ตั้งค่าสีประจำหมู่</h4>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
          <label>อักษรกลาง: <input type="color" value={colors.middle} onChange={(e) => setColors({...colors, middle: e.target.value})} /></label>
          <label>อักษรสูง: <input type="color" value={colors.high} onChange={(e) => setColors({...colors, high: e.target.value})} /></label>
          <label>อักษรต่ำ: <input type="color" value={colors.low} onChange={(e) => setColors({...colors, low: e.target.value})} /></label>
        </div>
      </div>

      {/* เลือกรูปแบบการผัน */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>⚙️ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <label>
            <input 
              type="radio" 
              name="groupType" 
              checked={selectedGroup === 'middle'} 
              onChange={() => setSelectedGroup('middle')} 
            /> อักษรกลาง
          </label>
          <label>
            <input 
              type="radio" 
              name="groupType" 
              checked={selectedGroup === 'high'} 
              onChange={() => setSelectedGroup('high')} 
            /> อักษรสูง
          </label>
          <label>
            <input 
              type="radio" 
              name="groupType" 
              checked={selectedGroup === 'low'} 
              onChange={() => setSelectedGroup('low')} 
            /> อักษรต่ำ
          </label>
        </div>
      </div>

      {/* ช่องกรอกคำ */}
      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>กรอกคำหลัก:</label>
        <input 
          type="text" 
          value={inputWord} 
          onChange={(e) => setInputWord(e.target.value)} 
          style={{ padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', width: '200px', textAlign: 'center' }}
          placeholder="เช่น ขอ, กา"
        />
      </div>

      {/* แสดงผล 5 เส้นบรรทัดวรรณยุกต์ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tones.map((tone, index) => (
          <div 
            key={index} 
            style={{ 
              backgroundColor: tone.color, 
              color: 'white', 
              padding: '12px 20px', 
              borderRadius: '6px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{tone.name}</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px' }}>
              {tone.text}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;