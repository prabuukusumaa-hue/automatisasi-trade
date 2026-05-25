// api/claude.js — Vercel Serverless Function
// Hyperliquid proxy + Claude AI analysis (Anthropic)

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

    // ── Claude AI Analysis ────────────────────────────────────────────────
    if (action === 'analyze') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY tidak ada di Vercel');

      const { systemPrompt, userMsg } = req.body;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: systemPrompt + '\n\n' + userMsg,
            }
          ],
        }),
      });

      const raw = await r.text();

      if (!r.ok) {
        throw new Error('Claude API ' + r.status + ': ' + raw.slice(0, 200));
      }

      const d = JSON.parse(raw);
      const text = d.content?.[0]?.text || '';
      if (!text) throw new Error('Claude response kosong');

      return res.status(200).json({ success: true, text, model: 'claude-haiku' });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
