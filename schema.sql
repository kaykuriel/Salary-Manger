-- Run this entire file in the Supabase SQL Editor (supabase.com → project → SQL Editor)

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));

CREATE TABLE IF NOT EXISTS salary_data (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_key  TEXT NOT NULL,
  salary     NUMERIC(12,2) NOT NULL DEFAULT 0,
  categories JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, month_key)
);

-- We use the service role key server-side, so RLS is not needed
ALTER TABLE users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_data DISABLE ROW LEVEL SECURITY;
