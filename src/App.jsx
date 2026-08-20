import React, { useState, useEffect, useRef } from 'react';

const apiKey = "";

// ฟังก์ชันสำหรับอ่านและเขียน LocalStorage อย่างปลอดภัย
const safeGetLocalStorage = (key, defaultValue = '') => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key) || defaultValue;
    }
  } catch (e) {
    console.warn(`LocalStorage read blocked for key "${key}":`, e);
  }
  return defaultValue;
};

const safeSetLocalStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`LocalStorage write blocked for key "${key}":`, e);
  }
};

const safeCreateChannel = (channelName) => {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel(channelName);
    }
  } catch (e) {
    console.warn('BroadcastChannel blocked or unsupported:', e);
  }
  return null;
};

export default function App() {
  const [customApiKey, setCustomApiKey] = useState(() => safeGetLocalStorage('gemini_api_key', ''));
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  // โหมด Display จอที่ 2 (?view=display)
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);

  // ตั้งค่าเริ่มต้นการผันคำ
  const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
  const [viewLayout, setViewLayout] = useState('split'); // 'standard' | 'split'
  const [inputText, setInputText] = useState('กอ');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  // การตั้งค่าสีและขนาดฟอนต์
  const [colorMid, setColorMid] = useState('#22c55e');    // กลาง (เขียว)
  const [colorHigh, setColorHigh] = useState('#ef4444');   // สูง (แดง)
  const [colorLow, setColorLow] = useState('#007bff');    // ต่ำ (น้ำเงิน)
  const [circleTextColor, setCircleTextColor] = useState('#ffffff');
  const [labelFontSize, setLabelFontSize] = useState(20);

  // การตั้งค่าพื้นหลัง
  const [bgType, setBgType] = useState('color');
  const [bgColor, setBgColor] = useState('#e2e8f0');
  const [bgImage, setBgImage] = useState('');

  // สถานะ Hover และแจ้งเตือน
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [showFsNotice, setShowFsNotice] = useState(false);

  // สถานะการเชื่อมต่อ
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState('wifi');
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState('');
  const [btStatusMsg, setBtStatusMsg] = useState('');
  const [copysuccess, setCopySuccess] = useState(false);
  const [customWifiUrl, setCustomWifiUrl] = useState('');

  // อ้างอิงหน้าต่าง Pop-up ที่เปิดออกไป
  const secondWindowRef = useRef(null);

  const midConsonants = ['ก', 'จ', 'ด', 'ต', 'บ', 'ป', 'อ', 'ฎ', 'ฏ'];
  const highConsonants = ['ข', 'ฃ', 'ฉ', 'ฐ', 'ถ', 'ผ', 'ฝ', 'ศ', 'ษ', 'ส', 'ห'];
  const lowSingleConsonants = ['ง', 'ญ', 'น', 'ย', 'ณ', 'ร', 'ว', 'ม', 'ฬ', 'ล'];

  const quickConsonants = [
    'ก', 'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 
    'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 
    'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 
    'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 
    'ห', 'ฬ', 'อ', 'ฮ'
  ];

  const thaiClusters = [
    'กร', 'กล', 'กว', 'ขร', 'ขล', 'ขว', 'คร', 'คล', 'คว', 'ตร', 'ตล', 
    'ปร', 'ปล', 'พร', 'พล', 'ฟร', 'ฟล', 'หง', 'หญ', 'หน', 'หม', 'หย', 
    'หร', 'หล', 'หว', 'ทร', 'ศร', 'สร', 'จร', 'ซร'
  ];

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
    { label: '◌ัวะ', front: '', rear: 'ัวะ' }
  ];

  const pairMap = {
    'ค': 'ข', 'ฅ': 'ฃ', 'ฆ': 'ข', 'ข': 'ค', 'ฃ': 'ฅ',
    'ช': 'ฉ', 'ฌ': 'ฉ', 'ฉ': 'ช',
    'ซ': 'ศ', 'ศ': 'ซ', 'ษ': 'ซ', 'ส': 'ซ',
    'ท': 'ถ', 'ธ': 'ถ', 'ฑ': 'ฐ', 'ฒ': 'ฐ', 'ถ': 'ท', 'ฐ': 'ท',
    'พ': 'ผ', 'ภ': 'ผ', 'ผ': 'พ',
    'ฟ': 'ฝ', 'ฝ': 'ฟ', 'ฮ': 'ห', 'ห': 'ฮ'
  };

  const extractInitialConsonantOnly = (word) => {
    if (!word) return 'ก';
    let workStr = word.trim();
    
    if (['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(workStr[0])) {
      workStr = workStr.slice(1);
    }

    for (let cluster of thaiClusters) {
      if (workStr.startsWith(cluster)) {
        return cluster;
      }
    }

    if (workStr.length > 0) {
      return workStr[0];
    }
    return 'ก';
  };

  const parseThaiWord = (word) => {
    if (!word) return { initial: '', frontVowel: '', aboveBelowVowel: '', rest: '', toneMark: '' };
    
    let workStr = word.trim();
    let frontVowel = '';
    
    if (['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(workStr[0])) {
      frontVowel = workStr[0];
      workStr = workStr.slice(1);
    }

    let initial = '';
    for (let cluster of thaiClusters) {
      if (workStr.startsWith(cluster)) {
        initial = cluster;
        workStr = workStr.slice(cluster.length);
        break;
      }
    }
    if (!initial && workStr.length > 0) {
      initial = workStr[0];
      workStr = workStr.slice(1);
    }

    const aboveBelowVowelChars = ['ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ั', '็', 'ํ'];
    const toneChars = ['่', '้', '๊', '๋'];

    let aboveBelowVowel = '';
    let toneMark = '';
    let rest = '';

    for (let char of workStr) {
      if (toneChars.includes(char)) {
        toneMark = char;
      } else if (aboveBelowVowelChars.includes(char)) {
        aboveBelowVowel += char;
      } else {
        rest += char;
      }
    }

    return { initial, frontVowel, aboveBelowVowel, rest, toneMark };
  };

  const buildWord = (frontVowel, initial, aboveBelowVowel, tone, rest) => {
    return `${frontVowel}${initial}${aboveBelowVowel}${tone}${rest}`;
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
    const { initial, frontVowel, aboveBelowVowel, rest } = parseThaiWord(word);
    const primaryConsonant = initial ? initial[0] : '';
    const rearVowel = aboveBelowVowel + rest;
    
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
    } else if (rearVowel.endsWith('ะ') || (isShort && !rest)) {
      isDead = true;
    }

    const typeText = isDead ? 'คำตาย' : 'คำเป็น';
    const lenText = isShort ? 'สระเสียงสั้น' : 'สระเสียงยาว';
    let desc = '';

    const isCluster = initial.length > 1;
    const clusterLabel = isCluster ? ` (คำควบกล้ำ "${initial}")` : '';

    if (midConsonants.includes(primaryConsonant)) {
      if (currentMode === 'highOnly') {
        desc = `อักษรกลาง${clusterLabel} เทียบผันเฉพาะเสียงสูง [เอก, โท, จัตวา]`;
      } else if (currentMode === 'lowOnly') {
        desc = `อักษรกลาง${clusterLabel} เทียบผันเฉพาะเสียงต่ำ [สามัญ, โท, ตรี]`;
      } else {
        desc = isDead ? `อักษรกลาง${clusterLabel} คำตาย (ผันได้เฉพาะ เอก, โท, ตรี, จัตวา)` : `อักษรกลาง${clusterLabel} คำเป็น (ผันได้ครบ 5 เสียง)`;
      }
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

    return { type: typeText, vowelLen: lenText, desc, isDead, isShort, initial, frontVowel, aboveBelowVowel, rest, primaryConsonant };
  };

  const calculateTones = (word, currentMode, midC, highC, lowC) => {
    if (!word || word.trim() === '') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '-', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '28%' }
      ];
    }

    const info = analyzeSyllable(word, currentMode);
    const { initial, frontVowel, aboveBelowVowel, rest, isDead, isShort, primaryConsonant } = info;

    if (midConsonants.includes(primaryConsonant)) {
      if (currentMode === 'highOnly') {
        return [
          { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, initial, aboveBelowVowel, '๋', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '80%' },
          { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: midC, isMulti: false, multi: [], show: false, leftPos: '65%' },
          { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, aboveBelowVowel, '้', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '52%' },
          { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, initial, aboveBelowVowel, '่', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '40%' },
          { id: 1, tone: 'เสียงสามัญ', mark: '-', word: '', color: midC, isMulti: false, multi: [], show: false, leftPos: '28%' }
        ];
      } else if (currentMode === 'lowOnly') {
        return [
          { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: midC, isMulti: false, multi: [], show: false, leftPos: '80%' },
          { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, initial, aboveBelowVowel, '๊', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '65%' },
          { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, aboveBelowVowel, '้', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '52%' },
          { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: midC, isMulti: false, multi: [], show: false, leftPos: '40%' },
          { id: 1, tone: 'เสียงสามัญ', mark: '-', word: isDead ? '' : buildWord(frontVowel, initial, aboveBelowVowel, '', rest), color: midC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
        ];
      } else {
        return [
          { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, initial, aboveBelowVowel, '๋', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '80%' },
          { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, initial, aboveBelowVowel, '๊', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '65%' },
          { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, initial, aboveBelowVowel, '้', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '52%' },
          { id: 2, tone: 'เสียงเอก', mark: '◌่', word: isDead ? word : buildWord(frontVowel, initial, aboveBelowVowel, '่', rest), color: midC, isMulti: false, multi: [], show: true, leftPos: '40%' },
          { id: 1, tone: 'เสียงสามัญ', mark: '-', word: isDead ? '' : buildWord(frontVowel, initial, aboveBelowVowel, '', rest), color: midC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
        ];
      }
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
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, aboveBelowVowel, '', rest), color: highC, isMulti: false, multi: [], show: !isDead, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, highConsonant, aboveBelowVowel, '้', rest), color: highC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, aboveBelowVowel, '่', rest), color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '-', word: '', color: highC, isMulti: false, multi: [], show: false, leftPos: '28%' }
      ];
    } else if (currentMode === 'lowOnly') {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, aboveBelowVowel, isDead && isShort ? '' : '้', rest), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { id: 3, tone: 'เสียงโท', mark: '◌้', word: buildWord(frontVowel, lowConsonant, aboveBelowVowel, isDead && !isShort ? '' : '่', rest), color: lowC, isMulti: false, multi: [], show: true, leftPos: '52%' },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: '', color: lowC, isMulti: false, multi: [], show: false, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '-', word: isDead ? '' : buildWord(frontVowel, lowConsonant, aboveBelowVowel, '', rest), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    } else {
      return [
        { id: 5, tone: 'เสียงจัตวา', mark: '◌๋', word: buildWord(frontVowel, highConsonant, aboveBelowVowel, '', rest), color: highC, isMulti: false, multi: [], show: true, leftPos: '80%' },
        { id: 4, tone: 'เสียงตรี', mark: '◌๊', word: buildWord(frontVowel, lowConsonant, aboveBelowVowel, isDead && isShort ? '' : '้', rest), color: lowC, isMulti: false, multi: [], show: true, leftPos: '65%' },
        { 
          id: 3, 
          tone: 'เสียงโท', 
          mark: '◌้', 
          isMulti: true, 
          multi: [
            { text: buildWord(frontVowel, lowConsonant, aboveBelowVowel, isDead && !isShort ? '' : '่', rest), color: lowC },
            { text: buildWord(frontVowel, highConsonant, aboveBelowVowel, '้', rest), color: highC }
          ],
          show: true,
          leftPos: '52%'
        },
        { id: 2, tone: 'เสียงเอก', mark: '◌่', word: buildWord(frontVowel, highConsonant, aboveBelowVowel, '่', rest), color: highC, isMulti: false, multi: [], show: true, leftPos: '40%' },
        { id: 1, tone: 'เสียงสามัญ', mark: '-', word: isDead ? '' : buildWord(frontVowel, lowConsonant, aboveBelowVowel, '', rest), color: lowC, isMulti: false, multi: [], show: !isDead, leftPos: '28%' }
      ];
    }
  };

  const [analysisInfo, setAnalysisInfo] = useState(() => analyzeSyllable('กอ', 'full5'));
  const [linesData, setLinesData] = useState(() => calculateTones('กอ', 'full5', '#22c55e', '#ef4444', '#007bff'));

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'display') {
          setIsDisplayWindow(true);
        }
      }
    } catch (e) {
      console.warn('URL parsing notice:', e);
    }
  }, []);

  useEffect(() => {
    if (isDisplayWindow) return;

    const channel = safeCreateChannel('thai_tone_sync_channel');

    const syncPayload = {
      type: 'SYNC_STATE',
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
      modeVal: mode
    };

    safeSetLocalStorage('thai_tone_live_sync_data', JSON.stringify(syncPayload));

    if (channel) {
      try {
        channel.postMessage(syncPayload);
      } catch (e) {}

      const handleMessage = (event) => {
        if (event.data && event.data.type === 'REQUEST_SYNC') {
          try {
            channel.postMessage(syncPayload);
          } catch (err) {}
        }
      };

      channel.addEventListener('message', handleMessage);

      if (secondWindowRef.current && !secondWindowRef.current.closed) {
        try {
          secondWindowRef.current.postMessage(syncPayload, '*');
        } catch (e) {}
      }

      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    }
  }, [isDisplayWindow, linesData, analysisInfo, inputText, circleTextColor, colorMid, colorHigh, colorLow, labelFontSize, bgType, bgColor, bgImage, hoveredRowId, mode]);

  useEffect(() => {
    if (!isDisplayWindow) return;

    const applySyncData = (data) => {
      if (!data) return;
      const { lines, info, text, cText, cMid, cHigh, cLow, fontSize, bType, bColor, bImg, activeRowId, modeVal } = data;
      if (Array.isArray(lines) && lines.length > 0) setLinesData(lines);
      if (info && info.desc) setAnalysisInfo(info);
      if (text !== undefined) setInputText(text);
      if (cText) setCircleTextColor(cText);
      if (cMid) setColorMid(cMid);
      if (cHigh) setColorHigh(cHigh);
      if (cLow) setColorLow(cLow);
      if (fontSize !== undefined) setLabelFontSize(fontSize);
      if (bType) setBgType(bType);
      if (bColor) setBgColor(bColor);
      if (bImg !== undefined) setBgImage(bImg);
      if (activeRowId !== undefined) setHoveredRowId(activeRowId);
      if (modeVal) setMode(modeVal);
    };

    const savedState = safeGetLocalStorage('thai_tone_live_sync_data', null);
    if (savedState) {
      try {
        applySyncData(JSON.parse(savedState));
      } catch (e) {}
    }

    const channel = safeCreateChannel('thai_tone_sync_channel');

    if (channel) {
      const handleChannelMessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'TOGGLE_FULLSCREEN') {
          toggleFullscreen();
          return;
        }
        if (event.data.type === 'SYNC_STATE') {
          applySyncData(event.data);
        }
      };

      channel.addEventListener('message', handleChannelMessage);
      channel.postMessage({ type: 'REQUEST_SYNC' });
    }

    const handleWindowMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_STATE') {
        applySyncData(event.data);
      }
    };

    window.addEventListener('message', handleWindowMessage);

    const handleStorageChange = (e) => {
      if (e.key === 'thai_tone_live_sync_data' && e.newValue) {
        try {
          applySyncData(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'thai_tone_toggle_fs_signal') {
        toggleFullscreen();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isDisplayWindow]);

  useEffect(() => {
    if (!isDisplayWindow) {
      setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
      setAnalysisInfo(analyzeSyllable(inputText, mode));
    }
  }, [inputText, mode, colorMid, colorHigh, colorLow, isDisplayWindow]);

  const getDisplayUrl = () => {
    try {
      const currentUrl = window.location.href;
      if (currentUrl.includes('blob:')) {
        return currentUrl;
      }
      const baseUrl = currentUrl.split('?')[0];
      return `${baseUrl}?view=display`;
    } catch (e) {
      return '';
    }
  };

  const handleOpenDualMonitor = () => {
    try {
      const currentUrl = window.location.href;
      
      if (!currentUrl.includes('blob:')) {
        const targetUrl = getDisplayUrl();
        secondWindowRef.current = window.open(
          targetUrl,
          'ThaiToneDisplayWindow',
          'width=1200,height=800,resizable=yes,scrollbars=yes,status=yes'
        );
        return;
      }

      const newWin = window.open(
        '',
        'ThaiToneDisplayWindow',
        'width=1200,height=800,resizable=yes,scrollbars=yes,status=yes'
      );

      if (newWin) {
        secondWindowRef.current = newWin;
        
        newWin.document.write(`
          <!DOCTYPE html>
          <html lang="th">
          <head>
            <meta charset="UTF-8">
            <title>กระดานผันวรรณยุกต์ - จอที่ 2</title>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; font-family: 'Sarabun', sans-serif; background-color: ${bgColor}; }
              .board { width: 90vw; height: 85vh; margin: 5vh auto; background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #cbd5e1; }
              .title { text-align: center; color: #ea580c; font-size: 32px; font-weight: bold; margin: 0; }
              .subtitle { text-align: center; color: #ea580c; font-size: 20px; margin-top: 4px; }
              .info { text-align: center; background: #f0f9ff; color: #0369a1; padding: 8px 16px; border-radius: 10px; font-size: 15px; font-weight: bold; margin: 10px auto; max-width: 800px; border: 1px solid #bae6fd; }
              .lines-container { display: flex; flex-direction: column; justify-content: space-around; flex: 1; margin-top: 10px; }
              .line-row { display: grid; grid-template-columns: 220px 1fr 120px; align-items: center; }
              .line-label { text-align: right; padding-right: 20px; font-size: 22px; font-weight: bold; }
              .line-track { position: relative; display: flex; align-items: center; height: 40px; }
              .line-bar { width: 100%; height: 3px; background-color: #94a3b8; }
              .circle-note { position: absolute; transform: translateX(-50%); min-width: 52px; height: 52px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
              .right-tag { text-align: center; font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div id="root-display" class="board">
              <div>
                <h1 class="title">ไตรยางศ์ หรือ อักษร 3 หมู่</h1>
                <div class="subtitle">และการผันวรรณยุกต์</div>
                <div id="info-box" class="info">📌 กำลังรอข้อมูลจากจอหลัก...</div>
              </div>
              <div id="lines-box" class="lines-container"></div>
            </div>
            <script>
              const channel = new BroadcastChannel('thai_tone_sync_channel');
              function render(data) {
                if(!data) return;
                document.body.style.backgroundColor = data.bColor || '${bgColor}';
                document.getElementById('info-box').innerText = '📌 คำว่า "' + (data.text || '') + '" — ' + (data.info?.desc || '');
                const box = document.getElementById('lines-box');
                box.innerHTML = '';
                const rightLabels = { 5: 'เสียงสูง', 3: 'เสียงกลาง', 1: 'เสียงต่ำ' };
                const rightColors = { 5: '#ef4444', 3: '#22c55e', 1: '#007bff' };

                (data.lines || []).forEach(item => {
                  const row = document.createElement('div');
                  row.className = 'line-row';
                  let itemColor = item.color || '#22c55e';
                  if (item.isMulti && item.multi && item.multi.length > 0) itemColor = item.multi[0].color;
                  
                  let circleHtml = '';
                  if (item.show && item.word && !item.isMulti) {
                    circleHtml = '<div class="circle-note" style="left:' + item.leftPos + '; background-color:' + item.color + '; color:' + (data.cText||'#fff') + ';">' + item.word + '</div>';
                  } else if (item.show && item.isMulti) {
                    let circles = (item.multi || []).map(c => '<div class="circle-note" style="position:relative; left:0; transform:none; background-color:' + c.color + '; color:' + (data.cText||'#fff') + ';">' + c.text + '</div>').join('<span style="font-weight:bold; font-size:20px; color:#94a3b8; margin:0 4px;">/</span>');
                    circleHtml = '<div style="position:absolute; left:' + item.leftPos + '; transform:translateX(-50%); display:flex; align-items:center;">' + circles + '</div>';
                  }

                  row.innerHTML = 
                    '<div class="line-label" style="color:' + (item.show ? itemColor : '#94a3b8') + ';">' + item.tone + ' [' + item.mark + ']</div>' +
                    '<div class="line-track"><div class="line-bar"></div>' + circleHtml + '</div>' +
                    '<div class="right-tag" style="color:' + (rightColors[item.id] || '#94a3b8') + ';">' + (rightLabels[item.id] || '') + '</div>';
                  box.appendChild(row);
                });
              }

              channel.onmessage = (e) => { if(e.data && e.data.type === 'SYNC_STATE') render(e.data); };
              window.onmessage = (e) => { if(e.data && e.data.type === 'SYNC_STATE') render(e.data); };
              channel.postMessage({ type: 'REQUEST_SYNC' });
            </script>
          </body>
          </html>
        `);
        newWin.document.close();
      }
    } catch (e) {
      console.warn('Pop-up window blocked:', e);
    }
  };

  const handleToggleDisplayFullscreen = () => {
    const channel = safeCreateChannel('thai_tone_sync_channel');
    if (channel) {
      try {
        channel.postMessage({ type: 'TOGGLE_FULLSCREEN' });
      } catch (e) {}
      channel.close();
    }
    safeSetLocalStorage('thai_tone_toggle_fs_signal', Date.now().toString());
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            setShowFsNotice(true);
            setTimeout(() => setShowFsNotice(false), 3500);
          });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      setShowFsNotice(true);
      setTimeout(() => setShowFsNotice(false), 3500);
    }
  };

  const handleSaveApiKey = () => {
    safeSetLocalStorage('gemini_api_key', tempApiKey.trim());
    setCustomApiKey(tempApiKey.trim());
    setApiSaveStatus('บันทึก API Key เรียบร้อยแล้ว!');
    setTimeout(() => setApiSaveStatus(''), 3000);
  };

  const handleQuickConsonantClick = (c) => {
    const { frontVowel, aboveBelowVowel, rest } = parseThaiWord(inputText);
    const newWord = buildWord(frontVowel || '', c, aboveBelowVowel || '', '', rest || 'อ');
    setInputText(newWord);
  };

  const handleQuickVowelClick = (vowelObj) => {
    const cons = extractInitialConsonantOnly(inputText);
    const newWord = `${vowelObj.front}${cons}${vowelObj.rear}`;
    setInputText(newWord);
  };

  const handleBluetoothConnect = async () => {
    if (!navigator.bluetooth) {
      setBtStatusMsg('❌ เบราว์เซอร์นี้ยังไม่รองรับ Web Bluetooth API');
      return;
    }
    try {
      setBtStatusMsg('🔍 กำลังค้นหาอุปกรณ์บลูทูธ...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access']
      });
      setBtDeviceName(device.name || 'อุปกรณ์บลูทูธที่เชื่อมต่อ');
      setBtConnected(true);
      setBtStatusMsg('✅ เชื่อมต่อบลูทูธสำเร็จ!');
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        setBtStatusMsg('⚠️ การเชื่อมต่อถูกยกเลิกหรือล้มเหลว');
      } else {
        setBtStatusMsg('');
      }
    }
  };

  const handleCopyDisplayUrl = () => {
    const url = customWifiUrl.trim() || getDisplayUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {}
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
      const marks = ['◌๋', '◌๊', '◌้', '◌่', '-'];
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
        onDoubleClick={toggleFullscreen}
        onClick={() => {
          if (showFsNotice) {
            toggleFullscreen();
            setShowFsNotice(false);
          }
        }}
        title="ดับเบิ้ลคลิกเพื่อสลับโหมดเต็มจอ"
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
          cursor: 'pointer',
          ...getContainerBgStyle()
        }}
      >
        {showFsNotice && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '30px',
            fontSize: '15px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            border: '1px solid #38bdf8',
            backdropFilter: 'blur(8px)'
          }}>
            ⛶ คลิก 1 ครั้งตรงไหนก็ได้บนจอนี้เพื่อสลับเต็มจอ
          </div>
        )}

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

            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(150px, 20vw, 250px) 1fr clamp(80px, 10vw, 140px)', color: '#0284c7', fontWeight: 'bold', fontSize: 'clamp(12px, 1.1vw, 16px)', margin: '0 0 -2px 0' }}>
              <div style={{ textAlign: 'right', paddingRight: '20px', color: '#0284c7', fontWeight: 'bold' }}>รูปวรรณยุกต์</div>
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
                        <svg
                          style={{
                            position: 'absolute',
                            top: `-${Math.round(20 * circleRatio)}px`,
                            left: `calc(100% - ${Math.round(3 * circleRatio)}px)`,
                            width: `${Math.round(20 * circleRatio)}px`,
                            height: `${Math.round(44 * circleRatio)}px`,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            color: item.color
                          }}
                          viewBox="0 0 20 44"
                        >
                          <path d="M 2 44 L 2 2" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 2 2 C 9 8, 17 15, 13 24 C 9 17, 5 11, 2 7 Z" fill="currentColor" />
                        </svg>
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
                              <svg
                                style={{
                                  position: 'absolute',
                                  top: `-${Math.round(20 * circleRatio)}px`,
                                  left: `calc(100% - ${Math.round(3 * circleRatio)}px)`,
                                  width: `${Math.round(20 * circleRatio)}px`,
                                  height: `${Math.round(44 * circleRatio)}px`,
                                  pointerEvents: 'none',
                                  overflow: 'visible',
                                  color: circle.color
                                }}
                                viewBox="0 0 20 44"
                              >
                                <path d="M 2 44 L 2 2" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                                <path d="M 2 2 C 9 8, 17 15, 13 24 C 9 17, 5 11, 2 7 Z" fill="currentColor" />
                              </svg>
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

      </div>
    );
  }

  const effectiveQrUrl = customWifiUrl.trim() || getDisplayUrl();
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(effectiveQrUrl)}`;

  return (
    <div style={{ 
      height: '100vh', 
      maxHeight: '100vh', 
      width: '100vw', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: "'Sarabun', sans-serif", 
      boxSizing: 'border-box',
      ...getContainerBgStyle() 
    }}>
      
      {/* 1. Header Top Bar */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.96)', 
        borderBottom: '1px solid #cbd5e1', 
        padding: '8px 18px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🇹🇭</span> สื่อสอนไตรยางศ์และการผันวรรณยุกต์
          </h1>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
            คำปัจจุบัน: {inputText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button 
              onClick={() => setViewLayout('split')}
              style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : 'transparent', color: viewLayout === 'split' ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              แบ่ง 2 ฝั่ง
            </button>
            <button 
              onClick={() => setViewLayout('standard')}
              style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : 'transparent', color: viewLayout === 'standard' ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              จอกระดานเต็ม
            </button>
          </div>

          <button 
            onClick={() => setShowConnectModal(true)}
            style={{ 
              backgroundColor: '#8b5cf6', 
              color: '#ffffff', 
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '13px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(139,92,246,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            📡 เชื่อมต่อจอที่ 2 (WiFi/BT/Web)
          </button>

          <button 
            onClick={handleOpenDualMonitor}
            style={{ 
              backgroundColor: '#16a34a', 
              color: '#ffffff', 
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '13px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
            }}
          >
            🚀 แยกหน้าต่างจอที่ 2
          </button>

          <button 
            onClick={handleToggleDisplayFullscreen}
            style={{ 
              backgroundColor: '#0284c7', 
              color: '#ffffff', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '13px', 
              cursor: 'pointer'
            }}
          >
            ⛶ เต็มจอ จอที่ 2
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'grid', 
        gridTemplateColumns: viewLayout === 'split' ? '1fr 410px' : '1fr', 
        gap: '14px', 
        padding: '12px 16px',
        boxSizing: 'border-box'
      }}>
        
        {/* 1. กระดานบรรทัด 5 เส้น */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.96)', 
          borderRadius: '16px', 
          padding: '20px 28px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          height: '100%',
          boxSizing: 'border-box',
          border: '1px solid #e2e8f0'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}>
              ไตรยางศ์ หรือ อักษร 3 หมู่
            </h2>
            <div style={{ color: '#ea580c', fontSize: '15px', fontWeight: '600' }}>
              และการผันวรรณยุกต์
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '10px', margin: '8px auto 0 auto', maxWidth: '780px', textAlign: 'center', fontSize: '13px', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px', color: '#0284c7', fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
            <div style={{ textAlign: 'right', paddingRight: '16px', color: '#0284c7', fontWeight: 'bold' }}>รูปวรรณยุกต์</div>
            <div></div>
            <div></div>
          </div>

          {/* 5 บรรทัด */}
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
                  style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div 
                    style={{ 
                      textAlign: 'right', 
                      paddingRight: '16px', 
                      fontSize: '15px', 
                      color: rowHeaderColor, 
                      fontWeight: 'bold', 
                      transition: 'all 0.15s ease',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {item.tone} <span style={{ fontSize: '15px', marginLeft: '4px', letterSpacing: '1px' }}>[ {item.mark} ]</span>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '28px' }}>
                    <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.22)' : 'scale(1)'}`,
                          backgroundColor: item.color,
                          color: circleTextColor,
                          minWidth: '42px',
                          height: '42px',
                          padding: '0 8px',
                          borderRadius: '21px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '17px',
                          boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                        }}
                      >
                        <svg
                          style={{
                            position: 'absolute',
                            top: '-18px',
                            left: 'calc(100% - 3px)',
                            width: '18px',
                            height: '40px',
                            pointerEvents: 'none',
                            overflow: 'visible',
                            color: item.color
                          }}
                          viewBox="0 0 20 44"
                        >
                          <path d="M 2 44 L 2 2" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 2 2 C 9 8, 17 15, 13 24 C 9 17, 5 11, 2 7 Z" fill="currentColor" />
                        </svg>
                        {item.word}
                      </div>
                    )}

                    {item.isMulti && item.show && (
                      <div style={{ position: 'absolute', left: item.leftPos, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.multi.map((circle, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '18px' }}>/</span>}
                            <div 
                              style={{
                                backgroundColor: circle.color,
                                color: circleTextColor,
                                minWidth: '42px',
                                height: '42px',
                                padding: '0 8px',
                                borderRadius: '21px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '17px',
                                boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.25)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                                filter: isHovered ? 'brightness(1.15)' : 'brightness(1)'
                              }}
                            >
                              <svg
                                style={{
                                  position: 'absolute',
                                  top: '-18px',
                                  left: 'calc(100% - 3px)',
                                  width: '18px',
                                  height: '40px',
                                  pointerEvents: 'none',
                                  overflow: 'visible',
                                  color: circle.color
                                }}
                                viewBox="0 0 20 44"
                              >
                                <path d="M 2 44 L 2 2" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                                <path d="M 2 2 C 9 8, 17 15, 13 24 C 9 17, 5 11, 2 7 Z" fill="currentColor" />
                              </svg>
                              {circle.text}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: '14px' }}>
                    {fixedRight ? fixedRight.text : ''}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* 2. แผงควบคุมขวามือ */}
        {}
        {viewLayout === 'split' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '16px', 
              padding: '16px', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)', 
              border: '1px solid #e2e8f0', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px',
              height: '100%',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุมการผัน</h3>
            </div>

            {/* 1. ตัวเลือกการผันวรรณยุกต์ */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>✨ ตัวเลือกการผันวรรณยุกต์</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', fontSize: '12px', color: '#334155' }}>
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
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? '...' : 'ผันคำ'}
                </button>
              </div>
              {inputError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: 'bold' }}>{inputError}</div>}
            </div>

            {/* 2. เลือกพยัญชนะด่วน */}
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '4px' }}>
                {quickConsonants.map((c) => (
                  <button 
                    key={c}
                    onClick={() => handleQuickConsonantClick(c)}
                    style={{ 
                      height: '32px',
                      borderRadius: '6px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#ffffff', 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: midConsonants.includes(c) ? colorMid : highConsonants.includes(c) ? colorHigh : colorLow,
                      padding: 0
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. เลือกสระด่วน */}
            <div>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold', marginBottom: '6px' }}>🟢 สระเสียงยาว (คำเป็น):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {longVowels.map((v) => (
                  <button 
                    key={v.label}
                    onClick={() => handleQuickVowelClick(v)}
                    style={{ 
                      height: '32px',
                      padding: '0 8px', 
                      borderRadius: '6px', 
                      border: '1px solid #bbf7d0', 
                      backgroundColor: '#f0fdf4', 
                      color: '#15803d', 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
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
                    style={{ 
                      height: '32px',
                      padding: '0 8px', 
                      borderRadius: '6px', 
                      border: '1px solid #fecaca', 
                      backgroundColor: '#fef2f2', 
                      color: '#b91c1c', 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />

            {/* 4. สีประจำหมู่ */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '6px' }}>🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <label style={{ height: '32px', backgroundColor: colorMid, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรกลาง
                  <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '32px', backgroundColor: colorHigh, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรสูง
                  <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '32px', backgroundColor: colorLow, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรต่ำ
                  <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '32px', backgroundColor: '#334155', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1' }}>
                  สีตัวอักษร
                  <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
              </div>
            </div>

            {/* 5. พื้นหลัง */}
            <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>🖼️ พื้นหลังหน้าจอภาพ</div>
              
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'เทา', code: '#e2e8f0' },
                  { label: 'สว่าง', code: '#f1f5f9' },
                  { label: 'ฟ้าอ่อน', code: '#e0f2fe' },
                  { label: 'มินต์', code: '#dcfce7' },
                  { label: 'เข้ม', code: '#334155' }
                ].map((colorItem) => (
                  <button
                    key={colorItem.code}
                    onClick={() => { setBgColor(colorItem.code); setBgType('color'); }}
                    style={{
                      backgroundColor: colorItem.code,
                      border: bgColor === colorItem.code && bgType === 'color' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: colorItem.code === '#334155' ? '#fff' : '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    {colorItem.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ backgroundColor: '#0284c7', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
                  📁 อัปโหลดภาพพื้นหลัง
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBgImage(reader.result);
                        setBgType('image');
                      };
                      reader.readAsDataURL(file);
                    }
                  }} style={{ display: 'none' }} />
                </label>
                {bgType === 'image' && (
                  <button 
                    onClick={() => { setBgType('color'); setBgImage(''); }}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ยกเลิกรูปภาพ
                  </button>
                )}
              </div>
            </div>

            {/* 6. Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '2px' }}>
                <span>📐 ขนาดตัวอักษร จอที่ 2:</span>
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

            {/* 7. Gemini API Key */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <button 
                onClick={() => setShowApiInput(!showApiInput)}
                style={{ 
                  width: '100%',
                  backgroundColor: customApiKey ? '#e0f2fe' : '#fef3c7', 
                  color: customApiKey ? '#0369a1' : '#b45309', 
                  border: customApiKey ? '1px solid #7dd3fc' : '1px solid #fde68a', 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                🔑 {customApiKey ? 'ตั้งค่า Gemini API Key' : 'เชื่อมต่อ AI (API Key)'}
              </button>

              {showApiInput && (
                <div style={{ marginTop: '6px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #94a3b8' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>🔑 กรอก Gemini API Key:</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="password" 
                      placeholder="วาง API Key..." 
                      value={tempApiKey} 
                      onChange={(e) => setTempApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                    />
                    <button 
                      onClick={handleSaveApiKey}
                      style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                    >
                      บันทึก
                    </button>
                  </div>
                  {apiSaveStatus && <div style={{ color: '#059669', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 3. Modal การเชื่อมต่อจอที่ 2 (WiFi/Bluetooth/Web Browser) */}
      {}
      {showConnectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📡</span> ตั้งค่าการเชื่อมต่อจอที่ 2
              </h3>
              <button 
                onClick={() => setShowConnectModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
              <button
                onClick={() => setActiveConnectTab('wifi')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  backgroundColor: activeConnectTab === 'wifi' ? '#ffffff' : 'transparent',
                  color: activeConnectTab === 'wifi' ? '#0284c7' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: activeConnectTab === 'wifi' ? '2px solid #0284c7' : 'none'
                }}
              >
                📶 WiFi / QR Code
              </button>
              <button
                onClick={() => setActiveConnectTab('browser')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  backgroundColor: activeConnectTab === 'browser' ? '#ffffff' : 'transparent',
                  color: activeConnectTab === 'browser' ? '#0284c7' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: activeConnectTab === 'browser' ? '2px solid #0284c7' : 'none'
                }}
              >
                🌐 เบราว์เซอร์/คู่จอ
              </button>
              <button
                onClick={() => setActiveConnectTab('bluetooth')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  backgroundColor: activeConnectTab === 'bluetooth' ? '#ffffff' : 'transparent',
                  color: activeConnectTab === 'bluetooth' ? '#0284c7' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: activeConnectTab === 'bluetooth' ? '2px solid #0284c7' : 'none'
                }}
              >
                ᛒ บลูทูธ (Bluetooth)
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {activeConnectTab === 'wifi' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  
                  {/* กล่องคำอธิบายสาเหตุและแนวทางแก้ไขสำหรับ Blob URL */}
                  {window.location.href.includes('blob:') ? (
                    <div style={{ backgroundColor: '#fffbe3', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: '12px', textAlign: 'left', fontSize: '13px', color: '#92400e', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⚠️</span> สแกนด้วยแท็บเล็ตเครื่องอื่นไม่ได้เพราะอะไร?
                      </div>
                      <div>
                        ขณะนี้แอปพลิเคชันรันอยู่ในโหมด <strong>"ตัวอย่างพรีวิว (Blob URL)"</strong> ซึ่งเป็นที่อยู่ชั่วคราวใน RAM ของคอมพิวเตอร์เครื่องนี้ แท็บเล็ตเครื่องอื่นจึงไม่สามารถเปิดลิงก์ Blob จากภายนอกได้
                      </div>
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #fcd34d', fontWeight: 'bold', color: '#b45309' }}>
                        👉 <strong>วิธีใช้งานแนะนำ:</strong> ให้ใช้คอมพิวเตอร์เครื่องนี้ต่อสาย HDMI/ไร้สาย ออกจอทีวีหรือโปรเจกเตอร์ แล้วกดปุ่ม <strong>"🚀 เปิดหน้าต่างจอที่ 2 บัดนี้"</strong> (ในแท็บเบราว์เซอร์) ได้ทันทีครับ
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold' }}>
                      📲 สแกน QR Code ด้วยแท็บเล็ต สมาร์ททีวี หรือมือถือในวง Wi-Fi เดียวกัน
                    </div>
                  )}

                  {/* แสดงภาพ QR Code จริงที่ผ่านมาตรฐานการสแกนกล้อง */}
                  <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '12px', 
                    borderRadius: '16px', 
                    border: '2px solid #0284c7', 
                    boxShadow: '0 8px 20px rgba(2,132,199,0.15)',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <img 
                      src={qrImageSrc} 
                      alt="QR Code สำหรับสแกนเข้าจอที่ 2" 
                      style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }}
                    />
                    <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '6px', fontWeight: 'bold' }}>
                      ✓ รหัส QR Code สำหรับเชื่อมต่อ
                    </div>
                  </div>

                  {/* ช่องป้อน URL / IP Address วง Wi-Fi ส่วนตัว */}
                  <div style={{ width: '100%', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'left', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      🌐 กำหนด IP/URL เว็บไซต์จริงสำหรับสแกน (ถ้ามี):
                    </div>
                    <input 
                      type="text" 
                      placeholder="เช่น http://192.168.1.50:3000 หรือ https://your-school-site.com" 
                      value={customWifiUrl}
                      onChange={(e) => setCustomWifiUrl(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {activeConnectTab === 'browser' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: '#0369a1' }}>
                    💡 <strong>การส่งภาพออกจอที่ 2 ผ่าน Web Browser:</strong>
                    <br />
                    ระบบรองรับการเปิดหน้าต่างจอที่ 2 ทั้งในโหมดปกติและโหมด Blob Preview เรียลไทม์
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        handleOpenDualMonitor();
                        setShowConnectModal(false);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      🚀 เปิดหน้าต่างจอที่ 2 บัดนี้
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                      🔗 ลิงก์สำหรับเปิดหน้าจอที่ 2 บนเบราว์เซอร์อื่น:
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={effectiveQrUrl} 
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#f8fafc', color: '#334155' }}
                      />
                      <button 
                        onClick={handleCopyDisplayUrl}
                        style={{ backgroundColor: copysuccess ? '#16a34a' : '#0284c7', color: '#fff', border: 'none', padding: '0 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {copysuccess ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeConnectTab === 'bluetooth' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                      ᛒ การเชื่อมต่อรีโมทไร้สาย / สวิตช์บลูทูธ (Bluetooth Remote / Presenter)
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      จับคู่กับรีโมทนำเสนอผลงาน หรือ อุปกรณ์บลูทูธภายนอกเพื่อควบคุมเปลี่ยนคำผันวรรณยุกต์
                    </div>
                  </div>

                  <button
                    onClick={handleBluetoothConnect}
                    style={{
                      backgroundColor: btConnected ? '#16a34a' : '#8b5cf6',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.25)'
                    }}
                  >
                    <span>ᛒ</span> {btConnected ? `เชื่อมต่อแล้ว: ${btDeviceName}` : 'ค้นหาและจับคู่อุปกรณ์บลูทูธ'}
                  </button>

                  {btStatusMsg && (
                    <div style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold', color: btConnected ? '#16a34a' : '#dc2626' }}>
                      {btStatusMsg}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>
                      🎮 ปุ่มทดสอบการส่งสัญญาณรีโมทบลูทูธ:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      <button 
                        onClick={() => handleQuickConsonantClick('ก')}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ◄ คำก่อนหน้า
                      </button>
                      <button 
                        onClick={handleToggleDisplayFullscreen}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ⛶ สลับเต็มจอ
                      </button>
                      <button 
                        onClick={() => handleQuickConsonantClick('ข')}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        คำถัดไป ►
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setShowConnectModal(false)}
                style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}