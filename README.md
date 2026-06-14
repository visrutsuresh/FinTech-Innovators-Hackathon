<h1 align="center">
<b>Huat</b><br/>
<p style="font-size:16px;font-weight:normal;">✨ Your whole financial life — and how healthy it really is — on one screen ✨</p>
</h1>

<div align="center">
<p>NTU FinTech Innovators Hackathon 2026 · Problem Statement #1 · Wealth Wellness Hub</p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=FFFFFF&labelColor=222222)](https://fin-tech-innovators-hackathon-gny2.vercel.app/)
&nbsp;
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=FFFFFF&labelColor=222222)](#system-overview)
&nbsp;
[![Claude AI](https://img.shields.io/badge/Claude%20AI-D97757?style=for-the-badge&logo=anthropic&logoColor=FFFFFF&labelColor=222222)](#ai-adviser-claude)

👆 Try the live demo above! 👆

<p align="center">
<a href="#introduction">Introduction</a> &nbsp;&bull;&nbsp;
<a href="#project-structure">Project Structure</a> &nbsp;&bull;&nbsp;
<a href="#system-overview">System Overview</a> &nbsp;&bull;&nbsp;
<a href="#getting-started">Getting Started</a>
</p>
</div>

## Introduction

Most people's money is scattered — some stocks in one app, crypto in another, a property, a pension, cash in the bank — and **no single place tells them whether the whole picture is actually healthy.** Advisers face the same blind spot: they only see the slice of a client's wealth that sits with them.

***Huat*** is a **financial wellness platform** that pulls a client's traditional *and* digital assets into one dashboard and answers the question that really matters — *not just "how much do I have?" but "how healthy is my financial position?"* It does this with a single composite **Wellness Score (0–100)** built from portfolio theory and behavioural finance, and a built-in **AI adviser powered by Claude** that gives real, context-aware recommendations.

Built for **two audiences at once**: retail investors get a clear health read on their own money, and **wealth advisers** get a roster view of every connected client, with low-wellness alerts and direct messaging. The platform also includes **stress-testing tools** — a Black Swan crisis simulator, a tiered liquidity stress test, and an estate-planning readiness checklist — so users can see how their position holds up under pressure, not just on a calm day.

> 🔗 **Live demo:** https://fin-tech-innovators-hackathon-gny2.vercel.app/
> All demo accounts share the public demo password `demo123` *(intentional throwaway credentials for the hackathon demo — not real secrets)*.

### Demo Accounts

| Email | Role | Portfolio Profile | AUM |
|---|---|---|---|
| `adviser@demo.com` | Adviser | — | Manages all 5 clients |
| `alex@demo.com` | Client | Aggressive | ~$141K — BTC/ETH/SOL heavy |
| `sarah@demo.com` | Client | Moderate | ~$176K — AAPL, MSFT, SPY balanced |
| `raymond@demo.com` | Client | Conservative | ~$268K — Cash + bonds heavy |
| `priya@demo.com` | Client | Moderate | ~$215K — REITs + QQQ + crypto |
| `marcus@demo.com` | Client | Aggressive | ~$223K — Startup equity + BTC |

**Total tracked AUM across demo clients: ~$1.02M**

## Project Structure

- `app/`
  **Next.js App Router** — pages, layout, and global styles.
  - `page.tsx` Landing / dashboard entry.
  - `adviser/` Adviser dashboard route *(AUM overview, client roster, alerts)*.
  - `profile/` Profile, adviser connections, and next-of-kin nomination.
  - `globals.css` Tailwind base + dark theme tokens.
- `components/`
  **Feature UI components.**
  - `WealthWallet.tsx` Unified multi-asset-class view with live prices and charts.
  - `AIRecommendations.tsx` Claude-powered slide-out adviser chat.
  - `BlackSwanTester.tsx` Historical-crisis scenario simulator.
  - `FlashLiquidityScorecard.tsx` Tiered T+0 / T+2 / T+30 liquidity stress test.
  - `LegacyReadiness.tsx` Estate-planning readiness checklist.
  - `DirectMessages.tsx` Realtime adviser ↔ client messaging.
- `lib/`
  **Server logic and integrations.**
  - `claude.ts` **Server-side only** Anthropic SDK wrapper *(never imported client-side)*.
  - `wellness.ts` Wellness Score computation *(diversification / liquidity / behavioural)*.
  - `supabase.ts` & `supabase-server.ts` Supabase clients *(browser + service-role)*.
  - `archetypes.ts` Investor archetype mapping from the risk questionnaire.
  - `db.ts`, `mock-data.ts`, `utils.ts` Data access, seed data, helpers.
- `types/` Shared TypeScript types.
- `supabase-schema.sql` Full database schema *(tables + Row Level Security)*.
- `Dockerfile` & `docker-compose.yml` Multi-stage container build *(deps → builder → runner on node:20-alpine)*.
- `features.md`, `PRD.md`, `QA_REPORT.md`, `docs/` Project planning + QA docs.

## System Overview

### System Architecture

***Huat*** is a **Next.js App-Router app on Vercel**, backed by **Supabase** (PostgreSQL + Auth + Realtime) for all persistence and live messaging.

- **AI calls are server-only.** The browser never talks to Anthropic directly — all inference is routed through a Next.js API route (`/api/recommendations`), which builds the prompt from the client's full portfolio context and keeps the API key off the client.
- **Non-blocking AI panel.** The chat panel fires zero requests until the user opens it, so page load stays fast.
- **Parallel auth fetches.** On login, profile, portfolio+assets, and adviser-client queries fire in parallel rather than in sequence.
- **Live pricing with graceful fallback.** Equity prices (Finage) and crypto prices (CoinGecko) are fetched with a 60-second server-side cache; if a provider is down, hardcoded fallback prices keep the page working.
- **Row Level Security on every table** — users can only modify their own data; advisers can read connected client data only.

### Wellness Score — how it works in plain terms

The **Wellness Score (0–100)** blends three measures of financial health:

```
Wellness Score = (Diversification × 0.40) + (Liquidity × 0.35) + (Behavioural Alignment × 0.25)
```

- **Diversification (40%)** — how spread out the money is, measured with the **Herfindahl-Hirschman Index** *(the same concentration metric regulators use)*. One asset class = 0; evenly spread across all six ≈ 100.
- **Liquidity (35%)** — how fast the portfolio could be turned into cash in a crisis, scored in tiers *(because going from 20%→30% liquid matters far more than 70%→80%)*.
- **Behavioural Alignment (25%)** — whether what you *hold* matches the risk level you *said* you wanted *(e.g. a self-described conservative holding 40% crypto gets flagged)*. It surfaces misalignment as a signal — it never forces a rebalance.

### Tech Stack

![Frontend](https://img.shields.io/badge/frontend%3A-222222?style=for-the-badge) &nbsp; ![Next.js Badge](https://img.shields.io/badge/next.js%2016-000000?style=for-the-badge&logo=nextdotjs&labelColor=222222) ![TypeScript Badge](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&labelColor=222222) ![Tailwind Badge](https://img.shields.io/badge/tailwindcss%204-06B6D4?style=for-the-badge&logo=tailwindcss&labelColor=222222) ![Framer Motion Badge](https://img.shields.io/badge/framer%20motion-0055FF?style=for-the-badge&logo=framer&labelColor=222222) ![Recharts Badge](https://img.shields.io/badge/recharts-22B5BF?style=for-the-badge&logo=chartdotjs&labelColor=222222)

![Backend](https://img.shields.io/badge/backend%2F%20data%3A-222222?style=for-the-badge) &nbsp; ![Supabase Badge](https://img.shields.io/badge/supabase-3FCF8E?style=for-the-badge&logo=supabase&labelColor=222222) ![PostgreSQL Badge](https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&labelColor=222222)

![AI](https://img.shields.io/badge/ai%3A-222222?style=for-the-badge) &nbsp; ![Claude Badge](https://img.shields.io/badge/claude-D97757?style=for-the-badge&logo=anthropic&labelColor=222222)

![Pricing](https://img.shields.io/badge/market%20data%3A-222222?style=for-the-badge) &nbsp; ![CoinGecko Badge](https://img.shields.io/badge/coingecko-8DC63F?style=for-the-badge&logo=coingecko&labelColor=222222) ![Finage Badge](https://img.shields.io/badge/finage-1A73E8?style=for-the-badge&labelColor=222222)

![Deploy](https://img.shields.io/badge/deploy%3A-222222?style=for-the-badge) &nbsp; ![Vercel Badge](https://img.shields.io/badge/vercel-000000?style=for-the-badge&logo=vercel&labelColor=222222) ![Docker Badge](https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&labelColor=222222)

### AI Adviser (Claude)

- **Multi-turn:** full conversation history is sent with every request, loaded from Supabase `chat_messages` when the panel opens.
- **Dual response mode:** portfolio questions return structured recommendation cards *(title, description, priority, category)*; general questions return plain text.
- **Resilient:** JSON parsing is wrapped in `try/catch`, with hardcoded fallback recommendations so the UI never breaks if the API is unavailable.

### Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User info, role, risk profile, archetype, adviser link, privacy flag |
| `portfolios` | Portfolio totals per client |
| `assets` | Individual positions *(name, ticker, class, value, quantity)* |
| `chat_messages` | AI chat history *(session, role, content, response JSONB)* |
| `direct_messages` | Adviser ↔ client messaging |
| `portfolio_templates` | Starter portfolios by risk profile, seeded on signup |

## Getting Started

### Pre-requisites

> ⚠️ **Pre-requisite!** You will need:
> - [Node.js 18+](https://nodejs.org/) — runtime for Next.js.
> - A [Supabase](https://supabase.com/) project — database, auth, and realtime.
> - An [Anthropic API key](https://console.anthropic.com/) — powers the AI adviser.
> - *(Optional)* a [Finage](https://finage.co.uk/) API key for live equity prices — falls back to hardcoded prices if absent.

### 1. Clone the Repository

```bash
git clone https://github.com/visrutsuresh/FinTech-Innovators-Hackathon.git
cd FinTech-Innovators-Hackathon
```

### 2. Configure Environment Variables

Create `.env.local` in the project root. Use this template, then replace each placeholder with your real value — **never commit real secrets**:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
FINAGE_API_KEY=your_finage_api_key   # optional — falls back to hardcoded prices
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Description | How to get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key *(client-safe)* | Same page as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key *(server only — keep secret)* | Same page as above |
| `ANTHROPIC_API_KEY` | Claude API key *(server only)* | console.anthropic.com |
| `FINAGE_API_KEY` | Live equity prices *(optional)* | finage.co.uk |

### 3. Set Up the Database

Run `supabase-schema.sql` against your Supabase project *(SQL Editor → paste → run)* to create all tables and Row Level Security policies.

### 4. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then visit `/api/seed` **once** to seed the demo data and accounts.

### 5. (Alternative) Run with Docker

With `.env.local` populated:

```bash
docker compose up --build
```

The app is then available at [http://localhost:3000](http://localhost:3000). The compose file mounts `.env.local` directly, so no extra flags are needed.

> 📝 Note: The Dockerfile uses a multi-stage build *(deps → builder → runner)* on `node:20-alpine` and runs as a non-root `nextjs` user, serving the Next.js standalone output via `node server.js`.

### 6. Deploy to Vercel

Add the same environment variables in your Vercel project settings, then push to your connected repository (or run `vercel deploy`).

## License

This project was built for the NTU FinTech Innovators Hackathon 2026 and is provided for educational and demonstration purposes only.
