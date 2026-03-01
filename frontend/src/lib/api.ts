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
