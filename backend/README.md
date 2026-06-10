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
```

Run the AI-ready search flow:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/api/search" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"query":"Show highly rated story rich games under 25 dollars"}'
```

The search endpoint currently uses a rules-based intent parser and returns the same response shape planned for a future LLM-backed parser.

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
