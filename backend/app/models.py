"""Pydantic models mirroring the frontend TypeScript types in types/agents.ts."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


class ClassificationLevel(BaseModel):
    name: str
    value: str


class WorkObject(BaseModel):
    work_id: str
    source_system: str
    record_type: str
    title: str
    description: str
    classification: list[ClassificationLevel]
    metadata: dict[str, Any] | None = None


class SkillExecution(BaseModel):
    skill_id: str
    name: str
    state: Literal[
        "idle",
        "thinking",
        "retrieving",
        "planning",
        "executing",
        "verifying",
        "complete",
        "error",
    ]
    summary: str
    confidence: float | None = None
    details: dict[str, Any] | None = None


class AgentRun(BaseModel):
    run_id: str
    tenant_id: str
    status: Literal["queued", "running", "completed", "failed"]
    started_at: str
    completed_at: str | None = None
    work_object: WorkObject
    skills: list[SkillExecution]


class AgentEvent(BaseModel):
    run_id: str
    skill_id: str
    event_type: Literal[
        "thinking",
        "retrieval",
        "planning",
        "tool_call",
        "tool_result",
        "memory_write",
        "verification",
        "complete",
        "error",
    ]
    summary: str
    confidence: float | None = None
    timestamp: str
    metadata: dict[str, Any] | None = None


# ── WebSocket envelope messages (match AgentAction union in agentReducer.ts) ──


class RunStartedMessage(BaseModel):
    type: Literal["run_started"] = "run_started"
    payload: AgentRun


class SkillUpdateMessage(BaseModel):
    type: Literal["skill_update"] = "skill_update"
    payload: AgentEvent


class RunCompletedMessage(BaseModel):
    type: Literal["run_completed"] = "run_completed"


class RunFailedMessage(BaseModel):
    type: Literal["run_failed"] = "run_failed"
    payload: dict[str, Any] | None = None


WebSocketMessage = RunStartedMessage | SkillUpdateMessage | RunCompletedMessage | RunFailedMessage
