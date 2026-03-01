# Project Current Status

## What exists on disk (pushed to `origin/main`)

### Repository
- **Repo:** `https://github.com/Schredly/self-correcting-agentic-system.git`
- **Branch:** `main`
- **Initial commit:** `77bfed6` — contains `.gitignore` + full `frontend/` tree

### Directory structure
```
self-correcting-agentic-system/
├── .gitignore                  # excludes .DS_Store, node_modules/, dist/, .env
├── ai-context/                 # architecture docs (00–10)
└── frontend/
    └── src/
        ├── types/
        │   └── agents.ts       # canonical types (see below)
        ├── app/
        │   ├── App.tsx
        │   ├── routes.ts
        │   ├── screens/
        │   │   ├── AgentConsole.tsx          # main console — STILL USES MOCK DATA
        │   │   ├── EvaluationDashboard.tsx
        │   │   ├── AdapterConfiguration.tsx
        │   │   ├── ClassificationManager.tsx
        │   │   └── KnowledgeAlignment.tsx
        │   └── components/
        │       ├── Layout.tsx
        │       ├── SkillDetailDrawer.tsx     # detail drawer — uses local Skill interface
        │       ├── figma/
        │       │   └── ImageWithFallback.tsx
        │       └── ui/                      # shadcn/ui primitives (~40 files)
        └── styles/
            ├── index.css
            ├── tailwind.css
            ├── theme.css
            └── fonts.css
```

### No package.json / config yet
The frontend has source files only — no `package.json`, `tsconfig.json`, `vite.config.ts`, or `tailwind.config.ts` have been created yet.

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

---

## Updated directory structure (after all changes)
```
frontend/src/
├── types/
│   └── agents.ts              # canonical types — unchanged
├── state/
│   └── agentReducer.ts        # NEW — reducer for AgentRun state
├── hooks/
│   └── useAgentRun.ts         # NEW — WebSocket hook
├── app/
│   ├── App.tsx
│   ├── routes.ts
│   ├── screens/
│   │   ├── AgentConsole.tsx    # MODIFIED — uses useAgentRun, no mock data
│   │   ├── EvaluationDashboard.tsx     # untouched
│   │   ├── AdapterConfiguration.tsx    # untouched
│   │   ├── ClassificationManager.tsx   # untouched
│   │   └── KnowledgeAlignment.tsx      # untouched
│   └── components/
│       ├── Layout.tsx                  # untouched
│       ├── SkillDetailDrawer.tsx       # MODIFIED — uses SkillExecution type
│       ├── figma/
│       │   └── ImageWithFallback.tsx   # untouched
│       └── ui/                         # untouched (~40 files)
└── styles/                             # untouched
```

---

## What still needs to be done

### Frontend toolchain
- No `package.json`, `tsconfig.json`, `vite.config.ts`, or `tailwind.config.ts` yet
- Dependencies needed: `react`, `react-dom`, `motion`, `lucide-react`, `typescript`, `tailwindcss`, shadcn/ui packages
- TS diagnostics will clear once `node_modules` is installed

### Backend
- WebSocket server at `ws://localhost:8000/runs/{runId}/events` not yet implemented
- Must send JSON messages matching `AgentAction` discriminated union (see envelope format below)

### Other screens
- `EvaluationDashboard.tsx`, `AdapterConfiguration.tsx`, `ClassificationManager.tsx`, `KnowledgeAlignment.tsx` — still have their own data needs (not addressed yet)

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

### WebSocket message envelope (expected from backend)
```json
{ "type": "run_started",  "payload": { /* full AgentRun object */ } }
{ "type": "skill_update", "payload": { /* AgentEvent object */ } }
{ "type": "run_completed" }
{ "type": "run_failed",   "payload": { "error": "..." } }
```