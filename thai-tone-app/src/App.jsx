import React, { useState, useEffect } from 'react';

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  const [mode, setMode] = useState('full5');
  const [viewLayout, setViewLayout] = useState('split');
  const [inputText, setInputText] = useState('เมา');
  const [loading, setLoading] = useState(false);

  const [colorMid, setColorMid] = useState('#22c55e');
  const [colorHigh, setColorHigh] = useState('#ef4444');
  const [colorLow, setColorLow] = useState('#007bff');
  const [circleTextColor, setCircleTextColor] = useState('#ffffff');

  const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
  const [linesData, setLinesData] = useState([]);

  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

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
    { label: '-อ', front: '', rear: 'อ' },
  ];

  const shortVowels = [
    { label: '-ะ', front: '', rear: 'ะ' },
    { label: '-ิ', front: '', rear: 'ิ' },
    { label: '-ึ', front: '', rear: 'ึ' },
    { label: '-ุ', front: '', rear: 'ุ' },
    { label: 'เ-ะ', front: 'เ', rear: 'ะ' },
    { label: 'แ-ะ', front: 'แ', rear: 'ะ' },
    { label: 'โ-ะ', front: 'โ', rear: 'ะ' },
    { label: 'เ-าะ', front: 'เ', rear: 'าะ' },
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

  const parseThaiWord = (word) => {
    if (!word) return { initial: 'ม', frontVowel: '', rearVowel: '', toneMark: '' };
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
    return { initial: initial || 'ม', frontVowel, rearVowel, toneMark };
  };

  const buildWord = (frontVowel, consonant, tone, rearVowel) => {
    return `${frontVowel}${consonant}${tone}${rearVowel}`;
  };

  const analyzeSyllable = (word) => {
    const { initial, frontVowel, rearVowel } = parseThaiWord(word);
    const shortVowelChars = ['ะ', 'ิ', 'ึ', 'ุ', 'ั'];
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
      desc = isDead ? 'อักษรสูง คำตาย (ผันได้เฉพาะ เสียงเอก และ เสียงโท)' : 'อักษรสูง คำเป็น (ผันได้เฉพาะ เอก, โท, จัตวา)';
    } else {
      desc = isDead 
        ? (isShort ? 'อักษรต่ำ คำตายสระสั้น (พื้นเสียงคือตรี, ผันเสียงโท และจัตวาได้)' : 'อักษรต่ำ คำตายสระยาว (พื้นเสียงคือโท, ผันเสียงตรีได้)')
        : 'อักษรต่ำ คำเป็น (ผันได้ สามัญ, โท, ตรี)';
    }

    return { type: typeText, vowelLen: lenText, desc, isDead, isShort, initial, frontVowel, rearVowel };
  };

  const calculateTones = (word, currentMode, midC, highC, lowC) => {
    if (!word) return [];
    const info = analyzeSyllable(word);
    setAnalysisInfo(info);
    const { initial, frontVowel, rearVowel, isDead, isShort } = info;

    if (midConsonants.includes(initial)) {
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

    if (highConsonants.includes(initial)) {
      highConsonant = initial;
      lowConsonant = Object.keys(pairMap).find(k => pairMap[k] === initial) || initial;
    } else if (lowSingleConsonants.includes(initial)) {
      lowConsonant = initial;
      highConsonant = `ห${initial}`;
    } else {
      lowConsonant = initial;
      highConsonant = pairMap[initial] || `ห${initial}`;
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
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, isShort ? '' : '้', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, lowConsonant, isShort ? '่' : '', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    } else {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, '', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, isDead && isShort ? '' : '้', rearVowel), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', isMulti: true, multi: [
            { text: buildWord(frontVowel, lowConsonant, '่', rearVowel), color: lowC },
            { text: buildWord(frontVowel, highConsonant, '้', rearVowel), color: highC }
          ], show: true, leftPos: '52%'
        },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, '่', rearVowel), color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }
  };

  useEffect(() => {
    setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
  }, [inputText, mode, colorMid, colorHigh, colorLow]);

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

  const handleQuickVowelClick = (vowel) => {
    const { initial } = parseThaiWord(inputText);
    const newWord = buildWord(vowel.front, initial || 'ก', '', vowel.rear);
    setInputText(newWord);
  };

  const handleGenerate = async () => {
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
      const marks = ['◌๋', '◌๊', '◌้', '◌่', '—'];
      const leftPositions = ['80%', '65%', '52%', '40%', '28%'];

      const formatted = parsed.map((item, idx) => {
        let col = colorMid;
        if (item.type === 'high') col = colorHigh;
        if (item.type === 'low') col = colorLow;
        if (Array.isArray(item.words)) {
          return { id: 5 - idx, tone: toneNames[idx], mark: marks[idx], isMulti: true, multi: item.words.map((w, i) => ({ text: w, color: i === 0 ? colorLow : colorHigh })), show: item.words.length > 0, leftPos: leftPositions[idx] };
        }
        return { id: 5 - idx, tone: toneNames[idx], mark: marks[idx], word: item.word || '', color: col, isMulti: false, multi: [], show: Boolean(item.word), leftPos: leftPositions[idx] };
      });
      setLinesData(formatted);
      setAnalysisInfo(analyzeSyllable(word));
    } catch (err) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
    } finally {
      setLoading(false);
    }
  };

  const fixedRightLabels = { 5: { text: 'เสียงสูง', color: '#ef4444' }, 3: { text: 'เสียงกลาง', color: '#22c55e' }, 1: { text: 'เสียงต่ำ', color: '#007bff' } };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '24px 15px', fontFamily: "'Sarabun', sans-serif" }}>
      <div style={{ maxWidth: viewLayout === 'split' ? '1320px' : '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>🖥️ เลือกมุมมองการแสดงผล:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setViewLayout('standard')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'standard' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>📱 มุมมองมาตรฐาน</button>
            <button onClick={() => setViewLayout('split')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'split' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>🖥️ มุมมอง 2 จอ (แบ่งซ้าย-ขวา)</button>
            <button onClick={() => setViewLayout('present')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: viewLayout === 'present' ? '#0284c7' : '#f1f5f9', color: viewLayout === 'present' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>🎥 โหมดกระดานพรีวิว (สำหรับบันทึกภาพ/วิดีโอ)</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: viewLayout === 'split' ? '440px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {viewLayout !== 'present' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุม</h3>
                <button onClick={() => setShowApiInput(!showApiInput)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>🔑 {apiKey ? 'เปลี่ยน Gemini Key' : 'เชื่อมต่อ AI'}</button>
              </div>

              {showApiInput && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #94a3b8' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="password" placeholder="วาง Gemini API Key..." value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()} style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    <button onClick={handleSaveApiKey} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>บันทึก</button>
                  </div>
                  {apiSaveStatus && <div style={{ color: '#059669', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <label style={{ height: '36px', backgroundColor: colorMid, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>อักษรกลาง<input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} /></label>
                  <label style={{ height: '36px', backgroundColor: colorHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>อักษรสูง<input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} /></label>
                  <label style={{ height: '36px', backgroundColor: colorLow, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>อักษรต่ำ<input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} /></label>
                  <label style={{ height: '36px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1' }}>สีตัวอักษร<input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} /></label>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>✨ ตัวเลือกการผันเสียงวรรณยุกต์</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', fontSize: '13px', color: '#334155' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="mode" checked={mode === 'full5'} onChange={() => setMode('full5')} />ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="mode" checked={mode === 'highOnly'} onChange={() => setMode('highOnly')} />เฉพาะเสียงสูง (เอก, โท, จัตวา)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="mode" checked={mode === 'lowOnly'} onChange={() => setMode('lowOnly')} />เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)</label>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} placeholder="พิมพ์คำเอง เช่น เมา, กา, ขอ" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                  <button onClick={handleGenerate} disabled={loading} style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>{loading ? '...' : 'ผันคำ'}</button>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>⌨️ เลือกพยัญชนะด่วน:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickConsonants.map((c) => (<button key={c} onClick={() => handleQuickConsonantClick(c)} style={{ padding: '4px 7px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', color: midConsonants.includes(c) ? colorMid : highConsonants.includes(c) ? colorHigh : colorLow }}>{c}</button>))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '6px' }}>🟢 สระเสียงยาว (คำเป็น):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {longVowels.map((v, i) => (<button key={i} onClick={() => handleQuickVowelClick(v)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{v.label}</button>))}
                </div>
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '6px' }}>🔴 สระเสียงสั้น (คำตาย):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {shortVowels.map((v, i) => (<button key={i} onClick={() => handleQuickVowelClick(v)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{v.label}</button>))}
                </div>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: viewLayout === 'present' ? '40px 50px' : '35px 25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ textAlign: 'center', color: '#ea580c', fontSize: '28px', fontWeight: 'bold', margin: '0 0 20px 0' }}>ไตรยางศ์ หรือ อักษร 3 หมู่</h2>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 110px', marginBottom: '15px', color: '#64748b', fontWeight: 'bold', fontSize: '15px' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px' }}>รูปวรรณยุกต์</div>
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

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '230px 1fr 110px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', paddingRight: '20px', fontSize: '17px', color: rowHeaderColor, fontWeight: 'bold', transition: 'color 0.2s ease' }}>
                      {item.tone} <span style={{ fontSize: '17px', marginLeft: '4px', letterSpacing: '1px' }}>[ {item.mark} ]</span>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                      {!item.isMulti && item.show && item.word && (
                        <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', backgroundColor: item.color, color: circleTextColor, minWidth: '46px', height: '46px', padding: '0 10px', borderRadius: '23px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 3px 8px rgba(0,0,0,0.25)', cursor: 'pointer', transition: 'transform 0.15s ease, filter 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}>
                          {item.word}
                        </div>
                      )}

                      {item.isMulti && item.show && (
                        <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.multi.map((circle, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '20px' }}>/</span>}
                              <div style={{ backgroundColor: circle.color, color: circleTextColor, minWidth: '46px', height: '46px', padding: '0 10px', borderRadius: '23px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 3px 8px rgba(0,0,0,0.25)', cursor: 'pointer', transition: 'transform 0.15s ease, filter 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}>
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