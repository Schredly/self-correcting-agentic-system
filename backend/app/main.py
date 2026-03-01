"""FastAPI app with WebSocket endpoint for streaming agent run events."""

import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .models import RunFailedMessage
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


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
