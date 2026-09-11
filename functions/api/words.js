import { synthesizeAzureTts, toAudioFilename } from "../_lib/azureTts.js";

/**
 * /api/words — จัดการ "คลังเสียง" (คำศัพท์ + ไฟล์เสียง) สำหรับปุ่มควบคุมในแผงควบคุม
 *
 * GET    /api/words              -> เรียกดูรายการคำทั้งหมด (browse)
 * POST   /api/words               -> เพิ่มคำใหม่ + สังเคราะห์เสียงผ่าน Azure (add)
 *        body: { word, voice?, rate? }
 * PUT    /api/words (multipart)   -> แทนที่ไฟล์เสียงของคำเดิมด้วยไฟล์ที่อัปโหลดเอง (edit)
 *        formData: word, audio(file)
 * DELETE /api/words?word=...      -> ลบคำ + ไฟล์เสียงออกจาก R2 และ D1 (delete)
 *
 * ต้องผูก binding เดียวกับ functions/api/tts.js: AUDIO_BUCKET หรือ AUDIO_FILES (R2), DB (D1),
 * AZURE_TTS_KEY, AZURE_TTS_REGION (Environment variables)
 */

const jsonHeaders = { "Content-Type": "application/json" };

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT word, audio_filename, created_at FROM words ORDER BY created_at DESC LIMIT 500",
    ).all();
    return new Response(JSON.stringify({ words: results || [] }), {
      headers: jsonHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const audioBucket = env.AUDIO_BUCKET || env.AUDIO_FILES;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const word = (body.word || "").trim();
  if (!word) {
    return new Response(JSON.stringify({ error: "Word is required" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!audioBucket) {
    return new Response(JSON.stringify({ error: "Missing R2 binding: set AUDIO_BUCKET or AUDIO_FILES" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const filename = toAudioFilename(word);

  let audioBuffer;
  try {
    audioBuffer = await synthesizeAzureTts(env, word, body.voice, body.rate);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  try {
    await audioBucket.put(filename, audioBuffer, {
      httpMetadata: { contentType: "audio/mpeg" },
    });

    const existingWord = await env.DB.prepare(
      "SELECT id FROM words WHERE word = ?",
    )
      .bind(word)
      .first();

    if (existingWord) {
      await env.DB.prepare(
        "UPDATE words SET audio_filename = ? WHERE word = ?",
      )
        .bind(filename, word)
        .run();
    } else {
      await env.DB.prepare(
        "INSERT INTO words (word, audio_filename) VALUES (?, ?)",
      )
        .bind(word, filename)
        .run();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true, word, filename }), {
    headers: jsonHeaders,
  });
}

// แก้ไข: แทนที่ไฟล์เสียงด้วยไฟล์ที่ผู้ใช้อัปโหลดเอง (เช่น กรณี Azure อ่านคำเพี้ยน)
export async function onRequestPut(context) {
  const { request, env } = context;
  const audioBucket = env.AUDIO_BUCKET || env.AUDIO_FILES;

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const word = (formData.get("word") || "").toString().trim();
  const audioFile = formData.get("audio");

  if (!word || !audioFile || typeof audioFile === "string") {
    return new Response(
      JSON.stringify({ error: "Word and audio file are required" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  if (!audioBucket) {
    return new Response(JSON.stringify({ error: "Missing R2 binding: set AUDIO_BUCKET or AUDIO_FILES" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const filename = toAudioFilename(word);

  try {
    const audioBuffer = await audioFile.arrayBuffer();
    await audioBucket.put(filename, audioBuffer, {
      httpMetadata: { contentType: audioFile.type || "audio/mpeg" },
    });

    const existingWord = await env.DB.prepare(
      "SELECT id FROM words WHERE word = ?",
    )
      .bind(word)
      .first();

    if (existingWord) {
      await env.DB.prepare(
        "UPDATE words SET audio_filename = ? WHERE word = ?",
      )
        .bind(filename, word)
        .run();
    } else {
      await env.DB.prepare(
        "INSERT INTO words (word, audio_filename) VALUES (?, ?)",
      )
        .bind(word, filename)
        .run();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true, word, filename }), {
    headers: jsonHeaders,
  });
}

// ลบ: เอาคำออกจาก D1 และลบไฟล์เสียงออกจาก R2
export async function onRequestDelete(context) {
  const { request, env } = context;
  const audioBucket = env.AUDIO_BUCKET || env.AUDIO_FILES;
  const url = new URL(request.url);
  const word = (url.searchParams.get("word") || "").trim();

  if (!word) {
    return new Response(
      JSON.stringify({ error: "Word query param is required" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  if (!audioBucket) {
    return new Response(JSON.stringify({ error: "Missing R2 binding: set AUDIO_BUCKET or AUDIO_FILES" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const filename = toAudioFilename(word);

  try {
    await audioBucket.delete(filename);
    await env.DB.prepare("DELETE FROM words WHERE word = ?").bind(word).run();
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true, word }), {
    headers: jsonHeaders,
  });
}
