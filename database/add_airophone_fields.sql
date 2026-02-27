-- Migration: Add Airophone SMS provider fields to user_configs
-- Run this in your Supabase SQL editor

ALTER TABLE user_configs
  ADD COLUMN IF NOT EXISTS sms_provider VARCHAR(20) DEFAULT 'openphone',
  ADD COLUMN IF NOT EXISTS airophone_api_key TEXT,
  ADD COLUMN IF NOT EXISTS airophone_phone VARCHAR(20);

-- Set existing rows to openphone (they all use OpenPhone currently)
UPDATE user_configs
SET sms_provider = 'openphone'
WHERE sms_provider IS NULL;
