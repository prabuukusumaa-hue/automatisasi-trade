// api/claude.js — Vercel Serverless Function
// Handles Hyperliquid data + Gemini 2.5 Pro analysis (no CORS issues)

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

    // ── 1. Proxy semua request ke Hyperliquid ─────────────────────────────
    if (action === 'hl') {
      // Ambil semua field kecuali 'action', teruskan ke Hyperliquid
      const { action: _a, ...hlBody } = req.body;
      console.log('HL request body:', JSON.stringify(hlBody));
      const data = await hlPost(hlBody);
      return res.status(200).json({ success: true, data });
    }

    // ── 4. Gemini analysis ─────────────────────────────────────────────────
    if (action === 'analyze') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables Vercel');

      const { systemPrompt, userMsg } = req.body;

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userMsg }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        }
      );

      if (!r.ok) {
        const e = await r.json();
        throw new Error('Gemini error: ' + (e.error?.message || r.status));
      }

      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({ success: true, text });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
