import React, { useEffect, useRef } from "react";
import { CONSONANTS, LONG_VOWELS, SHORT_VOWELS } from "../utils/toneEngine";

export default function ControlPanel({ inputText, setInputText, mode, setMode, handleGenerate, handleQuickSelect }) {
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      // ยกเลิก DOM reference เมื่อ unmount
      inputRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: "380px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: "#334155", marginBottom: "14px" }}>
        ⚙️ แผงควบคุม
      </div>

      <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
          ✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate(inputText, mode)}
            placeholder="พิมพ์ 1 คำ เช่น กอ, เมา, กวาง"
            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#f1f5f9", outline: "none" }}
          />
          <button onClick={() => handleGenerate(inputText, mode)} style={{ backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
            ผันคำ
          </button>
        </div>

        {inputText && inputText.trim().length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", fontSize: "13px", color: "#334155" }}>
            {[
              { id: "full5", label: "ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)" },
              { id: "highOnly", label: "เฉพาะเสียงสูง (เอก, โท, จัตวา)" },
              { id: "lowOnly", label: "เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)" },
            ].map((opt) => (
              <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setMode(opt.id); handleGenerate(inputText, opt.id); }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", display: "inline-block", backgroundColor: mode === opt.id ? "#000000" : "#ffffff", border: "2px solid #000000", boxSizing: "border-box" }}></span>
                <input type="radio" name="mode" checked={mode === opt.id} onChange={() => {}} style={{ display: "none" }} />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: "4px", marginBottom: "14px" }}>
        {CONSONANTS.map((c) => (
          <button key={c} onClick={() => handleQuickSelect(c + "อ")} style={{ padding: "6px 0", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold", marginBottom: "8px" }}>🟢 สระเสียงยาว (คำเป็น):</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
        {LONG_VOWELS.map((v) => (
          <button key={v} onClick={() => handleQuickSelect(v)} style={{ padding: "4px 8px", border: "1px solid #bbf7d0", borderRadius: "6px", backgroundColor: "#f0fdf4", color: "#15803d", cursor: "pointer", fontSize: "12px" }}>
            {v}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "bold", marginBottom: "8px" }}>🔴 สระเสียงสั้น (คำตาย):</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {SHORT_VOWELS.map((v) => (
          <button key={v} onClick={() => handleQuickSelect(v)} style={{ padding: "4px 8px", border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: "12px" }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}