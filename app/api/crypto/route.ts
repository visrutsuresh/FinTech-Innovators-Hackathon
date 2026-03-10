import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_PRICES: Record<string, { usd: number }> = {
  bitcoin: { usd: 83000 },
  ethereum: { usd: 2000 },
  solana: { usd: 130 },
  'matic-network': { usd: 0.40 },
  dogecoin: { usd: 0.17 },
}

export async function GET(req: NextRequest) {
  // Caller passes ?ids=bitcoin,ethereum,... for the exact coins it needs.
  // Fall back to the default set when called without params (e.g. direct browser hit).
  const param = req.nextUrl.searchParams.get('ids')
  const ids = param ?? Object.keys(FALLBACK_PRICES).join(',')

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error('CoinGecko failed')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Return fallback prices only for the requested ids
    const fallback: Record<string, { usd: number }> = {}
    for (const id of ids.split(',')) {
      if (FALLBACK_PRICES[id]) fallback[id] = FALLBACK_PRICES[id]
    }
    return NextResponse.json(fallback)
  }
}
