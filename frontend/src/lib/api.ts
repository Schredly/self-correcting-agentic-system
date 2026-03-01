import type { WorkObject } from "../types/agents";

// ── Tenant types ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  status: "configured" | "needs-setup";
}

export async function fetchTenants(): Promise<Tenant[]> {
  const res = await fetch("/tenants");

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET /tenants failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<Tenant[]>;
}

// ── Tenant detail types ─────────────────────────────────────────────────────

export interface TenantDetail {
  id: string;
  name: string;
  enabled_adapters: string[];
  status: "draft" | "active";
  created_at: string;
}

export interface CreateTenantParams {
  id: string;
  name: string;
  enabled_adapters: string[];
}

export async function fetchTenant(id: string): Promise<TenantDetail> {
  const res = await fetch(`/tenants/${id}`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET /tenants/${id} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TenantDetail>;
}

export async function createTenant(
  params: CreateTenantParams
): Promise<TenantDetail> {
  const res = await fetch("/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST /tenants failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TenantDetail>;
}

export async function deleteTenant(id: string): Promise<void> {
  const res = await fetch(`/tenants/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE /tenants/${id} failed (${res.status}): ${text}`);
  }
}

// ── Admin types ─────────────────────────────────────────────────────────────

export interface TenantHealth {
  tenant_id: string;
  schema_defined: boolean;
  drive_configured: boolean;
  drive_scaffold_applied: boolean;
  knowledge_synced: boolean;
  servicenow_connected: boolean;
  adapter_mapping_defined: boolean;
  last_run_status: string | null;
}

export interface ClassificationLevelConfig {
  key: string;
  display_name: string;
  required: boolean;
}

export interface ClassificationSchema {
  tenant_id: string;
  levels: ClassificationLevelConfig[];
  version: string;
  updated_at: string;
}

export interface UpsertClassificationSchemaParams {
  levels: ClassificationLevelConfig[];
  version: string;
}

export interface AdapterFieldMapping {
  source_field: string;
  classification_key: string;
}

export interface AdapterMapping {
  tenant_id: string;
  source_system: string;
  record_type: string;
  mappings: AdapterFieldMapping[];
  updated_at: string;
}

export interface UpsertAdapterMappingParams {
  source_system: string;
  record_type: string;
  mappings: AdapterFieldMapping[];
}

export interface GoogleDriveConfig {
  tenant_id: string;
  root_folder_id: string | null;
  status: "not_configured" | "configured";
  updated_at: string;
}

export interface DriveNode {
  kind: "folder" | "file";
  name: string;
  parent_path: string;
  notes: string | null;
}

export interface ScaffoldApplyResult {
  tenant_id: string;
  root_folder_id: string;
  shared_drive_id: string | null;
  created: Record<string, string>;
}

// ── Admin API helpers ───────────────────────────────────────────────────────

export async function fetchTenantHealth(
  tenantId: string
): Promise<TenantHealth> {
  const res = await fetch(`/admin/${tenantId}/health`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/health failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<TenantHealth>;
}

export async function fetchClassificationSchema(
  tenantId: string
): Promise<ClassificationSchema | null> {
  const res = await fetch(`/admin/${tenantId}/classification-schema`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/classification-schema failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<ClassificationSchema>;
}

export async function putClassificationSchema(
  tenantId: string,
  params: UpsertClassificationSchemaParams
): Promise<ClassificationSchema> {
  const res = await fetch(`/admin/${tenantId}/classification-schema`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PUT /admin/${tenantId}/classification-schema failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<ClassificationSchema>;
}

export async function fetchAdapterMapping(
  tenantId: string,
  sourceSystem: string,
  recordType: string
): Promise<AdapterMapping | null> {
  const params = new URLSearchParams({
    source_system: sourceSystem,
    record_type: recordType,
  });
  const res = await fetch(`/admin/${tenantId}/adapter-mappings?${params}`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/adapter-mappings failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<AdapterMapping>;
}

export async function putAdapterMapping(
  tenantId: string,
  params: UpsertAdapterMappingParams
): Promise<AdapterMapping> {
  const res = await fetch(`/admin/${tenantId}/adapter-mappings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PUT /admin/${tenantId}/adapter-mappings failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<AdapterMapping>;
}

export async function fetchGoogleDriveConfig(
  tenantId: string
): Promise<GoogleDriveConfig | null> {
  const res = await fetch(`/admin/${tenantId}/google-drive`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/google-drive failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<GoogleDriveConfig>;
}

export async function putGoogleDriveConfig(
  tenantId: string,
  rootFolderId: string
): Promise<GoogleDriveConfig> {
  const res = await fetch(`/admin/${tenantId}/google-drive`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ root_folder_id: rootFolderId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PUT /admin/${tenantId}/google-drive failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<GoogleDriveConfig>;
}

export async function fetchScaffoldPlan(
  tenantId: string
): Promise<DriveNode[]> {
  const res = await fetch(`/admin/${tenantId}/google-drive/scaffold-plan`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/google-drive/scaffold-plan failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<DriveNode[]>;
}

export async function applyScaffoldPlan(
  tenantId: string,
  rootFolderId?: string,
  sharedDriveId?: string
): Promise<ScaffoldApplyResult> {
  const res = await fetch(`/admin/${tenantId}/google-drive/scaffold-apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      root_folder_id: rootFolderId ?? null,
      shared_drive_id: sharedDriveId ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `POST /admin/${tenantId}/google-drive/scaffold-apply failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<ScaffoldApplyResult>;
}

// ── ServiceNow connector types ───────────────────────────────────────────────

export interface ServiceNowConfig {
  tenant_id: string;
  instance_url: string;
  username: string;
  api_key: string;
  connection_tested: boolean;
  status: "not_configured" | "connected" | "error";
  updated_at: string;
}

export interface UpsertServiceNowConfigParams {
  instance_url: string;
  username: string;
  api_key: string;
}

export interface DiscoveredDimension {
  key: string;
  display_name: string;
  values: string[];
}

export interface DiscoverClassificationResponse {
  dimensions: DiscoveredDimension[];
}

// ── ServiceNow connector API helpers ────────────────────────────────────────

export async function fetchServiceNowConfig(
  tenantId: string
): Promise<ServiceNowConfig | null> {
  const res = await fetch(`/admin/${tenantId}/connectors/servicenow`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /admin/${tenantId}/connectors/servicenow failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<ServiceNowConfig>;
}

export async function putServiceNowConfig(
  tenantId: string,
  params: UpsertServiceNowConfigParams
): Promise<ServiceNowConfig> {
  const res = await fetch(`/admin/${tenantId}/connectors/servicenow`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PUT /admin/${tenantId}/connectors/servicenow failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<ServiceNowConfig>;
}

export async function discoverClassification(
  tenantId: string
): Promise<DiscoverClassificationResponse> {
  const res = await fetch(
    `/admin/${tenantId}/connectors/servicenow/discover-classification`,
    { method: "POST" }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `POST /admin/${tenantId}/connectors/servicenow/discover-classification failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<DiscoverClassificationResponse>;
}

// ── Run types ────────────────────────────────────────────────────────────────

interface CreateRunParams {
  tenant_id: string;
  work_object: WorkObject;
}

interface CreateRunResponse {
  run_id: string;
  status: string;
  tenant_id: string;
}

export async function createRun(
  params: CreateRunParams
): Promise<CreateRunResponse> {
  const res = await fetch("/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST /runs failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CreateRunResponse>;
}
