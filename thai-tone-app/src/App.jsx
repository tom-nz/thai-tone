import React, { useState } from 'react';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [mode, setMode] = useState('pair'); // 'single' | 'pair'
  const [inputText, setInputText] = useState('คอ');
  const [loading, setLoading] = useState(false);

  // สีประจำหมู่
  const [colorMid, setColorMid] = useState('#22c55e');
  const [colorHigh, setColorHigh] = useState('#ef4444');
  const [colorLow, setColorLow] = useState('#3b82f6');

  // ข้อมูลเส้น 5 เส้น
  const [linesData, setLinesData] = useState([
    { tone: 'เสียงจัตวา', mark: '', word: 'ขอ', color: '#ef4444', isMulti: false, multi: [], rightText: 'เสียงสูง', rightColor: '#ef4444', show: true },
    { tone: 'เสียงตรี', mark: ' ๊ ', word: 'ค้อ', color: '#3b82f6', isMulti: false, multi: [], rightText: '', rightColor: '', show: true },
    { 
      tone: 'เสียงโท', 
      mark: ' ้ ', 
      isMulti: true, 
      multi: [
        { text: 'ค่อ', color: '#3b82f6' },
        { text: 'ข้อ', color: '#ef4444' }
      ],
      rightText: 'เสียงกลาง', 
      rightColor: '#22c55e',
      show: true
    },
    { tone: 'เสียงเอก', mark: ' ่ ', word: 'ข่อ', color: '#ef4444', isMulti: false, multi: [], rightText: '', rightColor: '', show: true },
    { tone: 'เสียงสามัญ', mark: '', word: 'คอ', color: '#3b82f6', isMulti: false, multi: [], rightText: 'เสียงต่ำ', rightColor: '#3b82f6', show: true }
  ]);

  // ฟังก์ชันคำนวณออฟไลน์เบื้องต้น
  const fallbackCalculate = (word) => {
    const pairMap = { 'ค': 'ข', 'ข': 'ค', 'ช': 'ฉ', 'ฉ': 'ช', 'ท': 'ถ', 'ถ': 'ท', 'พ': 'ผ', 'ผ': 'พ', 'ฟ': 'ฝ', 'ฝ': 'ฟ', 'ฮ': 'ห', 'ห': 'ฮ' };
    const highC = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
    const midC = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
    const init = word[0] || 'ค';
    const rest = word.slice(1);

    if (midC.includes(init)) {
      return [
        { tone: 'เสียงจัตวา', mark: ' ๋ ', word: `${init}๋${rest}`, color: colorMid, isMulti: false, show: true, rightText: 'เสียงกลาง', rightColor: colorMid },
        { tone: 'เสียงตรี', mark: ' ๊ ', word: `${init}๊${rest}`, color: colorMid, isMulti: false, show: true, rightText: '', rightColor: '' },
        { tone: 'เสียงโท', mark: ' ้ ', word: `${init}้${rest}`, color: colorMid, isMulti: false, show: true, rightText: '', rightColor: '' },
        { tone: 'เสียงเอก', mark: ' ่ ', word: `${init}่${rest}`, color: colorMid, isMulti: false, show: true, rightText: '', rightColor: '' },
        { tone: 'เสียงสามัญ', mark: '', word: word, color: colorMid, isMulti: false, show: true, rightText: '', rightColor: '' },
      ];
    }

    let l = init;
    let h = pairMap[init] || 'ข';
    if (highC.includes(init)) {
      h = init;
      l = Object.keys(pairMap).find(k => pairMap[k] === init) || 'ค';
    }

    return [
      { tone: 'เสียงจัตวา', mark: '', word: `${h}${rest}`, color: colorHigh, isMulti: false, show: true, rightText: 'เสียงสูง', rightColor: colorHigh },
      { tone: 'เสียงตรี', mark: ' ๊ ', word: `${l}้${rest}`, color: colorLow, isMulti: false, show: true, rightText: '', rightColor: '' },
      { 
        tone: 'เสียงโท', 
        mark: ' ้ ', 
        isMulti: true, 
        multi: [{ text: `${l}่${rest}`, color: colorLow }, { text: `${h}้${rest}`, color: colorHigh }],
        rightText: 'เสียงกลาง', 
        rightColor: colorMid,
        show: true
      },
      { tone: 'เสียงเอก', mark: ' ่ ', word: `${h}่${rest}`, color: colorHigh, isMulti: false, show: true, rightText: '', rightColor: '' },
      { tone: 'เสียงสามัญ', mark: '', word: `${l}${rest}`, color: colorLow, isMulti: false, show: true, rightText: 'เสียงต่ำ', rightColor: colorLow },
    ];
  };

  // เรียกใช้ AI API
  const handleAIGenerate = async () => {
    const word = inputText.trim();
    if (!word) return;

    if (!apiKey) {
      // ทำงานแบบ Fallback
      setLinesData(fallbackCalculate(word));
      return;
    }

    setLoading(true);
    try {
      const prompt = `วิเคราะห์การผันวรรณยุกต์ 5 เสียงของคำว่า "${word}" (รูปแบบ: ${mode === 'pair' ? 'ผันคู่สูง-ต่ำ' : 'ผันเฉพาะคำ'}) ตอบกลับเฉพาะ JSON Array 5 รายการเรียงจาก จัตวา, ตรี, โท, เอก, สามัญ ตัวอย่างรูปแบบ: [{"tone":"เสียงจัตวา","word":"ขอ","type":"high"},{"tone":"เสียงตรี","word":"ค้อ","type":"low"},{"tone":"เสียงโท","words":["ค่อ","ข้อ"],"type":"pair"},{"tone":"เสียงเอก","word":"ข่อ","type":"high"},{"tone":"เสียงสามัญ","word":"คอ","type":"low"}]`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const textResult = data.candidates[0].content.parts[0].text;
      const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const formatted = parsed.map((item, idx) => {
        const toneNames = ['เสียงจัตวา', 'เสียงตรี', 'เสียงโท', 'เสียงเอก', 'เสียงสามัญ'];
        const marks = ['', ' ๊ ', ' ้ ', ' ่ ', ''];
        
        let color = colorMid;
        if (item.type === 'high') color = colorHigh;
        if (item.type === 'low') color = colorLow;

        if (Array.isArray(item.words)) {
          return {
            tone: toneNames[idx],
            mark: marks[idx],
            isMulti: true,
            multi: item.words.map((w, i) => ({ text: w, color: i === 0 ? colorLow : colorHigh })),
            rightText: idx === 2 ? 'เสียงกลาง' : '',
            rightColor: colorMid,
            show: true
          };
        }

        return {
          tone: toneNames[idx],
          mark: marks[idx],
          word: item.word,
          color: color,
          isMulti: false,
          rightText: idx === 0 ? 'เสียงสูง' : idx === 4 ? 'เสียงต่ำ' : '',
          rightColor: color,
          show: !!item.word
        };
      });

      setLinesData(formatted);
    } catch (err) {
      setLinesData(fallbackCalculate(word));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '30px 15px', fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* แผงควบคุม */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>แผงควบคุม</h3>
            <button 
              onClick={() => setShowApiInput(!showApiInput)}
              style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}
            >
              🔑 {apiKey ? 'เปลี่ยน Gemini API Key' : 'เชื่อมต่อ Gemini API (ตัวเลือกเสริม)'}
            </button>
          </div>

          {showApiInput && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <input 
                type="password" 
                placeholder="วาง Gemini API Key ที่นี่ (ถ้าไม่มี ระบบจะใช้ตรรกะมาตรฐานอัตโนมัติ)" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* ปรับแต่งสีประจำหมู่ */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>🎨 ตั้งค่าสีประจำหมู่</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <label style={{ height: '36px', backgroundColor: colorMid, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                อักษรกลาง
                <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
              <label style={{ height: '36px', backgroundColor: colorHigh, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                อักษรสูง
                <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
              <label style={{ height: '36px', backgroundColor: colorLow, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                อักษรต่ำ
                <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              </label>
            </div>
          </div>

          {/* ส่วนสร้างคำ */}
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '14px', color: '#4b5563' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={mode === 'single'} onChange={() => setMode('single')} />
                ผันเฉพาะคำนั้น
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="mode" checked={mode === 'pair'} onChange={() => setMode('pair')} />
                ผันคู่อักษรสูง-ต่ำ (เช่น คอ ขอ ค่อ/ข้อ ค้อ ขอ)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                placeholder="กรอกคำที่ต้องการ เช่น ขอ, กา, คอ, ปา" 
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '15px' }}
              />
              <button 
                onClick={handleAIGenerate}
                disabled={loading}
                style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                {loading ? 'กำลังประมวลผล...' : 'สร้างคำด้วย AI'}
              </button>
            </div>
          </div>
        </div>

        {/* กระดานบรรทัด 5 เส้น */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h2 style={{ textAlign: 'center', color: '#ea580c', fontSize: '28px', fontWeight: 'bold', margin: '0 0 35px 0' }}>
            ไตรยางศ์ หรือ อักษร 3 หมู่
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', marginBottom: '15px', color: '#4b5563', fontWeight: 'bold', fontSize: '15px' }}>
            <div>รูปวรรณยุกต์</div>
            <div></div>
            <div></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {linesData.map((item, idx) => {
              const leftPositions = ['80%', '65%', '55%', '45%', '35%'];
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px', alignItems: 'center' }}>
                  
                  {/* ซ้าย */}
                  <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                    {item.tone} <span style={{ color: '#9ca3af' }}>[{item.mark}]</span>
                  </div>

                  {/* กลาง */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '24px' }}>
                    <div style={{ width: '100%', height: '2px', backgroundColor: '#9ca3af' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: leftPositions[idx],
                          transform: 'translateX(-50%)',
                          backgroundColor: item.color,
                          color: '#ffffff',
                          minWidth: '38px',
                          height: '38px',
                          padding: '0 8px',
                          borderRadius: '19px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                      >
                        {item.word}
                      </div>
                    )}

                    {item.isMulti && item.show && (
                      <div style={{ position: 'absolute', left: leftPositions[idx], transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.multi.map((circle, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '18px' }}>/</span>}
                            <div 
                              style={{
                                backgroundColor: circle.color,
                                color: '#ffffff',
                                minWidth: '38px',
                                height: '38px',
                                padding: '0 8px',
                                borderRadius: '19px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '15px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {circle.text}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ขวา */}
                  <div style={{ textAlign: 'center', color: item.rightColor, fontWeight: 'bold', fontSize: '15px' }}>
                    {item.rightText}
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

export default App;