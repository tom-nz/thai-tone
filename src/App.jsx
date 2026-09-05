import React, { useState } from "react";

/** ==========================================
 *  MODULE 1: ข้อมูลหลัก (Constants & Rules)
 *  ========================================== */
const TONE_RULES = {
  mid: { type: 'mid', label: 'อักษรกลาง' },
  high: { type: 'high', label: 'อักษรสูง' },
  low: { type: 'low', label: 'อักษรต่ำ' }
};

const PRONUNCIATION_MAP = {
  "จริง": "จิง", "สร้าง": "ส้าง", "ทราย": "ซาย", "เศร้า": "เส้า", "ทราบ": "ซาบ"
};

/** ==========================================
 *  MODULE 2: ฟังก์ชันช่วย (Utils)
 *  ========================================== */
function getCorrectPronunciation(word) {
  return PRONUNCIATION_MAP[word] || word;
}

/** ==========================================
 *  MODULE 3: คอมโพเนนต์ UI
 *  ========================================== */
function Board({ viewLayout }) {
  return (
    <div className="board-container" style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h1>ไตรยางศ์และการผันวรรณยุกต์</h1>
      <div className="music-staff-box" style={{ height: '200px', background: '#f8f8f8', marginBottom: '20px' }}>
        {/* บรรทัด 5 เส้น */}
      </div>
      <div className="analysis-box">ผลวิเคราะห์หลักภาษา...</div>
      <div className="tone-rows-display">การผัน 5 เสียง...</div>
      <div className="thai-guide-box">
        <strong>หลักการเรียนรู้:</strong> ไตรยางศ์คือการแบ่งพยัญชนะไทย...
      </div>
    </div>
  );
}

function ControlPanel() {
  return (
    <div className="control-panel" style={{ padding: '20px', background: '#eee' }}>
      <h2>แผงควบคุม</h2>
      <input type="text" placeholder="พิมพ์คำที่นี่..." />
    </div>
  );
}

/** ==========================================
 *  MODULE 4: แอปหลัก (Main)
 *  ========================================== */
export default function App() {
  const [viewLayout, setViewLayout] = useState("standard");

  const openSecondScreen = () => {
    const win = window.open("", "_blank", "width=1000,height=800");
    win.document.write("<html><head><title>Monitor 2</title></head><body><div id='root'></div></body></html>");
    // ในโปรเจกต์จริง ต้องมีการ render ตัว Board ลงใน win.document นี้
  };

  const handleSpeak = (text) => {
    const cleanText = getCorrectPronunciation(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-main">
      {/* ส่วนควบคุมด้านบน */}
      <nav className="top-nav" style={{ display: 'flex', gap: '10px', padding: '10px', background: '#333', color: '#fff' }}>
        <button onClick={() => setViewLayout("standard")}>ชิดเดียว</button>
        <button onClick={() => setViewLayout("split")}>แบ่ง 2 เฟรม</button>
        <button onClick={() => setViewLayout("preview")}>โหมดพรีวิว</button>
        <button onClick={openSecondScreen} style={{ marginLeft: 'auto', background: 'green', color: 'white' }}>แยกจอมอนิเตอร์ 2</button>
      </nav>

      {/* ส่วนแสดงผลหลัก */}
      {viewLayout === "preview" ? (
        <Board viewLayout="preview" />
      ) : (
        <div style={{ display: 'flex', flexDirection: viewLayout === 'split' ? 'row' : 'column' }}>
          <div style={{ flex: 1 }}><Board /></div>
          {viewLayout === 'split' && <div style={{ flex: 1 }}><ControlPanel /></div>}
        </div>
      )}
    </div>
  );
}