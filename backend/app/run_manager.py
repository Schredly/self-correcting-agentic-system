"""In-memory run lifecycle manager.

Separates run creation and state tracking from WebSocket streaming so that
runs can be created via REST and later picked up by the event endpoint.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .models import AgentRun, WorkObject


class RunManager:
    def __init__(self) -> None:
        self.runs: dict[str, AgentRun] = {}

    def create_run(self, work_object: WorkObject, tenant_id: str) -> AgentRun:
        run_id = str(uuid.uuid4())
        run = AgentRun(
            run_id=run_id,
            tenant_id=tenant_id,
            status="queued",
            started_at=datetime.now(timezone.utc).isoformat(),
            work_object=work_object,
            skills=[],
        )
        self.runs[run_id] = run
        return run

    def get_run(self, run_id: str) -> AgentRun | None:
        return self.runs.get(run_id)

    def mark_completed(self, run_id: str) -> None:
        run = self.runs.get(run_id)
        if run is None:
            return
        self.runs[run_id] = run.model_copy(
            update={
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    def mark_failed(self, run_id: str, error: str) -> None:
        run = self.runs.get(run_id)
        if run is None:
            return
        self.runs[run_id] = run.model_copy(
            update={
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
