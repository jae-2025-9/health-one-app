# health-one-app — L3 backend (meds / interaction / cosmetics)

NestJS + Prisma backend for **L3**, the medical-safety domain of 건강 one app
(`design/meds-cosmetics` lane). Implements the 7 L3 endpoints from
`docs/openapi.json` and `docs/API_SPEC.md`, on the canonical schema in
`db/schema.sql`.

> **Safety invariant:** every analysis / interaction response carries a
> `safetyNotice` — this is wellness caution info, **not** medical diagnosis;
> high / unknown combinations recommend consulting a professional.

## Endpoints (base prefix `/v1`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/intakes/items` | Register a medication or supplement item |
| POST | `/intakes/logs` | Record an intake (creates `health_events` + `intake_logs`) |
| GET  | `/intakes/schedule?date=YYYY-MM-DD` | Intakes for a date |
| POST | `/interaction-checks` | Caution info for a med/supplement combination |
| GET  | `/interaction-checks/{id}` | Re-read a stored interaction check |
| POST | `/cosmetics/analyze-ingredients` | Analyze ingredient text/image → product + ingredients |
| POST | `/cosmetics/usage-logs` | Record cosmetic usage (creates `health_events` + `cosmetic_usage_logs`) |
| POST | `/ai/questions` | Ask the server-side Upstage Solar Pro assistant |

Liveness: `GET /v1/healthz`.

## Conventions honored (TEAM_CONVENTIONS)
- Response envelope `{ data, meta:{requestId, generatedAt} }`; errors `{ error:{code,message,details}, meta }`.
- DB `snake_case` ↔ JSON `camelCase` (Prisma `@map`); error codes `SCREAMING_SNAKE_CASE`.
- Frozen enums (`enums.ts`) referenced, never redefined.
- `evidence` is the agreed exception alias for `evidence_payload` (§E).

## Quick start

```bash
# 1. install
npm install

# 2. generate the Prisma client (offline — no DB needed)
npm run prisma:generate

# 3. run the unit tests (no DB needed — PrismaService is mocked)
npm test

# --- to actually run the server ---
# 4. start Postgres (Docker) and apply the schema
cp .env.example .env
npm run db:up
npm run prisma:migrate -- --name init
npx prisma db seed        # seeds the dev user

# 5. start the API
npm run start:dev
# → http://localhost:3000/v1
```

### Auth (dev stub)
L1 owns real JWT auth. Until then the acting user is resolved from the
`X-User-Id` header, falling back to `DEV_USER_ID` (see `.env.example`). The
service/controller surface only depends on a `userId: string`, so dropping in
L1's real guard later needs no changes here.

### Upstage AI
`POST /v1/ai/questions` reads `UPSTAGE_API_KEY`, `UPSTAGE_BASE_URL`, and
`UPSTAGE_MODEL` only on the server. Real keys must stay in deployment/local env
vars and must not be committed. If the key is absent, the endpoint returns a
safe service-unavailable envelope instead of leaking provider details.

## Example

```bash
# register two supplements, then check their interaction
curl -s -X POST localhost:3000/v1/intakes/items \
  -H 'content-type: application/json' \
  -d '{"itemType":"supplement","name":"와파린","ingredientName":"Warfarin"}'

curl -s -X POST localhost:3000/v1/interaction-checks \
  -H 'content-type: application/json' \
  -d '{"items":[{"itemType":"supplement","itemId":"<id1>"},{"itemType":"supplement","itemId":"<id2>"}]}'
# → { "data": { "riskLevel": "...", "summary": "...", "recommendation": "...",
#               "evidence": [...], "safetyNotice": "...", "createdAt": "..." },
#     "meta": { "requestId": "req_...", "generatedAt": "..." } }
```

## Layout
```
prisma/schema.prisma        core slice + 8 L3 tables (mapped to db/schema.sql names)
prisma/seed.ts              dev user seed
src/common/                 prisma, response envelope, error filter, auth stub, enums, safety, health-event factory/mapper
src/intakes/                /intakes/* (items, logs, schedule)
src/interaction-checks/     /interaction-checks/* + pluggable risk analyzer
src/cosmetics/              /cosmetics/* + ingredient analyzer
src/main.ts                 bootstrap (global pipe/interceptor/filter, /v1 prefix)
```

## Notes / scope
- The interaction and ingredient analyzers are **deterministic stubs** with a
  stable interface (`analyzeInteractions`, `analyzeIngredientText`) — swap in a
  real clinical / INCI knowledge base without touching controllers or services.
- Prisma owns this slice's migration for standalone running; L1 owns the
  canonical full migration. Table/column names are `@map`'d to match
  `db/schema.sql` exactly, so this layer is compatible with the team schema.

## Known limitations / handoff to L1
- **Auth is a dev stub.** `X-User-Id` is trusted verbatim with a `DEV_USER_ID`
  fallback. All queries are correctly scoped by `userId`, but this MUST be
  replaced by L1's real JWT guard before any non-local deployment. The
  service/controller surface only depends on `userId: string`, so the swap is
  drop-in.
- **`GET /intakes/schedule`** returns intakes recorded for the date (from
  `intake_logs`); truly *scheduled-but-not-taken* reminders live in
  `reminder_rules` (L4) and are out of L3 scope. The day window is currently
  computed in the server's local timezone — for a UTC-deployed server this
  should be computed in the user's timezone (`Asia/Seoul` default) once the
  user profile is available from L1.
- **`POST /cosmetics/analyze-ingredients`** persists a `cosmetic_products` row
  (+ ingredients) so `usage-logs` can reference it. If a read-only analyze is
  later desired, gate persistence behind an explicit flag.
- The interaction unique-index race is handled: a `P2002` on
  `health_events_source_external_uidx` maps to the contract `409 CONFLICT`.
