// SERVER-ONLY data access layer — import only in server components and API routes.
import { createAdminClient } from './supabase-server'
import { Role, RiskProfile, AssetClass } from '@/types'
import type { Client, Adviser, Asset } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAsset(row: any): Asset {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker ?? undefined,
    assetClass: row.asset_class as AssetClass,
    value: Number(row.value),
    currency: row.currency ?? 'USD',
    quantity: row.quantity != null ? Number(row.quantity) : undefined,
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : undefined,
    isCrypto: Boolean(row.is_crypto),
    coinGeckoId: row.coin_gecko_id ?? undefined,
    finageSymbol: row.finage_symbol ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClient(profile: any, portfolio: any, assets: any[]): Client {
  const mappedAssets = assets.map(mapAsset)
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: '',
    role: Role.CLIENT,
    riskProfile: profile.risk_profile as RiskProfile,
    investorProfile: profile.investor_profile ?? undefined,
    adviserId: profile.adviser_id ?? undefined,
    portfolio: {
      assets: mappedAssets,
      totalValue: portfolio?.total_value != null
        ? Number(portfolio.total_value)
        : mappedAssets.reduce((s, a) => s + a.value, 0),
      lastUpdated: portfolio?.last_updated ?? new Date().toISOString(),
    },
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  const db = createAdminClient()

  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'client')
    .single()

  if (error || !profile) return null

  // Fetch portfolio + assets in one query (faster)
  const { data: portfolioRow } = await db
    .from('portfolios')
    .select('*, assets(*)')
    .eq('client_id', id)
    .single()

  const portfolio = portfolioRow ? { id: portfolioRow.id, total_value: portfolioRow.total_value, last_updated: portfolioRow.last_updated } : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAssets: any[] = (portfolioRow as { assets?: any[] } | null)?.assets ?? []
  const assets = rawAssets.slice().sort((a, b) => (Number(b?.value) ?? 0) - (Number(a?.value) ?? 0))

  return mapClient(profile, portfolio, assets)
}

export async function getAllClients(): Promise<Client[]> {
  const db = createAdminClient()

  const { data: profiles, error } = await db
    .from('profiles')
    .select('*')
    .eq('role', 'client')

  if (error || !profiles?.length) return []

  // Batch: fetch all portfolios in one query instead of N+1
  const clientIds = profiles.map((p) => p.id)
  const { data: portfolios } = await db.from('portfolios').select('*').in('client_id', clientIds)

  // Build portfolio lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolioByClientId = new Map<string, any>(
    (portfolios ?? []).map((p) => [p.client_id, p])
  )

  // Fetch assets for all portfolio ids in one query
  const portfolioIds = (portfolios ?? []).map((p) => p.id)
  const { data: assets } = portfolioIds.length
    ? await db.from('assets').select('*').in('portfolio_id', portfolioIds).order('value', { ascending: false })
    : { data: [] }

  // Build assets lookup by portfolio_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assetsByPortfolioId = new Map<string, any[]>()
  for (const asset of assets ?? []) {
    const list = assetsByPortfolioId.get(asset.portfolio_id) ?? []
    list.push(asset)
    assetsByPortfolioId.set(asset.portfolio_id, list)
  }

  return profiles.map((profile) => {
    const portfolio = portfolioByClientId.get(profile.id) ?? null
    const clientAssets = portfolio ? (assetsByPortfolioId.get(portfolio.id) ?? []) : []
    return mapClient(profile, portfolio, clientAssets)
  })
}

export async function getAdviserByEmail(email: string): Promise<Adviser | null> {
  const db = createAdminClient()

  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('email', email)
    .eq('role', 'adviser')
    .single()

  if (error || !profile) return null

  const { data: clientProfiles } = await db
    .from('profiles')
    .select('id')
    .eq('adviser_id', profile.id)

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: '',
    role: Role.ADVISER,
    clientIds: clientProfiles?.map((c: { id: string }) => c.id) ?? [],
  }
}
