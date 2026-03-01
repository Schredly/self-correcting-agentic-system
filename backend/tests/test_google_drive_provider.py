"""Tests for GoogleDriveProvider with mocked Google Drive API."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.google_drive_provider import FOLDER_MIME, GoogleDriveProvider


# ── Helpers ───────────────────────────────────────────────────────────────


def _make_provider(
    shared_drive_id: str | None = None,
) -> tuple[GoogleDriveProvider, MagicMock]:
    """Build a GoogleDriveProvider with a mocked Drive service.

    Bypasses __init__ credential loading entirely.
    """
    with patch.object(GoogleDriveProvider, "__init__", lambda self, *a, **kw: None):
        provider = GoogleDriveProvider.__new__(GoogleDriveProvider)

    provider._shared_drive_id = shared_drive_id
    mock_service = MagicMock()
    provider._service = mock_service
    return provider, mock_service


def _mock_list(mock_service: MagicMock, files: list[dict]) -> MagicMock:
    """Wire mock_service.files().list().execute() to return *files*."""
    list_req = MagicMock()
    list_req.execute.return_value = {"files": files}
    mock_service.files.return_value.list.return_value = list_req
    return list_req


def _mock_create(mock_service: MagicMock, file_id: str) -> MagicMock:
    """Wire mock_service.files().create().execute() to return *file_id*."""
    create_req = MagicMock()
    create_req.execute.return_value = {"id": file_id}
    mock_service.files.return_value.create.return_value = create_req
    return create_req


def _mock_update(mock_service: MagicMock, file_id: str) -> MagicMock:
    """Wire mock_service.files().update().execute() to return *file_id*."""
    update_req = MagicMock()
    update_req.execute.return_value = {"id": file_id}
    mock_service.files.return_value.update.return_value = update_req
    return update_req


# ── _list_kwargs ──────────────────────────────────────────────────────────


class TestListKwargs:
    def test_standard_drive(self) -> None:
        provider, _ = _make_provider()
        kw = provider._list_kwargs()
        assert kw["supportsAllDrives"] is True
        assert kw["includeItemsFromAllDrives"] is True
        assert "corpora" not in kw
        assert "driveId" not in kw

    def test_shared_drive(self) -> None:
        provider, _ = _make_provider(shared_drive_id="drive-123")
        kw = provider._list_kwargs()
        assert kw["supportsAllDrives"] is True
        assert kw["includeItemsFromAllDrives"] is True
        assert kw["corpora"] == "drive"
        assert kw["driveId"] == "drive-123"


# ── _find_by_name ─────────────────────────────────────────────────────────


class TestFindByName:
    def test_returns_id_when_found(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "found-1", "name": "MyFolder"}])
        result = provider._find_by_name("MyFolder", "parent-1")
        assert result == "found-1"

    def test_returns_none_when_empty(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        result = provider._find_by_name("Missing", "parent-1")
        assert result is None

    def test_query_includes_parent_id(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        provider._find_by_name("X", "par-99")
        call_kwargs = svc.files.return_value.list.call_args
        q = call_kwargs.kwargs.get("q") or call_kwargs[1].get("q")
        assert "'par-99' in parents" in q

    def test_query_omits_parent_when_none(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        provider._find_by_name("X", None)
        call_kwargs = svc.files.return_value.list.call_args
        q = call_kwargs.kwargs.get("q") or call_kwargs[1].get("q")
        assert "in parents" not in q

    def test_query_includes_mime_type(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        provider._find_by_name("X", "par-1", mime_type=FOLDER_MIME)
        call_kwargs = svc.files.return_value.list.call_args
        q = call_kwargs.kwargs.get("q") or call_kwargs[1].get("q")
        assert FOLDER_MIME in q

    def test_query_omits_mime_type_when_none(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        provider._find_by_name("X", "par-1", mime_type=None)
        call_kwargs = svc.files.return_value.list.call_args
        q = call_kwargs.kwargs.get("q") or call_kwargs[1].get("q")
        assert "mimeType" not in q

    def test_shared_drive_kwargs_applied(self) -> None:
        provider, svc = _make_provider(shared_drive_id="sd-1")
        _mock_list(svc, [])
        provider._find_by_name("X", None)
        call_kwargs = svc.files.return_value.list.call_args
        assert call_kwargs.kwargs.get("corpora") == "drive" or call_kwargs[1].get("corpora") == "drive"


# ── _ensure_folder_sync ───────────────────────────────────────────────────


class TestEnsureFolderSync:
    def test_returns_existing_folder(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "existing-1", "name": "Docs"}])
        result = provider._ensure_folder_sync("Docs", "parent-5")
        assert result == "existing-1"
        svc.files.return_value.create.assert_not_called()

    def test_creates_folder_when_not_found(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "new-folder-1")
        result = provider._ensure_folder_sync("NewFolder", "parent-5")
        assert result == "new-folder-1"
        create_kwargs = svc.files.return_value.create.call_args
        body = create_kwargs.kwargs.get("body") or create_kwargs[1].get("body")
        assert body["name"] == "NewFolder"
        assert body["mimeType"] == FOLDER_MIME
        assert body["parents"] == ["parent-5"]

    def test_create_with_no_parent_no_shared_drive(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "root-folder")
        provider._ensure_folder_sync("Root", None)
        create_kwargs = svc.files.return_value.create.call_args
        body = create_kwargs.kwargs.get("body") or create_kwargs[1].get("body")
        assert "parents" not in body

    def test_create_with_no_parent_uses_shared_drive(self) -> None:
        provider, svc = _make_provider(shared_drive_id="sd-99")
        _mock_list(svc, [])
        _mock_create(svc, "sd-root")
        provider._ensure_folder_sync("Root", None)
        create_kwargs = svc.files.return_value.create.call_args
        body = create_kwargs.kwargs.get("body") or create_kwargs[1].get("body")
        assert body["parents"] == ["sd-99"]

    def test_create_passes_supports_all_drives(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "f-1")
        provider._ensure_folder_sync("X", "p-1")
        create_kwargs = svc.files.return_value.create.call_args
        assert create_kwargs.kwargs.get("supportsAllDrives") is True or create_kwargs[1].get("supportsAllDrives") is True


# ── _ensure_file_sync ─────────────────────────────────────────────────────


class TestEnsureFileSync:
    def test_creates_file_when_not_found(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "new-file-1")
        result = provider._ensure_file_sync("doc.json", "par-1", "application/json", b'{"a":1}')
        assert result == "new-file-1"
        create_kwargs = svc.files.return_value.create.call_args
        body = create_kwargs.kwargs.get("body") or create_kwargs[1].get("body")
        assert body["name"] == "doc.json"
        assert body["parents"] == ["par-1"]

    def test_updates_file_when_found(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "existing-file", "name": "doc.json"}])
        _mock_update(svc, "existing-file")
        result = provider._ensure_file_sync("doc.json", "par-1", "application/json", b'{"a":2}')
        assert result == "existing-file"
        update_kwargs = svc.files.return_value.update.call_args
        assert update_kwargs.kwargs.get("fileId") == "existing-file" or update_kwargs[1].get("fileId") == "existing-file"
        svc.files.return_value.create.assert_not_called()

    def test_update_passes_supports_all_drives(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "f-1", "name": "x.txt"}])
        _mock_update(svc, "f-1")
        provider._ensure_file_sync("x.txt", "p-1", "text/plain", b"data")
        update_kwargs = svc.files.return_value.update.call_args
        assert update_kwargs.kwargs.get("supportsAllDrives") is True or update_kwargs[1].get("supportsAllDrives") is True

    def test_create_passes_supports_all_drives(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "f-2")
        provider._ensure_file_sync("x.txt", "p-1", "text/plain", b"data")
        create_kwargs = svc.files.return_value.create.call_args
        assert create_kwargs.kwargs.get("supportsAllDrives") is True or create_kwargs[1].get("supportsAllDrives") is True

    def test_create_includes_media_body(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "f-3")
        provider._ensure_file_sync("data.bin", "p-1", "application/octet-stream", b"\x00\x01")
        create_kwargs = svc.files.return_value.create.call_args
        assert create_kwargs.kwargs.get("media_body") is not None or create_kwargs[1].get("media_body") is not None


# ── async wrappers ────────────────────────────────────────────────────────


class TestAsyncWrappers:
    @pytest.mark.asyncio
    async def test_ensure_folder_async(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "async-folder")
        result = await provider.ensure_folder(name="F", parent_id="p-1")
        assert result == "async-folder"

    @pytest.mark.asyncio
    async def test_ensure_file_async(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [])
        _mock_create(svc, "async-file")
        result = await provider.ensure_file(
            name="f.txt", parent_id="p-1", content_type="text/plain", content_bytes=b"hi"
        )
        assert result == "async-file"

    @pytest.mark.asyncio
    async def test_ensure_folder_idempotent_async(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "idem-1", "name": "Same"}])
        result = await provider.ensure_folder(name="Same", parent_id="p-1")
        assert result == "idem-1"
        svc.files.return_value.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_ensure_file_update_async(self) -> None:
        provider, svc = _make_provider()
        _mock_list(svc, [{"id": "up-1", "name": "f.txt"}])
        _mock_update(svc, "up-1")
        result = await provider.ensure_file(
            name="f.txt", parent_id="p-1", content_type="text/plain", content_bytes=b"new"
        )
        assert result == "up-1"
        svc.files.return_value.create.assert_not_called()
