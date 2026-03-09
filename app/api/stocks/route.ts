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
  const symbols = searchParams.get('symbols') || 'AAPL,MSFT,TSLA,NVDA,SPY,QQQ,JPM'

  const apiKey = process.env.FINAGE_API_KEY
  if (!apiKey) {
    console.warn('FINAGE_API_KEY not set — using fallback prices')
    return NextResponse.json(buildFallback(symbols))
  }

  try {
    const url = `https://api.finage.co.uk/last/stock/multi-quote?apikey=${apiKey}&symbols=${symbols}`
    const res = await fetch(url, { next: { revalidate: 60 } })

    if (!res.ok) {
      console.error(`Finage responded ${res.status}`)
      return NextResponse.json(buildFallback(symbols))
    }

    // Finage returns an array: [{ s: "AAPL", p: 175.23, t: 1710000000 }, ...]
    const data = await res.json()
    const prices: Record<string, number> = {}

    if (Array.isArray(data)) {
      for (const item of data) {
        const symbol = item.s ?? item.symbol ?? item.ticker
        const price = item.p ?? item.price ?? item.last ?? item.c
        if (symbol && price != null) {
          prices[symbol] = Number(price)
        }
      }
    } else if (typeof data === 'object') {
      // Some Finage plans return an object keyed by symbol
      for (const [sym, val] of Object.entries(data)) {
        const v = val as Record<string, number>
        const price = v.p ?? v.price ?? v.last ?? v.c
        if (price != null) prices[sym] = Number(price)
      }
    }

    // Fill any missing symbols with fallback
    for (const sym of symbols.split(',')) {
      if (!prices[sym] && FALLBACK_PRICES[sym]) {
        prices[sym] = FALLBACK_PRICES[sym]
      }
    }

    return NextResponse.json(prices)
  } catch (err) {
    console.error('Finage fetch error:', err)
    return NextResponse.json(buildFallback(symbols))
  }
}

function buildFallback(symbols: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const sym of symbols.split(',')) {
    result[sym] = FALLBACK_PRICES[sym] ?? 100
  }
  return result
}
