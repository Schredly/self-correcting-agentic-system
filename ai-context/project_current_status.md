# Project Current Status

****
**2026-03-01 12:00 UTC** — GoogleDriveProvider implementation and scaffold-apply wiring

- `ca7c192` — Implement GoogleDriveProvider and wire scaffold-apply endpoint
- **`backend/pyproject.toml`** (updated) — Added `google-api-python-client>=2.100.0`, `google-auth>=2.25.0`, `google-auth-httplib2>=0.2.0`
- **`backend/app/google_drive_provider.py`** (new) — Concrete `DriveProvider` implementation using Google Drive API v3:
  - Auth via service account JSON key (`google.oauth2.service_account.Credentials`)
  - `_find_by_name(name, parent_id, mime_type)` — idempotent lookup by name + parent, returns existing ID or None
  - `ensure_folder(name, parent_id)` — search-then-create, returns existing folder ID if found (idempotent)
  - `ensure_file(name, parent_id, content_type, content_bytes)` — search-then-create-or-update, overwrites media if file exists
  - Shared Drive support: `supportsAllDrives=True`, `includeItemsFromAllDrives=True`, `corpora="drive"`, `driveId` on list queries
  - All sync Google API calls wrapped with `asyncio.to_thread` to avoid blocking the event loop
- **`backend/app/models.py`** (updated) — Added `ScaffoldApplyRequest` model: `root_folder_id: str | None`, `shared_drive_id: str | None`
- **`backend/app/tenant_config.py`** (updated) — Added `list_adapter_mappings(tenant_id) -> list[AdapterMapping]` for serializing all mappings for a tenant
- **`backend/app/main.py`** (updated) — `POST /admin/{tenant_id}/google-drive/scaffold-apply` fully wired:
  1. Validates tenant_id, requires classification schema (404 if missing)
  2. Resolves `root_folder_id` from request body or existing Drive config (400 if neither)
  3. Reads `GOOGLE_SERVICE_ACCOUNT_FILE` env var (500 if unset)
  4. Creates `GoogleDriveProvider`, applies scaffold plan via `DriveScaffolder`
  5. Uploads `classification_schema.json` and `adapter_mappings.json` into `_schema/` folder
  6. Updates `TenantConfigStore` Drive config to `status="configured"`
  7. Returns `{ tenant_id, root_folder_id, shared_drive_id, created: {path→drive_id} }`
- **`.gitignore`** (updated) — Added `backend/credentials/`
- **`backend/README.md`** (new) — Setup instructions, service account configuration, curl examples for scaffold-plan and scaffold-apply
- **`backend/tests/test_drive_scaffolder.py`** (updated) — Replaced old 501 test with 3 new endpoint tests: 400 without root_folder_id, 404 without schema, 500 without credentials env var (25 tests total)
****

****
**2026-03-01 11:30 UTC** — Drive scaffolder test suite

- `1df5ae8` — Add tests for Drive scaffolder and scaffold endpoints
- **`backend/tests/__init__.py`** (new) — test package init
- **`backend/tests/test_drive_scaffolder.py`** (new) — 23 tests across 3 classes:
  - `TestBuildScaffoldPlan` (12 tests) — missing schema 404, return types, all-folders kind, fixed structure names, dimension folders match schema levels, notes contain classification keys, parent path consistency, determinism, zero levels edge case, many levels (5), tenant isolation (shared root but isolated subtrees), documents-last ordering
  - `TestApplyScaffoldPlan` (6 tests) — calls provider for each folder, returns path→id mapping, root_folder_id passthrough, None default, child parent_id resolution from accumulated map, missing schema 404
  - `TestScaffoldEndpoints` (5 tests) — GET scaffold-plan 200 with seeded schema, 404 without schema, 422 on empty tenant_id, POST scaffold-apply 501, response shape validation (kind/name/parent_path fields)
- **`FakeProvider`** — in-memory `DriveProvider` implementation for testing, tracks calls list and auto-increments folder IDs
- Run: `cd backend && python3.11 -m pytest tests/test_drive_scaffolder.py -v`
****

****
**2026-03-01 11:00 UTC** — Drive scaffolding planner and provider interface

- `4b020b1` — Add Drive scaffolding planner and provider interface
- **`backend/app/drive_provider.py`** (new) — Two exports:
  - `DriveNode` — Pydantic model with `kind` ("folder"|"file"), `name`, `parent_path`, optional `notes`. Represents one node in a scaffold plan.
  - `DriveProvider` — `typing.Protocol` defining the abstract storage backend interface. Two async methods: `ensure_folder(name, parent_id) -> str` (idempotent create-or-reuse), `ensure_file(name, parent_id, content_type, content_bytes) -> str` (upload-or-overwrite). No concrete implementation yet (awaiting Google OAuth).
- **`backend/app/drive_scaffolder.py`** (new) — `DriveScaffolder` class, takes `TenantConfigStore` at init:
  - `build_scaffold_plan(tenant_id) -> list[DriveNode]` — loads tenant's `ClassificationSchema`, raises HTTP 404 if missing, returns deterministic folder plan:
    - `AgenticKnowledge/` (top-level root)
    - `AgenticKnowledge/{tenant_id}/` (tenant root)
    - `AgenticKnowledge/{tenant_id}/_schema/` (schema metadata)
    - `AgenticKnowledge/{tenant_id}/dimensions/` (classification dimensions)
    - `AgenticKnowledge/{tenant_id}/dimensions/{level.display_name}/` (one per schema level)
    - `AgenticKnowledge/{tenant_id}/documents/` (ingested documents)
  - `apply_scaffold_plan(tenant_id, provider, root_folder_id) -> dict[str, str]` — fully implemented against `DriveProvider` protocol but not wired to any endpoint yet. Walks the plan in order, resolves parent IDs from accumulated folder_ids map, returns `path -> provider_id` mapping.
- **`backend/app/main.py`** (updated) — Added `DriveScaffolder` import and module-level `drive_scaffolder` instance. Two new endpoints:
  - `GET /admin/{tenant_id}/google-drive/scaffold-plan` — dry-run, returns JSON array of `DriveNode` dicts. Reuses `_validate_tenant_id()`. Returns 404 if no classification schema configured for tenant.
  - `POST /admin/{tenant_id}/google-drive/scaffold-apply` — returns 501 Not Implemented with detail `"Google Drive auth/provider not configured yet"`. Reuses `_validate_tenant_id()`.
- **No OAuth, no Google SDK, no frontend changes** — purely backend scaffolding layer.
****

****
**2026-03-01 10:00 UTC** — Tenant admin configuration endpoints

- `4e2fa07` — Add tenant-level admin configuration endpoints
- **`backend/app/models.py`** (updated) — Added 5 new Pydantic models for tenant admin config:
  - `ClassificationLevelConfig` — key, display_name, required (defines one level in the N-level taxonomy)
  - `ClassificationSchema` — tenant_id, levels[], version, updated_at
  - `AdapterFieldMapping` — source_field, classification_key (one field-to-key mapping)
  - `AdapterMapping` — tenant_id, source_system, record_type, mappings[], updated_at
  - `GoogleDriveConfig` — tenant_id, root_folder_id, status ("configured"/"not_configured"), updated_at
- **`backend/app/tenant_config.py`** (new) — `TenantConfigStore` in-memory store with get/upsert methods for all three config types. Adapter mappings keyed by `(tenant_id, source_system, record_type)` tuple. All mutators validate non-empty tenant_id.
- **`backend/app/main.py`** (updated) — Added `TenantConfigStore` instance at module level, `_validate_tenant_id()` helper (422 on empty/whitespace), and 6 admin endpoints:
  - `GET /admin/{tenant_id}/classification-schema` — returns schema or 404
  - `PUT /admin/{tenant_id}/classification-schema` — upserts with server-set `updated_at`
  - `GET /admin/{tenant_id}/adapter-mappings?source_system=&record_type=` — returns mapping or 404
  - `PUT /admin/{tenant_id}/adapter-mappings` — upserts keyed by (tenant, source, type)
  - `GET /admin/{tenant_id}/google-drive` — returns config or 404
  - `PUT /admin/{tenant_id}/google-drive` — upserts, auto-sets status from root_folder_id presence
- **Cross-tenant isolation**: each GET only returns data for the requested tenant_id; no data leakage between tenants.
****

****
**2026-03-01 09:30 UTC** — Frontend wired to REST + tenant-aware WebSocket

- `3e672d6` — Wire frontend to create runs via REST and subscribe with tenant_id
- **`frontend/src/lib/api.ts`** (new) — `createRun()` fetch helper using relative `/runs` path (goes through Vite proxy). Throws on non-2xx with status and body.
- **`frontend/src/hooks/useAgentRun.ts`** (updated) — Signature changed to `useAgentRun(runId: string | null, tenantId: string)`. Returns `{ run: null, status: "disconnected" }` when `runId` is null. WebSocket URL now uses `location.host` (Vite proxy) with `?tenant_id=` query param. Effect depends on both `runId` and `tenantId`.
- **`frontend/src/app/screens/AgentConsole.tsx`** (updated) — No longer hardcodes `demo-run-1`. On mount calls `createRun({ tenant_id: "demo-tenant", work_object: DEMO_WORK_OBJECT })`, stores returned `run_id` in state, passes it to `useAgentRun(runId, tenantId)`. Shows error state if `createRun` fails. All layout/styling/components unchanged.
- **Full end-to-end flow now works**: Frontend POSTs to create run → backend creates run + starts orchestrator → frontend subscribes to WebSocket with tenant_id → events stream in real-time.
****

****
**2026-03-01 09:00 UTC** — Tenant isolation enforced

- `9e97c45` — Enforce tenant isolation on REST and WebSocket endpoints
- **`backend/app/main.py`** (updated) — All run-scoped endpoints now enforce tenant isolation:
  - `POST /runs` response now includes `tenant_id` in response body (`{ run_id, status, tenant_id }`)
  - `GET /runs/{run_id}` requires `?tenant_id=` query param; returns 404 on mismatch (no existence leaking)
  - `WebSocket /runs/{run_id}/events` requires `?tenant_id=` query param; rejects with HTTP 403 on mismatch or missing param
  - Demo run seeded with `tenant_id="demo-tenant"` (changed from `"tenant-acme-corp"`)
- **Frontend note**: `useAgentRun` does not yet pass `tenant_id` — frontend will need updating to include `?tenant_id=demo-tenant` in WebSocket URL
****

****
**2026-03-01 08:30 UTC** — EventBus + Orchestrator refactor

- `fc8be7f` — Add EventBus + Orchestrator, make WebSocket subscriber-only
- **`backend/app/event_bus.py`** (new) — In-memory per-run event bus with `subscribe(run_id)`, `unsubscribe(run_id, queue)`, `publish(run_id, message)`. Maintains per-run event history so late-joining WebSocket clients get full replay on connect.
- **`backend/app/orchestrator.py`** (new) — `Orchestrator` class with `start_run(run_id)` (launches asyncio task) and `_execute_run(run_id)` (marks run as running via RunManager, publishes `run_started` from RunManager's authoritative AgentRun, iterates `simulate_skill_events()` publishing each message to EventBus, marks completed/failed in RunManager).
- **`backend/app/run_manager.py`** (updated) — Added `mark_running(run_id)` method. `create_run` now accepts optional `run_id` parameter (falls back to UUID).
- **`backend/app/simulation.py`** (updated) — Renamed `_build_work_object` → `build_demo_work_object` (public). Added `simulate_skill_events(run_id)` — yields only `skill_update` + `run_completed` (no `run_started`), for use by Orchestrator. Original `simulate_demo_run` preserved.
- **`backend/app/main.py`** (rewritten) — Instantiates `RunManager`, `EventBus`, `Orchestrator` at module level. Lifespan handler seeds and starts `demo-run-1` on startup so frontend works out of the box. `POST /runs` now triggers `orchestrator.start_run()`. Added `GET /runs/{run_id}` (returns AgentRun, 404 if missing). WebSocket is now subscriber-only: validates run exists (closes 1008 if not), subscribes to EventBus, streams from queue, closes after terminal events.
- **Architecture shift**: WebSocket no longer drives execution — it only subscribes to events. Execution is triggered by `POST /runs` and managed by the Orchestrator via EventBus.
****

## What exists on disk (pushed to `origin/main`)

### Repository
- **Repo:** `https://github.com/Schredly/self-correcting-agentic-system.git`
- **Branch:** `main`
- **Commits:**
  - `77bfed6` — Initial commit: `.gitignore` + frontend source tree
  - `e8b7a0b` — Replace mock data with real-time WebSocket data layer
  - `128b0e9` — Add frontend toolchain: Vite 6, Tailwind v4, TypeScript strict
  - `5ff0080` — Update project status doc with toolchain details
  - `ada9436` — Add FastAPI WebSocket backend with simulated demo run
  - `b96a700` — Add Python build artifacts to .gitignore
  - `14cfdea` — Update project status doc with backend implementation details
  - `ae23bf4` — Add RunManager class and POST /runs endpoint
  - `c853adf` — Populate ai-context architecture docs (01–09) and update status doc
  - `284b8da` — Update project status doc with RunManager and ai-context details
  - `fc8be7f` — Add EventBus + Orchestrator, make WebSocket subscriber-only
  - `f43ef9c` — Update project status doc with EventBus + Orchestrator details
  - `9e97c45` — Enforce tenant isolation on REST and WebSocket endpoints
  - `2e192d4` — Update project status doc with tenant isolation details
  - `3e672d6` — Wire frontend to create runs via REST and subscribe with tenant_id
  - `9e63522` — Update project status doc with frontend REST + WebSocket wiring
  - `4e2fa07` — Add tenant-level admin configuration endpoints
  - `4b020b1` — Add Drive scaffolding planner and provider interface
  - `1df5ae8` — Add tests for Drive scaffolder and scaffold endpoints
  - `ca7c192` — Implement GoogleDriveProvider and wire scaffold-apply endpoint

### Directory structure
```
self-correcting-agentic-system/
├── .gitignore                  # excludes .DS_Store, node_modules/, dist/, .env, __pycache__/, *.egg-info/, backend/credentials/
├── ai-context/                 # architecture docs (00–10) + project_current_status.md
├── backend/
│   ├── pyproject.toml          # fastapi, uvicorn, pydantic, google-api-python-client, google-auth
│   ├── README.md               # Setup docs, Google Drive integration guide, curl examples
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_drive_scaffolder.py  # 25 tests: scaffold plan, apply, endpoints
│   └── app/
│       ├── __init__.py
│       ├── event_bus.py        # In-memory per-run EventBus with history replay
│       ├── drive_provider.py    # DriveProvider protocol + DriveNode model
│       ├── drive_scaffolder.py  # DriveScaffolder — builds folder plans from tenant schema
│       ├── google_drive_provider.py  # GoogleDriveProvider — Drive v3 + service account + Shared Drive
│       ├── main.py             # FastAPI app + WebSocket (subscriber) + REST + admin + scaffold endpoints + CORS
│       ├── models.py           # Pydantic models mirroring frontend TS types + admin config + ScaffoldApplyRequest
│       ├── orchestrator.py     # Orchestrator — drives execution, publishes to EventBus
│       ├── run_manager.py      # RunManager — in-memory run lifecycle (create, get, running, complete, fail)
│       ├── simulation.py       # Async generators for timed demo events (~25s)
│       └── tenant_config.py    # TenantConfigStore — in-memory per-tenant admin config + list_adapter_mappings
└── frontend/
    ├── index.html              # Vite entry HTML
    ├── package.json            # 43 deps, scripts: dev/build/preview
    ├── package-lock.json
    ├── tsconfig.json           # strict mode, @/* path alias
    ├── vite.config.ts          # React + Tailwind v4 plugins, dev proxy to :8000
    └── src/
        ├── main.tsx            # React root mount + CSS import
        ├── types/
        │   └── agents.ts       # canonical types (WorkObject, AgentRun, SkillExecution, AgentEvent, etc.)
        ├── state/
        │   └── agentReducer.ts # reducer for AgentRun state (run_started, skill_update, run_completed, run_failed)
        ├── lib/
        │   └── api.ts          # createRun() fetch helper (POST /runs via Vite proxy)
        ├── hooks/
        │   └── useAgentRun.ts  # WebSocket hook with tenant_id, nullable runId, reconnect
        ├── app/
        │   ├── App.tsx
        │   ├── routes.ts
        │   ├── screens/
        │   │   ├── AgentConsole.tsx          # live data via useAgentRun (no mock data)
        │   │   ├── EvaluationDashboard.tsx
        │   │   ├── AdapterConfiguration.tsx
        │   │   ├── ClassificationManager.tsx
        │   │   └── KnowledgeAlignment.tsx
        │   └── components/
        │       ├── Layout.tsx
        │       ├── SkillDetailDrawer.tsx     # uses canonical SkillExecution type
        │       ├── figma/
        │       │   └── ImageWithFallback.tsx
        │       └── ui/                      # shadcn/ui primitives (~40 files)
        └── styles/
            ├── index.css       # imports fonts, tailwind, theme
            ├── tailwind.css    # Tailwind v4 CSS-first config (@import 'tailwindcss', @source, tw-animate-css)
            ├── theme.css       # CSS variables, @theme inline, @layer base
            └── fonts.css       # (empty placeholder)
```

---

## Canonical types (`frontend/src/types/agents.ts`)

These are the shared types the entire frontend must use:

```typescript
export interface WorkObject {
  work_id: string
  source_system: "servicenow" | "jira" | "salesforce" | string
  record_type: string
  title: string
  description: string
  classification: ClassificationLevel[]
  metadata?: Record<string, any>
}

export interface ClassificationLevel {
  name: string
  value: string
}

export interface AgentRun {
  run_id: string
  tenant_id: string
  status: "queued" | "running" | "completed" | "failed"
  started_at: string
  completed_at?: string
  work_object: WorkObject
  skills: SkillExecution[]
}

export interface SkillExecution {
  skill_id: string
  name: string
  state: "idle" | "thinking" | "retrieving" | "planning" | "executing" | "verifying" | "complete" | "error"
  summary: string
  confidence?: number
  details?: SkillDetails
}

export interface SkillDetails {
  inputs?: Record<string, any>
  context_sources?: string[]
  plan_steps?: string[]
  tool_calls?: string[]
  outputs?: string
}

export interface AgentEvent {
  run_id: string
  skill_id: string
  event_type: "thinking" | "retrieval" | "planning" | "tool_call" | "tool_result" | "memory_write" | "verification" | "complete" | "error"
  summary: string
  confidence?: number
  timestamp: string
  metadata?: Record<string, any>
}
```

---

## What was completed

1. **Repo initialized** — git init, remote set to GitHub, initial commit pushed.
2. **`.gitignore` created** — excludes `.DS_Store`, `node_modules/`, `dist/`, `.env`.
3. **`agentReducer.ts` created** at `frontend/src/state/agentReducer.ts`:
   - Handles actions: `run_started`, `skill_update`, `run_completed`, `run_failed`
   - Maps `AgentEvent.event_type` → `SkillExecution.state` (e.g. `"thinking"` → `"thinking"`, `"retrieval"` → `"retrieving"`, `"tool_call"` → `"executing"`, etc.)
   - Merges event metadata into `SkillDetails` (inputs, context_sources, plan_steps, tool_calls, outputs)
   - If a `skill_update` arrives for an unknown `skill_id`, appends a new skill entry
   - Fully immutable, type-safe, uses `AgentAction` discriminated union
4. **`useAgentRun.ts` created** at `frontend/src/hooks/useAgentRun.ts`:
   - Accepts `runId: string`, opens WebSocket to `ws://localhost:8000/runs/{runId}/events`
   - Dispatches incoming JSON as `AgentAction` into the reducer
   - Exposes `{ run: AgentRun | null, status: ConnectionStatus }`
   - `ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"`
   - Reconnects with exponential backoff (1s → 2s → 4s → … capped at 30s)
   - Cleans up on unmount via `mountedRef` guard
5. **`AgentConsole.tsx` rewritten** — mock data fully removed:
   - Removed local `Skill` interface, `mockWorkObject`, `mockSkills`
   - Initializes with `const { run, status } = useAgentRun("demo-run-1")`
   - Shows loading spinner + connection status message while `run` is `null`
   - `StatusIcon` handles all `SkillExecution["state"]` values (idle/thinking/retrieving/planning/executing/verifying/complete/error)
   - `ConfidenceBadge` handles optional `confidence?: number`
   - `SkillCard` renders from `SkillExecution` fields (`skill_id`, `state`, `summary`, `details?.plan_steps`)
   - Left panel renders from `run.work_object` (WorkObject shape, `ClassificationLevel[]` with `.value`, metadata holds priority/assignedTo)
   - Right panel status dot reflects `run.status` dynamically (running → green pulse, completed → green solid, failed → red, queued → gray)
   - Layout, styling, component names — all unchanged
6. **`SkillDetailDrawer.tsx` rewritten** — uses canonical types:
   - Replaced local `Skill` interface with imported `SkillExecution` from `../../types/agents`
   - Inputs → `details?.inputs` (Record, JSON.stringify)
   - Knowledge → `details?.context_sources` (string[], simple list)
   - Plan → `details?.plan_steps` (string[], same numbered rendering)
   - Tools → `details?.tool_calls` (string[], simple list)
   - Outputs → `details?.outputs` (string, rendered directly)
   - Layout and styling unchanged
7. **FastAPI WebSocket backend implemented** (`ada9436`):
   - `backend/app/models.py` — Pydantic models mirroring all frontend TS types (`WorkObject`, `AgentRun`, `AgentEvent`, `SkillExecution`, etc.) plus WebSocket envelope models (`RunStartedMessage`, `SkillUpdateMessage`, `RunCompletedMessage`, `RunFailedMessage`)
   - `backend/app/simulation.py` — Async generator `simulate_demo_run(run_id)` yields 31 messages (1 `run_started`, 29 `skill_update`s across 4 skills, 1 `run_completed`) with realistic `asyncio.sleep()` delays totaling ~25 seconds
   - Demo scenario: ServiceNow defective-item return (Sarah Johnson, order ORD-98234, SKU ACM-2847-BLK)
   - 4 skills: Classification Validator (0.94), Vendor Attribution (0.98), Policy Retrieval (0.87), Resolution Recommender (0.91)
   - Each skill progresses: thinking → retrieval → planning → tool_call → tool_result → verification → complete
   - Metadata keys match `mergeDetails()`: `inputs`, `sources`, `steps`, `tool`, `outputs`
   - `skill_id` values are human-readable (used as display `name` by reducer line 86)
   - `backend/app/main.py` — FastAPI app with `GET /health`, `WebSocket /runs/{run_id}/events`, CORS for `http://localhost:3000`, error handling sends `run_failed` on exception
   - `backend/pyproject.toml` — deps: `fastapi>=0.115.0`, `uvicorn[standard]>=0.34.0`, `pydantic>=2.0.0`
   - Run with: `cd backend && pip install -e . && uvicorn app.main:app --reload --port 8000`
8. **`.gitignore` updated** (`b96a700`) — added `__pycache__/` and `*.egg-info/`
9. **RunManager introduced** (`ae23bf4`):
   - `backend/app/run_manager.py` — `RunManager` class with in-memory `dict[str, AgentRun]` store
   - Methods: `create_run(work_object, tenant_id)` (UUID generation, status="queued"), `get_run(run_id)`, `mark_completed(run_id)`, `mark_failed(run_id, error)`
   - Separates run lifecycle management from WebSocket streaming
   - `backend/app/main.py` updated with `POST /runs` endpoint (accepts `{ tenant_id, work_object }`, returns `{ run_id, status }`, HTTP 201)
   - WebSocket endpoint unchanged — still uses simulation.py directly
10. **ai-context docs populated** (`c853adf`) — architecture principles (01), canonical data model (02), event stream contract (03), adapter model (04), multi-tenant model (05), UI contract rules (06), skill execution model (07), evaluation model (08), non-goals (09)
11. **EventBus + Orchestrator refactor** (`fc8be7f`):
    - WebSocket is now subscriber-only — no longer drives execution directly
    - `EventBus` broadcasts events to all subscribers with per-run history replay for late joiners
    - `Orchestrator` drives execution: marks run running, publishes `run_started` from RunManager, iterates simulation, publishes events, marks completed/failed
    - `POST /runs` triggers `orchestrator.start_run()` immediately after creation
    - `GET /runs/{run_id}` returns current AgentRun state (404 if missing)
    - Demo run `demo-run-1` auto-seeded and started on server startup via lifespan handler
    - `RunManager.mark_running()` added, `create_run()` accepts optional `run_id`
    - `simulation.py` exports `build_demo_work_object()` and `simulate_skill_events()` (skill_updates + run_completed only)
12. **Tenant isolation enforced** (`9e97c45`):
    - `GET /runs/{run_id}` requires `?tenant_id=` query param; 404 on mismatch (no existence leaking), 422 if param missing
    - `WebSocket /runs/{run_id}/events` requires `?tenant_id=` query param; rejects HTTP 403 on mismatch or missing
    - `POST /runs` response now returns `{ run_id, status, tenant_id }`
    - Demo run seeded with `tenant_id="demo-tenant"`
    - Frontend not yet updated — needs `?tenant_id=demo-tenant` added to WebSocket URL
13. **Frontend wired to REST + tenant-aware WebSocket** (`3e672d6`):
    - `frontend/src/lib/api.ts` — `createRun()` fetch helper via Vite proxy
    - `useAgentRun(runId: string | null, tenantId: string)` — nullable runId, tenant_id query param, uses `location.host` for Vite proxy
    - `AgentConsole.tsx` — on mount calls `createRun()` with `TENANT_ID` and `DEMO_WORK_OBJECT`, stores run_id in state, passes to hook
    - No more hardcoded `demo-run-1` — each page load creates a fresh run
    - Full end-to-end flow: POST /runs → orchestrator starts → WebSocket subscribes with tenant_id → events stream
15. **Tenant admin configuration endpoints** (`4e2fa07`):
    - `TenantConfigStore` — in-memory store for classification schemas, adapter mappings, Google Drive configs
    - 6 admin endpoints under `/admin/{tenant_id}/` — GET + PUT for each config type
    - Adapter mappings keyed by (tenant_id, source_system, record_type) triple
    - Google Drive status auto-derived from root_folder_id presence
    - All endpoints validate non-empty tenant_id (422), return 404 when config not found
    - Cross-tenant isolation: no data leakage between tenants
16. **Drive scaffolding planner and provider interface** (`4b020b1`):
    - `DriveProvider` protocol — vendor-agnostic async interface (`ensure_folder`, `ensure_file`)
    - `DriveNode` model — Pydantic model for scaffold plan nodes (kind, name, parent_path, notes)
    - `DriveScaffolder` — loads tenant `ClassificationSchema`, builds deterministic folder tree plan
    - Scaffold structure: `AgenticKnowledge/{tenant_id}/` with `_schema/`, `dimensions/{level}/`, `documents/`
    - `apply_scaffold_plan()` implemented against protocol but not endpoint-wired (awaiting OAuth)
    - `GET /admin/{tenant_id}/google-drive/scaffold-plan` — dry-run returns plan as JSON
    - `POST /admin/{tenant_id}/google-drive/scaffold-apply` — returns 501 until Google auth configured
17. **GoogleDriveProvider and scaffold-apply wiring** (`ca7c192`):
    - `GoogleDriveProvider` — concrete Drive v3 implementation with service account auth, Shared Drive support, `asyncio.to_thread` wrapping
    - `ScaffoldApplyRequest` model — `root_folder_id`, `shared_drive_id`
    - `TenantConfigStore.list_adapter_mappings()` — list all adapter mappings for a tenant
    - `POST scaffold-apply` fully wired: validates schema + root_folder_id + credentials, creates folders, uploads `classification_schema.json` + `adapter_mappings.json` into `_schema/`, updates Drive config status
    - Credentials via `GOOGLE_SERVICE_ACCOUNT_FILE` env var, `backend/credentials/` git-ignored
    - `backend/README.md` with setup docs and curl examples
18. **Frontend toolchain set up** (`128b0e9`):
   - `package.json` — 43 dependencies, scripts: `dev`, `build`, `preview`
   - `tsconfig.json` — strict mode, bundler resolution, `@/*` path alias, `noUncheckedIndexedAccess`
   - `vite.config.ts` — `@vitejs/plugin-react` + `@tailwindcss/vite`, `@/` alias, dev server on port 3000 with proxy to `localhost:8000` (API + WebSocket)
   - `index.html` — Vite entry HTML
   - `src/main.tsx` — React 19 `createRoot`, imports `./styles/index.css`
   - **No `tailwind.config.ts`** — Tailwind v4 is CSS-first (config lives in `tailwind.css` and `theme.css`)
   - `npm install` succeeded — 238 packages, 0 vulnerabilities
   - `vite build` succeeded — 2751 modules, 289 KB gzipped JS, 15 KB gzipped CSS, 2.1s build
   - TS type-check passes for all project files (pre-existing errors in untouched screens only)

### Backend toolchain details
| Tool | Version | Notes |
|------|---------|-------|
| FastAPI | 0.115+ | WebSocket + REST endpoints |
| Uvicorn | 0.34+ | ASGI server with `--reload` |
| Pydantic | 2.x | Models with `model_dump()` serialization |
| google-api-python-client | 2.100+ | Google Drive API v3 |
| google-auth | 2.25+ | Service account credentials |
| Python | 3.11+ | Required by pyproject.toml |

### Frontend toolchain details
| Tool | Version | Notes |
|------|---------|-------|
| Vite | 6.x | Dev server + build |
| React | 19.x | With react-dom |
| TypeScript | 5.7+ | Strict mode |
| Tailwind CSS | 4.x | CSS-first, `@tailwindcss/vite` plugin |
| tw-animate-css | 1.2+ | Animation utilities |
| motion | 12.x | Animation library (formerly framer-motion) |
| react-router | 7.x | `createBrowserRouter` + `RouterProvider` |
| Radix UI | latest | 27 primitives |
| shadcn/ui | — | Built on Radix, source in `ui/` |
| lucide-react | 0.469+ | Icon library |
| recharts | 2.15+ | Data visualization |

---

## What still needs to be done

### Backend
- **Event-driven architecture complete** — EventBus + Orchestrator + RunManager + subscriber-only WebSocket
- **Tenant isolation enforced** — all run-scoped endpoints require `tenant_id`
- **Demo simulation works end-to-end** — `POST /runs` triggers execution, WebSocket streams events with history replay
- **Tenant admin config endpoints complete** — classification schema, adapter mappings, Google Drive config (GET + PUT each)
- **Drive scaffolding planner complete** — `DriveProvider` protocol, `DriveScaffolder` builds deterministic folder plans, dry-run endpoint live
- **GoogleDriveProvider complete** — concrete Drive v3 implementation with service account auth, Shared Drive support, scaffold-apply fully wired
- Next: replace scripted simulation with real agent orchestration (LLM-driven skills)
- Next: persistent storage (replace in-memory RunManager and TenantConfigStore)
- Next: authentication layer (currently tenant_id is a query param, not token-derived)
- Next: wire frontend admin screens (ClassificationManager, AdapterConfiguration) to admin endpoints

### Frontend
- **Frontend fully wired** — creates runs via REST, subscribes with tenant_id
- Each page load creates a fresh run (no hardcoded run_id)
- Next: make work object configurable (currently hardcoded demo data in AgentConsole)

### Other screens
- `EvaluationDashboard.tsx`, `AdapterConfiguration.tsx`, `ClassificationManager.tsx`, `KnowledgeAlignment.tsx` — still have their own data needs (not addressed yet)
- These screens have pre-existing TS errors (unused imports, type mismatches) that should be cleaned up when they are wired to real data

### Pre-existing TS errors in untouched screens
- `ClassificationManager.tsx` — unused imports (motion, Settings2, Eye, EyeOff, ChevronUp), ref type mismatch, unused `setFieldMapping`
- `EvaluationDashboard.tsx` — unused imports (useState, Filter, recharts)
- `KnowledgeAlignment.tsx` — unused imports (Filter, Button), unused `selectedTags`/`setSelectedTags`
- `calendar.tsx` — `IconLeft` API changed in react-day-picker v9

---

## Key mapping reference

### Old `Skill` → New `SkillExecution`
| Old field        | New field                  |
|------------------|----------------------------|
| `id`             | `skill_id`                 |
| `name`           | `name`                     |
| `status`         | `state`                    |
| `reasoning`      | `summary`                  |
| `confidence`     | `confidence` (optional)    |
| `inputs`         | `details?.inputs`          |
| `outputs`        | `details?.outputs`         |
| `plan`           | `details?.plan_steps`      |
| `tools`          | `details?.tool_calls`      |
| `knowledge`      | `details?.context_sources` |

### Old status → New state mapping for UI icons
| Visual          | Old values     | New values                                          |
|-----------------|----------------|------------------------------------------------------|
| Green check     | `"completed"`  | `"complete"`                                         |
| Blue spinner    | `"running"`    | `"thinking"`, `"retrieving"`, `"planning"`, `"executing"`, `"verifying"` |
| Red alert       | `"error"`      | `"error"`                                            |
| Gray play       | `"pending"`    | `"idle"`                                             |

### AgentEvent.event_type → SkillExecution.state
| event_type       | → state        |
|------------------|----------------|
| `thinking`       | `thinking`     |
| `retrieval`      | `retrieving`   |
| `planning`       | `planning`     |
| `tool_call`      | `executing`    |
| `tool_result`    | `executing`    |
| `memory_write`   | `executing`    |
| `verification`   | `verifying`    |
| `complete`       | `complete`     |
| `error`          | `error`        |

### REST endpoints
| Method | Path | Request body | Response | Status |
|--------|------|-------------|----------|--------|
| `GET` | `/health` | — | `{ "status": "ok" }` | 200 |
| `POST` | `/runs` | `{ "tenant_id": string, "work_object": WorkObject }` | `{ "run_id": string, "status": "queued", "tenant_id": string }` | 201 |
| `GET` | `/runs/{run_id}?tenant_id=` | — | `AgentRun` (full object) | 200 / 404 / 422 |
| `GET` | `/admin/{tenant_id}/classification-schema` | — | `ClassificationSchema` | 200 / 404 / 422 |
| `PUT` | `/admin/{tenant_id}/classification-schema` | `{ levels: ClassificationLevelConfig[], version: string }` | `ClassificationSchema` | 200 / 422 |
| `GET` | `/admin/{tenant_id}/adapter-mappings?source_system=&record_type=` | — | `AdapterMapping` | 200 / 404 / 422 |
| `PUT` | `/admin/{tenant_id}/adapter-mappings` | `{ source_system, record_type, mappings: AdapterFieldMapping[] }` | `AdapterMapping` | 200 / 422 |
| `GET` | `/admin/{tenant_id}/google-drive` | — | `GoogleDriveConfig` | 200 / 404 / 422 |
| `PUT` | `/admin/{tenant_id}/google-drive` | `{ root_folder_id?: string }` | `GoogleDriveConfig` | 200 / 422 |
| `GET` | `/admin/{tenant_id}/google-drive/scaffold-plan` | — | `DriveNode[]` | 200 / 404 / 422 |
| `POST` | `/admin/{tenant_id}/google-drive/scaffold-apply` | `{ root_folder_id?: string, shared_drive_id?: string }` | `{ tenant_id, root_folder_id, shared_drive_id, created: {path→id} }` | 200 / 400 / 404 / 500 |

### WebSocket message envelope (expected from backend)
```json
{ "type": "run_started",  "payload": { /* full AgentRun object */ } }
{ "type": "skill_update", "payload": { /* AgentEvent object */ } }
{ "type": "run_completed" }
{ "type": "run_failed",   "payload": { "error": "..." } }
```
