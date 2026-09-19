import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'
import { Buffer } from 'node:buffer'

function apiPlugin() {
  const words = [];
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers.host || 'localhost:3000';
        const url = new URL(req.url, `http://${host}`);
        if (url.pathname === '/api/words') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ words }));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed.word && !words.find(w => w.word === parsed.word)) {
                  words.unshift({
                    word: parsed.word,
                    audio_filename: `azure-premwadee-v1-${encodeURIComponent(parsed.word)}.mp3`,
                    created_at: new Date().toISOString(),
                  });
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, word: parsed.word }));
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
          if (req.method === 'DELETE') {
            const word = url.searchParams.get('word');
            const idx = words.findIndex(w => w.word === word);
            if (idx !== -1) words.splice(idx, 1);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, word }));
            return;
          }
        }
        if (url.pathname === '/api/tts') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(words));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              const azureKey = process.env.AZURE_TTS_KEY || process.env.AZURE_SPEECH_KEY;
              const azureRegion = process.env.AZURE_TTS_REGION || process.env.AZURE_SPEECH_REGION;
              if (azureKey && azureRegion) {
                try {
                  const parsed = JSON.parse(body);
                  const word = (parsed.text || parsed.word || '').trim();
                  const safeRate = Math.max(0.5, Math.min(1.4, Number(parsed.rate) || 1));
                  const ratePercent = Math.round((safeRate - 1) * 100);
                  const prosodyRate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
                  const ssml = `<speak version='1.0' xml:lang='th-TH'><voice xml:lang='th-TH' name='th-TH-PremwadeeNeural'><prosody rate='${prosodyRate}'>${word}</prosody></voice></speak>`;
                  const endpoint = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
                  const ttsRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                      'Ocp-Apim-Subscription-Key': azureKey,
                      'Content-Type': 'application/ssml+xml',
                      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                      'User-Agent': 'thai-tone-app',
                    },
                    body: ssml,
                  });
                  if (ttsRes.ok) {
                    const arrayBuf = await ttsRes.arrayBuffer();
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.end(Buffer.from(arrayBuf));
                    return;
                  }
                } catch (e) {
                  console.warn('Azure TTS proxy error:', e);
                }
              }
              // If not configured or failed, return 503 so client falls back to Web Speech API
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Azure TTS not configured. Using browser Web Speech API fallback.' }));
            });
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
