-- ============================================================
-- Huat — Wealth Wellness Hub
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- Profiles (extends auth.users — one row per user)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('client', 'adviser')),
  risk_profile  TEXT CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  investor_profile TEXT,
  adviser_id    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolios (one per client)
CREATE TABLE IF NOT EXISTS portfolios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_value  NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Assets (many per portfolio)
CREATE TABLE IF NOT EXISTS assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id   UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  ticker         TEXT,
  asset_class    TEXT NOT NULL,
  value          NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'USD',
  quantity       NUMERIC,
  purchase_price NUMERIC,
  is_crypto      BOOLEAN NOT NULL DEFAULT FALSE,
  coin_gecko_id  TEXT,
  finage_symbol  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all profiles/portfolios/assets
-- (app-level auth guards enforce who can view what)
CREATE POLICY "auth read profiles"   ON profiles  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read portfolios" ON portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read assets"     ON assets     FOR SELECT TO authenticated USING (true);

-- Users can insert/update their own profile and portfolio data
CREATE POLICY "own profile write"   ON profiles  FOR ALL USING (auth.uid() = id);
CREATE POLICY "own portfolio write" ON portfolios FOR ALL USING (client_id = auth.uid());
CREATE POLICY "own assets write"    ON assets     FOR ALL USING (
  portfolio_id IN (SELECT id FROM portfolios WHERE client_id = auth.uid())
);

-- ── Chat Messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  response    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all chat messages
CREATE POLICY "auth read chat"   ON chat_messages FOR SELECT TO authenticated USING (true);
-- Clients can insert and delete only their own messages
CREATE POLICY "own chat insert"  ON chat_messages FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "own chat delete"  ON chat_messages FOR DELETE USING (client_id = auth.uid());
