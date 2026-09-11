
thai-tone-app-v7.jsx

100%
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * =============================================================================
 * THAI LANGUAGE / TRIYANG (อักษร 3 หมู่) RULEBOOK FOR THIS APPLICATION
 * =============================================================================
 *
 * จุดประสงค์:
 *   ส่วนนี้เป็น "single source of truth" สำหรับ AI และผู้พัฒนาโปรแกรม
 *   เพื่อป้องกันการแก้ logic การผันวรรณยุกต์โดยอาศัยการคาดเดาเฉพาะกรณี
 *
 * 1) ไตรยางศ์ = การแบ่งพยัญชนะไทยตามหลักการผันวรรณยุกต์เป็น 3 หมู่
 *
 *    อักษรกลาง 9 ตัว:
 *      ก จ ฎ ฏ ด ต บ ป อ
 *
 *    อักษรสูง 11 ตัว:
 *      ข ฃ ฉ ฐ ถ ผ ฝ ศ ษ ส ห
 *
 *    อักษรต่ำ 24 ตัว แบ่งเป็น:
 *
 *      อักษรต่ำคู่ 14 ตัว:
 *        ค ฅ ฆ ช ฌ ซ ฑ ฒ ท ธ พ ภ ฟ ฮ
 *
 *      อักษรต่ำเดี่ยว 10 ตัว:
 *        ง ญ ณ น ม ย ร ล ว ฬ
 *
 *    รวมทั้งหมด 44 ตัวพอดี (9 + 11 + 14 + 10 = 44)
 *
 * 2) "พื้นเสียง" คือเสียงของพยางค์เมื่อไม่มีรูปวรรณยุกต์กำกับ
 *
 *    อักษรสูง:
 *      - คำเป็น  -> จัตวา
 *      - คำตาย  -> เอก
 *
 *    อักษรกลาง:
 *      - คำเป็น  -> สามัญ
 *      - คำตาย  -> เอก
 *
 *    อักษรต่ำ:
 *      - คำเป็น          -> สามัญ
 *      - คำตายสระสั้น    -> ตรี
 *      - คำตายสระยาว     -> โท
 *
 * 3) จำนวน "เสียง" ที่ผันได้ไม่เท่ากับจำนวนรูปวรรณยุกต์
 *
 *    มีรูปวรรณยุกต์ 4 รูป: ่ ้ ๊ ๋
 *    แต่การผันจริงขึ้นกับ:
 *      - หมู่อักษร
 *      - คำเป็น / คำตาย
 *      - สระสั้น / สระยาว (โดยเฉพาะคำตายอักษรต่ำ)
 *      - การมีตัวสะกด
 *      - อักษรคู่ / อักษรเดี่ยว
 *
 * 4) ตารางแกนหลักที่ใช้ใน Rule Engine
 *
 *    อักษรกลาง:
 *      - คำเป็น:  5 เสียง
 *          สามัญ = ไม่มีรูป, เอก = ่, โท = ้, ตรี = ๊, จัตวา = ๋
 *      - คำตาย:  4 เสียง
 *          เอก = ไม่มีรูป, โท = ้, ตรี = ๊, จัตวา = ๋
 *
 *    อักษรสูง:
 *      - คำเป็น:  3 เสียง
 *          เอก = ่, โท = ้, จัตวา = ไม่มีรูป
 *      - คำตาย:  2 เสียง
 *          เอก = ไม่มีรูป, โท = ้
 *
 *    อักษรต่ำ:
 *      - คำเป็น:  3 เสียง
 *          สามัญ = ไม่มีรูป, โท = ่, ตรี = ้
 *      - คำตายสระสั้น:
 *          โท = ่, ตรี = ไม่มีรูป
 *          (รูป/เสียงจัตวาในตำราบางชุดเป็นรูปประกอบ/ทางเลือก
 *           ไม่ควรนับเป็นรูปผันหลักโดยอัตโนมัติ)
 *      - คำตายสระยาว:
 *          โท = ไม่มีรูป, ตรี = ้
 *
 * 5) คำเป็น / คำตาย
 *
 *    คำตายหลักที่ใช้ในการศึกษา:
 *      - สระเสียงสั้น ไม่มีตัวสะกด
 *      - มีตัวสะกดในแม่กก แม่กด แม่กบ
 *
 *    คำเป็นหลัก:
 *      - สระเสียงยาว ไม่มีตัวสะกด
 *      - มีตัวสะกดในแม่กง แม่กน แม่กม แม่เกย แม่เกอว
 *
 *    ข้อควรระวัง:
 *      การตรวจจาก "อักขระตัวสุดท้าย" อย่างเดียวไม่เพียงพอ เพราะ ย/ว
 *      อาจเป็นส่วนของรูปสระ เช่น เ◌ีย / ◌ียะ / ◌ัว / ◌ัวะ
 *
 * 6) อักษรต่ำคู่ / ต่ำเดี่ยว
 *
 *    ต่ำคู่:
 *      มีอักษรสูงเป็นคู่เสียง และสามารถใช้คู่เสียงสูงร่วมเพื่อเทียบ
 *      การผันให้ครบ 5 เสียงในบริบทการเรียนการสอน
 *
 *    ต่ำเดี่ยว:
 *      ไม่มีคู่เสียงสูงโดยตรง การผันครบ 5 เสียงต้องใช้ "ห นำ"
 *
 *      ตัวอย่าง:
 *        นา -> หนา (รูปเทียบของเสียงจัตวา)
 *        งาน -> หงา/หง่า/หง้า ... ตามชุดเสียงที่ใช้เทียบ
 *
 * 7) ห นำ / อ นำ / ควบกล้ำ
 *
 *    - ห นำ: ห ทำหน้าที่นำระดับเสียงให้พยัญชนะต่ำเดี่ยว เช่น หง หน หม หร
 *    - อ นำ: ใช้เฉพาะกรณีภาษาไทยที่เป็นข้อยกเว้นทางคำ/การออกเสียง เช่น อย่า
 *    - ควบกล้ำแท้: ตัวพยัญชนะต้น 2 ตัวออกเสียงควบกันจริง เช่น กร กล กว
 *    - ควบกล้ำไม่แท้: ต้องถือเป็นข้อมูลเชิงคำ/การออกเสียง ไม่ควรอนุมาน
 *      ทุกคำด้วยกฎ "เปลี่ยนตัวแรกเป็นคู่สูง" แบบกลไกตายตัว
 *
 * 8) Rule Engine ต้องเป็นแหล่งความจริงหลัก
 *
 *    calculateTones() / analyzeSyllable() เป็นแหล่งตัดสินผลการผัน
 *    AI ใช้ได้เฉพาะ:
 *      - ช่วยอธิบายหลักภาษา
 *      - ช่วยตรวจคำศัพท์
 *      - เสนอคำตัวอย่าง
 *
 *    AI ห้าม overwrite ผลการผันที่ Rule Engine คำนวณแล้ว
 *
 * 9) รูป "เทียบการผัน" ไม่เท่ากับ "คำศัพท์ไทยที่ยืนยันความหมาย"
 *
 *    เช่น การสร้างคู่เสียงเพื่อการสอนอาจได้รูปที่ไม่ใช่คำศัพท์จริง
 *    UI ต้องติดป้าย "รูปเทียบการผัน" ตามความเหมาะสม
 *
 * 10) ตัวตรวจรูปวรรณยุกต์
 *
 *    validateEnteredToneMark() ต้องเรียก Rule Engine ชุดเดียวกับ
 *    ตารางแสดงผล ห้ามสร้างตารางกฎแยกอีกชุด
 *
 * 11) การทดสอบ
 *
 *    TONE_RULE_SELF_TESTS ด้านล่างเป็น regression tests สำหรับตัวอย่าง
 *    คำจริงระดับพื้นฐาน เพื่อป้องกันการแก้กฎในอนาคตแล้วทำให้กฎเดิมเสีย
 *
 * แหล่งอ้างอิงที่ใช้เป็นฐานการเรียนการสอน:
 *   - DLTV: ไตรยางศ์ / อักษรสูง กลาง ต่ำ / อักษรต่ำคู่ / ต่ำเดี่ยว
 *   - DLTV: ใบความรู้การผันวรรณยุกต์
 *   - บทเรียนไตรยางศ์ที่ให้ตารางคำเป็น/คำตายและพื้นเสียง
 * =============================================================================
 */

const apiKey = "";
const CHANNEL_NAME = "thai_tone_sync_channel";
const STORAGE_KEY = "thai_tone_live_sync_data";
const TTS_API_ENDPOINT = "/api/tts";
const TTS_VOICE = "th-TH-PremwadeeNeural";

// Regex ตรวจสอบคำไทย 1 พยางค์อย่างเคร่งครัด
const STRICT_THAI_SYLLABLE_PATTERN = /^[เแโใไ]?[ก-ฮ]{1,2}[ิีึืุูั็ํ]?[่้๊๋]?[าำยวอ]?[ก-ฮ]?[ะ์]?$/;

const midConsonants = ["ก", "จ", "ด", "ต", "บ", "ป", "อ", "ฎ", "ฏ"];
const highConsonants = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
const lowSingleConsonants = ["ง", "ญ", "ณ", "น", "ม", "ย", "ร", "ล", "ฬ", "ว"];

const lowPairConsonants = [
  "ค", "ฅ", "ฆ", "ช", "ฌ", "ซ", "ฑ", "ฒ",
  "ท", "ธ", "พ", "ภ", "ฟ", "ฮ",
];

const lowConsonants = [
  ...lowPairConsonants,
  ...lowSingleConsonants,
];

const allThaiConsonants = [
  ...midConsonants,
  ...highConsonants,
  ...lowConsonants,
];

const quickConsonants = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ",
];

// กลุ่มคำควบ/อักษรนำสำหรับปุ่มเลือกด่วน
const trueClusters = [
  "กร", "กล", "กว", "ขร", "ขล", "ขว", "คร", "คล", "คว",
  "ตร", "ปร", "ปล", "พร", "พล", "ฟร", "ฟล",
];

const leadingHoClusters = [
  "หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว",
];

const leadingOClusters = ["อย"];

// ควบกล้ำไม่แท้: แยกไว้เพื่อไม่ให้ถูกสรุปเป็นควบแท้
const falseClusters = ["ทร", "ศร", "สร", "จร", "ซร"];

const thaiClusters = [
  ...trueClusters,
  ...leadingHoClusters,
  ...leadingOClusters,
  ...falseClusters,
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

// ตารางอ้างอิงการผันวรรณยุกต์ตามไตรยางศ์
// ห้ามสร้างกฎซ้ำภายนอก TONE_RULE_TABLE โดยไม่ปรับ self-tests ให้สอดคล้องกัน
// - อักษรกลาง: คำเป็น 5 เสียง / คำตาย 4 เสียง
// - อักษรสูง: คำเป็น 3 เสียง / คำตาย 2 เสียง
// - อักษรต่ำ: คำเป็น 3 เสียง / คำตายสั้น 2 เสียง / คำตายยาว 2 เสียง
const TONE_RULE_TABLE = Object.freeze({
  middle: {
    live: Object.freeze({
      1: "",   // สามัญ
      2: "่", // เอก
      3: "้", // โท
      4: "๊", // ตรี
      5: "๋", // จัตวา
    }),
    dead: Object.freeze({
      2: "",  // เอก: พื้นเสียง
      3: "้", // โท
      4: "๊", // ตรี
      5: "๋", // จัตวา
    }),
  },
  high: {
    live: Object.freeze({
      2: "่", // เอก
      3: "้", // โท
      5: "",  // จัตวา: พื้นเสียง
    }),
    dead: Object.freeze({
      2: "",  // เอก: พื้นเสียง
      3: "้", // โท
    }),
  },
  low: {
    live: Object.freeze({
      1: "",  // สามัญ: พื้นเสียง
      3: "่", // โท
      4: "้", // ตรี
    }),
    deadShort: Object.freeze({
      3: "่", // โท
      4: "",  // ตรี: พื้นเสียง
    }),
    deadLong: Object.freeze({
      3: "่", // โท
      4: "้", // ตรี
    }),
  },
});

// อักษรต่ำคู่ -> อักษรสูงคู่สำหรับ "รูปเทียบการผัน"
const lowToHighPair = Object.freeze({
  ค: "ข", ฅ: "ฃ", ฆ: "ข",
  ช: "ฉ", ฌ: "ฉ",
  ซ: "ศ",
  ฑ: "ฐ", ฒ: "ฐ", ท: "ถ", ธ: "ถ",
  พ: "ผ", ภ: "ผ",
  ฟ: "ฝ",
  ฮ: "ห",
});

// อักษรสูง -> ตัวแทนอักษรต่ำคู่สำหรับใช้สร้าง "รูปเทียบ"
const highToLowPair = Object.freeze({
  ข: "ค", ฃ: "ฅ",
  ฉ: "ช",
  ฐ: "ฑ", ถ: "ท",
  ผ: "พ", ฝ: "ฟ",
  ศ: "ซ", ษ: "ซ", ส: "ซ",
  ห: "ฮ",
});

const DEAD_FINAL_CONSONANTS = new Set([
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ",
  "จ", "ช", "ซ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ",
  "ด", "ต", "ถ", "ท", "ธ", "ศ", "ษ", "ส",
  "บ", "ป", "พ", "ฟ", "ภ",
]);

function getConsonantClass(initial = "", initialKind = "single") {
  if (!initial) return "unknown";

  if (initialKind === "leadingHo") return "high";
  if (initialKind === "leadingO") return "middle";

  const first = initial[0];

  if (midConsonants.includes(first)) return "middle";
  if (highConsonants.includes(first)) return "high";
  if (lowPairConsonants.includes(first)) return "low";
  if (lowSingleConsonants.includes(first)) return "low";

  return "unknown";
}

function getPairedInitial(initial = "", initialKind = "single", targetClass = "high") {
  if (!initial) return "";

  if (initialKind === "leadingHo") {
    const base = initial[1] || "";
    return targetClass === "high" ? initial : base;
  }

  if (initialKind === "leadingO") {
    return initial;
  }

  const first = initial[0];
  const rest = initial.slice(1);

  if (targetClass === "high") {
    const high = highConsonants.includes(first)
      ? first
      : lowSingleConsonants.includes(first)
        ? `ห${first}`
        : lowToHighPair[first] || `ห${first}`;

    // คำควบแท้คงตัวควบไว้ แล้วเปลี่ยนเฉพาะพยัญชนะตัวแรก
    return `${high}${rest}`;
  }

  if (targetClass === "low") {
    const low = lowSingleConsonants.includes(first)
      ? first
      : highToLowPair[first] || first;

    return `${low}${rest}`;
  }

  return initial;
}

function isShortThaiVowel(frontVowel, aboveBelowVowel, rest) {
  const vowelPart = `${frontVowel}${aboveBelowVowel}${rest}`;

  return (
    vowelPart.includes("ะ") ||
    vowelPart.includes("ิ") ||
    vowelPart.includes("ึ") ||
    vowelPart.includes("ุ") ||
    vowelPart.includes("ั") ||
    vowelPart.includes("็") ||
    /^เ.*อะ/.test(vowelPart) ||
    /^เ.*ียะ/.test(vowelPart) ||
    /^เ.*ือะ/.test(vowelPart) ||
    /อะ$/.test(vowelPart) ||
    /เอะ$/.test(vowelPart) ||
    /แอะ$/.test(vowelPart) ||
    /โอะ$/.test(vowelPart) ||
    /เอาะ$/.test(vowelPart) ||
    /อัวะ$/.test(vowelPart)
  );
}

function isDeadFinalConsonant(consonant = "") {
  return DEAD_FINAL_CONSONANTS.has(consonant);
}

function getFinalConsonant(
  rest = "",
  frontVowel = "",
  aboveBelowVowel = "",
) {
  let finalPart = rest;

  // ย / ว บางกรณีเป็นส่วนหนึ่งของรูปสระ ไม่ใช่ตัวสะกด
  // เช่น เ◌ีย, เ◌ียะ, ◌ัว, ◌ัวะ
  if (
    frontVowel === "เ" &&
    aboveBelowVowel.includes("ี") &&
    finalPart.startsWith("ย")
  ) {
    finalPart = finalPart.slice(1);
  }

  if (aboveBelowVowel.includes("ั") && finalPart.startsWith("ว")) {
    finalPart = finalPart.slice(1);
  }

  const consonants = [...finalPart].filter((char) => /[ก-ฮ]/.test(char));
  return consonants[consonants.length - 1] || "";
}

function parseThaiWord(word = "") {
  let workStr = word.trim();
  let frontVowel = "";

  if (["เ", "แ", "โ", "ใ", "ไ"].includes(workStr[0])) {
    frontVowel = workStr[0];
    workStr = workStr.slice(1);
  }

  let initial = "";
  let initialKind = "single";
  const firstTwo = workStr.slice(0, 2);

  if (trueClusters.includes(firstTwo)) {
    initial = firstTwo;
    initialKind = "trueCluster";
    workStr = workStr.slice(2);
  } else if (leadingHoClusters.includes(firstTwo)) {
    initial = firstTwo;
    initialKind = "leadingHo";
    workStr = workStr.slice(2);
  } else if (leadingOClusters.includes(firstTwo)) {
    initial = firstTwo;
    initialKind = "leadingO";
    workStr = workStr.slice(2);
  } else if (falseClusters.includes(firstTwo)) {
    initial = firstTwo;
    initialKind = "falseCluster";
    workStr = workStr.slice(2);
  } else if (workStr.length) {
    initial = workStr[0];
    workStr = workStr.slice(1);
  }

  const aboveBelowVowelChars = [
    "ิ", "ี", "ึ", "ื", "ุ", "ู", "ั", "็", "ํ",
  ];
  const toneChars = ["่", "้", "๊", "๋"];

  let aboveBelowVowel = "";
  let toneMark = "";
  let rest = "";

  for (const char of workStr) {
    if (toneChars.includes(char)) toneMark = char;
    else if (aboveBelowVowelChars.includes(char)) aboveBelowVowel += char;
    else rest += char;
  }

  return {
    initial,
    initialKind,
    frontVowel,
    aboveBelowVowel,
    toneMark,
    rest,
  };
}

function buildWord(frontVowel, initial, aboveBelowVowel, tone, rest) {
  const rawWord = `${frontVowel}${initial}${aboveBelowVowel}${tone}${rest}`;
  return rawWord
    .replace(/([่้๊๋])([ิีึืุูั็ํ])/g, "$2$1")
    .normalize("NFC");
}

function analyzeSyllable(word, currentMode) {
  const {
    initial,
    initialKind,
    frontVowel,
    aboveBelowVowel,
    rest,
    toneMark,
  } = parseThaiWord(word);

  const consonantClass = getConsonantClass(initial, initialKind);
  const primaryConsonant =
    initialKind === "leadingHo"
      ? initial[1] || initial[0] || ""
      : initial[0] || "";

  const finalConsonant = getFinalConsonant(
    rest,
    frontVowel,
    aboveBelowVowel,
  );
  const isShort = isShortThaiVowel(
    frontVowel,
    aboveBelowVowel,
    rest,
  );

  const hasPronouncedFinal = Boolean(finalConsonant);
  const isDead = hasPronouncedFinal
    ? isDeadFinalConsonant(finalConsonant)
    : isShort;

  const type = isDead ? "คำตาย" : "คำเป็น";
  const vowelLen = isShort ? "สระเสียงสั้น" : "สระเสียงยาว";

  const isCluster = initialKind === "trueCluster";
  const clusterLabel = isCluster
    ? ` (คำควบกล้ำแท้ "${initial}")`
    : "";

  const leadingLabel =
    initialKind === "leadingHo"
      ? ` (ห นำ "${initial}")`
      : initialKind === "leadingO"
        ? ` (อ นำ "${initial}")`
        : initialKind === "falseCluster"
          ? ` (กลุ่มอักษรควบไม่แท้ "${initial}")`
          : "";

  let desc = "";

  if (consonantClass === "middle") {
    desc = isDead
      ? `อักษรกลาง${clusterLabel}${leadingLabel} คำตาย ` +
        `(ผันได้ 4 เสียง: เอก, โท, ตรี, จัตวา; พื้นเสียงเอก)`
      : `อักษรกลาง${clusterLabel}${leadingLabel} คำเป็น ` +
        `(ผันได้ครบ 5 เสียง; พื้นเสียงสามัญ)`;
  } else if (consonantClass === "high") {
    desc = isDead
      ? `อักษรสูง${clusterLabel}${leadingLabel} คำตาย ` +
        `(ผันได้ 2 เสียง: เอก, โท; พื้นเสียงเอก)`
      : `อักษรสูง${clusterLabel}${leadingLabel} คำเป็น ` +
        `(ผันได้ 3 เสียง: เอก, โท, จัตวา; พื้นเสียงจัตวา)`;
  } else if (consonantClass === "low") {
    const lowSubtype = lowSingleConsonants.includes(primaryConsonant)
      ? "อักษรต่ำเดี่ยว"
      : "อักษรต่ำคู่";

    desc = isDead
      ? isShort
        ? `${lowSubtype}${clusterLabel}${leadingLabel} คำตายสระเสียงสั้น ` +
          `(ผันได้ 2 เสียง: โท, ตรี; พื้นเสียงตรี)`
        : `${lowSubtype}${clusterLabel}${leadingLabel} คำตายสระเสียงยาว ` +
          `(ผันได้ 2 เสียง: โท, ตรี; พื้นเสียงโท)`
      : `${lowSubtype}${clusterLabel}${leadingLabel} คำเป็น ` +
        `(ผันได้ 3 เสียง: สามัญ, โท, ตรี; พื้นเสียงสามัญ)`;
  } else {
    desc = "ยังจำแนกหมู่อักษรไม่ได้";
  }

  return {
    type,
    vowelLen,
    desc,
    isDead,
    isShort,
    initial,
    initialKind,
    frontVowel,
    aboveBelowVowel,
    rest,
    toneMark,
    primaryConsonant,
    consonantClass,
    finalConsonant,
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
    isComparison: false,
  }));

  if (!word?.trim()) return emptyRows;

  const info = analyzeSyllable(word, mode);
  const {
    initial,
    initialKind,
    frontVowel,
    aboveBelowVowel,
    rest,
    isDead,
    isShort,
    consonantClass,
  } = info;

  const make = (consonant, mark = "") =>
    buildWord(frontVowel, consonant, aboveBelowVowel, mark, rest);

  const blankRow = (id, color) => ({
    ...toneRows.find((item) => item.id === id),
    word: "",
    color,
    isMulti: false,
    multi: [],
    show: false,
    isComparison: false,
  });

  const singleRow = (
    id,
    consonant,
    mark,
    color,
    isComparison = false,
  ) => ({
    ...toneRows.find((item) => item.id === id),
    word: make(consonant, mark),
    color,
    isMulti: false,
    multi: [],
    show: true,
    isComparison,
  });

  const multiToneRow = (id, entries) => ({
    ...toneRows.find((item) => item.id === id),
    word: "",
    color: entries[0]?.color || "#94a3b8",
    isMulti: true,
    multi: entries.map((entry) => ({
      text: make(entry.consonant, entry.mark),
      color: entry.color,
      isComparison: Boolean(entry.isComparison),
    })),
    show: entries.length > 0,
    isComparison: entries.some((entry) => entry.isComparison),
  });

  const createRows = (ruleSet, consonant, color, isComparison = false) =>
    toneRows.map((row) => {
      const mark = ruleSet[row.id];

      if (mark === undefined) return blankRow(row.id, color);

      return singleRow(
        row.id,
        consonant,
        mark,
        color,
        isComparison,
      );
    });

  const middleRules = isDead
    ? TONE_RULE_TABLE.middle.dead
    : TONE_RULE_TABLE.middle.live;

  if (consonantClass === "middle") {
    const fullRows = createRows(
      middleRules,
      initial,
      colorMid,
      false,
    );

    if (mode === "highOnly") {
      return fullRows.map((row) => ({
        ...row,
        show: [5, 3, 2].includes(row.id),
      }));
    }

    if (mode === "lowOnly") {
      return fullRows.map((row) => ({
        ...row,
        show: [4, 3, 1].includes(row.id),
      }));
    }

    if (mode === "pair") {
      return fullRows.map((row) => ({
        ...row,
        show: [5, 1].includes(row.id),
      }));
    }

    return fullRows;
  }

  const pairedHigh =
    consonantClass === "high"
      ? initial
      : getPairedInitial(initial, initialKind, "high");

  const pairedLow =
    consonantClass === "low"
      ? initial
      : getPairedInitial(initial, initialKind, "low");

  const highRules = isDead
    ? TONE_RULE_TABLE.high.dead
    : TONE_RULE_TABLE.high.live;

  const lowRules = isDead
    ? isShort
      ? TONE_RULE_TABLE.low.deadShort
      : TONE_RULE_TABLE.low.deadLong
    : TONE_RULE_TABLE.low.live;

  // โหมดเสียงสูง: ใช้ตารางอักษรสูงเท่านั้น
  if (mode === "highOnly") {
    return createRows(
      highRules,
      pairedHigh,
      colorHigh,
      consonantClass !== "high",
    );
  }

  // โหมดเสียงต่ำ: ใช้ตารางอักษรต่ำเท่านั้น
  if (mode === "lowOnly") {
    return createRows(
      lowRules,
      pairedLow,
      colorLow,
      consonantClass !== "low",
    );
  }

  // full5: รวมชุดอักษรคู่/ห นำ เฉพาะเสียงที่ตารางรองรับจริง
  const combined = toneRows.map((toneRow) => {
    const highMark = highRules[toneRow.id];
    const lowMark = lowRules[toneRow.id];

    const entries = [];

    if (lowMark !== undefined) {
      entries.push({
        consonant: pairedLow,
        mark: lowMark,
        color: colorLow,
        isComparison: consonantClass !== "low",
      });
    }

    if (highMark !== undefined) {
      entries.push({
        consonant: pairedHigh,
        mark: highMark,
        color: colorHigh,
        isComparison: consonantClass !== "high",
      });
    }

    // กรณีรูปเดียวกันจากคู่เสียง ไม่ต้องสร้างวงกลมซ้ำ
    const uniqueEntries = entries.filter(
      (entry, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.consonant === entry.consonant &&
            candidate.mark === entry.mark,
        ) === index,
    );

    if (!uniqueEntries.length) {
      return blankRow(toneRow.id, "#94a3b8");
    }

    if (uniqueEntries.length === 1) {
      const entry = uniqueEntries[0];
      return singleRow(
        toneRow.id,
        entry.consonant,
        entry.mark,
        entry.color,
        entry.isComparison,
      );
    }

    return multiToneRow(toneRow.id, uniqueEntries);
  });

  if (mode === "pair") {
    return combined.map((row) => ({
      ...row,
      show: [5, 1].includes(row.id),
    }));
  }

  return combined;
}



const TONE_RULE_SELF_TESTS = Object.freeze([
  {
    name: "ตรวจจำนวนพยัญชนะครบ 44 ตัว",
    type: "classification",
  },
  {
    name: "อักษรกลางคำเป็น",
    word: "กาน",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 4, 3, 2, 1],
  },
  {
    name: "อักษรกลางคำตาย",
    word: "กาด",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [5, 4, 3, 2],
  },
  {
    name: "อักษรสูงคำเป็น",
    word: "ขาน",
    mode: "highOnly",
    expectedClass: "high",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 3, 2],
  },
  {
    name: "อักษรสูงคำตาย",
    word: "ขัด",
    mode: "highOnly",
    expectedClass: "high",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [3, 2],
  },
  {
    name: "อักษรต่ำคู่คำเป็น",
    word: "คาน",
    mode: "lowOnly",
    expectedClass: "low",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [4, 3, 1],
    expectedSubtype: "lowPair",
  },
  {
    name: "อักษรต่ำคู่คำตายสระสั้น",
    word: "คะ",
    mode: "lowOnly",
    expectedClass: "low",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [4, 3],
    expectedSubtype: "lowPair",
  },
  {
    name: "อักษรต่ำคู่คำตายสระยาว",
    word: "คาด",
    mode: "lowOnly",
    expectedClass: "low",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [4, 3],
    expectedSubtype: "lowPair",
  },
  {
    name: "อักษรต่ำเดี่ยวคำเป็น",
    word: "นาน",
    mode: "lowOnly",
    expectedClass: "low",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [4, 3, 1],
    expectedSubtype: "lowSingle",
  },
  {
    name: "อักษรต่ำเดี่ยวคำตายสระสั้น",
    word: "นะ",
    mode: "lowOnly",
    expectedClass: "low",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [4, 3],
    expectedSubtype: "lowSingle",
  },
  {
    name: "อักษรต่ำเดี่ยว full5 ใช้ ห นำ เทียบ",
    word: "นา",
    mode: "full5",
    expectedClass: "low",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 4, 3, 2, 1],
    expectedSubtype: "lowSingle",
  },
  {
    name: "ควบกล้ำแท้",
    word: "กรา",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 4, 3, 2, 1],
  },
  {
    name: "ห นำ",
    word: "หนา",
    mode: "highOnly",
    expectedClass: "high",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 3, 2],
  },
  {
    name: "ตัวสะกดแม่กงเป็นคำเป็น",
    word: "กาง",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 4, 3, 2, 1],
  },
  {
    name: "ตัวสะกดแม่กนเป็นคำเป็น",
    word: "กาน",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำเป็น",
    expectedVisibleToneIds: [5, 4, 3, 2, 1],
  },
  {
    name: "ตัวสะกดแม่กบเป็นคำตาย",
    word: "กาบ",
    mode: "full5",
    expectedClass: "middle",
    expectedType: "คำตาย",
    expectedVisibleToneIds: [5, 4, 3, 2],
  },
]);

function runToneRuleSelfTests() {
  const failures = [];

  // Regression test ของโครงสร้างไตรยางศ์ 44 ตัว
  const allUnique = new Set(allThaiConsonants);
  const classificationCounts = {
    middle: midConsonants.length,
    high: highConsonants.length,
    lowPair: lowPairConsonants.length,
    lowSingle: lowSingleConsonants.length,
  };

  if (
    allThaiConsonants.length !== 44 ||
    allUnique.size !== 44 ||
    classificationCounts.middle !== 9 ||
    classificationCounts.high !== 11 ||
    classificationCounts.lowPair !== 14 ||
    classificationCounts.lowSingle !== 10 ||
    lowConsonants.length !== 24
  ) {
    failures.push({
      name: "ตรวจจำนวนพยัญชนะครบ 44 ตัว",
      expected: {
        total: 44,
        middle: 9,
        high: 11,
        low: 24,
        lowPair: 14,
        lowSingle: 10,
      },
      actual: {
        total: allThaiConsonants.length,
        unique: allUnique.size,
        middle: classificationCounts.middle,
        high: classificationCounts.high,
        low: lowConsonants.length,
        lowPair: classificationCounts.lowPair,
        lowSingle: classificationCounts.lowSingle,
      },
    });
  }

  for (const testCase of TONE_RULE_SELF_TESTS) {
    if (testCase.type === "classification") continue;

    try {
      const info = analyzeSyllable(
        testCase.word,
        testCase.mode,
      );

      const rows = calculateTones(
        testCase.word,
        testCase.mode,
        "#22c55e",
        "#ef4444",
        "#007bff",
      );

      const visibleToneIds = rows
        .filter((row) => row.show)
        .map((row) => row.id);

      const classOk =
        info.consonantClass ===
        testCase.expectedClass;

      const typeOk =
        info.type === testCase.expectedType;

      const rowsOk =
        JSON.stringify(visibleToneIds) ===
        JSON.stringify(
          testCase.expectedVisibleToneIds,
        );

      const primary =
        info.primaryConsonant || "";

      const subtypeOk =
        !testCase.expectedSubtype ||
        (
          testCase.expectedSubtype === "lowPair" &&
          lowPairConsonants.includes(primary)
        ) ||
        (
          testCase.expectedSubtype === "lowSingle" &&
          lowSingleConsonants.includes(primary)
        );

      if (
        !classOk ||
        !typeOk ||
        !rowsOk ||
        !subtypeOk
      ) {
        failures.push({
          ...testCase,
          actualClass:
            info.consonantClass,
          actualType: info.type,
          actualPrimary: primary,
          actualVisibleToneIds:
            visibleToneIds,
        });
      }
    } catch (error) {
      failures.push({
        ...testCase,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  if (failures.length > 0) {
    console.error(
      "[Thai Tone Rule Engine] Self-test FAILED:",
      failures,
    );
  } else if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.info(
      `[Thai Tone Rule Engine] ${TONE_RULE_SELF_TESTS.length + 1} regression checks passed.`,
    );
  }

  return failures;
}

runToneRuleSelfTests();

function validateEnteredToneMark(word = "") {
  const value = word.trim();

  if (!value) {
    return {
      status: "idle",
      toneMark: "",
      message: "",
      detail: "",
    };
  }

  const parsed = parseThaiWord(value);
  const analysis = analyzeSyllable(value, "full5");
  const baseWord = buildWord(
    parsed.frontVowel,
    parsed.initial,
    parsed.aboveBelowVowel,
    "",
    parsed.rest,
  );

  const ruleMode =
    analysis.consonantClass === "middle"
      ? "full5"
      : analysis.consonantClass === "high"
        ? "highOnly"
        : "lowOnly";

  const candidates = calculateTones(
    baseWord,
    ruleMode,
    "#22c55e",
    "#ef4444",
    "#007bff",
  );

  const candidateMatches = [];

  for (const row of candidates) {
    const words = row.isMulti
      ? row.multi.map((item) => item.text)
      : row.word
        ? [row.word]
        : [];

    if (words.includes(value)) {
      candidateMatches.push(row);
    }
  }

  if (parsed.toneMark) {
    if (candidateMatches.length > 0) {
      const toneNames = candidateMatches
        .map((row) => row.tone)
        .join(" / ");

      return {
        status: "valid",
        toneMark: parsed.toneMark,
        message: `✅ รูปวรรณยุกต์ถูกต้อง: ${parsed.toneMark}`,
        detail: `ตรงกับ${toneNames}`,
      };
    }

    const available = candidates
      .filter((row) => row.show)
      .map((row) => `${row.tone} [${row.mark}]`)
      .join(", ");

    return {
      status: "invalid",
      toneMark: parsed.toneMark,
      message: `❌ รูปวรรณยุกต์ไม่ถูกต้อง: ${parsed.toneMark}`,
      detail: available
        ? `รูปที่ใช้ได้สำหรับคำนี้: ${available}`
        : "คำนี้ไม่มีกฎการผันที่ตรงกับรูปที่กรอก",
    };
  }

  if (candidateMatches.length > 0) {
    const toneNames = candidateMatches
      .map((row) => row.tone)
      .join(" / ");

    return {
      status: "neutral",
      toneMark: "",
      message: "ℹ️ ไม่มีรูปวรรณยุกต์",
      detail: `เป็นรูปพื้นเสียง/รูปไม่มีไม้ และตรงกับ${toneNames}`,
    };
  }

  return {
    status: "neutral",
    toneMark: "",
    message: "ℹ️ ไม่มีรูปวรรณยุกต์",
    detail: "ยังไม่พบรูปพื้นเสียงที่ตรงกับกฎของคำนี้",
  };
}

function escapeXmlText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildAzureTtsSsml(text = "", voice = TTS_VOICE, speechRate = 1) {
  const safeText = escapeXmlText(
    String(text).normalize("NFC").replace(/\s+/g, " ").trim(),
  );

  const rate = Math.max(0.5, Math.min(1.4, Number(speechRate) || 1));
  const ratePercent = Math.round((rate - 1) * 100);
  const rateValue = `${ratePercent >= 0 ? "+" : ""}${ratePercent}%`;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"',
    ' xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="th-TH">',
    `<voice name="${voice}">`,
    `<prosody rate="${rateValue}" pitch="0%">${safeText}</prosody>`,
    '</voice>',
    '</speak>',
  ].join("");
}

function getSpeechFallbackVoice(voices = [], selectedVoiceURI = "") {
  return (
    voices.find(
      (item) =>
        item.voiceURI === selectedVoiceURI &&
        item.lang?.toLowerCase().startsWith("th"),
    ) || voices.find((item) =>
      item.lang?.toLowerCase().startsWith("th"),
    )
  );
}

function getSpeechText(item) {
  if (!item?.show) return "";

  if (item.isMulti) {
    // บรรทัดที่ 3 ที่มีอักษรต่ำ-สูงคู่เสียงเดียวกัน ให้ออกเสียงคำในวงกลมเพียงคำเดียว (คำแรก)
    return item.multi[0]?.ttsText || item.multi[0]?.text || "";
  }

  return item.ttsText || item.word || "";
}

function normalizeThaiSpeechText(text = "") {
  return String(text)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function Board({
  linesData,
  analysisInfo,
  inputText,
  activeRowId,
  onRowClick,
  circleTextColor,
  mode,
  isDisplay = false,
  fontSize = 20,
  staffBgColor = "#ffffff",
  lang = "th",
  onPlayAllTones,
  isPlayingAll = false,
}) {
  const t = (th, en) => (lang === "en" ? en : th);

  const fixedRightLabels = {
    5: { text: t("เสียงสูง", "High Pitch"), color: "#ef4444" },
    3: { text: t("เสียงกลาง", "Mid Pitch"), color: "#22c55e" },
    1: { text: t("เสียงต่ำ", "Low Pitch"), color: "#007bff" },
  };

  const toneNames = {
    5: { th: "เสียงจัตวา", en: "Rising (Chattawa)" },
    4: { th: "เสียงตรี", en: "High (Tri)" },
    3: { th: "เสียงโท", en: "Falling (Tho)" },
    2: { th: "เสียงเอก", en: "Low (Ek)" },
    1: { th: "เสียงสามัญ", en: "Mid (Saman)" },
  };

  const ratio = Math.max(0.8, fontSize / 20);
  const circleSize = isDisplay ? `clamp(42px, ${4.2 * ratio}vw, 70px)` : "48px";
  const textSize = isDisplay ? `clamp(15px, ${1.5 * ratio}vw, 25px)` : "17px";
  const circleFontSize = isDisplay
    ? `clamp(16px, ${1.8 * ratio}vw, 27px)`
    : "18px";

  const getCircleStyle = (color) => ({
    backgroundColor: color,
    color: circleTextColor,
    "--note-color": color,
    width: circleSize,
    minWidth: circleSize,
    maxWidth: circleSize,
    height: circleSize,
    padding: 0,
    fontSize: circleFontSize,
    lineHeight: 1,
    flex: `0 0 ${circleSize}`,
  });

  return (
    <div
      className={`tone-board ${isDisplay ? "display-board" : ""}`}
      style={isDisplay ? { backgroundColor: staffBgColor } : {}}
    >
      <div className="board-title">
        <h2>{t("ไตรยางศ์ หรือ อักษร 3 หมู่", "Three Consonant Classes (Triyang)")}</h2>
        <div>{t("และการผันวรรณยุกต์", "Tone Rules & Musical Staves")}</div>
      </div>

      {(() => {
        const visibleItems = linesData.filter((item) => item.show);
        const topItem = visibleItems[0];
        const bottomItem = visibleItems[visibleItems.length - 1];
        const isMid = midConsonants.includes(analysisInfo?.primaryConsonant);

        const getTargetWord = (item) => getSpeechText(item);
        const analyses = [];

        if (mode === "pair") {
          const topWord = getTargetWord(topItem);
          const bottomWord = getTargetWord(bottomItem);
          const pConsonant = analysisInfo?.primaryConsonant || "";
          const isSingle = lowSingleConsonants.includes(pConsonant);

          let pairTitle = "";
          let pairDesc = "";

          if (isMid) {
            pairTitle = t("อักษรกลาง (Soloist / ศิลปินเดี่ยว)", "Mid Class (Soloist)");
            pairDesc = t(
              `มีเอกลักษณ์เฉพาะตัว สามารถผันได้ครบทั้ง 5 เสียงด้วยตัวเองโดยไม่ต้องจับคู่กับพยัญชนะอื่น (พื้นเสียงสามัญ "${bottomWord}" ➔ เสียงจัตวา "${topWord}")`,
              `Self-sufficient — inflects all 5 tones on its own without needing a partner (Base mid tone "${bottomWord}" ➔ Rising tone "${topWord}")`
            );
          } else if (isSingle) {
            pairTitle = t("อักษรต่ำเดี่ยว (Solo with Leading ห- / ยืม ห-นำ)", "Single Low Class (With Leading ห-)");
            pairDesc = t(
              `"${bottomWord}" (อักษรต่ำเดี่ยว) ไม่มีคู่เสียงสูงในตัวเอง จึงผันเสียงจัตวาโดย "ยืม ห-นำ" มาเป็น "${topWord}" เพื่อให้ผันครบ 5 เสียง (เสียงจัตวา "${topWord}" ➔ เสียงสามัญ "${bottomWord}")`,
              `"${bottomWord}" has no natural high partner, so it borrows "Leading ห-" ("${topWord}") to produce the rising tone and achieve all 5 tones (Rising "${topWord}" ➔ Mid "${bottomWord}")`
            );
          } else {
            pairTitle = t("คู่เสียงสูง-ต่ำคู่ (Duo / คู่หู)", "High & Paired Low Duo");
            pairDesc = t(
              `"${topWord}" (อักษรสูง) จับคู่กับ "${bottomWord}" (อักษรต่ำคู่) ช่วยกันผันให้ครบ 5 เสียง โดยทั้งคู่มีเสียงโทตรงกัน (เสียงจัตวา "${topWord}" ➔ เสียงสามัญ "${bottomWord}")`,
              `"${topWord}" (High Class) pairs with "${bottomWord}" (Paired Low Class) to complement all 5 tones together, sharing the falling tone (Rising "${topWord}" ➔ Mid "${bottomWord}")`
            );
          }

          if (!topWord && !bottomWord) return null;

          return (
            <div className="analysis-box">
              <div className="analysis-item">
                📌 <strong>{pairTitle}</strong>: {pairDesc}
              </div>
            </div>
          );
        }

        if (isMid) {
          const word = inputText.trim();
          if (word) {
            analyses.push({
              label: "อักษรกลาง",
              word,
              info: analyzeSyllable(word, mode),
            });
          }
        } else if (mode === "full5") {
          const topWord = getTargetWord(topItem);
          const bottomWord = getTargetWord(bottomItem);

          if (topWord) {
            analyses.push({
              label: "เสียงสูง",
              word: topWord,
              info: analyzeSyllable(topWord, "highOnly"),
            });
          }

          if (bottomWord && bottomItem?.id !== topItem?.id) {
            analyses.push({
              label: "เสียงต่ำ",
              word: bottomWord,
              info: analyzeSyllable(bottomWord, "lowOnly"),
            });
          }
        } else if (mode === "highOnly") {
          const word = getTargetWord(topItem);
          if (word) {
            analyses.push({
              label: "เสียงสูง",
              word,
              info: analyzeSyllable(word, "highOnly"),
            });
          }
        } else if (mode === "lowOnly") {
          const word = getTargetWord(bottomItem);
          if (word) {
            analyses.push({
              label: "เสียงต่ำ",
              word,
              info: analyzeSyllable(word, "lowOnly"),
            });
          }
        }

        if (!analyses.length) return null;

        const getLabelText = (lbl) => {
          if (lbl === "อักษรกลาง") return t("อักษรกลาง", "Mid Class");
          if (lbl === "เสียงสูง") return t("เสียงสูง", "High Tone");
          if (lbl === "เสียงต่ำ") return t("เสียงต่ำ", "Low Tone");
          return lbl;
        };

        const translateType = (type) => {
          if (type === "คำเป็น") return t("คำเป็น", "Live Syllable");
          if (type === "คำตาย") return t("คำตาย", "Dead Syllable");
          return type;
        };

        const translateVowel = (v) => {
          if (v === "สระเสียงยาว") return t("สระเสียงยาว", "Long Vowel");
          if (v === "สระเสียงสั้น") return t("สระเสียงสั้น", "Short Vowel");
          return v;
        };

        const getAnalysisDesc = (inf) => {
          if (lang !== "en") return inf.desc;

          const cClass = inf.consonantClass;
          const pConsonant = inf.primaryConsonant || "";
          const init = inf.initial || "";
          const initKind = inf.initialKind || "single";
          const dead = inf.isDead;
          const short = inf.isShort;

          let cLabel = "";
          if (initKind === "trueCluster") {
            cLabel = ` (True Cluster "${init}")`;
          } else if (initKind === "leadingHo") {
            cLabel = ` (Leading ห- "${init}")`;
          } else if (initKind === "leadingO") {
            cLabel = ` (Leading อ- "${init}")`;
          } else if (initKind === "falseCluster") {
            cLabel = ` (False Cluster "${init}")`;
          }

          if (cClass === "middle") {
            return dead
              ? `Mid Class${cLabel} Dead Syllable (Inflects 4 tones: Low, Falling, High, Rising; Natural pitch: Low)`
              : `Mid Class${cLabel} Live Syllable (Inflects all 5 tones; Natural pitch: Mid)`;
          }

          if (cClass === "high") {
            return dead
              ? `High Class${cLabel} Dead Syllable (Inflects 2 tones: Low, Falling; Natural pitch: Low)`
              : `High Class${cLabel} Live Syllable (Inflects 3 tones: Low, Falling, Rising; Natural pitch: Rising)`;
          }

          if (cClass === "low") {
            const subtype = lowSingleConsonants.includes(pConsonant)
              ? "Single Low Class"
              : "Paired Low Class";

            return dead
              ? short
                ? `${subtype}${cLabel} Dead Syllable (Short Vowel) (Inflects 2 tones: Falling, High; Natural pitch: High)`
                : `${subtype}${cLabel} Dead Syllable (Long Vowel) (Inflects 2 tones: Falling, High; Natural pitch: Falling)`
              : `${subtype}${cLabel} Live Syllable (Inflects 3 tones: Mid, Falling, High; Natural pitch: Mid)`;
          }

          return inf.desc;
        };

        return (
          <div className="analysis-box">
            {analyses.map(({ label, word, info }, index) => (
              <div className="analysis-item" key={`${label}-${word}-${index}`}>
                📌 {t("ผลวิเคราะห์หลักภาษา", "Linguistic Analysis")} ({getLabelText(label)}): <strong>"{word}"</strong> {t("เป็น", "is")}{" "}
                <span className="analysis-tag">
                  {translateType(info.type)} ({translateVowel(info.vowelLen)})
                </span>{" "}
                — {getAnalysisDesc(info)}
              </div>
            ))}
          </div>
        );
      })()}

      <div className="tone-header">
        <span>{t("รูปวรรณยุกต์", "Tone Mark")}</span>
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
              title={item.show ? `${t("คลิกเพื่อขยายและอ่านคำ", "Click to zoom and speak")} ${getSpeechText(item)}` : ""}
            >
              <div
                className="tone-name"
                style={{
                  color: rowColor,
                  fontSize: textSize,
                }}
              >
                {t(item.tone, toneNames[item.id]?.en || item.tone)} <span>[ {item.mark} ]</span>
              </div>

              <div className="tone-line-wrap">
                <div className="tone-line" />
                {item.show && !item.isMulti && item.word && (
                  <div
                    className="tone-circle"
                    style={{
                      ...getCircleStyle(item.color),
                      left: item.leftPos,
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
                            ...getCircleStyle(circle.color),
                            position: "relative",
                            left: "auto",
                            transform: "none",
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
                className="tone-line-number"
                style={{ color: item.show ? (item.isMulti ? item.multi[0]?.color : item.color) : "#94a3b8" }}
              >
                {item.id}
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

      {linesData.some((item) => item.show && (item.word || (item.isMulti && item.multi.length > 0))) && (
        <div className="board-footer-actions">
          <button
            type="button"
            className={`auto-play-tones-btn ${isPlayingAll ? "playing" : ""}`}
            onClick={onPlayAllTones}
            title={
              mode === "pair"
                ? t(
                    isPlayingAll ? "กำลังเล่นเสียงผันวรรณยุกต์ (คลิกเพื่อหยุด)" : "ออกเสียงผันวรรณยุกต์คู่เสียงสูง-ต่ำ (5 ➔ 1)",
                    isPlayingAll ? "Playing tones... (Click to stop)" : "Auto-play paired tones (5 ➔ 1)"
                  )
                : mode === "highOnly"
                  ? t(
                      isPlayingAll ? "กำลังเล่นเสียงผันวรรณยุกต์ (คลิกเพื่อหยุด)" : "ออกเสียงผันวรรณยุกต์เฉพาะเสียงสูง (5 ➔ 2 ➔ 3)",
                      isPlayingAll ? "Playing tones... (Click to stop)" : "Auto-play high tones (5 ➔ 2 ➔ 3)"
                    )
                  : mode === "lowOnly"
                    ? t(
                        isPlayingAll ? "กำลังเล่นเสียงผันวรรณยุกต์ (คลิกเพื่อหยุด)" : "ออกเสียงผันวรรณยุกต์เฉพาะเสียงต่ำ (1 ➔ 3 ➔ 4)",
                        isPlayingAll ? "Playing tones... (Click to stop)" : "Auto-play low tones (1 ➔ 3 ➔ 4)"
                      )
                    : t(
                        isPlayingAll ? "กำลังเล่นเสียงผันวรรณยุกต์ (คลิกเพื่อหยุด)" : "ออกเสียงผันวรรณยุกต์อัตโนมัติ 5 เสียง (1 ➔ 5)",
                        isPlayingAll ? "Playing tones... (Click to stop)" : "Auto-play 5 tones ascending (1 ➔ 5)"
                      )
            }
            aria-label="Auto play tones"
          >
            {mode === "pair" || mode === "highOnly" ? (
              /* ลำโพงพร้อมลูกศรลง สำหรับเสียงสูง 5-2-3 หรือคู่เสียงสูง-ต่ำ 5+1 */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
                <path d="M15 9l6 6" stroke="currentColor" strokeWidth="2.2" />
                <path d="M16 15h5v-5" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            ) : (
              /* ลำโพงพร้อมลูกศรขึ้น สำหรับเสียงต่ำ 1-3-4 หรือผัน 5 เสียง 1-5 */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
                <path d="M15 15l6-6" stroke="currentColor" strokeWidth="2.2" />
                <path d="M16 9h5v5" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            )}
            <span className="auto-play-label">
              {isPlayingAll
                ? t("กำลังออกเสียง...", "Playing...")
                : mode === "pair"
                  ? t("ผันเสียง 5+1", "Play 5+1")
                  : mode === "highOnly"
                    ? t("ผันเสียง 5-2-3", "Play 5-2-3")
                    : mode === "lowOnly"
                      ? t("ผันเสียง 1-3-4", "Play 1-3-4")
                      : t("ผันเสียง 1-5", "Play 1-5")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("thai_tone_lang") || "th";
    }
    return "th";
  });

  const t = (th, en) => (lang === "en" ? en : th);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thai_tone_lang", lang);
    }
  }, [lang]);
  const [mode, setMode] = useState("full5");
  const [viewLayout, setViewLayout] = useState("split");
  const [previousLayout, setPreviousLayout] = useState("split");
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
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const isCancelingAutoPlayRef = useRef(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
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
  const [toneValidation, setToneValidation] = useState(() =>
    validateEnteredToneMark(""),
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

  const speak = async (text, force = false) => {
    if (
      typeof window === "undefined" ||
      (!speechEnabled && !force) ||
      !text
    ) {
      return;
    }

    const normalizedText = normalizeThaiSpeechText(text);

    // Primary TTS: Azure Speech ผ่าน Cloudflare Pages Function
    // ใช้ Thai Neural voice + SSML เพื่อไม่ให้เบราว์เซอร์แยกอ่านเป็นชื่ออักษร
    try {
      const response = await fetch(TTS_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: normalizedText,
          voice: TTS_VOICE,
          rate: Number(speechRate),
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure TTS HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      const previousAudio = speechRef.current;
      if (previousAudio instanceof HTMLAudioElement) {
        previousAudio.pause();
        previousAudio.currentTime = 0;
      }

      speechRef.current = audio;

      await new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (speechRef.current === audio) {
            speechRef.current = null;
          }
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
      return;
    } catch (err) {
      console.warn(
        "Azure Thai TTS unavailable; using browser Thai voice fallback:",
        err,
      );
    }

    // Fallback: browser Web Speech API โดยยอมใช้เฉพาะ Thai voice
    const availableVoices = window.speechSynthesis.getVoices();
    const thaiVoice = getSpeechFallbackVoice(
      availableVoices,
      selectedVoiceURI,
    );

    if (!thaiVoice) {
      console.warn(
        "ไม่พบเสียงภาษาไทย (th-TH/th-*). กรุณาเลือก/ติดตั้ง Thai TTS voice ในระบบ",
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = "th-TH";
    utterance.voice = thaiVoice;
    utterance.rate = Number(speechRate);
    utterance.pitch = 1;
    utterance.volume = 1;

    await new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  const handlePlayAllTones = async () => {
    if (isDisplayWindow && typeof window !== "undefined" && "BroadcastChannel" in window) {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage({ type: "TRIGGER_PLAY_ALL" });
      ch.close();
    }

    if (isPlayingAll) {
      isCancelingAutoPlayRef.current = true;
      if (speechRef.current instanceof HTMLAudioElement) {
        speechRef.current.pause();
        speechRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setActiveRowId(null);
      setIsPlayingAll(false);
      return;
    }

    // กำหนดลำดับการออกเสียงตามโหมดที่เลือก
    let targetSequence = [1, 2, 3, 4, 5];
    if (mode === "pair") {
      targetSequence = [5, 1]; // จับคู่อักษรสูง-ต่ำ: เส้น 5 -> เส้น 1
    } else if (mode === "highOnly") {
      targetSequence = [5, 2, 3]; // เฉพาะเสียงสูง: 5 -> 2 -> 3
    } else if (mode === "lowOnly") {
      targetSequence = [1, 3, 4]; // เฉพาะเสียงต่ำ: 1 -> 3 -> 4
    }

    const playableItems = targetSequence
      .map((id) => linesData.find((item) => item.id === id))
      .filter((item) => item && item.show && (item.word || (item.isMulti && item.multi.length > 0)));

    if (!playableItems.length) return;

    setIsPlayingAll(true);
    isCancelingAutoPlayRef.current = false;

    for (const item of playableItems) {
      if (isCancelingAutoPlayRef.current) break;
      setActiveRowId(item.id);
      const textToSpeak = getSpeechText(item);
      if (textToSpeak) {
        await speak(textToSpeak, true);
      }
      if (isCancelingAutoPlayRef.current) break;
      // เว้นช่วงสั้นๆ ระหว่างแต่ละเสียงเพื่อให้ฟังชัดเจนและออกเสียงตามได้ทัน
      await new Promise((resolve) => setTimeout(resolve, 320));
    }

    setActiveRowId(null);
    setIsPlayingAll(false);
    isCancelingAutoPlayRef.current = false;
  };

  const handleRowClick = (item) => {
    if (!item.show) return;
    const isExpanding = activeRowId !== item.id;
    setActiveRowId(isExpanding ? item.id : null);
    if (isExpanding) {
      speak(getSpeechText(item));
    }
  };

  const validateInput = (word) => {
    const value = word.trim();

    if (!value) {
      setToneValidation(validateEnteredToneMark(""));
      setInputError("กรุณากรอกคำศัพท์");
      return false;
    }

    if (/\s/.test(value)) {
      setToneValidation(validateEnteredToneMark(""));
      setInputError("กรุณากรอกเพียง 1 คำเท่านั้น ห้ามเว้นวรรค");
      return false;
    }

    // ตรวจสอบคำภาษาไทย 1 พยางค์อย่างเคร่งครัด
    if (!STRICT_THAI_SYLLABLE_PATTERN.test(value)) {
      setToneValidation(validateEnteredToneMark(""));
      setInputError("กรุณากรอก 1 พยางค์ให้ถูกหลักภาษาไทย (เช่น พยัญชนะ สระ ตัวสะกด วรรณยุกต์)");
      return false;
    }

    const toneResult = validateEnteredToneMark(value);
    setToneValidation(toneResult);

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

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "pair") {
      const { initial } = parseThaiWord(inputText);
      const pairWord = `${initial || "ก"}อ`;
      setInputText(pairWord);
      validateInput(pairWord);
    }
  };

  const handleQuickConsonantClick = (consonant) => {
    if (mode === "pair") {
      const newWord = `${consonant}อ`;
      setInputText(newWord);
      validateInput(newWord);
      return;
    }
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
    const screenWidth = window.screen?.availWidth || 1440;
    const screenHeight = window.screen?.availHeight || 900;

    const popupWidth = Math.max(
      960,
      Math.min(1600, Math.floor(screenWidth * 0.86)),
    );
    const popupHeight = Math.max(
      640,
      Math.min(900, Math.floor(screenHeight * 0.82)),
    );

    const popupLeft = Math.max(0, Math.floor((screenWidth - popupWidth) / 2));
    const popupTop = Math.max(0, Math.floor((screenHeight - popupHeight) / 2));

    window.open(
      `${currentUrl}?view=display&lang=${lang}`,
      "ThaiToneDisplayWindow",
      [
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${popupLeft}`,
        `top=${popupTop}`,
        "resizable=yes",
        "scrollbars=no",
        "status=yes",
      ].join(","),
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
      lang,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const displayMode = params.get("view") === "display";
    setIsDisplayWindow(displayMode);

    const initialLang = params.get("lang");
    if (initialLang === "en" || initialLang === "th") {
      setLang(initialLang);
    }

    if (displayMode) {
      document.body.style.margin = "0";
      document.body.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const thaiFirst = [...availableVoices].sort(
        (a, b) =>
          Number(b.lang?.toLowerCase().startsWith("th")) -
          Number(a.lang?.toLowerCase().startsWith("th")),
      );

      setVoices(thaiFirst);

      const thaiVoice = thaiFirst.find((voice) =>
        voice.lang?.toLowerCase().startsWith("th"),
      );

      setSelectedVoiceURI((previous) => previous || thaiVoice?.voiceURI || "");
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

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
      if (event.data?.type === "TRIGGER_PLAY_ALL") handlePlayAllTones();
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
      if (data.lang) setLang(data.lang);
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

  // Component สำหรับสร้าง Top Bar แบบใช้ซ้ำ
  const renderTopBar = (extraStyle = {}) => (
    <section className="top-bar panel" style={extraStyle}>
      <div className="view-buttons">
        <strong>{t("🖥️ มุมมอง:", "🖥️ View:")}</strong>
        {[
          ["standard", t("1 คอลัมน์", "1 Column")],
          ["split", t("2 คอลัมน์", "2 Columns")],
          ["present", t("พรีวิว", "Preview")],
        ].map(([value, label]) => (
          <button
            key={value}
            className={viewLayout === value ? "selected-btn" : "soft-btn"}
            onClick={() => {
              if (value === "present") {
                setPreviousLayout(viewLayout !== "present" ? viewLayout : "split");
              }
              setViewLayout(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="monitor-buttons">
        <button className="blue-btn" onClick={sendFullscreenToDisplay}>
          {t("⛶ สลับเต็มจอ 2", "⛶ Fullscreen 2")}
        </button>
        <button className="green-btn" onClick={handleOpenDualMonitor}>
          {t("🚀 เปิดจอ 2", "🚀 Open Screen 2")}
        </button>
        <button
          type="button"
          onClick={() => setLang((l) => (l === "th" ? "en" : "th"))}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1.5px solid #0284c7",
            background: lang === "th" ? "#f0f9ff" : "#f0fdf4",
            color: "#0369a1",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all .18s ease",
            boxShadow: "0 2px 6px rgba(2,132,199,.15)",
          }}
          title={lang === "th" ? "Switch interface to English" : "เปลี่ยนอินเทอร์เฟซเป็นภาษาไทย"}
        >
          <span>🌐</span>
          <span style={{ color: lang === "th" ? "#0284c7" : "#94a3b8", fontWeight: lang === "th" ? "800" : "500" }}>
            ไทย
          </span>
          <span style={{ color: "#94a3b8" }}>/</span>
          <span style={{ color: lang === "en" ? "#16a34a" : "#94a3b8", fontWeight: lang === "en" ? "800" : "500" }}>
            English
          </span>
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
            mode={mode}
            isDisplay
            fontSize={labelFontSize}
            staffBgColor={staffBgColor}
            lang={lang}
            onPlayAllTones={handlePlayAllTones}
            isPlayingAll={isPlayingAll}
          />
          
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="app-page" style={containerBackground}>
        <div className="app-shell">
          
          {/* ในโหมด present แสดงไอคอนสลับมุมมองที่มุมบนขวา เพื่อให้กระดานขยายเต็มพื้นที่จอ */}
          {viewLayout === "present" && (
            <button
              type="button"
              className="preview-switch-btn"
              onClick={() => setViewLayout(previousLayout || "split")}
              title={t(
                `สลับกลับไปมุมมองก่อนหน้า (${previousLayout === "standard" ? "1 คอลัมน์" : "2 คอลัมน์"})`,
                `Switch back to previous view (${previousLayout === "standard" ? "1 Column" : "2 Columns"})`
              )}
              aria-label="Switch back view"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
              </svg>
            </button>
          )}

          <div className={`main-grid ${viewLayout === "split" ? "split-layout" : ""}`}>
            <section
              className="panel"
              style={{
                backgroundColor: staffBgColor,
                borderRadius: "16px",
                padding: viewLayout === "present" ? "40px 50px" : "35px 25px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                backdropFilter: "blur(6px)",
              }}
            >
              <Board
                linesData={linesData}
                analysisInfo={analysisInfo}
                inputText={inputText}
                activeRowId={activeRowId}
                onRowClick={handleRowClick}
                circleTextColor={circleTextColor}
                mode={mode}
                fontSize={labelFontSize}
                staffBgColor={staffBgColor}
                lang={lang}
                onPlayAllTones={handlePlayAllTones}
                isPlayingAll={isPlayingAll}
              />
            </section>

            {/* กรณีที่ไม่ใช่โหมด present ให้ Top bar และแผงควบคุมอยู่ในกล่องด้านขวา */}
            {viewLayout !== "present" && (
              <div
                className="right-panel-wrapper"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  maxHeight: "calc(100vh - 42px)",
                  position: "sticky",
                  top: "20px"
                }}
              >
                {/* เฟรมมุมมองอยู่ด้านบน */}
                {renderTopBar({ marginBottom: 0 })}

                {/* เฟรมแผงควบคุมอยู่ด้านล่าง และสามารถเลื่อน Scroll ได้อิสระ */}
                <aside 
                  className="control-panel panel" 
                  style={{ flex: 1, overflowY: "auto", position: "static", maxHeight: "none", margin: 0 }}
                >
                  <h3>{t("⚙️ แผงควบคุม", "⚙️ Control Panel")}</h3>

                  <section className="control-group">
                    <strong>{t("✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ", "✨ AI Tone Inflection Assistant")}</strong>

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
                      <ModeRadio value="full5" checked={mode === "full5"} label={t("แสดงชุดผัน 5 เสียงเมื่อมีกฎเทียบ (อักษรคู่ / ห นำ)", "Show 5 tones with paired / leading rules")} onChange={handleModeChange} />
                      <ModeRadio value="highOnly" checked={mode === "highOnly"} label={t("เฉพาะเสียงสูง (เอก, โท, จัตวา)", "High tone set only (Low, Falling, Rising)")} onChange={handleModeChange} />
                      <ModeRadio value="lowOnly" checked={mode === "lowOnly"} label={t("เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)", "Low tone set only (Mid, Falling, High)")} onChange={handleModeChange} />
                      <ModeRadio value="pair" checked={mode === "pair"} label={t("จับคู่อักษรสูงและอักษรต่ำ", "Pair High & Low Class Consonants")} onChange={handleModeChange} />
                    </div>

                    <div className="input-row">
                      <input
                        value={inputText}
                        placeholder={t("พิมพ์ 1 คำ เช่น กอ, เมา, กวาง", "Type 1 word, e.g. กอ, เมา, กวาง")}
                        onChange={(event) => {
                          let val = event.target.value;
                          if (mode === "pair" && val.length === 1 && /[ก-ฮ]/.test(val)) {
                            val = `${val}อ`;
                          }
                          setInputText(val);
                          validateInput(val);
                          if (!val.trim() && mode !== "pair") {
                            setMode("full5");
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleGenerate();
                        }}
                        className={inputError ? "input-error" : ""}
                      />
                      <button className="blue-btn" disabled={loading} onClick={handleGenerate}>
                        {loading ? "..." : t("ผันคำ", "Analyze")}
                      </button>
                    </div>

                    {inputError && <div className="error-text">{inputError}</div>}


                  </section>

                  <section>
                    <div className="section-label">{t("⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):", "⌨️ Quick Consonants (44 Letters):")}</div>
                    <div className="consonant-grid">
                      {quickConsonants.map((consonant) => (
                        <button
                          key={consonant}
                          type="button"
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

                    <div className="low-class-groups">
                      <div className="low-class-group">
                        <div className="section-label low-pair-label">
                          {t("🟣 อักษรต่ำคู่ (๑๔ ตัว)", "🟣 Paired Low Consonants (14 Letters)")}
                        </div>
                        <div className="low-consonant-grid">
                          {lowPairConsonants.map((consonant) => (
                            <button
                              key={`low-pair-${consonant}`}
                              type="button"
                              className="consonant-btn low-pair-btn"
                              onClick={() =>
                                handleQuickConsonantClick(consonant)
                              }
                            >
                              {consonant}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="low-class-group">
                        <div className="section-label low-single-label">
                          {t("🔵 อักษรต่ำเดี่ยว (๑๐ ตัว)", "🔵 Single Low Consonants (10 Letters)")}
                        </div>
                        <div className="low-consonant-grid">
                          {lowSingleConsonants.map((consonant) => (
                            <button
                              key={`low-single-${consonant}`}
                              type="button"
                              className="consonant-btn low-single-btn"
                              onClick={() =>
                                handleQuickConsonantClick(consonant)
                              }
                            >
                              {consonant}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="cluster-groups">
                      <div>
                        <div className="section-label cluster-label">
                          {t("🔗 ควบกล้ำแท้", "🔗 True Clusters")}
                        </div>
                        <div className="cluster-grid">
                          {trueClusters.map((cluster) => (
                            <button
                              key={cluster}
                              type="button"
                              className="cluster-btn true-cluster"
                              onClick={() =>
                                handleQuickConsonantClick(cluster)
                              }
                            >
                              {cluster}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="section-label cluster-label">
                          {t("🟣 อักษรนำ ห-นำ", "🟣 Leading ห- Clusters")}
                        </div>
                        <div className="cluster-grid">
                          {leadingHoClusters.map((cluster) => (
                            <button
                              key={cluster}
                              type="button"
                              className="cluster-btn leading-ho-cluster"
                              onClick={() =>
                                handleQuickConsonantClick(cluster)
                              }
                            >
                              {cluster}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="section-label cluster-label">
                          {t("🟠 ควบกล้ำไม่แท้", "🟠 False Clusters")}
                        </div>
                        <div className="cluster-grid">
                          {falseClusters.map((cluster) => (
                            <button
                              key={cluster}
                              type="button"
                              className="cluster-btn false-cluster"
                              onClick={() =>
                                handleQuickConsonantClick(cluster)
                              }
                            >
                              {cluster}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="section-label green-label">{t("🟢 สระเสียงยาว (คำเป็น):", "🟢 Long Vowels (Live Syllables):")}</div>
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

                    <div className="section-label red-label">{t("🔴 สระเสียงสั้น (คำตาย):", "🔴 Short Vowels (Dead Syllables):")}</div>
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
                    <strong>{t("🔊 การอ่านออกเสียง", "🔊 Speech & Voice")}</strong>

                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={(event) => setSpeechEnabled(event.target.checked)}
                      />
                      {t("เปิดเสียงเมื่อคลิกบรรทัด", "Enable voice on row click")}
                    </label>

                    <label className="select-label">
                      {t("เสียงอ่าน", "Voice")}
                      <select
                        value={selectedVoiceURI}
                        onChange={(event) => setSelectedVoiceURI(event.target.value)}
                      >
                        <option value="">{t("เลือกอัตโนมัติ", "Auto Select")}</option>
                        {voices
                          .filter((voice) =>
                            voice.lang?.toLowerCase().startsWith("th"),
                          )
                          .map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                      </select>
                    </label>

                    {voices.every(
                      (voice) => !voice.lang?.toLowerCase().startsWith("th"),
                    ) && (
                      <div className="error-text">
                        ⚠️ เครื่อง/เบราว์เซอร์นี้ยังไม่มี Thai TTS voice —
                        ติดตั้งเสียงภาษาไทยก่อนจึงจะอ่านเป็นคำได้
                      </div>
                    )}

                    <label className="select-label">
                      {t("ความเร็วอ่าน:", "Speech Rate:")} {speechRate}x
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
                      ▶ {t("ทดลองอ่านคำ", "Test Voice")}
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
                      {t("🎼 สีพื้นหลังกระดานบรรทัด 5 เส้น", "🎼 5-Line Staff Background")}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { label: t("ขาว", "White"), value: "#ffffff" },
                        { label: t("ครีม", "Cream"), value: "#fffbeb" },
                        { label: t("ฟ้าอ่อน", "Soft Blue"), value: "#f0f9ff" },
                        { label: t("เขียวอ่อน", "Soft Green"), value: "#f0fdf4" },
                        { label: t("เทาอ่อน", "Soft Gray"), value: "#f8fafc" },
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
                    <div className="section-label">{t("🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร", "🎨 Consonant Class & Text Colors")}</div>
                    <div className="color-grid">
                      {[
                        [t("อักษรกลาง", "Mid Class"), colorMid, setColorMid],
                        [t("อักษรสูง", "High Class"), colorHigh, setColorHigh],
                        [t("อักษรต่ำ", "Low Class"), colorLow, setColorLow],
                        [t("สีตัวอักษร", "Text Color"), circleTextColor, setCircleTextColor],
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
                    <strong>{t("🖼️ เลือกสีหรือรูปภาพพื้นหลังจอภาพรวม", "🖼️ Overall Screen Background")}</strong>
                    <div className="background-colors">
                      {[
                        [t("เทา", "Gray"), "#e2e8f0"],
                        [t("สว่าง", "Light"), "#f1f5f9"],
                        [t("ฟ้าอ่อน", "Soft Blue"), "#e0f2fe"],
                        [t("มินต์", "Mint"), "#dcfce7"],
                        [t("ส้มอ่อน", "Soft Orange"), "#fef3c7"],
                        [t("เข้ม", "Dark"), "#334155"],
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
                      {t("📁 อัปโหลดรูปภาพพื้นหลัง", "📁 Upload Background Image")}
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
                        {t("ยกเลิกรูปภาพ", "Remove Image")}
                      </button>
                    )}
                  </section>

                  <section className="control-group">
                    <label className="select-label">
                      {t("📐 ขนาดตัวหนังสือและวงกลม (จอที่ 2):", "📐 Font & Circle Size (Screen 2):")} {labelFontSize}px
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
                      🔑 {customApiKey ? t("เปลี่ยน Gemini API Key", "Change Gemini API Key") : t("เชื่อมต่อ AI (API Key)", "Connect AI (API Key)")}
                    </button>

                    {showApiInput && (
                      <div className="api-input-box">
                        <strong>{t("🔑 เชื่อมต่อ Gemini API Key ส่วนตัว:", "🔑 Connect Personal Gemini API Key:")}</strong>
                        <div className="input-row">
                          <input
                            type="password"
                            value={tempApiKey}
                            placeholder={t("วาง Gemini API Key...", "Paste Gemini API Key...")}
                            onChange={(event) => setTempApiKey(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleSaveApiKey();
                            }}
                          />
                          <button className="green-btn" onClick={handleSaveApiKey}>
                            {t("บันทึก", "Save")}
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
  html, body, #root { width: 100%; height: 100%; }
  body {
    margin: 0;
    font-family: "Sarabun", Arial, sans-serif;
    overflow: hidden;
  }
  button, input, select { font-family: inherit; }
  button { border: 0; cursor: pointer; }

  .app-page {
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    padding: 22px 14px;
    background-size: cover;
    background-position: center;
    overflow: hidden;
  }

  .app-shell {
    width: min(1280px, 100%);
    height: 100%;
    margin: 0 auto;
    min-height: 0;
  }

  .panel {
    background: rgba(255,255,255,.96);
    border: 1px solid #dbe4ee;
    box-shadow: 0 5px 20px rgba(15,23,42,.09);
    border-radius: 16px;
  }

  .preview-switch-btn {
    position: fixed;
    top: 18px;
    right: 22px;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 1.5px solid #0284c7;
    color: #0284c7;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
    cursor: pointer;
    transition: transform .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease;
  }

  .preview-switch-btn:hover {
    background: #0284c7;
    color: #ffffff;
    transform: scale(1.08);
    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
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
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-items: stretch;
    height: calc(100dvh - 44px);
    min-height: 0;
  }

  .main-grid.split-layout {
    grid-template-columns: minmax(0, 1fr) 410px;
  }

  .main-grid > section {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .board-panel { padding: 30px 22px; min-width: 0; }
  .presentation-panel { padding: 45px 50px; }

  .tone-board { width: 100%; }

  .board-footer-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 14px;
    padding-right: 6px;
  }

  .auto-play-tones-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 15px;
    border-radius: 999px;
    background: #f0fdf4;
    border: 1.5px solid #22c55e;
    color: #15803d;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.18);
    transition: all .18s ease;
  }

  .auto-play-tones-btn:hover {
    background: #16a34a;
    color: #ffffff;
    border-color: #16a34a;
    transform: scale(1.04);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.28);
  }

  .auto-play-tones-btn.playing {
    background: #15803d;
    color: #ffffff;
    border-color: #15803d;
    animation: tonePulse 1.4s infinite;
  }

  @keyframes tonePulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
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
  .analysis-item + .analysis-item {
    margin-top: 6px;
  }
  .analysis-tag {
    padding: 2px 7px;
    border-radius: 5px;
    background: #e0f2fe;
    color: #075985;
  }

  .tone-header, .tone-row {
    display: grid;
    grid-template-columns: 215px minmax(180px, 1fr) 32px 100px;
    align-items: center;
  }

  .tone-line-number {
    text-align: center;
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
    user-select: none;
    transition: transform .18s ease, color .18s ease;
  }

  .tone-row.active .tone-line-number {
    transform: scale(1.18);
  }

  .tone-header {
    color: #0284c7;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .tone-header span { text-align: right; padding-right: 20px; }

  .tone-rows {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-top: 28px; /* เว้นระยะด้านบน 28px ป้องกันก้านโน้ต/ไม้จัตวาของคำว่า ก๋อ ชนหรือล้นขอบบน */
    overflow: visible;
  }

  .tone-row {
    width: 100%;
    padding: 7px 0;
    background: transparent;
    text-align: inherit;
    border-radius: 12px;
    overflow: visible; /* ป้องกัน browser ตัดส่วนที่ยื่นออกนอก button */
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
    overflow: visible;
    transition: none;
    transform: none;
  }

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
    transform: translate3d(-50%, -50%, 0);
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-weight: 700;
    overflow: visible;
    isolation: isolate; /* จัด Stacking Context ภายใน ไม่ให้ก้านโน้ตมุดหายใต้แถวหรือการ์ด */
    box-sizing: border-box;
    box-shadow: 0 4px 11px rgba(0,0,0,.24);
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  }

  .tone-line-wrap > .tone-circle {
    top: 50%;
  }

  .tone-row.active .tone-circle {
    transform: translate3d(-50%, -50%, 0) scale(1.23);
    box-shadow: 0 8px 20px rgba(0,0,0,.34);
    filter: brightness(1.12);
  }

  .multi-circles {
    position: absolute;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform .18s ease;
  }

  .tone-row.active .multi-circles {
    transform: translate3d(-50%, -50%, 0) scale(1.16);
  }

  .tone-row.active .multi-circles .tone-circle {
    transform: none;
  }
  .slash { color: #64748b; font-size: 21px; font-weight: 700; }
  .fixed-tone-label { text-align: center; font-size: 16px; font-weight: 700; }

  .right-panel-wrapper {
    min-height: 0;
    height: 100%;
  }

  .control-panel {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
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

  .tone-validation {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 7px 9px;
    border-radius: 7px;
    font-size: 12px;
    line-height: 1.45;
    border: 1px solid #cbd5e1;
  }

  .tone-validation-valid {
    color: #166534;
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  .tone-validation-invalid {
    color: #991b1b;
    background: #fef2f2;
    border-color: #fecaca;
  }

  .tone-validation-neutral {
    color: #475569;
    background: #f8fafc;
    border-color: #e2e8f0;
  }

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

  .low-class-groups {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .low-class-group {
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .low-pair-label {
    color: #7c3aed;
  }

  .low-single-label {
    color: #2563eb;
  }

  .low-consonant-grid {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 5px;
  }

  .low-pair-btn {
    color: #7c3aed !important;
    border-color: #ddd6fe;
    background: #faf5ff;
  }

  .low-single-btn {
    color: #2563eb !important;
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .cluster-groups {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .cluster-label {
    margin-bottom: 5px;
  }

  .cluster-grid {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 5px;
  }

  .cluster-btn {
    min-height: 34px;
    padding: 6px 7px;
    border-radius: 7px;
    background: #fff;
    font-weight: 700;
    font-size: 14px;
    border: 1px solid #cbd5e1;
  }

  .true-cluster {
    color: #0369a1;
    border-color: #bae6fd;
    background: #f0f9ff;
  }

  .leading-ho-cluster {
    color: #7c3aed;
    border-color: #ddd6fe;
    background: #f5f3ff;
  }

  .false-cluster {
    color: #c2410c;
    border-color: #fed7aa;
    background: #fff7ed;
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
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    padding: clamp(10px, 2vh, 24px) clamp(10px, 2vw, 24px);
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    box-sizing: border-box;
  }

  .display-board {
    width: min(1200px, 96vw);
    height: min(94dvh, calc(100dvh - 24px));
    max-width: 1200px;
    max-height: calc(100dvh - 24px);
    min-height: 0;
    padding: clamp(12px, 3vh, 44px);
    border-radius: clamp(16px, 2vw, 28px);
    background: rgba(255,255,255,.96);
    border: 1px solid #cbd5e1;
    box-shadow: 0 16px 42px rgba(0,0,0,.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .display-board .tone-rows {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: 0;
    margin-top: 2vh;
    padding-top: 24px;
    overflow: visible;
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
    .app-page {
      overflow: hidden;
    }

    .main-grid {
      height: calc(100dvh - 44px);
    }

    .main-grid.split-layout {
      grid-template-columns: 1fr;
    }

    .control-panel {
      position: static;
      min-height: 0;
    }
  }

  @media (max-width: 640px) {
    .app-page { padding: 10px; }
    .top-bar { padding: 12px; }
    .board-panel, .presentation-panel { padding: 22px 10px; }
    .tone-header, .tone-row { grid-template-columns: 112px minmax(115px, 1fr) 22px 52px; }
    .tone-line-number { font-size: 13px; }
    .tone-header span, .tone-name { padding-right: 8px; }
    .tone-name { font-size: 13px !important; white-space: normal; }
    .fixed-tone-label { font-size: 12px; }
    .tone-rows { gap: 20px; }
    .tone-circle {
      width: 39px !important;
      min-width: 39px !important;
      max-width: 39px !important;
      height: 39px !important;
      padding: 0 !important;
      font-size: 15px !important;
    }
    .multi-circles { gap: 4px; }
    .slash { font-size: 16px; }
    .consonant-grid { gap: 3px; }
    .consonant-btn { height: 31px; font-size: 13px; }
    .low-consonant-grid { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 3px; }

    .cluster-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
    }

    .cluster-btn {
      min-height: 31px;
      font-size: 13px;
      padding: 5px 4px;
    }

    .display-board {
      width: 96vw;
      height: calc(100dvh - 20px);
      max-height: calc(100dvh - 20px);
      padding: 14px 8px;
    }
    .display-board .analysis-box { font-size: 11px; margin-bottom: 12px; }
    .display-board .tone-header, .display-board .tone-row { grid-template-columns: 104px minmax(100px, 1fr) 22px 48px; }
    .display-tip { font-size: 10px; max-width: 92vw; white-space: normal; text-align: center; }
  }

  /* ========================================= */
  /* วาดก้านและธงเขบ็ตชั้นเดียว (Eighth Note)  */
  /* ========================================= */
  .tone-circle::before {
    content: "";
    position: absolute;
    right: 0px; /* ก้านเริ่มจากเส้นรอบวงกึ่งกลางด้านขวาพอดี */
    bottom: 50%;
    width: 4px; /* ความหนาก้าน */
    height: 42px; /* ความสูงก้าน */
    background-color: var(--note-color, transparent);
    z-index: -1;
  }

  .tone-circle::after {
    content: "";
    position: absolute;
    right: -12px; /* ยื่นธงออกไปทางขวาให้เชื่อมกับก้าน */
    bottom: calc(50% + 18px); /* เลื่อนธงขึ้นไปแตะยอดก้านพอดี */
    width: 12px; /* ความกว้างธง (ไม่ยาวมาก) */
    height: 20px; /* ความยาวหางธง */
    border-right: 4px solid var(--note-color, transparent);
    border-top: 6px solid var(--note-color, transparent);
    border-top-right-radius: 20px 22px; /* โค้งตวัดเหมือนหางโน้ตดนตรี */
    border-bottom-right-radius: 4px;
    z-index: -1;
  }
`;