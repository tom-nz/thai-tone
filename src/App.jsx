import React, { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import StaffBoard from "./components/StaffBoard";
import ControlPanel from "./components/ControlPanel";
import { calculateTones } from "./utils/toneEngine";

export default function App() {
  const [viewMode, setViewMode] = useState("split");
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("full5");
  const [placedNotes, setPlacedNotes] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);

  // คืนหน่วยความจำและเคลียร์ Resource เมื่อปิดหรือรีเซ็ต Component
  useEffect(() => {
    return () => {
      setPlacedNotes(null);
      setAnalysisInfo(null);
      setInputText("");
    };
  }, []);

  const handleGenerate = (text, currentMode) => {
    const word = text !== undefined ? text : inputText;
    const m = currentMode !== undefined ? currentMode : mode;
    if (!word || !word.trim()) {
      setPlacedNotes(null);
      setAnalysisInfo(null);
      return;
    }
    const result = calculateTones(word, m);
    setPlacedNotes(result.notes);
    setAnalysisInfo(result.info);
  };

  const handleQuickSelect = (word) => {
    setInputText(word);
    setMode("full5");
    handleGenerate(word, "full5");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      <TopBar viewMode={viewMode} setViewMode={setViewMode} />
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <StaffBoard inputText={inputText} analysisInfo={analysisInfo} placedNotes={placedNotes} />
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