import type { AgentRun, AgentEvent, SkillExecution } from "../types/agents";

export type AgentAction =
  | { type: "run_started"; payload: AgentRun }
  | { type: "skill_update"; payload: AgentEvent }
  | { type: "run_completed" }
  | { type: "run_failed"; payload?: { error?: string } };

const EVENT_TO_STATE: Record<AgentEvent["event_type"], SkillExecution["state"]> = {
  thinking: "thinking",
  retrieval: "retrieving",
  planning: "planning",
  tool_call: "executing",
  tool_result: "executing",
  memory_write: "executing",
  verification: "verifying",
  complete: "complete",
  error: "error",
};

function mergeDetails(
  existing: SkillExecution["details"],
  event: AgentEvent
): SkillExecution["details"] {
  const details: NonNullable<SkillExecution["details"]> = { ...existing };
  const meta = event.metadata ?? {};

  switch (event.event_type) {
    case "thinking":
      if (meta.inputs) details.inputs = meta.inputs;
      break;
    case "retrieval":
      details.context_sources = [
        ...(details.context_sources ?? []),
        ...(Array.isArray(meta.sources) ? meta.sources : []),
      ];
      break;
    case "planning":
      if (Array.isArray(meta.steps)) details.plan_steps = meta.steps;
      break;
    case "tool_call":
      if (typeof meta.tool === "string") {
        details.tool_calls = [...(details.tool_calls ?? []), meta.tool];
      }
      break;
    case "complete":
      if (meta.outputs != null) details.outputs = String(meta.outputs);
      break;
  }

  return details;
}

export function agentReducer(
  state: AgentRun | null,
  action: AgentAction
): AgentRun | null {
  switch (action.type) {
    case "run_started":
      return { ...action.payload, status: "running" };

    case "skill_update": {
      if (!state) return state;
      const event = action.payload;
      const newSkillState = EVENT_TO_STATE[event.event_type];
      const skillExists = state.skills.some(
        (s) => s.skill_id === event.skill_id
      );

      const updatedSkills = skillExists
        ? state.skills.map((skill) =>
            skill.skill_id === event.skill_id
              ? {
                  ...skill,
                  state: newSkillState,
                  summary: event.summary,
                  confidence: event.confidence ?? skill.confidence,
                  details: mergeDetails(skill.details, event),
                }
              : skill
          )
        : [
            ...state.skills,
            {
              skill_id: event.skill_id,
              name: event.skill_id,
              state: newSkillState,
              summary: event.summary,
              confidence: event.confidence,
              details: mergeDetails(undefined, event),
            },
          ];

      return { ...state, skills: updatedSkills };
    }

    case "run_completed":
      if (!state) return state;
      return {
        ...state,
        status: "completed",
        completed_at: new Date().toISOString(),
      };

    case "run_failed":
      if (!state) return state;
      return {
        ...state,
        status: "failed",
        completed_at: new Date().toISOString(),
      };

    default:
      return state;
  }
}
