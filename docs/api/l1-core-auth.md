# L1 API 슬라이스 - 코어/인증

> 담당: L1 코어/인증. 이 문서는 `docs/openapi.json`에 반영된 L1 계약의 사람이 읽는 슬라이스입니다. L2, L3, L4는 공통 schema와 응답 봉투를 여기 기준으로 참조합니다.

## 동결된 공통 schema

| Schema | 용도 |
| --- | --- |
| `ApiMeta` | 모든 성공/오류 응답의 추적 메타데이터 |
| `ApiError` | 오류 코드, 메시지, 선택적 세부 정보 |
| `ApiErrorResponse` | `{ error, meta }` 오류 응답 봉투 |
| `ErrorResponse` | OpenAPI 재사용 response component. schema는 `ApiErrorResponse`를 참조 |
| `DataSourceType` | 입력 출처 enum |
| `HealthEventType` | 공통 건강 이벤트 타입 enum |
| `InteractionRiskLevel` | 상호작용 위험도 enum. `RiskLevel` 명칭은 사용하지 않음 |
| `User` | 인증 응답에 포함되는 사용자 요약 |
| `UserProfile` | 내 건강 프로필 |
| `HealthEvent` | 공통 건강 이벤트 허브 |

## 공통 응답

성공 응답:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_20260525_0001",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

오류 응답:

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

## POST /auth/signup

이메일, 비밀번호, 표시 이름으로 계정을 생성합니다.

Request:

```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "displayName": "홍길동"
}
```

Response `201`:

```json
{
  "data": {
    "accessToken": "jwt_access_token",
    "tokenType": "Bearer",
    "user": {
      "id": "018f7b62-1b4e-7d9c-9c5a-5d2e9c44f001",
      "email": "user@example.com",
      "displayName": "홍길동"
    }
  },
  "meta": {
    "requestId": "req_20260525_0001",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## POST /auth/login

이메일과 비밀번호로 access token을 발급합니다.

Request:

```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

Response `200`: `POST /auth/signup`과 같은 `AuthResponse` 구조를 사용합니다.

## GET /me/profile

현재 로그인한 사용자의 건강 프로필을 조회합니다.

Response `200`:

```json
{
  "data": {
    "birthDate": "2000-01-01",
    "sex": "female",
    "heightCm": 165.5,
    "weightKg": 55.2,
    "activityGoal": "daily_8000_steps",
    "timezone": "Asia/Seoul",
    "allergies": ["peanut"],
    "healthNotes": {
      "memo": "카페인 섭취를 줄이는 중"
    }
  },
  "meta": {
    "requestId": "req_20260525_0003",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## PATCH /me/profile

건강 프로필 일부를 수정합니다. 요청 필드는 모두 선택 사항이며, 전달한 필드만 갱신합니다.

Request:

```json
{
  "heightCm": 165.5,
  "weightKg": 55.2,
  "timezone": "Asia/Seoul",
  "allergies": ["peanut"],
  "healthNotes": {
    "memo": "카페인 섭취를 줄이는 중"
  }
}
```

Response `200`: `GET /me/profile`과 같은 `UserProfileResponse` 구조를 사용합니다.

## POST /health-events

도메인 확장 테이블 없이 공통 건강 이벤트만 먼저 생성합니다. L2, L3, L4의 도메인 생성 API도 내부적으로 이 허브를 기준으로 확장됩니다.

Request:

```json
{
  "eventType": "meal",
  "sourceType": "manual",
  "sourceId": null,
  "externalRecordId": null,
  "startedAt": "2026-05-25T08:30:00+09:00",
  "endedAt": "2026-05-25T08:50:00+09:00",
  "timezone": "Asia/Seoul",
  "confidenceScore": 1,
  "rawPayload": {}
}
```

Response `201`:

```json
{
  "data": {
    "eventType": "meal",
    "sourceType": "manual",
    "sourceId": null,
    "externalRecordId": null,
    "startedAt": "2026-05-25T08:30:00+09:00",
    "endedAt": "2026-05-25T08:50:00+09:00",
    "timezone": "Asia/Seoul",
    "confidenceScore": 1,
    "rawPayload": {},
    "id": "018f7b62-1b4e-7d9c-9c5a-5d2e9c44f010",
    "createdAt": "2026-05-25T08:51:00+09:00"
  },
  "meta": {
    "requestId": "req_20260525_0004",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## GET /health-events

공통 타임라인을 이벤트 타입과 기간으로 조회합니다.

Query:

```text
?type=meal&from=2026-05-25T00:00:00+09:00&to=2026-05-26T00:00:00+09:00
```

Response `200`:

```json
{
  "data": [
    {
      "eventType": "meal",
      "sourceType": "manual",
      "sourceId": null,
      "externalRecordId": null,
      "startedAt": "2026-05-25T08:30:00+09:00",
      "endedAt": "2026-05-25T08:50:00+09:00",
      "timezone": "Asia/Seoul",
      "confidenceScore": 1,
      "rawPayload": {},
      "id": "018f7b62-1b4e-7d9c-9c5a-5d2e9c44f010",
      "createdAt": "2026-05-25T08:51:00+09:00"
    }
  ],
  "meta": {
    "requestId": "req_20260525_0005",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## 팀 공지 문구

```text
L1 동결 완료: data_source_type, health_event_type, interaction_risk_level, users/user_profiles/data_sources/health_events/media_assets/ai_analysis_results, ApiMeta/ApiErrorResponse, user_id/health_event_id FK 규약을 동결했습니다. L2-L4는 docs/FROZEN_CONTRACTS.md와 docs/api/l1-core-auth.md를 기준으로 설계해 주세요. 변경 필요 시 L1에 요청해 주세요.
```
