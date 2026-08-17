import React, { useState, useEffect } from 'react';

export default function App() {
  // ระบบคีย์ Gemini API (บันทึกอัตโนมัติลง LocalStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  // โหมดผันและโหมดมุมมองหน้าจอ
  const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
  const [viewLayout, setViewLayout] = useState('split'); // 'standard' | 'split' | 'present'
  const [themeMode, setThemeMode] = useState('notebook'); // 'notebook' | 'blackboard' | 'dark'
  const [inputText, setInputText] = useState('เมา');
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState(null);

  // การตั้งค่าสี
  const [colorMid, setColorMid] = useState('#22c55e');    // กลาง (เขียว)
  const [colorHigh, setColorHigh] = useState('#ef4444');   // สูง (แดง)
  const [colorLow, setColorLow] = useState('#007bff');    // ต่ำ (น้ำเงิน)
  const [circleTextColor, setCircleTextColor] = useState('#ffffff'); // สีตัวอักษรในวงกลม

  // ข้อมูลวิเคราะห์หลักภาษาและเส้น 5 เส้น
  const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
  const [linesData, setLinesData] = useState([]);

  // หมวดหมู่อักษร 3 หมู่
  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

  const quickConsonants = [
    'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ด', 'ต', 
    'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ม', 
    'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ', 'ฮ'
  ];

  // สระไทยสำหรับเลือกด่วน
  const quickVowelsLong = [
    { label: '-า', apply: (c) => `${c}า` },
    { label: 'เ-า', apply: (c) => `เ${c}า` },
    { label: '-ี', apply: (c) => `${c}ี` },
    { label: '-ู', apply: (c) => `${c}ู` },
    { label: 'เ-', apply: (c) => `เ${c}` },
    { label: 'แ-', apply: (c) => `แ${c}` },
    { label: 'โ-', apply: (c) => `โ${c}` },
    { label: 'ใ-', apply: (c) => `ใ${c}` },
    { label: 'ไ-', apply: (c) => `ไ${c}` },
    { label: '-ำ', apply: (c) => `${c}ำ` },
    { label: 'เ-ีย', apply: (c) => `เ${c}ีย` },
    { label: 'เ-ือ', apply: (c) => `เ${c}ือ` },
    { label: '-ัว', apply: (c) => `${c}ัว` },
    { label: 'เ-อ', apply: (c) => `เ${c}อ` },
    { label: '-อ', apply: (c) => `${c}อ` }
  ];

  const quickVowelsShort = [
    { label: '-ะ', apply: (c) => `${c}ะ` },
    { label: '-ิ', apply: (c) => `${c}ิ` },
    { label: '-ึ', apply: (c) => `${c}ึ` },
    { label: '-ุ', apply: (c) => `${c}ุ` },
    { label: 'เ-ะ', apply: (c) => `เ${c}ะ` },
    { label: 'แ-ะ', apply: (c) => `แ${c}ะ` },
    { label: 'โ-ะ', apply: (c) => `โ${c}ะ` },
    { label: 'เ-าะ', apply: (c) => `เ${c}าะ` }
  ];

  const pairMapLowToHigh = {
    'ค': 'ข', 'ฅ': 'ฃ', 'ฆ': 'ข', 'ช': 'ฉ', 'ฌ': 'ฉ',
    'ซ': 'ศ', 'ท': 'ถ', 'ธ': 'ถ', 'ฑ': 'ฐ', 'ฒ': 'ฐ',
    'พ': 'ผ', 'ภ': 'ผ', 'ฟ': 'ฝ', 'ฮ': 'ห'
  };

  const pairMapHighToLow = {
    'ข': 'ค', 'ฃ': 'ค', 'ฉ': 'ช', 'ฐ': 'ท', 'ถ': 'ท',
    'ผ': 'พ', 'ฝ': 'ฟ', 'ศ': 'ซ', 'ษ': 'ซ', 'ส': 'ซ', 'ห': 'ฮ'
  };

  const parseThaiWord = (word) => {
    if (!word) return { initial: 'ก', frontVowel: '', rearVowel: '', toneMark: '' };
    
    let frontVowel = '';
    let workStr = word;
    if (['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(word[0])) {
      frontVowel = word[0];
      workStr = word.slice(1);
    }

    let initial = '';
    let rearVowel = '';
    let toneMark = '';

    for (let char of workStr) {
      if (['่', '้', '๊', '๋'].includes(char)) {
        toneMark = char;
      } else if (!initial) {
        initial = char;
      } else {
        rearVowel += char;
      }
    }

    return { initial: initial || 'ก', frontVowel, rearVowel, toneMark };
  };

  const buildWord = (frontVowel, consonant, tone, rearVowel) => {
    return `${frontVowel}${consonant}${tone}${rearVowel}`;
  };

  // ตรวจสอบว่าเป็น คำเป็น หรือ คำตาย
  const analyzeSyllable = (word) => {
    const { initial, frontVowel, rearVowel } = parseThaiWord(word);
    
    const shortVowelChars = ['ะ', 'ิ', 'ึ', 'ุ', 'ั', '็'];
    const deadEndings = ['ก', 'ข', 'ค', 'ฆ', 'บ', 'ป', 'พ', 'ฟ', 'ภ', 'ด', 'จ', 'ช', 'ซ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ต', 'ถ', 'ท', 'ธ', 'ศ', 'ษ', 'ส'];

    let isDead = false;
    let isShort = false;

    if (shortVowelChars.some(v => rearVowel.includes(v)) || (frontVowel === 'เ' && rearVowel.includes('ะ')) || (frontVowel === 'แ' && rearVowel.includes('ะ')) || (frontVowel === 'โ' && rearVowel.includes('ะ'))) {
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

    if (midConsonants.includes(initial)) {
      desc = isDead ? 'อักษรกลาง คำตาย (ผันได้เฉพาะ เอก, โท, ตรี, จัตวา ไม่มีเสียงสามัญ)' : 'อักษรกลาง คำเป็น (ผันได้ครบ 5 เสียง)';
    } else if (highConsonants.includes(initial)) {
      desc = isDead ? 'อักษรสูง คำตาย (ผันได้เฉพาะ เสียงเอก และ เสียงโท)' : 'อักษรสูง คำเป็น (พื้นเสียงคือจัตวา, ผันได้ เอก, โท, จัตวา)';
    } else {
      desc = isDead 
        ? (isShort ? 'อักษรต่ำ คำตายสระสั้น (พื้นเสียงคือตรี, ผันเสียงโท และจัตวาได้)' : 'อักษรต่ำ คำตายสระยาว (พื้นเสียงคือโท, ผันเสียงตรีได้)')
        : 'อักษรต่ำ คำเป็น (พื้นเสียงคือสามัญ, ผันได้ สามัญ, โท, ตรี)';
    }

    return { type: typeText, vowelLen: lenText, desc, isDead, isShort, initial, frontVowel, rearVowel };
  };

  // คำนวณการผันวรรณยุกต์ (ปรับปรุงแก้ไขความถูกต้องหลักภาษาไทย)
  const calculateTones = (word, currentMode, midC, highC, lowC) => {
    if (!word) return [];
    const info = analyzeSyllable(word);
    setAnalysisInfo(info);
    const { initial, frontVowel, rearVowel, isDead, isShort } = info;

    // 1. อักษรกลาง
    if (midConsonants.includes(initial)) {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, initial, '๋', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, initial, '๊', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, '้', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: isDead ? word : buildWord(frontVowel, initial, '่', rearVowel), color: midC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, initial, '', rearVowel), color: midC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }

    // 2. อักษรสูง / อักษรต่ำ
    let highConsonant = '';
    let lowConsonant = '';

    if (highConsonants.includes(initial)) {
      highConsonant = initial;
      lowConsonant = pairMapHighToLow[initial] || '';
    } else if (lowSingleConsonants.includes(initial)) {
      lowConsonant = initial;
      highConsonant = `ห${initial}`;
    } else {
      lowConsonant = initial;
      highConsonant = pairMapLowToHigh[initial] || `ห${initial}`;
    }

    // สร้างรูปคำผันอักษรต่ำ/สูง
    const lowSamanyan = isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel);
    const lowTho = buildWord(frontVowel, lowConsonant, isDead && isShort ? '่' : (isDead ? '' : '่'), rearVowel); // อักษรต่ำ รูปเอก = เสียงโท
    const lowTri = buildWord(frontVowel, lowConsonant, isDead && isShort ? '' : (isDead ? '้' : '้'), rearVowel); // อักษรต่ำ รูปโท = เสียงตรี

    const highJattawa = isDead ? '' : buildWord(frontVowel, highConsonant, '', rearVowel); // อักษรสูง ไร้รูป = เสียงจัตวา
    const highEk = buildWord(frontVowel, highConsonant, isDead ? '' : '่', rearVowel);     // อักษรสูง รูปเอก = เสียงเอก
    const highTho = buildWord(frontVowel, highConsonant, '้', rearVowel);                   // อักษรสูง รูปโท = เสียงโท

    if (currentMode === 'highOnly') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '—', word: highJattawa, color: highC, isMulti: false, multi: [], show: !isDead, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: highTho, color: highC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: highEk, color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '28%' }
      ];
    } else if (currentMode === 'lowOnly') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌้', word: lowTri, color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌่', word: lowTho, color: lowC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: lowSamanyan, color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    } else {
      // โหมดผันครบ 5 บรรทัด (แสดงอักษรคู่)
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '—', word: highJattawa, color: highC, isMulti: false, multi: [], show: !isDead, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌้', word: lowTri, color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { 
          id: 3, 
          tone: 'เสียงโท', 
          mark: '◌่ / ◌้', 
          isMulti: true, 
          multi: [
            { text: lowTho, color: lowC },
            { text: highTho, color: highC }
          ],
          show: true,
          leftPos: '52%'
        },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: highEk, color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: lowSamanyan, color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }
  };

  useEffect(() => {
    setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
  }, [inputText, mode, colorMid, colorHigh, colorLow]);

  // คำนวณขนาดตัวอักษรอัตโนมัติให้พอดีกับวงกลม
  const getFontSize = (text) => {
    if (!text) return '18px';
    const len = text.length;
    if (len <= 2) return '18px';
    if (len === 3) return '15px';
    if (len === 4) return '13px';
    if (len === 5) return '11px';
    return '10px';
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
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
    const currInitial = initial || 'ก';
    const newWord = vowelObj.apply(currInitial);
    setInputText(newWord);
  };

  // อ่านออกเสียงคำผันวรรณยุกต์ (Web Speech API)
  const speakWord = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // ปุ่มอ่านผันต่อเนื่อง 5 เสียง
  const handlePlaySequence = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    const activeList = linesData.slice().reverse(); // เรียง สามัญ -> เอก -> โท -> ตรี -> จัตวา
    for (let i = 0; i < activeList.length; i++) {
      const item = activeList[i];
      if (item.show) {
        let textToRead = item.isMulti ? item.multi.map(m => m.text).join(' ') : item.word;
        if (textToRead) {
          setActiveSpeechIdx(item.id);
          speakWord(textToRead);
          await new Promise(res => setTimeout(res, 1300));
        }
      }
    }
    setActiveSpeechIdx(null);
    setIsPlayingAudio(false);
  };

  const handleGenerateAI = async () => {
    const word = inputText.trim();
    if (!word) return;

    if (!apiKey) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
      return;
    }

    setLoading(true);
    try {
      const promptText = `วิเคราะห์การผันวรรณยุกต์ภาษาไทยของคำว่า "${word}" (ตรวจสอบสระเสียงสั้น/ยาว คำเป็น/คำตาย) ส่งคืนเฉพาะ JSON array 5 รายการเรียงจาก จัตวา, ตรี, โท, เอก, สามัญ ตัวอย่าง: [{"tone":"เสียงจัตวา","word":"เหมา","type":"high"},{"tone":"เสียงตรี","word":"เม้า","type":"low"},{"tone":"เสียงโท","words":["เม่า","เหม้า"],"type":"pair"},{"tone":"เสียงเอก","word":"เหม่","type":"high"},{"tone":"เสียงสามัญ","word":"เมา","type":"low"}] (บรรทัดใดผันไม่ได้ในหลักภาษาไทยให้ใส่ word เป็นว่าง)`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const toneNames = ['เสียงจัตวา', 'เสียงตรี', 'เสียงโท', 'เสียงเอก', 'เสียงสามัญ'];
      const marks = ['—', '◌้', '◌่ / ◌้', '◌่', '—'];
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
      setAnalysisInfo(analyzeSyllable(word));
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

  // กำหนดสไตล์ตามธีมกระดาน
  const themeStyles = {
    notebook: { bg: '#ffffff', line: '#94a3b8', text: '#1f2937', header: '#ea580c' },
    blackboard: { bg: '#1e293b', line: '#64748b', text: '#f8fafc', header: '#f97316' },
    dark: { bg: '#0f172a', line: '#334155', text: '#e2e8f0', header: '#fb923c' }
  };

  const currentTheme = themeStyles[themeMode];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: themeMode === 'notebook' ? '#f0f2f5' : '#090d16', padding: '24px 15px', fontFamily: "'Sarabun', sans-serif" }}>
      <div style={{ maxWidth: viewLayout === 'split' ? '1280px' : '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แถบสลับมุมมองหน้าจอ และ สลับธีมกระดาน */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🖥️ มุมมองการแสดงผล & 🎨 ธีม:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setViewLayout('standard')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'standard' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              📱 ชิดเดียว
            </button>
            <button 
              onClick={() => setViewLayout('split')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'split' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              🖥️ แบ่ง 2 จอ
            </button>
            <button 
              onClick={() => setViewLayout('present')}
              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'present' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'present' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              🎥 โหมดกระดานพรีวิว
            </button>
            <select
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              <option value="notebook">📖 ธีมกระดานขาวสมุดเรียน</option>
              <option value="blackboard">🏫 ธีมกระดานดำโรงเรียน</option>
              <option value="dark">🌙 ธีมโหมดมืด (Dark)</option>
            </select>
          </div>
        </div>

        {/* โครงสร้างแบ่ง layout ตามโหมด */}
        <div style={{ display: 'grid', gridTemplateColumns: viewLayout === 'split' ? '410px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* แผงควบคุม (Control Panel) */}
          {viewLayout !== 'present' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุม</h3>
                <button 
                  onClick={() => setShowApiInput(!showApiInput)}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
                >
                  🔑 {apiKey ? 'เปลี่ยน Gemini Key' : 'เชื่อมต่อ AI'}
                </button>
              </div>

              {showApiInput && (
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #94a3b8' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="password" 
                      placeholder="วาง Gemini API Key..." 
                      value={tempApiKey} 
                      onChange={(e) => setTempApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button 
                      onClick={handleSaveApiKey}
                      style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    >
                      บันทึก
                    </button>
                  </div>
                  {apiSaveStatus && <div style={{ color: '#059669', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
                </div>
              )}

              {/* ตั้งค่าสีประจำหมู่ และสีตัวอักษร */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <label style={{ height: '36px', backgroundColor: colorMid, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรกลาง
                    <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '36px', backgroundColor: colorHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรสูง
                    <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '36px', backgroundColor: colorLow, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    อักษรต่ำ
                    <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                  <label style={{ height: '36px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1' }}>
                    สีตัวอักษร
                    <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  </label>
                </div>
              </div>

              {/* เลือกโหมดผัน และ ช่องพิมพ์คำ */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>✨ ตัวช่วยผันวรรณยุกต์</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', fontSize: '13px', color: '#334155' }}>
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                    placeholder="พิมพ์คำเอง เช่น เมา, กา, ขอ, คอ, คะ" 
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                  />
                  <button 
                    onClick={handleGenerateAI}
                    disabled={loading}
                    style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {loading ? '...' : 'ผันคำ'}
                  </button>
                </div>
              </div>

              {/* ปุ่มพยัญชนะเลือกด่วน */}
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>🔤 เลือกพยัญชนะด่วน:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickConsonants.map((c) => (
                    <button 
                      key={c}
                      onClick={() => handleQuickConsonantClick(c)}
                      style={{ 
                        padding: '4px 7px', 
                        borderRadius: '6px', 
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

              {/* ปุ่มสระเลือกด่วน (สระเสียงยาว คำเป็น) */}
              <div>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold', marginBottom: '6px' }}>🟢 เลือกสระด่วน - สระเสียงยาว (คำเป็น):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickVowelsLong.map((v, i) => (
                    <button 
                      key={i}
                      onClick={() => handleQuickVowelClick(v)}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid #bbf7d0', 
                        backgroundColor: '#f0fdf4', 
                        fontSize: '13px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: '#15803d'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ปุ่มสระเลือกด่วน (สระเสียงสั้น คำตาย) */}
              <div>
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 'bold', marginBottom: '6px' }}>🔴 เลือกสระด่วน - สระเสียงสั้น (คำตาย):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickVowelsShort.map((v, i) => (
                    <button 
                      key={i}
                      onClick={() => handleQuickVowelClick(v)}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid #fecaca', 
                        backgroundColor: '#fef2f2', 
                        fontSize: '13px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: '#b91c1c'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* กระดานบรรทัด 5 เส้น (Line Board) */}
          <div style={{ backgroundColor: currentTheme.bg, borderRadius: '16px', padding: viewLayout === 'present' ? '40px 50px' : '35px 25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: themeMode !== 'notebook' ? '1px solid #334155' : 'none', transition: 'all 0.3s ease' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ textAlign: 'center', color: currentTheme.header, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                ไตรยางศ์ หรือ อักษร 3 หมู่
              </h2>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePlaySequence}
                  disabled={isPlayingAudio}
                  style={{
                    backgroundColor: isPlayingAudio ? '#94a3b8' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: isPlayingAudio ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                  }}
                >
                  🔊 {isPlayingAudio ? 'กำลังเล่นเสียงผัน...' : '► อ่านผัน 5 เสียงต่อเนื่อง'}
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🖨️ พิมพ์กระดาน
                </button>
              </div>
            </div>

            {/* กล่องแสดงผลวิเคราะห์ คำเป็น/คำตาย สระเสียงสั้น/ยาว */}
            {analysisInfo.desc && (
              <div style={{ backgroundColor: themeMode === 'notebook' ? '#f0f9ff' : '#1e293b', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', color: themeMode === 'notebook' ? '#0369a1' : '#38bdf8', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: themeMode === 'notebook' ? '#e0f2fe' : '#0369a1', color: themeMode === 'notebook' ? '#0369a1' : '#fff', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            {/* หัวคอลัมน์ */}
            <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 110px', marginBottom: '15px', color: themeMode === 'notebook' ? '#64748b' : '#94a3b8', fontWeight: 'bold', fontSize: '15px' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px' }}>รูปวรรณยุกต์</div>
              <div style={{ textAlign: 'center' }}>เส้นบรรทัดและตำแหน่งเสียงผัน</div>
              <div style={{ textAlign: 'center' }}>ระดับเสียง</div>
            </div>

            {/* บรรทัด 5 เส้น */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
              {linesData.map((item, idx) => {
                let rowHeaderColor = themeMode === 'notebook' ? '#94a3b8' : '#64748b';
                if (item.show) {
                  rowHeaderColor = item.isMulti ? item.multi[0]?.color : item.color;
                }

                const fixedRight = fixedRightLabels[item.id];
                const isHighlight = activeSpeechIdx === item.id;

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '230px 1fr 110px', alignItems: 'center' }}>
                    
                    {/* ชื่อเสียงและรูปวรรณยุกต์ด้านหน้า */}
                    <div style={{ textAlign: 'right', paddingRight: '20px', fontSize: '17px', color: rowHeaderColor, fontWeight: 'bold', transition: 'color 0.2s ease' }}>
                      {item.tone} <span style={{ fontSize: '17px', marginLeft: '4px', letterSpacing: '1px' }}>[ {item.mark} ]</span>
                    </div>

                    {/* เส้นแนวนอนและวงกลมตัวอักษร */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: currentTheme.line }}></div>

                      {/* วงกลมเดี่ยว (พร้อมปรับขนาดอักษรอัตโนมัติ getFontSize) */}
                      {!item.isMulti && item.show && item.word && (
                        <div 
                          onClick={() => speakWord(item.word)}
                          style={{
                            position: 'absolute',
                            left: item.leftPos,
                            transform: `translateX(-50%) ${isHighlight ? 'scale(1.25)' : 'scale(1)'}`,
                            backgroundColor: item.color,
                            color: circleTextColor,
                            minWidth: '46px',
                            height: '46px',
                            padding: '0 8px',
                            borderRadius: '23px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: getFontSize(item.word),
                            boxShadow: isHighlight ? '0 0 16px rgba(250,204,21,0.9)' : '0 3px 8px rgba(0,0,0,0.25)',
                            border: isHighlight ? '3px solid #facc15' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = `translateX(-50%) ${isHighlight ? 'scale(1.25)' : 'scale(1)'}`; }}
                          title="กดเพื่อฟังเสียงอ่าน"
                        >
                          {item.word}
                        </div>
                      )}

                      {/* วงกลมคู่สำหรับเสียงโท */}
                      {item.isMulti && item.show && (
                        <div style={{ position: 'absolute', left: item.leftPos, transform: `translateX(-50%) ${isHighlight ? 'scale(1.15)' : 'scale(1)'}`, display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s ease' }}>
                          {item.multi.map((circle, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span style={{ color: currentTheme.line, fontWeight: 'bold', fontSize: '20px' }}>/</span>}
                              <div 
                                onClick={() => speakWord(circle.text)}
                                style={{
                                  backgroundColor: circle.color,
                                  color: circleTextColor,
                                  minWidth: '46px',
                                  height: '46px',
                                  padding: '0 8px',
                                  borderRadius: '23px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: getFontSize(circle.text),
                                  boxShadow: isHighlight ? '0 0 16px rgba(250,204,21,0.9)' : '0 3px 8px rgba(0,0,0,0.25)',
                                  border: isHighlight ? '3px solid #facc15' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                title="กดเพื่อฟังเสียงอ่าน"
                              >
                                {circle.text}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ข้อความท้ายเส้นคงที่ตลอดเวลา (เสียงสูง / เสียงกลาง / เสียงต่ำ) */}
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