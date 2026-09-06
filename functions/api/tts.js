function escapeXmlText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

export async function onRequestPost({
  request,
  env,
}) {
  try {
    const body =
      await request.json();

    const text = String(
      body?.text || "",
    )
      .normalize("NFC")
      .trim();

    const requestedVoice =
      String(
        body?.voice ||
          "th-TH-PremwadeeNeural",
      );

    const rate =
      Number(body?.rate);

    if (!text) {
      return json(
        {
          error:
            "text is required",
        },
        400,
      );
    }

    if (text.length > 500) {
      return json(
        {
          error:
            "text is too long",
        },
        400,
      );
    }

    const allowedVoices =
      new Set([
        "th-TH-PremwadeeNeural",
        "th-TH-NiwatNeural",
        "th-TH-AcharaNeural",
        "th-TH-Krit:MAI-Voice-2",
        "th-TH-Krit:MAI-Voice-2-Flash",
        "th-TH-Nattapong:MAI-Voice-2",
        "th-TH-Nattapong:MAI-Voice-2-Flash",
      ]);

    const voice =
      allowedVoices.has(
        requestedVoice,
      )
        ? requestedVoice
        : "th-TH-PremwadeeNeural";

    const safeRate =
      Math.max(
        0.5,
        Math.min(
          1.4,
          Number.isFinite(rate)
            ? rate
            : 0.85,
        ),
      );

    const ratePercent =
      Math.round(
        (safeRate - 1) * 100,
      );

    const rateValue =
      `${ratePercent >= 0 ? "+" : ""}${ratePercent}%`;

    const key =
      env.AZURE_SPEECH_KEY;

    const region =
      env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return json(
        {
          error:
            "Azure Speech secrets are not configured",
        },
        503,
      );
    }

    const ssml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<speak version="1.0"',
      ' xmlns="http://www.w3.org/2001/10/synthesis"',
      ' xmlns:mstts="http://www.w3.org/2001/mstts"',
      ' xml:lang="th-TH">',
      `<voice name="${voice}">`,
      `<prosody rate="${rateValue}" pitch="0%">`,
      escapeXmlText(text),
      "</prosody>",
      "</voice>",
      "</speak>",
    ].join("");

    const response =
      await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",

          headers: {
            "Ocp-Apim-Subscription-Key":
              key,

            "Content-Type":
              "application/ssml+xml",

            "X-Microsoft-OutputFormat":
              "audio-16khz-128kbitrate-mono-mp3",

            "User-Agent":
              "thai-tone-app",
          },

          body: ssml,
        },
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Azure Speech error:",
        response.status,
        errorText,
      );

      return json(
        {
          error:
            "Azure Speech synthesis failed",
          status:
            response.status,
        },
        502,
      );
    }

    const audioBuffer =
      await response.arrayBuffer();

    return new Response(
      audioBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/mpeg",

          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "TTS proxy error:",
      error,
    );

    return json(
      {
        error:
          "Invalid TTS request",
      },
      400,
    );
  }
}