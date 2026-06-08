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
FROZEN_PATH = ROOT / "docs" / "FROZEN_CONTRACTS.md"
L1_API_SLICE_PATH = ROOT / "docs" / "api" / "l1-core-auth.md"

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

REQUIRED_SOURCE_TYPES = (
    "manual",
    "vision_ai",
    "label_scan",
    "apple_health",
    "samsung_health",
    "wearable",
)

REQUIRED_HEALTH_EVENT_TYPES = (
    "activity",
    "sleep",
    "meal",
    "beverage",
    "intake",
    "cosmetic_usage",
    "health_sync",
)

REQUIRED_INTERACTION_RISK_LEVELS = (
    "low",
    "medium",
    "high",
    "unknown",
)

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
    "/ai/questions": {"post"},
    "/reminders": {"get", "post"},
    "/reminders/{id}": {"patch"},
    "/reports/daily": {"get"},
    "/reports/weekly": {"get"},
    "/integrations/health-sync": {"post"},
}

FROZEN_SCHEMA_MARKERS = (
    "-- ========== [FROZEN] ENUMS & CORE (L1 only) ==========",
    "-- ========== [L2] ACTIVITY / SLEEP / NUTRITION ==========",
    "-- ========== [L3] MEDS / INTERACTION / COSMETICS ==========",
    "-- ========== [L4] REMINDERS / REPORTS ==========",
)

L1_OPENAPI_PATHS = {
    "/auth/signup": {"post"},
    "/auth/login": {"post"},
    "/me/profile": {"get", "patch"},
    "/health-events": {"get", "post"},
}

ENVELOPE_VALIDATED_PATHS = {
    **L1_OPENAPI_PATHS,
    "/ai/questions": {"post"},
}


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_text(path: Path) -> str:
    if not path.exists():
        fail(f"missing file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def assert_exact_values(label: str, actual: list[str], expected: tuple[str, ...]) -> None:
    if actual == list(expected):
        return

    expected_set = set(expected)
    actual_set = set(actual)
    missing = sorted(expected_set - actual_set)
    extra = sorted(actual_set - expected_set)
    if missing or extra:
        fail(
            f"{label} mismatch: expected {list(expected)}, got {actual}; "
            f"missing={missing}, extra={extra}"
        )

    fail(f"{label} order mismatch: expected {list(expected)}, got {actual}")


def extract_pg_enum_values(schema: str, enum_name: str) -> list[str]:
    match = re.search(
        rf"CREATE TYPE {re.escape(enum_name)} AS ENUM\s*\((.*?)\);",
        schema,
        flags=re.DOTALL,
    )
    if not match:
        fail(f"schema missing enum type: {enum_name}")
    return re.findall(r"'([^']+)'", match.group(1))


def assert_schema_pattern(label: str, schema: str, pattern: str) -> None:
    if not re.search(pattern, schema, flags=re.DOTALL):
        fail(f"schema missing or changed {label}")


def resolve_local_ref(spec: dict, node: dict, context: str) -> dict:
    ref = node.get("$ref")
    if not ref:
        return node
    if not ref.startswith("#/"):
        fail(f"{context} uses non-local ref: {ref}")

    current = spec
    for part in ref[2:].split("/"):
        if not isinstance(current, dict) or part not in current:
            fail(f"{context} has unresolved ref: {ref}")
        current = current[part]
    if not isinstance(current, dict):
        fail(f"{context} ref does not resolve to an object: {ref}")
    return current


def success_response_codes(responses: dict) -> list[str]:
    return sorted(code for code in responses if code.startswith("2"))


def validate_data_meta_envelope(spec: dict, response_ref_or_inline: dict, context: str) -> None:
    response = resolve_local_ref(spec, response_ref_or_inline, context)
    schema = (
        response.get("content", {})
        .get("application/json", {})
        .get("schema")
    )
    if not isinstance(schema, dict):
        fail(f"{context} must define an application/json success schema")

    schema = resolve_local_ref(spec, schema, context)
    required = set(schema.get("required", []))
    if {"data", "meta"} - required:
        fail(f"{context} success schema must require data and meta")

    properties = schema.get("properties", {})
    meta = properties.get("meta", {})
    if meta.get("$ref") != "#/components/schemas/ApiMeta":
        fail(f"{context} success schema meta must reference ApiMeta")


def validate_error_response_component(spec: dict) -> None:
    responses = spec.get("components", {}).get("responses", {})
    error_response = responses.get("ErrorResponse")
    if not isinstance(error_response, dict):
        fail("OpenAPI missing reusable response: ErrorResponse")
    schema = (
        error_response.get("content", {})
        .get("application/json", {})
        .get("schema", {})
    )
    if schema.get("$ref") != "#/components/schemas/ApiErrorResponse":
        fail("OpenAPI ErrorResponse must reference ApiErrorResponse schema")


def validate_schema() -> None:
    schema = load_text(SCHEMA_PATH)
    for marker in FROZEN_SCHEMA_MARKERS:
        if marker not in schema:
            fail(f"schema missing lane marker: {marker}")

    tables = set(re.findall(r"CREATE TABLE ([a-z_]+)", schema))
    missing_tables = REQUIRED_TABLES - tables
    if missing_tables:
        fail(f"schema missing tables: {sorted(missing_tables)}")

    assert_exact_values(
        "schema data_source_type enum",
        extract_pg_enum_values(schema, "data_source_type"),
        REQUIRED_SOURCE_TYPES,
    )
    assert_exact_values(
        "schema health_event_type enum",
        extract_pg_enum_values(schema, "health_event_type"),
        REQUIRED_HEALTH_EVENT_TYPES,
    )
    assert_exact_values(
        "schema interaction_risk_level enum",
        extract_pg_enum_values(schema, "interaction_risk_level"),
        REQUIRED_INTERACTION_RISK_LEVELS,
    )

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

    assert_schema_pattern(
        "health_events_source_external_uidx definition",
        schema,
        r"CREATE UNIQUE INDEX health_events_source_external_uidx\s+"
        r"ON health_events\(source_id, external_record_id\)\s+"
        r"WHERE source_id IS NOT NULL AND external_record_id IS NOT NULL;",
    )
    assert_schema_pattern(
        "health_events_user_time_idx definition",
        schema,
        r"CREATE INDEX health_events_user_time_idx\s+"
        r"ON health_events\(user_id, started_at DESC\);",
    )
    assert_schema_pattern(
        "health_events_user_type_time_idx definition",
        schema,
        r"CREATE INDEX health_events_user_type_time_idx\s+"
        r"ON health_events\(user_id, event_type, started_at DESC\);",
    )

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
    for required_schema in (
        "ApiMeta",
        "ApiError",
        "ApiErrorResponse",
        "DataSourceType",
        "HealthEventType",
        "InteractionRiskLevel",
        "User",
        "UserProfile",
        "HealthEvent",
        "InteractionCheck",
    ):
        if required_schema not in schemas:
            fail(f"OpenAPI missing schema: {required_schema}")

    if "RiskLevel" in schemas:
        fail("OpenAPI should use InteractionRiskLevel instead of generic RiskLevel")

    validate_error_response_component(spec)

    assert_exact_values(
        "OpenAPI DataSourceType enum",
        schemas.get("DataSourceType", {}).get("enum", []),
        REQUIRED_SOURCE_TYPES,
    )
    assert_exact_values(
        "OpenAPI HealthEventType enum",
        schemas.get("HealthEventType", {}).get("enum", []),
        REQUIRED_HEALTH_EVENT_TYPES,
    )
    assert_exact_values(
        "OpenAPI InteractionRiskLevel enum",
        schemas.get("InteractionRiskLevel", {}).get("enum", []),
        REQUIRED_INTERACTION_RISK_LEVELS,
    )

    for path, methods in ENVELOPE_VALIDATED_PATHS.items():
        for method in methods:
            operation = paths[path].get(method, {})
            default_response = operation.get("responses", {}).get("default", {})
            if default_response.get("$ref") != "#/components/responses/ErrorResponse":
                fail(f"OpenAPI operation {method.upper()} {path} must reference ErrorResponse")
            responses = operation.get("responses", {})
            for code in success_response_codes(responses):
                validate_data_meta_envelope(
                    spec,
                    responses[code],
                    f"OpenAPI operation {method.upper()} {path} response {code}",
                )


def validate_docs() -> None:
    api_doc = load_text(API_SPEC_PATH)
    erd_doc = load_text(ERD_PATH)
    frozen_doc = load_text(FROZEN_PATH)
    l1_api_doc = load_text(L1_API_SLICE_PATH)

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

    for phrase in (
        "L1 동결 계약",
        "data_source_type",
        "health_event_type",
        "interaction_risk_level",
        "ApiMeta",
        "ApiErrorResponse",
        "ErrorResponse",
        "RiskLevel",
        "user_id",
        "health_event_id",
        "health_events_source_external_uidx",
    ):
        if phrase not in frozen_doc:
            fail(f"frozen contract doc missing phrase: {phrase}")

    for phrase in (
        "L1 API 슬라이스",
        "POST /auth/signup",
        "POST /auth/login",
        "GET /me/profile",
        "PATCH /me/profile",
        "POST /health-events",
        "GET /health-events",
        "InteractionRiskLevel",
        "ErrorResponse",
        "RiskLevel",
        "팀 공지 문구",
    ):
        if phrase not in l1_api_doc:
            fail(f"L1 API slice missing phrase: {phrase}")


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
