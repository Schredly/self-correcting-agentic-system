"""Concrete DriveProvider backed by Google Drive API v3.

Uses a service account for authentication.  Supports both standard
(My Drive) and Shared Drive modes — pass *shared_drive_id* to operate
within a Shared Drive.

All Google API calls are synchronous under the hood; they are wrapped
with ``asyncio.to_thread`` so the provider satisfies the async
DriveProvider protocol without blocking the event loop.
"""

from __future__ import annotations

import asyncio
import io
import logging

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive"]
FOLDER_MIME = "application/vnd.google-apps.folder"


class GoogleDriveProvider:
    """Google Drive v3 implementation of the DriveProvider protocol."""

    def __init__(
        self,
        service_account_file: str,
        shared_drive_id: str | None = None,
    ) -> None:
        creds = Credentials.from_service_account_file(
            service_account_file, scopes=SCOPES
        )
        self._service = build("drive", "v3", credentials=creds)
        self._shared_drive_id = shared_drive_id

    # ── helpers ───────────────────────────────────────────────────────────

    def _list_kwargs(self) -> dict:
        """Common kwargs for files().list() that handle Shared Drive support."""
        kw: dict = {"supportsAllDrives": True, "includeItemsFromAllDrives": True}
        if self._shared_drive_id:
            kw["corpora"] = "drive"
            kw["driveId"] = self._shared_drive_id
        return kw

    def _find_by_name(
        self, name: str, parent_id: str | None, mime_type: str | None = None
    ) -> str | None:
        """Return the ID of an existing file/folder, or None."""
        parts = [
            f"name = '{name}'",
            "trashed = false",
        ]
        if parent_id:
            parts.append(f"'{parent_id}' in parents")
        if mime_type:
            parts.append(f"mimeType = '{mime_type}'")

        resp = (
            self._service.files()
            .list(
                q=" and ".join(parts),
                fields="files(id, name)",
                pageSize=1,
                **self._list_kwargs(),
            )
            .execute()
        )
        files = resp.get("files", [])
        return files[0]["id"] if files else None

    # ── public interface (matches DriveProvider protocol) ─────────────────

    async def ensure_folder(self, *, name: str, parent_id: str | None) -> str:
        return await asyncio.to_thread(self._ensure_folder_sync, name, parent_id)

    async def ensure_file(
        self,
        *,
        name: str,
        parent_id: str,
        content_type: str,
        content_bytes: bytes,
    ) -> str:
        return await asyncio.to_thread(
            self._ensure_file_sync, name, parent_id, content_type, content_bytes
        )

    # ── sync implementations ──────────────────────────────────────────────

    def _ensure_folder_sync(self, name: str, parent_id: str | None) -> str:
        existing = self._find_by_name(name, parent_id, mime_type=FOLDER_MIME)
        if existing:
            logger.debug("Folder already exists: %s → %s", name, existing)
            return existing

        metadata: dict = {"name": name, "mimeType": FOLDER_MIME}
        if parent_id:
            metadata["parents"] = [parent_id]
        elif self._shared_drive_id:
            metadata["parents"] = [self._shared_drive_id]

        created = (
            self._service.files()
            .create(
                body=metadata,
                fields="id",
                supportsAllDrives=True,
            )
            .execute()
        )
        folder_id = created["id"]
        logger.info("Created folder: %s → %s", name, folder_id)
        return folder_id

    def _ensure_file_sync(
        self,
        name: str,
        parent_id: str,
        content_type: str,
        content_bytes: bytes,
    ) -> str:
        media = MediaIoBaseUpload(
            io.BytesIO(content_bytes), mimetype=content_type, resumable=False
        )

        existing = self._find_by_name(name, parent_id)
        if existing:
            updated = (
                self._service.files()
                .update(
                    fileId=existing,
                    media_body=media,
                    fields="id",
                    supportsAllDrives=True,
                )
                .execute()
            )
            logger.info("Updated file: %s → %s", name, updated["id"])
            return updated["id"]

        metadata: dict = {"name": name, "parents": [parent_id]}
        created = (
            self._service.files()
            .create(
                body=metadata,
                media_body=media,
                fields="id",
                supportsAllDrives=True,
            )
            .execute()
        )
        logger.info("Created file: %s → %s", name, created["id"])
        return created["id"]
