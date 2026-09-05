import React, { useEffect, useMemo, useRef, useState } from "react";

const apiKey = "";
const CHANNEL_NAME = "thai_tone_sync_channel";
const STORAGE_KEY = "thai_tone_live_sync_data";

// Regex สำหรับตรวจสอบภาษาไทยเท่านั้น
const THAI_WORD_PATTERN = /^[\u0E00-\u0E7F]+$/;

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

// คอมโพเนนต์ Custom Radio
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
  // บังคับจัดเรียง: สระบน/ล่าง ต้องมาก่อนวรรณยุกต์เสมอ และรวมอักขระให้อยู่ในฟอร์มมาตรฐาน
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
  staffBgColor = "#ffffff"
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
    <div className={`tone-board ${isDisplay ? "display-board" : ""}`} style={isDisplay ? { backgroundColor: staffBgColor } : {}}>
      <div className="board-title">
        <h2>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>
        <div>และการผันวรรณยุกต์</div>
      </div>

      {inputText && analysisInfo?.desc && (
        <div className="analysis-box">
          📌 ผลวิเคราะห์หลักภาษา: <strong>"{inputText}"</strong> เป็น{" "}
          <span className="analysis-tag">
            {analysisInfo.type} ({analysisInfo.vowelLen})
          </span>{" "}
          — {analysisInfo.desc}
        </div>
      )}

      <div className="tone-header">
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

  const [customApiKey, setCustomApiKey] = useState(
    () => localStorage.getItem("gemini_api_key") || "",
  );
  const [tempApiKey, setTempApiKey] = useState(
    () => localStorage.getItem("gemini_api_key") || "",
  );
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
    if (!speechEnabled || !text || !("speechSynthesis" in window)) return;

    // เคลียร์ลำดับอักขระอีกชั้นก่อนส่งให้ TTS เพื่อป้องกันการอ่านสะกดคำ
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

    if (!THAI_WORD_PATTERN.test(value)) {
      setInputError("กรุณากรอกด้วยอักษรไทยเท่านั้น");
      return false;
    }

    if (value.length > 8) {
      setInputError("กรุณากรอกไม่เกิน 1 พยางค์");
      return false;
    }

    setInputError("");
    return true;
  };

  const handleGenerate = async () => {
    const word = inputText.trim();
    if (!validateInput(word)) return;

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
      const jsonText = rawText.replace(/```json|