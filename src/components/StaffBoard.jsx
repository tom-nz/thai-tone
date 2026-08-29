import React from "react";
import { TONE_LEVELS } from "../utils/toneEngine";

/**
 * StaffBoard Component
 * แสดงเส้นบรรทัด 5 เส้น และลูกบอลตัวโน้ตขนาดปกติคงที่
 */
export default function StaffBoard({ inputText, analysisInfo, placedNotes, onBackgroundClick }) {
  return (
    <div
      onClick={onBackgroundClick}
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        cursor: "default"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#ea580c", margin: "0 0 4px 0", fontSize: "22px" }}>
          ไตรยางศ์ หรือ อักษร 3 หมู่
        </h2>
        <span style={{ color: "#ea580c", fontSize: "14px" }}>และการผันวรรณยุกต์</span>
      </div>

      {/* กล่องผลวิเคราะห์หลักภาษา */}
      {inputText && analysisInfo && (
        <div style={{
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          padding: "10px 14px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "13px",
          border: "1px solid #bae6fd"
        }}>
          📌 {analysisInfo.desc}
        </div>
      )}

      {/* เส้นบรรทัด 5 เส้น */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginTop: "20px" }}>
        {TONE_LEVELS.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ width: "130px", fontSize: "14px", color: "#334155", fontWeight: "500" }}>
              {t.name} <span style={{ color: "#94a3b8" }}>[{t.mark}]</span>
            </div>
            <div style={{ flex: 1, height: "2px", backgroundColor: "#cbd5e1", position: "relative" }}>
              {/* ลูกบอลตัวโน้ต: ขนาดคงที่ 34px ฟอนต์ 14px ไม่ขยายใหญ่ */}
              {placedNotes && placedNotes[t.id] && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "-16px",
                    left: "40px",
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "14px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    transition: "none",
                    transform: "none",
                    userSelect: "none"
                  }}
                >
                  {placedNotes[t.id]}
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