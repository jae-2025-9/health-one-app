#!/usr/bin/env python3
"""Validate Health One App planning artifacts without external dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "db" / "schema.sql"
OPENAPI_PATH = ROOT / "docs" / "openapi.json"
API_SPEC_PATH = ROOT / "docs" / "API_SPEC.md"
ERD_PATH = ROOT / "docs" / "ERD.md"

REQUIRED_TABLES = {
    "users",
    "user_profiles",
    "data_sources",
    "health_events",
    "media_assets",
    "ai_analysis_results",
    "reminder_rules",
    "notification_logs",
    "activity_records",
    "sleep_records",
    "meal_logs",
    "food_items",
    "beverage_logs",
    "medication_items",
    "supplement_items",
    "intake_logs",
    "interaction_checks",
    "interaction_check_items",
    "cosmetic_products",
    "cosmetic_ingredients",
    "cosmetic_usage_logs",
}

REQUIRED_SOURCE_TYPES = {
    "manual",
    "vision_ai",
    "label_scan",
    "apple_health",
    "samsung_health",
    "wearable",
}

REQUIRED_PATHS = {
    "/auth/signup": {"post"},
    "/auth/login": {"post"},
    "/me/profile": {"get", "patch"},
    "/health-events": {"get", "post"},
    "/activities": {"post"},
    "/activities/summary": {"get"},
    "/sleep-records": {"post"},
    "/sleep-records/summary": {"get"},
    "/meals/analyze-image": {"post"},
    "/meals": {"get", "post"},
    "/beverages/analyze-label": {"post"},
    "/beverages": {"post"},
    "/beverages/summary": {"get"},
    "/intakes/items": {"post"},
    "/intakes/logs": {"post"},
    "/intakes/schedule": {"get"},
    "/interaction-checks": {"post"},
    "/interaction-checks/{id}": {"get"},
    "/cosmetics/analyze-ingredients": {"post"},
    "/cosmetics/usage-logs": {"post"},
    "/reminders": {"get", "post"},
    "/reminders/{id}": {"patch"},
    "/reports/daily": {"get"},
    "/reports/weekly": {"get"},
    "/integrations/health-sync": {"post"},
}


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_text(path: Path) -> str:
    if not path.exists():
        fail(f"missing file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def validate_schema() -> None:
    schema = load_text(SCHEMA_PATH)
    tables = set(re.findall(r"CREATE TABLE ([a-z_]+)", schema))
    missing_tables = REQUIRED_TABLES - tables
    if missing_tables:
        fail(f"schema missing tables: {sorted(missing_tables)}")

    missing_sources = {
        source for source in REQUIRED_SOURCE_TYPES if f"'{source}'" not in schema
    }
    if missing_sources:
        fail(f"schema missing data source enum values: {sorted(missing_sources)}")

    required_health_event_fields = {
        "id uuid PRIMARY KEY",
        "user_id uuid NOT NULL",
        "event_type health_event_type NOT NULL",
        "source_id uuid",
        "started_at timestamptz NOT NULL",
        "ended_at timestamptz",
        "timezone text NOT NULL",
        "confidence_score numeric",
        "raw_payload jsonb NOT NULL",
        "created_at timestamptz NOT NULL",
    }
    missing_fields = {
        field for field in required_health_event_fields if field not in schema
    }
    if missing_fields:
        fail(f"health_events missing required fields: {sorted(missing_fields)}")

    if "health_events_source_external_uidx" not in schema:
        fail("schema missing source_id + external_record_id dedupe index")

    if "전문가" in schema:
        fail("schema should not contain presentation copy")


def validate_openapi() -> None:
    try:
        spec = json.loads(load_text(OPENAPI_PATH))
    except json.JSONDecodeError as exc:
        fail(f"openapi.json is invalid JSON: {exc}")

    paths = spec.get("paths", {})
    for path, methods in REQUIRED_PATHS.items():
        if path not in paths:
            fail(f"OpenAPI missing path: {path}")
        missing_methods = methods - set(paths[path])
        if missing_methods:
            fail(f"OpenAPI path {path} missing methods: {sorted(missing_methods)}")

    schemas = spec.get("components", {}).get("schemas", {})
    for required_schema in ("ApiMeta", "ApiErrorResponse", "HealthEvent", "InteractionCheck"):
        if required_schema not in schemas:
            fail(f"OpenAPI missing schema: {required_schema}")

    source_enum = (
        schemas.get("DataSourceType", {})
        .get("enum", [])
    )
    missing_sources = REQUIRED_SOURCE_TYPES - set(source_enum)
    if missing_sources:
        fail(f"OpenAPI missing data source enum values: {sorted(missing_sources)}")


def validate_docs() -> None:
    api_doc = load_text(API_SPEC_PATH)
    erd_doc = load_text(ERD_PATH)

    for phrase in (
        "진단이 아니라",
        "전문가 상담 권고",
        "sourceId + externalRecordId",
    ):
        if phrase not in api_doc:
            fail(f"API spec missing safety/dedupe phrase: {phrase}")

    for table in REQUIRED_TABLES:
        if table not in erd_doc:
            fail(f"ERD doc missing table name: {table}")


def main() -> int:
    validate_schema()
    validate_openapi()
    validate_docs()
    print("Health One App contracts OK")
    print(f"- tables: {len(REQUIRED_TABLES)}")
    print(f"- endpoints: {sum(len(methods) for methods in REQUIRED_PATHS.values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
