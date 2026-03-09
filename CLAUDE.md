# Huat — Wealth Wellness Hub
## NTU FinTech Innovators Hackathon 2026

### Project Overview
"Huat" is an integrated financial wellness hub that unifies traditional and digital assets, computes wellness scores, and delivers Claude-powered recommendations. Deadline: March 11, 9am (seeding round).

### Tech Stack
- Next.js 14+ App Router + TypeScript
- Tailwind CSS (dark theme, gold/emerald palette)
- Framer Motion (animations)
- Recharts (charts)
- Claude claude-sonnet-4-6 via @anthropic-ai/sdk (server-side ONLY)
- CoinGecko free API for crypto prices (proxied)

### Key Architecture Rules
1. `lib/claude.ts` is SERVER-ONLY — never import in client components
2. CoinGecko route uses `next: { revalidate: 60 }` — free tier rate limits
3. Claude response wrapped in `try/catch JSON.parse` with FALLBACK_RECOMMENDATIONS
4. `AIRecommendations.tsx` does NOT block page render — fires in `useEffect`
5. Auth is mock/sessionStorage — no real DB needed

### Mock Users (password: demo123)
- adviser@demo.com → Adviser dashboard (/adviser)
- alex@demo.com → Client Alex (Aggressive, crypto-heavy)
- sarah@demo.com → Client Sarah (Moderate, balanced)
- raymond@demo.com → Client Raymond (Conservative, cash-heavy)
- priya@demo.com → Client Priya (Moderate, real estate focus)
- marcus@demo.com → Client Marcus (Aggressive, startup-heavy)

### Wellness Score Formula
- 40% Diversification (HHI index across asset classes)
- 35% Liquidity (liquid assets ratio)
- 25% Behavioral Alignment (risk profile vs portfolio composition)
