# PRD — Huat: Wealth Wellness Hub
**NTU FinTech Innovators Hackathon 2026 — Problem Statement #1**
**Deadline:** March 11, 2026, 9:00 AM (Seeding Round)

---

## 1. Executive Summary

**Product Name:** Huat (derived from the Hokkien word for "prosper")

**Problem Statement:** Retail investors and their advisers lack a unified view of traditional and digital assets. Siloed platforms make it impossible to assess holistic financial health, spot behavioral misalignments, or receive timely, personalized guidance.

**Solution:** Huat is an integrated wealth wellness hub that:
- Unifies stocks, crypto, bonds, real estate, private equity, and cash in one dashboard
- Computes a multi-dimensional **Wellness Score** using diversification, liquidity, and behavioral alignment metrics
- Delivers **AI-powered recommendations** via Claude claude-sonnet-4-6 tailored to each client's exact portfolio
- Provides advisers with a portfolio-level command center to monitor all clients at a glance

**Target Users:** Retail investors (clients) and their wealth advisers.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Demonstrate unified asset view | All 6 asset classes displayed correctly per client |
| Wellness scoring works end-to-end | Score computed and labeled for all 5 mock clients |
| Claude integration functional | AI recommendations load within 10s; fallback fires on error |
| Adviser dashboard operational | All 5 clients visible with correct scores and allocation data |
| Live price integration | Crypto prices update from CoinGecko; stocks from Finage or fallback |
| Clean, demo-ready UI | No broken layouts; dark theme renders correctly on 1080p+ screens |

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS (dark theme, custom palette) |
| Animations | Framer Motion |
| Charts | Recharts (RadarChart, PieChart, BarChart) |
| AI | Claude claude-sonnet-4-6 via `@anthropic-ai/sdk` (server-side only) |
| Crypto Prices | CoinGecko free API (proxied, `revalidate: 60`) |
| Stock Prices | Finage API (`revalidate: 60`; falls back to hardcoded prices) |
| Auth | Mock — sessionStorage only, no database |
| Deployment | Vercel |
| Containerization | Docker + docker-compose (optional local dev) |

---

## 4. User Personas

### Adviser — David Koh
- **Email:** adviser@demo.com | **Password:** demo123
- **Role:** Wealth adviser managing 5 clients
- **Needs:** Bird's-eye view of all client portfolios, wellness scores, and risk flags
- **Route:** `/adviser`

### Client 1 — Alex Chen
- **Email:** alex@demo.com | **Password:** demo123
- **Risk Profile:** Aggressive
- **Portfolio (total: $141,000):**
  - Bitcoin (BTC) — $85,000 (60.3%) — crypto
  - Ethereum (ETH) — $24,000 (17%) — crypto
  - Solana (SOL) — $15,000 (10.6%) — crypto
  - Tesla (TSLA) — $12,000 (8.5%) — stocks
  - Cash — $5,000 (3.5%)
- **Characteristic:** Crypto-heavy, minimal diversification

### Client 2 — Sarah Lim
- **Email:** sarah@demo.com | **Password:** demo123
- **Risk Profile:** Moderate
- **Portfolio (total: $176,000):**
  - Apple (AAPL) — $45,000 (25.6%) — stocks
  - Microsoft (MSFT) — $38,000 (21.6%) — stocks
  - S&P 500 ETF (SPY) — $30,000 (17%) — stocks
  - Treasury Bonds — $25,000 (14.2%) — bonds
  - Cash — $20,000 (11.4%)
  - Bitcoin (BTC) — $18,000 (10.2%) — crypto
- **Characteristic:** Well-balanced, textbook moderate allocation

### Client 3 — Raymond Wong
- **Email:** raymond@demo.com | **Password:** demo123
- **Risk Profile:** Conservative
- **Portfolio (total: $268,000):**
  - Cash Savings — $120,000 (44.8%) — cash
  - Fixed Deposits — $80,000 (29.9%) — cash
  - Government Bonds — $50,000 (18.7%) — bonds
  - JPMorgan Chase (JPM) — $15,000 (5.6%) — stocks
  - Ethereum (ETH) — $3,000 (1.1%) — crypto
- **Characteristic:** Cash-heavy, low-risk, large portfolio

### Client 4 — Priya Nair
- **Email:** priya@demo.com | **Password:** demo123
- **Risk Profile:** Moderate
- **Portfolio (total: $215,000):**
  - REITs Portfolio — $95,000 (44.2%) — real estate
  - Nasdaq 100 ETF (QQQ) — $42,000 (19.5%) — stocks
  - Ethereum (ETH) — $22,000 (10.2%) — crypto
  - Private Equity Fund — $30,000 (14%) — private
  - Cash — $18,000 (8.4%)
  - Polygon (MATIC) — $8,000 (3.7%) — crypto
- **Characteristic:** Real estate focused, diverse alternative assets

### Client 5 — Marcus Tan
- **Email:** marcus@demo.com | **Password:** demo123
- **Risk Profile:** Aggressive
- **Portfolio (total: $223,000):**
  - Startup Investment A — $75,000 (33.6%) — private
  - Bitcoin (BTC) — $55,000 (24.7%) — crypto
  - Startup Investment B — $45,000 (20.2%) — private
  - NVIDIA (NVDA) — $28,000 (12.6%) — stocks
  - Dogecoin (DOGE) — $12,000 (5.4%) — crypto
  - Cash — $8,000 (3.6%)
- **Characteristic:** Illiquid-heavy (startups + crypto), minimal cash buffer

---

## 5. Pages & Routes

| Route | Component | Auth Required | Role |
|-------|-----------|---------------|------|
| `/` | `app/page.tsx` | No | Public landing page |
| `/auth/login` | `app/auth/login/page.tsx` | No | Login form |
| `/auth/signup` | `app/auth/signup/page.tsx` | No | Signup (mock) |
| `/client/[id]` | `app/client/[id]/page.tsx` + `ClientView.tsx` | Yes (client matching `id` OR adviser) | Client dashboard |
| `/adviser` | `app/adviser/page.tsx` | Yes (adviser role only) | Adviser dashboard |

### Auth Behavior
- Login stores user object in `sessionStorage` as `huat_user`
- `AuthContext` (`components/layout/AuthContext.tsx`) provides `useAuth()` hook
- `ClientView.tsx` enforces that logged-in user matches the client ID (or is an adviser)
- Unauthenticated users are redirected to `/auth/login`

---

## 6. Feature Deep-Dives

### 6.1 Authentication System

**Implementation:** Mock auth with sessionStorage persistence.

- `lib/mock-data.ts` → `authenticateUser(email, password)` checks against hardcoded user list
- On successful login, full user object (minus password ideally) is stored to `sessionStorage`
- `AuthContext` reads from sessionStorage on mount; `logout()` clears it and redirects to `/`
- No JWT, no cookies, no database — suitable for hackathon demo

### 6.2 Landing Page (`/`)

- Hero section with "Huat" branding, tagline, and CTA buttons (Login / Get Started)
- Feature highlights: unified assets, wellness scoring, AI recommendations
- Scroll animations via Framer Motion (`ScrollAnimations.tsx`)
- Navbar with conditional auth state display

### 6.3 Client Dashboard (`/client/[id]`)

**Server Component** (`page.tsx`):
- Fetches live crypto prices from `/api/crypto`
- Fetches live stock prices from `/api/stocks`
- Passes `livePrices` prop to `ClientView`

**Client Component** (`ClientView.tsx`):
- Applies live prices to portfolio assets (updates `value` based on live price × quantity)
- Recalculates `totalValue` after price updates
- Computes `WellnessScore` via `calculateWellnessScore(portfolio, riskProfile)`
- Renders four main panels:

| Panel | Component | Description |
|-------|-----------|-------------|
| Wealth Wallet | `WealthWallet.tsx` | Asset list, live prices, total value, asset class donut chart |
| Wellness Scorecard | `WellnessScorecard.tsx` | Overall score gauge, label badge, radar chart of sub-scores |
| Score Breakdown | `ScoreBreakdown.tsx` | Per-dimension bars (Diversification, Liquidity, Behavioral) |
| AI Recommendations | `AIRecommendations.tsx` | Claude-powered cards, loads asynchronously via `useEffect` |

### 6.4 Adviser Dashboard (`/adviser`)

- **Auth guard:** Redirects non-advisers away
- **SummaryStats** (`components/adviser/SummaryStats.tsx`): Aggregate stats across all clients
  - Total AUM, average wellness score, count of clients by risk profile
- **ClientTable** (`components/adviser/ClientTable.tsx`): Tabular view of all clients
  - Columns: Name, Risk Profile, Portfolio Value, Wellness Score, Score Label, Asset Allocation bar
  - Clicking a row navigates to `/client/[id]` (adviser can view any client)

---

## 7. Wellness Score Formula

### Overview
The Wellness Score is a composite 0–100 score computed from three dimensions:

```
Overall = (Diversification × 0.40) + (Liquidity × 0.35) + (Behavioral × 0.25)
```

### 7.1 Diversification Score (40% weight)

Uses the **Herfindahl-Hirschman Index (HHI)** applied to asset class weights:

```
HHI = Σ (value_class_i / total_value)²

minHHI = 1 / number_of_asset_classes
normalizedHHI = (HHI - minHHI) / (1 - minHHI + 0.0001)
diversificationScore = round((1 - normalizedHHI) × 100)
```

- HHI of 1.0 = fully concentrated (single asset class) → score approaches 0
- HHI of 1/n = perfectly spread → score approaches 100
- A portfolio split equally across 6 asset classes scores ~100

### 7.2 Liquidity Score (35% weight)

Liquid asset classes: `CASH`, `STOCKS`, `CRYPTO`, `BONDS`
Illiquid classes: `REAL_ESTATE`, `PRIVATE`

| Liquid Ratio | Score |
|--------------|-------|
| ≥ 90% | 95 |
| ≥ 70% | 80 |
| ≥ 50% | 65 |
| ≥ 30% | 45 |
| ≥ 20% | 30 |
| < 20% | 15 |

### 7.3 Behavioral Alignment Score (25% weight)

Baseline score: **70**. Adjustments based on risk profile vs actual allocation:

**Conservative profile:**
- Crypto > 30% → −30
- Crypto 15–30% → −15
- Private > 20% → −15
- Crypto < 5% AND Private < 10% → +20

**Moderate profile:**
- Crypto > 50% → −20
- Crypto 30–50% → −10
- Crypto 10–25% → +10
- Private > 40% → −10

**Aggressive profile:**
- Crypto > 70% → −15
- Crypto 30–60% → +15
- Private 20–50% → +10

Range clamped: `[10, 100]`

### 7.4 Scoring Labels

| Score Range | Label |
|-------------|-------|
| 85–100 | Excellent |
| 70–84 | Good |
| 50–69 | Fair |
| 30–49 | Poor |
| 0–29 | Critical |

---

## 8. AI Integration

### Flow
1. Client dashboard renders; `AIRecommendations.tsx` fires a `POST /api/recommendations` request via `useEffect` (non-blocking)
2. API route (`app/api/recommendations/route.ts`) calls `getRecommendations()` from `lib/claude.ts`
3. `lib/claude.ts` constructs a structured prompt and calls `claude-sonnet-4-6` via Anthropic SDK
4. Response is parsed as JSON; on any error, `FALLBACK_RECOMMENDATIONS` is returned

### Prompt Structure
```
You are a professional wealth management adviser. Analyze this client portfolio and provide actionable recommendations.

Client Risk Profile: {riskProfile}
Total Portfolio Value: ${totalValue}
Wellness Score: {overall}/100 ({label})
- Diversification: {diversification}/100
- Liquidity: {liquidity}/100
- Behavioral Alignment: {behavioral}/100

Portfolio Breakdown:
[{name, class, value, percentage}, ...]

{optional scenario/question}

Respond with ONLY valid JSON in this exact format:
{
  "recommendations": [{title, description, priority, category}],
  "summary": "...",
  "marketContext": "..."
}
```

### Model Config
- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 1024
- **Temperature:** default

### Fallback Recommendations
Hardcoded in `lib/claude.ts` as `FALLBACK_RECOMMENDATIONS`. Fires when:
- `ANTHROPIC_API_KEY` is missing
- Claude API call throws any error
- JSON parsing fails

Fallback contains 3 generic recommendations: diversification review, liquidity check, risk alignment.

---

## 9. Data Models

### Enums

```typescript
enum AssetClass {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  CASH = 'cash',
  PRIVATE = 'private',
  BONDS = 'bonds',
  REAL_ESTATE = 'real_estate',
}

enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

enum Role {
  ADVISER = 'adviser',
  CLIENT = 'client',
}
```

### Core Interfaces

```typescript
interface Asset {
  id: string
  name: string
  ticker?: string
  assetClass: AssetClass
  value: number
  currency: string
  quantity?: number
  purchasePrice?: number
  isCrypto?: boolean
  coinGeckoId?: string    // used to fetch live price from CoinGecko
  finageSymbol?: string   // used to fetch live price from Finage
}

interface Portfolio {
  assets: Asset[]
  totalValue: number
  lastUpdated: string
}

interface WellnessScore {
  overall: number
  diversification: number
  liquidity: number
  behavioral: number
  label: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent'
}

interface Client {
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

interface Adviser {
  id: string
  name: string
  email: string
  password: string
  role: Role.ADVISER
  clientIds: string[]
}

type User = Client | Adviser
```

### AI Request/Response

```typescript
interface RecommendationRequest {
  clientId: string
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
  scenario?: string           // optional free-text client question
}

interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'diversification' | 'liquidity' | 'risk' | 'opportunity'
}

interface RecommendationResponse {
  recommendations: Recommendation[]
  summary: string
  marketContext: string
}
```

---

## 10. API Endpoints

### `GET /api/crypto`

Fetches live USD prices for tracked cryptocurrencies from CoinGecko.

**Tracked coins:** `bitcoin`, `ethereum`, `solana`, `matic-network`, `dogecoin`

**Response:**
```json
{
  "bitcoin": { "usd": 68000 },
  "ethereum": { "usd": 3200 },
  "solana": { "usd": 150 },
  "matic-network": { "usd": 0.65 },
  "dogecoin": { "usd": 0.12 }
}
```

**Caching:** `next: { revalidate: 60 }` — refreshes at most once per minute.
**Fallback:** Returns hardcoded prices if CoinGecko call fails.

---

### `GET /api/stocks?symbols=AAPL,MSFT,...`

Fetches live stock prices from Finage API.

**Query params:**
- `symbols` (optional) — comma-separated ticker list. Default: `AAPL,MSFT,TSLA,NVDA,SPY,QQQ,JPM`

**Response:**
```json
{
  "AAPL": 213,
  "MSFT": 415,
  "TSLA": 175,
  "NVDA": 875,
  "SPY": 530,
  "QQQ": 455,
  "JPM": 205
}
```

**Caching:** `next: { revalidate: 60 }`
**Fallback:** Returns hardcoded prices if `FINAGE_API_KEY` is not set or Finage returns an error.

---

### `POST /api/recommendations`

Calls Claude to generate personalized portfolio recommendations.

**Request body:** `RecommendationRequest`
```json
{
  "clientId": "client-1",
  "portfolio": { "assets": [...], "totalValue": 141000, "lastUpdated": "..." },
  "wellnessScore": { "overall": 42, "diversification": 20, "liquidity": 80, "behavioral": 55, "label": "Poor" },
  "riskProfile": "aggressive",
  "scenario": "I want to reduce volatility"
}
```

**Response:** `RecommendationResponse`
```json
{
  "recommendations": [
    {
      "title": "Reduce Crypto Concentration",
      "description": "...",
      "priority": "high",
      "category": "diversification"
    }
  ],
  "summary": "Your portfolio is heavily concentrated in volatile assets.",
  "marketContext": "Current crypto market volatility underscores the need for diversification."
}
```

**Error response (500):**
```json
{ "error": "Failed to get recommendations" }
```

---

## 11. Live Price Integration

### CoinGecko (Crypto)

- **Endpoint:** `https://api.coingecko.com/api/v3/simple/price?ids=...&vs_currencies=usd`
- **Auth:** None required (free tier)
- **Rate limit:** ~30 calls/min on free tier — mitigated by `revalidate: 60`
- **Assets covered:** BTC, ETH, SOL, MATIC, DOGE

### Finage (Stocks)

- **Endpoint:** `https://api.finage.co.uk/last/stock/multi-quote?apikey=...&symbols=...`
- **Auth:** `FINAGE_API_KEY` environment variable
- **Response format:** Array of `{ s: symbol, p: price, t: timestamp }` (or object — both handled)
- **Assets covered:** AAPL, MSFT, TSLA, NVDA, SPY, QQQ, JPM
- **Fallback:** Hardcoded prices in `route.ts` for all 7 symbols

### Price Application (ClientView)

On load, `ClientView.tsx` iterates portfolio assets:
- If `isCrypto && coinGeckoId` → update `value = quantity × livePrice[coinGeckoId].usd`
- If `finageSymbol` → update `value = quantity × livePrice[finageSymbol]`
- Recomputes `totalValue` from sum of updated asset values
- Recomputes Wellness Score with live-price-adjusted portfolio

---

## 12. Component Inventory

### Pages
| File | Type | Description |
|------|------|-------------|
| `app/page.tsx` | Server | Landing page |
| `app/auth/login/page.tsx` | Client | Login form |
| `app/auth/signup/page.tsx` | Client | Signup (mock) |
| `app/adviser/page.tsx` | Client | Adviser dashboard |
| `app/client/[id]/page.tsx` | Server | Fetches live prices, renders ClientView |
| `app/client/[id]/ClientView.tsx` | Client | Full client dashboard with auth guard |

### Layout
| File | Description |
|------|-------------|
| `components/layout/Navbar.tsx` | Top nav bar with auth state |
| `components/layout/AuthContext.tsx` | Context + `useAuth()` hook |
| `components/layout/ScrollAnimations.tsx` | Framer Motion scroll wrappers |

### Client Dashboard Panels
| File | Description |
|------|-------------|
| `components/WealthWallet.tsx` | Asset list + total value + allocation donut |
| `components/wellness/WellnessScorecard.tsx` | Score gauge + label + radar chart |
| `components/wellness/ScoreBreakdown.tsx` | Per-dimension score bars |
| `components/AIRecommendations.tsx` | AI recommendation cards (async) |

### Adviser Dashboard
| File | Description |
|------|-------------|
| `components/adviser/SummaryStats.tsx` | AUM, avg score, client counts |
| `components/adviser/ClientTable.tsx` | Sortable client list |

### Charts
| File | Description |
|------|-------------|
| `components/charts/AssetDonut.tsx` | Recharts PieChart for asset class breakdown |
| `components/charts/AssetBarChart.tsx` | Recharts BarChart for allocation comparison |
| `components/charts/WellnessRadar.tsx` | Recharts RadarChart for score dimensions |

### UI Primitives
| File | Description |
|------|-------------|
| `components/ui/GlassCard.tsx` | Glassmorphism card wrapper |
| `components/ui/AnimatedCounter.tsx` | Framer Motion number counter |
| `components/ui/LoadingSpinner.tsx` | Loading indicator |
| `components/ui/Badge.tsx` | Score label badge (color-coded) |
| `components/ui/Button.tsx` | Styled button component |
| `components/ui/ScoreGauge.tsx` | SVG arc gauge for overall score |

### Lib / Utilities
| File | Description |
|------|-------------|
| `lib/claude.ts` | SERVER-ONLY Anthropic wrapper + prompt builder |
| `lib/mock-data.ts` | All mock users; auth helpers |
| `lib/wellness.ts` | HHI scoring, liquidity, behavioral, label functions |
| `lib/utils.ts` | General utility functions (cn, formatters) |
| `types/index.ts` | All TypeScript interfaces and enums |

---

## 13. Design System

### Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#0a0a0f` | Page background |
| Surface | `#12121a` | Card backgrounds |
| Gold (primary) | `#d4af37` / `gold-400` | Accents, score highlights, CTAs |
| Emerald (secondary) | `#10b981` / `emerald-500` | Positive indicators, good scores |
| Amber (warning) | `#f59e0b` | Fair scores, moderate risk |
| Red (danger) | `#ef4444` | Poor/Critical scores, high risk |
| Text primary | `#f1f5f9` | Headings, primary content |
| Text muted | `#64748b` | Labels, secondary content |

### Typography
- Font: System sans-serif stack (Tailwind default)
- Headings: `text-2xl`–`text-4xl`, `font-bold`, white
- Labels: `text-sm`, muted gray
- Numbers/scores: Larger, often gold-colored

### Design Principles
- **Dark theme throughout** — no light mode
- **No emojis** — text and icons only
- **Glassmorphism** — `backdrop-blur`, semi-transparent backgrounds on cards
- **Framer Motion** — entrance animations on scroll, counter animations
- **Responsive** — designed for desktop-first, functional on tablet

---

## 14. Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude recommendations |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `FINAGE_API_KEY` | _(none)_ | Finage API key for live stock prices. Falls back to hardcoded prices if absent. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL for the app (used in absolute URL references) |

### Setup

Create `.env.local` in the project root:
```env
ANTHROPIC_API_KEY=sk-ant-...
FINAGE_API_KEY=API_KEY...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Vercel deployment, add these as Environment Variables in the project settings.

---

## 15. Deployment

### Local Development

```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

### Docker (Optional)

```bash
docker-compose up --build
# App runs at http://localhost:3000
```

### Vercel (Production Target)

1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `FINAGE_API_KEY` (optional)
   - `NEXT_PUBLIC_APP_URL` = your Vercel deployment URL
4. Deploy — Next.js is auto-detected

### Build Verification

```bash
npm run build   # Must pass with 0 errors
npm run lint    # No blocking lint errors
```

Known TypeScript notes:
- Recharts `Tooltip` formatter callbacks: use `Number(value)` cast pattern
- `lib/claude.ts` must never be imported in client components (will break build)

---

## 16. Key Architectural Constraints

1. **`lib/claude.ts` is SERVER-ONLY** — importing it in any `'use client'` component will expose the API key and break the build.
2. **CoinGecko rate limiting** — free tier is ~30 req/min. The `revalidate: 60` on the proxy route ensures the API is called at most once per minute across all users.
3. **AI recommendations are non-blocking** — `AIRecommendations.tsx` uses `useEffect` to fire after initial render so the rest of the dashboard loads immediately.
4. **No real database** — all data is in-memory via `lib/mock-data.ts`. Refreshing the page re-hydrates from mock data; any "edits" during a session are not persisted.
5. **Auth is purely client-side** — sessionStorage can be cleared by the user. There is no server-side session or token validation.
