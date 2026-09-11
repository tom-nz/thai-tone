import { get, set, del } from 'idb-keyval';

export async function playThaiAudio(word) {
  const cacheKey = `th_audio_${word}`;

  // ชั้นที่ 1: แคชในอุปกรณ์ (IndexedDB)
  const localBlob = await get(cacheKey);
  if (localBlob) {
    return playBlob(localBlob);
  }

  // ชั้นที่ 2 & 3: Cloudflare R2 / Azure ผ่าน Function API
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) throw new Error('Audio fetch failed');

  const blob = await response.blob();
  await set(cacheKey, blob);
  return playBlob(blob);
}

export async function clearLocalAudioCache(word) {
  if (word) {
    await del(`th_audio_${word}`);
  }
}

function playBlob(blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return audio.play();
}