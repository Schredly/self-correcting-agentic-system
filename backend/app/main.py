"""FastAPI app with WebSocket endpoint for streaming agent run events."""

import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import RunFailedMessage, WorkObject
from .run_manager import RunManager
from .simulation import simulate_demo_run

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agent Control Plane — Demo Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

run_manager = RunManager()


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
    logger.info("Run created — run_id=%s, tenant=%s", run.run_id, run.tenant_id)
    return CreateRunResponse(run_id=run.run_id, status=run.status)


# ── WebSocket endpoint (unchanged) ──────────────────────────────────────────


@app.websocket("/runs/{run_id}/events")
async def run_events(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    logger.info("WebSocket connected — run_id=%s", run_id)

    try:
        async for message in simulate_demo_run(run_id):
            await websocket.send_json(message.model_dump())

        # Simulation finished — close cleanly
        await websocket.close()
        logger.info("Run complete — run_id=%s", run_id)

    except WebSocketDisconnect:
        logger.info("Client disconnected — run_id=%s", run_id)

    except Exception:
        logger.exception("Error during run — run_id=%s", run_id)
        try:
            fail = RunFailedMessage(payload={"error": "Internal server error"})
            await websocket.send_json(fail.model_dump())
            await websocket.close(code=1011)
        except Exception:
            pass
