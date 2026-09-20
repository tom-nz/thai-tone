// src/utils/pitchDetector.js

// 1. คำนวณความถี่พื้นฐาน F0 (Hz) จาก Buffer
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

/**
 * 2. วิเคราะห์รูปทรงเส้นเสียง (Pitch Contour) ของ 1 พยางค์
 * คืนค่า ID วรรณยุกต์: 1=สามัญ, 2=เอก, 3=โท, 4=ตรี, 5=จัตวา
 */
export function classifyToneContour(pitchPoints) {
  // ต้องการข้อมูลเสียงอย่างน้อย 8 เฟรม (~180-250ms)
  const validPitches = pitchPoints.filter((p) => p > 60 && p < 450);
  if (validPitches.length < 8) return null;

  const n = validPitches.length;
  // ค่าเฉลี่ยช่วง 30% แรก (Onset) และ 30% ท้าย (Coda)
  const headCount = Math.max(2, Math.floor(n * 0.3));
  const tailCount = Math.max(2, Math.floor(n * 0.3));

  const headSlice = validPitches.slice(0, headCount);
  const tailSlice = validPitches.slice(n - tailCount);

  const fStart = headSlice.reduce((a, b) => a + b, 0) / headCount;
  const fEnd = tailSlice.reduce((a, b) => a + b, 0) / tailCount;
  const fAvg = validPitches.reduce((a, b) => a + b, 0) / n;

  // คำนวณอัตราส่วนความต่างระดับเสียง (Normalized Semitone/Delta Ratio)
  const deltaRatio = (fEnd - fStart) / fAvg;

  // ก. เสียงโท (ID: 3) = ตกวูบลงอย่างมีนัยสำคัญ (Delta ติดลบ > 14%)
  if (deltaRatio < -0.14) {
    return 3;
  }

  // ข. เสียงจัตวา (ID: 5) = ดีดขึ้นอย่างมีนัยสำคัญ (Delta เป็นบวก > 14%)
  if (deltaRatio > 0.14) {
    return 5;
  }

  // ค. สำหรับกลุ่มเสียงราบ (สามัญ, เอก, ตรี) ใช้ความชันเล็กน้อยและการเทียบระดับเสียงสัมพัทธ์
  if (deltaRatio < -0.05) {
    return 2; // เสียงเอก (Low-Falling เล็กน้อย)
  }

  if (deltaRatio > 0.05) {
    return 4; // เสียงตรี (High-Rising เล็กน้อย)
  }

  // ง. ค่อนข้างราบเรียบ = เสียงสามัญ (ID: 1)
  return 1;
}