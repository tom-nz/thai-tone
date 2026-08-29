/**
 * toneEngine.js - เครื่องยนต์คำนวณหลักภาษาและกฎไตรยางศ์
 */

export const CONSONANTS = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"
];

export const LONG_VOWELS = [
  "า", "ี", "ือ", "ู", "เ", "แ", "โ", "อ", "เอ", "เอีย", "เอือ", "อัว", "อำ", "ใ", "ไ", "เอา"
];

export const SHORT_VOWELS = [
  "ะ", "ิ", "ึ", "ุ", "เอะ", "แอะ", "โอะ", "เอาะ", "เออะ", "เอียะ", "เอือะ", "อัวะ"
];

export const HIGH_TO_LOW = {
  "ข": "ค", "ฃ": "ค", "ฉ": "ช", "ฐ": "ท", "ถ": "ท",
  "ผ": "พ", "ฝ": "ฟ", "ศ": "ซ", "ษ": "ซ", "ส": "ซ", "ห": "ฮ"
};

export const LOW_TO_HIGH = {
  "ค": "ข", "ฅ": "ข", "ฆ": "ข", "ช": "ฉ", "ฌ": "ฉ", "ซ": "ส",
  "ฑ": "ถ", "ฒ": "ถ", "ท": "ถ", "ธ": "ถ", "พ": "ผ", "ภ": "ผ",
  "ฟ": "ฝ", "ฮ": "ห"
};

export const HIGH_CONS = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
export const MID_CONS = ["ก", "จ", "ด", "ต", "บ", "ป", "อ", "ฎ", "ฏ"];
export const LOW_PAIR_CONS = Object.keys(LOW_TO_HIGH);

export function getConsonantClass(c) {
  if (MID_CONS.includes(c)) return "MID";
  if (HIGH_CONS.includes(c)) return "HIGH";
  if (LOW_PAIR_CONS.includes(c)) return "LOW_PAIR";
  return "LOW_SINGLE";
}

export function calculateTones(word, mode) {
  if (!word || !word.trim()) return { notes: null, info: null };
  const cleanWord = word.trim();
  const firstChar = cleanWord[0];
  const cClass = getConsonantClass(firstChar);
  const rest = cleanWord.slice(1);

  let notes = {};
  let info = `ผลวิเคราะห์หลักภาษา: "${cleanWord}" `;

  if (cClass === "MID") {
    info += "เป็น อักษรกลาง คำเป็น (ผันได้ครบ 5 เสียง)";
    if (mode === "full5" || mode === "highOnly" || mode === "lowOnly") {
      notes["สามัญ"] = [{ text: cleanWord, type: "mid" }];
      notes["เอก"] = [{ text: firstChar + "่" + rest, type: "mid" }];
      notes["โท"] = [{ text: firstChar + "้" + rest, type: "mid" }];
      notes["ตรี"] = [{ text: firstChar + "๊" + rest, type: "mid" }];
      notes["จัตวา"] = [{ text: firstChar + "๋" + rest, type: "mid" }];
    }
  } else if (cClass === "HIGH") {
    info += "เป็น อักษรสูง คำเป็น (ผันได้ เอก, โท, จัตวา)";
    const lowPair = HIGH_TO_LOW[firstChar] || "ซ";
    if (mode === "full5") {
      notes["สามัญ"] = [{ text: lowPair + rest, type: "low" }];
      notes["เอก"] = [{ text: firstChar + "่" + rest, type: "high" }];
      notes["โท"] = [{ text: lowPair + "่" + rest, type: "low" }, { text: firstChar + "้" + rest, type: "high" }];
      notes["ตรี"] = [{ text: lowPair + "้" + rest, type: "low" }];
      notes["จัตวา"] = [{ text: cleanWord, type: "high" }];
    } else if (mode === "highOnly") {
      notes["เอก"] = [{ text: firstChar + "่" + rest, type: "high" }];
      notes["โท"] = [{ text: firstChar + "้" + rest, type: "high" }];
      notes["จัตวา"] = [{ text: cleanWord, type: "high" }];
    } else if (mode === "lowOnly") {
      notes["สามัญ"] = [{ text: lowPair + rest, type: "low" }];
      notes["โท"] = [{ text: lowPair + "่" + rest, type: "low" }];
      notes["ตรี"] = [{ text: lowPair + "้" + rest, type: "low" }];
    }
  } else if (cClass === "LOW_PAIR") {
    info += "เป็น อักษรต่ำคู่ คำเป็น (ผันได้ สามัญ, โท, ตรี)";
    const highPair = LOW_TO_HIGH[firstChar] || "ส";
    if (mode === "full5") {
      notes["สามัญ"] = [{ text: cleanWord, type: "low" }];
      notes["เอก"] = [{ text: highPair + "่" + rest, type: "high" }];
      notes["โท"] = [{ text: cleanWord + "่" + rest, type: "low" }, { text: highPair + "้" + rest, type: "high" }];
      notes["ตรี"] = [{ text: cleanWord + "้" + rest, type: "low" }];
      notes["จัตวา"] = [{ text: highPair + rest, type: "high" }];
    } else if (mode === "lowOnly") {
      notes["สามัญ"] = [{ text: cleanWord, type: "low" }];
      notes["โท"] = [{ text: cleanWord + "่" + rest, type: "low" }];
      notes["ตรี"] = [{ text: cleanWord + "้" + rest, type: "low" }];
    } else if (mode === "highOnly") {
      notes["เอก"] = [{ text: highPair + "่" + rest, type: "high" }];
      notes["โท"] = [{ text: highPair + "้" + rest, type: "high" }];
      notes["จัตวา"] = [{ text: highPair + rest, type: "high" }];
    }
  }

  return { notes, info };
}