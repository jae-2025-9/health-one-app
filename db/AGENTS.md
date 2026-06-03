<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# db

## Purpose
Holds the canonical PostgreSQL data model for 건강 one app. The schema is backend-first and is the **source of truth** that the OpenAPI contract, API spec, and ERD docs must stay consistent with.

## Key Files
| File | Description |
|------|-------------|
| `schema.sql` | Full PostgreSQL 15+ DDL: enums, 21 tables, indexes, and the source/external dedupe constraint |

## For AI Agents

### Working In This Directory
- Target database: **PostgreSQL 15+**; relies on the `pgcrypto` extension (`gen_random_uuid()`).
- All records flow through the common `health_events` table; domain detail tables (`activity_records`, `sleep_records`, `meal_logs`, `food_items`, `beverage_logs`, `intake_logs`, `cosmetic_usage_logs`, etc.) reference it.
- Core enums are **frozen shared assets**: `data_source_type`, `health_event_type`, `interaction_risk_level`. Changing them requires updating `docs/openapi.json` and notifying the team (L1/core lane owns these).
- Duplicate ingestion from external Health APIs is prevented by `health_events_source_external_uidx` (source_id + external_record_id) — do not remove it; the validator checks for it.
- Use `snake_case` for all table and column names.
- Do **not** put presentation/marketing copy in the schema — the validator fails if it finds such strings.
- `schema.sql` is split into lane-scoped comment sections so multiple branches can add tables without colliding (see `docs/TEAM_CONVENTIONS.md`).

### Testing Requirements
- After editing `schema.sql`, run `python3 scripts/validate_contracts.py` from the repo root. It checks that all required tables, the data-source enum values, required `health_events` fields, and the dedupe index are present.

### Common Patterns
- Tables use `uuid` primary keys defaulting to `gen_random_uuid()`.
- Timestamps are `timestamptz`; events carry `started_at`, optional `ended_at`, and `timezone`.
- AI-derived rows store a `confidence_score`; raw ingestion payloads are kept in `jsonb` (`raw_payload`).

## Dependencies

### Internal
- `docs/openapi.json`, `docs/API_SPEC.md`, and `docs/ERD.md` must mirror the tables/enums defined here.
- `scripts/validate_contracts.py` reads this file to enforce required tables and constraints.

### External
- PostgreSQL 15+, `pgcrypto` extension.

<!-- MANUAL: Add manually maintained schema notes below this line; preserved on regeneration. -->
