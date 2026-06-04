-- L2 activity / sleep / nutrition schema slice.
-- Keeps the L1 frozen health_events dedup index explicit for Prisma-managed DBs.

CREATE UNIQUE INDEX IF NOT EXISTS health_events_source_external_uidx
  ON health_events(source_id, external_record_id)
  WHERE source_id IS NOT NULL AND external_record_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS activity_records (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  steps integer CHECK (steps IS NULL OR steps >= 0),
  active_minutes integer CHECK (active_minutes IS NULL OR active_minutes >= 0),
  active_kcal numeric(8,2) CHECK (active_kcal IS NULL OR active_kcal >= 0),
  workout_type text,
  distance_meters numeric(10,2) CHECK (distance_meters IS NULL OR distance_meters >= 0)
);

CREATE TABLE IF NOT EXISTS sleep_records (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  total_minutes integer NOT NULL CHECK (total_minutes >= 0),
  awake_minutes integer CHECK (awake_minutes IS NULL OR awake_minutes >= 0),
  deep_sleep_minutes integer CHECK (deep_sleep_minutes IS NULL OR deep_sleep_minutes >= 0),
  rem_sleep_minutes integer CHECK (rem_sleep_minutes IS NULL OR rem_sleep_minutes >= 0),
  sleep_score numeric(5,2) CHECK (sleep_score IS NULL OR (sleep_score >= 0 AND sleep_score <= 100)),
  quality_note text
);

CREATE TABLE IF NOT EXISTS meal_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  total_kcal numeric(8,2) CHECK (total_kcal IS NULL OR total_kcal >= 0),
  carbs_g numeric(8,2) CHECK (carbs_g IS NULL OR carbs_g >= 0),
  protein_g numeric(8,2) CHECK (protein_g IS NULL OR protein_g >= 0),
  fat_g numeric(8,2) CHECK (fat_g IS NULL OR fat_g >= 0),
  analysis_status text NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS food_items (
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

CREATE TABLE IF NOT EXISTS beverage_logs (
  health_event_id uuid PRIMARY KEY REFERENCES health_events(id) ON DELETE CASCADE,
  beverage_type text NOT NULL,
  name text,
  volume_ml numeric(8,2) CHECK (volume_ml IS NULL OR volume_ml >= 0),
  kcal numeric(8,2) CHECK (kcal IS NULL OR kcal >= 0),
  sugar_g numeric(8,2) CHECK (sugar_g IS NULL OR sugar_g >= 0),
  caffeine_mg numeric(8,2) CHECK (caffeine_mg IS NULL OR caffeine_mg >= 0),
  analysis_status text NOT NULL DEFAULT 'manual'
);
