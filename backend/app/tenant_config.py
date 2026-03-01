"""In-memory tenant configuration store.

Manages tenants, classification schemas, adapter field mappings, and Google
Drive configs on a per-tenant basis.
"""

from __future__ import annotations

from .models import AdapterMapping, ClassificationSchema, GoogleDriveConfig, Tenant


class TenantConfigStore:
    def __init__(self) -> None:
        self.tenants: dict[str, Tenant] = {}
        self.schemas: dict[str, ClassificationSchema] = {}
        self.adapter_mappings: dict[tuple[str, str, str], AdapterMapping] = {}
        self.drive_configs: dict[str, GoogleDriveConfig] = {}

    # ── Tenant CRUD ───────────────────────────────────────────────────────

    def create_tenant(self, tenant: Tenant) -> Tenant:
        if tenant.id in self.tenants:
            raise ValueError(f"Tenant already exists: {tenant.id}")
        self.tenants[tenant.id] = tenant
        return tenant

    def get_tenant(self, tenant_id: str) -> Tenant | None:
        return self.tenants.get(tenant_id)

    def list_tenants(self) -> list[Tenant]:
        return list(self.tenants.values())

    def delete_tenant(self, tenant_id: str) -> bool:
        if tenant_id not in self.tenants:
            return False
        del self.tenants[tenant_id]
        # Clean up related config
        self.schemas.pop(tenant_id, None)
        self.drive_configs.pop(tenant_id, None)
        keys_to_remove = [k for k in self.adapter_mappings if k[0] == tenant_id]
        for key in keys_to_remove:
            del self.adapter_mappings[key]
        return True

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
