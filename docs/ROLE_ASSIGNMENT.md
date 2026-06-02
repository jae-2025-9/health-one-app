# 역할 분배 (ROLE ASSIGNMENT)

> 건강 one app — 4인 팀. 현재 ERD/명세(`db/schema.sql`, `docs/openapi.json`)를 기준으로 한 도메인 분배.
> 한 사람 = 한 레인 = 한 브랜치. 네이밍·머지 규칙은 [`TEAM_CONVENTIONS.md`](./TEAM_CONVENTIONS.md) 참고.

## 한눈에 보기

| 레인 | 담당 | 브랜치 | 핵심 |
|---|---|---|---|
| **L1 · 코어/인증** ⭐ | A (리드) | `design/core-auth` | 모두가 의존하는 코어 + **통합 커스터디언** |
| **L2 · 활동/수면/영양** | B | `design/activity-nutrition` | 활동·수면·식사·음료(+사진분석) |
| **L3 · 복약/상호작용/화장품** | C | `design/meds-cosmetics` | 안전 도메인(복약·상호작용·화장품) |
| **L4 · 알림/리포트/연동** | D (프론트) | `design/reminders-reports` | 집계·소비자-facing + API 계약 검수 |

---

## L1 · 코어/인증 — 담당 A (리드 / 통합 커스터디언)

**테이블**: `users`, `user_profiles`, `data_sources`, **`health_events`** (+ `health_events_source_external_uidx`, `health_events_user_time_idx`, `health_events_user_type_time_idx`), `media_assets`, `ai_analysis_results`

**엔드포인트**: `/auth/signup`, `/auth/login`, `/me/profile` (GET·PATCH), `/health-events` (POST·GET)

**커스터디언 추가 책임** (L1만 수행):
- **공유 자산을 가장 먼저 확정·동결** → 아래 [동결 목록](#동결-목록-frozen) 및 [`FROZEN_CONTRACTS.md`](./FROZEN_CONTRACTS.md) 참고
- `docs/openapi.json` 최종 조립 (각 레인의 `docs/api/<레인>.md` 슬라이스를 통합)
- `scripts/validate_contracts.py` 머지 게이트 운영
- 공유 자산 변경 요청을 단독 PR로 반영 후 팀 공지

**처음 할 일**: enum 3종 + 코어 6테이블 + 응답 봉투(`ApiMeta`/`ApiErrorResponse`)를 확정하고 [`docs/api/l1-core-auth.md`](./api/l1-core-auth.md)에 L1 슬라이스를 남긴 뒤 팀에 "동결" 공지 → 그래야 L2·L3·L4가 그 위에서 설계 시작 가능.

---

## L2 · 활동/수면/영양 — 담당 B

**테이블**: `activity_records`, `sleep_records`, `meal_logs`, `food_items`, `beverage_logs`

**엔드포인트**: `/activities` (POST), `/activities/summary` (GET), `/sleep-records` (POST), `/sleep-records/summary` (GET), `/meals/analyze-image` (POST), `/meals` (POST·GET), `/beverages/analyze-label` (POST), `/beverages` (POST), `/beverages/summary` (GET)

**협의 포인트**: `/meals/analyze-image`·`/beverages/analyze-label`는 `media_assets`/`ai_analysis_results`를 사용. 분석 결과 응답(`analysisId`/`mealDraft`/`beverageDraft`/`safetyNotice`)은 **L1이 정의한 공통 스키마를 그대로** 사용 (L3와도 동일 형태 유지).

**처음 할 일**: L1 동결 완료 후, `activity_records`·`sleep_records`부터(가장 단순) 설계 → 식사/음료 분석으로 확장.

---

## L3 · 복약/상호작용/화장품 — 담당 C (안전 도메인)

**테이블**: `medication_items`, `supplement_items`, `intake_logs`, `interaction_checks`, `interaction_check_items`, `cosmetic_products`, `cosmetic_ingredients`, `cosmetic_usage_logs`

**엔드포인트**: `/intakes/items` (POST), `/intakes/logs` (POST), `/intakes/schedule` (GET), `/interaction-checks` (POST), `/interaction-checks/{id}` (GET), `/cosmetics/analyze-ingredients` (POST), `/cosmetics/usage-logs` (POST)

**협의 포인트**: 의료 안전 도메인 — 모든 분석/상호작용 응답에 **`safetyNotice` 필수**(진단 아님·전문가 상담 권고). `risk_level`은 `interaction_risk_level` enum(`low/medium/high/unknown`) 고정.

**설계 순서(내부 의존)**: `medication_items`·`supplement_items` → `intake_logs` → `interaction_checks`(+`interaction_check_items`). 화장품은 독립.

**처음 할 일**: L1 동결 완료 후, 품목 등록(`/intakes/items`)부터.

---

## L4 · 알림/리포트/연동 — 담당 D (프론트)

**테이블**: `reminder_rules`, `notification_logs`

**엔드포인트**: `/reminders` (POST·GET), `/reminders/{id}` (PATCH), `/reports/daily` (GET), `/reports/weekly` (GET), `/integrations/health-sync` (POST)

**맡는 이유**: 알림·리포트·연동은 전부 **소비자(프론트)-facing & 집계성** → API 계약 정합성을 보며 작업하기 좋음. 프론트 화면 작업과 병행.

**협의 포인트**: `/reports/*`는 전 도메인(L1~L3) 데이터를 집계하므로 **각 도메인 필드명이 확정된 뒤** 리포트 응답을 맞추는 게 안전 → 통합 후반에 정리. `/integrations/health-sync`는 dedup 규칙(`sourceId + externalRecordId`)을 L1의 `health_events` 인덱스와 일치시킬 것.

**처음 할 일**: L1 동결 완료 후, `reminders`(가장 독립적)부터. 동시에 `openapi.json` 기반으로 프론트 화면/목업 진행.

---

## 동결 목록 (FROZEN)

> L1이 1회 정의 후 **잠금**. 나머지 레인은 **참조만**, 수정 금지. 변경 필요 시 L1에게 요청.

- **Enum 3종**: `data_source_type`, `health_event_type`, `interaction_risk_level`
- **코어 테이블 6종**: `users`, `user_profiles`, `data_sources`, `health_events`(+인덱스), `media_assets`, `ai_analysis_results`
- **응답 봉투**: `ApiMeta`, `ApiErrorResponse` (`data`/`meta`/`error` 구조)
- **공통 FK 규약**: `user_id`, `health_event_id` (모든 도메인 테이블이 이 이름으로 참조)

동결 상세와 공지 문구는 [`FROZEN_CONTRACTS.md`](./FROZEN_CONTRACTS.md)에 둔다.

---

## 레인 간 공유/주의 매트릭스

| 공유 자산 | 사용 레인 | 충돌 방지 |
|---|---|---|
| `health_events` (허브) | 전원 | L1 동결, 도메인은 자기 확장 테이블만 추가 |
| `media_assets` / `ai_analysis_results` | L2, L3 | L1 정의 공통 스키마 사용, 분석 응답 형태 통일 |
| `users` / `user_profiles` | 전원(FK) | L1 동결 |
| `db/schema.sql`, `docs/ERD.md` | 전원 | 레인별 구획만 편집 (TEAM_CONVENTIONS §A 참고) |
| `docs/openapi.json` | L1이 조립 | 각자 `docs/api/<레인>.md`에만 작성 |

분배는 팀 상황에 맞게 조정 가능(예: L4의 백엔드 설계는 BE 한 명이 돕고, 프론트는 계약 검수 + 화면에 집중).
