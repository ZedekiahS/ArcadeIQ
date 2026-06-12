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
GET /api/users
GET /api/users/{userId}
POST /api/users/session
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
GET /api/collections
POST /api/collections
GET /api/saved-games
GET /api/saved-games/insights
POST /api/saved-games
DELETE /api/saved-games
DELETE /api/saved-games/{gameId}
```

Saved-game endpoints accept an optional `collectionId` query/body field. When omitted, the API uses the user's `Default Shortlist` collection.

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

The search endpoint currently uses a rules-based intent parser and returns the same response shape planned for a future LLM-backed parser.

### Optional AI Provider

ArcadeIQ defaults to the free local rules parser. To prepare a DeepSeek-backed parser later, configure these values in your local `.env` or deployment secrets:

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

Run backend tests from the repository root:

```powershell
python -m unittest discover -s backend/tests -t backend
```
