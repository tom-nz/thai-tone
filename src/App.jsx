import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   ตัวช่วยแปลงคำอ่าน (ใส่คำที่ต้องการให้ TTS อ่านถูกที่นี่)
========================================================= */
function getCorrectPronunciation(word) {
  const rules = {
    "จริง": "จิง",
    "สร้าง": "ส้าง",
    "ทราย": "ซาย",
    "เศร้า": "เส้า",
    "ทราบ": "ซาบ",
    "มื้อ": "มือ", // ตัวอย่างหากต้องการให้ TTS ไม่อ่านเสียงวรรณยุกต์ถ้าเพี้ยน
  };
  return rules[word] || word;
}

// ... (ฟังก์ชัน logic เดิม: midConsonants, highConsonants, lowSingleConsonants, ฯลฯ ให้คงไว้เหมือนที่เคยทำงานได้ปกติ)

/* =========================================================
   ฟังก์ชันเปิดหน้าต่างใหม่ (แก้ไขที่ทำให้ error)
========================================================= */
function openSecondScreen() {
  const baseUrl = window.location.href.split("?")[0];
  window.open(
    `${baseUrl}?view=display`,
    "ThaiToneDisplay",
    "width=1280,height=860,resizable=yes,scrollbars=yes"
  );
}

/* =========================================================
   App หลัก
========================================================= */
export default function App() {
  const [viewLayout, setViewLayout] = useState("standard");
  const [inputText, setInputText] = useState("มือ");
  // ... (state อื่นๆ เหมือนเดิม)

  // ฟังก์ชัน Speak ที่แก้ไขการออกเสียง
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    
    const pronunciation = getCorrectPronunciation(text);
    const utterance = new SpeechSynthesisUtterance(pronunciation);
    utterance.lang = "th-TH";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="app-page">
      {/* 1. แถบมุมมองด้านบน */}
      <nav className="top-nav panel">
        <div className="view-buttons">
          <strong>🖥️ มุมมอง:</strong>
          <button className={viewLayout === "standard" ? "selected-btn" : ""} onClick={() => setViewLayout("standard")}>ชิดเดียว</button>
          <button className={viewLayout === "split" ? "selected-btn" : ""} onClick={() => setViewLayout("split")}>แบ่ง 2 จอ</button>
          <button className={viewLayout === "preview" ? "selected-btn" : ""} onClick={() => setViewLayout("preview")}>โหมดพรีวิว</button>
        </div>
        <button className="green-btn" onClick={openSecondScreen}>🚀 แยกหน้าจอที่ 2</button>
      </nav>

      {/* 2. การจัด Frame */}
      {viewLayout === "preview" ? (
        <div className="preview-container"><Board {...props} /></div>
      ) : (
        <div className={`main-container ${viewLayout === "split" ? "split-layout" : ""}`}>
          <div className="left-frame"><Board {...props} /></div>
          <div className="right-frame"><ControlPanel {...props} /></div>
        </div>
      )}
    </main>
  );
}

// ... (เติม style และส่วนประกอบย่อย Board/ControlPanel ให้ครบเหมือนฉบับก่อนหน้า)