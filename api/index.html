// api/trade.js — Vercel Serverless Function
// Handles: Gemini AI analysis + Hyperliquid data fetch + order execution

const HYPERLIQUID_API = "https://api.hyperliquid.xyz";

// ─── Fetch top 5 coins by volume + full market data ───────────────────────
async function fetchHyperliquidData() {
  const [metaRes, statsRes] = await Promise.all([
    fetch(`${HYPERLIQUID_API}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    }),
    fetch(`${HYPERLIQUID_API}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    }),
  ]);

  const meta = await metaRes.json();
  const stats = await statsRes.json();

  const assets = meta.universe;
  const ctxs = stats[1];

  // Sort by volume, take top 5
  const withVolume = assets.map((a, i) => ({
    symbol: a.name,
    szDecimals: a.szDecimals,
    ctx: ctxs[i],
  }));

  withVolume.sort(
    (a, b) =>
      parseFloat(b.ctx?.dayNtlVlm || 0) - parseFloat(a.ctx?.dayNtlVlm || 0)
  );

  const top5 = withVolume.slice(0, 5);

  // Fetch orderbook & recent trades for each
  const enriched = await Promise.all(
    top5.map(async (coin) => {
      const [bookRes, tradesRes, candlesRes] = await Promise.all([
        fetch(`${HYPERLIQUID_API}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "l2Book", coin: coin.symbol }),
        }),
        fetch(`${HYPERLIQUID_API}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "recentTrades",
            coin: coin.symbol,
          }),
        }),
        fetch(`${HYPERLIQUID_API}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: {
              coin: coin.symbol,
              interval: "15m",
              startTime: Date.now() - 24 * 60 * 60 * 1000,
              endTime: Date.now(),
            },
          }),
        }),
      ]);

      const book = await bookRes.json();
      const trades = await tradesRes.json();
      const candles = await candlesRes.json();

      // Compute basic indicators from candles
      const closes = candles.map((c) => parseFloat(c.c));
      const volumes = candles.map((c) => parseFloat(c.v));
      const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, closes.length);
      const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

      // RSI 14
      let rsi = 50;
      if (closes.length >= 15) {
        const diffs = closes.slice(-15).map((c, i, arr) => i === 0 ? 0 : c - arr[i - 1]);
        const gains = diffs.filter((d) => d > 0).reduce((a, b) => a + b, 0) / 14;
        const losses = Math.abs(diffs.filter((d) => d < 0).reduce((a, b) => a + b, 0)) / 14;
        rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
      }

      return {
        symbol: coin.symbol,
        price: parseFloat(coin.ctx?.markPx || 0),
        change24h: parseFloat(coin.ctx?.prevDayPx || 0),
        volume24h: parseFloat(coin.ctx?.dayNtlVlm || 0),
        openInterest: parseFloat(coin.ctx?.openInterest || 0),
        fundingRate: parseFloat(coin.ctx?.funding || 0),
        premium: parseFloat(coin.ctx?.premium || 0),
        orderBook: {
          bids: book.levels?.[0]?.slice(0, 5) || [],
          asks: book.levels?.[1]?.slice(0, 5) || [],
        },
        recentTrades: trades.slice(0, 10),
        candles: candles.slice(-20), // last 20 candles
        indicators: {
          sma20: sma20.toFixed(4),
          sma50: sma50.toFixed(4),
          rsi: rsi.toFixed(2),
          avgVolume: avgVol.toFixed(2),
          currentVolume: volumes[volumes.length - 1],
        },
      };
    })
  );

  return enriched;
}

// ─── Gemini Analysis ───────────────────────────────────────────────────────
async function analyzeWithGemini(marketData) {
  const prompt = `Kamu adalah APEX — seorang trader profesional dengan 15 tahun pengalaman di market crypto derivatives. Kamu dikenal karena analisis teknikal yang presisi, manajemen risiko yang ketat, dan kemampuan membaca market sentiment dari data mentah.

Saat ini kamu sedang menganalisis data real-time dari Hyperliquid DEX. Berikan analisis mendalam dan trading plan yang actionable.

═══════════════════════════════════════
DATA MARKET REAL-TIME HYPERLIQUID
═══════════════════════════════════════
${JSON.stringify(marketData, null, 2)}

═══════════════════════════════════════
TUGAS ANALISIS
═══════════════════════════════════════
Untuk setiap coin, analisis:
1. Price Action & Trend (bullish/bearish/sideways)
2. Momentum (RSI overbought/oversold, volume confirmation)
3. Order Book Imbalance (buying/selling pressure)
4. Funding Rate sentiment (long/short bias di market)
5. Open Interest (apakah OI naik/turun seiring harga)
6. Support & Resistance dari candle data
7. Risk/Reward ratio

Pilih 1 BEST TRADE dari top 5 coins yang paling menarik saat ini.

═══════════════════════════════════════
FORMAT RESPONS (JSON ONLY, no markdown)
═══════════════════════════════════════
{
  "analysis": [
    {
      "symbol": "BTC",
      "trend": "BULLISH|BEARISH|SIDEWAYS",
      "signal": "BUY|SELL|HOLD",
      "confidence": 85,
      "reasoning": "penjelasan 2-3 kalimat",
      "rsi_interpretation": "penjelasan RSI",
      "volume_analysis": "penjelasan volume",
      "funding_interpretation": "penjelasan funding rate",
      "support": 95000,
      "resistance": 98000
    }
  ],
  "best_trade": {
    "symbol": "BTC",
    "action": "BUY|SELL",
    "entry": 96500,
    "stop_loss": 95200,
    "take_profit_1": 97800,
    "take_profit_2": 99000,
    "leverage": 5,
    "size_usd": 100,
    "confidence": 87,
    "risk_reward": "1:2.5",
    "risk_level": "LOW|MEDIUM|HIGH",
    "reasoning": "penjelasan lengkap mengapa ini best trade",
    "invalidation": "kondisi yang membatalkan setup ini"
  },
  "market_sentiment": "BULLISH|BEARISH|NEUTRAL",
  "market_summary": "ringkasan kondisi market keseluruhan dalam 2-3 kalimat"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // Strip markdown if any
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Execute Trade on Hyperliquid ─────────────────────────────────────────
async function executeTrade(tradeParams, walletAddress, privateKey) {
  const { symbol, action, entry, stop_loss, take_profit_1, leverage, size_usd } = tradeParams;

  // Build order
  const isBuy = action === "BUY";
  const price = parseFloat(entry);
  const sz = (parseFloat(size_usd) / price).toFixed(6);

  // Hyperliquid order structure
  const orderRequest = {
    action: {
      type: "order",
      orders: [
        {
          a: 0, // asset index — will be resolved
          b: isBuy,
          p: price.toFixed(2),
          s: sz,
          r: false,
          t: {
            limit: {
              tif: "Gtc",
            },
          },
        },
      ],
      grouping: "na",
    },
    nonce: Date.now(),
    signature: null, // signing handled below
  };

  // NOTE: Full on-chain signing requires ethers.js on server
  // This returns the order structure for client-side signing
  return {
    status: "ready_to_sign",
    order: orderRequest,
    summary: {
      symbol,
      action,
      entry: price,
      size: sz,
      size_usd,
      leverage,
      stop_loss,
      take_profit: take_profit_1,
    },
  };
}

// ─── Main Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.body;

  try {
    // 1. Fetch market data
    if (action === "fetch_data") {
      const data = await fetchHyperliquidData();
      return res.status(200).json({ success: true, data });
    }

    // 2. Analyze with Gemini
    if (action === "analyze") {
      const { marketData } = req.body;
      const analysis = await analyzeWithGemini(marketData);
      return res.status(200).json({ success: true, analysis });
    }

    // 3. Full cycle: fetch + analyze
    if (action === "full_cycle") {
      const marketData = await fetchHyperliquidData();
      const analysis = await analyzeWithGemini(marketData);
      return res.status(200).json({ success: true, marketData, analysis });
    }

    // 4. Execute trade (returns order for client signing)
    if (action === "execute_trade") {
      const { tradeParams, walletAddress, privateKey } = req.body;
      const result = await executeTrade(tradeParams, walletAddress, privateKey);
      return res.status(200).json({ success: true, result });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
