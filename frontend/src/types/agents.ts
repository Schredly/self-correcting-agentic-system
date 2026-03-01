// Generic work object coming from any system
export interface WorkObject {
  work_id: string
  source_system: "servicenow" | "jira" | "salesforce" | string
  record_type: string
  title: string
  description: string
  classification: ClassificationLevel[]
  metadata?: Record<string, any>
}

// Dynamic classification structure
export interface ClassificationLevel {
  name: string
  value: string
}

// Agent run lifecycle
export interface AgentRun {
  run_id: string
  tenant_id: string
  status: "queued" | "running" | "completed" | "failed"
  started_at: string
  completed_at?: string
  work_object: WorkObject
  skills: SkillExecution[]
}

// Individual skill execution state
export interface SkillExecution {
  skill_id: string
  name: string
  state:
    | "idle"
    | "thinking"
    | "retrieving"
    | "planning"
    | "executing"
    | "verifying"
    | "complete"
    | "error"
  summary: string
  confidence?: number
  details?: SkillDetails
}

// What shows in drawer
export interface SkillDetails {
  inputs?: Record<string, any>
  context_sources?: string[]
  plan_steps?: string[]
  tool_calls?: string[]
  outputs?: string
}

// Real-time event stream message
export interface AgentEvent {
  run_id: string
  skill_id: string
  event_type:
    | "thinking"
    | "retrieval"
    | "planning"
    | "tool_call"
    | "tool_result"
    | "memory_write"
    | "verification"
    | "complete"
    | "error"
  summary: string
  confidence?: number
  timestamp: string
  metadata?: Record<string, any>
}