import { AssetClass, RiskProfile, Role, type Client, type Adviser } from '@/types'

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Alex Chen',
    email: 'alex@demo.com',
    password: 'demo123',
    role: Role.CLIENT,
    riskProfile: RiskProfile.AGGRESSIVE,
    portfolio: {
      assets: [
        { id: 'a1', name: 'Bitcoin', ticker: 'BTC', assetClass: AssetClass.CRYPTO, value: 85000, currency: 'USD', quantity: 1.2, isCrypto: true, coinGeckoId: 'bitcoin' },
        { id: 'a2', name: 'Ethereum', ticker: 'ETH', assetClass: AssetClass.CRYPTO, value: 24000, currency: 'USD', quantity: 8, isCrypto: true, coinGeckoId: 'ethereum' },
        { id: 'a3', name: 'Solana', ticker: 'SOL', assetClass: AssetClass.CRYPTO, value: 15000, currency: 'USD', quantity: 100, isCrypto: true, coinGeckoId: 'solana' },
        { id: 'a4', name: 'Tesla', ticker: 'TSLA', assetClass: AssetClass.STOCKS, value: 12000, currency: 'USD', quantity: 30 },
        { id: 'a5', name: 'Cash', assetClass: AssetClass.CASH, value: 5000, currency: 'USD' },
      ],
      totalValue: 141000,
      lastUpdated: new Date().toISOString(),
    },
    adviserId: 'adviser-1',
  },
  {
    id: 'client-2',
    name: 'Sarah Lim',
    email: 'sarah@demo.com',
    password: 'demo123',
    role: Role.CLIENT,
    riskProfile: RiskProfile.MODERATE,
    portfolio: {
      assets: [
        { id: 'b1', name: 'Apple', ticker: 'AAPL', assetClass: AssetClass.STOCKS, value: 45000, currency: 'USD', quantity: 200 },
        { id: 'b2', name: 'Microsoft', ticker: 'MSFT', assetClass: AssetClass.STOCKS, value: 38000, currency: 'USD', quantity: 80 },
        { id: 'b3', name: 'S&P 500 ETF', ticker: 'SPY', assetClass: AssetClass.STOCKS, value: 30000, currency: 'USD', quantity: 60 },
        { id: 'b4', name: 'Bitcoin', ticker: 'BTC', assetClass: AssetClass.CRYPTO, value: 18000, currency: 'USD', quantity: 0.25, isCrypto: true, coinGeckoId: 'bitcoin' },
        { id: 'b5', name: 'Treasury Bonds', assetClass: AssetClass.BONDS, value: 25000, currency: 'USD' },
        { id: 'b6', name: 'Cash', assetClass: AssetClass.CASH, value: 20000, currency: 'USD' },
      ],
      totalValue: 176000,
      lastUpdated: new Date().toISOString(),
    },
    adviserId: 'adviser-1',
  },
  {
    id: 'client-3',
    name: 'Raymond Wong',
    email: 'raymond@demo.com',
    password: 'demo123',
    role: Role.CLIENT,
    riskProfile: RiskProfile.CONSERVATIVE,
    portfolio: {
      assets: [
        { id: 'c1', name: 'Cash Savings', assetClass: AssetClass.CASH, value: 120000, currency: 'USD' },
        { id: 'c2', name: 'Fixed Deposits', assetClass: AssetClass.CASH, value: 80000, currency: 'USD' },
        { id: 'c3', name: 'Government Bonds', assetClass: AssetClass.BONDS, value: 50000, currency: 'USD' },
        { id: 'c4', name: 'Blue Chip Stocks', ticker: 'DBS.SI', assetClass: AssetClass.STOCKS, value: 15000, currency: 'USD', quantity: 500 },
        { id: 'c5', name: 'Ethereum', ticker: 'ETH', assetClass: AssetClass.CRYPTO, value: 3000, currency: 'USD', quantity: 1, isCrypto: true, coinGeckoId: 'ethereum' },
      ],
      totalValue: 268000,
      lastUpdated: new Date().toISOString(),
    },
    adviserId: 'adviser-1',
  },
  {
    id: 'client-4',
    name: 'Priya Nair',
    email: 'priya@demo.com',
    password: 'demo123',
    role: Role.CLIENT,
    riskProfile: RiskProfile.MODERATE,
    portfolio: {
      assets: [
        { id: 'd1', name: 'REITs Portfolio', assetClass: AssetClass.REAL_ESTATE, value: 95000, currency: 'USD' },
        { id: 'd2', name: 'Tech Stocks', ticker: 'QQQ', assetClass: AssetClass.STOCKS, value: 42000, currency: 'USD', quantity: 80 },
        { id: 'd3', name: 'Ethereum', ticker: 'ETH', assetClass: AssetClass.CRYPTO, value: 22000, currency: 'USD', quantity: 7, isCrypto: true, coinGeckoId: 'ethereum' },
        { id: 'd4', name: 'Polygon', ticker: 'MATIC', assetClass: AssetClass.CRYPTO, value: 8000, currency: 'USD', quantity: 12000, isCrypto: true, coinGeckoId: 'matic-network' },
        { id: 'd5', name: 'Cash', assetClass: AssetClass.CASH, value: 18000, currency: 'USD' },
        { id: 'd6', name: 'Private Equity Fund', assetClass: AssetClass.PRIVATE, value: 30000, currency: 'USD' },
      ],
      totalValue: 215000,
      lastUpdated: new Date().toISOString(),
    },
    adviserId: 'adviser-1',
  },
  {
    id: 'client-5',
    name: 'Marcus Tan',
    email: 'marcus@demo.com',
    password: 'demo123',
    role: Role.CLIENT,
    riskProfile: RiskProfile.AGGRESSIVE,
    portfolio: {
      assets: [
        { id: 'e1', name: 'Startup Investment A', assetClass: AssetClass.PRIVATE, value: 75000, currency: 'USD' },
        { id: 'e2', name: 'Startup Investment B', assetClass: AssetClass.PRIVATE, value: 45000, currency: 'USD' },
        { id: 'e3', name: 'Bitcoin', ticker: 'BTC', assetClass: AssetClass.CRYPTO, value: 55000, currency: 'USD', quantity: 0.78, isCrypto: true, coinGeckoId: 'bitcoin' },
        { id: 'e4', name: 'Dogecoin', ticker: 'DOGE', assetClass: AssetClass.CRYPTO, value: 12000, currency: 'USD', quantity: 100000, isCrypto: true, coinGeckoId: 'dogecoin' },
        { id: 'e5', name: 'NVIDIA', ticker: 'NVDA', assetClass: AssetClass.STOCKS, value: 28000, currency: 'USD', quantity: 20 },
        { id: 'e6', name: 'Cash', assetClass: AssetClass.CASH, value: 8000, currency: 'USD' },
      ],
      totalValue: 223000,
      lastUpdated: new Date().toISOString(),
    },
    adviserId: 'adviser-1',
  },
]

export const mockAdviser: Adviser = {
  id: 'adviser-1',
  name: 'David Koh',
  email: 'adviser@demo.com',
  password: 'demo123',
  role: Role.ADVISER,
  clientIds: ['client-1', 'client-2', 'client-3', 'client-4', 'client-5'],
}

export function getClientById(id: string): Client | undefined {
  return mockClients.find(c => c.id === id)
}

export function getClientsByAdviserId(adviserId: string): Client[] {
  return mockClients.filter(c => c.adviserId === adviserId)
}

export function getUserByEmail(email: string): Client | Adviser | undefined {
  if (mockAdviser.email === email) return mockAdviser
  return mockClients.find(c => c.email === email)
}

export function authenticateUser(email: string, password: string): Client | Adviser | null {
  const user = getUserByEmail(email)
  if (user && user.password === password) return user
  return null
}
