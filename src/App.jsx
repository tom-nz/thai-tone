import React, { useState, useEffect } from 'react';

// API Key จากสภาพแวดล้อมรันไทม์
const apiKey = "";

// คอมโพเนนต์หางตัวโน้ตดนตรี (เขบ็ตชั้นเดียว)
const NoteStem = ({ color, scale = 1 }) => (
  <svg
    style={{
      position: 'absolute',
      top: `-${Math.round(18 * scale)}px`,
      right: `${Math.round(2 * scale)}px`,
      width: `${Math.round(14 * scale)}px`,
      height: `${Math.round(26 * scale)}px`,
      pointerEvents: 'none',
      overflow: 'visible',
      color: color || 'currentColor'
    }}
    viewBox="0 0 14 26"
  >
    {/* ก้านตัวโน้ต (Stem) */}
    <path
      d="M 2 26 L 2 2"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* หางเขบ็ตชั้นเดียว (Single Flag) */}
    <path
      d="M 2 2 C 8 6, 12 10, 10 16 C 8 11, 5 7, 2 5 Z"
      fill="currentColor"
    />
  </svg>
);

export default function App() {
  // ระบบจัดการ Gemini API Key
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  // ตรวจสอบโหมด Display จอที่ 2 (?view=display)
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);

  // โหมดผันและมุมมองหน้าจอ
  const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
  const [viewLayout, setViewLayout] = useState('split'); // 'standard' | 'split' | 'present'
  const [inputText, setInputText] = useState('กอ');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  // การตั้งค่าสีและขนาดฟอนต์
  const [colorMid, setColorMid] = useState('#22c55e');    // กลาง (เขียว)
  const [colorHigh, setColorHigh] = useState('#ef4444');   // สูง (แดง)
  const [colorLow, setColorLow] = useState('#007bff');    // ต่ำ (น้ำเงิน)
  const [circleTextColor, setCircleTextColor] = useState('#ffffff'); // สีตัวอักษรในวงกลม
  const [labelFontSize, setLabelFontSize] = useState(20); // ขนาดตัวหนังสือหน้าเส้น (px)

  // การตั้งค่าพื้นหลัง (Color หรือ Image Upload)
  const [bgType, setBgType] = useState('color'); // 'color' | 'image'
  const [bgColor, setBgColor] = useState('#e2e8f0');
  const [bgImage, setBgImage] = useState('');

  // ข้อมูลวิเคราะห์หลักภาษาและเส้น 5 เส้น
  const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
  const [linesData, setLinesData] = useState([]);
  const [hoveredRowId, setHoveredRowId] = useState(null);

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

  const pairMap = {
    'ค': 'ข', 'ฅ': 'ฃ', 'ฆ': 'ข', 'ข': 'ค', 'ฃ': 'ค',
    'ช': 'ฉ', 'ฌ': 'ฉ', 'ฉ': 'ช',
    'ซ': 'ศ', 'ศ': 'ซ', 'ษ': 'ซ', 'ส': 'ซ',
    'ท': 'ถ', 'ธ': 'ถ', 'ฑ': 'ฐ', 'ฒ': 'ฐ', 'ถ': 'ท', 'ฐ': 'ท',
    'พ': 'ผ', 'ภ': 'ผ', 'ผ': 'พ',
    'ฟ': 'ฝ', 'ฝ': 'ฟ',
    'ฮ': 'ห', 'ห': 'ฮ'
  };

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
        const { lines, info, text, cText, cMid, cHigh, cLow, fontSize, bType, bColor, bImg, activeRowId } = event.data;
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
        activeRowId: hoveredRowId
      });
    }

    return () => channel.close();
  }, [linesData, analysisInfo, inputText, circleTextColor, colorMid, colorHigh, colorLow, labelFontSize, bgType, bgColor, bgImage, hoveredRowId, isDisplayWindow]);

  const parseThaiWord = (word) => {
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

    for (let char of workStr) {
      if (['่', '้', '๊', '๋'].includes(char)) {
        toneMark = char;
      } else {
        rearVowel += char;
      }
    }

    return { initial, frontVowel, rearVowel, toneMark };
  };

  const buildWord = (frontVowel, consonant, tone, rearVowel) => {
    return `${frontVowel}${consonant}${tone}${rearVowel}`;
  };

  const validateInput = (word) => {
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

  const analyzeSyllable = (word, currentMode) => {
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

  const calculateTones = (word, currentMode, midC, highC, lowC) => {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result);
        setBgType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDualMonitor = () => {
    const currentUrl = window.location.href.split('?')[0];
    window.open(`${currentUrl}?view=display`, 'ThaiToneDisplayWindow', 'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey.trim());
    setCustomApiKey(tempApiKey.trim());
    setApiSaveStatus('บันทึก API Key เรียบร้อยแล้ว!');
    setTimeout(() => setApiSaveStatus(''), 3000);
  };

  const handleQuickConsonantClick = (c) => {
    const { frontVowel, rearVowel } = parseThaiWord(inputText);
    const newWord = buildWord(frontVowel || '', c, '', rearVowel || 'อ');
    setInputText(newWord);
  };

  const handleQuickVowelClick = (vowelObj) => {
    const { initial } = parseThaiWord(inputText);
    const cons = initial || 'ก';
    const newWord = buildWord(vowelObj.front, cons, '', vowelObj.rear);
    setInputText(newWord);
  };

  const handleGenerate = async () => {
    const word = inputText.trim();
    if (!validateInput(word)) return;

    const activeKey = customApiKey.trim() || apiKey;
    if (!activeKey) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
      return;
    }

    setLoading(true);
    try {
      const promptText = `วิเคราะห์การผันวรรณยุกต์ภาษาไทยของคำว่า "${word}" (รองรับคำควบกล้ำ) ส่งคืนเฉพาะ JSON array 5 รายการเรียงจาก จัตวา, ตรี, โท, เอก, สามัญ รูปแบบ: [{"tone":"เสียงจัตวา","word":"เหมา","type":"high"},{"tone":"เสียงตรี","word":"เม้า","type":"low"},{"tone":"เสียงโท","words":["เม่า","เหม้า"],"type":"pair"},{"tone":"เสียงเอก","word":"เหม่","type":"high"},{"tone":"เสียงสามัญ","word":"เมา","type":"low"}]`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const toneNames = ['เสียงจัตวา', 'เสียงตรี', 'เสียงโท', 'เสียงเอก', 'เสียงสามัญ'];
      const marks = ['◌๋', '◌๊', '◌้', '◌่', '—'];
      const leftPositions = ['80%', '65%', '52%', '40%', '28%'];

      const formatted = parsed.map((item, idx) => {
        let col = colorMid;
        if (item.type === 'high') col = colorHigh;
        if (item.type === 'low') col = colorLow;

        if (Array.isArray(item.words)) {
          return {
            id: 5 - idx,
            tone: toneNames[idx],
            mark: marks[idx],
            isMulti: true,
            multi: item.words.map((w, i) => ({ text: w, color: i === 0 ? colorLow : colorHigh })),
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
    } catch (err) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
    } finally {
      setLoading(false);
    }
  };

  const fixedRightLabels = {
    5: { text: 'เสียงสูง', color: '#ef4444' },
    3: { text: 'เสียงกลาง', color: '#22c55e' },
    1: { text: 'เสียงต่ำ', color: '#007bff' }
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

  if (isDisplayWindow) {
    const circleRatio = labelFontSize / 20;
    const circleSize = `clamp(${Math.round(42 * circleRatio)}px, ${(4.2 * circleRatio).toFixed(2)}vw, ${Math.round(64 * circleRatio)}px)`;
    const circleFontSize = `clamp(${Math.round(16 * circleRatio)}px, ${(1.8 * circleRatio).toFixed(2)}vw, ${Math.round(26 * circleRatio)}px)`;
    const labelSize = `clamp(${Math.round(14 * circleRatio)}px, ${(0.08 * labelFontSize).toFixed(2)}vw, ${Math.round(26 * circleRatio)}px)`;

    return (
      <div 
        style={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxSizing: 'border-box', 
          padding: '0', 
          margin: '0', 
          fontFamily: "'Sarabun', sans-serif", 
          overflow: 'hidden', 
          position: 'fixed', 
          top: 0, 
          left: 0,
          ...getContainerBgStyle()
        }}
      >
        <div 
          style={{ 
            width: 'clamp(320px, 70vw, 1200px)', 
            height: 'clamp(320px, 70vh, 850px)', 
            maxHeight: '88vh',
            maxWidth: '92vw',
            backgroundColor: 'rgba(255, 255, 255, 0.96)', 
            borderRadius: 'clamp(16px, 2vw, 28px)', 
            padding: 'clamp(16px, 2.2vw, 32px) clamp(20px, 3vw, 48px)', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.12)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            boxSizing: 'border-box', 
            border: '1px solid #cbd5e1', 
            backdropFilter: 'blur(8px)' 
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: 'clamp(22px, 2.4vw, 34px)', fontWeight: 'bold' }}>
              ไตรยางศ์ หรือ อักษร 3 หมู่
            </h2>
            <div style={{ color: '#ea580c', fontSize: 'clamp(15px, 1.5vw, 22px)', fontWeight: '600', marginBottom: '10px' }}>
              และการผันวรรณยุกต์
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: 'clamp(6px, 1vh, 10px) clamp(12px, 1.5vw, 20px)', borderRadius: '12px', margin: '0 auto 10px auto', maxWidth: '850px', textAlign: 'center', fontSize: 'clamp(12px, 1.1vw, 16px)', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)', color: '#64748b', fontWeight: 'bold', fontSize: 'clamp(12px, 1.1vw, 16px)', margin: '0 0 -2px 0' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px', color: '#475569', fontStyle: 'italic' }}>รูปวรรณยุกต์</div>
              <div></div>
              <div></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, padding: '4px 0' }}>
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
                  style={{ display: 'grid', gridTemplateColumns: 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div 
                    style={{ 
                      textAlign: 'right', 
                      paddingRight: '20px', 
                      fontSize: labelSize, 
                      color: rowHeaderColor, 
                      fontWeight: 'bold',
                      transition: 'all 0.15s ease',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {item.tone} <span style={{ fontSize: '0.9em', marginLeft: '4px' }}>[ {item.mark} ]</span>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 'clamp(28px, 4vh, 60px)' }}>
                    <div style={{ width: '100%', height: '3px', backgroundColor: '#94a3b8' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.22)' : 'scale(1)'}`,
                          backgroundColor: item.color,
                          color: circleTextColor,
                          minWidth: circleSize,
                          height: circleSize,
                          padding: '0 10px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: circleFontSize,
                          boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.35)' : '0 5px 14px rgba(0,0,0,0.22)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                        }}
                      >
                        {/* หางตัวโน้ตดนตรี เขบ็ต 1 ชั้น */}
                        <NoteStem color={item.color} scale={circleRatio} />
                        {item.word}
                      </div>
                    )}

                    {item.isMulti && item.show && (
                      <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.multi.map((circle, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: circleFontSize }}>/</span>}
                            <div 
                              style={{
                                backgroundColor: circle.color,
                                color: circleTextColor,
                                minWidth: circleSize,
                                height: circleSize,
                                padding: '0 10px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: circleFontSize,
                                boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.35)' : '0 5px 14px rgba(0,0,0,0.22)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                                filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                              }}
                            >
                              {/* หางตัวโน้ตดนตรี เขบ็ต 1 ชั้น */}
                              <NoteStem color={circle.color} scale={circleRatio} />
                              {circle.text}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: 'clamp(13px, 1.3vw, 21px)' }}>
                    {fixedRight ? fixedRight.text : ''}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        <button 
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

  return (
    <div style={{ minHeight: '100vh', padding: '24px 15px', fontFamily: "'Sarabun', sans-serif", transition: 'all 0.3s ease', ...getContainerBgStyle() }}>
      <div style={{ maxWidth: viewLayout === 'split' ? '1280px' : '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แถบมุมมองและเปิดจอที่ 2 */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '14px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: '12px', border: '1px solid #e2e8f0', backdropFilter: 'blur(6px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>🖥️ มุมมอง:</span>
            <button 
              onClick={() => setViewLayout('standard')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'standard' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              ชิดเดียว
            </button>
            <button 
              onClick={() => setViewLayout('split')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'split' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              แบ่ง 2 จอ
            </button>
            <button 
              onClick={() => setViewLayout('present')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'present' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'present' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              โหมดพรีวิว
            </button>
          </div>

          <button 
            onClick={handleOpenDualMonitor}
            style={{ 
              backgroundColor: '#16a34a', 
              color: '#ffffff', 
              border: 'none', 
              padding: '9px 18px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '14px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 10px rgba(22,163,74,0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          >
            🚀 เปิดกระดานแยกขึ้นมอนิเตอร์ที่ 2
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: viewLayout === 'split' ? '410px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {viewLayout !== 'present' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุม</h3>
              </div>

              {/* 1. ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</div>
                
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

                {/* กล่องรับข้อความและปุ่มผันคำอยู่ในบรรทัดเดียวกัน */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => {
                      setInputText(e.target.value);
                      validateInput(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="พิมพ์ 1 คำ เช่น กอ, เมา, กวาง" 
                    style={{ 
                      flex: 1, 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: inputError ? '2px solid #ef4444' : '1px solid #cbd5e1', 
                      fontSize: '15px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{ 
                      backgroundColor: '#0284c7', 
                      color: '#ffffff', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer', 
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loading ? '...' : 'ผันคำ'}
                  </button>
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

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

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

              {/* 6. Slider ขนาดตัวหนังสือและวงกลม (ปรับสัดส่วนพร้อมกันบนจอที่ 2) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px' }}>
                  <span>📐 ขนาดตัวหนังสือและวงกลม (จอที่ 2):</span>
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

              {/* 7. เชื่อมต่อ Gemini API Key (ย้ายมาอยู่ล่างสุดของแผงควบคุม) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <button 
                  onClick={() => setShowApiInput(!showApiInput)}
                  style={{ 
                    width: '100%',
                    backgroundColor: customApiKey ? '#e0f2fe' : '#fef3c7', 
                    color: customApiKey ? '#0369a1' : '#b45309', 
                    border: customApiKey ? '1px solid #7dd3fc' : '1px solid #fde68a', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold' 
                  }}
                >
                  🔑 {customApiKey ? 'เปลี่ยน Gemini API Key' : 'เชื่อมต่อ AI (API Key)'}
                </button>

                {showApiInput && (
                  <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #94a3b8' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>🔑 เชื่อมต่อ Gemini API Key ส่วนตัว:</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="password" 
                        placeholder="วาง Gemini API Key..." 
                        value={tempApiKey} 
                        onChange={(e) => setTempApiKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <button 
                        onClick={handleSaveApiKey}
                        style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                      >
                        บันทึก
                      </button>
                    </div>
                    {apiSaveStatus && <div style={{ color: '#059669', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* กระดานบรรทัด 5 เส้น (จอล่าง) */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', padding: viewLayout === 'present' ? '40px 50px' : '35px 25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backdropFilter: 'blur(6px)' }}>
            
            <div style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
              <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: '28px', fontWeight: 'bold' }}>
                ไตรยางศ์ หรือ อักษร 3 หมู่
              </h2>
              <div style={{ color: '#ea580c', fontSize: '18px', fontWeight: '600' }}>
                และการผันวรรณยุกต์
              </div>
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', color: '#0369a1', fontWeight: 'bold' }}>
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
                    style={{ display: 'grid', gridTemplateColumns: '220px 1fr 110px', alignItems: 'center' }}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
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

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                      {!item.isMulti && item.show && item.word && (
                        <div 
                          style={{
                            position: 'absolute',
                            left: item.leftPos,
                            transform: `translateX(-50%) ${isHovered ? 'scale(1.22)' : 'scale(1)'}`,
                            backgroundColor: item.color,
                            color: circleTextColor,
                            minWidth: '46px',
                            height: '46px',
                            padding: '0 10px',
                            borderRadius: '23px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.25)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                          }}
                        >
                          {/* หางตัวโน้ตดนตรี เขบ็ต 1 ชั้น */}
                          <NoteStem color={item.color} scale={1} />
                          {item.word}
                        </div>
                      )}

                      {item.isMulti && item.show && (
                        <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.multi.map((circle, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '20px' }}>/</span>}
                              <div 
                                style={{
                                  backgroundColor: circle.color,
                                  color: circleTextColor,
                                  minWidth: '46px',
                                  height: '46px',
                                  padding: '0 10px',
                                  borderRadius: '23px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '18px',
                                  boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.25)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                                  filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                                }}
                              >
                                {/* หางตัวโน้ตดนตรี เขบ็ต 1 ชั้น */}
                                <NoteStem color={circle.color} scale={1} />
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