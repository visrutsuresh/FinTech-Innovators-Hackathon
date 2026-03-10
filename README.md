# Huat — Wealth Wellness Hub

> **NTU FinTech Innovators Hackathon 2026 · Problem Statement #1**

Huat is an integrated financial wellness platform that unifies a client's traditional and digital assets into a single dashboard, computes a composite **Wellness Score** using portfolio theory and behavioural finance principles, and delivers real-time AI-powered recommendations via Claude. Built for both retail investors and their wealth advisers.

---

## Live Demo

**Deployment:** [https://huat.vercel.app](https://fin-tech-innovators-hackathon-gny2.vercel.app/)) 

All demo accounts share password: `demo123`

| Email | Role | Portfolio Profile | AUM |
|---|---|---|---|
| adviser@demo.com | Adviser | — | Manages all 5 clients |
| alex@demo.com | Client | Aggressive | ~$141K — BTC/ETH/SOL heavy |
| sarah@demo.com | Client | Moderate | ~$176K — AAPL, MSFT, SPY balanced |
| raymond@demo.com | Client | Conservative | ~$268K — Cash + bonds heavy |
| priya@demo.com | Client | Moderate | ~$215K — REITs + QQQ + crypto |
| marcus@demo.com | Client | Aggressive | ~$223K — Startup equity + BTC |

**Total tracked AUM: ~$1.02M**

---

## Features

### Client Dashboard

**Wealth Wallet**
- Unified view of all asset classes: Stocks, Crypto, Real Estate, Bonds, Cash, Private Equity
- Live price feeds for equities (Finage API) and crypto (CoinGecko), auto-refreshed every 60 seconds
- Donut chart (allocation by asset class) and bar chart (class breakdown by value)
- Add / edit / remove individual positions — stocks and crypto auto-fetch current price on ticker entry
- Privacy mode: clients can hide portfolio amounts from their adviser with a single toggle

**Wellness Score Card**
- Composite score (0–100) computed in real time from three weighted dimensions
- Colour-coded label: Excellent (85+) / Good (70+) / Fair (50+) / Poor (30+) / Critical (<30)
- Score breakdown panel explaining the methodology behind each sub-score
- Animated progress bars on load; radar chart showing all three dimensions simultaneously

**AI Adviser Chat (Claude)**
- Slide-out panel accessible from any page via the sparkle icon in the navbar (or ⌘L)
- Multi-turn conversation: full history sent with every request for genuine context continuity
- Dual response mode: structured recommendation cards for portfolio questions; plain text for general queries
- Session tabs: past conversations stored in Supabase and loadable as read-only history
- Zero overhead on page load — panel fires only when opened

**Advanced Analytics**
- **Black Swan Scenario Tester** — see the impact of four historical or hypothetical crises on your portfolio and wellness score
- **Flash Liquidity & Stress Test** — tiered liquidation analysis across T+0, T+2, and T+30 time horizons
- **Legacy & Inheritance Readiness** — five-point estate planning checklist with a completion "Legacy Score"

**Onboarding & Risk Profiling**
- Multi-step signup with a five-question risk questionnaire (scored 5–15)
- Investor archetype reveal: Vault Guardian (Conservative), Balanced Pathfinder (Moderate), or Quantum Maverick (Aggressive)
- Archetype shown as a persistent badge on the dashboard header
- Real-time username availability check during registration

### Adviser Dashboard

- **AUM overview** — total assets under management across all connected clients
- **Average wellness score** and count of low-wellness alerts (clients scoring below 50)
- **Client roster table** — name, email, risk profile badge, AUM, and animated wellness score arc per client
- Click-through to any client's full dashboard (with privacy masking respected)
- Direct messaging with individual clients via Supabase Realtime

### Profile & Connections

- Search for advisers by username and send connection requests
- Nominate next-of-kin (NOK): search users, nominate, accept or reject nominations
- Real-time direct messaging thread between adviser and client

---

## Analysis Methods

### Wellness Score

The Wellness Score is a composite metric (0–100) combining three dimensions of financial health, each grounded in established portfolio theory:

```
Wellness Score = (Diversification × 0.40) + (Liquidity × 0.35) + (Behavioural Alignment × 0.25)
```

---

#### 1. Diversification Score (40% weight)

Measures how well a portfolio avoids concentration risk using the **Herfindahl-Hirschman Index (HHI)** — the same metric used by regulators to assess market concentration.

**Calculation:**
1. Group all assets by class (Stocks, Crypto, Real Estate, Bonds, Cash, Private Equity)
2. Compute the weight of each class as a fraction of total portfolio value
3. Sum the squared weights: `HHI = Σ(weight_i²)`
4. Normalize to a 0–100 score:

```
diversificationScore = (1 - HHI) / (1 - 1/n) × 100
```

where `n` is the number of asset classes present. A portfolio with a single asset class scores **0**; a portfolio perfectly spread across all six classes scores close to **100**.

**Why HHI?** Unlike simple asset-count metrics, HHI penalises large imbalances — a 95%/5% split is treated very differently from a 50%/50% split, matching how institutional risk managers think about concentration.

---

#### 2. Liquidity Score (35% weight)

Measures how quickly a portfolio can be converted to cash in a crisis.

**Liquid asset classes:** Cash, Stocks, Bonds, Crypto *(highly marketable)*
**Illiquid asset classes:** Real Estate, Private Equity *(days to months to liquidate)*

**Calculation:**
```
liquidityRatio = liquidAssets / totalPortfolioValue
```

Tiered scoring (reflecting real-world market dynamics):

| Liquidity Ratio | Score |
|---|---|
| ≥ 90% | 95 |
| ≥ 70% | 80 |
| ≥ 50% | 65 |
| ≥ 30% | 45 |
| ≥ 20% | 30 |
| < 20% | 15 |

**Why tiered, not linear?** Liquidity is non-linear in practice — moving from 20% to 30% liquid is far more impactful than moving from 70% to 80%. The tier thresholds reflect typical institutional minimum liquidity buffers.

---

#### 3. Behavioural Alignment Score (25% weight)

Measures whether a portfolio's actual composition matches the investor's stated risk appetite. This catches a common real-world problem: a client who *says* they are conservative but *holds* 40% in speculative crypto.

**Calculation:**
Base score starts at **70**, then adjusts up or down based on crypto ratio and private equity ratio vs. the declared risk profile:

| Profile | Rewarded for | Penalised for |
|---|---|---|
| Conservative | < 5% crypto, < 10% PE | > 30% crypto, > 20% PE |
| Moderate | 10–25% crypto | > 50% crypto |
| Aggressive | 30–60% crypto, 20–50% PE | > 70% crypto |

Final score is clamped to the range **10–100**.

**Why not enforce limits?** The score does not force clients to rebalance — it surfaces misalignment as a signal for the adviser or the AI to address, preserving client autonomy while creating a measurable health indicator.

---

#### Score Stability

All intermediate values are rounded to 2–3 decimal places before aggregation. This prevents sub-1% price movements from causing spurious score changes — the same portfolio composition always produces the same score regardless of minor price drift.

---

### Black Swan Scenario Tester

Applies historical asset-class multipliers to the current portfolio to model extreme market events:

| Scenario | Stocks | Crypto | Real Estate | Bonds | Cash | Private Equity |
|---|---|---|---|---|---|---|
| 2008 Financial Crisis | -55% | n/a | -30% | +15% | 0% | -60% |
| 2020 COVID Crash | -34% | -50% | -10% | +10% | 0% | -40% |
| Crypto Winter | -10% | -80% | -5% | +5% | 0% | -20% |
| Hyperinflation | -20% | +50% | +30% | -40% | -30% | +10% |

After applying multipliers, the Wellness Score is **recomputed in full** — not approximated — giving a before/after score comparison alongside a narrative impact explanation.

---

### Flash Liquidity & Stress Test

Models how much of a portfolio can be liquidated within different time horizons, and whether a target withdrawal amount can be met:

| Tier | Horizon | Included Asset Classes |
|---|---|---|
| T+0 | 0–24 hours | Cash only |
| T+2 | 2–3 business days | Cash + Stocks + Bonds + major Crypto |
| T+30 | 30+ days | All asset classes (including Real Estate + Private Equity) |

The feature accepts a target withdrawal amount and outputs a **Pass / Fail** result with shortfall breakdown and a bar chart of cumulative liquidity by tier.

---

### Legacy & Inheritance Readiness

A five-point estate planning checklist scored as a "Legacy Score" (0–100%):

1. Will / Testament in place
2. Nominees assigned to all accounts
3. Digital vault for credentials established
4. Life insurance coverage reviewed
5. Power of Attorney set up

Completion state is persisted per user in Supabase.

---

## AI Integration

Huat integrates **Claude claude-sonnet-4-6** as an in-app financial adviser via Anthropic's SDK.

### Architecture
- `lib/claude.ts` is **server-side only** — never imported in client components
- All AI calls are routed through `POST /api/recommendations`
- The chat panel fires **zero** API requests until the user opens it, keeping initial page load fast

### Multi-turn Conversation
- Full conversation history is sent with every request (not just the latest message)
- History is loaded from Supabase `chat_messages` when the panel opens
- Each session is identified by a UUID; new sessions are created fresh by default
- Past sessions are shown as read-only tabs in the panel

### Dual Response Mode
The system prompt instructs Claude to detect the query type and respond accordingly:

- **Portfolio questions** → structured JSON with recommendation cards (title, description, priority: High/Medium/Low, category: Diversification/Liquidity/Risk/Opportunity)
- **General questions** (maths, trivia, casual chat) → plain text answer

This means the UI renders rich interactive cards for financial advice while still handling off-topic questions gracefully.

### Prompt Design
Each request includes:
- The client's full portfolio with asset breakdown
- Current Wellness Score and all three sub-scores
- Declared risk profile and investor archetype
- Full prior conversation history
- Instruction to return valid JSON only (no markdown)

### Resilience
- Full `try/catch` wrapping around JSON parse
- Hardcoded `FALLBACK_RECOMMENDATIONS` returned if the API is unavailable, so the UI never shows an error state

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 (dark theme, gold/emerald palette) |
| Animations | Framer Motion 12 |
| Charts | Recharts 3 |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Anthropic Claude claude-sonnet-4-6 via @anthropic-ai/sdk |
| Crypto Prices | CoinGecko free API (60s server-side cache) |
| Stock Prices | Finage API (60s server-side cache, fallback prices) |
| Deployment | Vercel |

---

## Architecture Highlights

**Server-only AI calls** — Claude is never called from the browser. All inference goes through a Next.js API route, keeping the API key secure and enabling server-side prompt construction with full portfolio context.

**Non-blocking AI panel** — The chat panel does not block page render. It fires its first request only after the user opens it, keeping initial page load fast.

**Parallel auth fetches** — On login, three Supabase queries fire in parallel (profile, portfolio + assets, adviser clients) rather than sequentially, eliminating round-trip latency.

**Privacy-aware adviser queries** — The adviser roster first attempts a query including the `hide_amounts_from_adviser` column. If the column is absent (older schema), it automatically retries without it — backwards compatible without a migration flag.

**Session-based logout** — Auth state is stored in `sessionStorage`, not `localStorage`, so closing the browser tab automatically logs the user out. Designed for shared or semi-public devices.

**Live pricing with graceful fallback** — Both the crypto and stock API routes include hardcoded fallback prices. A CoinGecko or Finage outage degrades to slightly stale data rather than a broken page.

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User info, role (client/adviser), risk profile, investor archetype, adviser link, privacy flag |
| `portfolios` | Portfolio totals per client with last-updated timestamp |
| `assets` | Individual positions (name, ticker, class, value, quantity, CoinGecko ID, Finage symbol) |
| `chat_messages` | AI chat history (session_id, role, content, response JSONB) |
| `direct_messages` | Adviser ↔ client messaging (sender, recipient, content, read timestamp) |
| `portfolio_templates` | Starter portfolios by risk profile, seeded on signup |

Row Level Security (RLS) is enabled on all tables. Users can only modify their own data; advisers can read connected client data.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- An Anthropic API key

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
FINAGE_API_KEY=your_finage_api_key   # optional — falls back to hardcoded prices
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Seed demo data by visiting `/api/seed` once.

### Deploy to Vercel

Add the same environment variables in your Vercel project settings, then push to your connected repository or run:

```bash
vercel deploy
```
