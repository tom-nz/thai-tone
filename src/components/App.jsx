import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// นำเข้า Sub-components
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import ControlPanel from './components/ControlPanel';
import SettingsPanel from './components/SettingsPanel';
import ToneBoard from './components/ToneBoard';

function App() {
  // ตรวจสอบโหมดหน้าต่างแสดงผลแยก (Dual Monitor Display Window)
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);
  const displayWindowRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  // รูปแบบการจัดหน้าจอ (standard = บอร์ด+ควบคุม, split = แสดงผลแยก 2 ฝั่ง, present = เน้นกระดานอย่างเดียว)
  const [viewLayout, setViewLayout] = useState('standard');

  // ข้อมูลแถบระดับเสียง
  const [linesData, setLinesData] = useState([]);
  const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
  const [mode, setMode] = useState('dead'); // 'live' หรือ 'dead'
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

  // สถานะการคลิกเลือกแถว และการแจ้งเตือนเต็มจอ
  const [hoveredRowId, setHoveredRowId] = useState(null);

  // หมวดหมู่อักษร 3 หมู่
  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

  // รายการพยัญชนะไทยครบ 44 ตัว เรียงตามลำดับ ก-ฮ
  const quickConsonants = [
    'ก', 'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 
    'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 
    'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 
    'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 
    'ห', 'ฬ', 'อ', 'ฮ'
  ];

  // รายการคำควบกล้ำไทย
  const thaiClusters = [
    'กร', 'กล', 'กว', 'ขร', 'ขล', 'ขว', 'คร', 'คล', 'คว', 'ตร', 'ตล', 
    'ปร', 'ปล', 'พร', 'พล', 'ฟร', 'ฟล', 'หง', 'หญ', 'หน', 'หม', 'หย', 
    'หร', 'หล', 'หว', 'ทร', 'ศร', 'สร', 'จร', 'ซร'
  ];

  // สระเรียงลำดับมาตรฐานการท่องจำ
  const longVowels = [
    { label: '◌า', front: '', rear: 'า' },
    { label: '◌ี', front: '', rear: 'ี' },
    { label: '◌ือ', front: '', rear: 'ือ' },
    { label: '◌ู', front: '', rear: 'ู' },
    { label: 'เ◌', front: 'เ', rear: '' },
    { label: 'แ◌', front: 'แ', rear: '' },
    { label: 'โ◌', front: 'โ', rear: '' },
    { label: '◌อ', front: '', rear: 'อ' },
    { label: 'เ◌อ', front: 'เ', rear: 'อ' },
    { label: 'เ◌ีย', front: 'เ', rear: 'ีย' },
    { label: 'เ◌ือ', front: 'เ', rear: 'ือ' },
    { label: '◌ัว', front: '', rear: 'ัว' },
    { label: '◌ำ', front: '', rear: 'ำ' },
    { label: 'ใ◌', front: 'ใ', rear: '' },
    { label: 'ไ◌', front: 'ไ', rear: '' },
    { label: 'เ◌า', front: 'เ', rear: 'า' }
  ];

  const shortVowels = [
    { label: '◌ะ', front: '', rear: 'ะ' },
    { label: '◌ิ', front: '', rear: 'ิ' },
    { label: '◌ึ', front: '', rear: 'ึ' },
    { label: '◌ุ', front: '', rear: 'ุ' },
    { label: 'เ◌ะ', front: 'เ', rear: 'ะ' },
    { label: 'แ◌ะ', front: 'แ', rear: 'ะ' },
    { label: 'โ◌ะ', front: 'โ', rear: 'ะ' },
    { label: 'เ◌าะ', front: 'เ', rear: 'าะ' },
    { label: 'เ◌อะ', front: 'เ', rear: 'อะ' },
    { label: 'เ◌ียะ', front: 'เ', rear: 'ียะ' },
    { label: 'เ◌ือะ', front: 'เ', rear: 'ือะ' },
    { label: '◌ัวะ', front: '', rear: 'ัวะ' },
    { label: 'ฤ', front: 'ฤ', rear: '' },
    { label: 'ฦ', front: 'ฦ', rear: '' }
  ];

  // API Key Setup
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showApiInput, setShowApiInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // แยกพยัญชนะต้น สระ และอักษรนำ
  const parseWord = (word) => {
    if (!word) return { initial: '', toneClass: 'low', isCluster: false };
    
    let initial = '';
    let isCluster = false;
    for (const cluster of thaiClusters) {
      if (word.startsWith(cluster)) {
        initial = cluster;
        isCluster = true;
        break;
      }
    }

    if (!initial) {
      const chars = word.split('');
      for (const char of chars) {
        if (quickConsonants.includes(char)) {
          initial = char;
          break;
        }
      }
    }

    if (!initial) initial = word[0] || 'ก';

    let leadChar = initial[0];
    let toneClass = 'low';
    if (midConsonants.includes(leadChar)) toneClass = 'mid';
    else if (highConsonants.includes(leadChar)) toneClass = 'high';
    else toneClass = 'low';

    return { initial, toneClass, isCluster };
  };

  // วิเคราะห์คำว่าเป็น คำเป็น หรือ คำตาย
  const analyzeSyllable = (word, currentMode) => {
    if (!word) return { type: '', vowelLen: '', desc: '' };
    
    const isLive = currentMode === 'live';
    const parsed = parseWord(word);
    
    let clsName = 'อักษรต่ำ';
    if (parsed.toneClass === 'mid') clsName = 'อักษรกลาง';
    if (parsed.toneClass === 'high') clsName = 'อักษรสูง';

    if (parsed.isCluster) {
      clsName += ` (คำควบ/นำ "${parsed.initial}")`;
    }

    let typeStr = isLive ? 'คำเป็น' : 'คำตาย';
    let lenStr = isLive ? 'เสียงยาว / แม่ ก กา สระยาว / สะกด กง นม ยวง' : 'เสียงสั้น / แม่ ก กา สระสั้น / สะกด กบด';
    let desc = '';

    if (parsed.toneClass === 'mid') {
      desc = isLive ? 'ผันได้ครบ 5 เสียง รูปและเสียงตรงกัน' : 'พื้นเสียงเป็นเสียงเอก ผันได้ 4 เสียง (เอก, โท, ตรี, จัตวา)';
    } else if (parsed.toneClass === 'high') {
      desc = isLive ? 'พื้นเสียงเป็นเสียงจัตวา ผันด้วยวรรณยุกต์เอกได้เสียงเอก วรรณยุกต์โทได้เสียงโท' : 'พื้นเสียงเป็นเสียงเอก ผันด้วยวรรณยุกต์โทได้เสียงโท';
    } else {
      desc = isLive ? 'พื้นเสียงเป็นเสียงสามัญ ผันด้วยวรรณยุกต์เอกได้เสียงโท วรรณยุกต์โทได้เสียงตรี' : 'คำตายสระสั้นพื้นเสียงเป็นเสียงตรี / สระยาวพื้นเสียงเป็นเสียงโท ผันวรรณยุกต์ได้เพิ่มเติม';
    }

    return {
      type: `${clsName} · ${typeStr}`,
      vowelLen: lenStr,
      desc
    };
  };

  // คำนวณระดับเสียงวรรณยุกต์
  const calculateTones = (word, currentMode, cMid, cHigh, cLow) => {
    const { toneClass } = parseWord(word);
    const isLive = currentMode === 'live';

    const baseLines = [
      { id: 0, tone: 'เสียงสามัญ', mark: 'ไม่มีรูป', show: false, word: '', color: cMid, leftPos: '10%' },
      { id: 1, tone: 'เสียงเอก', mark: 'รูป ◌่', show: false, word: '', color: cMid, leftPos: '30%' },
      { id: 2, tone: 'เสียงโท', mark: 'รูป ◌้', show: false, word: '', color: cMid, leftPos: '50%' },
      { id: 3, tone: 'เสียงตรี', mark: 'รูป ◌๊', show: false, word: '', color: cMid, leftPos: '70%' },
      { id: 4, tone: 'เสียงจัตวา', mark: 'รูป ◌๋', show: false, word: '', color: cMid, leftPos: '90%' }
    ];

    if (toneClass === 'mid') {
      if (isLive) {
        baseLines[0] = { ...baseLines[0], show: true, word: word, color: cMid };
        baseLines[1] = { ...baseLines[1], show: true, word: `${word}่`, color: cMid };
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}้`, color: cMid };
        baseLines[3] = { ...baseLines[3], show: true, word: `${word}๊`, color: cMid };
        baseLines[4] = { ...baseLines[4], show: true, word: `${word}๋`, color: cMid };
      } else {
        baseLines[1] = { ...baseLines[1], show: true, word: word, color: cMid };
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}้`, color: cMid };
        baseLines[3] = { ...baseLines[3], show: true, word: `${word}๊`, color: cMid };
        baseLines[4] = { ...baseLines[4], show: true, word: `${word}๋`, color: cMid };
      }
    } else if (toneClass === 'high') {
      if (isLive) {
        baseLines[1] = { ...baseLines[1], show: true, word: `${word}่`, color: cHigh };
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}้`, color: cHigh };
        baseLines[4] = { ...baseLines[4], show: true, word: word, color: cHigh };
      } else {
        baseLines[1] = { ...baseLines[1], show: true, word: word, color: cHigh };
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}้`, color: cHigh };
      }
    } else { // Low
      if (isLive) {
        baseLines[0] = { ...baseLines[0], show: true, word: word, color: cLow };
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}่`, color: cLow };
        baseLines[3] = { ...baseLines[3], show: true, word: `${word}้`, color: cLow };
      } else {
        baseLines[2] = { ...baseLines[2], show: true, word: `${word}่`, color: cLow };
        baseLines[3] = { ...baseLines[3], show: true, word: word, color: cLow };
      }
    }

    return baseLines;
  };

  // เมื่อเลือกคำหรือเปลี่ยนการตั้งค่า
  const handleAnalyze = () => {
    if (!inputText.trim()) {
      setInputError('กรุณาป้อนคำที่ต้องการวิเคราะห์');
      return;
    }
    setInputError('');
    setLoading(true);

    const info = analyzeSyllable(inputText, mode);
    const tones = calculateTones(inputText, mode, colorMid, colorHigh, colorLow);

    setAnalysisInfo(info);
    setLinesData(tones);
    setLoading(false);
  };

  useEffect(() => {
    handleAnalyze();
  }, [mode, colorMid, colorHigh, colorLow]);

  const handleQuickSelect = (val) => {
    setInputText(val);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setShowApiInput(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempApiKey('');
    setShowApiInput(false);
  };

  const handleBgImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openDisplayWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1000,height=700');
    displayWindowRef.current = newWindow;
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b' }}>
      {/* ส่วนหัว Header */}
      <Header
        viewLayout={viewLayout}
        setViewLayout={setViewLayout}
        setShowApiInput={setShowApiInput}
        apiKey={apiKey}
        openDisplayWindow={openDisplayWindow}
      />

      {/* Modal สำหรับกรอก API Key */}
      <ApiKeyModal
        showApiInput={showApiInput}
        setShowApiInput={setShowApiInput}
        tempApiKey={tempApiKey}
        setTempApiKey={setTempApiKey}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
        apiKey={apiKey}
      />

      {/* เนื้อหาหลักตาม Layout */}
      <main style={{ padding: '24px', maxWidth: viewLayout === 'present' ? '100%' : '1400px', margin: '0 auto' }}>
        {viewLayout === 'present' ? (
          /* โหมดเฉพาะบอร์ด */
          <ToneBoard
            linesData={linesData}
            hoveredRowId={hoveredRowId}
            setHoveredRowId={setHoveredRowId}
            labelFontSize={labelFontSize}
            circleTextColor={circleTextColor}
            bgType={bgType}
            bgColor={bgColor}
            bgImage={bgImage}
            viewLayout={viewLayout}
          />
        ) : viewLayout === 'split' ? (
          /* โหมด สองจอ (Split View) */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <ControlPanel
                inputText={inputText}
                setInputText={setInputText}
                mode={mode}
                setMode={setMode}
                loading={loading}
                inputError={inputError}
                handleAnalyze={handleAnalyze}
                handleQuickSelect={handleQuickSelect}
                analysisInfo={analysisInfo}
                quickConsonants={quickConsonants}
                longVowels={longVowels}
                shortVowels={shortVowels}
                thaiClusters={thaiClusters}
              />
              <SettingsPanel
                colorMid={colorMid} setColorMid={setColorMid}
                colorHigh={colorHigh} setColorHigh={setColorHigh}
                colorLow={colorLow} setColorLow={setColorLow}
                circleTextColor={circleTextColor} setCircleTextColor={setCircleTextColor}
                labelFontSize={labelFontSize} setLabelFontSize={setLabelFontSize}
                bgType={bgType} setBgType={setBgType}
                bgColor={bgColor} setBgColor={setBgColor}
                bgImage={bgImage} setBgImage={setBgImage}
                handleBgImageUpload={handleBgImageUpload}
              />
            </div>
            <div>
              <ToneBoard
                linesData={linesData}
                hoveredRowId={hoveredRowId}
                setHoveredRowId={setHoveredRowId}
                labelFontSize={labelFontSize}
                circleTextColor={circleTextColor}
                bgType={bgType}
                bgColor={bgColor}
                bgImage={bgImage}
                viewLayout={viewLayout}
              />
            </div>
          </div>
        ) : (
          /* โหมด ปกติ (Standard View) */
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
            <div>
              <ControlPanel
                inputText={inputText}
                setInputText={setInputText}
                mode={mode}
                setMode={setMode}
                loading={loading}
                inputError={inputError}
                handleAnalyze={handleAnalyze}
                handleQuickSelect={handleQuickSelect}
                analysisInfo={analysisInfo}
                quickConsonants={quickConsonants}
                longVowels={longVowels}
                shortVowels={shortVowels}
                thaiClusters={thaiClusters}
              />
              <SettingsPanel
                colorMid={colorMid} setColorMid={setColorMid}
                colorHigh={colorHigh} setColorHigh={setColorHigh}
                colorLow={colorLow} setColorLow={setColorLow}
                circleTextColor={circleTextColor} setCircleTextColor={setCircleTextColor}
                labelFontSize={labelFontSize} setLabelFontSize={setLabelFontSize}
                bgType={bgType} setBgType={setBgType}
                bgColor={bgColor} setBgColor={setBgColor}
                bgImage={bgImage} setBgImage={setBgImage}
                handleBgImageUpload={handleBgImageUpload}
              />
            </div>
            <div>
              <ToneBoard
                linesData={linesData}
                hoveredRowId={hoveredRowId}
                setHoveredRowId={setHoveredRowId}
                labelFontSize={labelFontSize}
                circleTextColor={circleTextColor}
                bgType={bgType}
                bgColor={bgColor}
                bgImage={bgImage}
                viewLayout={viewLayout}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
