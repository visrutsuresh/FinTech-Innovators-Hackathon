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

-- ── Username (unique handle for nominations & adviser search) ──
-- Run once after initial schema creation. Safe to re-run (IF NOT EXISTS / IF NOT EXISTS).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
-- Fast lookup by username (case already stored as lowercase at app level)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ── Portfolio Templates (starter dashboards by risk profile) ───
-- Copy into new user portfolios for instant populated dashboard
CREATE TABLE IF NOT EXISTS portfolio_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_profile   TEXT NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  name           TEXT NOT NULL,
  asset_class    TEXT NOT NULL,
  value          NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'USD',
  quantity       NUMERIC,
  is_crypto      BOOLEAN NOT NULL DEFAULT FALSE,
  coin_gecko_id  TEXT,
  finage_symbol  TEXT,
  sort_order     INT DEFAULT 0
);

-- Allow public read of templates (used during signup)
ALTER TABLE portfolio_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read templates" ON portfolio_templates FOR SELECT USING (true);

-- Seed starter templates. Run once. Uses DO block for idempotency.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM portfolio_templates LIMIT 1) THEN
    INSERT INTO portfolio_templates (risk_profile, name, asset_class, value, currency, quantity, is_crypto, coin_gecko_id, finage_symbol, sort_order) VALUES
      ('conservative', 'Cash', 'cash', 50000, 'USD', NULL, false, NULL, NULL, 0),
      ('conservative', 'Treasury Bonds', 'bonds', 30000, 'USD', NULL, false, NULL, NULL, 1),
      ('conservative', 'S&P 500 ETF', 'stocks', 20000, 'USD', 45, false, NULL, 'SPY', 2),
      ('moderate', 'Cash', 'cash', 25000, 'USD', NULL, false, NULL, NULL, 0),
      ('moderate', 'S&P 500 ETF', 'stocks', 40000, 'USD', 90, false, NULL, 'SPY', 1),
      ('moderate', 'Bitcoin', 'crypto', 15000, 'USD', 0.25, true, 'bitcoin', NULL, 2),
      ('moderate', 'Bonds', 'bonds', 20000, 'USD', NULL, false, NULL, NULL, 3),
      ('aggressive', 'Cash', 'cash', 10000, 'USD', NULL, false, NULL, NULL, 0),
      ('aggressive', 'S&P 500 ETF', 'stocks', 50000, 'USD', 110, false, NULL, 'SPY', 1),
      ('aggressive', 'Bitcoin', 'crypto', 25000, 'USD', 0.5, true, 'bitcoin', NULL, 2),
      ('aggressive', 'Ethereum', 'crypto', 10000, 'USD', 3, true, 'ethereum', NULL, 3);
  END IF;
END $$;

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

-- ── Chat session IDs ───────────────────────────────────────────
-- Add session_id to group messages into named conversations.
-- Run once on existing databases.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages(client_id, session_id, created_at);

-- ── Direct Messages (adviser ↔ client) ────────────────────────
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages where they are sender or recipient
CREATE POLICY "read own direct_messages" ON direct_messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can only send messages as themselves
CREATE POLICY "send direct_messages" ON direct_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dm_thread
  ON direct_messages(sender_id, recipient_id, created_at);
