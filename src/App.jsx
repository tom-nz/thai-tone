import React, { useState, useEffect } from "react";

// --- ตารางจับคู่กลุ่มเสียงตามหลักไตรยางศ์ ---
const HIGH_TO_LOW_SOUND = {
  "ข": "ค", "ฃ": "ค",
  "ฉ": "ช",
  "ฐ": "ท", "ถ": "ท",
  "ผ": "พ",
  "ฝ": "ฟ",
  "ศ": "ซ", "ษ": "ซ", "ส": "ซ",
  "ห": "ฮ"
};

const LOW_TO_HIGH_SOUND = {
  "ค": "ข", "ฅ": "ข", "ฆ": "ข",
  "ช": "ฉ", "ฌ": "ฉ",
  "ซ": "ส",
  "ฑ": "ถ", "ฒ": "ถ", "ท": "ถ", "ธ": "ถ",
  "พ": "ผ", "ภ": "ผ",
  "ฟ": "ฝ",
  "ฮ": "ห"
};

const MID_CONSONANTS = ["ก", "จ", "ฎ", "ฏ", "ด", "ต", "บ", "ป", "อ"];
const HIGH_CONSONANTS = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
const LOW_PAIR_CONSONANTS = Object.keys(LOW_TO_HIGH_SOUND);

const CONSONANTS_44 = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"
];

const LONG_VOWELS = ["า", "ี", "ือ", "ู", "เ", "แ", "โ", "อ", "เอ", "เอีย", "เอือ", "อัว", "อำ", "ใ", "ไ", "เอา"];
const SHORT_VOWELS = ["ะ", "ิ", "ึ", "ุ", "เอะ", "แอะ", "โอะ", "เอาะ", "เออะ", "เอียะ", "เอือะ", "อัวะ"];

export default function App() {
  const [viewMode, setViewMode] = useState("split");
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("full5");
  const [toneData, setToneData] = useState(null);

  useEffect(() => {
    return () => {
      setToneData(null);
      setInputText("");
    };
  }, []);

  // ฟังก์ชันคำนวณการผันวรรณยุกต์และกำหนดลูกบอลโน้ต
  const processToneAnalysis = (text, runMode) => {
    if (!text || !text.trim()) {
      setToneData(null);
      return;
    }

    const word = text.trim();
    const firstChar = word[0];
    const rest = word.slice(1);
    const m = runMode || mode;

    let cType = "LOW_SINGLE";
    if (MID_CONSONANTS.includes(firstChar)) cType = "MID";
    else if (HIGH_CONSONANTS.includes(firstChar)) cType = "HIGH";
    else if (LOW_PAIR_CONSONANTS.includes(firstChar)) cType = "LOW_PAIR";

    let desc = `ผลวิเคราะห์หลักภาษา: \"${word}\" เป็น คำเป็น (สระเสียงยาว) — `;
    let notes = { จัตวา: [], ตรี: [], โท: [], เอก: [], สามัญ: [] };

    if (cType === "MID") {
      desc += "อักษรกลาง คำเป็น (ผันได้ครบ 5 เสียง)";
      if (m === "full5" || m === "highOnly" || m === "lowOnly") {
        notes["สามัญ"].push({ text: word, color: "#22c55e", left: 10 });
        notes["เอก"].push({ text: firstChar + "่" + rest, color: "#22c55e", left: 35 });
        notes["โท"].push({ text: firstChar + "้" + rest, color: "#22c55e", left: 60 });
        notes["ตรี"].push({ text: firstChar + "๊" + rest, color: "#22c55e", left: 85 });
        notes["จัตวา"].push({ text: firstChar + "๋" + rest, color: "#22c55e", left: 110 });
      }
    } else if (cType === "HIGH") {
      desc += "อักษรสูง คำเป็น (ผันได้เฉพาะ เอก, โท, จัตวา)";
      const lowPairChar = HIGH_TO_LOW_SOUND[firstChar] || "ซ";

      if (m === "full5") {
        notes["สามัญ"].push({ text: lowPairChar + rest, color: "#0284c7", left: 10 });
        notes["เอก"].push({ text: firstChar + "่" + rest, color: "#ef4444", left: 35 });
        notes["โท"].push({ text: lowPairChar + "่" + rest, color: "#0284c7", left: 55 });
        notes["โท"].push({ text: firstChar + "้" + rest, color: "#ef4444", left: 80 });
        notes["ตรี"].push({ text: lowPairChar + "้" + rest, color: "#0284c7", left: 100 });
        notes["จัตวา"].push({ text: word, color: "#ef4444", left: 125 });
      } else if (m === "highOnly") {
        notes["เอก"].push({ text: firstChar + "่" + rest, color: "#ef4444", left: 35 });
        notes["โท"].push({ text: firstChar + "้" + rest, color: "#ef4444", left: 60 });
        notes["จัตวา"].push({ text: word, color: "#ef4444", left: 110 });
      } else if (m === "lowOnly") {
        notes["สามัญ"].push({ text: lowPairChar + rest, color: "#0284c7", left: 10 });
        notes["โท"].push({ text: lowPairChar + "่" + rest, color: "#0284c7", left: 60 });
        notes["ตรี"].push({ text: lowPairChar + "้" + rest, color: "#0284c7", left: 85 });
      }
    } else if (cType === "LOW_PAIR") {
      desc += "อักษรต่ำคู่ คำเป็น (ผันได้เฉพาะ สามัญ, โท, ตรี)";
      const highPairChar = LOW_TO_HIGH_SOUND[firstChar] || "ส";

      if (m === "full5") {
        notes["สามัญ"].push({ text: word, color: "#0284c7", left: 10 });
        notes["เอก"].push({ text: highPairChar + "่" + rest, color: "#ef4444", left: 35 });
        notes["โท"].push({ text: word + "่" + rest, color: "#0284c7", left: 55 });
        notes["โท"].push({ text: highPairChar + "้" + rest, color: "#ef4444", left: 80 });
        notes["ตรี"].push({ text: word + "้" + rest, color: "#0284c7", left: 100 });
        notes["จัตวา"].push({ text: highPairChar + rest, color: "#ef4444", left: 125 });
      } else if (m === "lowOnly") {
        notes["สามัญ"].push({ text: word, color: "#0284c7", left: 10 });
        notes["โท"].push({ text: word + "่" + rest, color: "#0284c7", left: 60 });
        notes["ตรี"].push({ text: word + "้" + rest, color: "#0284c7", left: 85 });
      } else if (m === "highOnly") {
        notes["เอก"].push({ text: highPairChar + "่" + rest, color: "#ef4444", left: 35 });
        notes["โท"].push({ text: highPairChar + "้" + rest, color: "#ef4444", left: 60 });
        notes["จัตวา"].push({ text: highPairChar + rest, color: "#ef4444", left: 110 });
      }
    }

    setToneData({ desc, notes });
  };

  const handleQuickKey = (char) => {
    const val = char.length === 1 ? char + "อ" : char;
    setInputText(val);
    processToneAnalysis(val, mode);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e2e8f0", padding: "16px", fontFamily: "sans-serif" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "4px", backgroundColor: "#ffffff", padding: "4px", borderRadius: "8px", fontSize: "13px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <span style={{ padding: "6px 10px", color: "#64748b" }}>🖥️ มุมมอง:</span>
          <button onClick={() => setViewMode("single")} style={{ padding: "6px 12px", border: "none", borderRadius: "6px", cursor: "pointer", backgroundColor: viewMode === "single" ? "#f1f5f9" : "transparent" }}>ชิดเดี่ยว</button>
          <button onClick={() => setViewMode("split")} style={{ padding: "6px 12px", border: "none", borderRadius: "6px", cursor: "pointer", backgroundColor: viewMode === "split" ? "#0284c7" : "transparent", color: viewMode === "split" ? "#fff" : "#000", fontWeight: "bold" }}>แบ่ง 2 จอ</button>
          <button style={{ padding: "6px 12px", border: "none", borderRadius: "6px", cursor: "pointer", backgroundColor: "transparent" }}>โหมดพรีวิว</button>
        </div>
        <button style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>🔲 สลับเต็มจอ จอที่ 2</button>
        <button style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2</button>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {/* Left Side: Staff Board */}
        <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ color: "#ea580c", margin: "0 0 4px 0", fontSize: "24px" }}>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
            <span style={{ color: "#ea580c", fontSize: "14px" }}>และการผันวรรณยุกต์</span>
          </div>

          {inputText && toneData && (
            <div style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "10px 14px", borderRadius: "8px", marginBottom: "24px", fontSize: "13px", border: "1px solid #bae6fd" }}>
              📌 {toneData.desc}
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "13px", color: "#0284c7", fontWeight: "bold", marginBottom: "16px" }}>รูปวรรณยุกต์</div>

          {/* 5-Staff Lines (บันไดเสียงแนวเฉียง) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "36px", margin: "10px 0" }}>
            {[
              { id: "จัตวา", name: "เสียงจัตวา", mark: " ๋ ", label: "เสียงสูง", color: "#dc2626" },
              { id: "ตรี",   name: "เสียงตรี",   mark: " ๊ ", label: "",         color: "#64748b" },
              { id: "โท",    name: "เสียงโท",    mark: " ้ ", label: "เสียงกลาง", color: "#16a34a" },
              { id: "เอก",   name: "เสียงเอก",   mark: " ่ ", label: "",         color: "#64748b" },
              { id: "สามัญ", name: "เสียงสามัญ", mark: " - ", label: "เสียงต่ำ",  color: "#2563eb" }
            ].map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <div style={{ width: "130px", fontSize: "14px", color: t.color === "#dc2626" ? "#dc2626" : t.color === "#2563eb" ? "#2563eb" : "#16a34a", fontWeight: "bold" }}>
                  {t.name} <span style={{ color: "#94a3b8" }}>[{t.mark}]</span>
                </div>
                <div style={{ flex: 1, height: "2px", backgroundColor: "#cbd5e1", position: "relative" }}>
                  {toneData && toneData.notes[t.id] && toneData.notes[t.id].map((note, nIdx) => (
                    <div
                      key={nIdx}
                      style={{
                        position: "absolute",
                        top: "-18px",
                        left: `${note.left}px`,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: note.color,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "13px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        zIndex: 10
                      }}
                    >
                      {note.text}
                      <svg style={{ position: "absolute", right: "-8px", top: "-10px", width: "16px", height: "30px", fill: note.color, pointerEvents: "none" }} viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  ))}
                </div>
                <div style={{ width: "80px", textAlign: "right", fontSize: "14px", fontWeight: "bold", color: t.color }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Control Panel */}
        <div style={{ width: "380px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", color: "#334155", marginBottom: "14px" }}>
            ⚙️ แผงควบคุม
          </div>

          <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
              ✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                autoFocus
                value={inputText}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[0-9\s]/g, "").slice(0, 5);
                  setInputText(cleaned);
                }}
                onKeyDown={(e) => e.key === "Enter" && processToneAnalysis(inputText, mode)}
                placeholder="พิมพ์ 1 คำ เช่น กอ, เมา, กวาง"
                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#f1f5f9", outline: "none" }}
              />
              <button
                onClick={() => processToneAnalysis(inputText, mode)}
                style={{ backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
              >
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
                  <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setMode(opt.id); processToneAnalysis(inputText, opt.id); }}>
                    <span style={{ width: "16px", height: "16px", borderRadius: "50%", display: "inline-block", backgroundColor: mode === opt.id ? "#000000" : "#ffffff", border: "2px solid #000000", boxSizing: "border-box" }}></span>
                    <input type="radio" name="mode" checked={mode === opt.id} onChange={() => {}} style={{ display: "none" }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quick Consonants */}
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: "4px", marginBottom: "14px" }}>
            {CONSONANTS_44.map((c) => (
              <button key={c} onClick={() => handleQuickKey(c)} style={{ padding: "6px 0", border: "1px solid #e2e8f0", borderRadius: "6px", backgroundColor: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                {c}
              </button>
            ))}
          </div>

          {/* Long Vowels */}
          <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold", marginBottom: "8px" }}>🟢 สระเสียงยาว (คำเป็น):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
            {LONG_VOWELS.map((v) => (
              <button key={v} onClick={() => handleQuickKey(v)} style={{ padding: "4px 8px", border: "1px solid #bbf7d0", borderRadius: "6px", backgroundColor: "#f0fdf4", color: "#15803d", cursor: "pointer", fontSize: "12px" }}>
                {v}
              </button>
            ))}
          </div>

          {/* Short Vowels */}
          <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "bold", marginBottom: "8px" }}>🔴 สระเสียงสั้น (คำตาย):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {SHORT_VOWELS.map((v) => (
              <button key={v} onClick={() => handleQuickKey(v)} style={{ padding: "4px 8px", border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: "12px" }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}