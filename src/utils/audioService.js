
audioService.js

100%
/**
 * src/utils/audioService.js
 * 
 * โมดูลจัดการฐานเสียงและบริการออกเสียงภาษาไทย (Thai Audio Service)
 * ออกแบบสำหรับใช้งานร่วมกับ Cloudflare Pages และ Azure Speech API
 * 
 * คุณสมบัติ:
 * 1. ฐานเสียงหลัก: Azure Speech ผ่าน Cloudflare Pages Function (/api/tts)
 * 2. ระบบ In-Memory Audio Caching เพื่อให้การเล่นเสียงซ้ำทำได้ทันทีโดยไม่ต้องโหลดใหม่
 * 3. ฐานเสียงสำรอง: Browser Web Speech API (คัดกรองเฉพาะเสียงภาษาไทย th-TH / th-*)
 * 4. จัดการเสียงแบบ Promise-based รอจนกว่าเสียงจะพูดจบจริง รองรับการเล่นแบบวนลำดับอัตโนมัติ
 * 5. ฟังก์ชัน stopAudio() สำหรับตัดเสียงทันทีเมื่อเปลี่ยนคำหรือกดยกเลิก
 */

const TTS_API_ENDPOINT = "/api/tts";
const DEFAULT_VOICE = "th-TH-PremwadeeNeural";

// แคชจัดเก็บ Object URL ของไฟล์เสียงเพื่อป้องกันการเรียก Network ซ้ำ
const audioCache = new Map();

let currentAudio = null;
let currentUtterance = null;

export function normalizeThaiSpeechText(text = "") {
  return String(text)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

export function stopAudio() {
  if (currentAudio instanceof HTMLAudioElement) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function getSpeechFallbackVoice(voices = [], selectedVoiceURI = "") {
  return (
    voices.find(
      (item) =>
        item.voiceURI === selectedVoiceURI &&
        item.lang?.toLowerCase().startsWith("th"),
    ) ||
    voices.find((item) => item.lang?.toLowerCase().startsWith("th"))
  );
}

/**
 * ออกเสียงคำภาษาไทยผ่านฐานเสียง Cloudflare / Azure พร้อมระบบ Fallback
 * @param {string} text - คำหรือข้อความที่ต้องการออกเสียง
 * @param {object} options - { rate: number, voice: string, selectedVoiceURI: string, voices: Array }
 * @returns {Promise<void>} resolve เมื่อเสียงพูดจบประโยคสมบูรณ์
 */
export async function playThaiAudio(text, options = {}) {
  if (typeof window === "undefined" || !text) return;

  const normalizedText = normalizeThaiSpeechText(text);
  const speechRate = Number(options.rate) || 0.85;
  const voice = options.voice || DEFAULT_VOICE;

  // หยุดเสียงเดิมที่กำลังเล่นอยู่ก่อน
  stopAudio();

  // 1. ตรวจสอบใน Audio Cache (หากเคยเล่นแล้ว ให้เล่นจากแคชทันที)
  const cacheKey = `${normalizedText}_${speechRate}_${voice}`;
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey);
    const audio = new Audio(cachedUrl);
    currentAudio = audio;

    return new Promise((resolve) => {
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  }

  // 2. เรียกฐานเสียงหลัก: Cloudflare Pages Function (/api/tts -> Azure Neural)
  try {
    const response = await fetch(TTS_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: normalizedText,
        voice,
        rate: speechRate,
      }),
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioCache.set(cacheKey, audioUrl);

      const audio = new Audio(audioUrl);
      currentAudio = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    }
  } catch (err) {
    console.warn("audioService: Primary TTS endpoint failed, using fallback:", err);
  }

  // 3. ฐานเสียงสำรอง: Web Speech API ของเบราว์เซอร์
  if ("speechSynthesis" in window) {
    const availableVoices = options.voices || window.speechSynthesis.getVoices();
    const thaiVoice = getSpeechFallbackVoice(availableVoices, options.selectedVoiceURI);

    if (!thaiVoice) {
      console.warn("audioService: ไม่พบเสียงภาษาไทยในระบบ");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = "th-TH";
    utterance.voice = thaiVoice;
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    currentUtterance = utterance;

    return new Promise((resolve) => {
      utterance.onend = () => {
        currentUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        currentUtterance = null;
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }
}

const audioService = {
  play: playThaiAudio,
  stop: stopAudio,
  normalizeText: normalizeThaiSpeechText,
  getFallbackVoice: getSpeechFallbackVoice,
};

export default audioService;
กำลังแสดง audioService.js