import React from "react";

/**
 * TopBar Component
 * แถบเครื่องมือจัดการมุมมอง สลับเต็มจอ และเปิดจอแยก
 */
export default function TopBar({ viewMode, setViewMode }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px", fontSize: "13px" }}>
        <span style={{ padding: "6px 10px", color: "#64748b" }}>🖥️ มุมมอง:</span>
        <button
          onClick={() => setViewMode("single")}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: viewMode === "single" ? "#ffffff" : "transparent",
            fontWeight: viewMode === "single" ? "bold" : "normal"
          }}
        >
          ชิดเดี่ยว
        </button>
        <button
          onClick={() => setViewMode("split")}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: viewMode === "split" ? "#0284c7" : "transparent",
            color: viewMode === "split" ? "#ffffff" : "#000000",
            fontWeight: viewMode === "split" ? "bold" : "normal"
          }}
        >
          แบ่ง 2 จอ
        </button>
      </div>
      <button style={{ backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
        🔲 สลับเต็มจอ จอที่ 2
      </button>
      <button style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
        🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
      </button>
    </div>
  );
}