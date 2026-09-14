# ArcadeIQ Backend

FastAPI backend for the modern ArcadeIQ web app.

## Run Locally

### Docker

From the repository root:

```powershell
docker compose up -d postgres backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

Open:

```text
http://localhost:8000/docs
```

## API Preview

List seeded games:

```text
GET /api/games
GET /api/games/{id}
GET /api/games/{id}/insights
GET /api/users               # admin bearer token required
GET /api/users/{userId}      # same user or admin bearer token required
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
GET /api/collections
POST /api/collections
PATCH /api/collections/{collectionId}
DELETE /api/collections/{collectionId}
GET /api/saved-games
GET /api/saved-games/insights
POST /api/saved-games
DELETE /api/saved-games
DELETE /api/saved-games/{gameId}
```

All collection and saved-game endpoints, including `/api/saved-games/insights`, require an active account's bearer token. Missing, invalid, expired, or inactive-account tokens return `401`. Ownership always comes from that token. Requests targeting another account's collection return `404`.

Saved-game endpoints accept an optional `collectionId` query/body field. When omitted, the API uses the authenticated user's `Default Shortlist` collection. Saving the same game to the same collection again returns the existing saved item.

Collection create/update and saved-game request bodies no longer accept `userId` (or other extra fields); these return `422`. Legacy `userId` query parameters are ignored and cannot change ownership. Example bodies:

```json
{"name": "Wishlist", "description": "Games to compare"}
```

```json
{"gameId": 2, "collectionId": 4}
```

The anonymous `POST /api/users/session` endpoint has been removed. Use `/api/auth/register` or `/api/auth/login` for API-backed saves. The frontend's fixed-data demo stores collections in the browser without creating server guest users. Existing guest records are retained; this change does not migrate or delete their data.

The seed script also creates a local admin placeholder account. Configure these values through local environment variables only:

```env
ARCADEIQ_ADMIN_USER_ID=local-admin
ARCADEIQ_ADMIN_EMAIL=admin@arcadeiq.local
ARCADEIQ_ADMIN_DISPLAY_NAME=Local Admin
ARCADEIQ_ADMIN_PASSWORD=change-this-local-admin-password
ARCADEIQ_AUTH_SECRET=local-only-change-this-auth-secret
ARCADEIQ_AUTH_TOKEN_TTL_SECONDS=43200
```

The password is hashed before storage. `/api/auth/login` returns a local bearer token for the current admin shell; use deployment secrets for real environments.

Run the AI-ready search flow:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/api/search" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"query":"Show highly rated story rich games under 25 dollars"}'
```

The search endpoint defaults to the local rules-based intent parser. The optional DeepSeek provider uses the same normalized intent and search response contract.

### Optional AI Provider

ArcadeIQ defaults to the free local rules parser. To enable the existing DeepSeek-backed parser, configure these values in your local `.env` or deployment secrets:

```env
ARCADEIQ_AI_ENABLED=true
ARCADEIQ_AI_PROVIDER=deepseek
ARCADEIQ_AI_FALLBACK_TO_RULES=true
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_KEY=your-local-key
```

If the provider is disabled, missing a key, or returns an invalid payload, `/api/search` falls back to the local rules parser when `ARCADEIQ_AI_FALLBACK_TO_RULES=true`.

### Local PostgreSQL + Python virtual environment

The backend reads environment variables from the repository root `.env` file when it exists. The default local URL is:

```powershell
$env:ARCADEIQ_DATABASE_URL="postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq"
```

Create a virtual environment and install dependencies:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If Python 3.12 is unavailable, use Python 3.10 or newer.

Create the local database once in PostgreSQL:

```powershell
psql -U postgres -d postgres -c "CREATE ROLE arcadeiq LOGIN PASSWORD 'arcadeiq_dev_password';"
createdb -U postgres --owner arcadeiq arcadeiq
```

Run migrations and seed demo data:

```powershell
alembic upgrade head
python -m app.scripts.seed
```

Start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/docs
```

## Test

Install the development dependencies and run backend tests from the repository root:

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m unittest discover -s backend/tests -t backend
```

This runs the unit and HTTP route tests without connecting to a database or calling an AI provider. PostgreSQL integration tests are skipped unless explicitly enabled:

```powershell
$env:ARCADEIQ_TEST_DATABASE_URL="postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq"
python -m unittest discover -s backend/tests -t backend
```

The integration suite accepts only a local PostgreSQL URL without query parameters. It creates a unique `arcadeiq_test_<uuid>` schema per test, uses the real PostgreSQL models (including array fields), opens a fresh database session per request, and drops only its own schema during cleanup. The database user needs permission to create schemas. Existing application tables and data are not used.

Coverage includes login/save/reload, repeated-save idempotence, account isolation across read/write/delete/insights routes, forged owner inputs, and rejection of missing/expired/inactive sessions without data changes. AI search fallback, intent parsing, and game/collection insight tests remain part of the same suite; these tests do not require a provider key.
