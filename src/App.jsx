import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   ตัวช่วยแปลงคำอ่านให้ TTS ออกเสียงถูกต้อง (ก่อนส่งไปอ่าน)
========================================================= */
function getCorrectPronunciation(word) {
  // กฎพื้นฐาน: คำควบไม่แท้, ตัวสะกดพิเศษ
  const rules = {
    "จริง": "จิง",
    "สร้าง": "ส้าง",
    "ทราย": "ซาย",
    "เศร้า": "เส้า",
    "ทราบ": "ซาบ",
  };
  return rules[word] || word;
}

// ... (เก็บโครงสร้างเดิมของพยัญชนะ/สระ/ฟังก์ชัน logic)

/* =========================================================
   ส่วน Board: ย้าย thai-guide-box ไว้ใต้ tone-rows
========================================================= */
function Board({ linesData, inputText, analysisInfo, activeRowId, onRowClick, circleTextColor }) {
  return (
    <div className="tone-board">
      <div className="board-title">
        <h1>ไตรยางศ์ หรือ อักษร 3 หมู่ และการผันวรรณยุกต์</h1>
      </div>

      {inputText && (
        <div className="analysis-box">
          <strong>📌 ผลวิเคราะห์:</strong> {analysisInfo.consonantLabel} — {analysisInfo.detail}
        </div>
      )}

      <div className="tone-rows">
        {linesData.map((item) => (
          <button type="button" key={item.id} className={`tone-row ${activeRowId === item.id ? "active" : ""}`} onClick={() => item.show && onRowClick(item)}>
            <div className="tone-name" style={{ color: item.color }}>{item.tone} [{item.mark}]</div>
            <div className="tone-line-wrap">
              <div className="tone-line" />
              {/* วงกลมและเขบ็ตจะใช้สีเดียวกับบรรทัด */}
              {item.show && (
                <div className="circle-position" style={{ left: item.leftPos }}>
                  <div className="tone-circle" style={{ backgroundColor: item.color, color: circleTextColor }}>
                    <svg className="note-tail" viewBox="0 0 22 54" fill="currentColor"><path d="M 3 52 L 3 3 M 4 3 C 13 8, 21 16, 16 28 C 12 20, 8 13, 4 9 Z"/></svg>
                    <span>{item.isMulti ? item.multi[0].text : item.word}</span>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="thai-guide-box">
        <strong>📚 หลักการผันวรรณยุกต์ที่ควรรู้</strong>
        {/* ... เนื้อหาเดิม ... */}
      </div>
    </div>
  );
}

/* =========================================================
   แอปหลัก (แก้ไข Layout)
========================================================= */
export default function App() {
  // ... (states เดิม)

  function speak(text) {
    if (!speechEnabled) return;
    const pronunciation = getCorrectPronunciation(text); // แปลงคำก่อนอ่าน
    const utterance = new SpeechSynthesisUtterance(pronunciation);
    window.speechSynthesis.speak(utterance);
  }

  // ... (render)
  return (
    <main className="app-page">
      {/* 1. แถบมุมมองด้านบนแยกจากแผงควบคุม */}
      <nav className="top-nav panel">
        <div className="view-buttons">
          <strong>🖥️ มุมมอง:</strong>
          <button onClick={() => setViewLayout("standard")}>ชิดเดียว</button>
          <button onClick={() => setViewLayout("split")}>แบ่ง 2 จอ</button>
          <button onClick={() => setViewLayout("preview")}>โหมดพรีวิว</button>
        </div>
        <button className="green-btn" onClick={openSecondScreen}>🚀 แยกหน้าจอที่ 2</button>
      </nav>

      {/* 2. การจัดการเฟรม (ถ้าไม่ใช่โหมดพรีวิว) */}
      {viewLayout !== "preview" ? (
        <div className="main-container">
          <div className="left-frame"><Board {...props} /></div>
          <div className="right-frame"><ControlPanel /></div>
        </div>
      ) : (
        <div className="preview-container"><Board {...props} /></div>
      )}
    </main>
  );
}