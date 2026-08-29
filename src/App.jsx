import React, { useState } from "react";
import TopBar from "./components/TopBar";
import StaffBoard from "./components/StaffBoard";
import ControlPanel from "./components/ControlPanel";
import { analyzeWord } from "./utils/toneEngine";

/**
 * Main Application Component
 */
export default function App() {
  const [viewMode, setViewMode] = useState("split");
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("full5");
  const [placedNotes, setPlacedNotes] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);

  // คำนวณและวางลูกบอลตัวโน้ต
  const handleGenerate = (text) => {
    const word = text !== undefined ? text : inputText;
    if (!word || !word.trim()) return;

    setAnalysisInfo(analyzeWord(word));
    setPlacedNotes({
      จัตวา: word === "กอ" ? "ก๋อ" : word,
      ตรี:   word === "กอ" ? "ก๊อ" : word,
      โท:    word === "กอ" ? "ก้อ" : word,
      เอก:   word === "กอ" ? "ก่อ" : word,
      สามัญ: word
    });
  };

  // เมื่อเลือกพยัญชนะด่วน
  const handleQuickSelect = (word) => {
    setInputText(word);
    setMode("full5");
    handleGenerate(word);
  };

  const handleBackgroundClick = () => {
    // รีเซ็ตสถานะเมื่อคลิกพื้นที่ว่าง
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      <TopBar viewMode={viewMode} setViewMode={setViewMode} />
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <StaffBoard
          inputText={inputText}
          analysisInfo={analysisInfo}
          placedNotes={placedNotes}
          onBackgroundClick={handleBackgroundClick}
        />
        <ControlPanel
          inputText={inputText}
          setInputText={setInputText}
          mode={mode}
          setMode={setMode}
          handleGenerate={handleGenerate}
          handleQuickSelect={handleQuickSelect}
        />
      </div>
    </div>
  );
}