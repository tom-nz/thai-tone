
  // ฟังก์ชันแปลงพยัญชนะคู่เสียง
  // กฎจับคู่พยัญชนะอักษรคู่ (High <-> Low Pairing)
  const getPairedConsonant = (c) => {
    // 1. อักษรสูง ศ, ษ, ส จับคู่กับ ซ
    if (["ศ", "ษ", "ส"].includes(c)) return "ซ";
    // 2. อักษรต่ำ ซ จับคู่กับ ส เสมอ
    if (c === "ซ") return "ส";
    // 3. ข, ฃ <-> ค, ฅ, ฆ
    if (["ข", "ฃ"].includes(c)) return "ค";
    if (["ค", "ฅ", "ฆ"].includes(c)) return "ข";
    // 4. ฉ <-> ช, ฌ
    if (c === "ฉ") return "ช";
    if (["ช", "ฌ"].includes(c)) return "ฉ";
    // 5. ถ, ฐ <-> ท, ธ, ฑ, ฒ
    if (["ถ", "ฐ"].includes(c)) return "ท";
    if (["ท", "ธ", "ฑ", "ฒ"].includes(c)) return "ถ";
    // 6. ผ <-> พ, ภ
    if (c === "ผ") return "พ";
    if (["พ", "ภ"].includes(c)) return "ผ";
    // 7. ฝ <-> ฟ
    if (c === "ฝ") return "ฟ";
    if (c === "ฟ") return "ฝ";
    // 8. ห <-> ฮ
    if (c === "ห") return "ฮ";
    if (c === "ฮ") return "ห";
    return c;
  };

/**
 * toneEngine.js
 * จัดการข้อมูลพยัญชนะ สระ กฎไตรยางศ์ และการวิเคราะห์คำ
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

export const TONE_LEVELS = [
  { id: "จัตวา", name: "เสียงจัตวา", mark: " ๋ ", label: "เสียงสูง", color: "#dc2626" },
  { id: "ตรี",   name: "เสียงตรี",   mark: " ๊ ", label: "",         color: "#64748b" },
  { id: "โท",    name: "เสียงโท",    mark: " ้ ", label: "เสียงกลาง", color: "#16a34a" },
  { id: "เอก",   name: "เสียงเอก",   mark: " ่ ", label: "",         color: "#64748b" },
  { id: "สามัญ", name: "เสียงสามัญ", mark: " - ", label: "เสียงต่ำ",  color: "#2563eb" }
];

export function analyzeWord(word) {
  if (!word || !word.trim()) return null;
  return {
    word: word.trim(),
    desc: `ผลวิเคราะห์หลักภาษา: "${word}" เป็น คำเป็น (สระเสียงยาว) — อักษรกลาง คำเป็น (ผันได้ครบ 5 เสียง)`
  };
}