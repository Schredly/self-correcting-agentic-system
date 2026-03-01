"""Tests for DriveScaffolder and the scaffold-plan endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.drive_provider import DriveNode
from app.drive_scaffolder import DriveScaffolder
from app.models import ClassificationLevelConfig, ClassificationSchema
from app.tenant_config import TenantConfigStore


# ── Fixtures ──────────────────────────────────────────────────────────────


@pytest.fixture
def store() -> TenantConfigStore:
    return TenantConfigStore()


@pytest.fixture
def scaffolder(store: TenantConfigStore) -> DriveScaffolder:
    return DriveScaffolder(store)


def _seed_schema(
    store: TenantConfigStore,
    tenant_id: str = "acme",
    levels: list[ClassificationLevelConfig] | None = None,
) -> ClassificationSchema:
    if levels is None:
        levels = [
            ClassificationLevelConfig(key="category", display_name="Category", required=True),
            ClassificationLevelConfig(key="subcategory", display_name="Subcategory", required=False),
        ]
    schema = ClassificationSchema(
        tenant_id=tenant_id,
        levels=levels,
        version="1",
        updated_at=datetime.now(timezone.utc),
    )
    store.upsert_schema(schema)
    return schema


# ── build_scaffold_plan ───────────────────────────────────────────────────


class TestBuildScaffoldPlan:
    def test_missing_schema_raises_404(self, scaffolder: DriveScaffolder) -> None:
        with pytest.raises(HTTPException) as exc_info:
            scaffolder.build_scaffold_plan("no-such-tenant")
        assert exc_info.value.status_code == 404

    def test_plan_returns_drive_nodes(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        assert all(isinstance(n, DriveNode) for n in plan)

    def test_all_nodes_are_folders(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        assert all(n.kind == "folder" for n in plan)

    def test_fixed_structure_nodes(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        names = [n.name for n in plan]
        assert names[0] == "AgenticKnowledge"
        assert names[1] == "acme"
        assert "_schema" in names
        assert "dimensions" in names
        assert "documents" in names

    def test_dimension_folders_match_schema_levels(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        dim_path = "AgenticKnowledge/acme/dimensions"
        dim_nodes = [n for n in plan if n.parent_path == dim_path]
        assert len(dim_nodes) == 2
        assert dim_nodes[0].name == "Category"
        assert dim_nodes[1].name == "Subcategory"

    def test_dimension_notes_contain_key(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        dim_path = "AgenticKnowledge/acme/dimensions"
        dim_nodes = [n for n in plan if n.parent_path == dim_path]
        assert "category" in (dim_nodes[0].notes or "")
        assert "subcategory" in (dim_nodes[1].notes or "")

    def test_parent_paths_are_consistent(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        """Every node's parent_path should be the full path of an earlier node (or empty for root)."""
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        known_paths: set[str] = {""}
        for node in plan:
            assert node.parent_path in known_paths, (
                f"Node '{node.name}' references unknown parent_path '{node.parent_path}'"
            )
            full = f"{node.parent_path}/{node.name}" if node.parent_path else node.name
            known_paths.add(full)

    def test_plan_is_deterministic(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan_a = scaffolder.build_scaffold_plan("acme")
        plan_b = scaffolder.build_scaffold_plan("acme")
        assert [n.model_dump() for n in plan_a] == [n.model_dump() for n in plan_b]

    def test_zero_levels_produces_no_dimension_children(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store, levels=[])
        plan = scaffolder.build_scaffold_plan("acme")
        dim_path = "AgenticKnowledge/acme/dimensions"
        dim_children = [n for n in plan if n.parent_path == dim_path]
        assert dim_children == []

    def test_many_levels(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        levels = [
            ClassificationLevelConfig(key=f"l{i}", display_name=f"Level {i}", required=False)
            for i in range(5)
        ]
        _seed_schema(store, levels=levels)
        plan = scaffolder.build_scaffold_plan("acme")
        dim_path = "AgenticKnowledge/acme/dimensions"
        dim_children = [n for n in plan if n.parent_path == dim_path]
        assert len(dim_children) == 5
        assert [n.name for n in dim_children] == [f"Level {i}" for i in range(5)]

    def test_different_tenants_produce_isolated_plans(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store, tenant_id="alpha")
        _seed_schema(store, tenant_id="beta")
        plan_a = scaffolder.build_scaffold_plan("alpha")
        plan_b = scaffolder.build_scaffold_plan("beta")
        assert plan_a[1].name == "alpha"
        assert plan_b[1].name == "beta"
        # Tenant-specific paths (below the shared root) must not overlap
        tenant_paths_a = {n.parent_path for n in plan_a if "alpha" in n.parent_path}
        tenant_paths_b = {n.parent_path for n in plan_b if "beta" in n.parent_path}
        assert not tenant_paths_a.intersection(tenant_paths_b)

    def test_documents_is_last_node(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        plan = scaffolder.build_scaffold_plan("acme")
        assert plan[-1].name == "documents"


# ── apply_scaffold_plan ───────────────────────────────────────────────────


class FakeProvider:
    """In-memory DriveProvider for testing."""

    def __init__(self) -> None:
        self.calls: list[dict[str, str | None]] = []
        self._counter = 0

    async def ensure_folder(self, *, name: str, parent_id: str | None) -> str:
        self._counter += 1
        folder_id = f"id-{self._counter}"
        self.calls.append({"name": name, "parent_id": parent_id})
        return folder_id

    async def ensure_file(
        self, *, name: str, parent_id: str, content_type: str, content_bytes: bytes
    ) -> str:
        self._counter += 1
        return f"id-{self._counter}"


class TestApplyScaffoldPlan:
    @pytest.mark.asyncio
    async def test_calls_provider_for_each_folder(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        provider = FakeProvider()
        result = await scaffolder.apply_scaffold_plan("acme", provider)
        plan = scaffolder.build_scaffold_plan("acme")
        assert len(provider.calls) == len(plan)

    @pytest.mark.asyncio
    async def test_returns_path_to_id_mapping(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        provider = FakeProvider()
        result = await scaffolder.apply_scaffold_plan("acme", provider)
        assert "AgenticKnowledge" in result
        assert "AgenticKnowledge/acme" in result
        assert "AgenticKnowledge/acme/_schema" in result
        assert "AgenticKnowledge/acme/dimensions" in result
        assert "AgenticKnowledge/acme/documents" in result
        assert "AgenticKnowledge/acme/dimensions/Category" in result
        assert "AgenticKnowledge/acme/dimensions/Subcategory" in result

    @pytest.mark.asyncio
    async def test_root_uses_provided_root_folder_id(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        provider = FakeProvider()
        await scaffolder.apply_scaffold_plan("acme", provider, root_folder_id="ext-root-99")
        assert provider.calls[0]["parent_id"] == "ext-root-99"

    @pytest.mark.asyncio
    async def test_root_uses_none_when_no_root_id(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        provider = FakeProvider()
        await scaffolder.apply_scaffold_plan("acme", provider)
        assert provider.calls[0]["parent_id"] is None

    @pytest.mark.asyncio
    async def test_child_folders_get_parent_ids(
        self, store: TenantConfigStore, scaffolder: DriveScaffolder
    ) -> None:
        _seed_schema(store)
        provider = FakeProvider()
        result = await scaffolder.apply_scaffold_plan("acme", provider)
        # The tenant folder's parent should be the AgenticKnowledge folder id
        root_id = result["AgenticKnowledge"]
        tenant_call = provider.calls[1]
        assert tenant_call["name"] == "acme"
        assert tenant_call["parent_id"] == root_id

    @pytest.mark.asyncio
    async def test_missing_schema_raises_404(
        self, scaffolder: DriveScaffolder
    ) -> None:
        provider = FakeProvider()
        with pytest.raises(HTTPException) as exc_info:
            await scaffolder.apply_scaffold_plan("ghost", provider)
        assert exc_info.value.status_code == 404


# ── Endpoint integration tests ────────────────────────────────────────────


@pytest.fixture
def seed_acme_schema() -> None:
    """Seed the module-level tenant_config store used by the FastAPI app."""
    from app.main import tenant_config

    _seed_schema(tenant_config, tenant_id="acme")


@pytest.mark.asyncio
class TestScaffoldEndpoints:
    async def test_scaffold_plan_returns_200(self, seed_acme_schema: None) -> None:
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/admin/acme/google-drive/scaffold-plan")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["name"] == "AgenticKnowledge"

    async def test_scaffold_plan_404_when_no_schema(self) -> None:
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/admin/unknown-tenant/google-drive/scaffold-plan")
        assert resp.status_code == 404

    async def test_scaffold_plan_422_on_empty_tenant(self) -> None:
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/admin/%20/google-drive/scaffold-plan")
        assert resp.status_code == 422

    async def test_scaffold_apply_returns_501(self, seed_acme_schema: None) -> None:
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/admin/acme/google-drive/scaffold-apply")
        assert resp.status_code == 501
        assert "not configured yet" in resp.json()["detail"]

    async def test_scaffold_plan_response_shape(self, seed_acme_schema: None) -> None:
        from app.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/admin/acme/google-drive/scaffold-plan")
        data = resp.json()
        for node in data:
            assert "kind" in node
            assert "name" in node
            assert "parent_path" in node
            assert node["kind"] in ("folder", "file")
