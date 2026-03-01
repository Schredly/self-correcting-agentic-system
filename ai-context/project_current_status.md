# Project Current Status

## What exists on disk (pushed to `origin/main`)

### Repository
- **Repo:** `https://github.com/Schredly/self-correcting-agentic-system.git`
- **Branch:** `main`
- **Commits:**
  - `77bfed6` — Initial commit: `.gitignore` + frontend source tree
  - `e8b7a0b` — Replace mock data with real-time WebSocket data layer
  - `128b0e9` — Add frontend toolchain: Vite 6, Tailwind v4, TypeScript strict

### Directory structure
```
self-correcting-agentic-system/
├── .gitignore                  # excludes .DS_Store, node_modules/, dist/, .env
├── ai-context/                 # architecture docs (00–10) + project_current_status.md
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
7. **Frontend toolchain set up** (`128b0e9`):
   - `package.json` — 43 dependencies, scripts: `dev`, `build`, `preview`
   - `tsconfig.json` — strict mode, bundler resolution, `@/*` path alias, `noUncheckedIndexedAccess`
   - `vite.config.ts` — `@vitejs/plugin-react` + `@tailwindcss/vite`, `@/` alias, dev server on port 3000 with proxy to `localhost:8000` (API + WebSocket)
   - `index.html` — Vite entry HTML
   - `src/main.tsx` — React 19 `createRoot`, imports `./styles/index.css`
   - **No `tailwind.config.ts`** — Tailwind v4 is CSS-first (config lives in `tailwind.css` and `theme.css`)
   - `npm install` succeeded — 238 packages, 0 vulnerabilities
   - `vite build` succeeded — 2751 modules, 289 KB gzipped JS, 15 KB gzipped CSS, 2.1s build
   - TS type-check passes for all project files (pre-existing errors in untouched screens only)

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
- WebSocket server at `ws://localhost:8000/runs/{runId}/events` not yet implemented
- Must send JSON messages matching `AgentAction` discriminated union (see envelope format below)

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

### WebSocket message envelope (expected from backend)
```json
{ "type": "run_started",  "payload": { /* full AgentRun object */ } }
{ "type": "skill_update", "payload": { /* AgentEvent object */ } }
{ "type": "run_completed" }
{ "type": "run_failed",   "payload": { "error": "..." } }
```