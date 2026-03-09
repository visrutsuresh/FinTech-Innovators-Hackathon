import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/mock-data'
import { calculateWellnessScore } from '@/lib/wellness'
import ClientView from './ClientView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params
  const client = getClientById(id)

  if (!client) {
    notFound()
  }

  // Fetch live crypto prices
  let cryptoPrices: Record<string, { usd: number }> = {}
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/crypto`, { next: { revalidate: 60 } })
    if (res.ok) cryptoPrices = await res.json()
  } catch {
    // use original mock values
  }

  // Update crypto asset values with live prices
  const updatedAssets = client.portfolio.assets.map(asset => {
    if (asset.isCrypto && asset.coinGeckoId && cryptoPrices[asset.coinGeckoId]) {
      const livePrice = cryptoPrices[asset.coinGeckoId].usd
      const quantity = asset.quantity || 1
      return { ...asset, value: livePrice * quantity }
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
