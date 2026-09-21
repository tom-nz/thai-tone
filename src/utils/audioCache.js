/**
 * =============================================================================
 * LOCAL AUDIO CACHE (INDEXED DB)
 * สำหรับจัดเก็บไฟล์เสียง Audio Blob ในเบราว์เซอร์ เพื่อความเร็วและการทำงาน Offline
 * =============================================================================
 */

const LOCAL_AUDIO_DB_NAME = "thai_tone_audio_cache";
const LOCAL_AUDIO_STORE_NAME = "audio_blobs";

export function openAudioCacheDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }
    const request = indexedDB.open(LOCAL_AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_AUDIO_STORE_NAME)) {
        db.createObjectStore(LOCAL_AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalAudioBlob(key) {
  try {
    const db = await openAudioCacheDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_AUDIO_STORE_NAME, "readonly");
      const req = tx.objectStore(LOCAL_AUDIO_STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("getLocalAudioBlob error:", err);
    return null;
  }
}

export async function setLocalAudioBlob(key, blob) {
  try {
    const db = await openAudioCacheDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_AUDIO_STORE_NAME, "readwrite");
      tx.objectStore(LOCAL_AUDIO_STORE_NAME).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("setLocalAudioBlob error:", err);
  }
}

export async function deleteLocalAudioBlob(key) {
  try {
    const db = await openAudioCacheDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_AUDIO_STORE_NAME, "readwrite");
      tx.objectStore(LOCAL_AUDIO_STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("deleteLocalAudioBlob error:", err);
  }
}

export async function clearAllLocalAudioBlobs() {
  try {
    const db = await openAudioCacheDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_AUDIO_STORE_NAME, "readwrite");
      tx.objectStore(LOCAL_AUDIO_STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("clearAllLocalAudioBlobs error:", err);
  }
}