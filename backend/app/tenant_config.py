"""In-memory tenant configuration store.

Manages classification schemas, adapter field mappings, and Google Drive
configs on a per-tenant basis.
"""

from __future__ import annotations

from .models import AdapterMapping, ClassificationSchema, GoogleDriveConfig


class TenantConfigStore:
    def __init__(self) -> None:
        self.tenants: dict[str, str] = {}  # tenant_id → display_name
        self.schemas: dict[str, ClassificationSchema] = {}
        self.adapter_mappings: dict[tuple[str, str, str], AdapterMapping] = {}
        self.drive_configs: dict[str, GoogleDriveConfig] = {}

    # ── Tenant registry ───────────────────────────────────────────────────

    def register_tenant(self, tenant_id: str, name: str) -> None:
        self.tenants[tenant_id] = name

    def list_tenants(self) -> dict[str, str]:
        return dict(self.tenants)

    # ── Classification schema ────────────────────────────────────────────

    def get_schema(self, tenant_id: str) -> ClassificationSchema | None:
        if not tenant_id:
            return None
        return self.schemas.get(tenant_id)

    def upsert_schema(self, schema: ClassificationSchema) -> None:
        if not schema.tenant_id:
            raise ValueError("tenant_id must not be empty")
        self.schemas[schema.tenant_id] = schema

    # ── Adapter mappings ─────────────────────────────────────────────────

    def get_adapter_mapping(
        self, tenant_id: str, source_system: str, record_type: str
    ) -> AdapterMapping | None:
        if not tenant_id:
            return None
        return self.adapter_mappings.get((tenant_id, source_system, record_type))

    def list_adapter_mappings(self, tenant_id: str) -> list[AdapterMapping]:
        if not tenant_id:
            return []
        return [m for k, m in self.adapter_mappings.items() if k[0] == tenant_id]

    def upsert_adapter_mapping(self, mapping: AdapterMapping) -> None:
        if not mapping.tenant_id:
            raise ValueError("tenant_id must not be empty")
        key = (mapping.tenant_id, mapping.source_system, mapping.record_type)
        self.adapter_mappings[key] = mapping

    # ── Google Drive config ──────────────────────────────────────────────

    def get_drive_config(self, tenant_id: str) -> GoogleDriveConfig | None:
        if not tenant_id:
            return None
        return self.drive_configs.get(tenant_id)

    def upsert_drive_config(self, config: GoogleDriveConfig) -> None:
        if not config.tenant_id:
            raise ValueError("tenant_id must not be empty")
        self.drive_configs[config.tenant_id] = config
