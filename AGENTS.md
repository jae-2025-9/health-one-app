<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# health-one-app (건강 one app)

## Purpose
Planning and design repository for **건강 one app**, a backend-first personal health-management app that records life factors affecting the body (activity, sleep, meals, beverages, medication/supplements, cosmetic ingredients) into a single `health_events` timeline and analyzes them with AI. This repo contains **design artifacts only** — database schema (DDL), API specification, ERD, OpenAPI contract, wireframes, and a contract-validation script. There is no application runtime code yet.

## Key Files
| File | Description |
|------|-------------|
| `README.md` | Project intro, v1 design direction, and index of all deliverables (Korean) |
| `.gitignore` | Ignores `.DS_Store` and backup spreadsheet files |
| `건강_one_app_발표자료.pptx` | Presentation deck for the team/stakeholder session |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `db/` | PostgreSQL schema (DDL) — the canonical data model (see `db/AGENTS.md`) |
| `docs/` | Product brief, ERD, API spec, OpenAPI JSON, team docs, wireframes (see `docs/AGENTS.md`) |
| `scripts/` | Contract-validation tooling that keeps schema/API/ERD in sync (see `scripts/AGENTS.md`) |
| `backend/` | NestJS + Prisma implementation of the **L3** safety domain (meds/interaction/cosmetics) (see `backend/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- This is a **design/planning repo**, not a coded application — changes are to specs, schema, and docs, not to running services.
- The data model is the source of truth: `db/schema.sql` (snake_case) and `docs/openapi.json` are the "frozen" shared assets. Domain detail tables hang off the common `health_events` table.
- Keep documents consistent across `db/schema.sql`, `docs/openapi.json`, `docs/API_SPEC.md`, and `docs/ERD.md` — `scripts/validate_contracts.py` enforces this and is the merge gate.
- Honor the safety principle: medication/supplement/ingredient analysis provides **caution info, not medical diagnosis**, and must include expert-consultation wording for high/unknown risk.
- Documentation is primarily in **Korean**; match the existing language and tone when editing.

### Testing Requirements
- After any change to schema, API spec, ERD, or OpenAPI, run the contract validator:
  ```bash
  python3 scripts/validate_contracts.py
  ```
- Expected success output: `Health One App contracts OK`. A non-zero exit with a `FAIL:` line means an artifact drifted out of sync — fix before committing.

### Common Patterns
- Naming conventions (enforced by team convention, see `docs/TEAM_CONVENTIONS.md`):
  - DB tables/columns: `snake_case` (`health_events`, `risk_level`)
  - API JSON fields: `camelCase` (`riskLevel`, `startedAt`)
  - Schema/type names: `PascalCase` (`HealthEvent`, `ApiMeta`)
  - Enum values: lowercase `snake_case` (`vision_ai`, `cosmetic_usage`)
  - Error codes: `SCREAMING_SNAKE_CASE` (`VALIDATION_ERROR`)
- Team works in 4 lanes / 4 branches (`design/core-auth`, `design/activity-nutrition`, `design/meds-cosmetics`, `design/reminders-reports`); `main` must always pass validation. PR-only merges.

## Dependencies

### Internal
- All artifacts cross-reference the data model defined in `db/schema.sql`.

### External
- PostgreSQL 15+ (target database; uses `pgcrypto` extension)
- Python 3 standard library only (validation script has no third-party dependencies)
- Apple HealthKit / Samsung Health (external data sources synced via the mobile app)

<!-- MANUAL: Add manually maintained project notes below this line; preserved on regeneration. -->
