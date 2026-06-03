<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# docs

## Purpose
All product, design, and team-coordination artifacts for 건강 one app: product brief, ERD (multiple renderings), API specification, the machine-readable OpenAPI contract, wireframes, and team role/convention docs. These documents describe the same system as `db/schema.sql` from different angles and must stay mutually consistent.

## Key Files
| File | Description |
|------|-------------|
| `PRODUCT_BRIEF.md` | Product overview: one-liner, problem, v1 user actions, feature scope, safety principles |
| `ERD.md` | Detailed table/field ERD for implementers (Mermaid), with design principles |
| `ERD_VISUAL.md` | Human-friendly ERD for presentation/team sharing |
| `ERD_VISUAL.html` | Browser-viewable ERD board |
| `ERD_DIAGRAM.svg` / `ERD_DIAGRAM.png` | Rendered ERD diagram images |
| `API_SPEC.md` | Human-readable API spec: base URL, common envelope, auth, endpoints |
| `openapi.json` | OpenAPI 3.1 contract — machine-readable source of API truth (validated) |
| `건강_one_app_API_명세서.xlsx` | API spec in spreadsheet form |
| `ROLE_ASSIGNMENT.md` | 4-person team lane/branch/domain assignment and freeze list |
| `TEAM_CONVENTIONS.md` | Naming, branch & merge rules, conflict-prevention conventions |
| `TEAM_SESSION_HANDOFF.md` | Team session summary: idea, v1 scope, ERD direction, key tables |
| `건강_one_app_wireframe_figma.svg` | Wireframe for Figma import |
| `건강_one_app_wireframe_full.png` | Full wireframe image |

## For AI Agents

### Working In This Directory
- Documentation is primarily in **Korean** — match existing language, tone, and terminology.
- `openapi.json` is a **frozen shared contract**: paths, methods, and core schemas (`ApiMeta`, `ApiErrorResponse`, `HealthEvent`, `InteractionCheck`, `DataSourceType` enum) are checked by the validator. The core/L1 lane assembles the final file from per-lane slices.
- Keep `API_SPEC.md`, `openapi.json`, and `ERD.md` aligned with `db/schema.sql`. The ERD doc must mention every required table by name.
- `API_SPEC.md` must retain safety/dedupe phrases: `진단이 아니라`, `전문가 상담 권고`, `sourceId + externalRecordId` — the validator fails without them.
- API JSON fields use `camelCase`; schema/type names use `PascalCase`.
- When editing the ERD, update both the implementer view (`ERD.md`) and the presentation views (`ERD_VISUAL.md` / `.html`) so they don't drift.

### Testing Requirements
- After editing `openapi.json`, `API_SPEC.md`, or `ERD.md`, run `python3 scripts/validate_contracts.py` from the repo root. It verifies required paths/methods, required component schemas, the data-source enum, safety phrases, and table coverage.

### Common Patterns
- Standard API response envelope: `{ "data": {...}, "meta": { "requestId", "generatedAt" } }`.
- Error envelope: `{ "error": { "code", "message", "details" }, "meta": {...} }`.
- Endpoints are organized by **user action**, not by table.

## Dependencies

### Internal
- Mirrors the data model in `db/schema.sql`.
- `scripts/validate_contracts.py` parses `openapi.json`, `API_SPEC.md`, and `ERD.md`.

### External
- OpenAPI 3.1 (contract format)
- Mermaid (ERD diagrams in Markdown)
- Figma (wireframe import target)

<!-- MANUAL: Add manually maintained doc notes below this line; preserved on regeneration. -->
