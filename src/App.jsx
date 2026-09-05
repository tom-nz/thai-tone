import React, { useState, useEffect, useMemo } from "react";

// --- โค้ดส่วนประกอบหลัก (Logic & Constants) ---
const midConsonants = ["ก", "จ", "ฎ", "ฏ", "ด", "ต", "บ", "ป", "อ"];
const highConsonants = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
const quickConsonants = ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"];

// สร้างไฟล์ฉบับเต็มที่มี CSS ในตัว
export default function App() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("full5");
  const [colorMid, setColorMid] = useState("#22c55e");
  const [colorHigh, setColorHigh] = useState("#ef4444");
  const [colorLow, setColorLow] = useState("#0284c7");
  const [bgColor, setBgColor] = useState("#e2e8f0");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);

  // ฟังก์ชันช่วยแสดงผล
  const handleRowClick = (item) => {
    setHoveredRowId(hoveredRowId === item.id ? null : item.id);
    if (isSpeaking && item.word) {
      const msg = new SpeechSynthesisUtterance(item.word);
      msg.lang = "th-TH";
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: bgColor, overflow: 'hidden' }}>
      {/* ฝั่งซ้าย: ตรึงหน้าจอ */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', flex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#ea580c' }}>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
          <div style={{ borderTop: '2px solid #ccc', marginTop: '20px', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
             {/* ใส่ Loop วาด 5 บรรทัดที่นี่ (ดึงจาก linesData ในโค้ดเดิมของคุณ) */}
             {['จัตวา','ตรี','โท','เอก','สามัญ'].map((t, i) => (
                <div key={i} onClick={() => setHoveredRowId(i)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.3s', transform: hoveredRowId === i ? 'scale(1.05)' : 'scale(1)' }}>
                   <div style={{ width: '100px', fontWeight: 'bold' }}>{t}</div>
                   <div style={{ flex: 1, height: '4px', background: '#94a3b8' }}></div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: เลื่อนได้ */}
      <div style={{ width: '450px', background: '#fff', overflowY: 'auto', padding: '20px' }}>
        <h3>⚙️ แผงควบคุม</h3>
        
        {/* Radio buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {['ผันครบทั้ง 5 เสียง', 'ผันอักษรสูง', 'ผันอักษรต่ำ'].map(label => (
            <button key={label} onClick={() => setMode(label)} style={{ background: mode === label ? '#fff' : '#000', color: mode === label ? '#000' : '#fff' }}>{label}</button>
          ))}
        </div>

        {/* กล่องพยัญชนะ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '4px' }}>
          {quickConsonants.map(c => <button key={c} onClick={() => setInputText(c)}>{c}</button>)}
        </div>

        {/* ปุ่มเสียง */}
        <button onClick={() => setIsSpeaking(!isSpeaking)} style={{ marginTop: '20px' }}>
          {isSpeaking ? '🔊 ปิดเสียง' : '🔇 เปิดเสียง'}
        </button>

        {/* API Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc' }}>
          <h4>Google AI Analysis</h4>
          <input placeholder="Enter API Key" type="password" />
        </div>
      </div>
    </div>
  );
}