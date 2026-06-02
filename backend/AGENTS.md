<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# backend (L3 — meds / interaction / cosmetics)

## Purpose
NestJS + Prisma (TypeScript) implementation of the **L3 safety domain** of 건강 one app
(`design/meds-cosmetics` lane). Implements the 7 L3 endpoints defined in
`docs/openapi.json` / `docs/API_SPEC.md` against the canonical `db/schema.sql`,
plus the minimal shared scaffolding needed to run standalone.

## Key Files
| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Core slice + 8 L3 tables, `@map`'d to the snake_case names in `db/schema.sql` |
| `prisma/seed.ts` | Seeds the stubbed dev user |
| `src/main.ts` | Bootstrap: global ValidationPipe, response-envelope interceptor, error filter, `/v1` prefix |
| `src/app.module.ts` | Wires PrismaModule + the three L3 feature modules |
| `package.json` | Scripts (`build`, `test`, `prisma:*`, `db:up`), deps, Jest config |
| `docker-compose.yml` | Local Postgres for running the server |
| `README.md` | Setup, endpoints, conventions, examples |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/common/` | Shared infra: prisma, http envelope/filter, auth stub, frozen enums, safety notices, health-event factory/mapper |
| `src/intakes/` | `/intakes/items`, `/intakes/logs`, `/intakes/schedule` |
| `src/interaction-checks/` | `/interaction-checks` (+ `{id}`) and the pluggable risk analyzer |
| `src/cosmetics/` | `/cosmetics/analyze-ingredients`, `/cosmetics/usage-logs` and the ingredient analyzer |

## For AI Agents

### Working In This Directory
- **Safety invariant:** every analysis / interaction response MUST include a `safetyNotice` (not diagnosis; recommend a professional for high/unknown risk). Use `src/common/safety/safety-notice.ts`.
- Never redefine the frozen enums or response envelope — reference `src/common/enums.ts` and the shared interceptor/filter. Changes to frozen assets belong to L1.
- Keep DB `snake_case` ↔ JSON `camelCase` mapping in Prisma `@map`; controllers return the bare `data` payload — the interceptor wraps `{ data, meta }`.
- `evidence` (not `evidencePayload`) is the agreed JSON alias for interaction evidence (TEAM_CONVENTIONS §E exception).
- Endpoints that create a domain event go through `createHealthEvent()` so the `health_events` hub row + dedupe (`source_id`+`external_record_id` → 409) stay consistent.
- The interaction/ingredient analyzers are deterministic **stubs** with a stable interface — replace their data, not their signatures.

### Testing Requirements
- `npm run prisma:generate` (offline, no DB) then `npm test` — unit tests mock `PrismaService`, so they run with **no live database**.
- Pure analyzers and `request-id` have direct unit tests; services are tested with a mocked Prisma client.
- `npm run build` (or `npm run lint` = `tsc --noEmit`) must pass before merge.
- Full run against Postgres: `npm run db:up` → `prisma migrate dev` → `prisma db seed` → `npm run start:dev`.

### Common Patterns
- One feature module = controller + service + dto/ (+ analyzer where there's domain logic).
- Acting user comes from `@CurrentUserId()` (dev stub reads `X-User-Id`, falls back to `DEV_USER_ID`); swap for L1's real guard later with no service changes.
- Errors are thrown as Nest `HttpException`s with `{ code, message }`; the global filter renders the `{ error, meta }` envelope.

## Dependencies

### Internal
- Contract source of truth: `../docs/openapi.json`, `../docs/API_SPEC.md`, `../db/schema.sql`.
- Conventions: `../docs/TEAM_CONVENTIONS.md`, lane ownership: `../docs/ROLE_ASSIGNMENT.md`.

### External
- NestJS 10, Prisma 5, class-validator / class-transformer, Jest + ts-jest, PostgreSQL 15.

<!-- MANUAL: Add manually maintained backend notes below this line; preserved on regeneration. -->
