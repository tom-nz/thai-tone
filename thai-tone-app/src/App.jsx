import React, { useState, useEffect } from 'react';

export default function App() {
  // บันทึกและดึง Gemini API Key จากเบราว์เซอร์อัตโนมัติ (LocalStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
  const [inputText, setInputText] = useState('เมา');
  const [loading, setLoading] = useState(false);

  // การตั้งค่าสี
  const [colorMid, setColorMid] = useState('#22c55e');    // อักษรกลาง (เขียว)
  const [colorHigh, setColorHigh] = useState('#ef4444');   // อักษรสูง (แดง)
  const [colorLow, setColorLow] = useState('#007bff');    // อักษรต่ำ (น้ำเงิน)
  const [circleTextColor, setCircleTextColor] = useState('#ffffff'); // สีตัวอักษรในวงกลม

  // ข้อมูลเส้น 5 เส้น
  const [linesData, setLinesData] = useState([]);

  // พยัญชนะไทยแยกตามหมู่
  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

  // แป้นพิมพ์พยัญชนะด่วนสำหรับเลือกฝึกผัน
  const quickConsonants = [
    'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ด', 'ต', 
    'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ม', 
    'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ', 'ฮ'
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

  // ฟังก์ชันแยกพยัญชนะต้นและโครงสร้างสระ (รองรับสระหน้า เช่น เ, แ, โ, ใ, ไ)
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

    for (let char of workStr) {
      if (['่', '้', '๊', '๋'].includes(char)) {
        toneMark = char;
      } else if (!initial) {
        initial = char;
      } else {
        rearVowel += char;
      }
    }

    return { initial, frontVowel, rearVowel, toneMark };
  };

  // ฟังก์ชันประกอบคำ
  const buildWord = (frontVowel, consonant, tone, rearVowel) => {
    return `${frontVowel}${consonant}${tone}${rearVowel}`;
  };

  // ตรรกะการผันอักษรไตรยางศ์ภาษาไทย
  const calculateTones = (word, currentMode, midC, highC, lowC) => {
    if (!word) return [];
    const { initial, frontVowel, rearVowel } = parseThaiWord(word);
    
    // 1. กรณีอักษรกลาง (ผันครบ 5 เสียงเสมอ)
    if (midConsonants.includes(initial)) {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, initial, '๋', rearVowel), color: midC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, initial, '๊', rearVowel), color: midC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, '้', rearVowel), color: midC, isMulti: false, multi: [], rightText: 'เสียงกลาง', rightColor: midC, show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, initial, '่', rearVowel), color: midC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: buildWord(frontVowel, initial, '', rearVowel), color: midC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '28%' }
      ];
    }

    // กำหนดคู่เสียงสูง-ต่ำ
    let highConsonant = '';
    let lowConsonant = '';

    if (highConsonants.includes(initial)) {
      highConsonant = initial;
      lowConsonant = Object.keys(pairMap).find(k => pairMap[k] === initial) || initial;
    } else if (lowSingleConsonants.includes(initial)) {
      lowConsonant = initial;
      highConsonant = `ห${initial}`; // ต่ำเดี่ยวใช้ ห นำ
    } else {
      lowConsonant = initial;
      highConsonant = pairMap[initial] || `ห${initial}`; // ต่ำคู่
    }

    if (currentMode === 'highOnly') {
      // ผันเฉพาะเสียงสูง (เอก, โท, จัตวา)
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, '', rearVowel), color: highC, isMulti: false, multi: [], rightText: 'เสียงสูง', rightColor: highC, show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: highC, isMulti: false, multi: [], rightText: '', show: false, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, highConsonant, '้', rearVowel), color: highC, isMulti: false, multi: [], rightText: 'เสียงกลาง', rightColor: midC, show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, '่', rearVowel), color: highC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: '', color: highC, isMulti: false, multi: [], rightText: '', show: false, leftPos: '28%' }
      ];
    } else if (currentMode === 'lowOnly') {
      // ผันเฉพาะเสียงต่ำ (สามัญ, โท, ตรี)
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: lowC, isMulti: false, multi: [], rightText: 'เสียงสูง', rightColor: highC, show: false, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, '้', rearVowel), color: lowC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, lowConsonant, '่', rearVowel), color: lowC, isMulti: false, multi: [], rightText: 'เสียงกลาง', rightColor: midC, show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: lowC, isMulti: false, multi: [], rightText: '', show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], rightText: 'เสียงต่ำ', rightColor: lowC, show: true, leftPos: '28%' }
      ];
    } else {
      // โหมดครบ 5 บรรทัด (ผันคู่ สูง-ต่ำ / ห นำ)
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, '', rearVowel), color: highC, isMulti: false, multi: [], rightText: 'เสียงสูง', rightColor: highC, show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, '้', rearVowel), color: lowC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '65%' },
        { 
          id: 3, 
          tone: 'เสียงโท', 
          mark: '◌้', 
          isMulti: true, 
          multi: [
            { text: buildWord(frontVowel, lowConsonant, '่', rearVowel), color: lowC },
            { text: buildWord(frontVowel, highConsonant, '้', rearVowel), color: highC }
          ],
          rightText: 'เสียงกลาง', 
          rightColor: midC,
          show: true,
          leftPos: '52%'
        },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, '่', rearVowel), color: highC, isMulti: false, multi: [], rightText: '', show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '—', word: buildWord(frontVowel, lowConsonant, '', rearVowel), color: lowC, isMulti: false, multi: [], rightText: 'เสียงต่ำ', rightColor: lowC, show: true, leftPos: '28%' }
      ];
    }
  };

  // อัปเดตเมื่อมีการเปลี่ยนค่าสีหรือโหมด
  useEffect(() => {
    setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
  }, [inputText, mode, colorMid, colorHigh, colorLow]);

  // จัดการการบันทึก API Key ลง LocalStorage
  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setApiSaveStatus('บันทึก API Key เรียบร้อยแล้ว!');
    setTimeout(() => setApiSaveStatus(''), 3000);
  };

  // เลือกพยัญชนะด่วนเพื่อผันเสียง
  const handleQuickConsonantClick = (c) => {
    const { frontVowel, rearVowel } = parseThaiWord(inputText);
    const newWord = buildWord(frontVowel || '', c, '', rearVowel || 'อ');
    setInputText(newWord);
  };

  // กดปุ่มสร้างคำด้วย AI หรืออัลกอริทึม
  const handleGenerate = async () => {
    const word = inputText.trim();
    if (!word) return;

    if (!apiKey) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
      return;
    }

    setLoading(true);
    try {
      const modeDesc = mode === 'highOnly' ? 'เฉพาะเสียงสูง' : mode === 'lowOnly' ? 'เฉพาะเสียงต่ำ' : 'ผันครบ 5 เสียง';
      const promptText = `วิเคราะห์การผันวรรณยุกต์ภาษาไทยของคำว่า "${word}" โหมด "${modeDesc}" ส่งคืนเฉพาะ JSON array 5 รายการเรียงจาก จัตวา, ตรี, โท, เอก, สามัญ ตัวอย่าง: [{"tone":"เสียงจัตวา","word":"เหมา","type":"high"},{"tone":"เสียงตรี","word":"เม้า","type":"low"},{"tone":"เสียงโท","words":["เม่า","เหม้า"],"type":"pair"},{"tone":"เสียงเอก","word":"เหม่","type":"high"},{"tone":"เสียงสามัญ","word":"เมา","type":"low"}]`;
      
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
          return {
            id: 5 - idx,
            tone: toneNames[idx],
            mark: marks[idx],
            isMulti: true,
            multi: item.words.map((w, i) => ({ text: w, color: i === 0 ? colorLow : colorHigh })),
            rightText: idx === 2 ? 'เสียงกลาง' : '',
            rightColor: colorMid,
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
          rightText: idx === 0 ? 'เสียงสูง' : idx === 4 ? 'เสียงต่ำ' : idx === 2 ? 'เสียงกลาง' : '',
          rightColor: idx === 0 ? colorHigh : idx === 4 ? colorLow : colorMid,
          show: Boolean(item.word),
          leftPos: leftPositions[idx]
        };
      });

      setLinesData(formatted);
    } catch (err) {
      setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '30px 15px', fontFamily: "'Sarabun', sans-serif" }}>
      <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แผงควบคุม (Control Panel) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุม</h3>
            <button 
              onClick={() => setShowApiInput(!showApiInput)}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
            >
              🔑 {apiKey ? 'เปลี่ยน Gemini API Key' : 'เชื่อมต่อ Gemini API'}
            </button>
          </div>

          {/* ช่องกรอก API Key พร้อมปุ่มบันทึก */}
          {showApiInput && (
            <div style={{ marginBottom: '18px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #94a3b8' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="password" 
                  placeholder="วาง Gemini API Key ที่นี่..." 
                  value={tempApiKey} 
                  onChange={(e) => setTempApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button 
                  onClick={handleSaveApiKey}
                  style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  บันทึก Key
                </button>
              </div>
              {apiSaveStatus && <div style={{ color: '#059669', fontSize: '13px', marginTop: '6px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
            </div>
          )}

          {/* แถบตั้งค่าสีประจำหมู่ และสีตัวอักษร */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <label style={{ height: '38px', backgroundColor: colorMid, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                อักษรกลาง
                <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
              <label style={{ height: '38px', backgroundColor: colorHigh, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                อักษรสูง
                <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
              <label style={{ height: '38px', backgroundColor: colorLow, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                อักษรต่ำ
                <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
              <label style={{ height: '38px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                สีตัวอักษร
                <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
            </div>
          </div>

          {/* แถบเลือกโหมดผัน */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', fontSize: '14px', color: '#334155', flexWrap: 'wrap' }}>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="กรอกคำ เช่น เมา, กา, ขอ, คอ, ปา" 
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 2px 6px rgba(2,132,199,0.3)' }}
              >
                {loading ? 'กำลังประมวลผล...' : 'สร้างคำด้วย AI'}
              </button>
            </div>
          </div>

          {/* ปุ่มพยัญชนะเลือกด่วน */}
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}>⌨️ เลือกพยัญชนะด่วนเพื่อเปลี่ยนเสียง:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickConsonants.map((c) => (
                <button 
                  key={c}
                  onClick={() => handleQuickConsonantClick(c)}
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    border: '1px solid #cbd5e1', 
                    backgroundColor: '#ffffff', 
                    fontSize: '14px', 
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

        </div>

        {/* บรรทัด 5 เส้น */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h2 style={{ textAlign: 'center', color: '#ea580c', fontSize: '28px', fontWeight: 'bold', margin: '0 0 35px 0' }}>
            ไตรยางศ์ หรือ อักษร 3 หมู่
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 120px', marginBottom: '15px', color: '#64748b', fontWeight: 'bold', fontSize: '15px' }}>
            <div style={{ paddingLeft: '10px' }}>รูปวรรณยุกต์</div>
            <div></div>
            <div></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
            {linesData.map((item, idx) => {
              // คำนวณสีของตัวอักษรหน้าบรรทัด: หากมีคำ ให้เปลี่ยนตามกลุ่มอักษร หากไม่มีคำให้เป็นสีเทา
              let rowHeaderColor = '#94a3b8';
              if (item.show) {
                rowHeaderColor = item.isMulti ? item.multi[0]?.color : item.color;
              }

              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '210px 1fr 120px', alignItems: 'center' }}>
                  
                  {/* ชื่อเสียงและรูปวรรณยุกต์ด้านหน้า */}
                  <div style={{ fontSize: '17px', color: rowHeaderColor, fontWeight: 'bold', transition: 'color 0.2s ease' }}>
                    {item.tone} <span style={{ fontSize: '17px', marginLeft: '4px', letterSpacing: '1px' }}>[ {item.mark} ]</span>
                  </div>

                  {/* เส้นแนวนอนและวงกลมตัวอักษร */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }}>
                    <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                    {/* วงกลมเดี่ยว (ขนาดใหญ่ 46px + สีตัวอักษรปรับได้) */}
                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: 'translateX(-50%)',
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
                          boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, filter 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {item.word}
                      </div>
                    )}

                    {/* วงกลมคู่สำหรับเสียงโท */}
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
                                boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, filter 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.15)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                            >
                              {circle.text}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ระดับเสียงขวา */}
                  <div style={{ textAlign: 'center', color: item.rightColor, fontWeight: 'bold', fontSize: '16px' }}>
                    {item.show ? item.rightText : ''}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}