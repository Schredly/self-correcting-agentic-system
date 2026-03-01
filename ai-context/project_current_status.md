# Project Current Status

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

### Directory structure
```
self-correcting-agentic-system/
├── .gitignore                  # excludes .DS_Store, node_modules/, dist/, .env, __pycache__/, *.egg-info/
├── ai-context/                 # architecture docs (00–10) + project_current_status.md
├── backend/
│   ├── pyproject.toml          # fastapi, uvicorn, pydantic (pip install -e .)
│   └── app/
│       ├── __init__.py
│       ├── event_bus.py        # In-memory per-run EventBus with history replay
│       ├── main.py             # FastAPI app + WebSocket (subscriber) + REST + CORS
│       ├── models.py           # Pydantic models mirroring frontend TS types
│       ├── orchestrator.py     # Orchestrator — drives execution, publishes to EventBus
│       ├── run_manager.py      # RunManager — in-memory run lifecycle (create, get, running, complete, fail)
│       └── simulation.py       # Async generators for timed demo events (~25s)
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
        ├── hooks/
        │   └── useAgentRun.ts  # WebSocket hook with reconnect
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
13. **Frontend toolchain set up** (`128b0e9`):
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
- Next: replace scripted simulation with real agent orchestration (LLM-driven skills)
- Next: persistent storage (replace in-memory RunManager)
- Next: authentication layer (currently tenant_id is a query param, not token-derived)

### Frontend (pending)
- Update `useAgentRun` to pass `?tenant_id=demo-tenant` in WebSocket URL
- Frontend currently cannot connect due to tenant isolation enforcement

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

### WebSocket message envelope (expected from backend)
```json
{ "type": "run_started",  "payload": { /* full AgentRun object */ } }
{ "type": "skill_update", "payload": { /* AgentEvent object */ } }
{ "type": "run_completed" }
{ "type": "run_failed",   "payload": { "error": "..." } }
```
