import React, { useEffect, useMemo, useState } from "react";

const CHANNEL_NAME = "thai_tone_sync_channel";
const STORAGE_KEY = "thai_tone_sync_data";

/* =========================================================
   ข้อมูลพยัญชนะ
========================================================= */

const midConsonants = ["ก", "จ", "ฎ", "ฏ", "ด", "ต", "บ", "ป", "อ"];
const highConsonants = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
const lowSingleConsonants = ["ง", "ญ", "ณ", "น", "ม", "ย", "ร", "ล", "ฬ", "ว"];

const quickConsonants = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ",
];

/*
  กล่องคำควบกล้ำและอักษรนำ
  ผู้ใช้สามารถกดปุ่มเพื่อใช้เป็นพยัญชนะต้นได้โดยตรง
*/
const consonantClusterGroups = [
  {
    title: "คำควบกล้ำแท้",
    icon: "🔗",
    color: "#7c3aed",
    description:
      "พยัญชนะต้น 2 ตัวออกเสียงควบกัน โดยออกเสียงพยัญชนะตัวหลังด้วย เช่น กราบ, กล้า, ขวาน, ปลาย, พราน",
    note:
      "คำควบกล้ำแท้ที่ใช้บ่อย ตัวหลังมักเป็น ร ล หรือ ว",
    items: [
      "กร", "กล", "กว",
      "ขร", "ขล", "ขว",
      "คร", "คล", "คว",
      "ตร",
      "ปร", "ปล",
      "พร", "พล",
      "ฟร",
    ],
  },
  {
    title: "คำควบกล้ำไม่แท้",
    icon: "📖",
    color: "#db2777",
    description:
      "เขียนพยัญชนะต้นควบกัน แต่เวลาอ่านจะไม่ออกเสียง ร ควบ เช่น จริง, สร้าง, ศรี หรือ ทร ที่บางคำออกเสียงเป็น ซ",
    note:
      "ตัวอย่าง: จริง อ่านว่า จิง, สร้าง อ่านว่า ส้าง, ทราย อ่านว่า ซาย",
    items: ["จร", "ซร", "ศร", "สร", "ทร"],
  },
  {
    title: "อักษรต่ำ ห นำ",
    icon: "🔤",
    color: "#ea580c",
    description:
      "ห นำหน้าอักษรต่ำเดี่ยว โดย ห ไม่ออกเสียงแยก แต่ช่วยยกระดับการผันวรรณยุกต์ให้มีลักษณะคล้ายอักษรสูง",
    note:
      "ใช้กับ ง ญ น ม ย ร ล ว เช่น หนา, หมอ, หย่า, หรู, หลา, หวาน",
    items: ["หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว"],
  },
];

const thaiClusters = [
  "กร", "กล", "กว",
  "ขร", "ขล", "ขว",
  "คร", "คล", "คว",
  "ตร",
  "ปร", "ปล",
  "พร", "พล",
  "ฟร",
  "จร", "ซร", "ศร", "สร", "ทร",
  "หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว",
];

const longVowels = [
  { label: "◌า", front: "", above: "", rear: "า" },
  { label: "◌ี", front: "", above: "ี", rear: "" },
  { label: "◌ือ", front: "", above: "ื", rear: "อ" },
  { label: "◌ู", front: "", above: "ู", rear: "" },
  { label: "เ◌", front: "เ", above: "", rear: "" },
  { label: "แ◌", front: "แ", above: "", rear: "" },
  { label: "โ◌", front: "โ", above: "", rear: "" },
  { label: "◌อ", front: "", above: "", rear: "อ" },
  { label: "เ◌อ", front: "เ", above: "", rear: "อ" },
  { label: "เ◌ีย", front: "เ", above: "ี", rear: "ย" },
  { label: "เ◌ือ", front: "เ", above: "ื", rear: "อ" },
  { label: "◌ัว", front: "", above: "ั", rear: "ว" },
  { label: "◌ำ", front: "", above: "ำ", rear: "" },
  { label: "ใ◌", front: "ใ", above: "", rear: "" },
  { label: "ไ◌", front: "ไ", above: "", rear: "" },
  { label: "เ◌า", front: "เ", above: "", rear: "า" },
];

const shortVowels = [
  { label: "◌ะ", front: "", above: "", rear: "ะ" },
  { label: "◌ิ", front: "", above: "ิ", rear: "" },
  { label: "◌ึ", front: "", above: "ึ", rear: "" },
  { label: "◌ุ", front: "", above: "ุ", rear: "" },
  { label: "เ◌ะ", front: "เ", above: "", rear: "ะ" },
  { label: "แ◌ะ", front: "แ", above: "", rear: "ะ" },
  { label: "โ◌ะ", front: "โ", above: "", rear: "ะ" },
  { label: "เ◌าะ", front: "เ", above: "", rear: "าะ" },
  { label: "เ◌อะ", front: "เ", above: "", rear: "อะ" },
  { label: "เ◌ียะ", front: "เ", above: "ี", rear: "ยะ" },
  { label: "เ◌ือะ", front: "เ", above: "ื", rear: "อะ" },
  { label: "◌ัวะ", front: "", above: "ั", rear: "วะ" },
];

const toneRows = [
  { id: 5, tone: "เสียงจัตวา", mark: "◌๋", leftPos: "82%" },
  { id: 4, tone: "เสียงตรี", mark: "◌๊", leftPos: "68%" },
  { id: 3, tone: "เสียงโท", mark: "◌้", leftPos: "54%" },
  { id: 2, tone: "เสียงเอก", mark: "◌่", leftPos: "40%" },
  { id: 1, tone: "เสียงสามัญ", mark: "-", leftPos: "27%" },
];

const pairMap = {
  ค: "ข",
  ฅ: "ฃ",
  ฆ: "ข",
  ข: "ค",
  ฃ: "ฅ",
  ช: "ฉ",
  ฌ: "ฉ",
  ฉ: "ช",
  ซ: "ศ",
  ศ: "ซ",
  ษ: "ซ",
  ส: "ซ",
  ท: "ถ",
  ธ: "ถ",
  ฑ: "ฐ",
  ฒ: "ฐ",
  ถ: "ท",
  ฐ: "ท",
  พ: "ผ",
  ภ: "ผ",
  ผ: "พ",
  ฟ: "ฝ",
  ฝ: "ฟ",
  ฮ: "ห",
  ห: "ฮ",
};

/* =========================================================
   ฟังก์ชันจัดการข้อความภาษาไทย
========================================================= */

const toneMarks = ["่", "้", "๊", "๋"];
const aboveBelowVowelChars = ["ั", "็", "ิ", "ี", "ึ", "ื", "ุ", "ู", "ํ", "์"];

/*
  ลบวรรณยุกต์เดิมก่อนสร้างคำใหม่
  ป้องกันกรณี เช่น มื้อ แล้วไปกดผันใหม่จนเกิด มื้้อ
*/
function removeToneMarks(text = "") {
  return text.replace(/[่้๊๋]/g, "");
}

/*
  แยกคำออกเป็น:
  - สระหน้า
  - พยัญชนะต้น
  - สระบน/ล่าง
  - วรรณยุกต์
  - ส่วนท้าย เช่น อ, า, ย, ว
*/
function parseThaiWord(word = "") {
  let work = word.trim();

  if (!work) {
    return {
      frontVowel: "",
      initial: "",
      aboveBelowVowel: "",
      toneMark: "",
      rest: "",
    };
  }

  let frontVowel = "";

  if (["เ", "แ", "โ", "ใ", "ไ"].includes(work[0])) {
    frontVowel = work[0];
    work = work.slice(1);
  }

  let initial = "";

  if (work.length >= 2 && thaiClusters.includes(work.slice(0, 2))) {
    initial = work.slice(0, 2);
    work = work.slice(2);
  } else if (work.length > 0) {
    initial = work[0];
    work = work.slice(1);
  }

  let aboveBelowVowel = "";
  let toneMark = "";
  let rest = "";

  for (const char of work) {
    if (toneMarks.includes(char)) {
      toneMark = char;
    } else if (aboveBelowVowelChars.includes(char)) {
      aboveBelowVowel += char;
    } else {
      rest += char;
    }
  }

  return {
    frontVowel,
    initial,
    aboveBelowVowel,
    toneMark,
    rest,
  };
}

/*
  เรียงอักขระภาษาไทยให้เหมาะสม:
  สระหน้า + พยัญชนะต้น + สระบน/ล่าง + วรรณยุกต์ + ส่วนท้าย

  ตัวอย่าง:
  มือ  = ม + ื + อ
  มื้อ = ม + ื + ้ + อ
*/
function buildWord(frontVowel, initial, aboveBelowVowel, toneMark, rest) {
  const cleanFront = removeToneMarks(frontVowel || "");
  const cleanInitial = removeToneMarks(initial || "");
  const cleanAbove = removeToneMarks(aboveBelowVowel || "");
  const cleanRest = removeToneMarks(rest || "");
  const cleanTone = toneMarks.includes(toneMark) ? toneMark : "";

  return `${cleanFront}${cleanInitial}${cleanAbove}${cleanTone}${cleanRest}`;
}

function changeInitial(initial, nextFirstConsonant) {
  if (!initial) return nextFirstConsonant;
  return `${nextFirstConsonant}${initial.slice(1)}`;
}

function getInitialType(initial = "") {
  if (!initial) return "none";

  if (initial.startsWith("ห") && initial.length > 1) {
    return "high-leading";
  }

  const first = initial[0];

  if (midConsonants.includes(first)) return "mid";
  if (highConsonants.includes(first)) return "high";
  return "low";
}

function getPairedHighInitial(initial = "") {
  if (!initial) return "";

  const first = initial[0];

  if (initial.startsWith("ห") && initial.length > 1) {
    return initial;
  }

  if (pairMap[first]) {
    return changeInitial(initial, pairMap[first]);
  }

  return `ห${initial}`;
}

function getPairedLowInitial(initial = "") {
  if (!initial) return "";

  const first = initial[0];

  if (pairMap[first]) {
    return changeInitial(initial, pairMap[first]);
  }

  return initial;
}

/* =========================================================
   วิเคราะห์คำเป็น / คำตาย
========================================================= */

function analyzeSyllable(word, mode = "full5") {
  const parsed = parseThaiWord(word);
  const { initial, frontVowel, aboveBelowVowel, rest } = parsed;

  const mainConsonant = initial?.[0] || "";

  const shortVowelIndicators = ["ะ", "ิ", "ึ", "ุ"];
  const deadFinals = [
    "ก", "ข", "ค", "ฆ",
    "จ", "ช", "ซ", "ศ", "ษ", "ส",
    "ด", "ฎ", "ฏ", "ต", "ถ", "ท", "ธ", "ฐ", "ฑ", "ฒ",
    "บ", "ป", "พ", "ฟ", "ภ",
  ];

  const combined = `${frontVowel}${aboveBelowVowel}${rest}`;
  const lastChar = rest.slice(-1);

  const isShort =
    shortVowelIndicators.some((char) => combined.includes(char)) ||
    combined.includes("ะ") ||
    (frontVowel === "เ" && rest.includes("ะ"));

  const noFinalConsonant =
    !lastChar ||
    ["ะ", "า", "อ", "ย", "ว"].includes(lastChar) ||
    aboveBelowVowel.includes("ิ") ||
    aboveBelowVowel.includes("ี") ||
    aboveBelowVowel.includes("ึ") ||
    aboveBelowVowel.includes("ื") ||
    aboveBelowVowel.includes("ุ") ||
    aboveBelowVowel.includes("ู");

  const isDead = deadFinals.includes(lastChar) || (isShort && noFinalConsonant);

  const type = isDead ? "คำตาย" : "คำเป็น";
  const vowelLength = isShort ? "สระเสียงสั้น" : "สระเสียงยาว";
  const initialType = getInitialType(initial);

  let consonantLabel = "ไม่พบพยัญชนะต้น";

  if (initialType === "mid") consonantLabel = "อักษรกลาง";
  if (initialType === "high") consonantLabel = "อักษรสูง";
  if (initialType === "low") consonantLabel = "อักษรต่ำ";
  if (initialType === "high-leading") consonantLabel = "อักษรต่ำ ห นำ";

  if (initial.length > 1 && !initial.startsWith("ห")) {
    consonantLabel += ` (คำควบกล้ำ “${initial}”)`;
  }

  let detail = "";

  if (initialType === "mid") {
    detail = isDead
      ? "อักษรกลางคำตาย เสียงสามัญจะไม่ปรากฏ"
      : "อักษรกลางคำเป็น สามารถผันได้ครบทั้ง 5 เสียง";
  } else if (initialType === "high" || initialType === "high-leading") {
    detail = isDead
      ? "อักษรสูงหรือ ห นำ คำตาย ผันได้จำกัดตามกฎคำตาย"
      : "อักษรสูงหรือ ห นำ คำเป็น ใช้ผันเสียงเอก โท และจัตวา";
  } else if (initialType === "low") {
    detail =
      mode === "full5"
        ? "อักษรต่ำคำเป็น ใช้อักษรคู่หรือ ห นำ ช่วยให้แสดงการผันครบ 5 เสียง"
        : "อักษรต่ำคำเป็น ผันพื้นฐานได้เสียงสามัญ โท และตรี";
  }

  return {
    ...parsed,
    mainConsonant,
    initialType,
    consonantLabel,
    type,
    vowelLength,
    isShort,
    isDead,
    detail,
  };
}

/* =========================================================
   คำนวณคำสำหรับแต่ละระดับเสียง
========================================================= */

function calculateTones(word, mode, colorMid, colorHigh, colorLow) {
  const emptyRows = toneRows.map((row) => ({
    ...row,
    show: false,
    word: "",
    color: "#94a3b8",
    isMulti: false,
    multi: [],
  }));

  if (!word.trim()) return emptyRows;

  const info = analyzeSyllable(word, mode);
  const {
    initial,
    frontVowel,
    aboveBelowVowel,
    rest,
    initialType,
    isDead,
    isShort,
  } = info;

  const make = (nextInitial = initial, mark = "") =>
    buildWord(frontVowel, nextInitial, aboveBelowVowel, mark, rest);

  const singleRow = (id, text, color, show = true) => ({
    ...toneRows.find((item) => item.id === id),
    word: text || "",
    color,
    show: Boolean(show && text),
    isMulti: false,
    multi: [],
  });

  const pairRow = (id, words = []) => ({
    ...toneRows.find((item) => item.id === id),
    word: "",
    color: words[0]?.color || "#94a3b8",
    show: words.length > 0,
    isMulti: true,
    multi: words,
  });

  /* อักษรกลาง */
  if (initialType === "mid") {
    if (mode === "highOnly") {
      return [
        singleRow(5, make(initial, "๋"), colorMid),
        singleRow(4, "", colorMid, false),
        singleRow(3, make(initial, "้"), colorMid),
        singleRow(2, make(initial, "่"), colorMid),
        singleRow(1, "", colorMid, false),
      ];
    }

    if (mode === "lowOnly") {
      return [
        singleRow(5, "", colorMid, false),
        singleRow(4, make(initial, "๊"), colorMid),
        singleRow(3, make(initial, "้"), colorMid),
        singleRow(2, "", colorMid, false),
        singleRow(1, isDead ? "" : make(initial), colorMid, !isDead),
      ];
    }

    return [
      singleRow(5, make(initial, "๋"), colorMid),
      singleRow(4, make(initial, "๊"), colorMid),
      singleRow(3, make(initial, "้"), colorMid),
      singleRow(2, make(initial, "่"), colorMid),
      singleRow(1, isDead ? "" : make(initial), colorMid, !isDead),
    ];
  }

  /*
    อักษรสูง หรือ ห นำ:
    - จัตวา: ไม่ใส่วรรณยุกต์
    - โท: ไม้โท
    - เอก: ไม้เอก
  */
  if (initialType === "high" || initialType === "high-leading") {
    if (mode === "lowOnly") {
      return [
        singleRow(5, "", colorHigh, false),
        singleRow(4, "", colorHigh, false),
        singleRow(3, make(initial, "้"), colorHigh),
        singleRow(2, make(initial, "่"), colorHigh),
        singleRow(1, "", colorHigh, false),
      ];
    }

    return [
      singleRow(5, isDead ? "" : make(initial), colorHigh, !isDead),
      singleRow(4, "", colorHigh, false),
      singleRow(3, make(initial, "้"), colorHigh),
      singleRow(2, make(initial, "่"), colorHigh),
      singleRow(1, "", colorHigh, false),
    ];
  }

  /*
    อักษรต่ำ:
    ใช้อักษรคู่หรือ ห นำ เพื่อแสดงรูปผัน 5 เสียง
    ตัวอย่าง มือ:
    - จัตวา: หมือ
    - ตรี: มื้อ
    - โท: มื่อ / หมื้อ
    - เอก: หมื่อ
    - สามัญ: มือ
  */
  const highInitial = getPairedHighInitial(initial);
  const lowInitial = getPairedLowInitial(initial);

  if (mode === "highOnly") {
    return [
      singleRow(5, isDead ? "" : make(highInitial), colorHigh, !isDead),
      singleRow(4, "", colorHigh, false),
      singleRow(3, make(highInitial, "้"), colorHigh),
      singleRow(2, make(highInitial, "่"), colorHigh),
      singleRow(1, "", colorHigh, false),
    ];
  }

  if (mode === "lowOnly") {
    return [
      singleRow(5, "", colorLow, false),
      singleRow(4, make(lowInitial, "้"), colorLow),
      singleRow(
        3,
        isDead && !isShort ? make(lowInitial) : make(lowInitial, "่"),
        colorLow,
      ),
      singleRow(2, "", colorLow, false),
      singleRow(1, isDead ? "" : make(lowInitial), colorLow, !isDead),
    ];
  }

  return [
    singleRow(5, isDead ? "" : make(highInitial), colorHigh, !isDead),
    singleRow(4, make(lowInitial, "้"), colorLow),
    pairRow(3, [
      {
        text: isDead && !isShort ? make(lowInitial) : make(lowInitial, "่"),
        color: colorLow,
      },
      {
        text: make(highInitial, "้"),
        color: colorHigh,
      },
    ]),
    singleRow(2, make(highInitial, "่"), colorHigh),
    singleRow(1, isDead ? "" : make(lowInitial), colorLow, !isDead),
  ];
}

function getSpeechText(item) {
  if (!item?.show) return "";

  if (item.isMulti) {
    return item.multi.map((word) => word.text).join(" หรือ ");
  }

  return item.word;
}

/* =========================================================
   วงกลมคำพร้อมหางเขบ็ต
========================================================= */

function ToneCircle({
  text,
  color,
  textColor,
  isMulti = false,
}) {
  return (
    <div
      className={`tone-circle ${isMulti ? "multi-tone-circle" : ""}`}
      style={{
        backgroundColor: color,
        color: textColor,
      }}
    >
      <svg
        className="note-tail"
        viewBox="0 0 22 54"
        aria-hidden="true"
      >
        <path
          d="M 3 52 L 3 3"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 4 3 C 13 8, 21 16, 16 28 C 12 20, 8 13, 4 9 Z"
          fill="currentColor"
        />
      </svg>

      <span>{text}</span>
    </div>
  );
}

/* =========================================================
   กระดานแสดงผล
========================================================= */

function Board({
  linesData,
  inputText,
  analysisInfo,
  activeRowId,
  onRowClick,
  circleTextColor,
  isDisplay = false,
}) {
  const fixedToneLabels = {
    5: { text: "เสียงสูง", color: "#ef4444" },
    3: { text: "เสียงกลาง", color: "#22c55e" },
    1: { text: "เสียงต่ำ", color: "#0284c7" },
  };

  return (
    <div className={`tone-board ${isDisplay ? "display-tone-board" : ""}`}>
      <div className="board-title">
        <h1>ไตรยางศ์ หรือ อักษร 3 หมู่</h1>
        <p>และการผันวรรณยุกต์</p>
      </div>

      {inputText && (
        <div className="analysis-box">
          <strong>📌 ผลวิเคราะห์หลักภาษา:</strong>{" "}
          <span className="analysis-word">“{inputText}”</span>{" "}
          เป็น{" "}
          <span className="analysis-tag">
            {analysisInfo.type} ({analysisInfo.vowelLength})
          </span>
          <br />
          <span className="analysis-detail">
            {analysisInfo.consonantLabel} — {analysisInfo.detail}
          </span>
        </div>
      )}

      {inputText && (
        <div className="thai-guide-box">
          <strong>📚 หลักการผันวรรณยุกต์ที่ควรรู้</strong>

          <div className="thai-guide-grid">
            <div>
              <b>อักษรกลาง</b>
              <span>คำเป็นผันได้ครบ 5 เสียง ส่วนคำตายจะไม่มีเสียงสามัญ</span>
            </div>

            <div>
              <b>อักษรสูง</b>
              <span>คำเป็นใช้ผันเสียงเอก โท และจัตวาได้</span>
            </div>

            <div>
              <b>อักษรต่ำ</b>
              <span>คำเป็นผันพื้นฐานได้สามัญ โท ตรี และใช้ ห นำหรืออักษรคู่ช่วยผันเสียงอื่น</span>
            </div>

            <div>
              <b>คำเป็น</b>
              <span>มักมีสระยาว หรือสะกดด้วยแม่กง แม่กน แม่กม แม่เกย และแม่เกอว</span>
            </div>

            <div>
              <b>คำตาย</b>
              <span>มักเป็นสระสั้นไม่มีตัวสะกด หรือสะกดด้วยแม่กก แม่กด และแม่กบ</span>
            </div>

            <div>
              <b>ตำแหน่งวรรณยุกต์</b>
              <span>ต้องเรียงหลังสระบนหรือล่าง เช่น มือ → มื้อ และ มี → มี่</span>
            </div>
          </div>

          <div className="thai-guide-note">
            💡 โปรแกรมเหมาะสำหรับฝึกคำพยางค์เดียว คำควบกล้ำ และ ห นำ
            สำหรับคำหลายพยางค์หรือคำยกเว้น ควรตรวจสอบกับพจนานุกรมเพิ่มเติม
          </div>
        </div>
      )}

      <div className="tone-header">
        <span>รูปวรรณยุกต์</span>
      </div>

      <div className="tone-rows">
        {linesData.map((item) => {
          const active = activeRowId === item.id;
          const fixedLabel = fixedToneLabels[item.id];
          const rowColor = item.isMulti
            ? item.multi[0]?.color || "#94a3b8"
            : item.color;

          return (
            <button
              type="button"
              key={item.id}
              className={`tone-row ${active ? "active" : ""} ${!item.show ? "empty-tone-row" : ""}`}
              onClick={() => item.show && onRowClick(item)}
              title={item.show ? `คลิกเพื่อขยายและอ่าน “${getSpeechText(item)}”` : ""}
            >
              <div className="tone-name" style={{ color: rowColor }}>
                {item.tone} <span>[ {item.mark} ]</span>
              </div>

              <div className="tone-line-wrap">
                <div className="tone-line" />

                {item.show && !item.isMulti && (
                  <div
                    className="circle-position"
                    style={{ left: item.leftPos }}
                  >
                    <ToneCircle
                      text={item.word}
                      color={item.color}
                      textColor={circleTextColor}
                    />
                  </div>
                )}

                {item.show && item.isMulti && (
                  <div
                    className="multi-circles-position"
                    style={{ left: item.leftPos }}
                  >
                    {item.multi.map((circle, index) => (
                      <React.Fragment key={`${circle.text}-${index}`}>
                        {index > 0 && <span className="slash">/</span>}

                        <ToneCircle
                          text={circle.text}
                          color={circle.color}
                          textColor={circleTextColor}
                          isMulti
                        />
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="fixed-tone-label"
                style={{ color: fixedLabel?.color || "transparent" }}
              >
                {fixedLabel?.text || ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   แอปหลัก
========================================================= */

export default function App() {
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);

  const [mode, setMode] = useState("full5");
  const [viewLayout, setViewLayout] = useState("split");

  const [inputText, setInputText] = useState("มือ");
  const [inputError, setInputError] = useState("");

  const [colorMid, setColorMid] = useState("#22c55e");
  const [colorHigh, setColorHigh] = useState("#ef4444");
  const [colorLow, setColorLow] = useState("#0284c7");
  const [circleTextColor, setCircleTextColor] = useState("#ffffff");

  const [activeRowId, setActiveRowId] = useState(null);

  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");

  const [bgColor, setBgColor] = useState("#e2e8f0");
  const [bgImage, setBgImage] = useState("");
  const [bgType, setBgType] = useState("color");

  const analysisInfo = useMemo(
    () => analyzeSyllable(inputText, mode),
    [inputText, mode],
  );

  const linesData = useMemo(
    () => calculateTones(inputText, mode, colorMid, colorHigh, colorLow),
    [inputText, mode, colorMid, colorHigh, colorLow],
  );

  const backgroundStyle = useMemo(() => {
    if (bgType === "image" && bgImage) {
      return {
        backgroundImage: `linear-gradient(rgba(226,232,240,.58), rgba(226,232,240,.58)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return { backgroundColor: bgColor };
  }, [bgType, bgColor, bgImage]);

  function speak(text) {
    if (!speechEnabled || !text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = Number(speechRate);
    utterance.pitch = 1;

    const selectedVoice = voices.find(
      (voice) => voice.voiceURI === selectedVoiceURI,
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  function handleRowClick(item) {
    setActiveRowId((oldId) => (oldId === item.id ? null : item.id));
    speak(getSpeechText(item));
  }

  function validateInput(value) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setInputError("กรุณากรอกคำศัพท์อย่างน้อย 1 คำ");
      return false;
    }

    if (cleanValue.includes(" ")) {
      setInputError("กรุณากรอกคำหรือพยางค์เดียว โดยไม่เว้นวรรค");
      return false;
    }

    if (cleanValue.length > 12) {
      setInputError("คำยาวเกินไป กรุณาใช้คำพยางค์เดียว");
      return false;
    }

    setInputError("");
    return true;
  }

  function handleGenerate() {
    if (!validateInput(inputText)) return;
    setActiveRowId(null);
  }

  /*
    เมื่อกดพยัญชนะเดี่ยว / คำควบกล้ำ / ห นำ
    ระบบจะเปลี่ยนเฉพาะพยัญชนะต้น และคงสระเดิมไว้
  */
  function handleQuickConsonantClick(consonant) {
    const parsed = parseThaiWord(inputText);

    const front = parsed.frontVowel || "";
    const above = parsed.aboveBelowVowel || "";
    const rear = parsed.rest || "อ";

    setInputText(buildWord(front, consonant, above, "", rear));
    setInputError("");
    setActiveRowId(null);
  }

  function handleQuickVowelClick(vowel) {
    const parsed = parseThaiWord(inputText);
    const initial = parsed.initial || "ก";

    setInputText(
      buildWord(
        vowel.front,
        initial,
        vowel.above,
        "",
        vowel.rear,
      ),
    );

    setInputError("");
    setActiveRowId(null);
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setBgImage(reader.result);
      setBgType("image");
    };

    reader.readAsDataURL(file);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function openSecondScreen() {
    const baseUrl = window.location.href.split("?")[0];

    window.open(
      `${baseUrl}?view=display`,
      "ThaiToneDisplay",
      "width=1280,height=860,resizable=yes,scrollbars=yes",
    );
  }

  function sendDisplayEvent(type) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type });
    channel.close();
  }

  const syncData = useMemo(
    () => ({
      type: "SYNC",
      inputText,
      mode,
      colorMid,
      colorHigh,
      colorLow,
      circleTextColor,
      activeRowId,
      speechEnabled,
      speechRate,
      selectedVoiceURI,
      bgColor,
      bgImage,
      bgType,
    }),
    [
      inputText,
      mode,
      colorMid,
      colorHigh,
      colorLow,
      circleTextColor,
      activeRowId,
      speechEnabled,
      speechRate,
      selectedVoiceURI,
      bgColor,
      bgImage,
      bgType,
    ],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const display = params.get("view") === "display";

    setIsDisplayWindow(display);

    if (display) {
      document.body.style.margin = "0";
      document.body.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    function loadVoices() {
      const allVoices = window.speechSynthesis
        .getVoices()
        .sort(
          (a, b) =>
            Number(b.lang.toLowerCase().startsWith("th")) -
            Number(a.lang.toLowerCase().startsWith("th")),
        );

      setVoices(allVoices);

      if (!selectedVoiceURI) {
        const thaiVoice = allVoices.find((voice) =>
          voice.lang.toLowerCase().startsWith("th"),
        );

        if (thaiVoice) {
          setSelectedVoiceURI(thaiVoice.voiceURI);
        }
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (isDisplayWindow) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(syncData));
    channel.postMessage(syncData);

    const handleMessage = (event) => {
      if (event.data?.type === "REQUEST_SYNC") {
        channel.postMessage(syncData);
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [syncData, isDisplayWindow]);

  useEffect(() => {
    if (!isDisplayWindow) return;

    function applyData(data) {
      if (!data) return;

      if (typeof data.inputText === "string") setInputText(data.inputText);
      if (data.mode) setMode(data.mode);
      if (data.colorMid) setColorMid(data.colorMid);
      if (data.colorHigh) setColorHigh(data.colorHigh);
      if (data.colorLow) setColorLow(data.colorLow);
      if (data.circleTextColor) setCircleTextColor(data.circleTextColor);
      if (data.activeRowId !== undefined) setActiveRowId(data.activeRowId);
      if (data.speechEnabled !== undefined) setSpeechEnabled(data.speechEnabled);
      if (data.speechRate) setSpeechRate(data.speechRate);
      if (data.selectedVoiceURI !== undefined) {
        setSelectedVoiceURI(data.selectedVoiceURI);
      }
      if (data.bgColor) setBgColor(data.bgColor);
      if (data.bgImage !== undefined) setBgImage(data.bgImage);
      if (data.bgType) setBgType(data.bgType);
    }

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) applyData(JSON.parse(savedData));
    } catch {
      // ไม่ต้องทำอะไร หากข้อมูลใน localStorage ไม่สมบูรณ์
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    const handleMessage = (event) => {
      if (event.data?.type === "SYNC") {
        applyData(event.data);
      }

      if (event.data?.type === "FULLSCREEN") {
        toggleFullscreen();
      }
    };

    channel.addEventListener("message", handleMessage);
    channel.postMessage({ type: "REQUEST_SYNC" });

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [isDisplayWindow]);

  if (isDisplayWindow) {
    return (
      <>
        <style>{styles}</style>

        <main
          className="display-page"
          style={backgroundStyle}
          onDoubleClick={toggleFullscreen}
        >
          <div className="display-card">
            <Board
              linesData={linesData}
              inputText={inputText}
              analysisInfo={analysisInfo}
              activeRowId={activeRowId}
              onRowClick={handleRowClick}
              circleTextColor={circleTextColor}
              isDisplay
            />
          </div>

          <div className="display-tip">
            ดับเบิลคลิกพื้นที่ว่างเพื่อสลับเต็มจอ • คลิกแถวเพื่อขยายและอ่านออกเสียง
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="app-page" style={backgroundStyle}>
        <div className="app-shell">
          <section className="top-bar panel">
            <div className="view-buttons">
              <strong>🖥️ มุมมอง:</strong>

              <button
                className={viewLayout === "standard" ? "selected-btn" : "soft-btn"}
                onClick={() => setViewLayout("standard")}
              >
                ชิดเดียว
              </button>

              <button
                className={viewLayout === "split" ? "selected-btn" : "soft-btn"}
                onClick={() => setViewLayout("split")}
              >
                แบ่ง 2 จอ
              </button>

              <button
                className={viewLayout === "preview" ? "selected-btn" : "soft-btn"}
                onClick={() => setViewLayout("preview")}
              >
                โหมดพรีวิว
              </button>
            </div>

            <div className="monitor-buttons">
              <button
                className="blue-btn"
                onClick={() => sendDisplayEvent("FULLSCREEN")}
              >
                ⛶ สลับเต็มจอ จอที่ 2
              </button>

              <button className="green-btn" onClick={openSecondScreen}>
                🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
              </button>
            </div>
          </section>

          <div className={`main-grid ${viewLayout === "split" ? "split-layout" : ""}`}>
            <section className={`board-panel panel ${viewLayout === "preview" ? "preview-panel" : ""}`}>
              <Board
                linesData={linesData}
                inputText={inputText}
                analysisInfo={analysisInfo}
                activeRowId={activeRowId}
                onRowClick={handleRowClick}
                circleTextColor={circleTextColor}
              />
            </section>

            {viewLayout !== "preview" && (
              <aside className="control-panel panel">
                <h2>⚙️ แผงควบคุม</h2>

                <section className="control-group">
                  <strong>✨ ผู้ช่วยผันวรรณยุกต์</strong>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "full5"}
                      onChange={() => setMode("full5")}
                    />
                    ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "highOnly"}
                      onChange={() => setMode("highOnly")}
                    />
                    เฉพาะเสียงสูง (เอก, โท, จัตวา)
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "lowOnly"}
                      onChange={() => setMode("lowOnly")}
                    />
                    เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)
                  </label>

                  <div className="input-row">
                    <input
                      value={inputText}
                      placeholder="พิมพ์คำ เช่น มือ, กา, หนา"
                      className={inputError ? "input-error" : ""}
                      onChange={(event) => {
                        setInputText(event.target.value);
                        validateInput(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleGenerate();
                      }}
                    />

                    <button className="blue-btn" onClick={handleGenerate}>
                      ผันคำ
                    </button>
                  </div>

                  {inputError && <div className="error-text">⚠️ {inputError}</div>}
                </section>

                <section>
                  <div className="section-label">
                    ⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว)
                  </div>

                  <div className="consonant-grid">
                    {quickConsonants.map((consonant) => {
                      let color = colorLow;

                      if (midConsonants.includes(consonant)) color = colorMid;
                      if (highConsonants.includes(consonant)) color = colorHigh;

                      return (
                        <button
                          type="button"
                          key={consonant}
                          className="consonant-btn"
                          style={{ color }}
                          onClick={() => handleQuickConsonantClick(consonant)}
                          title={`เลือกพยัญชนะ ${consonant}`}
                        >
                          {consonant}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="cluster-section">
                  <div className="section-label">
                    🔗 คำควบกล้ำ และอักษรนำ
                  </div>

                  <div className="cluster-main-guide">
                    กดปุ่มเพื่อใช้เป็นพยัญชนะต้นของคำ ระบบจะคงสระเดิมไว้ให้
                  </div>

                  {consonantClusterGroups.map((group) => (
                    <div className="cluster-group" key={group.title}>
                      <div className="cluster-group-title" style={{ color: group.color }}>
                        {group.icon} {group.title}
                      </div>

                      <div className="cluster-description">
                        {group.description}
                      </div>

                      <div className="cluster-button-list">
                        {group.items.map((cluster) => (
                          <button
                            type="button"
                            key={cluster}
                            className="cluster-btn"
                            style={{
                              borderColor: group.color,
                              color: group.color,
                            }}
                            onClick={() => handleQuickConsonantClick(cluster)}
                            title={`เลือก “${cluster}” เป็นพยัญชนะต้น`}
                          >
                            {cluster}
                          </button>
                        ))}
                      </div>

                      <div
                        className="cluster-note"
                        style={{ borderLeftColor: group.color }}
                      >
                        <strong>ตัวอย่าง:</strong> {group.note}
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <div className="section-label green-label">
                    🟢 สระเสียงยาว (มักเป็นคำเป็น)
                  </div>

                  <div className="vowel-list">
                    {longVowels.map((vowel) => (
                      <button
                        type="button"
                        key={vowel.label}
                        className="vowel-btn long-vowel"
                        onClick={() => handleQuickVowelClick(vowel)}
                      >
                        {vowel.label}
                      </button>
                    ))}
                  </div>

                  <div className="section-label red-label">
                    🔴 สระเสียงสั้น (มักเป็นคำตาย)
                  </div>

                  <div className="vowel-list">
                    {shortVowels.map((vowel) => (
                      <button
                        type="button"
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
                      <option value="">เลือกเสียงอัตโนมัติ</option>

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
                    onClick={() => speak(inputText)}
                  >
                    ▶ ทดลองอ่านคำปัจจุบัน
                  </button>
                </section>

                <section>
                  <div className="section-label">
                    🎨 ตั้งค่าสีพยัญชนะและวงกลม
                  </div>

                  <div className="color-grid">
                    <label className="color-picker" style={{ background: colorMid }}>
                      อักษรกลาง
                      <input
                        type="color"
                        value={colorMid}
                        onChange={(event) => setColorMid(event.target.value)}
                      />
                    </label>

                    <label className="color-picker" style={{ background: colorHigh }}>
                      อักษรสูง
                      <input
                        type="color"
                        value={colorHigh}
                        onChange={(event) => setColorHigh(event.target.value)}
                      />
                    </label>

                    <label className="color-picker" style={{ background: colorLow }}>
                      อักษรต่ำ
                      <input
                        type="color"
                        value={colorLow}
                        onChange={(event) => setColorLow(event.target.value)}
                      />
                    </label>

                    <label
                      className="color-picker text-color-picker"
                      style={{
                        background: "#334155",
                        color: circleTextColor,
                      }}
                    >
                      สีตัวอักษร
                      <input
                        type="color"
                        value={circleTextColor}
                        onChange={(event) => setCircleTextColor(event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="control-group">
                  <strong>🖼️ พื้นหลัง</strong>

                  <div className="background-colors">
                    {[
                      ["เทา", "#e2e8f0"],
                      ["ขาว", "#f8fafc"],
                      ["ฟ้าอ่อน", "#e0f2fe"],
                      ["เขียวอ่อน", "#dcfce7"],
                      ["ครีม", "#fef3c7"],
                      ["เข้ม", "#334155"],
                    ].map(([label, color]) => (
                      <button
                        type="button"
                        key={color}
                        style={{
                          backgroundColor: color,
                          color: color === "#334155" ? "#ffffff" : "#1e293b",
                        }}
                        className={
                          bgType === "color" && bgColor === color
                            ? "background-selected"
                            : ""
                        }
                        onClick={() => {
                          setBgColor(color);
                          setBgType("color");
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="upload-btn">
                    📁 อัปโหลดรูปพื้นหลัง
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {bgType === "image" && (
                    <button
                      className="danger-btn"
                      onClick={() => {
                        setBgType("color");
                        setBgImage("");
                      }}
                    >
                      ลบรูปพื้นหลัง
                    </button>
                  )}
                </section>
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Sarabun", "Noto Sans Thai", Tahoma, Arial, sans-serif;
  }

  button,
  input,
  select {
    font-family: inherit;
  }

  button {
    border: 0;
    cursor: pointer;
  }

  .app-page {
    min-height: 100vh;
    padding: 22px 14px;
    background-size: cover;
    background-position: center;
  }

  .app-shell {
    width: min(1440px, 100%);
    margin: 0 auto;
  }

  .panel {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #dbe4ee;
    border-radius: 18px;
    box-shadow: 0 7px 22px rgba(15, 23, 42, 0.1);
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 15px 18px;
    margin-bottom: 20px;
  }

  .view-buttons,
  .monitor-buttons,
  .input-row,
  .vowel-list,
  .background-colors {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .view-buttons strong {
    color: #1e293b;
    font-size: 15px;
  }

  .soft-btn,
  .selected-btn,
  .blue-btn,
  .green-btn,
  .danger-btn {
    padding: 9px 13px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 800;
    transition: transform 0.15s ease, filter 0.15s ease;
  }

  .soft-btn:hover,
  .selected-btn:hover,
  .blue-btn:hover,
  .green-btn:hover,
  .danger-btn:hover {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }

  .soft-btn {
    background: #f1f5f9;
    color: #475569;
  }

  .selected-btn,
  .blue-btn {
    background: #0284c7;
    color: #ffffff;
  }

  .green-btn {
    background: #16a34a;
    color: #ffffff;
  }

  .danger-btn {
    background: #ef4444;
    color: #ffffff;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-items: start;
  }

  .main-grid.split-layout {
    grid-template-columns: minmax(0, 1fr) 450px;
  }

  .board-panel {
    min-width: 0;
    padding: 32px 24px;
  }

  .preview-panel {
    padding: 48px 58px;
  }

  .tone-board {
    width: 100%;
  }

  .board-title {
    margin-bottom: 18px;
    text-align: center;
    color: #ea580c;
  }

  .board-title h1 {
    margin: 0;
    font-size: clamp(25px, 2.5vw, 34px);
    line-height: 1.2;
  }

  .board-title p {
    margin: 4px 0 0;
    font-size: clamp(17px, 1.55vw, 21px);
    font-weight: 700;
  }

  .analysis-box {
    max-width: 930px;
    margin: 0 auto 12px;
    padding: 11px 15px;
    border: 1px solid #bae6fd;
    border-radius: 11px;
    background: #f0f9ff;
    color: #0369a1;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
  }

  .analysis-word {
    color: #0284c7;
    font-size: 16px;
    font-weight: 800;
  }

  .analysis-tag {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 5px;
    background: #dff4ff;
    color: #075985;
  }

  .analysis-detail {
    color: #075985;
  }

  .thai-guide-box {
    max-width: 930px;
    margin: 0 auto 24px;
    padding: 13px 15px;
    border: 1px solid #bbf7d0;
    border-radius: 11px;
    background: #f0fdf4;
    color: #166534;
    font-size: 12px;
  }

  .thai-guide-box > strong {
    display: block;
    margin-bottom: 9px;
    font-size: 14px;
  }

  .thai-guide-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .thai-guide-grid > div {
    padding: 8px 9px;
    border: 1px solid #dcfce7;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
  }

  .thai-guide-grid b {
    display: block;
    margin-bottom: 2px;
    color: #15803d;
  }

  .thai-guide-grid span {
    color: #334155;
    line-height: 1.45;
  }

  .thai-guide-note {
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px dashed #86efac;
    color: #166534;
    line-height: 1.5;
  }

  .tone-header,
  .tone-row {
    display: grid;
    grid-template-columns: 220px minmax(200px, 1fr) 105px;
    align-items: center;
  }

  .tone-header {
    margin-bottom: 4px;
    color: #0284c7;
    font-size: 14px;
    font-weight: 800;
  }

  .tone-header span {
    padding-right: 20px;
    text-align: right;
  }

  .tone-rows {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .tone-row {
    width: 100%;
    padding: 8px 0;
    border-radius: 13px;
    background: transparent;
    text-align: left;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  .tone-row:not(.empty-tone-row):hover {
    background: rgba(224, 242, 254, 0.52);
  }

  .tone-row.active {
    background: rgba(224, 242, 254, 0.8);
    box-shadow: 0 5px 15px rgba(2, 132, 199, 0.16);
    transform: scale(1.025);
  }

  .empty-tone-row {
    cursor: default;
    opacity: 0.68;
  }

  .tone-name {
    padding-right: 20px;
    text-align: right;
    font-size: 18px;
    font-weight: 800;
    white-space: nowrap;
    transition: transform 0.18s ease;
  }

  .tone-name span {
    font-size: 0.88em;
  }

  .tone-row.active .tone-name {
    transform: scale(1.06);
  }

  .tone-line-wrap {
    position: relative;
    display: flex;
    align-items: center;
    height: 40px;
    transition: transform 0.18s ease;
  }

  .tone-row.active .tone-line-wrap {
    transform: scaleY(1.24);
  }

  .tone-line {
    width: 100%;
    height: 2px;
    background: #94a3b8;
    transition: height 0.18s ease, background 0.18s ease;
  }

  .tone-row.active .tone-line {
    height: 4px;
    background: #475569;
  }

  .circle-position {
    position: absolute;
    z-index: 2;
    transform: translateX(-50%);
  }

  .multi-circles-position {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    transform: translateX(-50%);
    transition: transform 0.18s ease;
  }

  .tone-row.active .circle-position {
    transform: translateX(-50%) scale(1.2);
  }

  .tone-row.active .multi-circles-position {
    transform: translateX(-50%) scale(1.12);
  }

  .tone-circle {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 57px;
    height: 57px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: 0 5px 13px rgba(0, 0, 0, 0.27);
    color: #ffffff;
    font-size: 20px;
    font-weight: 800;
    white-space: nowrap;
    isolation: isolate;
    overflow: visible;
    transition: box-shadow 0.18s ease, filter 0.18s ease;
  }

  .tone-row.active .tone-circle {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
    filter: brightness(1.08);
  }

  .multi-tone-circle {
    min-width: 49px;
    height: 49px;
    font-size: 17px;
  }

  .note-tail {
    position: absolute;
    z-index: -1;
    top: -29px;
    left: calc(100% - 5px);
    width: 22px;
    height: 54px;
    overflow: visible;
    color: inherit;
    pointer-events: none;
  }

  .slash {
    color: #64748b;
    font-size: 23px;
    font-weight: 800;
  }

  .fixed-tone-label {
    text-align: center;
    font-size: 16px;
    font-weight: 800;
  }

  .control-panel {
    position: sticky;
    top: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: calc(100vh - 36px);
    padding: 19px;
    overflow-y: auto;
  }

  .control-panel h2 {
    margin: 0;
    color: #1e293b;
    font-size: 21px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 13px;
    border: 1px solid #e2e8f0;
    border-radius: 11px;
    background: #f8fafc;
    color: #1e293b;
    font-size: 13px;
  }

  .radio-label,
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #334155;
    cursor: pointer;
  }

  .input-row {
    flex-wrap: nowrap;
  }

  .input-row input {
    width: 100%;
    min-width: 0;
    flex: 1;
    padding: 9px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    color: #1e293b;
    font-size: 14px;
  }

  .input-row input.input-error {
    border: 2px solid #ef4444;
  }

  .error-text {
    color: #dc2626;
    font-size: 12px;
    font-weight: 700;
  }

  .section-label {
    margin-bottom: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .green-label {
    color: #15803d;
  }

  .red-label {
    margin-top: 12px;
    color: #b91c1c;
  }

  .consonant-grid {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    gap: 5px;
  }

  .consonant-btn {
    height: 35px;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    background: #ffffff;
    font-size: 16px;
    font-weight: 800;
    transition: transform 0.14s ease, background 0.14s ease;
  }

  .consonant-btn:hover {
    transform: translateY(-2px);
    background: #f8fafc;
  }

  .cluster-section {
    padding: 13px;
    border: 1px solid #ddd6fe;
    border-radius: 11px;
    background: linear-gradient(135deg, #faf5ff 0%, #fff7ed 100%);
  }

  .cluster-main-guide {
    margin: -2px 0 10px;
    color: #64748b;
    font-size: 11px;
    line-height: 1.5;
  }

  .cluster-group {
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px dashed #cbd5e1;
  }

  .cluster-group:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }

  .cluster-group-title {
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: 900;
  }

  .cluster-description {
    margin-bottom: 8px;
    color: #475569;
    font-size: 11px;
    line-height: 1.52;
  }

  .cluster-button-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cluster-btn {
    min-width: 42px;
    min-height: 35px;
    padding: 5px 10px;
    border: 1.5px solid;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 15px;
    font-weight: 900;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cluster-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(15, 23, 42, 0.14);
  }

  .cluster-note {
    margin-top: 8px;
    padding: 6px 8px;
    border-left: 3px solid;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.62);
    color: #475569;
    font-size: 10px;
    line-height: 1.5;
  }

  .cluster-note strong {
    color: #334155;
  }

  .vowel-list {
    gap: 5px;
  }

  .vowel-btn {
    padding: 7px 9px;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 800;
  }

  .long-vowel {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #15803d;
  }

  .short-vowel {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #b91c1c;
  }

  .select-label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
  }

  .select-label select,
  .select-label input[type="range"] {
    width: 100%;
  }

  .select-label select {
    padding: 7px;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    background: #ffffff;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .color-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 37px;
    padding: 7px;
    border-radius: 8px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .color-picker input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  .background-colors button {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 800;
  }

  .background-selected {
    outline: 2px solid #0284c7;
    outline-offset: 1px;
  }

  .upload-btn {
    display: inline-flex;
    width: fit-content;
    padding: 8px 10px;
    border-radius: 8px;
    background: #0284c7;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .upload-btn input {
    display: none;
  }

  .display-page {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    min-height: 100vh;
    padding: 3vh 4vw;
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }

  .display-card {
    width: min(1250px, 94vw);
    max-height: 90vh;
    padding: clamp(20px, 3vw, 45px);
    overflow-y: auto;
    border: 1px solid #cbd5e1;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.2);
  }

  .display-tone-board .tone-rows {
    gap: clamp(23px, 3.1vh, 40px);
  }

  .display-tip {
    position: fixed;
    bottom: 14px;
    left: 50%;
    padding: 7px 13px;
    border-radius: 999px;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.75);
    color: #ffffff;
    font-size: 12px;
    white-space: nowrap;
  }

  @media (max-width: 1050px) {
    .main-grid.split-layout {
      grid-template-columns: 1fr;
    }

    .control-panel {
      position: static;
      max-height: none;
    }
  }

  @media (max-width: 640px) {
    .app-page {
      padding: 10px;
    }

    .top-bar {
      padding: 12px;
    }

    .board-panel,
    .preview-panel {
      padding: 22px 9px;
    }

    .tone-header,
    .tone-row {
      grid-template-columns: 112px minmax(120px, 1fr) 54px;
    }

    .tone-header span,
    .tone-name {
      padding-right: 7px;
    }

    .tone-name {
      font-size: 13px;
      white-space: normal;
    }

    .fixed-tone-label {
      font-size: 11px;
    }

    .tone-rows {
      gap: 22px;
    }

    .tone-circle {
      min-width: 43px;
      height: 43px;
      padding: 0 8px;
      font-size: 15px;
    }

    .multi-tone-circle {
      min-width: 39px;
      height: 39px;
      font-size: 13px;
    }

    .note-tail {
      top: -22px;
      left: calc(100% - 3px);
      width: 17px;
      height: 43px;
    }

    .multi-circles-position {
      gap: 4px;
    }

    .slash {
      font-size: 16px;
    }

    .consonant-grid {
      gap: 3px;
    }

    .consonant-btn {
      height: 32px;
      font-size: 13px;
    }

    .thai-guide-grid {
      grid-template-columns: 1fr;
    }

    .thai-guide-box {
      font-size: 11px;
    }

    .cluster-description,
    .cluster-note {
      font-size: 10px;
    }

    .display-card {
      width: 98vw;
      padding: 14px 7px;
    }

    .display-card .tone-header,
    .display-card .tone-row {
      grid-template-columns: 105px minmax(100px, 1fr) 46px;
    }

    .display-tip {
      max-width: 90vw;
      text-align: center;
      white-space: normal;
      font-size: 10px;
    }
  }
`;