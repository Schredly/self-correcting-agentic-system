# Agent Control Plane — Backend

FastAPI backend for the Agent Control Plane with Google Drive integration.

## Setup

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Google Drive Integration

The scaffold-apply endpoint creates a folder tree in Google Drive from a
tenant's classification schema.  It uses a **Google service account** for
authentication.

### 1. Create a service account

1. Go to [Google Cloud Console → IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. Create a service account (or reuse an existing one).
3. Create a JSON key and download it.
4. Store the key file outside the repo, e.g. `~/.config/gcloud/sa-key.json`.

### 2. Set the environment variable

```bash
export GOOGLE_SERVICE_ACCOUNT_FILE=~/.config/gcloud/sa-key.json
```

Or place it in `backend/credentials/` (git-ignored):

```bash
mkdir -p backend/credentials
cp ~/Downloads/sa-key.json backend/credentials/
export GOOGLE_SERVICE_ACCOUNT_FILE=backend/credentials/sa-key.json
```

### 3. Share a Drive folder with the service account

1. In Google Drive, create a root folder (or use an existing one).
2. Right-click → Share → add the service account email
   (e.g. `my-sa@my-project.iam.gserviceaccount.com`) with **Editor** access.
3. Copy the folder ID from the URL:
   `https://drive.google.com/drive/folders/<FOLDER_ID>`

For **Shared Drives**, note the drive ID from the URL and pass it as
`shared_drive_id` in the request body.

### 4. Run scaffold-apply

First, create a classification schema for the tenant:

```bash
curl -X PUT http://localhost:8000/admin/acme/classification-schema \
  -H 'Content-Type: application/json' \
  -d '{
    "levels": [
      {"key": "category", "display_name": "Category", "required": true},
      {"key": "subcategory", "display_name": "Subcategory", "required": false}
    ],
    "version": "1"
  }'
```

Preview the scaffold plan (dry run):

```bash
curl http://localhost:8000/admin/acme/google-drive/scaffold-plan
```

Apply the scaffold to Google Drive:

```bash
curl -X POST http://localhost:8000/admin/acme/google-drive/scaffold-apply \
  -H 'Content-Type: application/json' \
  -d '{
    "root_folder_id": "<FOLDER_ID>"
  }'
```

With a Shared Drive:

```bash
curl -X POST http://localhost:8000/admin/acme/google-drive/scaffold-apply \
  -H 'Content-Type: application/json' \
  -d '{
    "root_folder_id": "<FOLDER_ID>",
    "shared_drive_id": "<SHARED_DRIVE_ID>"
  }'
```

The response includes a `created` map of logical paths to Drive folder/file IDs.

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx
python3.11 -m pytest tests/ -v
```
