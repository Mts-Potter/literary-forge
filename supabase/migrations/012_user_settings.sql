-- Migration 012: User Settings Table
-- Date: 2025-01-23
-- Purpose: Store user preferences including SRS toggle

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- SRS toggle (Spaced Repetition System)
  enable_srs BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one settings row per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX user_settings_user_id_idx ON user_settings(user_id);

-- Add comment
COMMENT ON TABLE user_settings IS
'Stores user preferences and settings.
- enable_srs: Toggle between Spaced Repetition (Anki-style) and Linear mode';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 012 completed: user_settings table created with RLS policies';
END $$;
