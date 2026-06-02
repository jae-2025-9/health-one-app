<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# scripts

## Purpose
Tooling that keeps the planning artifacts consistent. Currently holds the contract validator that acts as the merge gate: it confirms the core tables, data sources, endpoints, required schemas, dedupe constraints, and safety phrasing agreed in the ERD/API plan are all reflected across `db/schema.sql`, `docs/openapi.json`, `docs/API_SPEC.md`, and `docs/ERD.md`.

## Key Files
| File | Description |
|------|-------------|
| `validate_contracts.py` | Dependency-free Python 3 validator for schema/OpenAPI/API spec/ERD consistency |

## For AI Agents

### Working In This Directory
- The script uses **only the Python 3 standard library** (`json`, `re`, `sys`, `pathlib`) — keep it dependency-free so it runs anywhere, including CI/merge gates.
- It resolves paths relative to the repo root via `Path(__file__).resolve().parents[1]`; run it from anywhere but the targets are fixed (`db/schema.sql`, `docs/openapi.json`, `docs/API_SPEC.md`, `docs/ERD.md`).
- The expected/required sets are encoded as module constants: `REQUIRED_TABLES`, `REQUIRED_SOURCE_TYPES`, `REQUIRED_PATHS`. When the data model legitimately changes, **update these constants in the same change** so the gate stays accurate.
- On any mismatch the script prints `FAIL: ...` to stderr and exits non-zero (via `fail()` / `SystemExit(1)`); success prints `Health One App contracts OK` plus table/endpoint counts.

### Testing Requirements
- Run the validator itself as the test:
  ```bash
  python3 scripts/validate_contracts.py
  ```
- A green run (`Health One App contracts OK`, exit 0) is the bar for merging to `main`.

### Common Patterns
- Three independent check groups — `validate_schema()`, `validate_openapi()`, `validate_docs()` — invoked from `main()`. Add new invariants as a new check function or by extending the relevant constant set.
- Schema checks are regex/substring based against the raw SQL text (e.g. `CREATE TABLE ([a-z_]+)`); OpenAPI checks parse JSON structurally.

## Dependencies

### Internal
- Reads and enforces `db/schema.sql`, `docs/openapi.json`, `docs/API_SPEC.md`, `docs/ERD.md`.

### External
- Python 3 (standard library only).

<!-- MANUAL: Add manually maintained script notes below this line; preserved on regeneration. -->
