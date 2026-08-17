import React, { useState, useEffect } from 'react';

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [title, setTitle] = useState({
    text: 'ไตรยางศ์ หรือ อักษร 3 หมู่',
    color: '#ea580c'
  });

  const [aiInput, setAiInput] = useState('คอ');
  const [aiMode, setAiMode] = useState('pair'); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [themeColors, setThemeColors] = useState({
    mid: '#22c55e', 
    high: '#ef4444', 
    low: '#3b82f6'   
  });

  const [currentClassDisplay, setCurrentClassDisplay] = useState('คู่'); 
  const [hoveredLineId, setHoveredLineId] = useState(null);

  // ค่าเริ่มต้นสำหรับ คอ (อักษรต่ำคู่)
  const [lines, setLines] = useState([
    { id: 5, text: 'เสียงจัตวา', mark: '[ ◌๋ ]', color: '#374151', noteText: 'ขอ', noteBgColor: '#ef4444', noteBgColor2: '#ef4444', noteTextColor: '#ffffff', noteClass: 'เสียงสูง', noteColor: '#ef4444' },
    { id: 4, text: 'เสียงตรี', mark: '[ ◌๊ ]', color: '#374151', noteText: 'ค้อ', noteBgColor: '#3b82f6', noteBgColor2: '#3b82f6', noteTextColor: '#ffffff', noteClass: '', noteColor: '' },
    { id: 3, text: 'เสียงโท', mark: '[ ◌้ ]', color: '#374151', noteText: 'ค่อ/ข้อ', noteBgColor: '#3b82f6', noteBgColor2: '#ef4444', noteTextColor: '#ffffff', noteClass: 'เสียงกลาง', noteColor: '#22c55e' },
    { id: 2, text: 'เสียงเอก', mark: '[ ◌่ ]', color: '#374151', noteText: 'ข่อ', noteBgColor: '#ef4444', noteBgColor2: '#ef4444', noteTextColor: '#ffffff', noteClass: '', noteColor: '' },
    { id: 1, text: 'เสียงสามัญ', mark: '[   ]', color: '#374151', noteText: 'คอ', noteBgColor: '#3b82f6', noteBgColor2: '#3b82f6', noteTextColor: '#ffffff', noteClass: 'เสียงต่ำ', noteColor: '#3b82f6' },
  ]);

  const handleThemeColorChange = (group, newColor) => {
    const updatedThemeColors = { ...themeColors, [group]: newColor };
    setThemeColors(updatedThemeColors);

    const newLines = [...lines];
    if (currentClassDisplay === 'คู่') {
       newLines.find(l => l.id === 5).noteBgColor = updatedThemeColors.high; 
       newLines.find(l => l.id === 4).noteBgColor = updatedThemeColors.low; 
       newLines.find(l => l.id === 3).noteBgColor = updatedThemeColors.low; 
       newLines.find(l => l.id === 3).noteBgColor2 = updatedThemeColors.high; 
       newLines.find(l => l.id === 2).noteBgColor = updatedThemeColors.high; 
       newLines.find(l => l.id === 1).noteBgColor = updatedThemeColors.low; 
    } else {
       let activeColor = updatedThemeColors.mid;
       if (currentClassDisplay === 'สูง') activeColor = updatedThemeColors.high;
       if (currentClassDisplay === 'ต่ำ') activeColor = updatedThemeColors.low;
       
       newLines.forEach(l => {
         l.noteBgColor = activeColor;
         l.noteBgColor2 = activeColor;
       });
    }
    setLines(newLines);
  };


  useEffect(() => {
    const savedData = localStorage.getItem('tone_app_sync');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.lines) setLines(parsed.lines);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.themeColors) setThemeColors(parsed.themeColors);
        if (parsed.currentClassDisplay) setCurrentClassDisplay(parsed.currentClassDisplay);
      } catch (e) {}
    }

    const handleStorageChange = (e) => {
      if (e.key === 'tone_app_sync' && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (parsed.lines) setLines(parsed.lines);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.themeColors) setThemeColors(parsed.themeColors);
        if (parsed.currentClassDisplay) setCurrentClassDisplay(parsed.currentClassDisplay);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('tone_app_sync', JSON.stringify({ lines, title, themeColors, currentClassDisplay }));
  }, [lines, title, themeColors, currentClassDisplay]);

  const fetchWithRetry = async (url, options, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('API Request Failed');
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  };

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiError('');
    
    const apiKey = ""; 
    
    // กำหนดโครงสร้างข้อมูลให้ AI ส่งกลับมาตามหมายเลขเส้นบรรทัด (id 1 ถึง 5) ที่ถูกต้องตามหลักภาษาไทย
    let promptText = "";
    if (aiMode === 'normal') {
      promptText = `จงผันวรรณยุกต์คำไทยต่อไปนี้: "${aiInput}" ตามหลักไตรยางศ์ ให้ระบุคำในแต่ละเส้นบรรทัดให้ถูกต้องตามหลักภาษาไทย:
      - line1 (เส้นที่ 1 เสียงสามัญ)
      - line2 (เส้นที่ 2 เสียงเอก)
      - line3 (เส้นที่ 3 เสียงโท)
      - line4 (เส้นที่ 4 เสียงตรี)
      - line5 (เส้นที่ 5 เสียงจัตวา)
      หากเสียงใดไม่มีหรือผันไม่ได้ ให้ใส่ "-"
      และระบุหมู่อักษรใน field "class" ว่า "สูง", "กลาง", หรือ "ต่ำ"`;
    } else {
      promptText = `จงผันวรรณยุกต์คำไทยต่อไปนี้: "${aiInput}" โดยใช้หลัก "อักษรคู่ (ต่ำ-สูง)" มาเติมเต็มให้ครบ ให้ระบุคำในแต่ละเส้นบรรทัดดังนี้:
      - line1 (เสียงสามัญ: อักษรต่ำ)
      - line2 (เสียงเอก: อักษรสูง)
      - line3 (เสียงโท: อักษรต่ำ/อักษรสูง เช่น ค่อ/ข้อ)
      - line4 (เสียงตรี: อักษรต่ำ)
      - line5 (เสียงจัตวา: อักษรสูง)
      หากเสียงใดไม่มีให้ใส่ "-"
      และระบุ field "class" ว่า "คู่"`;
    }

    try {
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                line5: { type: "STRING", description: "คำในเส้นที่ 5 (เสียงจัตวา)" }, 
                line4: { type: "STRING", description: "คำในเส้นที่ 4 (เสียงตรี)" }, 
                line3: { type: "STRING", description: "คำในเส้นที่ 3 (เสียงโท)" }, 
                line2: { type: "STRING", description: "คำในเส้นที่ 2 (เสียงเอก)" }, 
                line1: { type: "STRING", description: "คำในเส้นที่ 1 (เสียงสามัญ)" },
                class: { type: "STRING", description: "หมู่อักษร ได้แก่ กลาง, สูง, ต่ำ, คู่" }
              }
            }
          }
        })
      });

      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        const data = JSON.parse(textOutput);
        const newLines = [...lines];
        
        const aiClass = data.class || '';
        setCurrentClassDisplay(aiClass); 

        if (aiClass.includes('คู่') || aiMode === 'pair') {
          newLines.find(l => l.id === 5).noteBgColor = themeColors.high; 
          newLines.find(l => l.id === 4).noteBgColor = themeColors.low; 
          newLines.find(l => l.id === 3).noteBgColor = themeColors.low; 
          newLines.find(l => l.id === 3).noteBgColor2 = themeColors.high; 
          newLines.find(l => l.id === 2).noteBgColor = themeColors.high; 
          newLines.find(l => l.id === 1).noteBgColor = themeColors.low; 
        } else {
          let baseColor = themeColors.mid;
          if (aiClass.includes('สูง')) baseColor = themeColors.high;
          else if (aiClass.includes('ต่ำ')) baseColor = themeColors.low;
          
          newLines.forEach(l => {
            l.noteBgColor = baseColor;
            l.noteBgColor2 = baseColor; 
          });
        }

        // นำข้อมูลตาม line ที่ถูกต้องใส่ลงใน id ของแต่ละเส้น
        newLines.find(l => l.id === 5).noteText = data.line5 || "-";
        newLines.find(l => l.id === 4).noteText = data.line4 || "-";
        newLines.find(l => l.id === 3).noteText = data.line3 || "-";
        newLines.find(l => l.id === 2).noteText = data.line2 || "-";
        newLines.find(l => l.id === 1).noteText = data.line1 || "-";
        setLines(newLines);
      }
    } catch (error) {
      setAiError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col xl:flex-row font-sans">
      {!isFullscreen && (
        <div className="w-full xl:w-[420px] bg-white border-r border-gray-200 p-6 flex-shrink-0 overflow-y-auto shadow-sm z-10">
          
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">แผงควบคุม</h2>
            <button 
              onClick={() => setIsFullscreen(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              โหมดวิดีโอ
            </button>
          </div>

           <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-sm font-bold text-gray-800 mb-3 block border-b pb-1">🎨 ตั้งค่าสีประจำหมู่</label>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">อักษรกลาง</label>
                <input type="color" value={themeColors.mid} onChange={(e) => handleThemeColorChange('mid', e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 p-0" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">อักษรสูง</label>
                <input type="color" value={themeColors.high} onChange={(e) => handleThemeColorChange('high', e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 p-0" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">อักษรต่ำ</label>
                <input type="color" value={themeColors.low} onChange={(e) => handleThemeColorChange('low', e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 p-0" />
              </div>
            </div>
          </div>
          
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-inner">
            <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-4">✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ</label>
            
            <div className="mb-4 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              <label className="text-xs font-bold text-blue-900 mb-2 block">เลือกรูปแบบการผัน:</label>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors">
                  <input type="radio" value="normal" checked={aiMode === 'normal'} onChange={(e) => setAiMode(e.target.value)} className="text-blue-600 focus:ring-blue-500"/>
                  <span className="text-gray-700">ผันเฉพาะคำนั้น (เช่น ข่อ ข้อ ขอ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors">
                  <input type="radio" value="pair" checked={aiMode === 'pair'} onChange={(e) => setAiMode(e.target.value)} className="text-blue-600 focus:ring-blue-500"/>
                  <span className="text-gray-700">ผันคู่อักษรสูง-ต่ำ (เช่น คอ ข่อ ค่อ/ข้อ ค้อ ขอ)</span>
                </label>
              </div>
            </div>

            <input 
              type="text" 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
              className="w-full p-2 border border-blue-300 rounded-lg mb-3 text-sm outline-none"
              placeholder="พิมพ์คำที่ต้องการ (เช่น กอ, ขอ, คอ)"
            />
            <button 
              onClick={handleAIGenerate} disabled={isAiLoading}
              className={`w-full py-2 px-4 rounded-lg text-white font-bold text-sm transition-colors flex justify-center items-center gap-2 ${isAiLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isAiLoading ? 'กำลังประมวลผล...' : 'สร้างคำด้วย AI'}
            </button>
            {aiError && <p className="text-red-500 text-xs mt-2 font-semibold">{aiError}</p>}
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อหลัก</label>
            <input type="text" value={title.text} onChange={(e) => setTitle({...title, text: e.target.value})} className="w-full p-2 border border-gray-300 rounded mb-2 text-sm outline-none" />
            <input type="color" value={title.color} onChange={(e) => setTitle({...title, color: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={line.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm relative">
                <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">เส้น {line.id}</div>
                <div className="mb-3 pr-12">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อเสียง และ รูปวรรณยุกต์</label>
                  <div className="flex gap-2">
                    <input type="text" value={line.text} onChange={(e) => handleLineChange(index, 'text', e.target.value)} className="w-2/3 p-1.5 border border-gray-300 rounded text-sm outline-none" />
                    <input type="text" value={line.mark} onChange={(e) => handleLineChange(index, 'mark', e.target.value)} className="w-1/3 p-1.5 border border-gray-300 rounded text-sm outline-none text-center" />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 bg-white -mx-3 -mb-3 p-3 rounded-b-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 mb-1">ข้อความในวงกลม (ใส่ - เพื่อซ่อน)</label>
                      <input type="text" value={line.noteText} onChange={(e) => handleLineChange(index, 'noteText', e.target.value)} className="w-full p-1.5 border border-indigo-300 rounded text-sm outline-none text-center font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1"><span className="text-[10px] text-gray-500 w-8">สีที่ 1:</span><input type="color" value={line.noteBgColor} onChange={(e) => handleLineChange(index, 'noteBgColor', e.target.value)} className="w-5 h-5 rounded cursor-pointer p-0" /></div>
                      {line.noteText.includes('/') && (
                        <div className="flex items-center gap-1"><span className="text-[10px] text-gray-500 w-8">สีที่ 2:</span><input type="color" value={line.noteBgColor2} onChange={(e) => handleLineChange(index, 'noteBgColor2', e.target.value)} className="w-5 h-5 rounded cursor-pointer p-0" /></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`flex-1 p-2 md:p-6 flex items-center justify-center overflow-x-auto ${isFullscreen ? 'bg-white' : 'bg-gray-200'}`}>
        {isFullscreen && (
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 left-4 z-50 bg-gray-800/50 hover:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 backdrop-blur-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            กลับหน้าแก้ไข
          </button>
        )}

        <div className={`w-full max-w-4xl aspect-video bg-white relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none ${!isFullscreen ? 'shadow-2xl' : ''}`}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <h1 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 z-10 text-center tracking-wide" style={{ color: title.color }}>
            {title.text}
          </h1>

          <div className="w-full max-w-3xl relative z-10 px-4">
            
            <div className="flex items-center w-full relative mb-2">
              <div className="w-36 md:w-48 text-right pr-4 flex-shrink-0 flex justify-end items-center gap-2">
                <span className="invisible font-semibold text-lg md:text-xl">เสียงจัตวา</span>
                <span className="font-bold text-gray-700 text-lg md:text-xl min-w-[2.5rem] text-center whitespace-nowrap">รูปวรรณยุกต์</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 md:gap-8">
              {lines.map((line, index) => {
                const leftPercentage = `${15 + (4 - index) * 16}%`;
                const shouldShowNote = line.noteText && line.noteText.trim() !== '-' && line.noteText.trim() !== '';
                
                const textColorToUse = hoveredLineId === line.id ? line.noteBgColor : line.color;

                return (
                  <div 
                    key={line.id} 
                    className="flex items-center w-full relative group cursor-pointer"
                    onMouseEnter={() => setHoveredLineId(line.id)}
                    onMouseLeave={() => setHoveredLineId(null)}
                  >
                    <div 
                      className="w-36 md:w-48 text-right pr-4 font-semibold text-lg md:text-xl flex-shrink-0 flex justify-end items-center gap-2 transition-colors duration-200" 
                      style={{ color: textColorToUse }}
                    >
                      <span>{line.text}</span>
                      <span className="font-sans min-w-[2.5rem] text-center text-gray-600">{line.mark}</span>
                    </div>

                    <div className="flex-1 h-[2px] bg-gray-400 relative rounded-full">
                      {shouldShowNote && (
                        <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-3" style={{ left: leftPercentage }}>
                          {line.noteText.split('/').map((textPart, partIndex) => {
                            const bgCol = partIndex === 0 ? line.noteBgColor : (line.noteBgColor2 || '#3b82f6');
                            const textCol = line.noteTextColor || '#ffffff';
                            
                            if (!textPart.trim()) return null;

                            return (
                              <React.Fragment key={partIndex}>
                                {partIndex > 0 && <span className="text-2xl md:text-3xl font-bold text-gray-400 mb-1">/</span>}
                                <div 
                                  className="rounded-full min-w-[2.5rem] md:min-w-[3rem] px-2 h-10 md:h-12 flex items-center justify-center font-bold text-lg md:text-xl shadow-md transition-transform hover:scale-110 relative" 
                                  style={{ backgroundColor: bgCol, color: textCol, backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(0,0,0,0.15))' }}
                                >
                                  {textPart.trim()}
                                  <div className="absolute inset-0 rounded-full border-2 pointer-events-none" style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)' }}></div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="w-24 md:w-32 text-left pl-6 font-bold text-lg hidden sm:block">
                      {line.noteClass && <span style={{ color: line.noteColor }}>{line.noteClass}</span>}
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