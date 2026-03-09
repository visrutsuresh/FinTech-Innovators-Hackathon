import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/mock-data'
import { calculateWellnessScore } from '@/lib/wellness'
import { AssetClass } from '@/types'
import ClientView from './ClientView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params
  const client = getClientById(id)
  if (!client) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Collect tickers that need live prices
  const stockTickers = client.portfolio.assets
    .filter(a => a.assetClass === AssetClass.STOCKS && a.finageSymbol)
    .map(a => a.finageSymbol as string)

  // Fetch crypto + stocks in parallel
  const [cryptoPrices, stockPrices] = await Promise.all([
    fetch(`${baseUrl}/api/crypto`, { next: { revalidate: 60 } })
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({} as Record<string, { usd: number }>)),

    stockTickers.length > 0
      ? fetch(`${baseUrl}/api/stocks?symbols=${stockTickers.join(',')}`, { next: { revalidate: 60 } })
          .then(r => r.ok ? r.json() : {})
          .catch(() => ({} as Record<string, number>))
      : Promise.resolve({} as Record<string, number>),
  ])

  // Merge live prices into assets
  const updatedAssets = client.portfolio.assets.map(asset => {
    // Crypto — CoinGecko
    if (asset.isCrypto && asset.coinGeckoId) {
      const live = (cryptoPrices as Record<string, { usd: number }>)[asset.coinGeckoId]
      if (live?.usd) return { ...asset, value: live.usd * (asset.quantity ?? 1) }
    }
    // Stocks — Finage
    if (asset.assetClass === AssetClass.STOCKS && asset.finageSymbol) {
      const livePrice = (stockPrices as Record<string, number>)[asset.finageSymbol]
      if (livePrice) return { ...asset, value: livePrice * (asset.quantity ?? 1) }
    }
    return asset
  })

  const updatedPortfolio = {
    ...client.portfolio,
    assets: updatedAssets,
    totalValue: updatedAssets.reduce((s, a) => s + a.value, 0),
    lastUpdated: new Date().toISOString(),
  }

  const wellnessScore = calculateWellnessScore(updatedPortfolio, client.riskProfile)

  return (
    <ClientView
      client={{ ...client, portfolio: updatedPortfolio }}
      wellnessScore={wellnessScore}
    />
  )
}
