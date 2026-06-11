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
GET /api/collections
POST /api/collections
GET /api/saved-games
GET /api/saved-games/insights
POST /api/saved-games
DELETE /api/saved-games
DELETE /api/saved-games/{gameId}
```

Saved-game endpoints accept an optional `collectionId` query/body field. When omitted, the API uses the user's `Default Shortlist` collection.

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

### Python virtual environment

Create a virtual environment and install dependencies:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set a PostgreSQL database URL:

```powershell
$env:ARCADEIQ_DATABASE_URL="postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq"
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
