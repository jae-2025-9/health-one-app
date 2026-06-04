-- Health One App canonical schema baseline.
-- Mirrors db/schema.sql so a fresh Prisma-managed database has the L1 core
-- tables before L2/L3/L4 detail tables reference them.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== [FROZEN] ENUMS & CORE (L1 only) ==========

CREATE TYPE data_source_type AS ENUM (
  'manual',
  'vision_ai',
  'label_scan',
  'apple_health',
  'samsung_health',
  'wearable'
);

CREATE TYPE health_event_type AS ENUM (
  'activity',
  'sleep',
  'meal',
  'beverage',
  'intake',
  'cosmetic_usage',
  'health_sync'
);

CREATE TYPE interaction_risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'unknown'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_date date,
  sex text,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  activity_goal text,
  timezone text NOT NULL DEFAULT 'Asia/Seoul',
  allergies jsonb NOT NULL DEFAULT '[]'::jsonb,
  health_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type data_source_type NOT NULL,
  display_name text NOT NULL,
  external_account_id text,
  authorized_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type health_event_type NOT NULL,
  source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  external_record_id text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Seoul',
  confidence_score numeric(4,3) NOT NULL DEFAULT 1 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT health_events_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX health_events_source_external_uidx
  ON health_events(source_id, external_record_id)
  WHERE source_id IS NOT NULL AND external_record_id IS NOT NULL;

CREATE INDEX health_events_user_time_idx
  ON health_events(user_id, started_at DESC);

CREATE INDEX health_events_user_type_time_idx
  ON health_events(user_id, event_type, started_at DESC);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_event_id uuid REFERENCES health_events(id) ON DELETE SET NULL,
  media_type text NOT NULL,
  purpose text NOT NULL,
  storage_url text NOT NULL,
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_event_id uuid REFERENCES health_events(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  analysis_type text NOT NULL,
  model_name text NOT NULL,
  confidence_score numeric(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  result_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  safety_notice text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== [L4] REMINDERS / REPORTS ==========

CREATE TABLE reminder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('intake', 'hydration', 'sleep', 'activity', 'custom')),
  target_id uuid,
  title text NOT NULL,
  rrule text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reminder_rules_user_active_idx
  ON reminder_rules(user_id, is_active);

CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_rule_id uuid REFERENCES reminder_rules(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL CHECK (status IN ('scheduled', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_logs_user_scheduled_idx
  ON notification_logs(user_id, scheduled_at DESC);

CREATE INDEX notification_logs_rule_idx
  ON notification_logs(reminder_rule_id);

-- ========== [L2] ACTIVITY / SLEEP / NUTRITION ==========

CREATE TABLE activity_records (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  steps integer CHECK (steps IS NULL OR steps >= 0),
  active_minutes integer CHECK (active_minutes IS NULL OR active_minutes >= 0),
  active_kcal numeric(8,2) CHECK (active_kcal IS NULL OR active_kcal >= 0),
  workout_type text,
  distance_meters numeric(10,2) CHECK (distance_meters IS NULL OR distance_meters >= 0)
);

CREATE TABLE sleep_records (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  total_minutes integer NOT NULL CHECK (total_minutes >= 0),
  awake_minutes integer CHECK (awake_minutes IS NULL OR awake_minutes >= 0),
  deep_sleep_minutes integer CHECK (deep_sleep_minutes IS NULL OR deep_sleep_minutes >= 0),
  rem_sleep_minutes integer CHECK (rem_sleep_minutes IS NULL OR rem_sleep_minutes >= 0),
  sleep_score numeric(5,2) CHECK (sleep_score IS NULL OR (sleep_score >= 0 AND sleep_score <= 100)),
  quality_note text
);

CREATE TABLE meal_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  total_kcal numeric(8,2) CHECK (total_kcal IS NULL OR total_kcal >= 0),
  carbs_g numeric(8,2) CHECK (carbs_g IS NULL OR carbs_g >= 0),
  protein_g numeric(8,2) CHECK (protein_g IS NULL OR protein_g >= 0),
  fat_g numeric(8,2) CHECK (fat_g IS NULL OR fat_g >= 0),
  analysis_status text NOT NULL DEFAULT 'manual'
);

CREATE TABLE food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id uuid NOT NULL REFERENCES meal_logs(health_event_id) ON DELETE CASCADE,
  name text NOT NULL,
  serving_amount numeric(8,2),
  serving_unit text,
  kcal numeric(8,2) CHECK (kcal IS NULL OR kcal >= 0),
  carbs_g numeric(8,2) CHECK (carbs_g IS NULL OR carbs_g >= 0),
  protein_g numeric(8,2) CHECK (protein_g IS NULL OR protein_g >= 0),
  fat_g numeric(8,2) CHECK (fat_g IS NULL OR fat_g >= 0),
  confidence_score numeric(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

CREATE TABLE beverage_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  beverage_type text NOT NULL,
  name text,
  volume_ml numeric(8,2) CHECK (volume_ml IS NULL OR volume_ml >= 0),
  kcal numeric(8,2) CHECK (kcal IS NULL OR kcal >= 0),
  sugar_g numeric(8,2) CHECK (sugar_g IS NULL OR sugar_g >= 0),
  caffeine_mg numeric(8,2) CHECK (caffeine_mg IS NULL OR caffeine_mg >= 0),
  analysis_status text NOT NULL DEFAULT 'manual'
);

-- ========== [L3] MEDS / INTERACTION / COSMETICS ==========

CREATE TABLE medication_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  ingredient_name text,
  dose_amount text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE supplement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  ingredient_name text,
  dose_amount text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE intake_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  medication_item_id uuid REFERENCES medication_items(id) ON DELETE SET NULL,
  supplement_item_id uuid REFERENCES supplement_items(id) ON DELETE SET NULL,
  taken_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'taken',
  note text,
  CONSTRAINT intake_logs_has_item CHECK (medication_item_id IS NOT NULL OR supplement_item_id IS NOT NULL)
);

CREATE TABLE interaction_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_level interaction_risk_level NOT NULL DEFAULT 'unknown',
  summary text NOT NULL,
  recommendation text NOT NULL,
  evidence_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interaction_check_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_check_id uuid NOT NULL REFERENCES interaction_checks(id) ON DELETE CASCADE,
  medication_item_id uuid REFERENCES medication_items(id) ON DELETE CASCADE,
  supplement_item_id uuid REFERENCES supplement_items(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  CONSTRAINT interaction_check_items_has_item CHECK (medication_item_id IS NOT NULL OR supplement_item_id IS NOT NULL)
);

CREATE TABLE cosmetic_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  product_type text,
  skin_type_target text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cosmetic_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cosmetic_product_id uuid NOT NULL REFERENCES cosmetic_products(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  safety_level text NOT NULL DEFAULT 'unknown',
  effect_summary text,
  caution_summary text
);

CREATE TABLE cosmetic_usage_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  cosmetic_product_id uuid NOT NULL REFERENCES cosmetic_products(id) ON DELETE CASCADE,
  body_area text,
  reaction_note text
);
