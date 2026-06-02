# L1 동결 계약

> 상태: L1 코어/인증 레인이 1차 동결했습니다. L2, L3, L4는 이 문서의 항목을 참조만 하고 직접 수정하지 않습니다. 변경이 필요하면 L1에 변경 요청을 올리고, L1이 단독 PR로 반영한 뒤 팀에 공지합니다.

## 동결 범위

### Enum 3종

```text
data_source_type:
  manual | vision_ai | label_scan | apple_health | samsung_health | wearable

health_event_type:
  activity | sleep | meal | beverage | intake | cosmetic_usage | health_sync

interaction_risk_level:
  low | medium | high | unknown
```

OpenAPI schema 이름은 `DataSourceType`, `HealthEventType`, `InteractionRiskLevel`로 고정합니다. 예전/임시 명칭 `RiskLevel`은 사용하지 않습니다.

### 코어 테이블 6종

- `users`
- `user_profiles`
- `data_sources`
- `health_events`
- `media_assets`
- `ai_analysis_results`

`health_events`의 중복 방지와 조회 인덱스도 동결 범위입니다.

```text
health_events_source_external_uidx
health_events_user_time_idx
health_events_user_type_time_idx
```

### 응답 봉투

성공 응답은 항상 `{ data, meta }` 구조를 사용합니다.

```json
{
  "data": {},
  "meta": {
    "requestId": "req_20260525_0001",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

오류 응답은 항상 `{ error, meta }` 구조를 사용합니다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 값이 올바르지 않습니다.",
    "details": []
  },
  "meta": {
    "requestId": "req_20260525_0002",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

OpenAPI schema 이름은 `ApiMeta`, `ApiError`, `ApiErrorResponse`로 고정합니다. OpenAPI의 재사용 response component 이름은 `ErrorResponse`이고, 그 schema는 반드시 `ApiErrorResponse`를 참조합니다.

### 공통 FK 규약

- 사용자 참조 컬럼은 `user_id`로 통일합니다.
- 공통 건강 이벤트 참조 컬럼은 `health_event_id`로 통일합니다.
- `health_events`에 1:1로 붙는 도메인 확장 테이블은 `health_event_id`를 PK로 사용합니다.

## 공유 사용 규칙

`health_events`는 모든 건강 기록의 허브입니다. 도메인 레인은 자기 확장 테이블만 추가하고, 허브 컬럼을 바꾸지 않습니다.

`media_assets`와 `ai_analysis_results`는 L2 식사/음료 분석과 L3 화장품 성분 분석이 함께 사용합니다. 분석 응답은 `analysisId`, 도메인별 draft, `safetyNotice`를 포함하는 형태로 맞춥니다.

`interaction_risk_level`은 L3 상호작용 분석에서만 주로 쓰지만 enum 자체는 L1 동결 자산입니다. JSON 필드는 `riskLevel`로 노출합니다.

## 검증

PR 전에 반드시 실행합니다.

```bash
python3 scripts/validate_contracts.py
```

검증 스크립트는 이 문서, `db/schema.sql`, `docs/openapi.json`, `docs/api/l1-core-auth.md`, `docs/API_SPEC.md`, `docs/ERD.md`가 같은 동결 계약을 가리키는지 확인합니다.
