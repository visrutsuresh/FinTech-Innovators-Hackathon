export enum AssetClass {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  CASH = 'cash',
  PRIVATE = 'private',
  BONDS = 'bonds',
  REAL_ESTATE = 'real_estate',
}

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export enum Role {
  ADVISER = 'adviser',
  CLIENT = 'client',
}

export interface Asset {
  id: string
  name: string
  ticker?: string
  assetClass: AssetClass
  value: number
  currency: string
  quantity?: number
  purchasePrice?: number
  isCrypto?: boolean
  coinGeckoId?: string
}

export interface Portfolio {
  assets: Asset[]
  totalValue: number
  lastUpdated: string
}

export interface WellnessScore {
  overall: number
  diversification: number
  liquidity: number
  behavioral: number
  label: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent'
}

export interface Client {
  id: string
  name: string
  email: string
  password: string
  role: Role.CLIENT
  riskProfile: RiskProfile
  portfolio: Portfolio
  wellnessScore?: WellnessScore
  adviserId?: string
}

export interface Adviser {
  id: string
  name: string
  email: string
  password: string
  role: Role.ADVISER
  clientIds: string[]
}

export type User = Client | Adviser

export interface RecommendationRequest {
  clientId: string
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
  scenario?: string
}

export interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'diversification' | 'liquidity' | 'risk' | 'opportunity'
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  summary: string
  marketContext: string
}
