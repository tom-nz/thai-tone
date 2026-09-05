import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_COLORS = {
  mid: "#22c55e",
  high: "#ef4444",
  low: "#007bff",
  text: "#ffffff",
  screenBg: "#e2e8f0",
  staffBg: "#ffffff",
};

const TONE_ROWS = [
  {
    id: "rising",
    tone: "เสียงจัตวา",
    markLabel: "◌๋",
    rightLabel: "เสียงสูง",
    rightColor: "#ef4444",
    leftPos: "80%",
  },
  {
    id: "high",
    tone: "เสียงตรี",
    markLabel: "◌๊",
    rightLabel: "",
    rightColor: "#94a3b8",
    leftPos: "65%",
  },
  {
    id: "falling",
    tone: "เสียงโท",
    markLabel: "◌้",
    rightLabel: "เสียงกลาง",
    rightColor: "#22c55e",
    leftPos: "52%",
  },
  {
    id: "low",
    tone: "เสียงเอก",
    markLabel: "◌่",
    rightLabel: "",
    rightColor: "#94a3b8",
    leftPos: "40%",
  },
  {
    id: "mid",
    tone: "เสียงสามัญ",
    markLabel: "-",
    rightLabel: "เสียงต่ำ",
    rightColor: "#007bff",
    leftPos: "28%",
  },
];

const MID_CONSONANTS = new Set(["ก", "จ", "ฎ", "ฏ", "ด", "ต", "บ", "ป", "อ"]);
const HIGH_CONSONANTS = new Set([
  "ข",
  "ฃ",
  "ฉ",
  "ฐ",
  "ถ",
  "ผ",
  "ฝ",
  "ศ",
  "ษ",
  "ส",
  "ห",
]);

const LOW_SINGLE_CONSONANTS = new Set([
  "ง",
  "ญ",
  "น",
  "ย",
  "ณ",
  "ร",
  "ว",
  "ม",
  "ฬ",
  "ล",
]);

const ALL_CONSONANTS = new Set([
  "ก",
  "ข",
  "ฃ",
  "ค",
  "ฅ",
  "ฆ",
  "ง",
  "จ",
  "ฉ",
  "ช",
  "ซ",
  "ฌ",
  "ญ",
  "ฎ",
  "ฏ",
  "ฐ",
  "ฑ",
  "ฒ",
  "ณ",
  "ด",
  "ต",
  "ถ",
  "ท",
  "ธ",
  "น",
  "บ",
  "ป",
  "ผ",
  "ฝ",
  "พ",
  "ฟ",
  "ภ",
  "ม",
  "ย",
  "ร",
  "ล",
  "ว",
  "ศ",
  "ษ",
  "ส",
  "ห",
  "ฬ",
  "อ",
  "ฮ",
]);

const QUICK_CONSONANTS = [
  "ก",
  "ข",
  "ฃ",
  "ค",
  "ฅ",
  "ฆ",
  "ง",
  "จ",
  "ฉ",
  "ช",
  "ซ",
  "ฌ",
  "ญ",
  "ฎ",
  "ฏ",
  "ฐ",
  "ฑ",
  "ฒ",
  "ณ",
  "ด",
  "ต",
  "ถ",
  "ท",
  "ธ",
  "น",
  "บ",
  "ป",
  "ผ",
  "ฝ",
  "พ",
  "ฟ",
  "ภ",
  "ม",
  "ย",
  "ร",
  "ล",
  "ว",
  "ศ",
  "ษ",
  "ส",
  "ห",
  "ฬ",
  "อ",
  "ฮ",
];

const TRUE_CLUSTERS = new Set([
  "กร",
  "กล",
  "กว",
  "ขร",
  "ขล",
  "ขว",
  "คร",
  "คล",
  "คว",
  "ตร",
  "ปล",
  "ปร",
  "พร",
  "พล",
  "ฟร",
]);

const HO_NAM = new Set(["หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว"]);

const HIGH_TO_LOW = {
  ข: "ค",
  ฃ: "ฅ",
  ฉ: "ช",
  ศ: "ซ",
  ษ: "ซ",
  ส: "ซ",
  ถ: "ท",
  ฐ: "ฑ",
  ผ: "พ",
  ฝ: "ฟ",
  ห: "ฮ",
};

const LOW_TO_HIGH = {
  ค: "ข",
  ฅ: "ฃ",
  ฆ: "ข",
  ช: "ฉ",
  ซ: "ศ",
  ฌ: "ฉ",
  ท: "ถ",
  ธ: "ถ",
  ฑ: "ฐ",
  ฒ: "ฐ",
  พ: "ผ",
  ภ: "ผ",
  ฟ: "ฝ",
  ฮ: "ห",
};

const LONG_VOWELS = [
  { label: "◌า", front: "", rear: "า" },
  { label: "◌ี", front: "", rear: "ี" },
  { label: "◌ือ", front: "", rear: "ือ" },
  { label: "◌ู", front: "", rear: "ู" },
  { label: "เ◌", front: "เ", rear: "" },
  { label: "แ◌", front: "แ", rear: "" },
  { label: "โ◌", front: "โ", rear: "" },
  { label: "◌อ", front: "", rear: "อ" },
  { label: "เ◌อ", front: "เ", rear: "อ" },
  { label: "เ◌ีย", front: "เ", rear: "ีย" },
  { label: "เ◌ือ", front: "เ", rear: "ือ" },
  { label: "◌ัว", front: "", rear: "ัว" },
  { label: "◌ำ", front: "", rear: "ำ" },
  { label: "ใ◌", front: "ใ", rear: "" },
  { label: "ไ◌", front: "ไ", rear: "" },
  { label: "เ◌า", front: "เ", rear: "า" },
];

const SHORT_VOWELS = [
  { label: "◌ะ", front: "", rear: "ะ" },
  { label: "◌ิ", front: "", rear: "ิ" },
  { label: "◌ึ", front: "", rear: "ึ" },
  { label: "◌ุ", front: "", rear: "ุ" },
  { label: "เ◌ะ", front: "เ", rear: "ะ" },
  { label: "แ◌ะ", front: "แ", rear: "ะ" },
  { label: "โ◌ะ", front: "โ", rear: "ะ" },
  { label: "เ◌าะ", front: "เ", rear: "าะ" },
  { label: "เ◌อะ", front: "เ", rear: "อะ" },
  { label: "เ◌ียะ", front: "เ", rear: "ียะ" },
  { label: "เ◌ือะ", front: "เ", rear: "ือะ" },
  { label: "◌ัวะ", front: "", rear: "ัวะ" },
];

const TONE_MARKS = ["่", "้", "๊", "๋"];
const ABOVE_BELOW_VOWELS = new Set(["ิ", "ี", "ึ", "ื", "ุ", "ู", "ั", "็", "ํ"]);

function getEmptyRows() {
  return TONE_ROWS.map((row) => ({
    ...row,
    forms: [],
  }));
}

function getColorByClass(consonantClass, colors) {
  if (consonantClass === "mid") return colors.mid;
  if (consonantClass === "high") return colors.high;
  return colors.low;
}

function getConsonantClass(initial) {
  const first = initial?.[0] || "";

  if (initial?.length === 2 && HO_NAM.has(initial)) return "high";
  if (MID_CONSONANTS.has(first)) return "mid";
  if (HIGH_CONSONANTS.has(first)) return "high";
  return "low";
}

function normalizeWord(value) {
  return value
    .trim()
    .normalize("NFC")
    .replace(/[่้๊๋]/g, "");
}

function parseThaiWord(word) {
  const clean = normalizeWord(word);

  if (!clean) {
    return {
      clean: "",
      frontVowel: "",
      initial: "",
      aboveBelow: "",
      rest: "",
      originalTone: "",
    };
  }

  let work = clean;
  let frontVowel = "";

  if (["เ", "แ", "โ", "ใ", "ไ"].includes(work[0])) {
    frontVowel = work[0];
    work = work.slice(1);
  }

  let initial = "";

  if (work.length >= 2 && (TRUE_CLUSTERS.has(work.slice(0, 2)) || HO_NAM.has(work.slice(0, 2)))) {
    initial = work.slice(0, 2);
    work = work.slice(2);
  } else {
    initial = work[0] || "";
    work = work.slice(1);
  }

  let aboveBelow = "";
  let rest = "";

  for (const char of work) {
    if (ABOVE_BELOW_VOWELS.has(char)) {
      aboveBelow += char;
    } else if (!TONE_MARKS.includes(char)) {
      rest += char;
    }
  }

  return {
    clean,
    frontVowel,
    initial,
    aboveBelow,
    rest,
  };
}

function buildWord(parsed, initial, mark = "") {
  return `${parsed.frontVowel}${initial}${parsed.aboveBelow}${mark}${parsed.rest}`;
}

function getFinalConsonant(parsed) {
  const chars = [...parsed.rest];

  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const char = chars[index];

    // อ ที่อยู่ท้ายคำในรูป กอ / ขอ ถือเป็นส่วนของสระ ไม่ใช่ตัวสะกด
    if (char === "อ") continue;

    if (ALL_CONSONANTS.has(char)) return char;
  }

  return "";
}

function analyzeSyllable(word, mode) {
  const parsed = parseThaiWord(word);

  if (!parsed.clean || !parsed.initial) {
    return null;
  }

  const consonantClass = getConsonantClass(parsed.initial);
  const finalConsonant = getFinalConsonant(parsed);

  const vowelText = `${parsed.frontVowel}${parsed.aboveBelow}${parsed.rest}`;
  const shortPatterns = ["ะ", "ิ", "ึ", "ุ", "ั", "เาะ", "เอะ", "เอียะ", "เอือะ", "อัวะ"];
  const specialLiveVowels = ["ำ", "ใ", "ไ"];

  const isShort = shortPatterns.some((item) => vowelText.includes(item));
  const hasSpecialLiveVowel =
    specialLiveVowels.some((item) => vowelText.includes(item)) ||
    (parsed.frontVowel === "เ" && parsed.rest === "า");

  const liveFinals = new Set(["ง", "ญ", "ณ", "น", "ม", "ย", "ร", "ล", "ฬ", "ว"]);
  const deadFinals = new Set([
    "ก",
    "ข",
    "ค",
    "ฅ",
    "ฆ",
    "จ",
    "ฉ",
    "ช",
    "ซ",
    "ฌ",
    "ฎ",
    "ฏ",
    "ฐ",
    "ฑ",
    "ฒ",
    "ด",
    "ต",
    "ถ",
    "ท",
    "ธ",
    "บ",
    "ป",
    "พ",
    "ฟ",
    "ภ",
    "ศ",
    "ษ",
    "ส",
  ]);

  let kind = "live";

  if (hasSpecialLiveVowel) {
    kind = "live";
  } else if (!finalConsonant) {
    kind = isShort ? "deadShort" : "live";
  } else if (liveFinals.has(finalConsonant)) {
    kind = "live";
  } else if (deadFinals.has(finalConsonant)) {
    kind = isShort ? "deadShort" : "deadLong";
  }

  const isDead = kind !== "live";
  const type = isDead ? "คำตาย" : "คำเป็น";
  const vowelLen = isShort ? "สระเสียงสั้น" : "สระเสียงยาว";

  const clusterText = TRUE_CLUSTERS.has(parsed.initial)
    ? `คำควบกล้ำ "${parsed.initial}"`
    : HO_NAM.has(parsed.initial)
      ? `อักษรนำ "${parsed.initial}"`
      : "";

  let desc = "";

  if (mode === "highOnly") {
    desc = `${clusterText ? `${clusterText} — ` : ""}แสดงรูปผันตามแนวอักษรสูง`;
  } else if (mode === "lowOnly") {
    desc = `${clusterText ? `${clusterText} — ` : ""}แสดงรูปผันตามแนวอักษรต่ำ`;
  } else if (consonantClass === "mid") {
    desc = isDead
      ? "อักษรกลาง คำตาย (แสดงได้เฉพาะเสียงเอกและเสียงโท)"
      : "อักษรกลาง คำเป็น (ผันได้ครบ 5 เสียง)";
  } else if (consonantClass === "high") {
    desc = isDead
      ? "อักษรสูง คำตาย (แสดงได้เฉพาะเสียงเอกและเสียงโท)"
      : "อักษรสูง คำเป็น (ใช้รูปอักษรสูงร่วมกับรูปเทียบอักษรต่ำ)";
  } else {
    desc = isDead
      ? "อักษรต่ำ คำตาย (รูปผันขึ้นกับสระสั้นหรือสระยาว)"
      : "อักษรต่ำ คำเป็น (ใช้รูปอักษรต่ำร่วมกับรูปเทียบอักษรสูง/ห นำ)";
  }

  return {
    parsed,
    consonantClass,
    finalConsonant,
    kind,
    isDead,
    isShort,
    type,
    vowelLen,
    desc,
  };
}

function getRules(consonantClass, kind) {
  const table = {
    mid: {
      live: [
        ["mid", ""],
        ["low", "่"],
        ["falling", "้"],
        ["high", "๊"],
        ["rising", "๋"],
      ],
      deadShort: [
        ["low", ""],
        ["falling", "้"],
      ],
      deadLong: [
        ["low", ""],
        ["falling", "้"],
      ],
    },
    high: {
      live: [
        ["rising", ""],
        ["low", "่"],
        ["falling", "้"],
      ],
      deadShort: [
        ["low", ""],
        ["falling", "้"],
      ],
      deadLong: [
        ["low", ""],
        ["falling", "้"],
      ],
    },
    low: {
      live: [
        ["mid", ""],
        ["falling", "่"],
        ["high", "้"],
      ],
      deadShort: [
        ["high", ""],
        ["falling", "่"],
      ],
      deadLong: [
        ["falling", ""],
        ["high", "้"],
      ],
    },
  };

  return table[consonantClass][kind];
}

function getHighEquivalent(initial) {
  const first = initial[0] || "";

  if (getConsonantClass(initial) === "high") return initial;
  if (LOW_SINGLE_CONSONANTS.has(first)) return `ห${initial}`;
  if (LOW_TO_HIGH[first]) return `${LOW_TO_HIGH[first]}${initial.slice(1)}`;

  return initial;
}

function getLowEquivalent(initial) {
  const first = initial[0] || "";

  if (getConsonantClass(initial) === "low") return initial;
  if (HIGH_TO_LOW[first]) return `${HIGH_TO_LOW[first]}${initial.slice(1)}`;

  return initial;
}

function calculateToneRows(word, mode, colors) {
  const analysis = analyzeSyllable(word, mode);

  if (!analysis) return getEmptyRows();

  const formsByTone = {
    rising: [],
    high: [],
    falling: [],
    low: [],
    mid: [],
  };

  const addForms = (consonantClass, initial, source) => {
    const rules = getRules(consonantClass, analysis.kind);

    rules.forEach(([toneId, mark]) => {
      formsByTone[toneId].push({
        text: buildWord(analysis.parsed, initial, mark),
        color: getColorByClass(consonantClass, colors),
        source,
      });
    });
  };

  if (mode === "highOnly") {
    const highInitial =
      analysis.consonantClass === "mid"
        ? analysis.parsed.initial
        : getHighEquivalent(analysis.parsed.initial);

    const classForRule =
      analysis.consonantClass === "mid" ? "high" : "high";

    addForms(classForRule, highInitial, "high");
  } else if (mode === "lowOnly") {
    const lowInitial =
      analysis.consonantClass === "mid"
        ? analysis.parsed.initial
        : getLowEquivalent(analysis.parsed.initial);

    const classForRule =
      analysis.consonantClass === "mid" ? "low" : "low";

    addForms(classForRule, lowInitial, "low");
  } else if (analysis.consonantClass === "mid") {
    addForms("mid", analysis.parsed.initial, "mid");
  } else {
    addForms("high", getHighEquivalent(analysis.parsed.initial), "high");
    addForms("low", getLowEquivalent(analysis.parsed.initial), "low");
  }

  return TONE_ROWS.map((row) => ({
    ...row,
    forms: formsByTone[row.id],
  }));
}

function getProviderName(voice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();

  if (name.includes("google")) return "Google";
  if (name.includes("microsoft")) return "Microsoft";
  if (name.includes("samsung")) return "Samsung";
  if (name.includes("apple")) return "Apple";

  return "เบราว์เซอร์/ระบบ";
}

function guessGender(voice) {
  const name = voice.name.toLowerCase();

  const femaleWords = [
    "female",
    "woman",
    "girl",
    "zira",
    "hazel",
    "siri female",
    "naree",
    "aom",
    "female",
  ];

  const maleWords = [
    "male",
    "man",
    "boy",
    "david",
    "mark",
    "siri male",
    "male",
  ];

  if (femaleWords.some((word) => name.includes(word))) return "หญิง";
  if (maleWords.some((word) => name.includes(word))) return "ชาย";

  return "ไม่ระบุ";
}

function speakText(text, voice, rate = 0.8) {
  if (!text || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || "th-TH";
  utterance.rate = Number(rate);
  utterance.pitch = 1;

  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

function ToneNote({ form, fontSize, textColor, onSpeak }) {
  return (
    <button
      type="button"
      title={`กดเพื่อฟังคำว่า ${form.text}`}
      onClick={(event) => {
        event.stopPropagation();
        onSpeak(form.text);
      }}
      style={{
        position: "relative",
        border: "none",
        backgroundColor: form.color,
        color: textColor,
        minWidth: `${fontSize * 2.6}px`,
        height: `${fontSize * 2.6}px`,
        padding: "0 12px",
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        fontWeight: "bold",
        fontSize: `${fontSize}px`,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.24)",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        style={{
          position: "absolute",
          top: `-${fontSize * 1.05}px`,
          left: `calc(100% - 3px)`,
          width: `${fontSize * 1.1}px`,
          height: `${fontSize * 2.4}px`,
          pointerEvents: "none",
          overflow: "visible",
          color: form.color,
        }}
        viewBox="0 0 20 44"
      >
        <path
          d="M 2 44 L 2 2"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 2 2 C 9 8, 17 15, 13 24 C 9 17, 5 11, 2 7 Z"
          fill="currentColor"
        />
      </svg>

      {form.text}
      <span style={{ fontSize: "0.68em", opacity: 0.9 }}>🔊</span>
    </button>
  );
}

function ToneBoard({
  rows,
  inputText,
  analysisInfo,
  staffBgColor,
  circleTextColor,
  labelFontSize,
  onSpeak,
  compact = false,
}) {
  const boardFontSize = compact ? Math.max(16, labelFontSize - 2) : labelFontSize;

  return (
    <section
      style={{
        backgroundColor: staffBgColor,
        borderRadius: compact ? "16px" : "18px",
        padding: compact ? "28px 20px" : "34px 28px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid rgba(203,213,225,0.8)",
        minWidth: 0,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2
          style={{
            margin: 0,
            color: "#ea580c",
            fontSize: compact ? "27px" : "30px",
            lineHeight: 1.25,
          }}
        >
          ไตรยางศ์ หรือ อักษร 3 หมู่
        </h2>
        <div
          style={{
            color: "#ea580c",
            fontWeight: "700",
            fontSize: compact ? "17px" : "18px",
            marginTop: "3px",
          }}
        >
          และการผันวรรณยุกต์
        </div>
      </div>

      {inputText && analysisInfo && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            padding: "10px 14px",
            borderRadius: "12px",
            marginBottom: "22px",
            textAlign: "center",
            color: "#0369a1",
            fontSize: "14px",
            fontWeight: "700",
            lineHeight: 1.55,
          }}
        >
          📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: "#0284c7" }}>"{inputText}"</span> เป็น{" "}
          <span
            style={{
              backgroundColor: "#e0f2fe",
              padding: "2px 7px",
              borderRadius: "5px",
            }}
          >
            {analysisInfo.type} ({analysisInfo.vowelLen})
          </span>{" "}
          — {analysisInfo.desc}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "170px 1fr 95px" : "220px 1fr 110px",
          color: "#0284c7",
          fontWeight: "bold",
          fontSize: "14px",
          marginBottom: "5px",
        }}
      >
        <div style={{ textAlign: "right", paddingRight: "18px" }}>รูปวรรณยุกต์</div>
        <div />
        <div />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: compact ? "28px" : "34px" }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: compact ? "170px 1fr 95px" : "220px 1fr 110px",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                textAlign: "right",
                paddingRight: "18px",
                fontWeight: "bold",
                fontSize: compact ? "16px" : "17px",
                color: row.forms[0]?.color || "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              {row.tone} <span style={{ fontSize: "0.92em" }}>[ {row.markLabel} ]</span>
            </div>

            <div
              style={{
                height: "34px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <div style={{ height: "2px", width: "100%", backgroundColor: "#94a3b8" }} />

              {row.forms.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: row.leftPos,
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    zIndex: 1,
                  }}
                >
                  {row.forms.map((form, index) => (
                    <React.Fragment key={`${form.text}-${index}`}>
                      {index > 0 && (
                        <span style={{ color: "#64748b", fontWeight: "bold", fontSize: "18px" }}>
                          /
                        </span>
                      )}
                      <ToneNote
                        form={form}
                        fontSize={boardFontSize}
                        textColor={circleTextColor}
                        onSpeak={onSpeak}
                      />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                color: row.rightColor,
                fontSize: compact ? "15px" : "16px",
                whiteSpace: "nowrap",
              }}
            >
              {row.rightLabel}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModeRadio({ checked, label, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        cursor: "pointer",
        color: "#334155",
        fontSize: "14px",
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{
          appearance: "none",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "2px solid #475569",
          backgroundColor: checked ? "#000000" : "#ffffff",
          margin: 0,
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      {label}
    </label>
  );
}

export default function App() {
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);
  const [viewLayout, setViewLayout] = useState("split");
  const [inputText, setInputText] = useState("");
  const [inputError, setInputError] = useState("");
  const [mode, setMode] = useState("full5");

  const [colorMid, setColorMid] = useState(DEFAULT_COLORS.mid);
  const [colorHigh, setColorHigh] = useState(DEFAULT_COLORS.high);
  const [colorLow, setColorLow] = useState(DEFAULT_COLORS.low);
  const [circleTextColor, setCircleTextColor] = useState(DEFAULT_COLORS.text);

  const [screenBgColor, setScreenBgColor] = useState(DEFAULT_COLORS.screenBg);
  const [screenBgImage, setScreenBgImage] = useState("");
  const [bgType, setBgType] = useState("color");
  const [staffBgColor, setStaffBgColor] = useState(DEFAULT_COLORS.staffBg);

  const [labelFontSize, setLabelFontSize] = useState(20);
  const [showApiInput, setShowApiInput] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => sessionStorage.getItem("gemini_api_key") || "",
  );
  const [tempApiKey, setTempApiKey] = useState(
    () => sessionStorage.getItem("gemini_api_key") || "",
  );
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [voices, setVoices] = useState([]);
  const [ttsProvider, setTtsProvider] = useState("ทั้งหมด");
  const [ttsGender, setTtsGender] = useState("ทั้งหมด");
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [speechRate, setSpeechRate] = useState(0.8);

  const colors = useMemo(
    () => ({
      mid: colorMid,
      high: colorHigh,
      low: colorLow,
    }),
    [colorMid, colorHigh, colorLow],
  );

  const analysisInfo = useMemo(() => analyzeSyllable(inputText, mode), [inputText, mode]);

  const rows = useMemo(
    () => calculateToneRows(inputText, mode, colors),
    [inputText, mode, colors],
  );

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === selectedVoiceURI) || null,
    [voices, selectedVoiceURI],
  );

  const availableVoices = useMemo(() => {
    return voices.filter((voice) => {
      const isThai = voice.lang.toLowerCase().startsWith("th");
      const providerMatched =
        ttsProvider === "ทั้งหมด" || getProviderName(voice) === ttsProvider;
      const genderMatched =
        ttsGender === "ทั้งหมด" || guessGender(voice) === ttsGender;

      return isThai && providerMatched && genderMatched;
    });
  }, [voices, ttsProvider, ttsGender]);

  const pageBackgroundStyle =
    bgType === "image" && screenBgImage
      ? {
          backgroundImage: `url(${screenBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : { backgroundColor: screenBgColor };

  const validateInput = (value) => {
    const word = value.trim();

    if (!word) {
      setInputError("");
      return true;
    }

    if (/\s/.test(word)) {
      setInputError("กรุณากรอกเพียง 1 คำ โดยห้ามเว้นวรรค");
      return false;
    }

    if (!/^[\u0E00-\u0E7F]+$/.test(word)) {
      setInputError("กรุณากรอกด้วยอักษรไทยเท่านั้น");
      return false;
    }

    if (word.length > 10) {
      setInputError("คำยาวเกินไป กรุณากรอกเพียง 1 พยางค์");
      return false;
    }

    const parsed = parseThaiWord(word);

    if (!parsed.initial || !ALL_CONSONANTS.has(parsed.initial[0])) {
      setInputError("กรุณาเริ่มต้นด้วยพยัญชนะไทย");
      return false;
    }

    setInputError("");
    return true;
  };

  const handleInputChange = (value) => {
    setInputText(value);

    if (!value.trim()) {
      setInputError("");
      setMode("full5");
      setAiMessage("");
      return;
    }

    validateInput(value);
  };

  const handleQuickConsonant = (consonant) => {
    const parsed = parseThaiWord(inputText);
    const newWord = buildWord(
      {
        ...parsed,
        frontVowel: parsed.frontVowel || "",
        aboveBelow: parsed.aboveBelow || "",
        rest: parsed.rest || "อ",
      },
      consonant,
      "",
    );

    handleInputChange(newWord);
  };

  const handleQuickVowel = (vowel) => {
    const parsed = parseThaiWord(inputText);
    const initial = parsed.initial || "ก";
    handleInputChange(`${vowel.front}${initial}${vowel.rear}`);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenBgImage(String(reader.result));
      setBgType("image");
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDualMonitor = () => {
    const baseUrl = window.location.href.split("?")[0];
    window.open(
      `${baseUrl}?view=display`,
      "ThaiToneDisplayWindow",
      "width=1280,height=850,resizable=yes,scrollbars=yes,status=yes",
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        window.alert("เบราว์เซอร์ต้องอนุญาตให้สลับเต็มจอจากการกดบนหน้าต่างนี้");
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleToggleDisplayFullscreen = () => {
    try {
      const channel = new BroadcastChannel("thai_tone_sync_channel");
      channel.postMessage({ type: "TOGGLE_FULLSCREEN" });
      channel.close();
    } catch {
      // Browser ไม่รองรับ BroadcastChannel
    }

    localStorage.setItem("thai_tone_toggle_fs_signal", String(Date.now()));
  };

  const saveApiKey = () => {
    const cleanKey = tempApiKey.trim();
    setGeminiApiKey(cleanKey);
    sessionStorage.setItem("gemini_api_key", cleanKey);
    setAiMessage(cleanKey ? "บันทึก API Key ชั่วคราวสำหรับแท็บนี้แล้ว" : "ลบ API Key แล้ว");
  };

  const askGoogleAI = async () => {
    const word = inputText.trim();

    if (!validateInput(word) || !word) return;

    if (!geminiApiKey) {
      setAiMessage("ยังไม่ได้ตั้งค่า Gemini API Key");
      return;
    }

    setAiLoading(true);
    setAiMessage("");

    try {
      const prompt = `
คุณเป็นผู้ช่วยครูภาษาไทย จงอธิบายคำว่า "${word}" แบบสั้น กระชับ
โดยอธิบายเฉพาะ: หมู่อักษร, คำเป็น/คำตาย, สระสั้น/ยาว และข้อสังเกต
ห้ามสร้างตารางผันวรรณยุกต์ ห้ามตอบ Markdown ยาวเกิน 3 ประโยค
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "ไม่สามารถเชื่อมต่อ Google AI ได้");
      }

      const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      setAiMessage(message || "Google AI ไม่ได้ส่งคำตอบกลับมา");
    } catch (error) {
      setAiMessage(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("view") === "display") {
      setIsDisplayWindow(true);
      document.body.style.margin = "0";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);

      if (!selectedVoiceURI) {
        const thaiVoice = allVoices.find((voice) => voice.lang.toLowerCase().startsWith("th"));

        if (thaiVoice) setSelectedVoiceURI(thaiVoice.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (availableVoices.length === 0) return;

    const selectedStillAvailable = availableVoices.some(
      (voice) => voice.voiceURI === selectedVoiceURI,
    );

    if (!selectedStillAvailable) {
      setSelectedVoiceURI(availableVoices[0].voiceURI);
    }
  }, [availableVoices, selectedVoiceURI]);

  useEffect(() => {
    if (isDisplayWindow) return undefined;

    const payload = {
      type: "SYNC_STATE",
      inputText,
      mode,
      colorMid,
      colorHigh,
      colorLow,
      circleTextColor,
      screenBgColor,
      screenBgImage,
      bgType,
      staffBgColor,
      labelFontSize,
      ttsProvider,
      ttsGender,
      selectedVoiceURI,
      speechRate,
    };

    localStorage.setItem("thai_tone_live_sync_data", JSON.stringify(payload));

    try {
      const channel = new BroadcastChannel("thai_tone_sync_channel");
      channel.postMessage(payload);

      const onMessage = (event) => {
        if (event.data?.type === "REQUEST_SYNC") {
          channel.postMessage(payload);
        }
      };

      channel.addEventListener("message", onMessage);

      return () => {
        channel.removeEventListener("message", onMessage);
        channel.close();
      };
    } catch {
      return undefined;
    }
  }, [
    isDisplayWindow,
    inputText,
    mode,
    colorMid,
    colorHigh,
    colorLow,
    circleTextColor,
    screenBgColor,
    screenBgImage,
    bgType,
    staffBgColor,
    labelFontSize,
    ttsProvider,
    ttsGender,
    selectedVoiceURI,
    speechRate,
  ]);

  useEffect(() => {
    if (!isDisplayWindow) return undefined;

    const applySync = (data) => {
      if (!data) return;

      if (data.inputText !== undefined) setInputText(data.inputText);
      if (data.mode) setMode(data.mode);
      if (data.colorMid) setColorMid(data.colorMid);
      if (data.colorHigh) setColorHigh(data.colorHigh);
      if (data.colorLow) setColorLow(data.colorLow);
      if (data.circleTextColor) setCircleTextColor(data.circleTextColor);
      if (data.screenBgColor) setScreenBgColor(data.screenBgColor);
      if (data.screenBgImage !== undefined) setScreenBgImage(data.screenBgImage);
      if (data.bgType) setBgType(data.bgType);
      if (data.staffBgColor) setStaffBgColor(data.staffBgColor);
      if (data.labelFontSize) setLabelFontSize(data.labelFontSize);
      if (data.ttsProvider) setTtsProvider(data.ttsProvider);
      if (data.ttsGender) setTtsGender(data.ttsGender);
      if (data.selectedVoiceURI) setSelectedVoiceURI(data.selectedVoiceURI);
      if (data.speechRate) setSpeechRate(data.speechRate);
    };

    const saved = localStorage.getItem("thai_tone_live_sync_data");

    if (saved) {
      try {
        applySync(JSON.parse(saved));
      } catch {
        // ไม่ทำอะไร หากข้อมูลเดิมผิดรูปแบบ
      }
    }

    const onStorage = (event) => {
      if (event.key === "thai_tone_live_sync_data" && event.newValue) {
        try {
          applySync(JSON.parse(event.newValue));
        } catch {
          // ไม่ทำอะไร
        }
      }

      if (event.key === "thai_tone_toggle_fs_signal") {
        toggleFullscreen();
      }
    };

    window.addEventListener("storage", onStorage);

    try {
      const channel = new BroadcastChannel("thai_tone_sync_channel");

      const onMessage = (event) => {
        if (event.data?.type === "SYNC_STATE") applySync(event.data);
        if (event.data?.type === "TOGGLE_FULLSCREEN") toggleFullscreen();
      };

      channel.addEventListener("message", onMessage);
      channel.postMessage({ type: "REQUEST_SYNC" });

      return () => {
        window.removeEventListener("storage", onStorage);
        channel.removeEventListener("message", onMessage);
        channel.close();
      };
    } catch {
      return () => window.removeEventListener("storage", onStorage);
    }
  }, [isDisplayWindow]);

  const speak = (text) => {
    speakText(text, selectedVoice, speechRate);
  };

  if (isDisplayWindow) {
    return (
      <main
        onDoubleClick={toggleFullscreen}
        title="ดับเบิลคลิกเพื่อสลับเต็มจอ"
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "22px",
          boxSizing: "border-box",
          fontFamily: "'Sarabun', system-ui, sans-serif",
          ...pageBackgroundStyle,
        }}
      >
        <div style={{ width: "min(1200px, 96vw)", maxHeight: "92vh" }}>
          <ToneBoard
            rows={rows}
            inputText={inputText}
            analysisInfo={analysisInfo}
            staffBgColor={staffBgColor}
            circleTextColor={circleTextColor}
            labelFontSize={labelFontSize}
            onSpeak={speak}
          />
        </div>
      </main>
    );
  }

  const isSplit = viewLayout === "split";
  const hasWord = Boolean(inputText.trim());

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        padding: "22px 16px",
        boxSizing: "border-box",
        fontFamily: "'Sarabun', system-ui, sans-serif",
        ...pageBackgroundStyle,
      }}
    >
      <div
        style={{
          height: "100%",
          maxWidth: viewLayout === "split" ? "1320px" : "950px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <header
          style={{
            backgroundColor: "rgba(255,255,255,0.96)",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <strong style={{ color: "#1e293b" }}>🖥️ มุมมอง:</strong>

            {[
              ["standard", "ชิดเดียว"],
              ["split", "แบ่ง 2 จอ"],
              ["present", "โหมดพรีวิว"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setViewLayout(value)}
                style={{
                  border: "none",
                  borderRadius: "9px",
                  padding: "8px 13px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: viewLayout === value ? "#ffffff" : "#475569",
                  backgroundColor: viewLayout === value ? "#0284c7" : "#f1f5f9",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleToggleDisplayFullscreen}
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "9px 14px",
                backgroundColor: "#0284c7",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ⛶ สลับเต็มจอ จอที่ 2
            </button>

            <button
              type="button"
              onClick={handleOpenDualMonitor}
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "9px 14px",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
            </button>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: isSplit ? "minmax(0, 1fr) 410px" : "minmax(0, 1fr)",
            gap: "18px",
          }}
        >
          <div
            style={{
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              alignItems: viewLayout === "present" ? "center" : "flex-start",
            }}
          >
            <ToneBoard
              rows={rows}
              inputText={inputText}
              analysisInfo={analysisInfo}
              staffBgColor={staffBgColor}
              circleTextColor={circleTextColor}
              labelFontSize={labelFontSize}
              onSpeak={speak}
              compact
            />
          </div>

          {viewLayout !== "present" && (
            <aside
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "18px",
                overflowY: "auto",
                minHeight: 0,
                boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "21px" }}>
                ⚙️ แผงควบคุม
              </h3>

              <section
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    color: "#1e293b",
                    marginBottom: "10px",
                  }}
                >
                  ✨ ผู้ช่วยผันวรรณยุกต์อัตโนมัติ
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    value={inputText}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") validateInput(inputText);
                    }}
                    placeholder="พิมพ์ 1 คำ เช่น กอ, มือ, กวาง"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: "9px",
                      padding: "9px 11px",
                      border: inputError ? "2px solid #ef4444" : "1px solid #cbd5e1",
                      backgroundColor: "#f1f5f9",
                      fontWeight: "bold",
                      fontSize: "15px",
                      color: "#0f172a",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => validateInput(inputText)}
                    style={{
                      border: "none",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      backgroundColor: "#0284c7",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ผันคำ
                  </button>
                </div>

                {inputError && (
                  <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "bold", marginTop: "6px" }}>
                    {inputError}
                  </div>
                )}

                {hasWord && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <ModeRadio
                      checked={mode === "full5"}
                      onChange={() => setMode("full5")}
                      label="ผันครบทั้ง 5 เสียง"
                    />
                    <ModeRadio
                      checked={mode === "highOnly"}
                      onChange={() => setMode("highOnly")}
                      label="ผันอักษรสูง"
                    />
                    <ModeRadio
                      checked={mode === "lowOnly"}
                      onChange={() => setMode("lowOnly")}
                      label="ผันอักษรต่ำ"
                    />
                  </div>
                )}
              </section>

              <section>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#64748b", marginBottom: "7px" }}>
                  ⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว)
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(11, 1fr)",
                    gap: "5px",
                  }}
                >
                  {QUICK_CONSONANTS.map((consonant) => {
                    const consonantClass = getConsonantClass(consonant);

                    return (
                      <button
                        type="button"
                        key={consonant}
                        onClick={() => handleQuickConsonant(consonant)}
                        style={{
                          height: "35px",
                          padding: 0,
                          border: "1px solid #cbd5e1",
                          borderRadius: "7px",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: getColorByClass(consonantClass, colors),
                        }}
                      >
                        {consonant}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div style={{ color: "#15803d", fontWeight: "bold", fontSize: "13px", marginBottom: "7px" }}>
                  🟢 สระเสียงยาว (คำเป็น)
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "13px" }}>
                  {LONG_VOWELS.map((vowel) => (
                    <button
                      type="button"
                      key={vowel.label}
                      onClick={() => handleQuickVowel(vowel)}
                      style={{
                        height: "35px",
                        padding: "0 10px",
                        borderRadius: "7px",
                        border: "1px solid #bbf7d0",
                        backgroundColor: "#f0fdf4",
                        color: "#15803d",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "15px",
                      }}
                    >
                      {vowel.label}
                    </button>
                  ))}
                </div>

                <div style={{ color: "#b91c1c", fontWeight: "bold", fontSize: "13px", marginBottom: "7px" }}>
                  🔴 สระเสียงสั้น (คำตาย)
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {SHORT_VOWELS.map((vowel) => (
                    <button
                      type="button"
                      key={vowel.label}
                      onClick={() => handleQuickVowel(vowel)}
                      style={{
                        height: "35px",
                        padding: "0 10px",
                        borderRadius: "7px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "15px",
                      }}
                    >
                      {vowel.label}
                    </button>
                  ))}
                </div>
              </section>

              <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <div style={{ color: "#334155", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>
                  🎨 ตั้งค่าสีประจำหมู่
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {[
                    ["อักษรกลาง", colorMid, setColorMid],
                    ["อักษรสูง", colorHigh, setColorHigh],
                    ["อักษรต่ำ", colorLow, setColorLow],
                    ["สีตัวอักษร", circleTextColor, setCircleTextColor],
                  ].map(([label, value, setter]) => (
                    <label
                      key={label}
                      style={{
                        height: "36px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: value,
                        color: label === "สีตัวอักษร" ? value : "#ffffff",
                        border: "1px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      {label}
                      <input
                        type="color"
                        value={value}
                        onChange={(event) => setter(event.target.value)}
                        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <div style={{ color: "#1e293b", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>
                  🖼️ สีพื้นหลังจอภาพ
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "9px" }}>
                  {[
                    ["เทา", "#e2e8f0"],
                    ["ขาว", "#f8fafc"],
                    ["ฟ้า", "#e0f2fe"],
                    ["มินต์", "#dcfce7"],
                    ["ส้ม", "#fef3c7"],
                    ["เข้ม", "#334155"],
                  ].map(([label, color]) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => {
                        setScreenBgColor(color);
                        setBgType("color");
                      }}
                      style={{
                        border:
                          bgType === "color" && screenBgColor === color
                            ? "2px solid #0284c7"
                            : "1px solid #cbd5e1",
                        backgroundColor: color,
                        color: color === "#334155" ? "#ffffff" : "#1e293b",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px",
                      }}
                    >
                      {label}
                    </button>
                  ))}

                  <label
                    style={{
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      borderRadius: "6px",
                      padding: "4px 7px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    สีเอง
                    <input
                      type="color"
                      value={screenBgColor}
                      onChange={(event) => {
                        setScreenBgColor(event.target.value);
                        setBgType("color");
                      }}
                      style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
                    />
                  </label>
                </div>

                <label
                  style={{
                    display: "inline-block",
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    padding: "6px 9px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  📁 อัปโหลดรูปภาพพื้นหลัง
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>

                {bgType === "image" && (
                  <button
                    type="button"
                    onClick={() => {
                      setBgType("color");
                      setScreenBgImage("");
                    }}
                    style={{
                      marginLeft: "7px",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    ยกเลิกรูป
                  </button>
                )}
              </section>

              <section
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <div style={{ color: "#1e293b", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>
                  🎼 สีพื้นหลังกระดานบรรทัด 5 เส้น
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    ["ขาว", "#ffffff"],
                    ["ครีม", "#fffbeb"],
                    ["ฟ้า", "#f0f9ff"],
                    ["เขียว", "#f0fdf4"],
                    ["ม่วง", "#faf5ff"],
                    ["เทา", "#f8fafc"],
                  ].map(([label, color]) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setStaffBgColor(color)}
                      style={{
                        border:
                          staffBgColor === color
                            ? "2px solid #0284c7"
                            : "1px solid #cbd5e1",
                        backgroundColor: color,
                        color: "#334155",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px",
                      }}
                    >
                      {label}
                    </button>
                  ))}

                  <input
                    type="color"
                    value={staffBgColor}
                    onChange={(event) => setStaffBgColor(event.target.value)}
                    title="เลือกสีพื้นหลังกระดานเอง"
                    style={{
                      width: "32px",
                      height: "29px",
                      padding: 0,
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </section>

              <section
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                <div style={{ color: "#1e293b", fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>
                  🔊 เสียงอ่านคำผันวรรณยุกต์ (TTS)
                </div>

                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px", lineHeight: 1.45 }}>
                  กดวงกลมคำหรือสัญลักษณ์ 🔊 บนกระดานเพื่อฟังเสียง
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>
                    ค่ายเสียง
                    <select
                      value={ttsProvider}
                      onChange={(event) => setTtsProvider(event.target.value)}
                      style={{
                        marginTop: "4px",
                        width: "100%",
                        padding: "7px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option>ทั้งหมด</option>
                      <option>Google</option>
                      <option>Microsoft</option>
                      <option>Samsung</option>
                      <option>Apple</option>
                      <option>เบราว์เซอร์/ระบบ</option>
                    </select>
                  </label>

                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>
                    ลักษณะเสียง
                    <select
                      value={ttsGender}
                      onChange={(event) => setTtsGender(event.target.value)}
                      style={{
                        marginTop: "4px",
                        width: "100%",
                        padding: "7px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option>ทั้งหมด</option>
                      <option>หญิง</option>
                      <option>ชาย</option>
                      <option>ไม่ระบุ</option>
                    </select>
                  </label>
                </div>

                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#475569",
                    marginTop: "9px",
                  }}
                >
                  เลือกเสียงภาษาไทย
                  <select
                    value={selectedVoiceURI}
                    onChange={(event) => setSelectedVoiceURI(event.target.value)}
                    style={{
                      marginTop: "4px",
                      width: "100%",
                      padding: "7px",
                      borderRadius: "7px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {availableVoices.length === 0 && (
                      <option value="">ไม่พบเสียงภาษาไทยในอุปกรณ์นี้</option>
                    )}

                    {availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} — {getProviderName(voice)} / {guessGender(voice)}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#475569",
                      fontWeight: "bold",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span>ความเร็วเสียง</span>
                    <span>{speechRate.toFixed(1)}x</span>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="1.2"
                    step="0.1"
                    value={speechRate}
                    onChange={(event) => setSpeechRate(Number(event.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => speak(inputText || "สวัสดีครับ")}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    border: "none",
                    borderRadius: "7px",
                    padding: "8px",
                    backgroundColor: "#7c3aed",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ▶ ทดสอบเสียง
                </button>
              </section>

              <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#475569",
                    fontWeight: "bold",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span>📐 ขนาดคำในวงกลม (จอที่ 2)</span>
                  <span style={{ color: "#0284c7" }}>{labelFontSize}px</span>
                </div>

                <input
                  type="range"
                  min="16"
                  max="32"
                  value={labelFontSize}
                  onChange={(event) => setLabelFontSize(Number(event.target.value))}
                  style={{ width: "100%" }}
                />
              </section>

              <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowApiInput((current) => !current)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    padding: "9px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: geminiApiKey ? "#0369a1" : "#92400e",
                    backgroundColor: geminiApiKey ? "#e0f2fe" : "#fef3c7",
                    border: geminiApiKey ? "1px solid #7dd3fc" : "1px solid #fde68a",
                  }}
                >
                  🔑 {geminiApiKey ? "ตั้งค่า Google AI" : "เชื่อมต่อ Google AI (ไม่บังคับ)"}
                </button>

                {showApiInput && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px dashed #94a3b8",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px" }}>
                      API Key จะเก็บชั่วคราวเฉพาะแท็บนี้ และ AI ใช้เพื่อช่วยอธิบายคำเท่านั้น
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="password"
                        value={tempApiKey}
                        placeholder="วาง Gemini API Key"
                        onChange={(event) => setTempApiKey(event.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "7px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />

                      <button
                        type="button"
                        onClick={saveApiKey}
                        style={{
                          border: "none",
                          borderRadius: "6px",
                          padding: "0 10px",
                          backgroundColor: "#10b981",
                          color: "#ffffff",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        บันทึก
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!hasWord || aiLoading}
                      onClick={askGoogleAI}
                      style={{
                        marginTop: "8px",
                        width: "100%",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px",
                        backgroundColor: !hasWord || aiLoading ? "#94a3b8" : "#0284c7",
                        color: "#ffffff",
                        fontWeight: "bold",
                        cursor: !hasWord || aiLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {aiLoading ? "กำลังวิเคราะห์..." : "✨ ให้ Google AI ช่วยอธิบายคำ"}
                    </button>

                    {aiMessage && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          borderRadius: "6px",
                          backgroundColor: "#eff6ff",
                          color: "#1e40af",
                          whiteSpace: "pre-wrap",
                          fontSize: "12px",
                          lineHeight: 1.5,
                        }}
                      >
                        {aiMessage}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}