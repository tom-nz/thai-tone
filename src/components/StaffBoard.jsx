import React from "react";

const TONES = [
  { id: "จัตวา", name: "เสียงจัตวา", mark: " ๋ ", label: "เสียงสูง", color: "#dc2626" },
  { id: "ตรี",   name: "เสียงตรี",   mark: " ๊ ", label: "",         color: "#64748b" },
  { id: "โท",    name: "เสียงโท",    mark: " ้ ", label: "เสียงกลาง", color: "#16a34a" },
  { id: "เอก",   name: "เสียงเอก",   mark: " ่ ", label: "",         color: "#64748b" },
  { id: "สามัญ", name: "เสียงสามัญ", mark: " - ", label: "เสียงต่ำ",  color: "#2563eb" }
];

export default function StaffBoard({ inputText, analysisInfo, placedNotes }) {
  return (
    <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#ea580c", margin: "0 0 4px 0", fontSize: "22px" }}>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
        <span style={{ color: "#ea580c", fontSize: "14px" }}>และการผันวรรณยุกต์</span>
      </div>

      {inputText && analysisInfo && (
        <div style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "10px 14px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", border: "1px solid #bae6fd" }}>
          📌 {analysisInfo}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginTop: "20px" }}>
        {TONES.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ width: "130px", fontSize: "14px", color: "#334155", fontWeight: "500" }}>
              {t.name} <span style={{ color: "#94a3b8" }}>[{t.mark}]</span>
            </div>
            <div style={{ flex: 1, height: "2px", backgroundColor: "#cbd5e1", position: "relative" }}>
              {placedNotes && placedNotes[t.id] && (
                <div style={{ position: "absolute", top: "-18px", left: "30px", display: "flex", gap: "10px", alignItems: "center" }}>
                  {placedNotes[t.id].map((note, idx) => {
                    const bgColor = note.type === "high" ? "#ef4444" : note.type === "mid" ? "#22c55e" : "#0284c7";
                    return (
                      <div key={idx} style={{ position: "relative", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: bgColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
                        {note.text}
                        <svg style={{ position: "absolute", right: "-10px", top: "-10px", width: "18px", height: "32px", fill: bgColor, pointerEvents: "none" }} viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ width: "80px", textAlign: "right", fontSize: "14px", fontWeight: "bold", color: t.color }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}