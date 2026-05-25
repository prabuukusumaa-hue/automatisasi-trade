// api/claude.js — Vercel Serverless Function
// Hyperliquid proxy + Gemini analysis (Free Tier compatible)

const HL = 'https://api.hyperliquid.xyz/info';

async function hlPost(body) {
  const r = await fetch(HL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('Hyperliquid error: ' + r.status);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {

    // ── Proxy ke Hyperliquid ───────────────────────────────────────────────
    if (action === 'hl') {
      const { action: _a, ...hlBody } = req.body;
      const data = await hlPost(hlBody);
      return res.status(200).json({ success: true, data });
    }

    // ── Gemini Analysis ────────────────────────────────────────────────────
    if (action === 'analyze') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY tidak ada di Vercel');

      const { systemPrompt, userMsg } = req.body;

      // Free tier models — coba satu per satu
      const models = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ];

      let lastError = '';
      for (const model of models) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{ text: systemPrompt + '\n\n' + userMsg }]
                }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 2048,
                },
              }),
            }
          );

          const raw = await r.text();

          if (!r.ok) {
            lastError = `${model}: HTTP ${r.status} — ${raw.slice(0, 200)}`;
            console.error('Model failed:', lastError);
            continue;
          }

          const d = JSON.parse(raw);
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!text) {
            lastError = `${model}: response kosong`;
            continue;
          }

          console.log('Success with model:', model);
          return res.status(200).json({ success: true, text, model });

        } catch (e) {
          lastError = `${model}: ${e.message}`;
          continue;
        }
      }

      throw new Error('Semua model gagal. ' + lastError);
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
