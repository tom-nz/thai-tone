<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>บรรทัด 5 เส้น ไตรยางศ์ (ผันวรรณยุกต์)</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts: Sarabun & Kanit -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- React 18 UMD & Babel -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <style>
        body {
            font-family: 'Sarabun', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            user-select: none;
        }
        .font-kanit {
            font-family: 'Kanit', sans-serif;
        }
        .staff-board-paper {
            background-color: #ffffff;
            color: #1e293b;
            border: 1px solid #e2e8f0;
        }
        .staff-board-blackboard {
            background-color: #1b2a26;
            color: #f1f5f9;
            border: 8px solid #854d0e;
        }
        .staff-board-dark {
            background-color: #0f172a;
            color: #f8fafc;
            border: 1px solid #334155;
        }
        .circle-active-pulse {
            animation: pulse-ring 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-ring {
            0%, 100% { transform: scale(1) translateX(-50%); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
            50% { transform: scale(1.18) translateX(-42%); box-shadow: 0 0 0 14px rgba(14, 165, 233, 0); }
        }
        @media print {
            .no-print { display: none !important; }
            .print-full { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        }
    </style>
</head>
<body class="min-h-screen">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo } = React;

        function App() {
            // ระบบคีย์ Gemini API
            const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
            const [tempApiKey, setTempApiKey] = useState(apiKey);
            const [showApiInput, setShowApiInput] = useState(false);
            const [apiSaveStatus, setApiSaveStatus] = useState('');

            // สภาพแวดล้อมและโหมด
            const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
            const [viewLayout, setViewLayout] = useState('split'); // 'standard' | 'split' | 'present'
            const [boardTheme, setBoardTheme] = useState('paper'); // 'paper' | 'blackboard' | 'dark'
            
            const [inputText, setInputText] = useState('เมา');
            const [loading, setLoading] = useState(false);

            // การตั้งค่าสีประจำหมู่
            const [colorMid, setColorMid] = useState('#22c55e');    // อักษรกลาง (เขียว)
            const [colorHigh, setColorHigh] = useState('#ef4444');   // อักษรสูง (แดง)
            const [colorLow, setColorLow] = useState('#007bff');    // อักษรต่ำ (น้ำเงิน)
            const [circleTextColor, setCircleTextColor] = useState('#ffffff'); // สีตัวอักษรในวงกลม

            const [isPlayingSequence, setIsPlayingSequence] = useState(false);
            const [activePlayingIndex, setActivePlayingIndex] = useState(null);

            const [analysisInfo, setAnalysisInfo] = useState({ type: '', vowelLen: '', desc: '' });
            const [linesData, setLinesData] = useState([]);

            // ข้อมูลอักษร 3 หมู่
            const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
            const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
            const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

            const quickConsonants = [
                'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ด', 'ต', 
                'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ม', 
                'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ', 'ฮ'
            ];

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

            const speakWord = async (wordText) => {
                if (!wordText) return;
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const uttr = new SpeechSynthesisUtterance(wordText);
                    uttr.lang = 'th-TH';
                    uttr.rate = 0.85;
                    window.speechSynthesis.speak(uttr);
                }
            };

            const playFullSequence = async () => {
                if (isPlayingSequence) return;
                setIsPlayingSequence(true);
                
                const orderedLines = [...linesData].reverse();
                for (let i = 0; i < orderedLines.length; i++) {
                    const item = orderedLines[i];
                    if (item.show) {
                        setActivePlayingIndex(item.id);
                        const textToSay = item.isMulti ? item.multi.map(m => m.text).join(' หรือ ') : item.word;
                        if (textToSay) {
                            speakWord(textToSay);
                            await new Promise(r => setTimeout(r, 1300));
                        }
                    }
                }
                setActivePlayingIndex(null);
                setIsPlayingSequence(false);
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

                // 2. คู่เสียงอักษรสูง - อักษรต่ำ
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

                // รูปผันตามหลักไตรยางศ์ภาษาไทย
                const lowSamanyan = isDead ? '' : buildWord(frontVowel, lowConsonant, '', rearVowel);
                const lowTho = buildWord(frontVowel, lowConsonant, isDead && isShort ? '่' : (isDead ? '' : '่'), rearVowel); // อักษรต่ำ รูปเอก = เสียงโท (เม่า, ค่อ)
                const lowTri = buildWord(frontVowel, lowConsonant, isDead && isShort ? '' : (isDead ? '้' : '้'), rearVowel);  // อักษรต่ำ รูปโท = เสียงตรี (เม้า, ค้อ)

                const highJattawa = isDead ? '' : buildWord(frontVowel, highConsonant, '', rearVowel); // อักษรสูง ไร้รูป = เสียงจัตวา (เหมา, ขอ)
                const highEk = buildWord(frontVowel, highConsonant, isDead ? '' : '่', rearVowel);     // อักษรสูง รูปเอก = เสียงเอก (เหม่า, ข่อ)
                const highTho = buildWord(frontVowel, highConsonant, '้', rearVowel);                   // อักษรสูง รูปโท = เสียงโท (เหม้า, ข้อ)

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

            // คำนวณหาคำที่ยาวที่สุดในชุดปัจจุบัน เพื่อให้ตัวอักษรทุกวงกลมมีขนาดเท่ากันเป๊ะ สวยงาม
            const globalMaxWordLength = useMemo(() => {
                let maxLen = 0;
                linesData.forEach(item => {
                    if (item.show) {
                        if (item.isMulti && item.multi) {
                            item.multi.forEach(m => {
                                if (m.text && m.text.length > maxLen) maxLen = m.text.length;
                            });
                        } else if (item.word) {
                            if (item.word.length > maxLen) maxLen = item.word.length;
                        }
                    }
                });
                return maxLen || 2;
            }, [linesData]);

            const getUniformFontSize = (maxLen) => {
                if (maxLen <= 2) return 'clamp(20px, 2.5vw, 26px)';
                if (maxLen === 3) return 'clamp(18px, 2.2vw, 23px)';
                if (maxLen === 4) return 'clamp(16px, 1.9vw, 20px)';
                if (maxLen === 5) return 'clamp(14px, 1.7vw, 17px)';
                return 'clamp(12px, 1.4vw, 15px)';
            };

            const activeFontSize = getUniformFontSize(globalMaxWordLength);

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

            const handleGenerate = async () => {
                const word = inputText.trim();
                if (!word) return;
                setLinesData(calculateTones(word, mode, colorMid, colorHigh, colorLow));
            };

            const fixedRightLabels = {
                5: { text: 'เสียงสูง', color: '#ef4444' },
                3: { text: 'เสียงกลาง', color: '#22c55e' },
                1: { text: 'เสียงต่ำ', color: '#007bff' }
            };

            const themeClasses = {
                paper: 'staff-board-paper',
                blackboard: 'staff-board-blackboard',
                dark: 'staff-board-dark'
            };

            return (
                <div className="min-h-screen py-6 px-4 transition-colors">
                    <div className={`mx-auto flex flex-col gap-5 ${viewLayout === 'split' ? 'max-w-7xl' : 'max-w-5xl'}`}>
                        
                        {/* Header Banner */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-200 shrink-0">
                                    <i className="fa-solid fa-music"></i>
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold font-kanit text-slate-800">
                                        บรรทัด 5 เส้น ไตรยางศ์ (ผันวรรณยุกต์)
                                    </h1>
                                    <p className="text-xs md:text-sm text-slate-500 font-medium">
                                        สื่อการเรียนรู้ภาษาไทยแบบโต้ตอบสำหรับผันเสียงวรรณยุกต์และหลักอักษร 3 หมู่
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Layout View Switcher */}
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                            <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <i className="fa-solid fa-display text-sky-500"></i> เลือกมุมมองและธีมกระดาน:
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button 
                                    onClick={() => setViewLayout('standard')}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${viewLayout === 'standard' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    📱 มุมมองมาตรฐาน
                                </button>
                                <button 
                                    onClick={() => setViewLayout('split')}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${viewLayout === 'split' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    🖥️ มุมมอง 2 จอ
                                </button>
                                <button 
                                    onClick={() => setViewLayout('present')}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${viewLayout === 'present' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    🎥 โหมดกระดานพรีวิว
                                </button>

                                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                                <select
                                    value={boardTheme}
                                    onChange={(e) => setBoardTheme(e.target.value)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-700 outline-none cursor-pointer"
                                >
                                    <option value="paper">📖 ธีมกระดานขาวสมุดเรียน</option>
                                    <option value="blackboard">🏫 ธีมกระดานดำโรงเรียน</option>
                                    <option value="dark">🌙 ธีมโหมดมืด (Dark Slate)</option>
                                </select>
                            </div>
                        </div>

                        {/* Main Grid Content */}
                        <div className={`grid gap-5 items-start ${viewLayout === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                            
                            {/* Left Control Panel */}
                            {viewLayout !== 'present' && (
                                <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col gap-5 ${viewLayout === 'split' ? 'lg:col-span-4' : ''}`}>
                                    
                                    <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                                        <h3 className="font-bold text-slate-800 text-base">⚙️ แผงควบคุม</h3>
                                        <button 
                                            onClick={() => setShowApiInput(!showApiInput)}
                                            className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-bold hover:bg-slate-200 transition"
                                        >
                                            🔑 {apiKey ? 'เปลี่ยน Gemini Key' : 'เชื่อมต่อ AI'}
                                        </button>
                                    </div>

                                    {showApiInput && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="password" 
                                                    placeholder="วาง Gemini API Key..." 
                                                    value={tempApiKey} 
                                                    onChange={(e) => setTempApiKey(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                                                />
                                                <button 
                                                    onClick={handleSaveApiKey}
                                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs"
                                                >
                                                    บันทึก
                                                </button>
                                            </div>
                                            {apiSaveStatus && <div className="text-emerald-600 text-xs font-bold">✓ {apiSaveStatus}</div>}
                                        </div>
                                    )}

                                    {/* Tone Mode Selector & Input */}
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                        <div className="text-xs font-bold text-slate-800">✨ เลือกโหมดผัน และ พิมพ์คำต้องการผัน</div>
                                        
                                        <div className="flex flex-col gap-2 text-xs text-slate-700">
                                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                                                <input type="radio" name="mode" checked={mode === 'full5'} onChange={() => setMode('full5')} className="accent-sky-600" />
                                                ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                                                <input type="radio" name="mode" checked={mode === 'highOnly'} onChange={() => setMode('highOnly')} className="accent-sky-600" />
                                                เฉพาะเสียงสูง (เอก, โท, จัตวา)
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                                                <input type="radio" name="mode" checked={mode === 'lowOnly'} onChange={() => setMode('lowOnly')} className="accent-sky-600" />
                                                เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)
                                            </label>
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                            <input 
                                                type="text" 
                                                value={inputText} 
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                                placeholder="พิมพ์คำ เช่น เมา, กา, ขอ, คอ" 
                                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500"
                                            />
                                            <button 
                                                onClick={handleGenerate}
                                                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition"
                                            >
                                                ผันคำ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Color Pickers */}
                                    <div>
                                        <div className="text-xs font-bold text-slate-600 mb-2">🎨 สีประจำหมู่ และ สีตัวอักษร:</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-xs" style={{ backgroundColor: colorMid }}>
                                                อักษรกลาง
                                                <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
                                            </label>
                                            <label className="h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-xs" style={{ backgroundColor: colorHigh }}>
                                                อักษรสูง
                                                <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
                                            </label>
                                            <label className="h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-xs" style={{ backgroundColor: colorLow }}>
                                                อักษรต่ำ
                                                <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
                                            </label>
                                            <label className="h-9 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer border border-slate-300 bg-slate-800" style={{ color: circleTextColor }}>
                                                สีตัวอักษร
                                                <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Quick Consonants */}
                                    <div>
                                        <div className="text-xs font-bold text-slate-600 mb-1.5">🔤 เลือกพยัญชนะด่วน:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {quickConsonants.map((c) => (
                                                <button 
                                                    key={c}
                                                    onClick={() => handleQuickConsonantClick(c)}
                                                    className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-bold shadow-xs hover:scale-105 transition"
                                                    style={{ color: midConsonants.includes(c) ? colorMid : highConsonants.includes(c) ? colorHigh : colorLow }}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Long Vowels */}
                                    <div>
                                        <div className="text-xs font-bold text-emerald-700 mb-1.5">🟢 สระเสียงยาว (คำเป็น):</div>
                                        <div className="flex flex-wrap gap-1">
                                            {quickVowelsLong.map((v, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => handleQuickVowelClick(v)}
                                                    className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-100 transition"
                                                >
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Short Vowels */}
                                    <div>
                                        <div className="text-xs font-bold text-rose-700 mb-1.5">🔴 สระเสียงสั้น (คำตาย):</div>
                                        <div className="flex flex-wrap gap-1">
                                            {quickVowelsShort.map((v, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => handleQuickVowelClick(v)}
                                                    className="px-2 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold shadow-xs hover:bg-rose-100 transition"
                                                >
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Staff Board Display Container */}
                            <div className={`rounded-2xl p-5 md:p-8 shadow-md border transition-all ${themeClasses[boardTheme]} ${viewLayout === 'split' ? 'lg:col-span-8' : ''}`}>
                                
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-5 border-b pb-4 border-slate-200/40">
                                    <h2 className="text-2xl md:text-3xl font-bold font-kanit text-orange-500 tracking-wide">
                                        ไตรยางศ์ หรือ อักษร 3 หมู่
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={playFullSequence}
                                            disabled={isPlayingSequence}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
                                        >
                                            <i className={`fa-solid ${isPlayingSequence ? 'fa-spinner animate-spin' : 'fa-volume-high'}`}></i> 
                                            {isPlayingSequence ? 'กำลังอ่านผัน...' : '► อ่านผัน 5 เสียงต่อเนื่อง'}
                                        </button>
                                        <button 
                                            onClick={() => window.print()}
                                            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition no-print"
                                        >
                                            🖨️ พิมพ์กระดาน
                                        </button>
                                    </div>
                                </div>

                                {/* Syllable Analysis Output */}
                                {analysisInfo.desc && (
                                    <div className="bg-sky-50 border border-sky-200 text-sky-800 p-3 rounded-xl mb-6 text-center text-xs md:text-sm font-semibold shadow-xs">
                                        📌 ผลวิเคราะห์หลักภาษา: <span className="font-bold text-sky-600">"{inputText}"</span> เป็น <span className="bg-sky-100 px-2 py-0.5 rounded text-sky-900 font-bold">{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
                                    </div>
                                )}

                                {/* Column Header Labels */}
                                <div className="grid grid-cols-12 items-center mb-4 text-xs md:text-sm font-bold opacity-75">
                                    <div className="col-span-4 text-right pr-4">รูปวรรณยุกต์</div>
                                    <div className="col-span-6 text-center">เส้นบรรทัดและตำแหน่งเสียงผัน</div>
                                    <div className="col-span-2 text-center">ระดับเสียง</div>
                                </div>

                                {/* Staff 5 Lines Display Container */}
                                <div className="flex flex-col gap-9 py-2">
                                    {linesData.map((item, idx) => {
                                        let rowHeaderColor = '#94a3b8';
                                        if (item.show) {
                                            rowHeaderColor = item.isMulti ? item.multi[0]?.color : item.color;
                                        }

                                        const fixedRight = fixedRightLabels[item.id];
                                        const isActivePlaying = activePlayingIndex === item.id;

                                        return (
                                            <div key={idx} className="grid grid-cols-12 items-center relative">
                                                
                                                {/* Left Tone Header */}
                                                <div 
                                                    className="col-span-4 text-right pr-4 text-sm md:text-base font-bold transition-colors duration-200"
                                                    style={{ color: rowHeaderColor }}
                                                >
                                                    <span>{item.tone}</span>
                                                    <span className="text-xs md:text-sm opacity-80 ml-1.5">[ {item.mark} ]</span>
                                                </div>

                                                {/* Line and Circles (Uniform Font Size across set) */}
                                                <div className="col-span-6 relative flex items-center h-10">
                                                    <div className="w-full h-0.5 bg-slate-300"></div>

                                                    {!item.isMulti && item.show && item.word && (
                                                        <div 
                                                            onClick={() => speakWord(item.word)}
                                                            title="คลิกเพื่อฟังเสียงอ่าน"
                                                            className={`absolute -translate-x-1/2 min-w-[52px] h-[52px] md:min-w-[66px] md:h-[66px] px-2 rounded-full flex items-center justify-center font-bold shadow-md cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${isActivePlaying ? 'circle-active-pulse ring-4 ring-sky-400' : ''}`}
                                                            style={{
                                                                left: item.leftPos,
                                                                backgroundColor: item.color,
                                                                color: circleTextColor,
                                                                fontSize: activeFontSize
                                                            }}
                                                        >
                                                            {item.word}
                                                        </div>
                                                    )}

                                                    {item.isMulti && item.show && (
                                                        <div 
                                                            className={`absolute -translate-x-1/2 flex items-center gap-2 ${isActivePlaying ? 'circle-active-pulse' : ''}`}
                                                            style={{ left: item.leftPos }}
                                                        >
                                                            {item.multi.map((circle, i) => (
                                                                <React.Fragment key={i}>
                                                                    {i > 0 && <span className="text-slate-400 font-bold text-lg">/</span>}
                                                                    <div 
                                                                        onClick={() => speakWord(circle.text)}
                                                                        title="คลิกเพื่อฟังเสียงอ่าน"
                                                                        className="min-w-[52px] h-[52px] md:min-w-[66px] md:h-[66px] px-2 rounded-full flex items-center justify-center font-bold shadow-md cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
                                                                        style={{
                                                                            backgroundColor: circle.color,
                                                                            color: circleTextColor,
                                                                            fontSize: activeFontSize
                                                                        }}
                                                                    >
                                                                        {circle.text}
                                                                    </div>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Level Indicator */}
                                                <div className="col-span-2 text-center font-bold text-xs md:text-sm" style={{ color: fixedRight ? fixedRight.color : '#94a3b8' }}>
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

        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
</body>
</html>