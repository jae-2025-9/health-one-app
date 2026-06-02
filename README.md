# 건강 one app

건강 one app은 활동량, 식사, 음용, 수면, 약/영양제, 화장품처럼 몸에 영향을 줄 수 있는 생활 인자를 한곳에 기록하고 AI로 분석하는 개인 건강 관리 앱입니다.

## v1 설계 방향

- 백엔드 우선: 직접 입력, 사진/라벨 분석, 알림, 리포트 API를 먼저 설계합니다.
- 전체확장형: 활동, 식사, 음용, 수면, 복용, 화장품 성분까지 v1 도메인에 포함합니다.
- 안전선: 약/영양제/성분 분석은 진단이 아니라 주의 정보, 복용 간격, 전문가 상담 권고를 제공합니다.
- Health API 확장: 모바일 앱이 Apple HealthKit 또는 Samsung Health 데이터를 읽고 서버의 표준 `health_events` 형태로 업로드합니다.

## 산출물

- [팀 세션 공유용 요약](docs/TEAM_SESSION_HANDOFF.md)
- [제품 개요](docs/PRODUCT_BRIEF.md)
- [ERD 다이어그램 SVG](docs/ERD_DIAGRAM.svg)
- [사람이 보기 쉬운 ERD](docs/ERD_VISUAL.md)
- [브라우저용 ERD 보드](docs/ERD_VISUAL.html)
- [ERD 설계](docs/ERD.md)
- [API 명세서](docs/API_SPEC.md)
- [L1 동결 계약](docs/FROZEN_CONTRACTS.md)
- [L1 API 슬라이스](docs/api/l1-core-auth.md)
- [API 명세서 Excel](docs/건강_one_app_API_명세서.xlsx)
- [OpenAPI 3.1 JSON](docs/openapi.json)
- [PostgreSQL DDL](db/schema.sql)
- [Figma용 와이어프레임 SVG](docs/건강_one_app_wireframe_figma.svg)

## 검증

```bash
python3 scripts/validate_contracts.py
```

검증 스크립트는 ERD/API 계획에 들어간 핵심 테이블, 데이터 소스, 엔드포인트, 중복 방지 제약이 산출물에 반영됐는지 확인합니다.
