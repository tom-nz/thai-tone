// src/utils/pitchDetector.js

// 1. ฟังก์ชันคำนวณหาความถี่พื้นฐาน F0 (Hz) ด้วย Autocorrelation
export function autoCorrelate(buf, sampleRate) {
  let size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.025) return -1; // Noise gate ตัดเสียงรบกวน

  let r1 = 0, r2 = size - 1, thres = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }
  }
  buf = buf.slice(r1, r2);
  size = buf.length;

  let c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) c[i] += buf[j] * buf[j + i];
  }
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  return maxpos === 0 ? -1 : sampleRate / maxpos;
}

// 2. วิเคราะห์รูปทรงเส้นเสียง (Pitch Contour & Slope) ของ 1 พยางค์
export function classifyToneContour(pitchPoints) {
  const validPitches = pitchPoints.filter((p) => p > 60 && p < 450);
  if (validPitches.length < 8) return null;

  const n = validPitches.length;
  const headCount = Math.max(2, Math.floor(n * 0.3));
  const tailCount = Math.max(2, Math.floor(n * 0.3));

  const headSlice = validPitches.slice(0, headCount);
  const tailSlice = validPitches.slice(n - tailCount);

  const fStart = headSlice.reduce((a, b) => a + b, 0) / headCount;
  const fEnd = tailSlice.reduce((a, b) => a + b, 0) / tailCount;
  const fAvg = validPitches.reduce((a, b) => a + b, 0) / n;

  const deltaRatio = (fEnd - fStart) / fAvg;

  // เสียงโท (ID: 3) = เสียงตกวูบลงอย่างมีนัยสำคัญ
  if (deltaRatio < -0.14) {
    return 3;
  }

  // เสียงจัตวา (ID: 5) = เสียงช้อนขึ้นสูงอย่างมีนัยสำคัญ
  if (deltaRatio > 0.14) {
    return 5;
  }

  // เสียงเอก (ID: 2) = เสียงต่ำ เอนลงเล็กน้อย
  if (deltaRatio < -0.05) {
    return 2;
  }

  // เสียงตรี (ID: 4) = เสียงสูง ลอยตัว
  if (deltaRatio > 0.05) {
    return 4;
  }

  // เสียงสามัญ (ID: 1) = ระดับเสียงราบเรียบค่อนข้างคงที่
  return 1;
}

// 3. ตัวแปรความถี่อ้างอิงเป้าหมาย (Hz) ที่ Vite ร้องขอ
export const TONE_TARGET_FREQS = {
  1: 130, // สามัญ (Mid)
  2: 105, // เอก (Low)
  3: 175, // โท (Falling)
  4: 220, // ตรี (High)
  5: 160  // จัตวา (Rising)
};