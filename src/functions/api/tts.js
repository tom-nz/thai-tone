// functions/api/tts.js
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const word = url.searchParams.get("word");
  const list = url.searchParams.get("list");

  // 1. เรียกดูรายการคำศัพท์ทั้งหมดสำหรับแผงควบคุม
  if (list) {
    const { results } = await env.DB.prepare("SELECT * FROM words ORDER BY id DESC").all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. ดึงไฟล์เสียงเฉพาะคำจาก R2
  if (word) {
    const filename = `${encodeURIComponent(word)}.mp3`;
    const object = await env.AUDIO_BUCKET.get(filename);
    if (!object) {
      return new Response(JSON.stringify({ error: "Audio not found" }), { status: 404 });
    }
    return new Response(object.body, {
      headers: { "Content-Type": "audio/mpeg", "X-Cache-Status": "HIT-R2" }
    });
  }

  return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { word, ipa, tone_rule, overwrite } = await request.json();

  if (!word) {
    return new Response(JSON.stringify({ error: "Word is required" }), { status: 400 });
  }

  const filename = `${encodeURIComponent(word)}.mp3`;

  // ตรวจสอบใน R2 ก่อน (ถ้าไม่ได้สั่ง overwrite)
  if (!overwrite) {
    const cachedAudio = await env.AUDIO_BUCKET.get(filename);
    if (cachedAudio) {
      return new Response(cachedAudio.body, {
        headers: { "Content-Type": "audio/mpeg", "X-Cache-Status": "HIT-R2" }
      });
    }
  }

  // Azure Neural TTS Configuration เพื่อคุณภาพเสียงภาษาไทยระดับสูงสุด
  const azureKey = env.AZURE_SPEECH_KEY;
  const azureRegion = env.AZURE_SPEECH_REGION;
  const endpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const wordContent = ipa ? `<phoneme alphabet="ipa" ph="${ipa}">${word}</phoneme>` : word;
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="th-TH">
      <voice name="th-TH-PremwadeeNeural">
        <prosody rate="0%" pitch="0%">
          ${wordContent}
        </prosody>
      </voice>
    </speak>`;

  const azureRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": azureKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3"
    },
    body: ssml
  });

  if (!azureRes.ok) {
    const errorText = await azureRes.text();
    return new Response(JSON.stringify({ error: "Azure TTS failed", details: errorText }), { status: 502 });
  }

  const audioBuffer = await azureRes.arrayBuffer();

  // บันทึกไฟล์เสียงลง Cloudflare R2
  await env.AUDIO_BUCKET.put(filename, audioBuffer, {
    httpMetadata: { contentType: "audio/mpeg" }
  });

  // บันทึกหรืออัปเดตลง D1 Database
  await env.DB.prepare(`
    INSERT INTO words (word, tone_rule, ipa, audio_filename) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(word) DO UPDATE SET 
      tone_rule = excluded.tone_rule,
      ipa = excluded.ipa,
      audio_filename = excluded.audio_filename
  `).bind(word, tone_rule || null, ipa || null, filename).run();

  return new Response(audioBuffer, {
    headers: { "Content-Type": "audio/mpeg", "X-Cache-Status": "MISS-AZURE" }
  });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const { word } = await request.json();

  if (!word) {
    return new Response(JSON.stringify({ error: "Word is required" }), { status: 400 });
  }

  const filename = `${encodeURIComponent(word)}.mp3`;

  // ลบทั้งใน R2 และ D1
  await env.AUDIO_BUCKET.delete(filename);
  await env.DB.prepare("DELETE FROM words WHERE word = ?").bind(word).run();

  return new Response(JSON.stringify({ success: true, message: `Deleted ${word}` }), {
    headers: { "Content-Type": "application/json" }
  });
}