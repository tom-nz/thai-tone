// 1. นำเข้าไฟล์ AuthModal ด้านบนสุด
import "@fontsource/sarabun/400.css";
import "@fontsource/sarabun/500.css";
import "@fontsource/sarabun/600.css";
import "@fontsource/sarabun/700.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import AuthModal from "./components/AuthModal";

export default function App() {
  // ... state เดิมของคุณ เช่น lang, mode, viewLayout ...[cite: 2]

  // 2. เพิ่ม State สำหรับเก็บสถานะ Login และเปิดปิด Modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div>
      {/* 3. ปุ่ม Login ที่แถบด้านบน (Navbar) */}
      <header style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px" }}>
        {currentUser ? (
          <div>
            <span>สวัสดี, {currentUser.name} </span>
            <button onClick={() => setCurrentUser(null)}>ออกจากระบบ</button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAuthOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </button>
        )}
      </header>

      {/* ส่วนเนื้อหาหลักเดิมของ App */}

      {/* 4. ใส่ AuthModal วางไว้ด้านล่างสุด */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

import {
  clearAllLocalAudioBlobs,
  deleteLocalAudioBlob,
  getLocalAudioBlob,
  setLocalAudioBlob,
} from "./utils/audioCache";
import { autoCorrelate, classifyToneContour } from "./utils/pitchDetector";
import {
  analyzeSyllable,
  calculateTones,
  STRICT_THAI_SYLLABLE_PATTERN,
  toneRows,
  validateEnteredToneMark,
} from "./utils/toneRules";

import ControlPanel from "./components/ControlPanel";
import ToneBoard from "./components/ToneBoard";

/**
 * =============================================================================
 * 1. THAI LANGUAGE / TRIYANG (อักษร 3 หมู่) RULEBOOK FOR THIS APPLICATION
 * =============================================================================
 *
 * จุดประสงค์:
 *    ส่วนนี้เป็น "single source of truth" สำหรับ AI และผู้พัฒนาโปรแกรม
 *    เพื่อป้องกันการแก้ logic การผันวรรณยุกต์โดยอาศัยการคาดเดาเฉพาะกรณี
 *
 * 1) ไตรยางศ์ = การแบ่งพยัญชนะไทยตามหลักการผันวรรณยุกต์เป็น 3 หมู่
 *     อักษรกลาง 9 ตัว: ก จ ฎ ฏ ด ต บ ป อ
 *     อักษรสูง 11 ตัว: ข ฃ ฉ ฐ ถ ผ ฝ ศ ษ ส ห
 *     อักษรต่ำ 24 ตัว แบ่งเป็น:
 *       - ต่ำคู่ 14 ตัว: ค ฅ ฆ ช ฌ ซ ฑ ฒ ท ธ พ ภ ฟ ฮ
 *       - ต่ำเดี่ยว 10 ตัว: ง ญ ณ น ม ย ร ล ว ฬ
 *     รวมทั้งหมด 44 ตัวพอดี (9 + 11 + 14 + 10 = 44)
 *
 * 2) "พื้นเสียง" คือเสียงของพยางค์เมื่อไม่มีรูปวรรณยุกต์กำกับ
 *     - อักษรสูง: คำเป็น -> จัตวา, คำตาย -> เอก
 *     - อักษรกลาง: คำเป็น -> สามัญ, คำตาย -> เอก
 *     - อักษรต่ำ: คำเป็น -> สามัญ, คำตายสระสั้น -> ตรี, คำตายสระยาว -> โท
 *
 * 3) จำนวน "เสียง" ที่ผันได้ไม่เท่ากับจำนวนรูปวรรณยุกต์ (่ ้ ๊ ๋)
 *     การผันจริงขึ้นกับ: หมู่อักษร, คำเป็น/คำตาย, สระสั้น/ยาว, มาตราตัวสะกด (กบด vs นมยวง)
 *
 * 4) ตารางแกนหลักที่ใช้ใน Rule Engine
 *     - อักษรกลาง: คำเป็น 5 เสียง, คำตาย 4 เสียง (เอก, โท, ตรี, จัตวา)
 *     - อักษรสูง: คำเป็น 3 เสียง (เอก, โท, จัตวา), คำตาย 2 เสียง (เอก, โท)
 *     - อักษรต่ำ: คำเป็น 3 เสียง (สามัญ, โท, ตรี), คำตายสระสั้น 2 เสียง (โท, ตรี), คำตายสระยาว 2 เสียง (โท, ตรี)
 *
 * 5) คำเป็น / คำตาย
 *     - คำตาย: สระสั้นไม่มีตัวสะกด หรือ สะกดด้วยแม่กก แม่กด แม่กบ (กบด)
 *     - คำเป็น: สระยาวไม่มีตัวสะกด หรือ สะกดด้วยแม่กง แม่กน แม่กม แม่เกย แม่เกอว (นมยวง)
 *
 * 6) อักษรต่ำคู่ / ต่ำเดี่ยว: ต่ำคู่มีอักษรสูงช่วยเทียบเสียง, ต่ำเดี่ยวใช้ "ห-นำ" ช่วยผัน
 * 7) Rule Engine ต้องเป็นแหล่งความจริงหลัก: calculateTones() และ analyzeSyllable()
 * 8) TONE_RULE_SELF_TESTS ใน utils/toneRules.js ทำหน้าที่ regression test 16 เคสหลัก
 *
 * =============================================================================
 * 2. MODULAR SYSTEM ARCHITECTURE & INTER-MODULE COMMUNICATION FLOW
 * =============================================================================
 *
 *                    ┌────────────────────────────────────────────────┐
 *                    │              src/App.jsx (Main Hub)            │
 *                    │ - Master State: inputText, mode, linesData     │
 *                    │ - Web Audio API & Microphone Pitch Engine      │
 *                    │ - Dual Screen Sync (BroadcastChannel)          │
 *                    └───────┬───────────────────┬────────────────┬───┘
 *                            │                   │                │
 *         ┌──────────────────┘                   │                └──────────────────┐
 *         │ Props: linesData,                    │ Props: input,                     │ Props: linesData,
 *         │ activeRowId, mode,                   │ quickPadClick,                    │ audio callbacks
 *         │ audio handlers                       │ layout setters                    │
 *         ▼                                      ▼                                   ▼
 *  ┌───────────────┐                      ┌───────────────┐                   ┌───────────────┐
 *  │ ToneBoard.jsx │                      │ControlPanel.js│                   │StaffQuizMode.j│
 *  │ - 5-Line Staff│                      │ - 44 Cons Pad │                   │ - Drag & Drop │
 *  │ - Note Heads  │                      │ - Vowel Pad   │                   │ - Score (2,1,0│
 *  │ - Analysis Box│                      │ - Sound Vault │                   │ - Reset to org│
 *  └───────┬───────┘                      └───────┬───────┘                   └───────┬───────┘
 *          │                                      │                                   │
 *          └───────────────────────┬──────────────┴───────────────────────────────────┘
 *                                  ▼
 *                  ┌─────────────────────────────────────┐
 *                  │      SHARED UTILITIES & ENGINES     │
 *                  │ 1. utils/toneRules.js:              │
 *                  │    Rule Engine, parser, tests       │
 *                  │ 2. utils/audioCache.js:             │
 *                  │    IndexedDB multi-tier client cache│
 *                  │ 3. utils/pitchDetector.js:          │
 *                  │    autoCorrelate & contour classifier│
 *                  └─────────────────────────────────────┘
 *
 * =============================================================================
 * 3. DETAILED WORKFLOW & STATE MACHINES
 * =============================================================================
 *
 * [A] เริ่มต้นโปรแกรม (Initial Boot):
 *     1. inputText = "" -> บรรทัด 5 เส้นว่างเปล่า ไม่มีวงกลมคำ
 *     2. ซ่อนกล่องวิเคราะห์หลักภาษา และไม่มีข้อความคำว่า "รูปวรรณยุกต์"
 *     3. ชื่อระดับเสียงหน้าเส้นแสดงเป็นสีดำ (#1e293b) เสมอทุกอุปกรณ์
 *     4. สามารถคลิกที่เส้นเปล่าเพื่อขยาย/ย่อ (Active) ได้ตามปกติ
 *
 * [B] เมื่อผันคำ (Word Inflection):
 *     1. ข้อความหน้าเส้น (เสียงเอก [ ่ ]) เปลี่ยนเป็นสีประจำหมู่อักษร
 *     2. เส้นที่ 3 สำหรับคำคู่เทียบ (เสียงโท) จะแสดงเป็นสีของอักษรต่ำ (#007bff)
 *     3. ตัวโน้ตคำศัพท์แสดงบนเส้นบรรทัดตามตำแหน่งระดับเสียง
 *
 * [C] สลับโหมดแบบฝึกหัดวางคำ (Staff Quiz Mode):
 *     1. บรรทัด 5 เส้นจะว่างเปล่าทันที (ซ่อนคำเดิมทั้งหมด)
 *     2. สีเส้นบรรทัดและตัวเลขเป็นสีเทากลาง (#94a3b8) ป้องกันการเดาหมู่อักษร
 *     3. สุ่มคำถามแบบกระจาย 3 หมู่อักษร (กลาง, สูง, ต่ำ) ไม่ให้ซ้ำกลุ่มเดิม
 *     4. วงกลมคำถามล่างจอมีขนาดมาตรฐาน (48px) และเป็นสีส้มปริศนา (#f97316)
 *     5. ปล่อยเมาส์/นิ้วหลุดมือ -> ดีดกลับแท่นวางเริ่มต้นล่างจอเสมอ
 *     6. ปุ่ม "ฝึกออกเสียง" จะถูก Disabled และ Dimmed จางลง
 *
 * [D] สลับโหมดฝึกออกเสียง (Practice Mode):
 *     1. ปุ่ม "วางคำบนเส้นบรรทัด" จะถูก Disabled และ Dimmed จางลง
 *     2. ตรวจจับเส้นเสียงไมโครโฟน F0 -> Contour Matching
 * =============================================================================
 */

const CHANNEL_NAME = "thai_tone_sync_channel";
const STORAGE_KEY = "thai_tone_live_sync_data";
const TTS_API_ENDPOINT = "/api/tts";
const WORDS_API_ENDPOINT = "/api/words";
const TTS_VOICE = "th-TH-PremwadeeNeural";

function getSpeechText(item) {
  if (!item?.show) return "";
  if (item.isMulti) return item.multi[0]?.ttsText || item.multi[0]?.text || "";
  return item.ttsText || item.word || "";
}

function normalizeThaiSpeechText(text = "") {
  return String(text).normalize("NFC").replace(/\s+/g, " ").trim();
}

function getSpeechFallbackVoice(voices = [], selectedVoiceURI = "") {
  return (
    voices.find(
      (item) =>
        item.voiceURI === selectedVoiceURI &&
        item.lang?.toLowerCase().startsWith("th"),
    ) || voices.find((item) => item.lang?.toLowerCase().startsWith("th"))
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

  // เริ่มต้นโปรแกรมด้วยค่าว่าง เพื่อให้บรรทัด 5 เส้นว่างเปล่าและไม่มีคำ
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

  // สถานะโหมดฝึกออกเสียง
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);
  const [totalPossibleScore, setTotalPossibleScore] = useState(0);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [practiceTimer, setPracticeTimer] = useState(10);
  const [practiceMsg, setPracticeMsg] = useState("");
  const [practiceTargetWord, setPracticeTargetWord] = useState(null);
  const [mismatchWord, setMismatchWord] = useState(null);

  // สถานะโหมดแบบฝึกหัดวางคำบนเส้นบรรทัด 5 เส้น
  const [isQuizMode, setIsQuizMode] = useState(false);

  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const practiceQueueRef = useRef([]);
  const currentIdxRef = useRef(0);
  const isWaitingCorrectionRef = useRef(false);
  const matchCountRef = useRef(0);
  const animFrameRef = useRef(null);
  const pitchBufferRef = useRef([]);
  const isTransitioningRef = useRef(false);
  const mismatchDebounceRef = useRef(0);
  const lastMismatchToneRef = useRef(null);

  const [soundManagerOpen, setSoundManagerOpen] = useState(false);
  const [soundWords, setSoundWords] = useState([]);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [soundSearch, setSoundSearch] = useState("");
  const [newSoundWord, setNewSoundWord] = useState("");

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

  const [analysisInfo, setAnalysisInfo] = useState(() => analyzeSyllable("", "full5"));
  const [linesData, setLinesData] = useState(() => calculateTones("", "full5", "#22c55e", "#ef4444", "#007bff"));
  const [toneValidation, setToneValidation] = useState(() => validateEnteredToneMark(""));

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
    if (typeof window === "undefined" || (!speechEnabled && !force) || !text) return;
    const normalizedText = normalizeThaiSpeechText(text);
    const cacheKey = normalizedText;

    const playAudioBlob = async (blob) => {
      const audioUrl = URL.createObjectURL(blob);
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
          if (speechRef.current === audio) speechRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    };

    try {
      const localBlob = await getLocalAudioBlob(cacheKey);
      if (localBlob) {
        await playAudioBlob(localBlob);
        return;
      }
    } catch (err) {
      console.warn("Local audio cache read error:", err);
    }

    try {
      const response = await fetch(TTS_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: normalizedText,
          voice: TTS_VOICE,
          rate: Number(speechRate),
        }),
      });

      if (!response.ok) throw new Error(`Azure TTS HTTP ${response.status}`);

      const audioBlob = await response.blob();
      setLocalAudioBlob(cacheKey, audioBlob);
      await playAudioBlob(audioBlob);
      return;
    } catch (err) {
      console.warn("Azure Thai TTS fallback:", err);
    }

    const availableVoices = window.speechSynthesis.getVoices();
    const thaiVoice = getSpeechFallbackVoice(availableVoices, selectedVoiceURI);
    if (!thaiVoice) return;

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

  const handleTogglePractice = () => {
    if (isPracticing) {
      cancelPractice();
    } else {
      if (isQuizMode) setIsQuizMode(false);
      startPractice();
    }
  };

  const handleSkipWord = () => {
    if (!isPracticing || isTransitioningRef.current) return;
    clearInterval(timerRef.current);
    isTransitioningRef.current = true;
    setPracticeTargetWord(null);
    pitchBufferRef.current = [];
    matchCountRef.current = 0;
    mismatchDebounceRef.current = 0;
    currentIdxRef.current += 1;

    if (currentIdxRef.current < practiceQueueRef.current.length) {
      setPracticeMsg(t("กำลังเปลี่ยนคำ...", "Changing word..."));
      setTimeout(() => loadNextPracticeWord(), 700);
    } else {
      finishPractice();
    }
  };

  const startPractice = async () => {
    if (isPlayingAll) {
      isCancelingAutoPlayRef.current = true;
      setIsPlayingAll(false);
    }
    setActiveRowId(null);

    const wordsOnScreen = [];
    const sortedRows = [...linesData].filter((l) => l.show).sort((a, b) => a.id - b.id);

    sortedRows.forEach((row) => {
      if (row.isMulti) {
        row.multi.forEach((m) => {
          if (m.text) wordsOnScreen.push({ word: m.text, toneId: row.id });
        });
      } else if (row.word) {
        wordsOnScreen.push({ word: row.word, toneId: row.id });
      }
    });

    if (wordsOnScreen.length === 0) {
      alert(t("ไม่พบคำสำหรับฝึก กรุณาพิมพ์คำหรือเลือกโหมดก่อนค่ะ", "No words to practice. Please select a word."));
      return;
    }

    practiceQueueRef.current = wordsOnScreen;
    currentIdxRef.current = 0;
    setPracticeScore(0);
    setTotalPossibleScore(wordsOnScreen.length * 10);
    setPracticeCompleted(false);
    pitchBufferRef.current = [];
    isTransitioningRef.current = false;
    setIsPracticing(true);

    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current.createMediaStreamSource(micStreamRef.current).connect(analyserRef.current);

      loadNextPracticeWord();
      runAudioDetectionLoop();
    } catch (err) {
      alert(t("ไม่สามารถเข้าถึงไมโครโฟนได้: " + err.message, "Microphone access denied: " + err.message));
      cancelPractice();
    }
  };

  const loadNextPracticeWord = () => {
    const current = practiceQueueRef.current[currentIdxRef.current];
    if (!current) return;
    setPracticeTargetWord(current.word);
    setPracticeTimer(10);
    isWaitingCorrectionRef.current = false;
    matchCountRef.current = 0;
    mismatchDebounceRef.current = 0;
    pitchBufferRef.current = [];
    isTransitioningRef.current = false;
    setPracticeMsg(t(`กรุณาออกเสียง: "${current.word}"`, `Please say: "${current.word}"`));

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPracticeTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handlePracticeTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePracticeTimeout = () => {
    isWaitingCorrectionRef.current = true;
    const current = practiceQueueRef.current[currentIdxRef.current];
    if (!current) return;
    setPracticeMsg(t(`ยังไม่ถูกต้อง ฟังเสียงต้นแบบแล้วออกเสียงตามนะคะ`, `Listen to sample and repeat`));
    speak(current.word, true);
  };

  const finishPractice = () => {
    clearInterval(timerRef.current);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((track) => track.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
    setPracticeTargetWord(null);
    setMismatchWord(null);
    setPracticeMsg("");
    pitchBufferRef.current = [];
    isTransitioningRef.current = false;
    setPracticeCompleted(true);
  };

  const runAudioDetectionLoop = () => {
    const buffer = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
      if (isTransitioningRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      analyserRef.current.getFloatTimeDomainData(buffer);
      const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

      if (freq !== -1) {
        pitchBufferRef.current.push(freq);
        if (pitchBufferRef.current.length > 25) pitchBufferRef.current.shift();

        const detectedToneId = classifyToneContour(pitchBufferRef.current);

        if (detectedToneId) {
          const current = practiceQueueRef.current[currentIdxRef.current];
          if (current) {
            if (detectedToneId === current.toneId) {
              matchCountRef.current += 1;
              if (matchCountRef.current >= 7) {
                clearInterval(timerRef.current);
                isTransitioningRef.current = true;

                if (!isWaitingCorrectionRef.current) setPracticeScore((prev) => prev + 10);
                setPracticeTargetWord(null);
                setPracticeMsg(t("✅ ถูกต้อง!", "✅ Correct!"));
                currentIdxRef.current += 1;

                setTimeout(() => {
                  if (currentIdxRef.current < practiceQueueRef.current.length) {
                    loadNextPracticeWord();
                  } else {
                    finishPractice();
                  }
                }, 800);
              }
            } else {
              if (lastMismatchToneRef.current === detectedToneId) {
                mismatchDebounceRef.current += 1;
              } else {
                lastMismatchToneRef.current = detectedToneId;
                mismatchDebounceRef.current = 1;
              }

              if (mismatchDebounceRef.current >= 5) {
                practiceQueueRef.current.forEach((item, idx) => {
                  if (idx !== currentIdxRef.current && item.toneId === detectedToneId) {
                    setMismatchWord(item.word);
                    setTimeout(() => setMismatchWord(null), 380);
                  }
                });
                mismatchDebounceRef.current = 0;
              }
            }
          }
        }
      } else {
        if (pitchBufferRef.current.length > 0) {
          pitchBufferRef.current = [];
          matchCountRef.current = 0;
          mismatchDebounceRef.current = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  };

  const cancelPractice = () => {
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((track) => track.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();

    setIsPracticing(false);
    setPracticeTargetWord(null);
    setMismatchWord(null);
    setPracticeScore(0);
    setPracticeMsg("");
    setPracticeCompleted(false);
    pitchBufferRef.current = [];
    isTransitioningRef.current = false;
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((track) => track.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
    };
  }, []);

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
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      setActiveRowId(null);
      setIsPlayingAll(false);
      return;
    }

    let targetSequence = [1, 2, 3, 4, 5];
    if (mode === "pair") targetSequence = [5, 1];
    else if (mode === "highOnly") targetSequence = [5, 2, 3];
    else if (mode === "lowOnly") targetSequence = [1, 3, 4];

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
      if (textToSpeak) await speak(textToSpeak, true);
      if (isCancelingAutoPlayRef.current) break;
      await new Promise((resolve) => setTimeout(resolve, 320));
    }

    setActiveRowId(null);
    setIsPlayingAll(false);
    isCancelingAutoPlayRef.current = false;
  };

  // ปรับให้สามารถคลิก Active ขยายย่อเส้นบรรทัดได้เสมอแม้ไม่มีคำ
  const handleRowClick = (item) => {
    if (isPracticing || isQuizMode) return;
    const isExpanding = activeRowId !== item.id;
    setActiveRowId(isExpanding ? item.id : null);
    if (isExpanding) {
      const wordToSpeak = getSpeechText(item);
      if (wordToSpeak) speak(wordToSpeak);
    }
  };

  const validateInput = (word) => {
    const value = word.trim();
    if (!value) {
      setToneValidation(validateEnteredToneMark(""));
      setInputError("");
      return false;
    }
    if (/\s/.test(value)) {
      setToneValidation(validateEnteredToneMark(""));
      setInputError("กรุณากรอกเพียง 1 คำเท่านั้น ห้ามเว้นวรรค");
      return false;
    }
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

    const activeKey = customApiKey.trim();
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
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonText = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed) || parsed.length !== 5) throw new Error("Invalid AI response");

      const formatted = parsed.map((item, index) => {
        const base = toneRows[index];
        const color = item.type === "high" ? colorHigh : item.type === "low" ? colorLow : colorMid;
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
      let pairWord = "ขอ";
      if (inputText.trim() !== "") {
        const match = inputText.match(/([ก-ฮ])/);
        if (match) pairWord = `${match[1]}อ`;
      }
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
    const info = analyzeSyllable(inputText, mode);
    const newWord = `${info.frontVowel || ""}${consonant}${info.aboveBelowVowel || ""}${info.rest || "อ"}`;
    setInputText(newWord);
    validateInput(newWord);
  };

  const handleQuickVowelClick = (vowel) => {
    if (mode === "pair") return;
    const info = analyzeSyllable(inputText, mode);
    const newWord = `${vowel.front}${info.initial || "ก"}${vowel.rear}`;
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
    if (typeof window !== "undefined") localStorage.setItem("gemini_api_key", key);
    setCustomApiKey(key);
    setApiSaveStatus("บันทึก API Key เรียบร้อยแล้ว!");
    window.setTimeout(() => setApiSaveStatus(""), 3000);
  };

  const fetchSoundWords = useCallback(async () => {
    setSoundLoading(true);
    setSoundError("");
    try {
      const response = await fetch(WORDS_API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSoundWords(Array.isArray(data.words) ? data.words : []);
    } catch (err) {
      console.warn("fetchSoundWords error:", err);
      setSoundError(t("โหลดรายการคำไม่สำเร็จ ตรวจสอบการเชื่อมต่อ D1/R2", "Failed to load word list"));
    } finally {
      setSoundLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (soundManagerOpen) fetchSoundWords();
  }, [soundManagerOpen, fetchSoundWords]);

  const handleAddSoundWord = async () => {
    const word = newSoundWord.trim();
    if (!word) return;
    setSoundLoading(true);
    setSoundError("");
    try {
      const response = await fetch(WORDS_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, voice: TTS_VOICE, rate: speechRate }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await deleteLocalAudioBlob(normalizeThaiSpeechText(word));
      setNewSoundWord("");
      await fetchSoundWords();
    } catch (err) {
      console.warn("handleAddSoundWord error:", err);
      setSoundError(t("เพิ่มคำไม่สำเร็จ ลองใหม่อีกครั้ง", "Failed to add word"));
    } finally {
      setSoundLoading(false);
    }
  };

  const handleDeleteSoundWord = async (word) => {
    setSoundLoading(true);
    setSoundError("");
    try {
      const response = await fetch(`${WORDS_API_ENDPOINT}?word=${encodeURIComponent(word)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await deleteLocalAudioBlob(normalizeThaiSpeechText(word));
      await fetchSoundWords();
    } catch (err) {
      console.warn("handleDeleteSoundWord error:", err);
      setSoundError(t("ลบคำไม่สำเร็จ ลองใหม่อีกครั้ง", "Failed to delete word"));
    } finally {
      setSoundLoading(false);
    }
  };

  const handleReplaceSoundAudio = async (word, file) => {
    if (!file) return;
    setSoundLoading(true);
    setSoundError("");
    try {
      const formData = new FormData();
      formData.append("word", word);
      formData.append("audio", file);
      const response = await fetch(WORDS_API_ENDPOINT, { method: "PUT", body: formData });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await deleteLocalAudioBlob(normalizeThaiSpeechText(word));
      await fetchSoundWords();
    } catch (err) {
      console.warn("handleReplaceSoundAudio error:", err);
      setSoundError(t("แทนที่ไฟล์เสียงไม่สำเร็จ", "Failed to replace audio"));
    } finally {
      setSoundLoading(false);
    }
  };

  const handleClearAllLocalCache = async () => {
    await clearAllLocalAudioBlobs();
    setSoundError(t("ล้างแคชเสียงในเครื่องเรียบร้อยแล้ว", "Local audio cache cleared"));
    window.setTimeout(() => setSoundError(""), 3000);
  };

  const filteredSoundWords = useMemo(() => {
    const query = soundSearch.trim().toLowerCase();
    if (!query) return soundWords;
    return soundWords.filter((item) => (item.word || "").toLowerCase().includes(query));
  }, [soundWords, soundSearch]);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => console.warn("Fullscreen error:", err));
    } else {
      document.exitFullscreen?.().catch((err) => console.warn("Exit fullscreen error:", err));
    }
  }, []);

  const handleOpenDualMonitor = () => {
    if (typeof window === "undefined") return;

    const currentUrl = window.location.href.split("?")[0];
    const screenWidth = window.screen?.availWidth || 1440;
    const screenHeight = window.screen?.availHeight || 900;

    const popupWidth = Math.max(960, Math.min(1600, Math.floor(screenWidth * 0.86)));
    const popupHeight = Math.max(640, Math.min(900, Math.floor(screenHeight * 0.82)));
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
      lang,
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
    if (initialLang === "en" || initialLang === "th") setLang(initialLang);
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
        (a, b) => Number(b.lang?.toLowerCase().startsWith("th")) - Number(a.lang?.toLowerCase().startsWith("th")),
      );
      setVoices(thaiFirst);
      const thaiVoice = thaiFirst.find((voice) => voice.lang?.toLowerCase().startsWith("th"));
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
              if (value === "present") setPreviousLayout(viewLayout !== "present" ? viewLayout : "split");
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
          <span style={{ color: lang === "th" ? "#0284c7" : "#94a3b8", fontWeight: lang === "th" ? "800" : "500" }}>ไทย</span>
          <span style={{ color: "#94a3b8" }}>/</span>
          <span style={{ color: lang === "en" ? "#16a34a" : "#94a3b8", fontWeight: lang === "en" ? "800" : "500" }}>English</span>
        </button>
      </div>
    </section>
  );

  if (isDisplayWindow) {
    return (
      <main className="display-page" style={containerBackground} onDoubleClick={toggleFullscreen}>
        <ToneBoard
          channelName={CHANNEL_NAME}
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
          isPracticing={isPracticing}
          practiceTargetWord={practiceTargetWord}
          mismatchWord={mismatchWord}
          onTogglePractice={handleTogglePractice}
          onSkip={handleSkipWord}
          practiceTimer={practiceTimer}
          practiceScore={practiceScore}
          practiceMsg={practiceMsg}
          practiceCompleted={practiceCompleted}
          totalPossibleScore={totalPossibleScore}
          isQuizMode={isQuizMode}
          onToggleQuiz={setIsQuizMode}
          speak={speak}
        />
      </main>
    );
  }

  return (
    <main className="app-page" style={containerBackground}>
      <div className="app-shell">
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
            </svg>
          </button>
        )}

        <div className={`main-grid ${viewLayout === "split" ? "split-layout" : ""}`}>
          <section
            className="panel staff-board-section"
            style={{
              backgroundColor: staffBgColor,
              borderRadius: "16px",
              padding: viewLayout === "present" ? "35px 45px" : "25px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              backdropFilter: "blur(6px)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ToneBoard
              channelName={CHANNEL_NAME}
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
              isPracticing={isPracticing}
              practiceTargetWord={practiceTargetWord}
              mismatchWord={mismatchWord}
              onTogglePractice={handleTogglePractice}
              onSkip={handleSkipWord}
              practiceTimer={practiceTimer}
              practiceScore={practiceScore}
              practiceMsg={practiceMsg}
              practiceCompleted={practiceCompleted}
              totalPossibleScore={totalPossibleScore}
              isQuizMode={isQuizMode}
              onToggleQuiz={setIsQuizMode}
              speak={speak}
            />
          </section>

          {viewLayout !== "present" && (
            <div
              className="right-panel-wrapper"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                maxHeight: "calc(100vh - 42px)",
                position: "sticky",
                top: "20px",
              }}
            >
              {renderTopBar({ marginBottom: 0 })}
              <ControlPanel
                mode={mode}
                handleModeChange={handleModeChange}
                inputText={inputText}
                setInputText={setInputText}
                validateInput={validateInput}
                inputError={inputError}
                loading={loading}
                handleGenerate={handleGenerate}
                handleQuickConsonantClick={handleQuickConsonantClick}
                handleQuickVowelClick={handleQuickVowelClick}
                colorMid={colorMid}
                setColorMid={setColorMid}
                colorHigh={colorHigh}
                setColorHigh={setColorHigh}
                colorLow={colorLow}
                setColorLow={setColorLow}
                circleTextColor={circleTextColor}
                setCircleTextColor={setCircleTextColor}
                staffBgColor={staffBgColor}
                setStaffBgColor={setStaffBgColor}
                bgColor={bgColor}
                setBgColor={setBgColor}
                bgType={bgType}
                setBgType={setBgType}
                setBgImage={setBgImage}
                handleImageUpload={handleImageUpload}
                labelFontSize={labelFontSize}
                setLabelFontSize={setLabelFontSize}
                speechEnabled={speechEnabled}
                setSpeechEnabled={setSpeechEnabled}
                selectedVoiceURI={selectedVoiceURI}
                setSelectedVoiceURI={setSelectedVoiceURI}
                voices={voices}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                onTestVoice={() => {
                  const item = linesData.find((line) => line.show);
                  speak(item ? getSpeechText(item) : inputText);
                }}
                soundManagerOpen={soundManagerOpen}
                setSoundManagerOpen={setSoundManagerOpen}
                newSoundWord={newSoundWord}
                setNewSoundWord={setNewSoundWord}
                handleAddSoundWord={handleAddSoundWord}
                soundLoading={soundLoading}
                soundSearch={soundSearch}
                setSoundSearch={setSoundSearch}
                soundError={soundError}
                filteredSoundWords={filteredSoundWords}
                onPlaySoundWord={(w) => speak(w, true)}
                handleReplaceSoundAudio={handleReplaceSoundAudio}
                handleDeleteSoundWord={handleDeleteSoundWord}
                fetchSoundWords={fetchSoundWords}
                handleClearAllLocalCache={handleClearAllLocalCache}
                customApiKey={customApiKey}
                showApiInput={showApiInput}
                setShowApiInput={setShowApiInput}
                tempApiKey={tempApiKey}
                setTempApiKey={setTempApiKey}
                handleSaveApiKey={handleSaveApiKey}
                apiSaveStatus={apiSaveStatus}
                lang={lang}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}