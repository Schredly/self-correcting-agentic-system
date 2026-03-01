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
