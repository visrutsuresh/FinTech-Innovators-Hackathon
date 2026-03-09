import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ids = 'bitcoin,ethereum,solana,matic-network,dogecoin'
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error('CoinGecko failed')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Return fallback prices
    return NextResponse.json({
      bitcoin: { usd: 68000 },
      ethereum: { usd: 3200 },
      solana: { usd: 150 },
      'matic-network': { usd: 0.65 },
      dogecoin: { usd: 0.12 },
    })
  }
}
