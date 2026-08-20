import React, { useState, useEffect, useRef } from 'react';

// Safely load Firebase Compat SDKs if environment supports it
const loadFirebaseSDK = () => {
  if (typeof window === 'undefined') return Promise.reject('No window');
  if (window.firebase) return Promise.resolve(window.firebase);
  if (window.__firebaseLoadingPromise) return window.__firebaseLoadingPromise;

  window.__firebaseLoadingPromise = new Promise((resolve, reject) => {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js';
      s2.onload = () => {
        const s3 = document.createElement('script');
        s3.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js';
        s3.onload = () => resolve(window.firebase);
        s3.onerror = reject;
        document.head.appendChild(s3);
      };
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    s1.onerror = reject;
    document.head.appendChild(s1);
  });

  return window.__firebaseLoadingPromise;
};

// Safe LocalStorage helpers
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
    console.warn('BroadcastChannel blocked:', e);
  }
  return null;
};

export default function App() {
  const apiKey = "";
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'thai-tone-app-default';

  const [customApiKey, setCustomApiKey] = useState(() => safeGetLocalStorage('gemini_api_key', ''));
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState('');

  // โหมด Display จอที่ 2 (?view=display)
  const [isDisplayWindow, setIsDisplayWindow] = useState(false);
  const [roomId, setRoomId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || '1001';
    }
    return '1001';
  });

  // ตั้งค่าเริ่มต้นการผันคำ
  const [mode, setMode] = useState('full5'); // 'full5' | 'highOnly' | 'lowOnly'
  const [viewLayout, setViewLayout] = useState('split'); // 'standard' | 'split'
  const [inputText, setInputText] = useState('กอ');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  // การตั้งค่าสีและขนาดฟอนต์
  const [colorMid, setColorMid] = useState('#22c55e');
  const [colorHigh, setColorHigh] = useState('#ef4444');
  const [colorLow, setColorLow] = useState('#007bff');
  const [circleTextColor, setCircleTextColor] = useState('#ffffff');
  const [labelFontSize, setLabelFontSize] = useState(20);

  // การตั้งค่าพื้นหลัง
  const [bgType, setBgType] = useState('color');
  const [bgColor, setBgColor] = useState('#e2e8f0');
  const [bgImage, setBgImage] = useState('');

  // สถานะ Hover, การซิงค์ และป็อปอัป
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('');

  // สถานะการเชื่อมต่อ
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState('wifi');
  const [copysuccess, setCopySuccess] = useState(false);
  const [customWifiUrl, setCustomWifiUrl] = useState('');

  const secondWindowRef = useRef(null);
  const lastSentPayloadRef = useRef('');

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
        const roomParam = params.get('room');
        if (roomParam) {
          setRoomId(roomParam);
        }
      }
    } catch (e) {
      console.warn('URL parsing notice:', e);
    }
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const initFirebase = async () => {
      try {
        if (typeof __firebase_config === 'undefined') return;
        const fb = await loadFirebaseSDK();
        if (!fb || !isMounted) return;

        const config = JSON.parse(__firebase_config);
        if (!fb.apps.length) {
          fb.initializeApp(config);
        }

        const auth = fb.auth();
        if (!auth.currentUser) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await auth.signInWithCustomToken(__initial_auth_token);
          } else {
            await auth.signInAnonymously();
          }
        }
        setCloudConnected(true);

        const db = fb.firestore();
        const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('sync_rooms').doc(roomId);

        if (isDisplayWindow) {
          unsubscribe = docRef.onSnapshot((docSnapshot) => {
            if (docSnapshot.exists) {
              const data = docSnapshot.data();
              if (data) {
                if (Array.isArray(data.lines)) setLinesData(data.lines);
                if (data.info) setAnalysisInfo(data.info);
                if (data.text !== undefined) setInputText(data.text);
                if (data.cText) setCircleTextColor(data.cText);
                if (data.cMid) setColorMid(data.cMid);
                if (data.cHigh) setColorHigh(data.cHigh);
                if (data.cLow) setColorLow(data.cLow);
                if (data.fontSize !== undefined) setLabelFontSize(data.fontSize);
                if (data.bType) setBgType(data.bType);
                if (data.bColor) setBgColor(data.bColor);
                if (data.bImg !== undefined) setBgImage(data.bImg);
                if (data.activeRowId !== undefined) setHoveredRowId(data.activeRowId);
                if (data.modeVal) setMode(data.modeVal);
                setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
              }
            }
          }, (err) => console.warn("Firestore snapshot notice:", err));
        }
      } catch (e) {
        console.warn("Firebase setup notice:", e);
      }
    };

    initFirebase();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [appId, roomId, isDisplayWindow]);

  useEffect(() => {
    if (!isDisplayWindow) return;

    let es = null;
    const topic = `thai_tone_sync_room_${roomId}`;
    
    const applyIncomingData = (data) => {
      if (!data || data.type !== 'SYNC_STATE') return;
      if (Array.isArray(data.lines) && data.lines.length > 0) setLinesData(data.lines);
      if (data.info && data.info.desc) setAnalysisInfo(data.info);
      if (data.text !== undefined) setInputText(data.text);
      if (data.cText) setCircleTextColor(data.cText);
      if (data.cMid) setColorMid(data.cMid);
      if (data.cHigh) setColorHigh(data.cHigh);
      if (data.cLow) setColorLow(data.cLow);
      if (data.fontSize !== undefined) setLabelFontSize(data.fontSize);
      if (data.bType) setBgType(data.bType);
      if (data.bColor) setBgColor(data.bColor);
      if (data.bImg !== undefined) setBgImage(data.bImg);
      if (data.activeRowId !== undefined) setHoveredRowId(data.activeRowId);
      if (data.modeVal) setMode(data.modeVal);
      setCloudConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
    };

    // Primary: SSE Realtime Stream
    try {
      es = new EventSource(`https://ntfy.sh/${topic}/json`);
      es.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw && raw.message) {
            applyIncomingData(JSON.parse(raw.message));
          }
        } catch (err) {}
      };
    } catch (e) {
      console.warn("ntfy.sh SSE error:", e);
    }

    // Secondary GUARANTEED Fallback: Active Short-Polling every 1.5 seconds
    // Prevents mobile/tablet Chrome from suspending background SSE sockets!
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=3s`);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n');
          for (let line of lines) {
            if (!line) continue;
            const parsed = JSON.parse(line);
            if (parsed && parsed.message) {
              applyIncomingData(JSON.parse(parsed.message));
            }
          }
        }
      } catch (err) {}
    }, 1500);

    return () => {
      if (es) es.close();
      clearInterval(pollInterval);
    };
  }, [isDisplayWindow, roomId]);

  useEffect(() => {
    if (isDisplayWindow) return;

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
      modeVal: mode,
      updatedAt: Date.now()
    };

    const strPayload = JSON.stringify(syncPayload);
    if (strPayload === lastSentPayloadRef.current) return;
    lastSentPayloadRef.current = strPayload;

    safeSetLocalStorage('thai_tone_live_sync_data', strPayload);
    
    // Local BroadcastChannel sync
    const channel = safeCreateChannel('thai_tone_sync_channel');
    if (channel) {
      try {
        channel.postMessage(syncPayload);
      } catch (e) {}
    }

    // Pop-up window postMessage sync
    if (secondWindowRef.current && !secondWindowRef.current.closed) {
      try {
        secondWindowRef.current.postMessage(syncPayload, '*');
      } catch (e) {}
    }

    // High-speed HTTP Pub/Sub Sync to Tablet
    try {
      fetch(`https://ntfy.sh/thai_tone_sync_room_${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: strPayload
      }).catch(() => {});
    } catch (e) {}

    // Cloud Firestore Sync (if loaded)
    if (typeof window !== 'undefined' && window.firebase && window.firebase.apps && window.firebase.apps.length) {
      try {
        const db = window.firebase.firestore();
        db.collection('artifacts').doc(appId).collection('public').doc('data').collection('sync_rooms').doc(roomId)
          .set(syncPayload, { merge: true })
          .catch(() => {});
      } catch (e) {}
    }

    return () => {
      if (channel) channel.close();
    };
  }, [isDisplayWindow, linesData, analysisInfo, inputText, circleTextColor, colorMid, colorHigh, colorLow, labelFontSize, bgType, bgColor, bgImage, hoveredRowId, mode, roomId, appId]);

  useEffect(() => {
    if (!isDisplayWindow) return;

    const channel = safeCreateChannel('thai_tone_sync_channel');
    if (channel) {
      const handleChannelMessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'TOGGLE_FULLSCREEN') {
          toggleFullscreen();
          return;
        }
        if (event.data.type === 'SYNC_STATE') {
          const { lines, info, text, cText, cMid, cHigh, cLow, fontSize, bType, bColor, bImg, activeRowId, modeVal } = event.data;
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
        }
      };
      channel.addEventListener('message', handleChannelMessage);
      channel.postMessage({ type: 'REQUEST_SYNC' });
      return () => channel.close();
    }
  }, [isDisplayWindow]);

  useEffect(() => {
    if (!isDisplayWindow) {
      setLinesData(calculateTones(inputText, mode, colorMid, colorHigh, colorLow));
      setAnalysisInfo(analyzeSyllable(inputText, mode));
    }
  }, [inputText, mode, colorMid, colorHigh, colorLow, isDisplayWindow]);

  const getDisplayUrl = () => {
    try {
      if (typeof window === 'undefined') return '';
      const currentUrl = window.location.href;
      if (currentUrl.includes('blob:') || currentUrl.includes('usercontent.goog')) {
        return currentUrl;
      }
      const baseUrl = currentUrl.split('?')[0];
      return `${baseUrl}?view=display&room=${roomId}`;
    } catch (e) {
      return '';
    }
  };

  const isSandboxEnv = () => {
    try {
      if (typeof window === 'undefined') return false;
      return window.location.href.includes('usercontent.goog') || window.location.href.includes('blob:');
    } catch (e) {
      return false;
    }
  };

  const handleOpenDualMonitor = () => {
    try {
      const targetUrl = getDisplayUrl();
      if (!window.location.href.includes('blob:') && !window.location.href.includes('usercontent.goog')) {
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
              .board { width: 96vw; height: 92vh; margin: 4vh auto; background: rgba(255,255,255,0.95); border-radius: 20px; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #cbd5e1; }
              .title { text-align: center; color: #ea580c; font-size: 32px; font-weight: bold; margin: 0; }
              .subtitle { text-align: center; color: #ea580c; font-size: 20px; margin-top: 4px; }
              .info { text-align: center; background: #f0f9ff; color: #0369a1; padding: 8px 16px; border-radius: 10px; font-size: 15px; font-weight: bold; margin: 10px auto; max-width: 800px; border: 1px solid #bae6fd; }
            </style>
          </head>
          <body>
            <div id="root-display" class="board">
              <div>
                <h1 class="title">ไตรยางศ์ หรือ อักษร 3 หมู่</h1>
                <div class="subtitle">และการผันวรรณยุกต์</div>
                <div id="info-box" class="info">📌 กำลังรอข้อมูลจากจอหลัก...</div>
              </div>
            </div>
          </body>
          </html>
        `);
        newWin.document.close();
      }
    } catch (e) {
      console.warn('Pop-up window blocked:', e);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {}
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
    const circleSize = `clamp(${Math.round(42 * circleRatio)}px, ${(4.4 * circleRatio).toFixed(2)}vw, ${Math.round(66 * circleRatio)}px)`;
    const circleFontSize = `clamp(${Math.round(16 * circleRatio)}px, ${(1.8 * circleRatio).toFixed(2)}vw, ${Math.round(26 * circleRatio)}px)`;
    const labelSize = `clamp(${Math.round(14 * circleRatio)}px, ${(0.08 * labelFontSize).toFixed(2)}vw, ${Math.round(26 * circleRatio)}px)`;

    return (
      <div 
        onDoubleClick={toggleFullscreen}
        style={{ 
          height: '100dvh', 
          width: '100vw', 
          maxWidth: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxSizing: 'border-box', 
          padding: 'clamp(8px, 1.5vw, 20px)', 
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
            width: '100%', 
            maxWidth: '100%',
            height: '100%', 
            maxHeight: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.96)', 
            borderRadius: 'clamp(12px, 1.8vw, 24px)', 
            padding: 'clamp(14px, 2vw, 28px) clamp(16px, 2.5vw, 40px)', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            boxSizing: 'border-box', 
            border: '1px solid #cbd5e1', 
            backdropFilter: 'blur(8px)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: 'clamp(20px, 2.2vw, 32px)', fontWeight: 'bold' }}>
                ไตรยางศ์ หรือ อักษร 3 หมู่
              </h2>
              {lastSyncedTime && (
                <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  🟢 ซิงค์เรียลไทม์ ({lastSyncedTime})
                </span>
              )}
            </div>
            <div style={{ color: '#ea580c', fontSize: 'clamp(14px, 1.4vw, 20px)', fontWeight: '600', marginBottom: '8px' }}>
              และการผันวรรณยุกต์
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 1.2vw, 16px)', borderRadius: '10px', margin: '0 auto 8px auto', maxWidth: '850px', textAlign: 'center', fontSize: 'clamp(11px, 1vw, 15px)', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(130px, 18vw, 230px) 1fr clamp(80px, 10vw, 130px)', color: '#0284c7', fontWeight: 'bold', fontSize: 'clamp(11px, 1vw, 15px)', margin: '0 0 2px 0' }}>
              <div style={{ textAlign: 'right', paddingRight: '16px', color: '#0284c7', fontWeight: 'bold' }}>รูปวรรณยุกต์</div>
              <div></div>
              <div></div>
            </div>
          </div>

          {/* Proportional 5-Line Staff Container for Tablet */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '8px 0', overflow: 'hidden' }}>
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
                  style={{ display: 'grid', gridTemplateColumns: 'clamp(130px, 18vw, 230px) 1fr clamp(80px, 10vw, 130px)', alignItems: 'center', flex: 1 }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div 
                    style={{ 
                      textAlign: 'right', 
                      paddingRight: '16px', 
                      fontSize: labelSize, 
                      color: rowHeaderColor, 
                      fontWeight: 'bold',
                      transition: 'all 0.15s ease',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.tone} <span style={{ fontSize: '0.9em', marginLeft: '2px' }}>[ {item.mark} ]</span>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}>
                    {/* Horizontal Staff Line */}
                    <div style={{ width: '100%', height: '2.5px', backgroundColor: '#94a3b8' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.18)' : 'scale(1)'}`,
                          backgroundColor: item.color,
                          color: circleTextColor,
                          minWidth: circleSize,
                          height: circleSize,
                          padding: '0 8px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: circleFontSize,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          transition: 'all 0.15s ease'
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
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: item.leftPos, 
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.18)' : 'scale(1)'}`,
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          transition: 'all 0.15s ease' 
                        }}
                      >
                        {item.multi.map((circle, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: circleFontSize }}>/</span>}
                            <div 
                              style={{
                                backgroundColor: circle.color,
                                color: circleTextColor,
                                minWidth: circleSize,
                                height: circleSize,
                                padding: '0 8px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: circleFontSize,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'all 0.15s ease'
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

                  <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: 'clamp(12px, 1.2vw, 19px)' }}>
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
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(effectiveQrUrl)}`;

  return (
    <div style={{ 
      height: '100vh', 
      maxHeight: '100vh', 
      width: '100vw', 
      maxWidth: '100%',
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: "'Sarabun', sans-serif", 
      boxSizing: 'border-box',
      ...getContainerBgStyle() 
    }}>
      
      {/* 1. Top Header Bar */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.96)', 
        borderBottom: '1px solid #cbd5e1', 
        padding: '8px 16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        zIndex: 20,
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🇹🇭</span> สื่อสอนไตรยางศ์และการผันวรรณยุกต์
          </h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
            คำ: {inputText} | รหัสห้อง: {roomId}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
            <button 
              onClick={() => setViewLayout('split')}
              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: viewLayout === 'split' ? '#0284c7' : 'transparent', color: viewLayout === 'split' ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              แบ่ง 2 ฝั่ง
            </button>
            <button 
              onClick={() => setViewLayout('standard')}
              style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: viewLayout === 'standard' ? '#0284c7' : 'transparent', color: viewLayout === 'standard' ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
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
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(139,92,246,0.3)'
            }}
          >
            📡 เชื่อมต่อจอที่ 2
          </button>

          <button 
            onClick={handleOpenDualMonitor}
            style={{ 
              backgroundColor: '#16a34a', 
              color: '#ffffff', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
            }}
          >
            🚀 แยกหน้าต่างจอที่ 2
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'grid', 
        gridTemplateColumns: viewLayout === 'split' ? '1fr 380px' : '1fr', 
        gap: '12px', 
        padding: '10px 14px',
        boxSizing: 'border-box',
        maxWidth: '100vw'
      }}>
        
        {/* Left Board Container (COMPACTED PROPORTIONAL HEIGHT FOR LAPTOP MAIN SCREEN) */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.96)', 
          borderRadius: '16px', 
          padding: '14px 20px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          height: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4px', flexShrink: 0 }}>
            <h2 style={{ margin: '0 0 2px 0', color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>
              ไตรยางศ์ หรือ อักษร 3 หมู่
            </h2>
            <div style={{ color: '#ea580c', fontSize: '13px', fontWeight: '600' }}>
              และการผันวรรณยุกต์
            </div>

            {analysisInfo.desc && (
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '8px', margin: '4px auto 0 auto', maxWidth: '750px', textAlign: 'center', fontSize: '11.5px', color: '#0369a1', fontWeight: 'bold' }}>
                📌 ผลวิเคราะห์หลักภาษา: <span style={{ color: '#0284c7' }}>"{inputText}"</span> เป็น <span style={{ backgroundColor: '#e0f2fe', padding: '1px 5px', borderRadius: '4px' }}>{analysisInfo.type} ({analysisInfo.vowelLen})</span> — {analysisInfo.desc}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px', color: '#0284c7', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right', paddingRight: '16px', color: '#0284c7', fontWeight: 'bold' }}>รูปวรรณยุกต์</div>
            <div></div>
            <div></div>
          </div>

          {/* Proportional 5-Line Staff Board (COMPACT ~3/5 HEIGHT FOR LAPTOP VIEW WITH FIXED HOVER SCALE FOR LINE 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '22px', flex: 1, padding: '4px 0', overflow: 'hidden' }}>
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
                  style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div 
                    style={{ 
                      textAlign: 'right', 
                      paddingRight: '16px', 
                      fontSize: '14px', 
                      color: rowHeaderColor, 
                      fontWeight: 'bold', 
                      transition: 'all 0.15s ease',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {item.tone} <span style={{ fontSize: '14px', marginLeft: '2px' }}>[ {item.mark} ]</span>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '32px' }}>
                    {/* Horizontal Staff Line */}
                    <div style={{ width: '100%', height: '2px', backgroundColor: '#94a3b8' }}></div>

                    {!item.isMulti && item.show && item.word && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: item.leftPos,
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.18)' : 'scale(1)'}`,
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
                          fontSize: '16px',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
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
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: item.leftPos, 
                          transform: `translateX(-50%) ${isHovered ? 'scale(1.18)' : 'scale(1)'}`, // FIXED HOVER EXPANSION FOR LINE 3
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {item.multi.map((circle, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>/</span>}
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
                                fontSize: '16px',
                                boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
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

                  <div style={{ textAlign: 'center', color: fixedRight ? fixedRight.color : '#94a3b8', fontWeight: 'bold', fontSize: '13px' }}>
                    {fixedRight ? fixedRight.text : ''}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Controls Panel */}
        {viewLayout === 'split' && (
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '16px', 
              padding: '14px', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)', 
              border: '1px solid #e2e8f0', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              height: '100%',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>⚙️ แผงควบคุมการผัน</h3>
              <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}>
                🟢 ซิงค์เรียลไทม์ (Cloud & local)
              </span>
            </div>

            {/* Conjugation Options */}
            <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>✨ ตัวเลือกการผันวรรณยุกต์</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', fontSize: '11px', color: '#334155' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="mode" checked={mode === 'full5'} onChange={() => setMode('full5')} />
                  ผันครบทั้ง 5 บรรทัด (อักษรคู่ / ห นำ)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="mode" checked={mode === 'highOnly'} onChange={() => setMode('highOnly')} />
                  เฉพาะเสียงสูง (เอก, โท, จัตวา)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="mode" checked={mode === 'lowOnly'} onChange={() => setMode('lowOnly')} />
                  เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={(e) => {
                    setInputText(e.target.value);
                    validateInput(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="พิมพ์ 1 คำ เช่น กอ, เมา" 
                  style={{ 
                    flex: 1, 
                    padding: '6px 10px', 
                    borderRadius: '6px', 
                    border: inputError ? '2px solid #ef4444' : '1px solid #cbd5e1', 
                    fontSize: '13px',
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    fontWeight: '600'
                  }}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#0284c7', 
                    color: '#ffffff', 
                    border: 'none', 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? '...' : 'ผันคำ'}
                </button>
              </div>
              {inputError && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>{inputError}</div>}
            </div>

            {/* Quick Consonants */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '3px' }}>
                {quickConsonants.map((c) => (
                  <button 
                    key={c}
                    onClick={() => handleQuickConsonantClick(c)}
                    style={{ 
                      height: '28px',
                      borderRadius: '4px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#ffffff', 
                      fontSize: '13px', 
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

            {/* Quick Vowels */}
            <div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', marginBottom: '4px' }}>🟢 สระเสียงยาว (คำเป็น):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '6px' }}>
                {longVowels.map((v) => (
                  <button 
                    key={v.label}
                    onClick={() => handleQuickVowelClick(v)}
                    style={{ 
                      height: '28px',
                      padding: '0 6px', 
                      borderRadius: '4px', 
                      border: '1px solid #bbf7d0', 
                      backgroundColor: '#f0fdf4', 
                      color: '#15803d', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer'
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold', marginBottom: '4px' }}>🔴 สระเสียงสั้น (คำตาย):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {shortVowels.map((v) => (
                  <button 
                    key={v.label}
                    onClick={() => handleQuickVowelClick(v)}
                    style={{ 
                      height: '28px',
                      padding: '0 6px', 
                      borderRadius: '4px', 
                      border: '1px solid #fecaca', 
                      backgroundColor: '#fef2f2', 
                      color: '#b91c1c', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer'
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors and Styles */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px' }}>🎨 ตั้งค่าสีประจำหมู่</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                <label style={{ height: '28px', backgroundColor: colorMid, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรกลาง
                  <input type="color" value={colorMid} onChange={(e) => setColorMid(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '28px', backgroundColor: colorHigh, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรสูง
                  <input type="color" value={colorHigh} onChange={(e) => setColorHigh(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '28px', backgroundColor: colorLow, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  อักษรต่ำ
                  <input type="color" value={colorLow} onChange={(e) => setColorLow(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
                <label style={{ height: '28px', backgroundColor: '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: circleTextColor, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #cbd5e1' }}>
                  สีตัวอักษร
                  <input type="color" value={circleTextColor} onChange={(e) => setCircleTextColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                </label>
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#4b5563', marginBottom: '2px' }}>
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

            {/* Gemini API Key Settings */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <button 
                onClick={() => setShowApiInput(!showApiInput)}
                style={{ 
                  width: '100%',
                  backgroundColor: customApiKey ? '#e0f2fe' : '#fef3c7', 
                  color: customApiKey ? '#0369a1' : '#b45309', 
                  border: customApiKey ? '1px solid #7dd3fc' : '1px solid #fde68a', 
                  padding: '5px 8px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                🔑 {customApiKey ? 'ตั้งค่า Gemini API Key' : 'เชื่อมต่อ AI (API Key)'}
              </button>

              {showApiInput && (
                <div style={{ marginTop: '4px', padding: '6px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #94a3b8' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="password" 
                      placeholder="วาง API Key..." 
                      value={tempApiKey} 
                      onChange={(e) => setTempApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                      style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '10px' }}
                    />
                    <button 
                      onClick={handleSaveApiKey}
                      style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0 6px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}
                    >
                      บันทึก
                    </button>
                  </div>
                  {apiSaveStatus && <div style={{ color: '#059669', fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>✓ {apiSaveStatus}</div>}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Connection Modal */}
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
            maxWidth: '540px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📡</span> ตั้งค่าการเชื่อมต่อจอที่ 2 (ห้อง: {roomId})
              </h3>
              <button 
                onClick={() => setShowConnectModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
              <button
                onClick={() => setActiveConnectTab('wifi')}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  border: 'none',
                  backgroundColor: activeConnectTab === 'wifi' ? '#ffffff' : 'transparent',
                  color: activeConnectTab === 'wifi' ? '#0284c7' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderBottom: activeConnectTab === 'wifi' ? '2px solid #0284c7' : 'none'
                }}
              >
                📶 สแกน QR Code (แท็บเล็ต/สมาร์ตโฟน)
              </button>
              <button
                onClick={() => setActiveConnectTab('browser')}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  border: 'none',
                  backgroundColor: activeConnectTab === 'browser' ? '#ffffff' : 'transparent',
                  color: activeConnectTab === 'browser' ? '#0284c7' : '#64748b',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderBottom: activeConnectTab === 'browser' ? '2px solid #0284c7' : 'none'
                }}
              >
                🌐 เปิดจอที่ 2 บนคอมพิวเตอร์
              </button>
            </div>

            <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
              {activeConnectTab === 'wifi' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                  
                  {isSandboxEnv() && (
                    <div style={{ backgroundColor: '#fffbebfb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#b45309', width: '100%', boxSizing: 'border-box' }}>
                      💡 <strong>คำแนะนำโหมดพรีวิว (Gemini Canvas):</strong><br />
                      URL ปัจจุบันเป็นแอดเดรสชั่วคราวชั่วคราว หากสแกน QR Code แล้วขึ้น 404 ให้วาง <strong>URL ของเว็บที่คุณนำไปขึ้นโฮสติ้งจริง (เช่น *.pages.dev)</strong> ลงในช่องด้านล่าง แล้วสแกนใหม่ได้ทันทีครับ
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}>
                    📲 สแกน QR Code เพื่อเปิดกระดานผันคำบนแท็บเล็ต (เชื่อมต่อได้ไม่จำกัดจำนวนเครื่อง)
                  </div>

                  <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '10px', 
                    borderRadius: '12px', 
                    border: '2px solid #0284c7', 
                    boxShadow: '0 6px 16px rgba(2,132,199,0.15)',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <img 
                      src={qrImageSrc} 
                      alt="QR Code สำหรับสแกนเข้าจอที่ 2" 
                      style={{ width: '190px', height: '190px', display: 'block', borderRadius: '6px' }}
                    />
                    <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px', fontWeight: 'bold' }}>
                      ✓ คิวอาร์โค้ดประจำห้องเรียน {roomId}
                    </div>
                  </div>

                  <div style={{ width: '100%', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                      🔗 กำหนด URL เว็บไซต์จริง / IP วง LAN สำหรับสแกน:
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        value={customWifiUrl}
                        onChange={(e) => setCustomWifiUrl(e.target.value)}
                        placeholder={getDisplayUrl()} 
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', backgroundColor: '#fff' }}
                      />
                      <button 
                        onClick={handleCopyDisplayUrl}
                        style={{ backgroundColor: copysuccess ? '#16a34a' : '#0284c7', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        {copysuccess ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeConnectTab === 'browser' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#0369a1' }}>
                    💡 <strong>ส่งภาพออกจอที่ 2 บนคอมพิวเตอร์เครื่องเดียวกัน:</strong>
                    <br />
                    กดปุ่มเปิดหน้าต่างจอที่ 2 แล้วลากไปยังจอมอนิเตอร์/โปรเจกเตอร์ได้ทันที
                  </div>

                  <button
                    onClick={() => {
                      handleOpenDualMonitor();
                      setShowConnectModal(false);
                    }}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🚀 เปิดหน้าต่างจอที่ 2 บัดนี้
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setShowConnectModal(false)}
                style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}