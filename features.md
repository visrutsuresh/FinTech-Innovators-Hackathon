# Huat — Feature Overview
## Wealth Wellness Hub · NTU FinTech Innovators Hackathon 2026

---

## Authentication & Onboarding

**Login** (`/auth/login`)
- Email/password authentication via Supabase Auth
- One-click demo account buttons for quick access (adviser + 5 clients)

**Signup** (`/auth/signup`)
- Multi-step onboarding: account info → investor questionnaire → archetype reveal
- 5-question risk profiling questionnaire scored 5–15
  - 5–8 → **The Vault Guardian** (Conservative)
  - 9–12 → **The Balanced Pathfinder** (Moderate)
  - 13–15 → **The Quantum Maverick** (Aggressive)
- Real-time username availability check
- Animated archetype result screen before dashboard redirect
- Adviser role skips questionnaire entirely

**Session Handling**
- Supabase Auth session persists in localStorage; restored on tab reopen
- Landing page auto-redirects logged-in users to their dashboard
- Logout clears state immediately before signing out

---

## Landing Page (`/`)

- Hero section with branding, value proposition, and CTAs
- Three-pillar overview: Unified View · Wellness Score · AI Insights
- Metrics strip: $1.02M+ AUM tracked, 5 client profiles, real-time AI insights
- Auto-redirects authenticated users to their respective dashboard

---

## Client Dashboard (`/client/[id]`)

### Wealth Wallet
- Total net worth with live-updating value
- Asset allocation donut chart
- Asset class breakdown bars with percentages
- Individual position list: name, class, quantity, and current value
- Privacy mode: masks dollar amounts and specific asset names for adviser viewing

### Wellness Score Card
- Composite score 0–100 with colour-coded label (Excellent / Good / Fair / Poor / Critical)
- Three weighted sub-scores:
  - **Diversification** (40%) — Herfindahl-Hirschman Index across asset classes
  - **Liquidity** (35%) — liquid asset ratio (cash, stocks, bonds, crypto)
  - **Behavioural Alignment** (25%) — portfolio risk composition vs. stated risk profile
- Score breakdown panel with methodology explanation

### Portfolio Management
- Add, edit, or remove assets via modal
- Asset classes: Cash, Stocks, Crypto, Bonds, Real Estate, Private Equity
- Stocks/crypto: ticker + quantity → live price fetched and stored
- Other assets: manual dollar value entry
- Saves directly to Supabase; portfolio totals recomputed on save

### Live Price Refresh
- Initial prices fetched server-side at render (SSR)
- Manual refresh button with spinning indicator
- Auto-refresh every 60 seconds (matches API cache window)
- "Prices at HH:MM" timestamp in page header

### Investor Archetype Badge
- Derived from risk profile (no separate field needed)
- Displayed in the client dashboard header

---

## Adviser Dashboard (`/adviser`)

- Summary cards: total AUM, average wellness score, clients managed, low-wellness alerts
- Client roster table:
  - Avatar, name, email
  - AUM per client
  - Risk profile badge
  - Wellness score with progress bar
  - Click-through to full client dashboard
- Privacy mode toggle in navbar when viewing a client page (adviser only)

---

## Profile Page (`/profile`)

### Client Profile
- View and edit own profile details
- **Adviser Connection**: search advisers by username, send connection request, disconnect
- **NOK (Next of Kin) Nominations**: search users, nominate as NOK, accept/reject incoming nominations
- **Direct Messaging**: real-time chat thread with connected adviser via Supabase Realtime

### Adviser Profile
- View all connected clients
- Manage incoming and outgoing connection requests
- View NOK nominations where adviser is a nominated party
- **Direct Messaging**: real-time chat thread with any connected client via Supabase Realtime

---

## AI Adviser (Claude-powered)

**Chat Panel** (global, ⌘L shortcut)
- Slide-out panel (380 px, fixed right side); main content shifts responsively
- Sparkle icon in navbar: gold when open, muted when closed
- Zero API calls on page load — every call is triggered by user action

**Multi-turn Conversation**
- Full conversation history sent with every request → genuine context across turns
- History loaded from Supabase `chat_messages` on panel open
- Each exchange saved to Supabase immediately after response

**Dual Response Mode**
- General questions (maths, trivia, etc.) → plain text answer
- Portfolio questions → structured recommendation cards with priority (High / Medium / Low) and category (Diversification, Liquidity, Risk, Opportunity)

**Session Management**
- New session UUID generated on each panel open → fresh chat by default
- Past sessions shown as tabs; clicking one loads that conversation read-only
- Clear button deletes all messages for the current session from Supabase

---

## Advanced Analytics

### Black Swan Scenario Tester
Four historical/hypothetical crash scenarios:
- 2008 Financial Crisis
- 2020 COVID Crash
- Crypto Winter
- Hyperinflation

Each scenario applies per-asset-class impact multipliers to recompute portfolio value and recalculate the wellness score. Before/after comparison displayed inline.

### Flash Liquidity & Stress Test
Tiered liquidation analysis with Recharts bar chart:
- **T+0** (within 24 hrs): Cash only
- **T+2** (2–3 days): + Stocks, Bonds, major Crypto
- **T+30** (30+ days): + Real Estate, Private Equity

Enter a target withdrawal amount → Pass/Fail result with shortfall breakdown if liquidity is insufficient.

### Legacy & Inheritance Readiness
Five-item estate planning checklist:
1. Will / Testament
2. Nominees assigned to all accounts
3. Digital vault for credentials
4. Life insurance coverage reviewed
5. Power of Attorney set up

Completion percentage shown as a "Legacy Score". Checkbox state persisted per user.

---

## Data & Pricing

**CoinGecko API** — real-time prices for BTC, ETH, SOL, MATIC, DOGE (free tier, 60 s server cache)

**Finage Stock API** — real-time prices for equities (AAPL, MSFT, TSLA, NVDA, SPY, QQQ, JPM, etc.)

**Fallback pricing** — hardcoded values used when API keys are absent or rate-limited

**Parallel fetching** — crypto and stock prices fetched concurrently to minimise latency

---

## Database (Supabase / PostgreSQL)

| Table | Purpose |
|---|---|
| `profiles` | User info, role, risk profile, investor archetype |
| `portfolios` | Portfolio totals and last-updated timestamp |
| `assets` | Individual asset positions per portfolio |
| `adviser_clients` | Adviser–client relationship requests and status |
| `nok_nominations` | Next-of-kin nominations and status |
| `chat_messages` | AI chat history (session-scoped, per user) |
| `direct_messages` | Adviser–client real-time message threads |

All tables protected by Supabase Row Level Security (RLS).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router + TypeScript |
| Styling | Tailwind CSS — dark theme, gold `#C9A227` / emerald `#10B981` palette |
| Animations | Framer Motion |
| Charts | Recharts |
| AI | Claude claude-sonnet-4-6 via `@anthropic-ai/sdk` (server-side only) |
| Auth & DB | Supabase (Auth + PostgreSQL + Realtime) |
| Crypto prices | CoinGecko free API (proxied, 60 s revalidate) |
| Stock prices | Finage API (proxied, 60 s revalidate, fallback hardcoded) |

---

## Demo Accounts (password: `demo123`)

| Email | Role | Portfolio |
|---|---|---|
| adviser@demo.com | Adviser | — |
| alex@demo.com | Client | Aggressive · crypto-heavy |
| sarah@demo.com | Client | Moderate · balanced |
| raymond@demo.com | Client | Conservative · cash-heavy |
| priya@demo.com | Client | Moderate · real estate focus |
| marcus@demo.com | Client | Aggressive · startup-heavy |
