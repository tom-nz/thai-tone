import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Play, Monitor, RefreshCw, CheckCircle2, ChevronRight, Mic } from 'lucide-react';

export default function App() {
  // ตรวจสอบโหมด Display จอที่ 2 (?view=display)
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);

  // โหมดผันและมุมมองหน้าจอ
  const [mode, setMode] = useState<'full5' | 'highOnly' | 'lowOnly'>('full5');
  const [viewLayout, setViewLayout] = useState<'standard' | 'split' | 'present'>('split');
  const [inputText, setInputText] = useState('กอ');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  // การตั้งค่าเสียงและผู้บรรยาย (Female / Male Voices)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speakingWord, setSpeakingWord] = useState('');
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  
  // Voice list with distinct gender grouping
  const [ttsVoice, setTtsVoice] = useState('Kore'); // Default: Female (Kore)
  const [audioModeStatus, setAudioModeStatus] = useState<string>('กำลังเชื่อมต่อระบบเสียง...');

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // การตั้งค่าสีและขนาดฟอนต์
  const [colorMid, setColorMid] = useState('#22c55e');    // กลาง (เขียว)
  const [colorHigh, setColorHigh] = useState('#ef4444');   // สูง (แดง)
  const [colorLow, setColorLow] = useState('#0284c7');    // ต่ำ (น้ำเงิน/ฟ้าสด)
  const [circleTextColor, setCircleTextColor] = useState('#ffffff'); // สีตัวอักษรในวงกลม
  const [labelFontSize, setLabelFontSize] = useState(20); // ขนาดตัวหนังสือหน้าเส้น (px)

  // การตั้งค่าพื้นหลัง (Color หรือ Image Upload)
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [bgColor, setBgColor] = useState('#e2e8f0');
  const [bgImage, setBgImage] = useState('');

  // ข้อมูลวิเคราะห์หลักภาษาและเส้น 5 เส้น
  const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
  const [linesData, setLinesData] = useState<any[]>([]);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  // หมวดหมู่อักษร 3 หมู่
  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

  // รายการคำควบกล้ำไทย
  const thaiClusters = [
    'กร', 'กล', 'กว', 'ขร', 'ขล', 'ขว', 'คร', 'คล', 'คว', 'ตร', 'ตล', 
    'ปร', 'ปล', 'พร', 'พล', 'ฟร', 'ฟล', 'หง', 'หญ', 'หน', 'หม', 'หย', 
    'หร', 'หล', 'หว', 'ทร', 'ศร', 'สร', 'จร', 'ซร'
  ];

  const quickConsonants = [
    'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ด', 'ต', 
    'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ม', 
    'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ', 'ฮ'
  ];

  const longVowels = [
    { label: '-า', front: '', rear: 'า' },
    { label: 'เ-า', front: 'เ', rear: 'า' },
    { label: '-ี', front: '', rear: 'ี' },
    { label: '-ู', front: '', rear: 'ู' },
    { label: 'เ-', front: 'เ', rear: '' },
    { label: 'แ-', front: 'แ', rear: '' },
    { label: 'โ-', front: 'โ', rear: '' },
    { label: 'ใ-', front: 'ใ', rear: '' },
    { label: 'ไ-', front: 'ไ', rear: '' },
    { label: '-ำ', front: '', rear: 'ำ' },
    { label: 'เ-ีย', front: 'เ', rear: 'ีย' },
    { label: 'เ-ือ', front: 'เ', rear: 'ือ' },
    { label: '-ัว', front: '', rear: 'ัว' },
    { label: 'เ-อ', front: 'เ', rear: 'อ' },
    { label: '-อ', front: '', rear: 'อ' }
  ];

  const shortVowels = [
    { label: '-ะ', front: '', rear: 'ะ' },
    { label: '-ิ', front: '', rear: 'ิ' },
    { label: '-ึ', front: '', rear: 'ึ' },
    { label: '-ุ', front: '', rear: 'ุ' },
    { label: 'เ-ะ', front: 'เ', rear: 'ะ' },
    { label: 'แ-ะ', front: 'แ', rear: 'ะ' },
    { label: 'โ-ะ', front: 'โ', rear: 'ะ' },
    { label: 'เ-าะ', front: 'เ', rear: 'าะ' }
  ];

  const pairMap: Record<string, string> = {
    'ค': 'ข', 'ฅ': 'ฃ', 'ฆ': 'ข', 'ข': 'ค', 'ฃ': 'ค',
    'ช': 'ฉ', 'ฌ': 'ฉ', 'ฉ': 'ช',
    'ซ': 'ศ', 'ศ': 'ซ', 'ษ': 'ซ', 'ส': 'ซ',
    'ท': 'ถ', 'ธ': 'ถ', 'ฑ': 'ฐ', 'ฒ': 'ฐ', 'ถ': 'ท', 'ฐ': 'ท',
    'พ': 'ผ', 'ภ': 'ผ', 'ผ': 'พ',
    'ฟ': 'ฝ', 'ฝ': 'ฟ',
    'ฮ': 'ห', 'ห': 'ฮ'
  };

  const femaleVoices = ['Kore', 'Aoede', 'Callirrhoe', 'Leda', 'Vega', 'Zephyr'];
  const isFemaleSelected = femaleVoices.includes(ttsVoice);

  // Check health and initialize voice status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.hasApiKey) {
          setAudioModeStatus('✨ ระบบเสียง AI เสียงแท้ (Gemini Neural TTS)');
        } else {
          setAudioModeStatus('🔊 ระบบเสียงจำลองของบราวเซอร์ (Web Speech API)');
        }
      })
      .catch(() => {
        setAudioModeStatus('🔊 ระบบเสียงมาตรฐาน');
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'display') {
      setIsDisplayWindow(true);
      document.body.style.margin = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }, []);

  // ระบบสื่อสารข้ามมอนิเตอร์ (BroadcastChannel Sync)
  useEffect(() => {
    const channel = new BroadcastChannel('thai_tone_sync_channel');
    
    if (isDisplayWindow) {
      channel.onmessage = (event) => {
        const { lines, info, text, cText, cMid, cHigh, cLow, fontSize, bType, bColor, bImg, activeRowId, sWord } = event.data;
        if (lines) setLinesData(lines);
        if (info) setAnalysisInfo(info);
        if (text) setInputText(text);
        if (cText) setCircleTextColor(cText);
        if (cMid) setColorMid(cMid);
        if (cHigh) setColorHigh(cHigh);
        if (cLow) setColorLow(cLow);
        if (fontSize) setLabelFontSize(fontSize);
        if (bType) setBgType(bType);
        if (bColor) setBgColor(bColor);
        if (bImg !== undefined) setBgImage(bImg);
        if (activeRowId !== undefined) setHoveredRowId(activeRowId);
        if (sWord !== undefined) setSpeakingWord(sWord);
      };
    } else {
      channel.postMessage({
        lines: linesData,
        info: analysisInfo,
        text: inputText,
        cText: circleTextColor,
        cMid: colorMid,
        cHigh: colorHigh,
        cLow: colorLow,
        fontSize: labelFontSize,
        bType: bgType,
        bColor: bgColor,
        bImg: bgImage,
        activeRowId: hoveredRowId,
        sWord: speakingWord
      });
    }

    return () => channel.close();
  }, [linesData, analysisInfo, inputText, circleTextColor, colorMid, colorHigh, colorLow, labelFontSize, bgType, bgColor, bgImage, hoveredRowId, speakingWord, isDisplayWindow]);

  // หยุดเล่นเสียงทั้งหมดทันที (ป้องกันเสียงแทรก/ซ้อน)
  const stopAllAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // เล่น PCM16 Audio จาก Gemini TTS
  const playPcm16Audio = async (base64Data: string, sampleRate = 24000) => {
    stopAllAudio();
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    audioContextRef.current = audioCtx;

    const buffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    currentAudioSourceRef.current = source;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        if (currentAudioSourceRef.current === source) {
          currentAudioSourceRef.current = null;
        }
        resolve();
      };
      source.start(0);
    });
  };

  // เรียก Gemini TTS ผ่าน Server API พร้อม fallback
  const fetchTtsAudio = async (textToSpeak: string, voiceName: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice: voiceName })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.audioData) {
        return { audioData: data.audioData, sampleRate: data.sampleRate || 24000 };
      }
      throw new Error('No audio data in response');
    } catch (err) {
      throw err;
    }
  };

  // ระบบสำรองกรณีออฟไลน์หรือไม่มี API (Browser SpeechSynthesis Fallback ที่แยกเสียงหญิง/ชายและไม่อ่านสะกด)
  const speakBrowserSpeech = (text: string, isFemale: boolean) => {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      stopAllAudio();
      
      const cleanWord = text.trim();
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95;

      // ปรับระดับเสียง (Pitch) ให้เป็นหญิงหรือชายอย่างชัดเจน
      if (isFemale) {
        utterance.pitch = 1.35; // เสียงแหลมใสระดับผู้หญิง
      } else {
        utterance.pitch = 0.85; // เสียงทุ้มต่ำระดับผู้ชาย
      }

      const voices = window.speechSynthesis.getVoices();
      const thaiVoices = voices.filter(v => v.lang === 'th-TH' || v.lang.startsWith('th') || v.name.toLowerCase().includes('thai'));
      
      if (thaiVoices.length > 0) {
        if (isFemale) {
          const femaleMatch = thaiVoices.find(v => /female|woman|girl|หญิง|kanya|sirinya|premwadee|narisa/i.test(v.name));
          utterance.voice = femaleMatch || thaiVoices[0];
        } else {
          const maleMatch = thaiVoices.find(v => /male|man|boy|ชาย|niwat|thanawat/i.test(v.name));
          utterance.voice = maleMatch || thaiVoices[0];
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  // ระบบออกเสียงคำศัพท์โดยตรง (ไม่อ่านสะกดตัวอักษร)
  const speakWord = async (text: string) => {
    if (!soundEnabled || !text || isDisplayWindow) return;

    stopAllAudio();
    setSpeakingWord(text);

    try {
      // 1. ลองดึงเสียงจาก Gemini Neural TTS (ออกเสียงเป็นคำโดยตรง ไม่สะกด และเปลี่ยนเสียงผู้หญิง/ผู้ชายตามปุ่มเลือก)
      const ttsResult = await fetchTtsAudio(text, ttsVoice);
      await playPcm16Audio(ttsResult.audioData, ttsResult.sampleRate);
    } catch (e) {
      // 2. หากเรียก API ไม่ได้ ให้ใช้ Browser SpeechSynthesis พร้อมปรับระดับความถี่หญิง/ชาย
      await speakBrowserSpeech(text, isFemaleSelected);
    } finally {
      setSpeakingWord('');
    }
  };

  // ทดสอบเสียงผู้บรรยายที่เลือก
  const handleTestVoice = async () => {
    if (isTestingVoice || isPlayingSequence) return;
    setIsTestingVoice(true);
    const testSample = isFemaleSelected ? 'สวัสดีค่ะ ยินดีต้อนรับ' : 'สวัสดีครับ ยินดีต้อนรับ';
    await speakWord(testSample);
    setIsTestingVoice(false);
  };

  // เล่นเสียงผันคำเรียงบรรทัดแบบรวดเร็ว กระชับ
  const handlePlayToneSequence = async () => {
    if (isDisplayWindow) return;
    if (!soundEnabled) setSoundEnabled(true);

    stopAllAudio();
    setIsPlayingSequence(true);

    // เรียงบรรทัดจาก สามัญ (id=1) ขึ้นไปหา จัตวา (id=5)
    const sortedLines = [...linesData].sort((a, b) => a.id - b.id).filter(item => item.show);

    for (const item of sortedLines) {
      const wordToSpeak = item.isMulti ? item.multi[0]?.text : item.word;
      if (wordToSpeak) {
        setHoveredRowId(item.id);
        await speakWord(wordToSpeak);
        await new Promise(r => setTimeout(r, 60)); // พักสั้นๆ กระชับ
      }
    }

    setHoveredRowId(null);
    setSpeakingWord('');
    setIsPlayingSequence(false);
  };

  // ฟังก์ชันแยกพยัญชนะ (รองรับคำควบกล้ำ) และสระ
  const parseThaiWord = (word: string) => {
    if (!word) return { initial: '', frontVowel: '', rearVowel: '', toneMark: '' };
    let frontVowel = '';
    let workStr = word;
    if (['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(word[0])) {
      frontVowel = word[0];
      workStr = word.slice(1);
    }

    let initial = '';
    let rearVowel = '';
    let toneMark = '';

    if (workStr.length >= 2 && thaiClusters.includes(workStr.slice(0, 2))) {
      initial = workStr.slice(0, 2);
      workStr = workStr.slice(2);
    } else if (workStr.length > 0) {
      initial = workStr[0];
      workStr = workStr.slice(1);
    }

    for (const char of workStr) {
      if (['่', '้', '๊', '๋'].includes(char)) {
        toneMark = char;
      } else {
        rearVowel += char;
      }
    }

    return { initial, frontVowel, rearVowel, toneMark };
  };

  const buildWord = (frontVowel: string, consonant: string, tone: string, rearVowel: string) => {
    return `${frontVowel}${consonant}${tone}${rearVowel}`;
  };

  const validateInput = (word: string) => {
    if (!word || word.trim() === '') {
      setInputError('กรุณากรอกคำศัพท์');
      return false;
    }
    if (word.trim().includes(' ')) {
      setInputError('⚠️ กรุณากรอกเพียง 1 คำเท่านั้น (ห้ามมีเว้นวรรค)');
      return false;
    }
    if (word.length > 8) {
      setInputError('⚠️ คำศัพท์ยาวเกินไป (กรอกได้สูงสุด 1 พยางค์/คำ)');
      return false;
    }
    setInputError('');
    return true;
  };

  const analyzeSyllable = (word: string, currentMode: 'full5' | 'highOnly' | 'lowOnly') => {
    const { initial, frontVowel, rearVowel } = parseThaiWord(word);
    const primaryConsonant = initial ? initial[0] : '';
    
    const shortVowelChars = ['ะ', 'ิ', 'ึ', 'ุ', 'ั'];
    const deadEndings = ['ก', 'ข', 'ค', 'ฆ', 'บ', 'ป', 'พ', 'ฟ', 'ภ', 'ด', 'จ', 'ช', 'ซ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ต', 'ถ', 'ท', 'ธ', 'ศ', 'ษ', 'ส'];

    let isDead = false;
    let isShort = false;

    if (shortVowelChars.some(v => rearVowel.includes(v)) || (frontVowel === 'เ' && rearVowel.includes('ะ'))) {
      isShort = true;
    }

    const lastChar = rearVowel.slice(-1);
    if (deadEndings.includes(lastChar)) {
      isDead = true;
    } else if (rearVowel.endsWith('ะ') || (isShort && !rearVowel)) {
      isDead = true;
    }

    const typeText = isDead ? 'คำตาย' : 'คำเป็น';
    const lenText = isShort ? 'สระเสียงสั้น' : 'สระเสียงยาว';
    let desc = '';

    const isCluster = initial.length > 1;
    const clusterLabel = isCluster ? ` (คำควบกล้ำ "${initial}")` : '';

    if (midConsonants.includes(primaryConsonant)) {
      desc = isDead ? `อักษรกลาง${clusterLabel} คำตาย (ผันได้เฉพาะ เอก, โท, ตรี, จัตวา)` : `อักษรกลาง${clusterLabel} คำเป็น (ผันได้ครบ 5 เสียง)`;
    } else if (highConsonants.includes(primaryConsonant) || initial.startsWith('ห')) {
      desc = isDead ? `อักษรสูง${clusterLabel} คำตาย (ผันได้เฉพาะ เสียงเอก และ เสียงโท)` : `อักษรสูง${clusterLabel} คำเป็น (ผันได้เฉพาะ เอก, โท, จัตวา)`;
    } else {
      if (currentMode === 'full5') {
        desc = isDead 
          ? `ผันคู่ อักษรสูง/ห นำ [เอก, โท] + อักษรต่ำ [โท, ตรี]`
          : `ผันคู่ อักษรสูง/ห นำ [เอก, โท, จัตวา] + อักษรต่ำ [สามัญ, โท, ตรี] รวมผันได้ครบทั้ง 5 เสียง`;
      } else if (currentMode === 'highOnly') {
        desc = `เทียบผันเป็น เสียงอักษรสูง/ห นำ${clusterLabel} (ผันได้เฉพาะ เอก, โท, จัตวา)`;
      } else {
        desc = isDead 
          ? (isShort ? `อักษรต่ำ${clusterLabel} คำตายสระสั้น (พื้นเสียงตรี, ผันเสียงโทและจัตวา)` : `อักษรต่ำ${clusterLabel} คำตายสระยาว (พื้นเสียงโท, ผันเสียงตรี)`)
          : `อักษรต่ำ${clusterLabel} คำเป็น (ผันได้ สามัญ, โท, ตรี)`;
      }
    }

    return { type: typeText, vowelLen: lenText, desc, isDead, isShort, initial, frontVowel, rearVowel, primaryConsonant };
  };

  const calculateTones = (word: string, currentMode: 'full5' | 'highOnly' | 'lowOnly', midC: string, highC: string, lowC: string) => {
    if (!word) return [];
    const isValid = validateInput(word);
    if (!isValid) return [];

    const info = analyzeSyllable(word, currentMode);
    setAnalysisInfo(info);
    const { initial, frontVowel, rearVowel, isDead, isShort, primaryConsonant } = info;

    if (midConsonants.includes(primaryConsonant)) {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, initial, '๋', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, initial, '๊', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, '้', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: isDead ? word : buildWord(frontVowel, initial, '่', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, initial, '', rearVowel), color: midC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }

    let highConsonant = '';
    let lowConsonant = '';

    if (highConsonants.includes(primaryConsonant) || initial.startsWith('ห')) {
      highConsonant = initial;
      lowConsonant = Object.keys(pairMap).find(k => pairMap[k] === primaryConsonant) || primaryConsonant;
    } else if (lowSingleConsonants.includes(primaryConsonant)) {
      lowConsonant = initial;
      highConsonant = `ห${initial}`;
    } else {
      lowConsonant = initial;
      highConsonant = pairMap[primaryConsonant] || `ห${initial}`;
    }

    if (currentMode === 'highOnly') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, '', rearVowel), color: highC, isMulti: false, multi: [], show: !isDead, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, highConsonant, '้', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, '่', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '28%' }
      ];
    } else if (currentMode === 'lowOnly') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, isDead && isShort ? '' : '้', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, lowConsonant, isDead && !isShort ? '' : '่', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    } else {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, '', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, isDead && isShort ? '' : '้', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { 
          id: 3, 
          tone: 'เสียงโท', 
          mark: '◌้', 
          isMulti: true, 
          multi: [
            { text: buildWord(frontVowel, lowConsonant, isDead && !isShort ? '' : '่', rearVowel), color: lowC },
            { text: buildWord(frontVowel, highConsonant, '้', rearVowel), color: highC }
          ],
          show: true,
          leftPos: '52%'
        },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, '่', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }
  };

  useEffect(() => {
    setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
  }, [inputText, mode, colorMid, colorHigh, colorLow]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
        setBgType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDualMonitor = () => {
    const currentUrl = window.location.href.split('?')[0];
    window.open(`${currentUrl}?view=display`, 'ThaiToneDisplayWindow', 'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleQuickConsonantClick = (c: string) => {
    const { frontVowel, rearVowel } = parseThaiWord(inputText);
    const newWord = buildWord(frontVowel || '', c, '', rearVowel || 'อ');
    setInputText(newWord);
  };

  const handleQuickVowelClick = (vowelObj: { front: string; rear: string }) => {
    const { initial } = parseThaiWord(inputText);
    const cons = initial || 'ก';
    const newWord = buildWord(vowelObj.front, cons, '', vowelObj.rear);
    setInputText(newWord);
  };

  const handleGenerate = async () => {
    const word = inputText.trim();
    if (!validateInput(word)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/analyze-tones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, mode })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      const parsed = data.tones;

      if (Array.isArray(parsed) && parsed.length === 5) {
        const toneNames = ['เสียงจัตวา', 'เสียงตรี', 'เสียงโท', 'เสียงเอก', 'เสียงสามัญ'];
        const marks = ['◌๋', '◌๊', '◌้', '◌่', '—'];
        const leftPositions = ['80%', '65%', '52%', '40%', '28%'];

        const formatted = parsed.map((item: any, idx: number) => {
          let col = colorMid;
          if (item.type === 'high') col = colorHigh;
          if (item.type === 'low') col = colorLow;

          if (Array.isArray(item.words)) {
            return {
              id: 5 - idx,
              tone: toneNames[idx],
              mark: marks[idx],
              isMulti: true,
              multi: item.words.map((w: string, i: number) => ({ text: w, color: i === 0 ? colorLow : colorHigh })),
              show: item.words.length > 0,
              leftPos: leftPositions[idx]
            };
          }

          return {
            id: 5 - idx,
            tone: toneNames[idx],
            mark: marks[idx],
            word: item.word || '',
            color: col,
            isMulti: false,
            multi: [],
            show: Boolean(item.word),
            leftPos: leftPositions[idx]
          };
        });

        setLinesData(formatted);
        setAnalysisInfo(analyzeSyllable(word, mode));
      } else {
        setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
      }
    } catch (err) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
    } finally {
      setLoading(false);
    }
  };

  const fixedRightLabels: Record<number, { text: string; color: string }> = {
    5: { text: 'เสียงสูง', color: '#ef4444' },
    3: { text: 'เสียงกลาง', color: '#22c55e' },
    1: { text: 'เสียงต่ำ', color: '#0284c7' }
  };

  const getContainerBgStyle = () => {
    if (bgType === 'image' && bgImage) {
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return { backgroundColor: bgColor };
  };

  // 1. หน้าจอที่สอง (Display Monitor สำหรับโปรเจกเตอร์หรือทีวี)
  if (isDisplayWindow) {
    return (
      <div 
        id="display-board-container"
        style={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxSizing: 'border-box', 
          padding: '0', 
          margin: '0', 
          fontFamily: "'Sarabun', 'Prompt', sans-serif", 
          overflow: 'hidden', 
          position: 'fixed', 
          top: 0, 
          left: 0,
          ...getContainerBgStyle()
        }}
      >
        <div 
          id="display-board-card"
          style={{ 
            width: 'clamp(320px, 72vw, 1280px)', 
            height: 'clamp(320px, 72vh, 880px)', 
            maxHeight: '90vh',
            maxWidth: '94vw',
            backgroundColor: 'rgba(255, 255, 255, 0.97)', 
            borderRadius: 'clamp(16px, 2.2vw, 30px)', 
            padding: 'clamp(16px, 2.4vw, 36px) clamp(20px, 3.2vw, 52px)', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.14)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            boxSizing: 'border-box', 
            border: '1px solid #cbd5e1', 
            backdropFilter: 'blur(10px)' 
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: 'clamp(24px, 2.6vw, 36px)', fontWeight: 'bold' }}>
              ไตรยางศ์ หรือ อักษร 3 หมู่
            </h2>
            <div style={{ color: '#ea580c', fontSize: 'clamp(16px, 1.6vw, 24px)', fontWeight: '600', marginBottom: '12px' }}>
              และการผันวรรณยุกต์
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: 'clamp(6px, 1vh, 10px) clamp(12px, 1.5vw, 20px)', borderRadius: '12px', margin: '0 auto 12px auto', maxWidth: '850px', textAlign: 'center', fontSize: 'clamp(13px, 1.15vw, 17px)', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)', color: '#64748b', fontWeight: 'bold', fontSize: 'clamp(13px, 1.15vw, 17px)', margin: '0 0 -2px 0' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px', color: '#475569', fontStyle: 'italic' }}>รูปวรรณยุกต์</div>
              <div></div>
              <div></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, padding: '6px 0' }}>
            {linesData.map((item, idx) => {
              let rowHeaderColor = '#94a3b8';
              if (item.show) {
                rowHeaderColor = item.isMulti ? item.multi[0]?.color : item.color;
              }
              const fixedRight = fixedRightLabels[item.id];
              const isHovered = hoveredRowId === item.id;

              return (
                <div 
                  key={idx} 
                  id={`display-row-${item.id}`}
                  style={{ display: 'grid', gridTemplateColumns: 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div 
                    style={{ 
                      textAlign: 'right', 
                      paddingRight: '20px', 
                      fontSize: `clamp(14px, ${isHovered ? labelFontSize * 0.08 + 0.2 : labelFontSize * 0.08}vw, 28px)`, 
                      color: rowHeaderColor, 
                      fontWeight: 'bold',
                      transition: 'all 0.15s ease',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {item.tone} <span style={{ fontSize: '0.9em', marginLeft: '4px' }}>[ {item.mark} ]</span>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 'clamp(30px, 4.2vh, 46px)' }}>
                    <div style={{ width: '100%', height: '3px', backgroundColor: '#94a3b8' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.22)' : 'scale(1)'}`,
                          backgroundColor: item.color,
                          color: circleTextColor,
                          minWidth: 'clamp(44px, 4.4vw, 68px)',
                          height: 'clamp(44px, 4.4vw, 68px)',
                          padding: '0 10px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 'clamp(17px, 1.9vw, 28px)',
                          boxShadow: isHovered ? '0 8px 22px rgba(0,0,0,0.35)' : '0 5px 14px rgba(0,0,0,0.22)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                        }}
                      >
                        {item.word}
                      </div>
                    )}

                    {item.isMulti && item.show && (
                      <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.multi.map((circle: any, i: number) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 'clamp(16px, 1.8vw, 26px)' }}>/</span>}
                            <div 
                              style={{
                                backgroundColor: circle.color,
                                color: circleTextColor,
                                minWidth: 'clamp(44px, 4.4vw, 68px)',
                                height: 'clamp(44px, 4.4vw, 68px)',
                                padding: '0 10px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: 'clamp(17px, 1.9vw, 28px)',
                                boxShadow: isHovered ? '0 8px 22px rgba(0,0,0,0.35)' : '0 5px 14px rgba(0,0,0,0.22)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                                filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                              }}
                            >
                              {circle.text}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: 'clamp(13px, 1.35vw, 22px)' }}>
                    {fixedRight ? fixedRight.text : ''}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        <button 
          id="btn-toggle-fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          style={{
            position: 'absolute',
            bottom: '18px',
            right: '24px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            color: '#475569',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'}
        >
          ⛶ สลับเต็มจอ
        </button>

      </div>
    );
  }

  // 2. หน้าจอควบคุมหลัก
  return (
    <div id="main-app-container" style={{ minHeight: '100vh', padding: '24px 15px', fontFamily: "'Sarabun', 'Prompt', sans-serif", transition: 'all 0.3s ease', ...getContainerBgStyle() }}>
      <div style={{ maxWidth: viewLayout === 'split' ? '1320px' : '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แถบสลับมุมมองและเปิดจอที่ 2 */}
        <div id="top-view-bar" style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: '16px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: '12px', border: '1px solid #e2e8f0', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>🖥️ มุมมอง:</span>
            <button 
              id="btn-view-standard"
              onClick={() => setViewLayout('standard')}
              style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'standard' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              หน้าเดียว
            </button>
            <button 
              id="btn-view-split"
              onClick={() => setViewLayout('split')}
              style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'split' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              แบ่ง 2 จอ
            </button>
            <button 
              id="btn-view-present"
              onClick={() => setViewLayout('present')}
              style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'present' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'present' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              โหมดกระดานสอน
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '6px 12px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} />
              <span>{audioModeStatus}</span>
            </div>

            <button 
              id="btn-open-dual-monitor"
              onClick={handleOpenDualMonitor}
              style={{ 
                backgroundColor: '#16a34a', 
                color: '#ffffff', 
                border: 'none', 
                padding: '9px 18px', 
                borderRadius: '10px', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px rgba(22,163,74,0.25)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
            >
              <Monitor size={16} />
              เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: viewLayout === 'split' ? '430px 1fr' : '1fr', gap: '22px', alignItems: 'start' }}>
          
          {viewLayout !== 'present' && (
            <div id="control-sidebar-panel" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* ส่วนหัวแผงควบคุม & เลือกเสียงบรรยาย */}
              <div id="voice-selection-box" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={18} color="#0284c7" />
                    เสียงผู้บรรยาย & ระบบเสียง
                  </h3>

                  <button 
                    id="btn-toggle-sound"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      if (!next) stopAllAudio();
                    }}
                    style={{
                      backgroundColor: soundEnabled ? '#dcfce7' : '#f1f5f9',
                      color: soundEnabled ? '#15803d' : '#64748b',
                      border: soundEnabled ? '1px solid #86efac' : '1px solid #cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    {soundEnabled ? 'เปิดเสียง' : 'ปิดเสียง'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* ปุ่มสลับเพศเสียงด่วน */}
                    <button
                      id="btn-select-female-voice"
                      onClick={() => setTtsVoice('Kore')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isFemaleSelected ? '2px solid #ec4899' : '1px solid #cbd5e1',
                        backgroundColor: isFemaleSelected ? '#fdf2f8' : '#ffffff',
                        color: isFemaleSelected ? '#be185d' : '#475569',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      👩 เสียงผู้หญิง
                    </button>

                    <button
                      id="btn-select-male-voice"
                      onClick={() => setTtsVoice('Puck')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: !isFemaleSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: !isFemaleSelected ? '#f0f9ff' : '#ffffff',
                        color: !isFemaleSelected ? '#0369a1' : '#475569',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      👨 เสียงผู้ชาย
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select 
                      id="select-voice-dropdown"
                      value={ttsVoice} 
                      onChange={(e) => setTtsVoice(e.target.value)}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#ffffff', color: '#1e293b' }}
                    >
                      <optgroup label="👩 ผู้บรรยายหญิง (Female Voices)">
                        <option value="Kore">👩 ผู้หญิง - Kore (นุ่มนวล ชัดเจน)</option>
                        <option value="Aoede">👩 ผู้หญิง - Aoede (สดใส ร่าเริง)</option>
                        <option value="Callirrhoe">👩 ผู้หญิง - Callirrhoe (สไตล์คุณครู)</option>
                        <option value="Leda">👩 ผู้หญิง - Leda (ใจดี อบอุ่น)</option>
                        <option value="Vega">👩 ผู้หญิง - Vega (กระฉับกระเฉง)</option>
                      </optgroup>
                      <optgroup label="👨 ผู้บรรยายชาย (Male Voices)">
                        <option value="Puck">👨 ผู้ชาย - Puck (ทุ้ม มีพลัง)</option>
                        <option value="Fenrir">👨 ผู้ชาย - Fenrir (สุขุม นุ่มนวล)</option>
                        <option value="Orus">👨 ผู้ชาย - Orus (สดใส เป็นธรรมชาติ)</option>
                        <option value="Algieba">👨 ผู้ชาย - Algieba (ทางการ สุภาพ)</option>
                      </optgroup>
                    </select>

                    <button 
                      id="btn-test-voice"
                      onClick={handleTestVoice}
                      disabled={isTestingVoice || isPlayingSequence}
                      style={{
                        backgroundColor: isTestingVoice ? '#9333ea' : '#7e22ce',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isTestingVoice ? '🔊 กำลังพูด...' : '🔊 ทดสอบเสียง'}
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                    💡 การออกเสียงเป็นคำเต็มโดยตรงตามวรรณยุกต์ (ไม่สะกด กอ-ออ-กอ)
                  </div>
                </div>
              </div>

              {/* 1. ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ */}
              <div id="tone-generator-box" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#0284c7" />
                  คำศัพท์และรูปแบบการผัน
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '13px', color: '#334155' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="mode" checked={mode === 'full5'} onChange={() => setMode('full5')} />
                    ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="mode" checked={mode === 'highOnly'} onChange={() => setMode('highOnly')} />
                    เฉพาะเสียงสูง (เอก, โท, จัตวา)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="mode" checked={mode === 'lowOnly'} onChange={() => setMode('lowOnly')} />
                    เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    id="input-thai-word"
                    type="text" 
                    value={inputText} 
                    onChange={(e) => {
                      setInputText(e.target.value);
                      validateInput(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="พิมพ์ 1 คำ เช่น กอ, กา, เมา, กวาง, ปา" 
                    style={{ 
                      width: '100%', 
                      padding: '9px 12px', 
                      borderRadius: '8px', 
                      border: inputError ? '2px solid #ef4444' : '1px solid #cbd5e1', 
                      fontSize: '15px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      id="btn-generate-tones"
                      onClick={handleGenerate}
                      disabled={loading}
                      style={{ flex: 1, backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '9px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : <ChevronRight size={16} />}
                      {loading ? 'กำลังวิเคราะห์...' : 'ผันคำ'}
                    </button>

                    <button 
                      id="btn-play-tone-sequence"
                      onClick={handlePlayToneSequence}
                      disabled={isPlayingSequence}
                      style={{ 
                        flex: 1.2, 
                        backgroundColor: isPlayingSequence ? '#ea580c' : '#16a34a', 
                        color: '#ffffff', 
                        border: 'none', 
                        padding: '9px 12px', 
                        borderRadius: '8px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Play size={15} />
                      {isPlayingSequence ? 'กำลังผันเสียง...' : '🔊 เล่นผัน 5 เสียง'}
                    </button>
                  </div>
                </div>
                {inputError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>{inputError}</div>}
              </div>

              {/* 2. เลือกพยัญชนะด่วน */}
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>⌨️ เลือกพยัญชนะด่วน:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickConsonants.map((c) => (
                    <button 
                      key={c}
                      onClick={() => handleQuickConsonantClick(c)}
                      style={{ 
                        padding: '4px 7px', 
                        borderRadius: '5px', 
                        border: '1px solid #cbd5e1', 
                        backgroundColor: '#ffffff', 
                        fontSize: '13px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: midConsonants.includes(c) ? colorMid : highConsonants.includes(c) ? colorHigh : colorLow
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. เลือกสระด่วน สระเสียงยาว/สระเสียงสั้น */}
              <div>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold', marginBottom: '6px' }}>🟢 สระเสียงยาว (คำเป็น):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {longVowels.map((v) => (
                    <button 
                      key={v.label}
                      onClick={() => handleQuickVowelClick(v)}
                      style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold', marginBottom: '6px' }}>🔴 สระเสียงสั้น (คำตาย):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {shortVowels.map((v) => (
                    <button 
                      key={v.label}
                      onClick={() => handleQuickVowelClick(v)}
                      style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />

              {/* 4. การตั้งค่าสีประจำหมู่ */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <label style={{ height: '34px', backgroundColor: colorMid, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรกลาง
                    <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '34px', backgroundColor: colorHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรสูง
                    <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '34px', backgroundColor: colorLow, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรต่ำ
                    <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '34px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1' }}>
                    สีตัวอักษร
                    <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                </div>
              </div>

              {/* 5. เลือกสีหรือรูปภาพพื้นหลัง */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>🖼️ เลือกสีหรือรูปภาพพื้นหลังจอภาพ</div>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'เทา', code: '#e2e8f0' },
                    { label: 'สว่าง', code: '#f1f5f9' },
                    { label: 'ฟ้าอ่อน', code: '#e0f2fe' },
                    { label: 'มินต์', code: '#dcfce7' },
                    { label: 'ส้มอ่อน', code: '#fef3c7' },
                    { label: 'เข้ม', code: '#334155' }
                  ].map((colorItem) => (
                    <button
                      key={colorItem.code}
                      onClick={() => { setBgColor(colorItem.code); setBgType('color'); }}
                      style={{
                        backgroundColor: colorItem.code,
                        border: bgColor === colorItem.code && bgType === 'color' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: colorItem.code === '#334155' ? '#fff' : '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      {colorItem.label}
                    </button>
                  ))}
                  
                  <label style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เลือกสีเอง
                    <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setBgType('color'); }} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ backgroundColor: '#0284c7', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
                    📁 อัปโหลดรูปภาพพื้นหลัง
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  {bgType === 'image' && (
                    <button 
                      onClick={() => { setBgType('color'); setBgImage(''); }}
                      style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ยกเลิกรูปภาพ
                    </button>
                  )}
                </div>
              </div>

              {/* 6. Slider ขนาดตัวหนังสือหน้าเส้น */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px' }}>
                  <span>📐 ขนาดตัวหนังสือหน้าเส้น (จอที่ 2):</span>
                  <span style={{ color: '#0284c7' }}>{labelFontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="16" 
                  max="32" 
                  value={labelFontSize} 
                  onChange={(e) => setLabelFontSize(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

            </div>
          )}

          {/* กระดานบรรทัด 5 เส้น (จอหลัก/จอล่าง) */}
          <div id="main-board-card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: '18px', padding: viewLayout === 'present' ? '40px 50px' : '35px 28px', boxShadow: '0 4px 22px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', border: '1px solid #e2e8f0' }}>
            
            <div style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
              <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: '28px', fontWeight: 'bold' }}>
                ไตรยางศ์ หรือ อักษร 3 หมู่
              </h2>
              <div style={{ color: '#ea580c', fontSize: '18px', fontWeight: '600' }}>
                และการผันวรรณยุกต์
              </div>
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '12px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 110px', color: '#64748b', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px', color: '#475569', fontStyle: 'italic' }}>รูปวรรณยุกต์</div>
              <div></div>
              <div></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
              {linesData.map((item, idx) => {
                let rowHeaderColor = '#94a3b8';
                if (item.show) {
                  rowHeaderColor = item.isMulti ? item.multi[0]?.color : item.color;
                }
                const fixedRight = fixedRightLabels[item.id];
                const isHovered = hoveredRowId === item.id;

                return (
                  <div 
                    key={idx} 
                    id={`row-line-${item.id}`}
                    style={{ display: 'grid', gridTemplateColumns: '220px 1fr 110px', alignItems: 'center', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    onClick={() => {
                      // คลิกที่แถบเพื่อสั่งเปล่งเสียงคำตรงๆ
                      const wordToSpeak = item.isMulti ? item.multi[0]?.text : item.word;
                      if (wordToSpeak) speakWord(wordToSpeak);
                    }}
                  >
                    <div 
                      style={{ 
                        textAlign: 'right', 
                        paddingRight: '20px', 
                        fontSize: `${isHovered ? 19 : 17}px`, 
                        color: rowHeaderColor, 
                        fontWeight: 'bold', 
                        transition: 'all 0.15s ease',
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                      }}
                    >
                      {item.tone} <span style={{ fontSize: `${isHovered ? 19 : 17}px`, marginLeft: '4px', letterSpacing: '1px' }}>[ {item.mark} ]</span>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '32px' }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                      {!item.isMulti && item.show && item.word && (
                        <div 
                          id={`circle-word-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(item.word);
                          }}
                          style={{
                            position: 'absolute',
                            left: item.leftPos,
                            transform: `translateX(-50%) ${isHovered ? 'scale(1.22)' : 'scale(1)'}`,
                            backgroundColor: item.color,
                            color: circleTextColor,
                            minWidth: '48px',
                            height: '48px',
                            padding: '0 10px',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            boxShadow: isHovered ? '0 6px 18px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.22)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                          }}
                        >
                          {item.word}
                        </div>
                      )}

                      {item.isMulti && item.show && (
                        <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.multi.map((circle: any, i: number) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '20px' }}>/</span>}
                              <div 
                                id={`circle-multi-${item.id}-${i}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakWord(circle.text);
                                }}
                                style={{
                                  backgroundColor: circle.color,
                                  color: circleTextColor,
                                  minWidth: '48px',
                                  height: '48px',
                                  padding: '0 10px',
                                  borderRadius: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '18px',
                                  boxShadow: isHovered ? '0 6px 18px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.22)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                                  filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                                }}
                              >
                                {circle.text}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>
                      {fixedRight ? fixedRight.text : ''}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
