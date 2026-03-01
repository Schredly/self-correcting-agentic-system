"""FastAPI app with event-driven WebSocket streaming and REST endpoints."""

import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .drive_scaffolder import DriveScaffolder
from .event_bus import EventBus
from .google_drive_provider import GoogleDriveProvider
from .models import (
    AdapterFieldMapping,
    AdapterMapping,
    ClassificationLevelConfig,
    ClassificationSchema,
    GoogleDriveConfig,
    ScaffoldApplyRequest,
    WorkObject,
)
from .orchestrator import Orchestrator
from .run_manager import RunManager
from .simulation import build_demo_work_object
from .tenant_config import TenantConfigStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

run_manager = RunManager()
event_bus = EventBus()
orchestrator = Orchestrator(run_manager, event_bus)
tenant_config = TenantConfigStore()
drive_scaffolder = DriveScaffolder(tenant_config)

DEMO_RUN_ID = "demo-run-1"
DEMO_TENANT_ID = "demo-tenant"


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Seed and start the demo run so the frontend works out of the box."""
    run_manager.create_run(
        work_object=build_demo_work_object(),
        tenant_id=DEMO_TENANT_ID,
        run_id=DEMO_RUN_ID,
    )
    orchestrator.start_run(DEMO_RUN_ID)
    logger.info("Demo run seeded and started — run_id=%s, tenant_id=%s", DEMO_RUN_ID, DEMO_TENANT_ID)
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
    tenant_id: str


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
    return CreateRunResponse(run_id=run.run_id, status=run.status, tenant_id=run.tenant_id)


@app.get("/runs/{run_id}")
async def get_run(run_id: str, tenant_id: str = Query(...)):
    run = run_manager.get_run(run_id)
    if run is None or run.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Run not found")
    return run.model_dump()


# ── WebSocket endpoint (subscriber-only) ────────────────────────────────────


@app.websocket("/runs/{run_id}/events")
async def run_events(websocket: WebSocket, run_id: str) -> None:
    tenant_id = websocket.query_params.get("tenant_id")
    run = run_manager.get_run(run_id)

    if run is None or tenant_id is None or run.tenant_id != tenant_id:
        await websocket.close(code=1008, reason="Run not found")
        return

    await websocket.accept()
    logger.info("WebSocket connected — run_id=%s, tenant=%s", run_id, tenant_id)

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


# ── Admin configuration endpoints ────────────────────────────────────────────


def _validate_tenant_id(tenant_id: str) -> None:
    if not tenant_id.strip():
        raise HTTPException(status_code=422, detail="tenant_id must not be empty")


# ── Classification schema ────────────────────────────────────────────────────


class UpsertClassificationSchemaRequest(BaseModel):
    levels: list[ClassificationLevelConfig]
    version: str


@app.get("/admin/{tenant_id}/classification-schema")
async def get_classification_schema(tenant_id: str):
    _validate_tenant_id(tenant_id)
    schema = tenant_config.get_schema(tenant_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Classification schema not found")
    return schema.model_dump()


@app.put("/admin/{tenant_id}/classification-schema")
async def put_classification_schema(tenant_id: str, body: UpsertClassificationSchemaRequest):
    _validate_tenant_id(tenant_id)
    schema = ClassificationSchema(
        tenant_id=tenant_id,
        levels=body.levels,
        version=body.version,
        updated_at=datetime.now(timezone.utc),
    )
    tenant_config.upsert_schema(schema)
    return schema.model_dump()


# ── Adapter mappings ─────────────────────────────────────────────────────────


class UpsertAdapterMappingRequest(BaseModel):
    source_system: str
    record_type: str
    mappings: list[AdapterFieldMapping]


@app.get("/admin/{tenant_id}/adapter-mappings")
async def get_adapter_mapping(
    tenant_id: str,
    source_system: str = Query(...),
    record_type: str = Query(...),
):
    _validate_tenant_id(tenant_id)
    mapping = tenant_config.get_adapter_mapping(tenant_id, source_system, record_type)
    if mapping is None:
        raise HTTPException(status_code=404, detail="Adapter mapping not found")
    return mapping.model_dump()


@app.put("/admin/{tenant_id}/adapter-mappings")
async def put_adapter_mapping(tenant_id: str, body: UpsertAdapterMappingRequest):
    _validate_tenant_id(tenant_id)
    mapping = AdapterMapping(
        tenant_id=tenant_id,
        source_system=body.source_system,
        record_type=body.record_type,
        mappings=body.mappings,
        updated_at=datetime.now(timezone.utc),
    )
    tenant_config.upsert_adapter_mapping(mapping)
    return mapping.model_dump()


# ── Google Drive config ──────────────────────────────────────────────────────


class UpsertGoogleDriveConfigRequest(BaseModel):
    root_folder_id: str | None = None


@app.get("/admin/{tenant_id}/google-drive")
async def get_google_drive_config(tenant_id: str):
    _validate_tenant_id(tenant_id)
    config = tenant_config.get_drive_config(tenant_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Google Drive config not found")
    return config.model_dump()


@app.put("/admin/{tenant_id}/google-drive")
async def put_google_drive_config(tenant_id: str, body: UpsertGoogleDriveConfigRequest):
    _validate_tenant_id(tenant_id)
    config = GoogleDriveConfig(
        tenant_id=tenant_id,
        root_folder_id=body.root_folder_id,
        status="configured" if body.root_folder_id else "not_configured",
        updated_at=datetime.now(timezone.utc),
    )
    tenant_config.upsert_drive_config(config)
    return config.model_dump()


# ── Google Drive scaffold endpoints ──────────────────────────────────────


@app.get("/admin/{tenant_id}/google-drive/scaffold-plan")
async def get_scaffold_plan(tenant_id: str):
    """Dry-run: return the list of folders the scaffolder would create."""
    _validate_tenant_id(tenant_id)
    plan = drive_scaffolder.build_scaffold_plan(tenant_id)
    return [node.model_dump() for node in plan]


@app.post("/admin/{tenant_id}/google-drive/scaffold-apply")
async def apply_scaffold_plan(tenant_id: str, body: ScaffoldApplyRequest):
    """Create the folder scaffold in Google Drive and upload schema artifacts."""
    _validate_tenant_id(tenant_id)

    # 1. Classification schema must exist
    schema = tenant_config.get_schema(tenant_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Classification schema not found")

    # 2. Resolve root_folder_id
    root_folder_id = body.root_folder_id
    if root_folder_id is None:
        existing = tenant_config.get_drive_config(tenant_id)
        if existing:
            root_folder_id = existing.root_folder_id
    if not root_folder_id:
        raise HTTPException(
            status_code=400,
            detail="root_folder_id required — provide in request body or configure via PUT /admin/{tenant_id}/google-drive first",
        )

    # 3. Service account credentials
    sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not sa_file:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_SERVICE_ACCOUNT_FILE environment variable is not set",
        )

    # 4. Build provider and apply scaffold
    provider = GoogleDriveProvider(sa_file, shared_drive_id=body.shared_drive_id)
    ids_map = await drive_scaffolder.apply_scaffold_plan(tenant_id, provider, root_folder_id)

    # 5. Upload schema artifacts into _schema/ folder
    schema_folder_path = f"AgenticKnowledge/{tenant_id}/_schema"
    schema_folder_id = ids_map.get(schema_folder_path)
    if schema_folder_id:
        schema_json = schema.model_dump_json(indent=2).encode()
        schema_file_id = await provider.ensure_file(
            name="classification_schema.json",
            parent_id=schema_folder_id,
            content_type="application/json",
            content_bytes=schema_json,
        )
        ids_map[f"{schema_folder_path}/classification_schema.json"] = schema_file_id

        adapter_mappings = tenant_config.list_adapter_mappings(tenant_id)
        mappings_payload = [m.model_dump(mode="json") for m in adapter_mappings]
        mappings_json = json.dumps(mappings_payload, indent=2, default=str).encode()
        mappings_file_id = await provider.ensure_file(
            name="adapter_mappings.json",
            parent_id=schema_folder_id,
            content_type="application/json",
            content_bytes=mappings_json,
        )
        ids_map[f"{schema_folder_path}/adapter_mappings.json"] = mappings_file_id

    # 6. Update tenant Drive config
    tenant_config.upsert_drive_config(
        GoogleDriveConfig(
            tenant_id=tenant_id,
            root_folder_id=root_folder_id,
            status="configured",
            updated_at=datetime.now(timezone.utc),
        )
    )

    return {
        "tenant_id": tenant_id,
        "root_folder_id": root_folder_id,
        "shared_drive_id": body.shared_drive_id,
        "created": ids_map,
    }
