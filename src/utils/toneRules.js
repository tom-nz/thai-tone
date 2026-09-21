/**
 * =============================================================================
 * THAI LANGUAGE / TRIYANG (อักษร 3 หมู่) RULE ENGINE
 * Single Source of Truth สำหรับการวิเคราะห์และผันวรรณยุกต์
 * =============================================================================
 */

export const STRICT_THAI_SYLLABLE_PATTERN = /^[เแโใไ]?[ก-ฮ]{1,2}[ิีึืุูั็ํ]?[่้๊๋]?(?:[ายวอ]|ำ)?[ก-ฮ]?(?:ะ|์)?$/;

export const midConsonants = ["ก", "จ", "ด", "ต", "บ", "ป", "อ", "ฎ", "ฏ"];
export const highConsonants = ["ข", "ฃ", "ฉ", "ฐ", "ถ", "ผ", "ฝ", "ศ", "ษ", "ส", "ห"];
export const lowSingleConsonants = ["ง", "ญ", "ณ", "น", "ม", "ย", "ร", "ล", "ฬ", "ว"];

export const lowPairConsonants = [
  "ค", "ฅ", "ฆ", "ช", "ฌ", "ซ", "ฑ", "ฒ",
  "ท", "ธ", "พ", "ภ", "ฟ", "ฮ",
];

export const lowConsonants = [...lowPairConsonants, ...lowSingleConsonants];
export const allThaiConsonants = [...midConsonants, ...highConsonants, ...lowConsonants];

export const quickConsonants = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
  "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
  "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
  "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ",
];

export const trueClusters = [
  "กร", "กล", "กว", "ขร", "ขล", "ขว", "คร", "คล", "คว",
  "ตร", "ปร", "ปล", "พร", "พล", "ฟร", "ฟล",
];

export const leadingHoClusters = ["หง", "หญ", "หน", "หม", "หย", "หร", "หล", "หว"];
export const leadingOClusters = ["อย"];
export const falseClusters = ["ทร", "ศร", "สร", "จร", "ซร"];

export const thaiClusters = [
  ...trueClusters,
  ...leadingHoClusters,
  ...leadingOClusters,
  ...falseClusters,
];

export const longVowels = [
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

export const shortVowels = [
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

export const toneRows = [
  { id: 5, tone: "เสียงจัตวา", mark: "◌๋", leftPos: "80%" },
  { id: 4, tone: "เสียงตรี", mark: "◌๊", leftPos: "65%" },
  { id: 3, tone: "เสียงโท", mark: "◌้", leftPos: "52%" },
  { id: 2, tone: "เสียงเอก", mark: "◌่", leftPos: "40%" },
  { id: 1, tone: "เสียงสามัญ", mark: "-", leftPos: "28%" },
];

export const TONE_RULE_TABLE = Object.freeze({
  middle: {
    live: Object.freeze({ 1: "", 2: "่", 3: "้", 4: "๊", 5: "๋" }),
    dead: Object.freeze({ 2: "", 3: "้", 4: "๊", 5: "๋" }),
  },
  high: {
    live: Object.freeze({ 2: "่", 3: "้", 5: "" }),
    dead: Object.freeze({ 2: "", 3: "้" }),
  },
  low: {
    live: Object.freeze({ 1: "", 3: "่", 4: "้" }),
    deadShort: Object.freeze({ 3: "่", 4: "" }),
    deadLong: Object.freeze({ 3: "่", 4: "้" }),
  },
});

const lowToHighPair = Object.freeze({
  ค: "ข", ฅ: "ฃ", ฆ: "ข",
  ช: "ฉ", ฌ: "ฉ",
  ซ: "ศ",
  ฑ: "ฐ", ฒ: "ฐ", ท: "ถ", ธ: "ถ",
  พ: "ผ", ภ: "ผ",
  ฟ: "ฝ",
  ฮ: "ห",
});

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

export function getConsonantClass(initial = "", initialKind = "single") {
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

export function getPairedInitial(initial = "", initialKind = "single", targetClass = "high") {
  if (!initial) return "";
  if (initialKind === "leadingHo") {
    const base = initial[1] || "";
    return targetClass === "high" ? initial : base;
  }
  if (initialKind === "leadingO") return initial;

  const first = initial[0];
  const rest = initial.slice(1);

  if (targetClass === "high") {
    const high = highConsonants.includes(first)
      ? first
      : lowSingleConsonants.includes(first)
        ? `ห${first}`
        : lowToHighPair[first] || `ห${first}`;
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

export function isShortThaiVowel(frontVowel, aboveBelowVowel, rest) {
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

export function isDeadFinalConsonant(consonant = "") {
  return DEAD_FINAL_CONSONANTS.has(consonant);
}

export function getFinalConsonant(rest = "", frontVowel = "", aboveBelowVowel = "") {
  let finalPart = rest;
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

export function parseThaiWord(word = "") {
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

  return { initial, initialKind, frontVowel, aboveBelowVowel, toneMark, rest };
}

export function buildWord(frontVowel, initial, aboveBelowVowel, tone, rest) {
  const rawWord = `${frontVowel}${initial}${aboveBelowVowel}${tone}${rest}`;
  return rawWord
    .replace(/([่้๊๋])([ิีึืุูั็ํ])/g, "$2$1")
    .normalize("NFC");
}

export function analyzeSyllable(word, currentMode) {
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

  const finalConsonant = getFinalConsonant(rest, frontVowel, aboveBelowVowel);
  const isShort = isShortThaiVowel(frontVowel, aboveBelowVowel, rest);
  const hasPronouncedFinal = Boolean(finalConsonant);
  const isDead = hasPronouncedFinal ? isDeadFinalConsonant(finalConsonant) : isShort;

  const type = isDead ? "คำตาย" : "คำเป็น";
  const vowelLen = isShort ? "สระเสียงสั้น" : "สระเสียงยาว";
  const isCluster = initialKind === "trueCluster";
  const clusterLabel = isCluster ? ` (คำควบกล้ำแท้ "${initial}")` : "";

  const leadingLabel =
    initialKind === "leadingHo"
      ? ` (ห นำ "${initial}")`
      : initialKind === "leadingO"
        ? ` (อ นำ "${initial}")`
        : initialKind === "falseCluster"
          ? ` (กลุ่มอักษรควบไม่แท้ "${initial}")`
          : "";

  let desc;
  if (consonantClass === "middle") {
    desc = isDead
      ? `อักษรกลาง${clusterLabel}${leadingLabel} คำตาย (ผันได้ 4 เสียง: เอก, โท, ตรี, จัตวา; พื้นเสียงเอก)`
      : `อักษรกลาง${clusterLabel}${leadingLabel} คำเป็น (ผันได้ครบ 5 เสียง; พื้นเสียงสามัญ)`;
  } else if (consonantClass === "high") {
    desc = isDead
      ? `อักษรสูง${clusterLabel}${leadingLabel} คำตาย (ผันได้ 2 เสียง: เอก, โท; พื้นเสียงเอก)`
      : `อักษรสูง${clusterLabel}${leadingLabel} คำเป็น (ผันได้ 3 เสียง: เอก, โท, จัตวา; พื้นเสียงจัตวา)`;
  } else if (consonantClass === "low") {
    const lowSubtype = lowSingleConsonants.includes(primaryConsonant)
      ? "อักษรต่ำเดี่ยว"
      : "อักษรต่ำคู่";

    desc = isDead
      ? isShort
        ? `${lowSubtype}${clusterLabel}${leadingLabel} คำตายสระเสียงสั้น (ผันได้ 2 เสียง: โท, ตรี; พื้นเสียงตรี)`
        : `${lowSubtype}${clusterLabel}${leadingLabel} คำตายสระเสียงยาว (ผันได้ 2 เสียง: โท, ตรี; พื้นเสียงโท)`
      : `${lowSubtype}${clusterLabel}${leadingLabel} คำเป็น (ผันได้ 3 เสียง: สามัญ, โท, ตรี; พื้นเสียงสามัญ)`;
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

export function calculateTones(word, mode, colorMid, colorHigh, colorLow) {
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

  const singleRow = (id, consonant, mark, color, isComparison = false) => ({
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
      return singleRow(row.id, consonant, mark, color, isComparison);
    });

  const middleRules = isDead ? TONE_RULE_TABLE.middle.dead : TONE_RULE_TABLE.middle.live;

  if (consonantClass === "middle") {
    const fullRows = createRows(middleRules, initial, colorMid, false);
    if (mode === "highOnly") return fullRows.map((row) => ({ ...row, show: [5, 3, 2].includes(row.id) }));
    if (mode === "lowOnly") return fullRows.map((row) => ({ ...row, show: [4, 3, 1].includes(row.id) }));
    if (mode === "pair") return fullRows.map((row) => ({ ...row, show: [5, 1].includes(row.id) }));
    return fullRows;
  }

  const pairedHigh = consonantClass === "high" ? initial : getPairedInitial(initial, initialKind, "high");
  const pairedLow = consonantClass === "low" ? initial : getPairedInitial(initial, initialKind, "low");

  const highRules = isDead ? TONE_RULE_TABLE.high.dead : TONE_RULE_TABLE.high.live;
  const lowRules = isDead
    ? isShort ? TONE_RULE_TABLE.low.deadShort : TONE_RULE_TABLE.low.deadLong
    : TONE_RULE_TABLE.low.live;

  if (mode === "highOnly") return createRows(highRules, pairedHigh, colorHigh, consonantClass !== "high");
  if (mode === "lowOnly") return createRows(lowRules, pairedLow, colorLow, consonantClass !== "low");

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

    const uniqueEntries = entries.filter(
      (entry, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.consonant === entry.consonant &&
            candidate.mark === entry.mark,
        ) === index,
    );

    if (!uniqueEntries.length) return blankRow(toneRow.id, "#94a3b8");
    if (uniqueEntries.length === 1) {
      const entry = uniqueEntries[0];
      return singleRow(toneRow.id, entry.consonant, entry.mark, entry.color, entry.isComparison);
    }
    return multiToneRow(toneRow.id, uniqueEntries);
  });

  if (mode === "pair") {
    return combined.map((row) => ({ ...row, show: [5, 1].includes(row.id) }));
  }

  return combined;
}

export function validateEnteredToneMark(word = "") {
  const value = word.trim();
  if (!value) return { status: "idle", toneMark: "", message: "", detail: "" };

  const parsed = parseThaiWord(value);
  const analysis = analyzeSyllable(value, "full5");
  const baseWord = buildWord(parsed.frontVowel, parsed.initial, parsed.aboveBelowVowel, "", parsed.rest);
  const ruleMode =
    analysis.consonantClass === "middle"
      ? "full5"
      : analysis.consonantClass === "high"
        ? "highOnly"
        : "lowOnly";

  const candidates = calculateTones(baseWord, ruleMode, "#22c55e", "#ef4444", "#007bff");
  const candidateMatches = [];

  for (const row of candidates) {
    const words = row.isMulti ? row.multi.map((item) => item.text) : row.word ? [row.word] : [];
    if (words.includes(value)) candidateMatches.push(row);
  }

  if (parsed.toneMark) {
    if (candidateMatches.length > 0) {
      const toneNames = candidateMatches.map((row) => row.tone).join(" / ");
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
      detail: available ? `รูปที่ใช้ได้สำหรับคำนี้: ${available}` : "คำนี้ไม่มีกฎการผันที่ตรงกับรูปที่กรอก",
    };
  }

  if (candidateMatches.length > 0) {
    const toneNames = candidateMatches.map((row) => row.tone).join(" / ");
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

export function runToneRuleSelfTests() {
  const failures = [];
  const allUnique = new Set(allThaiConsonants);
  if (allThaiConsonants.length !== 44 || allUnique.size !== 44) {
    failures.push("จำนวนพยัญชนะไม่ครบ 44 ตัว");
  }
  if (failures.length > 0) {
    console.error("[Thai Tone Rule Engine] Self-test FAILED:", failures);
  } else if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.info("[Thai Tone Rule Engine] Self-test checks passed.");
  }
}
runToneRuleSelfTests();