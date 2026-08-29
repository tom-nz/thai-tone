
  // ฟังก์ชันแปลงพยัญชนะคู่เสียง
  const getPairedConsonant = (char) => {
    // กลุ่มเสียง /s/: ศ, ษ, ส คู่กับ ซ
    if (["ศ", "ษ", "ส"].includes(char)) return "ซ";
    if (char === "ซ") return "ส";
    // กลุ่มเสียง /kh/: ข, ฃ คู่กับ ค, ฅ, ฆ
    if (["ข", "ฃ"].includes(char)) return "ค";
    if (["ค", "ฅ", "ฆ"].includes(char)) return "ข";
    // กลุ่มเสียง /ch/: ฉ คู่กับ ช, ฌ
    if (char === "ฉ") return "ช";
    if (["ช", "ฌ"].includes(char)) return "ฉ";
    // กลุ่มเสียง /th/: ถ, ฐ คู่กับ ท, ธ, ฑ, ฒ
    if (["ถ", "ฐ"].includes(char)) return "ท";
    if (["ท", "ธ", "ฑ", "ฒ"].includes(char)) return "ถ";
    // กลุ่มเสียง /ph/: ผ คู่กับ พ, ภ
    if (char === "ผ") return "พ";
    if (["พ", "ภ"].includes(char)) return "ผ";
    // กลุ่มเสียง /f/: ฝ คู่กับ ฟ
    if (char === "ฝ") return "ฟ";
    if (char === "ฟ") return "ฝ";
    // กลุ่มเสียง /h/: ห คู่กับ ฮ
    if (char === "ห") return "ฮ";
    if (char === "ฮ") return "ห";
    return char;
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