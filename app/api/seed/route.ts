import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// One-time seed endpoint — creates all demo accounts in Supabase.
// Hit GET /api/seed once after setting up your Supabase project.
// Safe to call multiple times — skips existing users.

const DEMO_PASSWORD = 'demo123'

const DEMO_USERS = [
  {
    email: 'adviser@demo.com',
    name: 'David Koh',
    role: 'adviser' as const,
  },
  {
    email: 'alex@demo.com',
    name: 'Alex Chen',
    role: 'client' as const,
    riskProfile: 'aggressive',
    assets: [
      { name: 'Bitcoin',  ticker: 'BTC', assetClass: 'crypto',  value: 85000, currency: 'USD', quantity: 1.2,    isCrypto: true,  coinGeckoId: 'bitcoin' },
      { name: 'Ethereum', ticker: 'ETH', assetClass: 'crypto',  value: 24000, currency: 'USD', quantity: 8,      isCrypto: true,  coinGeckoId: 'ethereum' },
      { name: 'Solana',   ticker: 'SOL', assetClass: 'crypto',  value: 15000, currency: 'USD', quantity: 100,    isCrypto: true,  coinGeckoId: 'solana' },
      { name: 'Tesla',    ticker: 'TSLA',assetClass: 'stocks',  value: 12000, currency: 'USD', quantity: 30,     isCrypto: false, finageSymbol: 'TSLA' },
      { name: 'Cash',                    assetClass: 'cash',    value: 5000,  currency: 'USD' },
    ],
  },
  {
    email: 'sarah@demo.com',
    name: 'Sarah Lim',
    role: 'client' as const,
    riskProfile: 'moderate',
    assets: [
      { name: 'Apple',          ticker: 'AAPL', assetClass: 'stocks', value: 45000, currency: 'USD', quantity: 200,  isCrypto: false, finageSymbol: 'AAPL' },
      { name: 'Microsoft',      ticker: 'MSFT', assetClass: 'stocks', value: 38000, currency: 'USD', quantity: 80,   isCrypto: false, finageSymbol: 'MSFT' },
      { name: 'S&P 500 ETF',    ticker: 'SPY',  assetClass: 'stocks', value: 30000, currency: 'USD', quantity: 60,   isCrypto: false, finageSymbol: 'SPY' },
      { name: 'Bitcoin',        ticker: 'BTC',  assetClass: 'crypto', value: 18000, currency: 'USD', quantity: 0.25, isCrypto: true,  coinGeckoId: 'bitcoin' },
      { name: 'Treasury Bonds',               assetClass: 'bonds',  value: 25000, currency: 'USD' },
      { name: 'Cash',                         assetClass: 'cash',   value: 20000, currency: 'USD' },
    ],
  },
  {
    email: 'raymond@demo.com',
    name: 'Raymond Wong',
    role: 'client' as const,
    riskProfile: 'conservative',
    assets: [
      { name: 'Cash Savings',     assetClass: 'cash',   value: 120000, currency: 'USD' },
      { name: 'Fixed Deposits',   assetClass: 'cash',   value: 80000,  currency: 'USD' },
      { name: 'Government Bonds', assetClass: 'bonds',  value: 50000,  currency: 'USD' },
      { name: 'JPMorgan Chase', ticker: 'JPM', assetClass: 'stocks', value: 15000, currency: 'USD', quantity: 75, isCrypto: false, finageSymbol: 'JPM' },
      { name: 'Ethereum',       ticker: 'ETH', assetClass: 'crypto', value: 3000,  currency: 'USD', quantity: 1,  isCrypto: true, coinGeckoId: 'ethereum' },
    ],
  },
  {
    email: 'priya@demo.com',
    name: 'Priya Nair',
    role: 'client' as const,
    riskProfile: 'moderate',
    assets: [
      { name: 'REITs Portfolio',       assetClass: 'real_estate', value: 95000, currency: 'USD' },
      { name: 'Nasdaq 100 ETF', ticker: 'QQQ',  assetClass: 'stocks', value: 42000, currency: 'USD', quantity: 80,    isCrypto: false, finageSymbol: 'QQQ' },
      { name: 'Ethereum',       ticker: 'ETH',  assetClass: 'crypto', value: 22000, currency: 'USD', quantity: 7,     isCrypto: true,  coinGeckoId: 'ethereum' },
      { name: 'Polygon',        ticker: 'MATIC',assetClass: 'crypto', value: 8000,  currency: 'USD', quantity: 12000, isCrypto: true,  coinGeckoId: 'matic-network' },
      { name: 'Cash',                          assetClass: 'cash',   value: 18000, currency: 'USD' },
      { name: 'Private Equity Fund',           assetClass: 'private',value: 30000, currency: 'USD' },
    ],
  },
  {
    email: 'marcus@demo.com',
    name: 'Marcus Tan',
    role: 'client' as const,
    riskProfile: 'aggressive',
    assets: [
      { name: 'Startup Investment A', assetClass: 'private', value: 75000, currency: 'USD' },
      { name: 'Startup Investment B', assetClass: 'private', value: 45000, currency: 'USD' },
      { name: 'Bitcoin',  ticker: 'BTC',  assetClass: 'crypto', value: 55000, currency: 'USD', quantity: 0.78,   isCrypto: true, coinGeckoId: 'bitcoin' },
      { name: 'Dogecoin', ticker: 'DOGE', assetClass: 'crypto', value: 12000, currency: 'USD', quantity: 100000, isCrypto: true, coinGeckoId: 'dogecoin' },
      { name: 'NVIDIA',   ticker: 'NVDA', assetClass: 'stocks', value: 28000, currency: 'USD', quantity: 20,     isCrypto: false, finageSymbol: 'NVDA' },
      { name: 'Cash',                     assetClass: 'cash',   value: 8000,  currency: 'USD' },
    ],
  },
]

export async function GET() {
  const db = createAdminClient()
  const results: string[] = []

  try {
    // Step 1: Create adviser first so we have the adviser UUID for clients
    const adviserData = DEMO_USERS.find(u => u.role === 'adviser')!
    let adviserId: string

    const { data: existingAdviser } = await db
      .from('profiles')
      .select('id')
      .eq('email', adviserData.email)
      .single()

    if (existingAdviser) {
      adviserId = existingAdviser.id
      results.push(`Adviser already exists — skipping (id: ${adviserId})`)
    } else {
      const { data: authUser, error: authErr } = await db.auth.admin.createUser({
        email: adviserData.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: adviserData.name },
      })
      if (authErr) throw new Error(`Auth create adviser: ${authErr.message}`)

      adviserId = authUser.user.id

      const { error: profileErr } = await db.from('profiles').insert({
        id: adviserId,
        name: adviserData.name,
        email: adviserData.email,
        role: 'adviser',
      })
      if (profileErr) throw new Error(`Profile insert adviser: ${profileErr.message}`)
      results.push(`Created adviser: ${adviserData.email}`)
    }

    // Step 2: Create each client
    const clients = DEMO_USERS.filter(u => u.role === 'client') as typeof DEMO_USERS[number][]

    for (const client of clients) {
      const clientAssets = (client as { assets?: typeof DEMO_USERS[1]['assets'] }).assets ?? []

      const { data: existingClient } = await db
        .from('profiles')
        .select('id')
        .eq('email', client.email)
        .single()

      if (existingClient) {
        results.push(`Client already exists — skipping: ${client.email}`)
        continue
      }

      // Create auth user
      const { data: authUser, error: authErr } = await db.auth.admin.createUser({
        email: client.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: client.name },
      })
      if (authErr) throw new Error(`Auth create ${client.email}: ${authErr.message}`)

      const clientId = authUser.user.id
      const riskProfile = (client as { riskProfile?: string }).riskProfile ?? 'moderate'
      const totalValue = clientAssets.reduce((s, a) => s + a.value, 0)

      // Insert profile
      const { error: profileErr } = await db.from('profiles').insert({
        id: clientId,
        name: client.name,
        email: client.email,
        role: 'client',
        risk_profile: riskProfile,
        adviser_id: adviserId,
      })
      if (profileErr) throw new Error(`Profile insert ${client.email}: ${profileErr.message}`)

      // Insert portfolio
      const { data: portfolio, error: portfolioErr } = await db
        .from('portfolios')
        .insert({ client_id: clientId, total_value: totalValue })
        .select()
        .single()
      if (portfolioErr) throw new Error(`Portfolio insert ${client.email}: ${portfolioErr.message}`)

      // Insert assets
      if (clientAssets.length > 0) {
        const assetRows = clientAssets.map(a => ({
          portfolio_id: portfolio.id,
          name: a.name,
          ticker: (a as { ticker?: string }).ticker ?? null,
          asset_class: a.assetClass,
          value: a.value,
          currency: a.currency,
          quantity: (a as { quantity?: number }).quantity ?? null,
          is_crypto: (a as { isCrypto?: boolean }).isCrypto ?? false,
          coin_gecko_id: (a as { coinGeckoId?: string }).coinGeckoId ?? null,
          finage_symbol: (a as { finageSymbol?: string }).finageSymbol ?? null,
        }))

        const { error: assetsErr } = await db.from('assets').insert(assetRows)
        if (assetsErr) throw new Error(`Assets insert ${client.email}: ${assetsErr.message}`)
      }

      results.push(`Created client: ${client.email} — $${totalValue.toLocaleString()}`)
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Seed error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
