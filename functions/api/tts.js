import { synthesizeAzureTts, toAudioFilename } from "../_lib/azureTts.js";

/**
 * POST /api/tts
 * body: { text: string, voice?: string, rate?: number }
 *
 * Workflow (ชั้นที่ 2 & 3 ของ Multi-tier Caching):
 *  1) ตรวจสอบไฟล์เสียงใน Cloudflare R2 ก่อน -> ถ้ามี ส่งกลับทันที (เร็ว, ไม่เสีย Azure quota)
 *  2) ถ้าไม่มี -> เรียก Azure TTS สังเคราะห์ใหม่ -> บันทึกลง R2 + บันทึกคำลง D1 -> ส่งกลับ
 *
 * ต้องผูก binding ต่อไปนี้ใน Cloudflare Pages > Settings > Functions:
 *  - R2 bucket:      AUDIO_BUCKET
 *  - D1 database:    DB
 *  - Env variables:  AZURE_TTS_KEY, AZURE_TTS_REGION
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const word = (body.text || body.word || "").trim();
  const voice = body.voice;
  const rate = body.rate;

  if (!word) {
    return new Response(JSON.stringify({ error: "Word is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = toAudioFilename(word);

  // ชั้นที่ 2: ตรวจสอบใน Cloudflare R2 ก่อนว่ามีไฟล์เสียงนี้อยู่แล้วหรือไม่
  try {
    const existingAudio = await env.AUDIO_BUCKET.get(filename);
    if (existingAudio) {
      return new Response(existingAudio.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache": "HIT-R2",
        },
      });
    }
  } catch (err) {
    console.warn("R2 lookup error:", err);
    // ไม่ throw ต่อ — ถ้า R2 มีปัญหาชั่วคราว ให้ลองไป Azure ต่อแทนที่จะพังทั้งคำขอ
  }

  // ชั้นที่ 3: ไม่พบใน R2 -> เรียก Azure TTS สังเคราะห์เสียงใหม่
  let audioBuffer;
  try {
    audioBuffer = await synthesizeAzureTts(env, word, voice, rate);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // บันทึกไฟล์เสียงลง Cloudflare R2 เพื่อให้ครั้งถัดไปเร็วขึ้น (ทุกเครื่อง/ทุกผู้ใช้)
  try {
    await env.AUDIO_BUCKET.put(filename, audioBuffer, {
      httpMetadata: { contentType: "audio/mpeg" },
    });
  } catch (err) {
    console.warn("R2 put error:", err);
  }

  // บันทึกคำลง D1 (ถ้ายังไม่มีในฐานข้อมูล) เพื่อให้ปรากฏในหน้า "คลังเสียง"
  try {
    const existingWord = await env.DB.prepare(
      "SELECT id FROM words WHERE word = ?",
    )
      .bind(word)
      .first();
    if (!existingWord) {
      await env.DB.prepare(
        "INSERT INTO words (word, audio_filename) VALUES (?, ?)",
      )
        .bind(word, filename)
        .run();
    }
  } catch (err) {
    console.warn("D1 insert warning:", err);
  }

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Cache": "MISS-AZURE",
    },
  });
}