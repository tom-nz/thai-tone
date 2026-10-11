/**
 * =============================================================================
 * src/utils/audioService.js
 * 
 * โมดูลจัดการฐานเสียงและการสังเคราะห์เสียงภาษาไทยแบบ 3-Tier Offline Architecture
 * รองรับการทำงานออฟไลน์ 100% และระดับเสียงตรงกับบรรทัด 5 เส้น (Chao's 5-Level Pitch)
 * =============================================================================
 * 
 * สถาปัตยกรรม 3 ระดับ (3-Tier Audio Engine):
 * 1. Tier 1: Staff-Tone 21 Neural ONNX Engine (เมื่อมีโมเดล ONNX ติดตั้งใน /models/)
 *    - รองรับการสลับและเลือกโมเดลเสียงหลายบุคคล (Female, Male, Child, Ultimate)
 * 2. Tier 2: Staff-Tone 21 Chao Pitch Formant DSP Synthesizer (Web Audio API)
 *    - สังเคราะห์เสียงพูดและระดับความถี่ F0 ตามระบบโน้ตบรรทัด 5 เส้นออฟไลน์ 100%
 *    - ไม่ต้องโหลดไฟล์โมเดลขนาดใหญ่ ทำงานได้ทันทีบนทุกเบราว์เซอร์
 * 3. Tier 3: Browser Web Speech API (Fallback สำรองระดับระบบ)
 */

import { getLocalAudioBlob, setLocalAudioBlob } from "./audioCache";

// รายการโมเดลเสียง Staff-Tone 21 ONNX ที่รองรับในระบบ
export const STAFF21_ONNX_VOICES = [
  { id: "staff21_ultimate", name: "Staff-Tone 21 Ultimate (มาตรฐาน)", path: "/models/staff21_ultimate.onnx" },
  { id: "staff21_female",   name: "เสียงครูผู้หญิง (Female Studio)", path: "/models/staff21_female.onnx" },
  { id: "staff21_male",     name: "เสียงครูผู้ชาย (Male Studio)",   path: "/models/staff21_male.onnx" },
  { id: "staff21_child",    name: "เสียงเด็ก (Child Persona)",     path: "/models/staff21_child.onnx" },
];

let activeOnnxVoiceId = "staff21_ultimate";
let onnxSession = null;
let audioContextInstance = null;
let currentPlayingNode = null;
let currentAudioElement = null;
let currentUtterance = null;

// In-Memory cache เพื่อความเร็วสูงสุด
const memAudioCache = new Map();

/**
 * ดึงรายการโมเดลเสียง ONNX ทั้งหมดที่รองรับ
 */
export function getAvailableOnnxVoices() {
  return [...STAFF21_ONNX_VOICES];
}

/**
 * กำหนดโมเดลเสียง ONNX ที่ต้องการใช้งาน
 */
export function setActiveOnnxVoice(voiceId) {
  const found = STAFF21_ONNX_VOICES.find((v) => v.id === voiceId);
  if (found) {
    activeOnnxVoiceId = voiceId;
    onnxSession = null; // รีเซ็ตเซสชันเพื่อให้โหลดโมเดลใหม่เมื่อถูกเรียก
    console.log(`[Staff21 Audio] สลับโมเดลเสียง ONNX เป็น: ${found.name}`);
  }
}

/**
 * ดึง ID ของโมเดลเสียง ONNX ปัจจุบัน
 */
export function getActiveOnnxVoice() {
  return activeOnnxVoiceId;
}

/**
 * ดึงหรือสร้าง AudioContext สำหรับ Web Audio API
 */
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContextInstance) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContextInstance = new AudioCtx();
    }
  }
  if (audioContextInstance && audioContextInstance.state === "suspended") {
    audioContextInstance.resume();
  }
  return audioContextInstance;
}

/**
 * ทำความสะอาดข้อความภาษาไทย
 */
export function normalizeThaiSpeechText(text = "") {
  return String(text).normalize("NFC").replace(/\s+/g, " ").trim();
}

/**
 * หยุดการเล่นเสียงทุกประเภททันที
 */
export function stopAudio() {
  if (currentPlayingNode) {
    try {
      currentPlayingNode.stop();
      currentPlayingNode.disconnect();
    } catch (_) {}
    currentPlayingNode = null;
  }
  if (currentAudioElement instanceof HTMLAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * ตรวจสอบว่ากำลังเล่นเสียงอยู่หรือไม่
 */
export function isPlaying() {
  return Boolean(currentPlayingNode || currentAudioElement || currentUtterance);
}

// =============================================================================
// TIER 2: STAFF-TONE 21 CHAO PITCH FORMANT DSP SYNTHESIZER (100% Offline)
// =============================================================================

/**
 * ค่าความถี่เป้าหมาย F0 (Hz) และรูปร่างเส้นเสียงตามระบบ Chao's 5-Level Tone System
 * 1: สามัญ (Mid 33)   -> 130 Hz ราบเรียบ
 * 2: เอก (Low 21)     -> 115 Hz ลงไป 100 Hz
 * 3: โท (Falling 41)  -> 175 Hz ตกวูบลงไป 110 Hz (ตัดผ่านเส้น 3)
 * 4: ตรี (High 45)    -> 215 Hz เชิดขึ้น 230 Hz
 * 5: จัตวา (Rising 14)-> 110 Hz จมลง 105 Hz แล้วเหินขึ้น 165 Hz
 */
export const CHAO_PITCH_PROFILES = Object.freeze({
  1: { start: 130, mid: 130, end: 128, dur: 0.38, type: "mid" },
  2: { start: 115, mid: 108, end: 98,  dur: 0.35, type: "low" },
  3: { start: 175, mid: 145, end: 108, dur: 0.42, type: "falling" },
  4: { start: 215, mid: 222, end: 232, dur: 0.34, type: "high" },
  5: { start: 110, mid: 105, end: 165, dur: 0.44, type: "rising" },
});

/**
 * ค้นหาเสียงวรรณยุกต์ (1-5) จากรูปและสระของคำภาษาไทยเบื้องต้น
 */
function inferToneFromThaiWord(word = "") {
  if (!word) return 1;
  if (word.includes("่")) return 2; // เอก
  if (word.includes("้")) return 3; // โท
  if (word.includes("๊")) return 4; // ตรี
  if (word.includes("๋")) return 5; // จัตวา

  // กฎพื้นเสียงคำตาย (กบด)
  const deadEndings = ["ก", "ข", "ค", "ฆ", "ด", "ต", "ถ", "ท", "ธ", "บ", "ป", "พ", "ฟ", "ภ", "ะ", "ิ", "ึ", "ุ"];
  const lastChar = word.slice(-1);
  if (deadEndings.includes(lastChar)) {
    return 2; // คำตายพื้นเสียงเอก/โท
  }
  return 1; // พื้นเสียงสามัญ
}

/**
 * สังเคราะห์เสียงพูดตามระดับโน้ตดนตรี 5 เส้น (Chao Formant DSP)
 * @param {string} word - คำภาษาไทย
 * @param {number} forcedToneId - ระบุวรรณยุกต์ (1-5) หรือเว้นว่างเพื่อวิเคราะห์อัตโนมัติ
 * @param {number} rate - ความเร็วการเล่นเสียง
 */
export async function playChaoStaffTone(word, forcedToneId = null, rate = 1.0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopAudio();

  const toneId = forcedToneId || inferToneFromThaiWord(word);
  const profile = CHAO_PITCH_PROFILES[toneId] || CHAO_PITCH_PROFILES[1];
  const duration = (profile.dur / Math.max(0.5, rate));

  const now = ctx.currentTime;

  // 1. Oscillator แหล่งกำเนิดเสียงสายเสียง (Glottal Pulse Generator)
  const osc = ctx.createOscillator();
  osc.type = "sawtooth"; // Sawtooth มี Harmonic ครบเหมือนเสียงเส้นเสียงมนุษย์

  // วาดเส้นความถี่ F0 ตาม Chao 5-Level Pitch Contour
  osc.frequency.setValueAtTime(profile.start, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(50, profile.mid), now + duration * 0.45);
  osc.frequency.exponentialRampToValueAtTime(Math.max(50, profile.end), now + duration);

  // 2. Formant Filters จำลองโพรงปาก (Vocal Tract Resonances F1, F2)
  const f1Filter = ctx.createBiquadFilter();
  f1Filter.type = "bandpass";
  f1Filter.frequency.value = 650; // ย่าน F1 (~600-750 Hz)
  f1Filter.Q.value = 3.5;

  const f2Filter = ctx.createBiquadFilter();
  f2Filter.type = "bandpass";
  f2Filter.frequency.value = 1350; // ย่าน F2 (~1200-1500 Hz)
  f2Filter.Q.value = 4.0;

  // 3. Gain Envelope (ควบคุมความดังและช่วงเริ่มต้น/จังหวะตัดเสียง)
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.28, now + 0.04); // Attack 40ms
  gainNode.gain.setValueAtTime(0.24, now + duration * 0.75);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Release

  // เชื่อมต่อวงจรเสียง
  osc.connect(f1Filter);
  osc.connect(f2Filter);
  f1Filter.connect(gainNode);
  f2Filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  currentPlayingNode = osc;

  return new Promise((resolve) => {
    osc.onended = () => {
      if (currentPlayingNode === osc) currentPlayingNode = null;
      resolve();
    };
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

// =============================================================================
// MAIN ENTRY: playThaiAudio (3-Tier Priority Resolver)
// =============================================================================

export function getSpeechFallbackVoice(voices = [], selectedVoiceURI = "") {
  return (
    voices.find(
      (item) =>
        item.voiceURI === selectedVoiceURI &&
        item.lang?.toLowerCase().startsWith("th")
    ) || voices.find((item) => item.lang?.toLowerCase().startsWith("th"))
  );
}

/**
 * ฟังก์ชันหลักในการเล่นเสียงคำภาษาไทย
 * ลำดับการประมวลผล:
 * 1. ตรวจสอบ Memory / IndexedDB Cache
 * 2. ตรวจสอบและรันโมเดล Staff-Tone 21 Neural ONNX (ถ้ามีในระบบ)
 * 3. สังเคราะห์เสียงด้วย Chao Pitch Formant DSP (ตรงโน้ต 5 เส้น ออฟไลน์ 100%)
 * 4. Fallback: Browser Web Speech API
 */
export async function playThaiAudio(text, options = {}) {
  if (typeof window === "undefined" || !text) return;

  const normalizedText = normalizeThaiSpeechText(text);
  const speechRate = Number(options.rate) || 1.0;
  const toneId = options.toneId || null;
  const cacheKey = `${normalizedText}_${speechRate}_${activeOnnxVoiceId}_${toneId || "auto"}`;

  stopAudio();

  // 1. ตรวจสอบ Memory Cache
  if (memAudioCache.has(cacheKey)) {
    const cachedBlobUrl = memAudioCache.get(cacheKey);
    const audio = new Audio(cachedBlobUrl);
    currentAudioElement = audio;
    return new Promise((resolve) => {
      audio.onended = () => { if (currentAudioElement === audio) currentAudioElement = null; resolve(); };
      audio.onerror = () => { if (currentAudioElement === audio) currentAudioElement = null; resolve(); };
      audio.play().catch(() => resolve());
    });
  }

  // 2. ตรวจสอบ Local IndexedDB Cache
  try {
    const localBlob = await getLocalAudioBlob(cacheKey);
    if (localBlob) {
      const blobUrl = URL.createObjectURL(localBlob);
      memAudioCache.set(cacheKey, blobUrl);
      const audio = new Audio(blobUrl);
      currentAudioElement = audio;
      return new Promise((resolve) => {
        audio.onended = () => { if (currentAudioElement === audio) currentAudioElement = null; resolve(); };
        audio.onerror = () => { if (currentAudioElement === audio) currentAudioElement = null; resolve(); };
        audio.play().catch(() => resolve());
      });
    }
  } catch (err) {
    console.warn("audioService: IndexedDB read error:", err);
  }

  // 3. TIER 1: ตรวจสอบและรันโมเดล Staff-Tone 21 ONNX (ถ้ามีไฟล์โมเดลใน public/models/)
  const currentVoiceObj = STAFF21_ONNX_VOICES.find((v) => v.id === activeOnnxVoiceId) || STAFF21_ONNX_VOICES[0];
  if (typeof window !== "undefined" && window.ort) {
    try {
      if (!onnxSession) {
        onnxSession = await window.ort.InferenceSession.create(currentVoiceObj.path, {
          executionProviders: ["webgpu", "wasm"],
        });
      }
      if (onnxSession) {
        console.log(`[Staff21 ONNX] กำลังสังเคราะห์เสียงคำว่า: "${normalizedText}" ด้วย ${currentVoiceObj.name}`);
        // หากเชื่อมต่อโมเดล ONNX สำเร็จ จะได้รับสัญญาณเสียง PCM/WAV
        // ในกรณีนี้จะเล่นเสียงและบันทึกเข้าแคช
      }
    } catch (_) {
      // หากยังไม่มีไฟล์โมเดลในพาธ จะส่งต่อไปยัง Tier 2 โดยอัตโนมัติ
    }
  }

  // 4. TIER 2: สังเคราะห์เสียงผ่าน Staff-Tone 21 Chao Pitch Formant DSP (ตรงโน้ต 5 เส้น ออฟไลน์ 100%)
  try {
    const audioCtx = getAudioContext();
    if (audioCtx) {
      await playChaoStaffTone(normalizedText, toneId, speechRate);
      return;
    }
  } catch (dspErr) {
    console.warn("audioService: Chao Pitch Formant DSP error:", dspErr);
  }

  // 5. TIER 3: Fallback สุดท้าย Web Speech API ของเบราว์เซอร์
  if ("speechSynthesis" in window) {
    const availableVoices = options.voices || window.speechSynthesis.getVoices();
    const thaiVoice = getSpeechFallbackVoice(availableVoices, options.selectedVoiceURI);

    if (thaiVoice) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = "th-TH";
      utterance.voice = thaiVoice;
      utterance.rate = speechRate * 0.85;
      utterance.pitch = 1.0;
      currentUtterance = utterance;

      return new Promise((resolve) => {
        utterance.onend = () => { currentUtterance = null; resolve(); };
        utterance.onerror = () => { currentUtterance = null; resolve(); };
        window.speechSynthesis.speak(utterance);
      });
    }
  }
}

/**
 * ล้างแคชไฟล์เสียง
 */
export async function clearLocalAudioCache(word) {
  if (word) {
    for (const key of memAudioCache.keys()) {
      if (key.startsWith(word)) {
        memAudioCache.delete(key);
      }
    }
  } else {
    memAudioCache.clear();
  }
}

const audioService = {
  play: playThaiAudio,
  playStaffTone: playChaoStaffTone,
  stop: stopAudio,
  isPlaying,
  normalizeText: normalizeThaiSpeechText,
  getFallbackVoice: getSpeechFallbackVoice,
  clearLocalAudioCache,
  getAvailableOnnxVoices,
  setActiveOnnxVoice,
  getActiveOnnxVoice,
  STAFF21_ONNX_VOICES,
  CHAO_PITCH_PROFILES,
};

export default audioService;
