import { AssetClass, RiskProfile, type Portfolio, type WellnessScore } from '@/types'

// Round for stable scoring — same assets/quantities should yield same score despite tiny price changes
const round2 = (n: number) => Math.round(n * 100) / 100
const round3 = (n: number) => Math.round(n * 1000) / 1000

export function calculateDiversificationScore(portfolio: Portfolio): number {
  if (!portfolio.assets.length) return 0

  const classValues: Record<string, number> = {}
  for (const asset of portfolio.assets) {
    const cls = asset.assetClass
    classValues[cls] = (classValues[cls] || 0) + round2(asset.value)
  }
  const total = Object.values(classValues).reduce((s, v) => s + v, 0)
  if (total === 0) return 0

  // HHI: sum of squared weights
  const weights = Object.values(classValues).map(v => v / total)
  const hhi = weights.reduce((sum, w) => sum + w * w, 0)

  // HHI ranges from 1/n (perfect) to 1 (fully concentrated)
  // Convert to 0-100 score: lower HHI = higher score
  const n = Object.keys(classValues).length
  const minHHI = n > 0 ? 1 / n : 1
  const normalizedHHI = (hhi - minHHI) / (1 - minHHI + 0.0001)
  const score = Math.round((1 - normalizedHHI) * 100)
  return Math.max(0, Math.min(100, score))
}

export function calculateLiquidityScore(portfolio: Portfolio): number {
  const total = round2(portfolio.assets.reduce((s, a) => s + a.value, 0))
  if (total === 0) return 0

  const liquidClasses = [AssetClass.CASH, AssetClass.STOCKS, AssetClass.CRYPTO, AssetClass.BONDS]
  const liquidValue = round2(portfolio.assets
    .filter(a => liquidClasses.includes(a.assetClass))
    .reduce((s, a) => s + a.value, 0))

  const liquidRatio = round3(liquidValue / total) // stable across small price wobbles

  // Score: 100% liquid = 100, <20% liquid = 10
  if (liquidRatio >= 0.9) return 95
  if (liquidRatio >= 0.7) return 80
  if (liquidRatio >= 0.5) return 65
  if (liquidRatio >= 0.3) return 45
  if (liquidRatio >= 0.2) return 30
  return 15
}

export function calculateBehavioralResilienceScore(
  portfolio: Portfolio,
  riskProfile: RiskProfile
): number {
  const total = round2(portfolio.assets.reduce((s, a) => s + a.value, 0))
  if (total === 0) return 50

  const cryptoValue = round2(portfolio.assets
    .filter(a => a.assetClass === AssetClass.CRYPTO)
    .reduce((s, a) => s + a.value, 0))
  const cryptoRatio = round3(cryptoValue / total)

  const privateValue = round2(portfolio.assets
    .filter(a => a.assetClass === AssetClass.PRIVATE)
    .reduce((s, a) => s + a.value, 0))
  const privateRatio = round3(privateValue / total)

  let score = 70

  if (riskProfile === RiskProfile.CONSERVATIVE) {
    if (cryptoRatio > 0.3) score -= 30
    else if (cryptoRatio > 0.15) score -= 15
    if (privateRatio > 0.2) score -= 15
    if (cryptoRatio < 0.05 && privateRatio < 0.1) score += 20
  } else if (riskProfile === RiskProfile.MODERATE) {
    if (cryptoRatio > 0.5) score -= 20
    else if (cryptoRatio > 0.3) score -= 10
    else if (cryptoRatio >= 0.1 && cryptoRatio <= 0.25) score += 10
    if (privateRatio > 0.4) score -= 10
  } else if (riskProfile === RiskProfile.AGGRESSIVE) {
    if (cryptoRatio > 0.7) score -= 15
    else if (cryptoRatio >= 0.3 && cryptoRatio <= 0.6) score += 15
    if (privateRatio >= 0.2 && privateRatio <= 0.5) score += 10
  }

  return Math.max(10, Math.min(100, score))
}

export function getWellnessLabel(score: number): WellnessScore['label'] {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

export function calculateWellnessScore(
  portfolio: Portfolio,
  riskProfile: RiskProfile
): WellnessScore {
  const diversification = calculateDiversificationScore(portfolio)
  const liquidity = calculateLiquidityScore(portfolio)
  const behavioral = calculateBehavioralResilienceScore(portfolio, riskProfile)

  const overall = Math.round(
    diversification * 0.4 + liquidity * 0.35 + behavioral * 0.25
  )

  return {
    overall,
    diversification,
    liquidity,
    behavioral,
    label: getWellnessLabel(overall),
  }
}
