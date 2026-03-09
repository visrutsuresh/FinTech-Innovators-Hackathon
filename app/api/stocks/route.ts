import { NextResponse } from 'next/server'

// Fallback prices used when Finage is unavailable or key is missing
const FALLBACK_PRICES: Record<string, number> = {
  AAPL: 213,
  MSFT: 415,
  TSLA: 175,
  NVDA: 875,
  SPY: 530,
  QQQ: 455,
  JPM: 205,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = (searchParams.get('symbols') || 'AAPL,MSFT,TSLA,NVDA,SPY,QQQ,JPM')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const apiKey = process.env.FINAGE_API_KEY
  const liveEnabled = process.env.FINAGE_ENABLED !== 'false'

  if (!apiKey || !liveEnabled) {
    if (!apiKey) console.warn('FINAGE_API_KEY not set — using fallback prices')
    if (!liveEnabled) console.info('FINAGE_ENABLED=false — using fallback prices')
    return NextResponse.json(buildFallback(symbols))
  }

  try {
    // Finage free plan only supports single-symbol quotes — fetch all in parallel
    const results = await Promise.allSettled(
      symbols.map(sym =>
        fetch(`https://api.finage.co.uk/last/stock/${sym}?apikey=${apiKey}`, {
          next: { revalidate: 60 },
        }).then(r => r.ok ? r.json() : null)
      )
    )

    const prices: Record<string, number> = {}
    results.forEach((result, i) => {
      const sym = symbols[i]
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value as { ask?: number; bid?: number; symbol?: string }
        // Use mid-price (ask + bid) / 2 for accuracy; fall back to ask or bid alone
        const ask = data.ask
        const bid = data.bid
        if (ask != null && bid != null) {
          prices[sym] = (ask + bid) / 2
        } else if (ask != null) {
          prices[sym] = ask
        } else if (bid != null) {
          prices[sym] = bid
        }
      }
      // Fill missing with fallback
      if (!prices[sym] && FALLBACK_PRICES[sym]) {
        prices[sym] = FALLBACK_PRICES[sym]
      }
    })

    return NextResponse.json(prices)
  } catch (err) {
    console.error('Finage fetch error:', err)
    return NextResponse.json(buildFallback(symbols))
  }
}

function buildFallback(symbols: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const sym of symbols) {
    result[sym] = FALLBACK_PRICES[sym] ?? 100
  }
  return result
}
