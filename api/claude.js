// api/claude.js — Vercel Serverless Function
// Hyperliquid proxy + Groq AI (LLaMA 3.3 70B) — 100% Free

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

    // ── Proxy ke Hyperliquid ──────────────────────────────────────────────
    if (action === 'hl') {
      const { action: _a, ...hlBody } = req.body;
      const data = await hlPost(hlBody);
      return res.status(200).json({ success: true, data });
    }

    // ── Groq AI Analysis (LLaMA 3.3 70B) ─────────────────────────────────
    if (action === 'analyze') {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY tidak ada di Vercel Environment Variables');

      const { systemPrompt, userMsg } = req.body;

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        }),
      });

      const raw = await r.text();

      if (!r.ok) {
        throw new Error('Groq API ' + r.status + ': ' + raw.slice(0, 200));
      }

      const d = JSON.parse(raw);
      const text = d.choices?.[0]?.message?.content || '';
      if (!text) throw new Error('Groq response kosong');

      return res.status(200).json({ success: true, text, model: 'llama-3.3-70b' });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
