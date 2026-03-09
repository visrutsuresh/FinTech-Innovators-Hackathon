# Hackathon Checklist

## Legend
- [ ] Not started
- [-] In progress
- [x] Completed
- [!] Blocked

## Current Summary
- Completed: 5
- In progress: 0
- Blocked: 0
- Not started: 2

---

## Tasks

### Task 1 — Real-time stock/net worth updates
**Status:** [x] Completed
**Expectation:** Portfolio values and wellness score update with fresh prices periodically (every 60s) and on demand. No wasteful polling beyond what the API cache allows.
**Files changed:**
- `app/client/[id]/ClientView.tsx` — added `refreshPrices()`, `livePortfolio` state, `liveScore` state, 60s auto-interval, manual refresh button, "Prices at HH:MM" timestamp
**Approach:**
- Server component (`page.tsx`) fetches prices with `revalidate: 60` for initial SSR render
- `ClientView.tsx` now holds `livePortfolio` and `liveScore` state (initialised from server props)
- `refreshPrices()` fetches `/api/crypto` and `/api/stocks` client-side, maps live prices onto assets, recomputes `totalValue`, and calls `calculateWellnessScore()` from `lib/wellness.ts`
- `setInterval(refreshPrices, 60_000)` auto-refreshes every 60s (matching API cache window = no wasted calls)
- Manual refresh button (spinning icon) in page header with disabled state during refresh
- `WealthWallet` and `WellnessScorecard` receive `livePortfolio` / `liveScore` props so they update reactively
**API Keys:** No new keys required. `FINAGE_API_KEY` is optional (fallback prices exist). CoinGecko is free.
**Verification:** `npm run build` passes. Load `/client/client-1` → see "Prices at HH:MM" in header → click refresh icon → spins → values update → auto-refreshes after 60s.

---

### Task 2 — Signup questionnaire with playful investor profiles
**Status:** [x] Completed
**Expectation:** New client signups complete a 5-question questionnaire classifying them into a playful profile. Profile is persisted in Supabase via the user object and displayed on the client dashboard.
**Files changed:**
- `types/index.ts` — added `investorProfile?: string` to `Client` interface
- `app/auth/signup/page.tsx` — full rewrite: multi-step form (Step 1: basic info, Step 2: questionnaire, Step 3: profile result)
- `app/client/[id]/ClientView.tsx` — added gold profile badge in page header (shown only when `client.investorProfile` is set)
**Questionnaire:**
- 5 questions, each with 3 options scored 1–3
- Total score 5–8 → "The Vault Guardian" (CONSERVATIVE)
- Total score 9–12 → "The Balanced Pathfinder" (MODERATE)
- Total score 13–15 → "The Quantum Maverick" (AGGRESSIVE)
- Advisers skip the questionnaire entirely; questionnaire only shown for CLIENT role
- Animated progress bar during questionnaire; animated profile result screen before redirect
**Verification:** `npm run build` passes. Sign up as new client → complete 5 questions → see profile name + description → click "Enter my dashboard" → profile badge appears next to risk badge in header.

---

### Task 3 — Persistent multi-turn AI chatbot
**Status:** [x] Completed
**Expectation:** AI is user-triggered only (no auto-fetch on load). Conversations persist per account in Supabase. Full conversation history is sent to Claude on each request enabling genuine multi-turn dialogue. Claude can answer any question — financial or general — not just portfolio recommendations.
**Files changed:**
- `components/AIRecommendations.tsx` — full rewrite as Supabase-backed conversational chatbot
- `components/layout/ChatPanel.tsx` — slide-out panel (380px, fixed right, top: 56px)
- `components/layout/ChatPanelContext.tsx` — global `isOpen` / `toggle` / `close` state + `⌘L` keyboard shortcut
- `components/layout/MainLayout.tsx` — responsive `margin-right` shift when panel opens
- `components/layout/Navbar.tsx` — sparkles icon button (gold when open, muted when closed)
- `lib/claude.ts` — portfolio context in `system` prompt; multi-turn `messages[]` array; dual response mode (`chat` vs `recommendations`)
- `types/index.ts` — added `ConversationMessage`, `conversationHistory?` on `RecommendationRequest`, `type?`/`message?` on `RecommendationResponse`
- `supabase-schema.sql` — added `chat_messages` table with RLS
- `app/layout.tsx` — wraps providers: `AuthProvider` → `ChatPanelProvider` → `Navbar` + `ChatPanel` + `MainLayout`
**Key behaviours:**
- Zero API calls on page load — every call is 1:1 with a user action
- History loaded from Supabase on mount; each exchange saved to Supabase immediately
- Full conversation history sent with every request → Claude maintains context across turns
- Claude returns `{"type":"chat","message":"..."}` for general questions (maths, trivia) and `{"type":"recommendations",...}` for portfolio questions
- Recommendation cards only render for portfolio-type responses; general answers render as plain text
- `⌘L` toggles the panel globally; main content shifts responsively
- `Clear` button deletes conversation from Supabase
**Verification:** `npm run build` passes. Open panel → type "77*456" → receives plain text answer → type "How should I rebalance?" → receives structured recommendation cards → close panel and reopen → full history restored without a network request.

---

### Task 4 — Net worth extraction: documentation
**Status:** [x] Completed
**Expectation:** Developer-facing explanation of how net worth is computed and how to extract it.
**Files changed:** None (documentation only — see below)

---

## Net Worth Extraction — Developer Reference

### Where does net worth come from?

Net worth (`portfolio.totalValue`) is computed in two stages, then kept live on the client:

#### Stage 1 — Static mock data (`lib/mock-data.ts`)
Each `Client` has `portfolio.totalValue` = sum of all `asset.value` fields. These are hardcoded mock values used as the base.

#### Stage 2 — Live price overlay (`app/client/[id]/page.tsx`)
The server component does this on every request:
1. Fetches crypto prices: `GET /api/crypto` (CoinGecko, cached 60s)
2. Fetches stock prices: `GET /api/stocks?symbols=...` (Finage, cached 60s, falls back to hardcoded)
3. For each asset:
   - `isCrypto && coinGeckoId` → `value = cryptoPrices[coinGeckoId].usd × asset.quantity`
   - `assetClass === STOCKS && finageSymbol` → `value = stockPrices[finageSymbol] × asset.quantity`
4. `totalValue = sum(updatedAssets.map(a => a.value))`
5. Passes `updatedPortfolio` to `ClientView`

#### Stage 3 — Client-side refresh (`app/client/[id]/ClientView.tsx`)
After the initial SSR render, `ClientView` keeps prices live:
- `refreshPrices()` re-fetches `/api/crypto` and `/api/stocks` and re-runs the same merge logic
- Called every 60s via `setInterval` and on manual user refresh
- `setLivePortfolio(updated)` + `setLiveScore(calculateWellnessScore(updated, riskProfile))`

#### To extract net worth programmatically
```typescript
import { getClientById } from '@/lib/mock-data'
import { calculateWellnessScore } from '@/lib/wellness'

const client = getClientById('client-1')!

// Static (no live prices):
const staticNetWorth = client.portfolio.totalValue

// With live prices — replicate the server component logic:
async function getLiveNetWorth(clientId: string) {
  const client = getClientById(clientId)!
  const stockSymbols = client.portfolio.assets
    .filter(a => a.finageSymbol)
    .map(a => a.finageSymbol!)

  const [crypto, stocks] = await Promise.all([
    fetch('/api/crypto').then(r => r.json()),
    fetch(`/api/stocks?symbols=${stockSymbols.join(',')}`).then(r => r.json()),
  ])

  const assets = client.portfolio.assets.map(a => {
    if (a.isCrypto && a.coinGeckoId && crypto[a.coinGeckoId]?.usd)
      return { ...a, value: crypto[a.coinGeckoId].usd * (a.quantity ?? 1) }
    if (a.finageSymbol && stocks[a.finageSymbol])
      return { ...a, value: stocks[a.finageSymbol] * (a.quantity ?? 1) }
    return a
  })

  return {
    totalValue: assets.reduce((s, a) => s + a.value, 0),
    wellnessScore: calculateWellnessScore({ ...client.portfolio, assets }, client.riskProfile),
  }
}
```

If this extraction is needed in more than one place, extract the price-merge logic to `lib/prices.ts`.

---

### Task 5 — Portfolio Analytics Charts (wire up existing components)
**Status:** [x] Completed
**Expectation:** The radar chart and bar chart components exist but are never rendered. Wire WellnessRadar into the Wellness Score card and add a donut/bar toggle to the Wealth Wallet so judges can see all three chart types the PDF mentions.
**Files to change:**
- `components/wellness/WellnessScorecard.tsx` — add WellnessRadar below the gauge
- `components/WealthWallet.tsx` — add tab toggle "Allocation" (donut) vs "Positions" (AssetBarChart)
**Verification:** Open any client dashboard → Wellness Score card shows radar chart → Wealth Wallet has a tab toggle that switches between the donut allocation view and the bar chart positions view.

---

### Task 6 — Black Swan Stress Tester
**Status:** [ ] Not started
**Expectation:** Scenario toggle buttons (2008 Crisis, Crypto Winter, COVID Crash, Hyperinflation) apply realistic asset-class multipliers to the portfolio, re-rendering the Wealth Wallet and Wellness Score in real time so judges see the stressed values vs live values side by side.
**Files to change:**
- `components/StressTester.tsx` — new component: scenario buttons + stressed portfolio/score display
- `app/client/[id]/ClientView.tsx` — add StressTester card below existing rows
**Verification:** Toggle "Crypto Winter" → crypto holdings drop ~75%, total value updates, wellness score drops, a red "Stressed" banner appears. Toggle off → values restore instantly.

---

### Task 7 — Liquidity Stress Test
**Status:** [ ] Not started
**Expectation:** "Run Liquidity Stress Test" button prompts for a cash-need amount, then filters the portfolio into liquidity tiers (T+0 instant, T+2 liquid, T+30 illiquid) and shows a clear pass/fail verdict plus a T+0 vs T+30 bar chart.
**Files to change:**
- `types/index.ts` — add `liquidityTier?: 1 | 2 | 3` to `Asset`
- `lib/mock-data.ts` — annotate every asset with a liquidityTier
- `components/LiquidityTest.tsx` — new component: input + tier breakdown + verdict + stacked bar
- `app/client/[id]/ClientView.tsx` — add LiquidityTest card
**Verification:** Enter $50,000 → app shows T+0 and T+30 accessible cash totals → clear pass/fail result → stacked bar chart shows tier breakdown.

---

## Implementation Log
- 2026-03-10: Checklist created. Repository analyzed.
- 2026-03-10: `types/index.ts` — added `investorProfile?: string` to Client.
- 2026-03-10: `app/auth/signup/page.tsx` — full rewrite with 3-step flow (info → questionnaire → profile result).
- 2026-03-10: `components/AIRecommendations.tsx` — full rewrite as user-triggered chatbot with sessionStorage cache.
- 2026-03-10: `app/client/[id]/ClientView.tsx` — added live price refresh (60s interval + manual button), investor profile badge, passes livePortfolio/liveScore to child components.
- 2026-03-10: `npm run build` — PASSED with 0 errors. All 10 pages compiled successfully.
- 2026-03-10: Auth migrated to Supabase. `lib/supabase.ts`, `lib/supabase-server.ts`, `lib/db.ts` created. `supabase-schema.sql` added. `/api/seed` endpoint created. `AuthContext.tsx` rewritten.
- 2026-03-10: Global AI chat panel added — `ChatPanel.tsx`, `ChatPanelContext.tsx`, `MainLayout.tsx`. Navbar sparkles icon, `⌘L` shortcut.
- 2026-03-10: AI chatbot upgraded — Supabase `chat_messages` table, multi-turn Claude system prompt, dual response mode (chat vs recommendations). Old Tasks 3 & 4 amalgamated.
- 2026-03-10: `npm run build` — PASSED with 0 errors. All 10 pages compiled successfully.
