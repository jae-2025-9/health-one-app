# 건강 one app API 명세서

## 공통 규칙

Base URL:

```text
https://api.health-one.example/v1
```

공통 응답:

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

## 인증

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/auth/signup` | 이메일, 비밀번호, 표시 이름으로 가입합니다. |
| POST | `/auth/login` | 이메일과 비밀번호로 액세스 토큰을 발급합니다. |

## 프로필

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/me/profile` | 사용자의 기본 건강 프로필을 조회합니다. |
| PATCH | `/me/profile` | 키, 몸무게, 알레르기, 건강 메모, 시간대를 수정합니다. |

## 건강 이벤트

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/health-events` | 공통 건강 이벤트를 생성합니다. |
| GET | `/health-events?type=&from=&to=` | 기간과 타입으로 건강 이벤트 타임라인을 조회합니다. |

핵심 필드:

```json
{
  "eventType": "meal",
  "sourceType": "manual",
  "externalRecordId": null,
  "startedAt": "2026-05-25T08:30:00+09:00",
  "endedAt": "2026-05-25T08:50:00+09:00",
  "timezone": "Asia/Seoul",
  "confidenceScore": 1,
  "rawPayload": {}
}
```

## 활동

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/activities` | 걸음 수, 운동 시간, 활동 칼로리를 기록합니다. |
| GET | `/activities/summary` | 일/주 단위 활동 요약을 조회합니다. |

## 수면

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/sleep-records` | 수면 시작/종료, 총 수면 시간, 수면 품질을 기록합니다. |
| GET | `/sleep-records/summary` | 수면 시간과 수면 품질 요약을 조회합니다. |

## 식사

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/meals/analyze-image` | 식사 사진을 업로드하고 음식/칼로리/영양소 추정 결과를 받습니다. |
| POST | `/meals` | 식사와 음식 항목을 확정 저장합니다. |
| GET | `/meals` | 기간별 식사 기록을 조회합니다. |

사진 분석 결과 예시:

```json
{
  "data": {
    "analysisId": "ana_123",
    "mealDraft": {
      "mealType": "breakfast",
      "totalKcal": 620,
      "items": [
        {
          "name": "현미밥",
          "kcal": 310,
          "confidenceScore": 0.82
        }
      ]
    },
    "safetyNotice": "사진 분석 결과는 추정치이며 실제 영양 정보와 다를 수 있습니다."
  },
  "meta": {
    "requestId": "req_20260525_0003",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## 음용

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/beverages/analyze-label` | 음료 라벨 사진에서 용량, 당류, 카페인, 칼로리를 추정합니다. |
| POST | `/beverages` | 물, 커피, 캔음료 등 음용 기록을 저장합니다. |
| GET | `/beverages/summary` | 수분, 카페인, 당류 섭취 요약을 조회합니다. |

## 약/영양제 복용

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/intakes/items` | 약 또는 영양제 품목을 등록합니다. |
| POST | `/intakes/logs` | 실제 복용 여부와 시간을 기록합니다. |
| GET | `/intakes/schedule` | 오늘 또는 특정 날짜의 복용 일정을 조회합니다. |

## 상호작용 확인

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/interaction-checks` | 약/영양제 조합의 주의 정보를 생성합니다. |
| GET | `/interaction-checks/{id}` | 이전 상호작용 확인 결과를 조회합니다. |

응답은 단정적 진단 대신 위험도, 근거 요약, 권고 문구를 포함합니다.
이 기능은 진단이 아니라 건강 관리용 주의정보 제공이며, 고위험 또는 불확실한 조합에는 전문가 상담 권고를 포함합니다.

```json
{
  "data": {
    "riskLevel": "medium",
    "summary": "일부 성분은 함께 복용 시 주의가 필요할 수 있습니다.",
    "recommendation": "복용 간격을 두고, 질환이나 처방약이 있다면 전문가와 상담하세요.",
    "evidence": []
  },
  "meta": {
    "requestId": "req_20260525_0004",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## 화장품

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/cosmetics/analyze-ingredients` | 성분명 텍스트 또는 성분표 사진을 분석합니다. |
| POST | `/cosmetics/usage-logs` | 화장품 사용 부위와 반응 메모를 기록합니다. |

## 알림

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/reminders` | 복용, 수분, 생활 습관 알림 규칙을 생성합니다. |
| GET | `/reminders` | 알림 목록을 조회합니다. |
| PATCH | `/reminders/{id}` | 알림 활성화 여부나 반복 규칙을 수정합니다. |

## 리포트

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/reports/daily` | 하루 활동, 식사, 음용, 수면, 복용 요약을 조회합니다. |
| GET | `/reports/weekly` | 주간 패턴과 주의 포인트를 조회합니다. |

## Health API 동기화

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/integrations/health-sync` | 모바일 앱이 Apple HealthKit 또는 Samsung Health에서 읽은 데이터를 서버 표준 이벤트로 업로드합니다. |

중복 방지:

- 모바일 앱은 HealthKit/Samsung Health의 원본 식별자를 `externalRecordId`로 보냅니다.
- 서버는 `sourceId + externalRecordId`가 이미 존재하면 새 이벤트를 만들지 않고 기존 이벤트를 반환합니다.
