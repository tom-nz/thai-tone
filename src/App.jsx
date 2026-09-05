import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

const apiKey = "";
const CHANNEL_NAME = "thai_tone_sync_channel";
const STORAGE_KEY = "thai_tone_live_sync_data";

// Regex ตรวจสอบคำไทย 1 พยางค์อย่างเคร่งครัด
const STRICT_THAI_SYLLABLE_PATTERN = /^[เแโใไ]?[ก-ฮ]{1,2}[ิีึืุูั็ํ]?[่้๊๋]?[าำยวอ]?[ก-ฮ]?[ะ์]?$/;

const midConsonants = ["ก", "จ", "ด", "ต", "บ", "ป", "อ", "ฎ", "ฏ"];
const highConsonants = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
const lowSingleConsonants = ["ง", "ญ", "น", "ย", "ณ", "ร", "ว", "ม", "ฬ", "ล"];

const quickConsonants = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ",
];

const thaiClusters = [
  "กร", "กล", "กว", "ขร", "ขล", "ขว", "คร", "คล", "คว",
  "ตร", "ตล", "ปร", "ปล", "พร", "พล", "ฟร", "ฟล",
  "หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว",
  "ทร", "ศร", "สร", "จร", "ซร",
];

const longVowels = [
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

const shortVowels = [
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

const pairMap = {
  ค: "ข", ฅ: "ฃ", ฆ: "ข", ข: "ค", ฃ: "ฅ",
  ช: "ฉ", ฌ: "ฉ", ฉ: "ช",
  ซ: "ศ", ศ: "ซ", ษ: "ซ", ส: "ซ",
  ท: "ถ", ธ: "ถ", ฑ: "ฐ", ฒ: "ฐ", ถ: "ท", ฐ: "ท",
  พ: "ผ", ภ: "ผ", ผ: "พ",
  ฟ: "ฝ", ฝ: "ฟ",
  ฮ: "ห", ห: "ฮ",
};

const toneRows = [
  { id: 5, tone: "เสียงจัตวา", mark: "◌๋", leftPos: "80%" },
  { id: 4, tone: "เสียงตรี", mark: "◌๊", leftPos: "65%" },
  { id: 3, tone: "เสียงโท", mark: "◌้", leftPos: "52%" },
  { id: 2, tone: "เสียงเอก", mark: "◌่", leftPos: "40%" },
  { id: 1, tone: "เสียงสามัญ", mark: "-", leftPos: "28%" },
];

// Custom Radio Component
function ModeRadio({ value, checked, label, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        name="mode"
        checked={checked}
        onChange={() => onChange(value)}
        style={{
          appearance: "none",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: "2px solid #475569",
          backgroundColor: checked ? "#000000" : "#ffffff",
          cursor: "pointer",
          margin: 0,
          flexShrink: 0,
        }}
      />
      {label}
    </label>
  );
}

function parseThaiWord(word = "") {
  let workStr = word.trim();
  let frontVowel = "";

  if (["เ", "แ", "โ", "ใ", "ไ"].includes(workStr[0])) {
    frontVowel = workStr[0];
    workStr = workStr.slice(1);
  }

  let initial = "";
  if (workStr.length >= 2 && thaiClusters.includes(workStr.slice(0, 2))) {
    initial = workStr.slice(0, 2);
    workStr = workStr.slice(2);
  } else if (workStr.length) {
    initial = workStr[0];
    workStr = workStr.slice(1);
  }

  const aboveBelowVowelChars = ["ิ", "ี", "ึ", "ื", "ุ", "ู", "ั", "็", "ํ"];
  const toneChars = ["่", "้", "๊", "๋"];

  let aboveBelowVowel = "";
  let toneMark = "";
  let rest = "";

  for (const char of workStr) {
    if (toneChars.includes(char)) toneMark = char;
    else if (aboveBelowVowelChars.includes(char)) aboveBelowVowel += char;
    else rest += char;
  }

  return { initial, frontVowel, aboveBelowVowel, toneMark, rest };
}

function buildWord(frontVowel, initial, aboveBelowVowel, tone, rest) {
  const rawWord = `${frontVowel}${initial}${aboveBelowVowel}${tone}${rest}`;
  return rawWord.replace(/([่้๊๋])([ิีึืุูั็ํ])/g, "$2$1").normalize("NFC");
}

function analyzeSyllable(word, currentMode) {
  const { initial, frontVowel, aboveBelowVowel, rest } = parseThaiWord(word);
  const primaryConsonant = initial?.[0] || "";
  const rearVowel = aboveBelowVowel + rest;

  const shortVowelChars = ["ะ", "ิ", "ึ", "ุ", "ั"];
  const deadEndings = [
    "ก", "ข", "ค", "ฆ", "บ", "ป", "พ", "ฟ", "ภ",
    "ด", "จ", "ช", "ซ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ",
    "ต", "ถ", "ท", "ธ", "ศ", "ษ", "ส",
  ];

  const isShort =
    shortVowelChars.some((v) => rearVowel.includes(v)) ||
    (frontVowel === "เ" && rearVowel.includes("ะ"));

  const lastChar = rearVowel.slice(-1);
  const isDead =
    deadEndings.includes(lastChar) ||
    rearVowel.endsWith("ะ") ||
    (isShort && !rest);

  const type = isDead ? "คำตาย" : "คำเป็น";
  const vowelLen = isShort ? "สระเสียงสั้น" : "สระเสียงยาว";
  const isCluster = initial.length > 1;
  const clusterLabel = isCluster ? ` (คำควบกล้ำ "${initial}")` : "";
  let desc = "";

  if (midConsonants.includes(primaryConsonant)) {
    if (currentMode === "highOnly") {
      desc = `อักษรกลาง${clusterLabel} เทียบผันเฉพาะเสียงสูง [เอก, โท, จัตวา]`;
    } else if (currentMode === "lowOnly") {
      desc = `อักษรกลาง${clusterLabel} เทียบผันเฉพาะเสียงต่ำ [สามัญ, โท, ตรี]`;
    } else {
      desc = isDead
        ? `อักษรกลาง${clusterLabel} คำตาย (ผันได้เฉพาะ เอก, โท, ตรี, จัตวา)`
        : `อักษรกลาง${clusterLabel} คำเป็น (ผันได้ครบ 5 เสียง)`;
    }
  } else if (highConsonants.includes(primaryConsonant) || initial.startsWith("ห")) {
    desc = isDead
      ? `อักษรสูง${clusterLabel} คำตาย (ผันได้เฉพาะ เสียงเอก และ เสียงโท)`
      : `อักษรสูง${clusterLabel} คำเป็น (ผันได้เฉพาะ เอก, โท, จัตวา)`;
  } else if (currentMode === "full5") {
    desc = isDead
      ? "ผันคู่ อักษรสูง/ห นำ [เอก, โท] + อักษรต่ำ [โท, ตรี]"
      : "ผันคู่ อักษรสูง/ห นำ [เอก, โท, จัตวา] + อักษรต่ำ [สามัญ, โท, ตรี] รวมผันได้ครบทั้ง 5 เสียง";
  } else if (currentMode === "highOnly") {
    desc = `เทียบผันเป็น เสียงอักษรสูง/ห นำ${clusterLabel} (ผันได้เฉพาะ เอก, โท, จัตวา)`;
  } else {
    desc = isDead
      ? isShort
        ? `อักษรต่ำ${clusterLabel} คำตายสระสั้น (พื้นเสียงตรี, ผันเสียงโทและจัตวา)`
        : `อักษรต่ำ${clusterLabel} คำตายสระยาว (พื้นเสียงโท, ผันเสียงตรี)`
      : `อักษรต่ำ${clusterLabel} คำเป็น (ผันได้ สามัญ, โท, ตรี)`;
  }

  return {
    type,
    vowelLen,
    desc,
    isDead,
    isShort,
    initial,
    frontVowel,
    aboveBelowVowel,
    rest,
    primaryConsonant,
  };
}

function calculateTones(word, mode, colorMid, colorHigh, colorLow) {
  const emptyRows = toneRows.map((row) => ({
    ...row,
    word: "",
    color: "#94a3b8",
    isMulti: false,
    multi: [],
    show: false,
  }));

  if (!word?.trim()) return emptyRows;

  const info = analyzeSyllable(word, mode);
  const {
    initial,
    frontVowel,
    aboveBelowVowel,
    rest,
    isDead,
    isShort,
    primaryConsonant,
  } = info;

  const row = (id, wordValue, color, show = true) => ({
    ...toneRows.find((item) => item.id === id),
    word: wordValue || "",
    color,
    isMulti: false,
    multi: [],
    show: Boolean(show && wordValue),
  });

  const multiRow = (id, values) => ({
    ...toneRows.find((item) => item.id === id),
    word: "",
    color: values[0]?.color || "#94a3b8",
    isMulti: true,
    multi: values,
    show: values.length > 0,
  });

  const make = (consonant, mark = "") =>
    buildWord(frontVowel, consonant, aboveBelowVowel, mark, rest);

  if (midConsonants.includes(primaryConsonant)) {
    if (mode === "highOnly") {
      return [
        row(5, make(initial, "๋"), colorMid),
        row(4, "", colorMid, false),
        row(3, make(initial, "้"), colorMid),
        row(2, make(initial, "่"), colorMid),
        row(1, "", colorMid, false),
      ];
    }

    if (mode === "lowOnly") {
      return [
        row(5, "", colorMid, false),
        row(4, make(initial, "๊"), colorMid),
        row(3, make(initial, "้"), colorMid),
        row(2, "", colorMid, false),
        row(1, isDead ? "" : make(initial), colorMid, !isDead),
      ];
    }

    return [
      row(5, make(initial, "๋"), colorMid),
      row(4, make(initial, "๊"), colorMid),
      row(3, make(initial, "้"), colorMid),
      row(2, isDead ? buildWord(frontVowel, initial, aboveBelowVowel, "", rest) : make(initial, "่"), colorMid),
      row(1, isDead ? "" : make(initial), colorMid, !isDead),
    ];
  }

  let highConsonant = "";
  let lowConsonant = "";

  if (highConsonants.includes(primaryConsonant) || initial.startsWith("ห")) {
    highConsonant = initial;
    lowConsonant = pairMap[primaryConsonant] || primaryConsonant;
  } else if (lowSingleConsonants.includes(primaryConsonant)) {
    lowConsonant = initial;
    highConsonant = `ห${initial}`;
  } else {
    lowConsonant = initial;
    highConsonant = pairMap[primaryConsonant] || `ห${initial}`;
  }

  if (mode === "highOnly") {
    return [
      row(5, isDead ? "" : make(highConsonant), colorHigh, !isDead),
      row(4, "", colorHigh, false),
      row(3, make(highConsonant, "้"), colorHigh),
      row(2, make(highConsonant, "่"), colorHigh),
      row(1, "", colorHigh, false),
    ];
  }

  if (mode === "lowOnly") {
    return [
      row(5, "", colorLow, false),
      row(4, make(lowConsonant, isDead && isShort ? "" : "้"), colorLow),
      row(3, make(lowConsonant, isDead && !isShort ? "" : "่"), colorLow),
      row(2, "", colorLow, false),
      row(1, isDead ? "" : make(lowConsonant), colorLow, !isDead),
    ];
  }

  return [
    row(5, isDead ? "" : make(highConsonant), colorHigh, !isDead),
    row(4, make(lowConsonant, isDead && isShort ? "" : "้"), colorLow),
    multiRow(3, [
      {
        text: make(lowConsonant, isDead && !isShort ? "" : "่"),
        color: colorLow,
      },
      {
        text: make(highConsonant, "้"),
        color: colorHigh,
      },
    ]),
    row(2, make(highConsonant, "่"), colorHigh),
    row(1, isDead ? "" : make(lowConsonant), colorLow, !isDead),
  ];
}

function getSpeechText(item) {
  if (!item?.show) return "";
  if (item.isMulti) return item.multi.map((circle) => circle.text).join(" หรือ ");
  return item.word || "";
}

function Board({
  linesData,
  analysisInfo,
  inputText,
  activeRowId,
  onRowClick,
  circleTextColor,
  isDisplay = false,
  fontSize = 20,
  staffBgColor = "#ffffff",
}) {
  const fixedRightLabels = {
    5: { text: "เสียงสูง", color: "#ef4444" },
    3: { text: "เสียงกลาง", color: "#22c55e" },
    1: { text: "เสียงต่ำ", color: "#007bff" },
  };

  const ratio = Math.max(0.8, fontSize / 20);
  const circleSize = isDisplay ? `clamp(42px, ${4.2 * ratio}vw, 70px)` : "48px";
  const textSize = isDisplay ? `clamp(15px, ${1.5 * ratio}vw, 25px)` : "17px";

  return (
    <div
      className={`tone-board ${isDisplay ? "display-board" : ""}`}
      style={isDisplay ? { backgroundColor: staffBgColor } : { height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <div className="board-title" style={{ flexShrink: 0 }}>
        <h2>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
        <div>และการผันวรรณยุกต์</div>
      </div>

      {inputText && analysisInfo?.desc && (
        <div className="analysis-box" style={{ flexShrink: 0 }}>
          📌 ผลวิเคราะห์หลักภาษา: <strong>"{inputText}"</strong> เป็น{" "}
          <span className="analysis-tag">
            {analysisInfo.type} ({analysisInfo.vowelLen})
          </span>{" "}
          — {analysisInfo.desc}
        </div>
      )}

      <div className="tone-header" style={{ flexShrink: 0 }}>
        <span>รูปวรรณยุกต์</span>
      </div>

      <div className="tone-rows">
        {linesData.map((item) => {
          const isActive = activeRowId === item.id;
          const fixedRight = fixedRightLabels[item.id];
          const rowColor = item.show
            ? item.isMulti
              ? item.multi[0]?.color
              : item.color
            : "#94a3b8";

          return (
            <button
              type="button"
              className={`tone-row ${isActive ? "active" : ""} ${!item.show ? "disabled-tone-row" : ""}`}
              key={item.id}
              onClick={() => onRowClick(item)}
              title={item.show ? `คลิกเพื่อขยายและอ่านคำ ${getSpeechText(item)}` : ""}
            >
              <div
                className="tone-name"
                style={{
                  color: rowColor,
                  fontSize: textSize,
                }}
              >
                {item.tone} <span>[ {item.mark} ]</span>
              </div>

              <div className="tone-line-wrap">
                <div className="tone-line" />
                {item.show && !item.isMulti && item.word && (
                  <div
                    className="tone-circle"
                    style={{
                      left: item.leftPos,
                      backgroundColor: item.color,
                      color: circleTextColor,
                      "--note-color": item.color,
                      minWidth: circleSize,
                      height: circleSize,
                      fontSize: isDisplay
                        ? `clamp(16px, ${1.8 * ratio}vw, 27px)`
                        : "18px",
                    }}
                  >
                    {item.word}
                  </div>
                )}

                {item.show && item.isMulti && (
                  <div className="multi-circles" style={{ left: item.leftPos }}>
                    {item.multi.map((circle, index) => (
                      <React.Fragment key={`${circle.text}-${index}`}>
                        {index > 0 && <span className="slash">/</span>}
                        <div
                          className="tone-circle"
                          style={{
                            position: "relative",
                            left: "auto",
                            transform: "none",
                            backgroundColor: circle.color,
                            color: circleTextColor,
                            "--note-color": circle.color,
                            minWidth: circleSize,
                            height: circleSize,
                            fontSize: isDisplay
                              ? `clamp(16px, ${1.8 * ratio}vw, 27px)`
                              : "18px",
                          }}
                        >
                          {circle.text}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="fixed-tone-label"
                style={{ color: fixedRight?.color || "#94a3b8" }}
              >
                {fixedRight?.text || ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);
  const [mode, setMode] = useState("full5");
  const [viewLayout, setViewLayout] = useState("split");
  const [inputText, setInputText] = useState("");
  const [lastValidInput, setLastValidInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);

  const [colorMid, setColorMid] = useState("#22c55e");
  const [colorHigh, setColorHigh] = useState("#ef4444");
  const [colorLow, setColorLow] = useState("#007bff");
  const [circleTextColor, setCircleTextColor] = useState("#ffffff");
  const [labelFontSize, setLabelFontSize] = useState(20);

  const [bgType, setBgType] = useState("color");
  const [bgColor, setBgColor] = useState("#e2e8f0");
  const [bgImage, setBgImage] = useState("");
  const [staffBgColor, setStaffBgColor] = useState("#ffffff");

  const [activeRowId, setActiveRowId] = useState(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");

  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_api_key") || "";
    }
    return "";
  });
  const [tempApiKey, setTempApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_api_key") || "";
    }
    return "";
  });
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState("");
  const speechRef = useRef(null);

  const [analysisInfo, setAnalysisInfo] = useState(() =>
    analyzeSyllable("", "full5"),
  );
  const [linesData, setLinesData] = useState(() =>
    calculateTones("", "full5", "#22c55e", "#ef4444", "#007bff"),
  );

  const containerBackground = useMemo(() => {
    if (bgType === "image" && bgImage) {
      return {
        backgroundImage: `linear-gradient(rgba(255,255,255,.12), rgba(255,255,255,.12)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return { backgroundColor: bgColor };
  }, [bgType, bgColor, bgImage]);

  const speak = (text) => {
    if (typeof window === "undefined" || !speechEnabled || !text || !("speechSynthesis" in window)) return;

    const normalizedText = text.replace(/([่้๊๋])([ิีึืุูั็ํ])/g, "$2$1").normalize("NFC");

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = "th-TH";
    utterance.rate = Number(speechRate);
    utterance.pitch = 1;

    const voice = voices.find((item) => item.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleRowClick = (item) => {
    if (!item.show) return;
    setActiveRowId((previous) => (previous === item.id ? null : item.id));
    speak(getSpeechText(item));
  };

  const validateInput = (word) => {
    const value = word.trim();

    if (!value) {
      setInputError("กรุณากรอกคำศัพท์");
      return false;
    }

    if (/\s/.test(value)) {
      setInputError("กรุณากรอกเพียง 1 คำเท่านั้น ห้ามเว้นวรรค");
      return false;
    }

    if (!STRICT_THAI_SYLLABLE_PATTERN.test(value)) {
      setInputError("กรุณากรอก 1 พยางค์ให้ถูกหลักภาษาไทย (เช่น พยัญชนะ สระ ตัวสะกด วรรณยุกต์)");
      return false;
    }

    setInputError("");
    return true;
  };

  const handleGenerate = async () => {
    const word = inputText.trim();
    if (!validateInput(word)) {
      if (lastValidInput) {
        setInputText(lastValidInput);
        validateInput(lastValidInput);
      } else {
        setInputText("");
        validateInput("");
      }
      return;
    }
    
    setLastValidInput(word);

    const fallback = () => {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
      setAnalysisInfo(analyzeSyllable(word, mode));
    };

    const activeKey = customApiKey.trim() || apiKey;
    if (!activeKey) {
      fallback();
      return;
    }

    setLoading(true);

    try {
      const prompt = `วิเคราะห์การผันวรรณยุกต์ภาษาไทยของคำว่า "${word}" ส่งคืนเฉพาะ JSON array 5 รายการ เรียง จัตวา ตรี โท เอก สามัญ รูปแบบ [{"word":"...","type":"high"},{"word":"...","type":"low"},{"words":["...","..."],"type":"pair"},{"word":"...","type":"high"},{"word":"...","type":"low"}]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonText = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed) || parsed.length !== 5) throw new Error("Invalid AI response");

      const formatted = parsed.map((item, index) => {
        const base = toneRows[index];
        const color =
          item.type === "high"
            ? colorHigh
            : item.type === "low"
              ? colorLow
              : colorMid;

        if (Array.isArray(item.words)) {
          return {
            ...base,
            word: "",
            color,
            isMulti: true,
            multi: item.words.map((text, itemIndex) => ({
              text,
              color: itemIndex === 0 ? colorLow : colorHigh,
            })),
            show: item.words.length > 0,
          };
        }

        return {
          ...base,
          word: item.word || "",
          color,
          isMulti: false,
          multi: [],
          show: Boolean(item.word),
        };
      });

      setLinesData(formatted);
      setAnalysisInfo(analyzeSyllable(word, mode));
    } catch (err) {
      console.warn("AI Generate fallback:", err);
      fallback();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConsonantClick = (consonant) => {
    const { frontVowel, aboveBelowVowel, rest } = parseThaiWord(inputText);
    const newWord = buildWord(frontVowel || "", consonant, aboveBelowVowel || "", "", rest || "อ");
    setInputText(newWord);
    validateInput(newWord);
  };

  const handleQuickVowelClick = (vowel) => {
    const { initial } = parseThaiWord(inputText);
    const newWord = `${vowel.front}${initial || "ก"}${vowel.rear}`;
    setInputText(newWord);
    validateInput(newWord);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBgImage(reader.result);
      setBgType("image");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveApiKey = () => {
    const key = tempApiKey.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", key);
    }
    setCustomApiKey(key);
    setApiSaveStatus("บันทึก API Key เรียบร้อยแล้ว!");
    window.setTimeout(() => setApiSaveStatus(""), 3000);
  };

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
    }
  }, []);

  const handleOpenDualMonitor = () => {
    if (typeof window === "undefined") return;
    const currentUrl = window.location.href.split("?")[0];
    window.open(
      `${currentUrl}?view=display`,
      "ThaiToneDisplayWindow",
      "width=1280,height=860,resizable=yes,scrollbars=yes,status=yes",
    );
  };

  const syncData = useMemo(
    () => ({
      type: "SYNC_STATE",
      linesData,
      analysisInfo,
      inputText,
      activeRowId,
      colorMid,
      colorHigh,
      colorLow,
      circleTextColor,
      labelFontSize,
      bgType,
      bgColor,
      bgImage,
      staffBgColor,
      mode,
      speechEnabled,
      speechRate,
      selectedVoiceURI,
    }),
    [
      linesData,
      analysisInfo,
      inputText,
      activeRowId,
      colorMid,
      colorHigh,
      colorLow,
      circleTextColor,
      labelFontSize,
      bgType,
      bgColor,
      bgImage,
      staffBgColor,
      mode,
      speechEnabled,
      speechRate,
      selectedVoiceURI,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const displayMode = params.get("view") === "display";
    setIsDisplayWindow(displayMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const thaiFirst = window.speechSynthesis
        .getVoices()
        .sort((a, b) => Number(b.lang.startsWith("th")) - Number(a.lang.startsWith("th")));
      setVoices(thaiFirst);

      if (!selectedVoiceURI) {
        const thaiVoice = thaiFirst.find((voice) => voice.lang.startsWith("th"));
        if (thaiVoice) setSelectedVoiceURI(thaiVoice.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (isDisplayWindow) return;
    setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
    setAnalysisInfo(analyzeSyllable(inputText, mode));
  }, [inputText, mode, colorMid, colorHigh, colorLow, isDisplayWindow]);

  useEffect(() => {
    if (isDisplayWindow || typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncData));
    } catch (err) {
      console.warn("Storage sync error:", err);
    }
    channel.postMessage(syncData);

    const listener = (event) => {
      if (event.data?.type === "REQUEST_SYNC") channel.postMessage(syncData);
    };

    channel.addEventListener("message", listener);
    return () => {
      channel.removeEventListener("message", listener);
      channel.close();
    };
  }, [isDisplayWindow, syncData]);

  useEffect(() => {
    if (!isDisplayWindow || typeof window === "undefined") return;

    const apply = (data) => {
      if (!data) return;
      if (Array.isArray(data.linesData)) setLinesData(data.linesData);
      if (data.analysisInfo) setAnalysisInfo(data.analysisInfo);
      if (data.inputText !== undefined) setInputText(data.inputText);
      if (data.activeRowId !== undefined) setActiveRowId(data.activeRowId);
      if (data.colorMid) setColorMid(data.colorMid);
      if (data.colorHigh) setColorHigh(data.colorHigh);
      if (data.colorLow) setColorLow(data.colorLow);
      if (data.circleTextColor) setCircleTextColor(data.circleTextColor);
      if (data.labelFontSize) setLabelFontSize(data.labelFontSize);
      if (data.bgType) setBgType(data.bgType);
      if (data.bgColor) setBgColor(data.bgColor);
      if (data.bgImage !== undefined) setBgImage(data.bgImage);
      if (data.staffBgColor) setStaffBgColor(data.staffBgColor);
      if (data.mode) setMode(data.mode);
      if (data.speechEnabled !== undefined) setSpeechEnabled(data.speechEnabled);
      if (data.speechRate) setSpeechRate(data.speechRate);
      if (data.selectedVoiceURI !== undefined) setSelectedVoiceURI(data.selectedVoiceURI);
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) apply(JSON.parse(saved));
    } catch (err) {
      console.warn("Read saved state error:", err);
    }

    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const listener = (event) => {
      if (event.data?.type === "SYNC_STATE") apply(event.data);
      if (event.data?.type === "TOGGLE_FULLSCREEN") toggleFullscreen();
    };

    channel.addEventListener("message", listener);
    channel.postMessage({ type: "REQUEST_SYNC" });

    return () => {
      channel.removeEventListener("message", listener);
      channel.close();
    };
  }, [isDisplayWindow, toggleFullscreen]);

  const sendFullscreenToDisplay = () => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "TOGGLE_FULLSCREEN" });
    channel.close();
  };

  const renderTopBar = (extraStyle = {}) => (
    <section className="top-bar panel" style={{ ...extraStyle, flexShrink: 0 }}>
      <div className="view-buttons">
        <strong>🖥️ มุมมอง:</strong>
        {[
          ["standard", "ชิดเดียว"],
          ["split", "แบ่ง 2 จอ"],
          ["present", "โหมดพรีวิว"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={viewLayout === value ? "selected-btn" : "soft-btn"}
            onClick={() => setViewLayout(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="monitor-buttons">
        <button className="blue-btn" onClick={sendFullscreenToDisplay}>
          ⛶ สลับเต็มจอ จอที่ 2
        </button>
        <button className="green-btn" onClick={handleOpenDualMonitor}>
          🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
        </button>
      </div>
    </section>
  );

  if (isDisplayWindow) {
    return (
      <>
        <style>{styles}</style>
        <main
          className="display-page"
          style={containerBackground}
          onDoubleClick={toggleFullscreen}
        >
          <Board
            linesData={linesData}
            analysisInfo={analysisInfo}
            inputText={inputText}
            activeRowId={activeRowId}
            onRowClick={handleRowClick}
            circleTextColor={circleTextColor}
            isDisplay
            fontSize={labelFontSize}
            staffBgColor={staffBgColor}
          />
          <div className="display-tip">ดับเบิลคลิกพื้นที่ว่างเพื่อสลับเต็มจอ • คลิกบรรทัดเพื่อขยายและอ่านออกเสียง</div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="app-page" style={containerBackground}>
        <div className="app-shell">
          
          {viewLayout === "present" && renderTopBar({ marginBottom: "16px" })}

          <div className={`main-grid ${viewLayout === "split" ? "split-layout" : ""}`}>
            
            <section
              className="panel"
              style={{
                backgroundColor: staffBgColor,
                borderRadius: "16px",
                padding: viewLayout === "present" ? "40px 50px" : "35px 25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                backdropFilter: "blur(6px)",
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              <Board
                linesData={linesData}
                analysisInfo={analysisInfo}
                inputText={inputText}
                activeRowId={activeRowId}
                onRowClick={handleRowClick}
                circleTextColor={circleTextColor}
                fontSize={labelFontSize}
                staffBgColor={staffBgColor}
              />
            </section>

            {viewLayout !== "present" && (
              <div
                className="right-panel-wrapper"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  height: "100%",
                  minHeight: 0
                }}
              >
                {renderTopBar({ marginBottom: 0 })}

                <aside 
                  className="control-panel panel" 
                  style={{ flex: 1, overflowY: "auto", position: "static", maxHeight: "none", margin: 0 }}
                >
                  <h3>⚙️ แผงควบคุม</h3>

                  <section className="control-group">
                    <strong>✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</strong>

                    {inputText.trim() !== "" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginBottom: "12px",
                          fontSize: "13px",
                          color: "#334155",
                        }}
                      >
                        <ModeRadio value="full5" checked={mode === "full5"} label="ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)" onChange={setMode} />
                        <ModeRadio value="highOnly" checked={mode === "highOnly"} label="เฉพาะเสียงสูง (เอก, โท, จัตวา)" onChange={setMode} />
                        <ModeRadio value="lowOnly" checked={mode === "lowOnly"} label="เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)" onChange={setMode} />
                      </div>
                    )}

                    <div className="input-row">
                      <input
                        value={inputText}
                        placeholder="พิมพ์ 1 คำ เช่น กอ, เมา, กวาง"
                        onChange={(event) => {
                          const val = event.target.value;
                          setInputText(val);
                          validateInput(val);
                          if (!val.trim()) {
                            setMode("full5");
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleGenerate();
                        }}
                        className={inputError ? "input-error" : ""}
                      />
                      <button className="blue-btn" disabled={loading} onClick={handleGenerate}>
                        {loading ? "..." : "ผันคำ"}
                      </button>
                    </div>

                    {inputError && <div className="error-text">{inputError}</div>}
                  </section>

                  <section>
                    <div className="section-label">⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):</div>
                    <div className="consonant-grid">
                      {quickConsonants.map((consonant) => (
                        <button
                          key={consonant}
                          className="consonant-btn"
                          onClick={() => handleQuickConsonantClick(consonant)}
                          style={{
                            color: midConsonants.includes(consonant)
                              ? colorMid
                              : highConsonants.includes(consonant)
                                ? colorHigh
                                : colorLow,
                          }}
                        >
                          {consonant}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="section-label green-label">🟢 สระเสียงยาว (คำเป็น):</div>
                    <div className="vowel-list">
                      {longVowels.map((vowel) => (
                        <button
                          key={vowel.label}
                          className="vowel-btn long-vowel"
                          onClick={() => handleQuickVowelClick(vowel)}
                        >
                          {vowel.label}
                        </button>
                      ))}
                    </div>

                    <div className="section-label red-label">🔴 สระเสียงสั้น (คำตาย):</div>
                    <div className="vowel-list">
                      {shortVowels.map((vowel) => (
                        <button
                          key={vowel.label}
                          className="vowel-btn short-vowel"
                          onClick={() => handleQuickVowelClick(vowel)}
                        >
                          {vowel.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="control-group">
                    <strong>🔊 การอ่านออกเสียง</strong>

                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={(event) => setSpeechEnabled(event.target.checked)}
                      />
                      เปิดเสียงเมื่อคลิกบรรทัด
                    </label>

                    <label className="select-label">
                      เสียงอ่าน
                      <select
                        value={selectedVoiceURI}
                        onChange={(event) => setSelectedVoiceURI(event.target.value)}
                      >
                        <option value="">เลือกอัตโนมัติ</option>
                        {voices.map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="select-label">
                      ความเร็วอ่าน: {speechRate}x
                      <input
                        type="range"
                        min="0.5"
                        max="1.4"
                        step="0.05"
                        value={speechRate}
                        onChange={(event) => setSpeechRate(Number(event.target.value))}
                      />
                    </label>

                    <button
                      className="soft-btn"
                      onClick={() => {
                        const item = linesData.find((line) => line.show);
                        speak(item ? getSpeechText(item) : inputText);
                      }}
                    >
                      ▶ ทดลองอ่านคำ
                    </button>
                  </section>

                  <section className="control-group">
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#4b5563",
                        marginBottom: "8px",
                      }}
                    >
                      🎼 สีพื้นหลังกระดานบรรทัด 5 เส้น
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { label: "ขาว", value: "#ffffff" },
                        { label: "ครีม", value: "#fffbeb" },
                        { label: "ฟ้าอ่อน", value: "#f0f9ff" },
                        { label: "เขียวอ่อน", value: "#f0fdf4" },
                        { label: "เทาอ่อน", value: "#f8fafc" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setStaffBgColor(item.value)}
                          style={{
                            backgroundColor: item.value,
                            border:
                              staffBgColor === item.value
                                ? "2px solid #0284c7"
                                : "1px solid #cbd5e1",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: "#1e293b",
                          }}
                        >
                          {item.label}
                        </button>
                      ))}

                      <input
                        type="color"
                        value={staffBgColor}
                        onChange={(e) => setStaffBgColor(e.target.value)}
                        title="เลือกสีเอง"
                        style={{
                          width: "34px",
                          height: "30px",
                          padding: 0,
                          cursor: "pointer",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                        }}
                      />
                    </div>
                  </section>

                  <section>
                    <div className="section-label">🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
                    <div className="color-grid">
                      {[
                        ["อักษรกลาง", colorMid, setColorMid],
                        ["อักษรสูง", colorHigh, setColorHigh],
                        ["อักษรต่ำ", colorLow, setColorLow],
                        ["สีตัวอักษร", circleTextColor, setCircleTextColor],
                      ].map(([label, value, setter]) => (
                        <label
                          key={label}
                          className="color-picker"
                          style={{
                            backgroundColor: label === "สีตัวอักษร" ? "#334155" : value,
                            color: label === "สีตัวอักษร" ? value : "#fff",
                          }}
                        >
                          {label}
                          <input
                            type="color"
                            value={value}
                            onChange={(event) => setter(event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="control-group">
                    <strong>🖼️ เลือกสีหรือรูปภาพพื้นหลังจอภาพรวม</strong>
                    <div className="background-colors">
                      {[
                        ["เทา", "#e2e8f0"],
                        ["สว่าง", "#f1f5f9"],
                        ["ฟ้าอ่อน", "#e0f2fe"],
                        ["มินต์", "#dcfce7"],
                        ["ส้มอ่อน", "#fef3c7"],
                        ["เข้ม", "#334155"],
                      ].map(([label, color]) => (
                        <button
                          key={color}
                          onClick={() => {
                            setBgColor(color);
                            setBgType("color");
                          }}
                          className={bgColor === color && bgType === "color" ? "background-selected" : ""}
                          style={{
                            backgroundColor: color,
                            color: color === "#334155" ? "#fff" : "#1e293b",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <label className="upload-btn">
                      📁 อัปโหลดรูปภาพพื้นหลัง
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </label>

                    {bgType === "image" && (
                      <button
                        className="danger-btn"
                        onClick={() => {
                          setBgType("color");
                          setBgImage("");
                        }}
                      >
                        ยกเลิกรูปภาพ
                      </button>
                    )}
                  </section>

                  <section className="control-group">
                    <label className="select-label">
                      📐 ขนาดตัวหนังสือและวงกลม (จอที่ 2): {labelFontSize}px
                      <input
                        type="range"
                        min="16"
                        max="32"
                        value={labelFontSize}
                        onChange={(event) => setLabelFontSize(Number(event.target.value))}
                      />
                    </label>
                  </section>

                  <section className="api-section">
                    <button
                      className="api-toggle"
                      onClick={() => setShowApiInput((value) => !value)}
                    >
                      🔑 {customApiKey ? "เปลี่ยน Gemini API Key" : "เชื่อมต่อ AI (API Key)"}
                    </button>

                    {showApiInput && (
                      <div className="api-input-box">
                        <strong>🔑 เชื่อมต่อ Gemini API Key ส่วนตัว:</strong>
                        <div className="input-row">
                          <input
                            type="password"
                            value={tempApiKey}
                            placeholder="วาง Gemini API Key..."
                            onChange={(event) => setTempApiKey(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleSaveApiKey();
                            }}
                          />
                          <button className="green-btn" onClick={handleSaveApiKey}>
                            บันทึก
                          </button>
                        </div>
                        {apiSaveStatus && <div className="success-text">✓ {apiSaveStatus}</div>}
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

const styles = `
  * { box-sizing: border-box; }
  
  html, body { 
    margin: 0; 
    padding: 0;
    width: 100vw;
    height: 100vh;
    font-family: "Sarabun", Arial, sans-serif; 
    overflow: hidden !important; /* ป้องกันแถบเลื่อนหน้าหลักเด็ดขาด */
  }
  
  button, input, select { font-family: inherit; }
  button { border: 0; cursor: pointer; }

  .app-page {
    height: 100vh;
    width: 100vw;
    padding: 16px 14px;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .app-shell {
    width: min(1280px, 100%);
    height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel {
    background: rgba(255,255,255,.96);
    border: 1px solid #dbe4ee;
    box-shadow: 0 5px 20px rgba(15,23,42,.09);
    border-radius: 16px;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    flex-wrap: wrap;
  }

  .view-buttons, .monitor-buttons, .input-row, .vowel-list, .background-colors {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .view-buttons strong { color: #1e293b; font-size: 15px; }

  .soft-btn, .selected-btn, .blue-btn, .green-btn, .danger-btn {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }

  .soft-btn { background: #f1f5f9; color: #475569; }
  .selected-btn, .blue-btn { background: #0284c7; color: white; }
  .green-btn { background: #16a34a; color: white; }
  .danger-btn { background: #ef4444; color: white; }
  .blue-btn:disabled { opacity: .6; cursor: wait; }

  .main-grid { 
    flex: 1;
    display: grid; 
    grid-template-columns: 1fr; 
    gap: 16px; 
    align-items: stretch;
    min-height: 0;
  }
  
  .main-grid.split-layout { grid-template-columns: minmax(0, 1fr) 410px; }

  .board-panel { padding: 30px 22px; min-width: 0; }
  .presentation-panel { padding: 45px 50px; }

  .tone-board { width: 100%; }
  .board-title { text-align: center; color: #ea580c; margin-bottom: 18px; }
  .board-title h2 { margin: 0; font-size: clamp(23px, 2.3vw, 30px); }
  .board-title div { font-size: clamp(16px, 1.5vw, 19px); font-weight: 600; }

  .analysis-box {
    margin: 0 auto 22px;
    padding: 10px 14px;
    max-width: 900px;
    text-align: center;
    border-radius: 10px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    color: #0369a1;
    font-size: 14px;
    font-weight: 600;
  }

  .analysis-box strong { color: #0284c7; }
  .analysis-tag {
    padding: 2px 7px;
    border-radius: 5px;
    background: #e0f2fe;
    color: #075985;
  }

  .tone-header, .tone-row {
    display: grid;
    grid-template-columns: 215px minmax(190px, 1fr) 100px;
    align-items: center;
  }

  .tone-header {
    color: #0284c7;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 3px;
  }

  .tone-header span { text-align: right; padding-right: 20px; }

  .tone-rows {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: 1vh;
    min-height: 0;
  }

  .tone-row {
    width: 100%;
    padding: 7px 0;
    background: transparent;
    text-align: inherit;
    border-radius: 12px;
    transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
  }

  .tone-row:not(.disabled-tone-row):hover { background: rgba(224,242,254,.45); }
  .tone-row.active {
    background: rgba(224,242,254,.78);
    box-shadow: 0 4px 14px rgba(2,132,199,.13);
    transform: scale(1.025);
  }

  .disabled-tone-row { cursor: default; opacity: .72; }

  .tone-name {
    text-align: right;
    padding-right: 20px;
    font-weight: 700;
    white-space: nowrap;
    transition: transform .18s ease;
  }

  .tone-row.active .tone-name { transform: scale(1.06); }
  .tone-name span { font-size: .92em; margin-left: 4px; }

  .tone-line-wrap {
    height: 34px;
    display: flex;
    align-items: center;
    position: relative;
    transition: transform .18s ease;
  }

  .tone-row.active .tone-line-wrap { transform: scaleY(1.25); }
  .tone-line {
    width: 100%;
    height: 2px;
    background: #94a3b8;
    transition: height .18s ease, background .18s ease;
  }

  .tone-row.active .tone-line {
    height: 4px;
    background: #475569;
  }

  .tone-circle {
    position: absolute;
    transform: translateX(-50%);
    padding: 0 10px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-weight: 700;
    box-shadow: 0 4px 11px rgba(0,0,0,.24);
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  }

  .tone-row.active .tone-circle {
    transform: translateX(-50%) scale(1.23);
    box-shadow: 0 8px 20px rgba(0,0,0,.34);
    filter: brightness(1.12);
  }

  .multi-circles {
    position: absolute;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform .18s ease;
  }

  .tone-row.active .multi-circles { transform: translateX(-50%) scale(1.16); }
  .tone-row.active .multi-circles .tone-circle { transform: none; }
  .slash { color: #64748b; font-size: 21px; font-weight: 700; }
  .fixed-tone-label { text-align: center; font-size: 16px; font-weight: 700; }

  .control-panel {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .control-panel h3 { margin: 0; color: #1e293b; font-size: 19px; }
  .control-group {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 10px;
    padding: 13px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    color: #1e293b;
    font-size: 13px;
  }

  .radio-label, .toggle-label {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #334155;
    cursor: pointer;
  }

  .input-row { flex-wrap: nowrap; }
  .input-row input {
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 10px;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
  }

  .input-row .input-error { border: 2px solid #ef4444; }
  .error-text { color: #dc2626; font-size: 12px; font-weight: 700; }
  .success-text { color: #059669; font-size: 12px; font-weight: 700; }

  .section-label {
    margin-bottom: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }

  .green-label { color: #166534; }
  .red-label { color: #991b1b; margin-top: 10px; }

  .consonant-grid {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    gap: 5px;
  }

  .consonant-btn {
    height: 34px;
    border: 1px solid #cbd5e1;
    background: white;
    border-radius: 6px;
    font-weight: 700;
    font-size: 15px;
  }

  .vowel-list { gap: 5px; }
  .vowel-btn {
    padding: 7px 9px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 14px;
  }

  .long-vowel { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
  .short-vowel { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

  .select-label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
  }

  .select-label select, .select-label input[type="range"] { width: 100%; }
  .select-label select {
    padding: 7px;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
  }

  .color-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .color-picker {
    min-height: 35px;
    border-radius: 8px;
    padding: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .color-picker input { position: absolute; opacity: 0; width: 0; height: 0; }

  .background-colors button {
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 11px;
    font-weight: 700;
  }

  .background-colors .background-selected { outline: 2px solid #0284c7; }

  .upload-btn {
    display: inline-flex;
    width: fit-content;
    padding: 7px 9px;
    color: white;
    background: #0284c7;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .upload-btn input { display: none; }
  .api-section { border-top: 1px solid #e2e8f0; padding-top: 12px; }
  .api-toggle {
    width: 100%;
    padding: 9px;
    border-radius: 8px;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    font-weight: 700;
  }

  .api-input-box {
    margin-top: 8px;
    padding: 10px;
    border: 1px dashed #94a3b8;
    border-radius: 8px;
    background: #f8fafc;
    font-size: 12px;
    color: #475569;
  }

  .api-input-box strong { display: block; margin-bottom: 7px; }

  .display-page {
    height: 100vh;
    width: 100vw;
    padding: 2vh 2vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    box-sizing: border-box;
  }

  .display-board {
    width: 100%;
    max-width: 1200px;
    height: 100%;
    max-height: 94vh;
    padding: clamp(15px, 3vh, 44px);
    border-radius: clamp(16px, 2vw, 28px);
    background: rgba(255,255,255,.96);
    border: 1px solid #cbd5e1;
    box-shadow: 0 16px 42px rgba(0,0,0,.18);
    display: flex;
    flex-direction: column;
  }

  .display-board .tone-rows {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: 0;
    margin-top: 2vh;
  }

  .display-tip {
    position: fixed;
    bottom: 13px;
    left: 50%;
    transform: translateX(-50%);
    padding: 7px 13px;
    border-radius: 999px;
    color: white;
    background: rgba(15,23,42,.72);
    font-size: 12px;
    white-space: nowrap;
  }

  @media (max-width: 980px) {
    .main-grid.split-layout { grid-template-columns: 1fr; }
    .control-panel { position: static; max-height: none; }
  }

  @media (max-width: 640px) {
    .app-page { padding: 10px; }
    .top-bar { padding: 12px; }
    .board-panel, .presentation-panel { padding: 22px 10px; }
    .tone-header, .tone-row { grid-template-columns: 112px minmax(125px, 1fr) 52px; }
    .tone-header span, .tone-name { padding-right: 8px; }
    .tone-name { font-size: 13px !important; white-space: normal; }
    .fixed-tone-label { font-size: 12px; }
    .tone-rows { gap: 20px; }
    .tone-circle { padding: 0 7px; min-width: 39px !important; height: 39px !important; font-size: 15px !important; }
    .multi-circles { gap: 4px; }
    .slash { font-size: 16px; }
    .consonant-grid { gap: 3px; }
    .consonant-btn { height: 31px; font-size: 13px; }
    .display-board { width: 98vw; padding: 14px 8px; }
    .display-board .analysis-box { font-size: 11px; margin-bottom: 12px; }
    .display-board .tone-header, .display-board .tone-row { grid-template-columns: 104px minmax(100px, 1fr) 48px; }
    .display-tip { font-size: 10px; max-width: 92vw; white-space: normal; text-align: center; }
  }

  /* ========================================= */
  /* วาดก้านและธงเขบ็ตชั้นเดียว (Eighth Note)  */
  /* ========================================= */
  .tone-circle::before {
    content: "";
    position: absolute;
    right: 0px; 
    bottom: 50%;
    width: 4px; 
    height: 42px; 
    background-color: var(--note-color, transparent);
    z-index: -1;
  }

  .tone-circle::after {
    content: "";
    position: absolute;
    right: -12px; 
    bottom: calc(50% + 18px); 
    width: 12px; 
    height: 20px; 
    border-right: 4px solid var(--note-color, transparent);
    border-top: 6px solid var(--note-color, transparent);
    border-top-right-radius: 20px 22px; 
    border-bottom-right-radius: 4px;
    z-index: -1;
  }
`;