/**
 * =============================================================================
 * Shared helper: เรียก Azure Speech (TTS) และช่วยตั้งชื่อไฟล์เสียงใน R2
 * ใช้ร่วมกันโดย functions/api/tts.js และ functions/api/words.js
 * =============================================================================
 */

export function toAudioFilename(word) {
  return `${encodeURIComponent(word)}.mp3`;
}

function escapeSsml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * เรียก Azure Cognitive Services Speech เพื่อสังเคราะห์เสียง
 * @param {object} env - Cloudflare env bindings. รองรับทั้งชื่อเดิม
 *   AZURE_TTS_KEY/AZURE_TTS_REGION และชื่อที่ตั้งไว้ใน Pages
 *   AZURE_SPEECH_KEY/AZURE_SPEECH_REGION
 * @param {string} text - คำ/ข้อความภาษาไทยที่จะอ่าน
 * @param {string} [voice] - ชื่อเสียง Azure Neural เช่น th-TH-PremwadeeNeural
 * @param {number} [rate] - อัตราเร็ว 0.5 - 1.4 (1 = ปกติ)
 * @returns {Promise<ArrayBuffer>} ไฟล์เสียง MP3 แบบ binary
 */
export async function synthesizeAzureTts(env, text, voice, rate) {
  const azureKey = env.AZURE_TTS_KEY || env.AZURE_SPEECH_KEY;
  const azureRegion = env.AZURE_TTS_REGION || env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    throw new Error(
      "Missing Azure Speech bindings: set AZURE_TTS_KEY/AZURE_TTS_REGION or AZURE_SPEECH_KEY/AZURE_SPEECH_REGION",
    );
  }
  if (!text || !text.trim()) {
    throw new Error("Text is required for TTS synthesis");
  }

  const azureEndpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const safeVoice = voice || "th-TH-PremwadeeNeural";

  // แปลง rate (0.5 - 1.4, 1 = ปกติ) เป็นค่า prosody rate แบบ % ที่ SSML รองรับ
  const safeRate = Math.max(0.5, Math.min(1.4, Number(rate) || 1));
  const ratePercent = Math.round((safeRate - 1) * 100);
  const prosodyRate = `${ratePercent >= 0 ? "+" : ""}${ratePercent}%`;

  const ssml = `<speak version='1.0' xml:lang='th-TH'>
    <voice xml:lang='th-TH' name='${safeVoice}'>
      <prosody rate='${prosodyRate}'>${escapeSsml(text.trim())}</prosody>
    </voice>
  </speak>`;

  const azureResponse = await fetch(azureEndpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": azureKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    },
    body: ssml,
  });

  if (!azureResponse.ok) {
    const detail = await azureResponse.text().catch(() => "");
    throw new Error(`Azure TTS failed (${azureResponse.status}): ${detail}`);
  }

  return azureResponse.arrayBuffer();
}
