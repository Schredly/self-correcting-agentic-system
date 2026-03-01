import type { WorkObject } from "../types/agents";

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
