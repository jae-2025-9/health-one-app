# 건강 one app 팀 세션 공유용 요약

## 1. 팀별 아이디어 공유

건강 one app은 활동량, 운동, 식사, 음용, 수면, 약/영양제, 화장품 성분처럼 몸에 영향을 주는 생활 인자를 한 앱에서 기록하고 분석하는 개인 건강 관리 앱입니다.

핵심 차별점은 단순 운동 앱이나 식단 앱이 아니라, 사용자의 하루 건강 인자를 하나의 타임라인으로 합쳐서 "오늘 내 몸에 영향을 준 것"을 한눈에 보여주는 것입니다.

## 2. v1 범위

- 직접 기록: 식사, 음료, 약/영양제, 화장품 사용, 수면, 활동
- 사진/라벨 분석: 식사 사진, 음료 라벨, 화장품 성분표
- AI 분석: 칼로리/영양 추정, 카페인/당류 추정, 성분 주의 정보, 일간/주간 리포트
- 알림: 약/영양제 복용, 수분 섭취, 사용자 지정 생활 알림
- 외부 연동: Apple HealthKit/Samsung Health 데이터는 모바일 앱이 읽어서 서버에 업로드

## 3. ERD 설계 방향

DB 중심은 `users -> health_events`입니다.

모든 기록을 `health_events`에 먼저 저장하고, 세부 정보는 도메인별 테이블에 나눠 저장합니다. 이렇게 하면 식사, 음료, 수면, 복용, 화장품 사용처럼 서로 다른 데이터도 같은 날짜 리포트와 타임라인에서 쉽게 합칠 수 있습니다.

발표용 그림은 [사람이 보기 쉬운 ERD](ERD_VISUAL.md)와 [브라우저용 ERD 보드](ERD_VISUAL.html)를 사용하면 됩니다.

핵심 테이블:

- 공통: `users`, `user_profiles`, `data_sources`, `health_events`
- AI/미디어: `media_assets`, `ai_analysis_results`
- 도메인: `activity_records`, `sleep_records`, `meal_logs`, `food_items`, `beverage_logs`, `medication_items`, `supplement_items`, `intake_logs`, `interaction_checks`, `cosmetic_products`, `cosmetic_ingredients`, `cosmetic_usage_logs`
- 알림: `reminder_rules`, `notification_logs`

외부 Health API 데이터는 `source_id + external_record_id`로 중복 업로드를 막습니다.

## 4. API 명세 방향

API는 DB 테이블 기준이 아니라 사용자 행동 기준으로 나눕니다.

- 인증/프로필: `/auth/signup`, `/auth/login`, `/me/profile`
- 공통 타임라인: `/health-events`
- 활동/수면: `/activities`, `/sleep-records`
- 식사/음료 분석: `/meals/analyze-image`, `/beverages/analyze-label`
- 복용/상호작용: `/intakes/items`, `/intakes/logs`, `/interaction-checks`
- 화장품: `/cosmetics/analyze-ingredients`, `/cosmetics/usage-logs`
- 알림/리포트: `/reminders`, `/reports/daily`, `/reports/weekly`
- Health API 확장: `/integrations/health-sync`

공통 응답 형식:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_20260525_0001",
    "generatedAt": "2026-05-25T10:00:00+09:00"
  }
}
```

## 5. 안전선

약/영양제/성분 분석은 의료 진단이나 처방이 아닙니다. 앱은 주의 정보, 복용 간격 안내, 전문가 상담 권고를 제공하는 웰니스 서비스로 설계합니다.

팀 구현 시 문구 예시:

```text
이 분석은 건강 관리를 위한 참고 정보이며, 진단 또는 처방이 아닙니다.
복용 중인 약이 있거나 질환이 있다면 전문가와 상담하세요.
```

## 6. 세션에서 결정하면 좋은 것

- 팀 프로젝트 v1에서 실제 구현할 최우선 플로우: 식사 사진 분석, 복용 알림, 일간 리포트 중 무엇을 먼저 만들지
- 모바일 Health API 연동을 이번 프로젝트에 실제 구현할지, 아니면 서버 동기화 API까지만 만들지
- AI 분석은 실제 모델 API를 붙일지, 아니면 데모용 규칙/더미 응답으로 시작할지
