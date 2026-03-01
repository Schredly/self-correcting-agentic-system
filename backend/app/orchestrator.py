"""Orchestrator that drives run execution and publishes events to the EventBus.

Currently uses the scripted simulation as its execution engine. This layer
will later be replaced with real agent orchestration while keeping the same
EventBus publish interface.
"""

from __future__ import annotations

import asyncio
import logging

from .event_bus import EventBus
from .models import RunFailedMessage, RunStartedMessage
from .run_manager import RunManager
from .simulation import simulate_skill_events

logger = logging.getLogger(__name__)


class Orchestrator:
    def __init__(self, run_manager: RunManager, event_bus: EventBus) -> None:
        self.run_manager = run_manager
        self.event_bus = event_bus

    def start_run(self, run_id: str) -> None:
        """Launch run execution as a background asyncio task."""
        asyncio.create_task(self._execute_run(run_id))

    async def _execute_run(self, run_id: str) -> None:
        try:
            # Transition to running
            self.run_manager.mark_running(run_id)
            run = self.run_manager.get_run(run_id)
            if run is None:
                logger.error("Run not found after mark_running — run_id=%s", run_id)
                return

            # Publish run_started from RunManager's authoritative state
            started = RunStartedMessage(payload=run)
            self.event_bus.publish(run_id, started.model_dump())
            logger.info("Execution started — run_id=%s", run_id)

            # Stream skill events from simulation
            async for message in simulate_skill_events(run_id):
                envelope = message.model_dump()
                self.event_bus.publish(run_id, envelope)

                if envelope.get("type") == "run_completed":
                    self.run_manager.mark_completed(run_id)
                    logger.info("Execution completed — run_id=%s", run_id)

        except Exception:
            logger.exception("Execution failed — run_id=%s", run_id)
            fail = RunFailedMessage(payload={"error": "Internal execution error"})
            self.event_bus.publish(run_id, fail.model_dump())
            self.run_manager.mark_failed(run_id, "Internal execution error")
