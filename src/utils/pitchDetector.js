// src/utils/pitchDetector.js

export function autoCorrelate(buf, sampleRate) {
  let size = buf.length;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / size);

  // Noise Gate กรองเสียงเงียบ
  if (rms < 0.02) return -1;

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
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  return maxpos === 0 ? -1 : sampleRate / maxpos;
}

// ตารางความถี่มาตรฐานตามระดับวรรณยุกต์ (Hz)
export const TONE_TARGET_FREQS = {
  0: 130, // สามัญ
  1: 105, // เอก
  2: 175, // โท
  3: 220, // ตรี
  4: 160  // จัตวา
};