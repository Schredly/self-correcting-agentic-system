"""FastAPI app with event-driven WebSocket streaming and REST endpoints."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .event_bus import EventBus
from .models import WorkObject
from .orchestrator import Orchestrator
from .run_manager import RunManager
from .simulation import build_demo_work_object

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

run_manager = RunManager()
event_bus = EventBus()
orchestrator = Orchestrator(run_manager, event_bus)

DEMO_RUN_ID = "demo-run-1"


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Seed and start the demo run so the frontend works out of the box."""
    run_manager.create_run(
        work_object=build_demo_work_object(),
        tenant_id="tenant-acme-corp",
        run_id=DEMO_RUN_ID,
    )
    orchestrator.start_run(DEMO_RUN_ID)
    logger.info("Demo run seeded and started — run_id=%s", DEMO_RUN_ID)
    yield


app = FastAPI(title="Agent Control Plane — Demo Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST endpoints ───────────────────────────────────────────────────────────


class CreateRunRequest(BaseModel):
    tenant_id: str
    work_object: WorkObject


class CreateRunResponse(BaseModel):
    run_id: str
    status: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/runs", status_code=201)
async def create_run(body: CreateRunRequest) -> CreateRunResponse:
    run = run_manager.create_run(
        work_object=body.work_object,
        tenant_id=body.tenant_id,
    )
    orchestrator.start_run(run.run_id)
    logger.info("Run created and started — run_id=%s, tenant=%s", run.run_id, run.tenant_id)
    return CreateRunResponse(run_id=run.run_id, status=run.status)


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    run = run_manager.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.model_dump()


# ── WebSocket endpoint (subscriber-only) ────────────────────────────────────


@app.websocket("/runs/{run_id}/events")
async def run_events(websocket: WebSocket, run_id: str) -> None:
    # Validate run exists before accepting
    if run_manager.get_run(run_id) is None:
        await websocket.close(code=1008, reason="Run not found")
        return

    await websocket.accept()
    logger.info("WebSocket connected — run_id=%s", run_id)

    queue = event_bus.subscribe(run_id)
    try:
        while True:
            message = await queue.get()
            await websocket.send_json(message)

            # Close after terminal events
            msg_type = message.get("type")
            if msg_type in ("run_completed", "run_failed"):
                await websocket.close()
                break

    except WebSocketDisconnect:
        logger.info("Client disconnected — run_id=%s", run_id)

    finally:
        event_bus.unsubscribe(run_id, queue)
