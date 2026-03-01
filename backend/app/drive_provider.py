"""Drive provider protocol and shared models.

Defines the abstract DriveProvider interface that any storage backend
(Google Drive, S3, local FS) must implement, plus the DriveNode model
used by the scaffolding planner to describe a planned folder tree.
"""

from __future__ import annotations

from typing import Literal, Protocol

from pydantic import BaseModel


class DriveNode(BaseModel):
    """One node in a scaffold plan — either a folder to create or a file to upload."""

    kind: Literal["folder", "file"]
    name: str
    parent_path: str
    notes: str | None = None


class DriveProvider(Protocol):
    """Abstract storage backend.

    Implementations must be async.  The two methods mirror the minimal
    operations the scaffolder needs: create-or-reuse a folder and
    create-or-overwrite a file.
    """

    async def ensure_folder(self, *, name: str, parent_id: str | None) -> str:
        """Create *name* under *parent_id* (or root when ``None``).

        Returns the provider-specific ID of the resulting folder.
        Must be idempotent — if the folder already exists, return its ID.
        """
        ...

    async def ensure_file(
        self,
        *,
        name: str,
        parent_id: str,
        content_type: str,
        content_bytes: bytes,
    ) -> str:
        """Upload or overwrite *name* under *parent_id*.

        Returns the provider-specific ID of the resulting file.
        """
        ...
