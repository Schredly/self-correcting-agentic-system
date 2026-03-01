"""Pydantic models mirroring the frontend TypeScript types in types/agents.ts,
plus tenant-level admin configuration models."""

from __future__ import annotations

from datetime import datetime
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


# ── Tenant admin configuration models ───────────────────────────────────────


class ClassificationLevelConfig(BaseModel):
    key: str
    display_name: str
    required: bool


class ClassificationSchema(BaseModel):
    tenant_id: str
    levels: list[ClassificationLevelConfig]
    version: str
    updated_at: datetime


class AdapterFieldMapping(BaseModel):
    source_field: str
    classification_key: str


class AdapterMapping(BaseModel):
    tenant_id: str
    source_system: str
    record_type: str
    mappings: list[AdapterFieldMapping]
    updated_at: datetime


class GoogleDriveConfig(BaseModel):
    tenant_id: str
    root_folder_id: str | None
    status: Literal["not_configured", "configured"]
    updated_at: datetime


class Tenant(BaseModel):
    id: str
    name: str
    enabled_adapters: list[str] = []
    status: Literal["draft", "active"] = "draft"
    created_at: datetime


class TenantCreateRequest(BaseModel):
    id: str
    name: str
    enabled_adapters: list[str] = []


class TenantSummary(BaseModel):
    id: str
    name: str
    status: Literal["configured", "needs-setup"]


class TenantHealth(BaseModel):
    tenant_id: str
    schema_defined: bool
    drive_configured: bool
    drive_scaffold_applied: bool
    knowledge_synced: bool
    servicenow_connected: bool
    adapter_mapping_defined: bool
    last_run_status: str | None


class ScaffoldApplyRequest(BaseModel):
    root_folder_id: str | None = None
    shared_drive_id: str | None = None


# ── ServiceNow connector models ──────────────────────────────────────────


class ServiceNowConfig(BaseModel):
    tenant_id: str
    instance_url: str
    username: str
    api_key: str
    connection_tested: bool = False
    status: Literal["not_configured", "connected", "error"]
    updated_at: datetime


class DiscoveredDimension(BaseModel):
    key: str
    display_name: str
    values: list[str]


class DiscoverClassificationResponse(BaseModel):
    dimensions: list[DiscoveredDimension]
