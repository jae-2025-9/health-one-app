/**
 * FROZEN enum values (TEAM_CONVENTIONS §C). Values are snake_case lowercase and
 * are exposed identically in JSON. Mirrored here so validation does not depend
 * on the generated Prisma client and so the frozen vocabulary is referenced in
 * one place. Do NOT change values — request L1 if a change is needed.
 */
export enum DataSourceType {
  manual = 'manual',
  vision_ai = 'vision_ai',
  label_scan = 'label_scan',
  apple_health = 'apple_health',
  samsung_health = 'samsung_health',
  wearable = 'wearable',
}

export enum HealthEventType {
  activity = 'activity',
  sleep = 'sleep',
  meal = 'meal',
  beverage = 'beverage',
  intake = 'intake',
  cosmetic_usage = 'cosmetic_usage',
  health_sync = 'health_sync',
}

export enum InteractionRiskLevel {
  low = 'low',
  medium = 'medium',
  high = 'high',
  unknown = 'unknown',
}

// text status vocab fixed by §C
export enum IntakeStatus {
  scheduled = 'scheduled',
  taken = 'taken',
  skipped = 'skipped',
}

export enum IntakeItemType {
  medication = 'medication',
  supplement = 'supplement',
}

// cosmetic_ingredients.safety_level — §C fixes 'unknown'; 'caution' is an
// analysis-time addition. Values stay snake_case lowercase.
export enum CosmeticSafetyLevel {
  unknown = 'unknown',
  caution = 'caution',
  ok = 'ok',
}

export enum ReminderTargetType {
  intake = 'intake',
  hydration = 'hydration',
  sleep = 'sleep',
  activity = 'activity',
  custom = 'custom',
}

export enum NotificationStatus {
  scheduled = 'scheduled',
  sent = 'sent',
  failed = 'failed',
}
