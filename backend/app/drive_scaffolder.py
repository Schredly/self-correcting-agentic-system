"""Google Drive folder-tree scaffolding planner.

Generates a deterministic list of DriveNodes from a tenant's
ClassificationSchema, suitable for dry-run preview or actual
provisioning via a DriveProvider implementation.
"""

from __future__ import annotations

from fastapi import HTTPException

from .drive_provider import DriveNode, DriveProvider
from .tenant_config import TenantConfigStore


class DriveScaffolder:
    """Builds and (eventually) applies a folder scaffold for a tenant."""

    def __init__(self, tenant_store: TenantConfigStore) -> None:
        self._store = tenant_store

    # ── Plan ──────────────────────────────────────────────────────────────

    def build_scaffold_plan(self, tenant_id: str) -> list[DriveNode]:
        """Return a deterministic, ordered list of folders to create.

        Structure::

            AgenticKnowledge/
            └── {tenant_id}/
                ├── _schema/
                ├── dimensions/
                │   ├── {level.display_name}/   (one per schema level)
                │   └── …
                └── documents/

        Raises ``HTTPException(404)`` when no ClassificationSchema exists
        for *tenant_id*.
        """
        schema = self._store.get_schema(tenant_id)
        if schema is None:
            raise HTTPException(
                status_code=404,
                detail=f"Classification schema not found for tenant '{tenant_id}'",
            )

        root = "AgenticKnowledge"
        tenant_path = f"{root}/{tenant_id}"

        plan: list[DriveNode] = [
            DriveNode(kind="folder", name=root, parent_path="", notes="top-level root"),
            DriveNode(kind="folder", name=tenant_id, parent_path=root, notes="tenant root"),
            DriveNode(
                kind="folder",
                name="_schema",
                parent_path=tenant_path,
                notes="stores schema metadata",
            ),
            DriveNode(kind="folder", name="dimensions", parent_path=tenant_path),
        ]

        dimensions_path = f"{tenant_path}/dimensions"
        for level in schema.levels:
            plan.append(
                DriveNode(
                    kind="folder",
                    name=level.display_name,
                    parent_path=dimensions_path,
                    notes=f"classification level: {level.key}",
                ),
            )

        plan.append(
            DriveNode(
                kind="folder",
                name="documents",
                parent_path=tenant_path,
                notes="ingested document store",
            ),
        )

        return plan

    # ── Apply (stub) ──────────────────────────────────────────────────────

    async def apply_scaffold_plan(
        self,
        tenant_id: str,
        provider: DriveProvider,
        root_folder_id: str | None = None,
    ) -> dict[str, str]:
        """Materialise the scaffold via *provider*.

        Not yet wired — requires a concrete DriveProvider (Google OAuth).
        Returns a mapping of ``parent_path/name`` → provider folder ID.
        """
        plan = self.build_scaffold_plan(tenant_id)
        folder_ids: dict[str, str] = {}

        for node in plan:
            if node.kind != "folder":
                continue

            parent_id = root_folder_id if node.parent_path == "" else folder_ids.get(node.parent_path)
            created_id = await provider.ensure_folder(name=node.name, parent_id=parent_id)

            full_path = f"{node.parent_path}/{node.name}" if node.parent_path else node.name
            folder_ids[full_path] = created_id

        return folder_ids
