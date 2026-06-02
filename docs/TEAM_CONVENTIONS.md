# 팀 컨벤션 (TEAM CONVENTIONS)

> 건강 one app — 4인이 각자 브랜치에서 작업 후 머지할 때 **변수명·API명·구조가 어긋나 생기는 오류**를 막기 위한 규칙.
> 역할 분배는 [`ROLE_ASSIGNMENT.md`](./ROLE_ASSIGNMENT.md) 참고.

**대원칙 (기존 파일에 이미 쓰인 방식 그대로):**

| 레이어 | 표기법 | 예시 |
|---|---|---|
| DB 테이블·컬럼 | `snake_case` | `health_events`, `risk_level` |
| API JSON 필드 | `camelCase` | `riskLevel`, `startedAt` |
| 스키마/타입명 | `PascalCase` | `HealthEvent`, `ApiMeta` |
| Enum 값 | `snake_case` 소문자 | `cosmetic_usage`, `vision_ai` |
| 오류 코드 | `SCREAMING_SNAKE_CASE` | `VALIDATION_ERROR` |

---

## A. 브랜치 & 머지 규칙

### 브랜치 모델
- `main` = **항상 검증 통과 상태**. 직접 푸시 금지, PR로만 머지.
- 레인별 브랜치 1개: `design/core-auth`, `design/activity-nutrition`, `design/meds-cosmetics`, `design/reminders-reports`.
- **빅뱅 머지 금지**: 막판에 한 번에 합치지 말 것. 매일 아침 `git pull --rebase origin main`, 저녁 전 작게 머지.

### 충돌 방지 3대 장치

**① 공유 자산 동결** — L1이 enum·코어 테이블·응답 봉투를 먼저 확정 후 잠금. 나머지는 참조만. ([동결 목록](./ROLE_ASSIGNMENT.md#동결-목록-frozen))

**② 파일을 레인별 구획으로 분할** — "같은 파일 같은 줄을 두 명이 안 건드리게":
- **`db/schema.sql`** — 레인 구획 주석 안에서만 추가:
  ```sql
  -- ========== [FROZEN] ENUMS & CORE (L1 only) ==========
  -- ========== [L2] ACTIVITY / SLEEP / NUTRITION ==========
  -- ========== [L3] MEDS / INTERACTION / COSMETICS ==========
  -- ========== [L4] REMINDERS / REPORTS ==========
  ```
- **`docs/ERD.md`** — 동일하게 `<!-- [L2] ... -->` 구획으로 분할.
- **`docs/openapi.json`** — JSON은 주석이 없어 분할 편집이 위험 → 각자 `docs/api/<레인>.md`에 경로+요청/응답 예시를 작성하고, **L1이 통합 시점에 `openapi.json`으로 조립.** 4개 브랜치가 `openapi.json`을 동시에 건드리지 않음.

**③ 네이밍 통일** — 아래 §B~§G 규칙으로 내용 자체가 어긋나지 않게.

### PR 규칙
- PR마다 **`python scripts/validate_contracts.py` 통과 시에만 머지**.
- PR은 작게. 리뷰는 가볍게(몇 시간 내 1인 승인).
- **공유 파일(`schema.sql`·`openapi.json`·응답 봉투·enum)을 건드리는 PR은 머지 전 팀 채널에 한 줄 공지.** 코드/도메인 구획은 자유.

---

## B. DB 네이밍 규칙 (`schema.sql`)

| 대상 | 규칙 | 예시 |
|---|---|---|
| 테이블 | `snake_case` 복수형 | `meal_logs`, `interaction_checks` |
| 컬럼 | `snake_case` | `display_name`, `password_hash` |
| 기본키 | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `users.id` |
| 기본키(1:1 확장) | health_events에 1:1로 붙는 테이블은 `health_event_id`를 PK로 | `activity_records.health_event_id` |
| 외래키 | `<단수형>_id` | `user_id`, `source_id`, `meal_log_id` |
| 타임스탬프 | `timestamptz`, 이름은 `_at`로 끝 | `created_at`, `updated_at`, `taken_at`, `scheduled_at`, `sent_at`, `started_at`, `ended_at` |
| 불리언 | `is_` 접두 | `is_active` |
| 단위 | 접미사로 단위 명시 | `_kg` `_cm` `_g` `_mg` `_ml` `_kcal` `_minutes` `_meters` `_score` |
| JSONB | `_payload` 또는 의미명 | `raw_payload`, `result_payload`, `evidence_payload`, `allergies` |
| 인덱스 | `<테이블>_<컬럼들>_idx` (유니크 `_uidx`) | `health_events_user_time_idx`, `health_events_source_external_uidx` |
| 제약조건 | `<테이블>_<설명>` | `intake_logs_has_item`, `health_events_end_after_start` |

---

## C. Enum / 상태 값 (DB·API 공통 — 변경 금지)

```
data_source_type     : manual | vision_ai | label_scan | apple_health | samsung_health | wearable
health_event_type    : activity | sleep | meal | beverage | intake | cosmetic_usage | health_sync
interaction_risk_level : low | medium | high | unknown
```

text 상태값 어휘(자유 컬럼이지만 값은 아래로 고정):
- `intake_logs.status` : `scheduled` | `taken` | `skipped`
- `notification_logs.status` : `scheduled` | `sent` | `failed`
- `meal_logs.analysis_status` / `beverage_logs.analysis_status` : `manual` | (분석 시 추가)
- `cosmetic_ingredients.safety_level` : `unknown` | (분석 시 추가)

**값은 항상 `snake_case` 소문자. JSON에서도 동일하게 노출** → `"eventType": "cosmetic_usage"`, `"riskLevel": "medium"`.

---

## D. API 경로 규칙 (`openapi.json`)

- `kebab-case` + **복수 명사**: `/sleep-records`, `/interaction-checks`, `/health-events`
- 비-CRUD 동작은 하위 경로(kebab-case): `/meals/analyze-image`, `/beverages/analyze-label`, `/cosmetics/analyze-ingredients`, `/activities/summary`, `/intakes/schedule`
- 경로 파라미터: `/{id}` — 예: `/reminders/{id}`, `/interaction-checks/{id}`
- 쿼리 파라미터: `?type=&from=&to=`

---

## E. API JSON 필드 규칙 (★ 가장 흔한 머지 오류 지점)

- **JSON 필드 = `camelCase`.**
- **DB `snake_case` → JSON `camelCase` 변환 = "밑줄 제거 + 다음 글자 대문자"** (단위 접미사 포함 기계적으로 일관 적용).
- 스키마/타입명 = `PascalCase`: `HealthEvent`, `ApiMeta`, `ApiErrorResponse`, `InteractionRiskLevel`, `InteractionCheck`, `MealDraft`.
- 타임스탬프 = **ISO 8601 + 오프셋** (`2026-05-25T08:30:00+09:00`), 필드명은 `At`로 끝.
- 엔티티 ID = **UUID 문자열**(DB와 동일). `requestId`만 `req_YYYYMMDD_NNNN` 트레이스 형식.

### 고정 매핑표 (전원 동일하게 사용)
| DB (snake) | JSON (camel) | DB (snake) | JSON (camel) |
|---|---|---|---|
| `user_id` | `userId` | `risk_level` | `riskLevel` |
| `health_event_id` | `healthEventId` | `started_at` | `startedAt` |
| `event_type` | `eventType` | `ended_at` | `endedAt` |
| `source_id` | `sourceId` | `total_kcal` | `totalKcal` |
| `source_type` | `sourceType` | `meal_type` | `mealType` |
| `external_record_id` | `externalRecordId` | `carbs_g` | `carbsG` |
| `confidence_score` | `confidenceScore` | `protein_g` | `proteinG` |
| `created_at` | `createdAt` | `caffeine_mg` | `caffeineMg` |
| `updated_at` | `updatedAt` | `volume_ml` | `volumeMl` |
| `display_name` | `displayName` | `height_cm` | `heightCm` |
| `is_active` | `isActive` | `weight_kg` | `weightKg` |
| `target_type` | `targetType` | `taken_at` | `takenAt` |
| `raw_payload` | `rawPayload` | `result_payload` | `resultPayload` |
| `safety_notice` | `safetyNotice` | `evidence_payload` | **`evidence`** ⚠️예외 |

> ⚠️ **예외**: 기존 명세가 상호작용 근거를 `evidence`로 노출 → 예외로 합의·고정. 그 외 `*_payload`는 `rawPayload`/`resultPayload`처럼 기계적 camelCase 유지.

---

## F. 응답 봉투 / 오류 / 상태코드

**성공 응답:**
```json
{
  "data": { },
  "meta": { "requestId": "req_20260525_0001", "generatedAt": "2026-05-25T10:00:00+09:00" }
}
```

**오류 응답:**
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "요청 값이 올바르지 않습니다.", "details": [] },
  "meta": { "requestId": "req_20260525_0002", "generatedAt": "2026-05-25T10:00:00+09:00" }
}
```

- 오류 `code` = `SCREAMING_SNAKE_CASE`: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`
- HTTP 상태: `200`(조회·수정) · `201`(생성) · `400`(검증) · `401`(인증) · `404`(없음) · `409`(중복/dedup 충돌) · `422`(처리불가)
- **분석/상호작용 응답엔 `safetyNotice` 필수** — 진단이 아니라 건강 관리용 주의정보, 고위험·불확실 조합엔 전문가 상담 권고 포함.

---

## G. 요청 ↔ DB 형태 차이 (혼동 금지)

요청 바디와 테이블 컬럼이 1:1이 아닌 경우가 있음:
- `POST /health-events`는 `sourceType` + `externalRecordId`를 받음 → 서버가 `data_sources`를 찾아/만들어 **`source_id`로 저장**. (요청 형태 ≠ 테이블 형태)
- `mealDraft` / `beverageDraft` = **확정 전 분석 초안** 객체(저장 전 단계). 확정은 `POST /meals` · `POST /beverages`.
- dedup: `POST /integrations/health-sync`에서 `sourceId + externalRecordId`가 이미 있으면 새로 만들지 않고 기존 이벤트 반환 (`health_events_source_external_uidx`와 일치).

---

## H. 검증 절차 & PR 전 체크리스트

**머지 게이트 (필수):**
```bash
python scripts/validate_contracts.py
```
→ 테이블 21개 · 엔드포인트 29개(operation, 경로 25개) · enum · 안전 디스클레이머 · dedup 인덱스 일치 확인. **통과해야 머지.** (통과 시 `Health One App contracts OK` 출력)

**PR 올리기 전 셀프 체크:**
- [ ] DB 컬럼이 `snake_case`인가? 단위 접미사(`_kg/_ml/...`)를 붙였나?
- [ ] JSON 필드가 `camelCase`인가? §E 매핑표를 따랐나?
- [ ] enum/상태 값이 §C 목록과 정확히 같은가?(오타·대소문자)
- [ ] 새 응답이 `{ data, meta }` 봉투를 쓰는가? 오류는 `{ error, meta }`인가?
- [ ] 분석/상호작용 응답에 `safetyNotice`가 있나?
- [ ] 공유 파일(schema/openapi/enum/봉투)을 건드렸다면 팀에 공지했나?
- [ ] `validate_contracts.py` 통과하나?

**통합 시 위반 탐지 팁** — JSON 예시 안에 `snake_case` 키가 남아있는지 점검:
```bash
# docs 안의 JSON 예시에서 camelCase여야 할 자리에 _id" / _at" 등이 남아있으면 위반 의심
grep -rnE '"[a-z]+_[a-z_]+"\s*:' docs/api/ docs/*.md
```

L1 동결 기준은 [`FROZEN_CONTRACTS.md`](./FROZEN_CONTRACTS.md)와 [`docs/api/l1-core-auth.md`](./api/l1-core-auth.md)를 먼저 확인한다.
