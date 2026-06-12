# Local PostgreSQL Setup

This guide runs the modern ArcadeIQ backend with PostgreSQL. This is the recommended database path for the web app and future AI features.

## Prerequisites

- PostgreSQL 16 or newer installed locally, or Docker Desktop if you prefer a containerized database
- Python 3.10 or newer; Python 3.12 is recommended
- Node.js for the frontend

## 1. Configure Environment

Create a local `.env` from the example:

```powershell
Copy-Item .env.example .env
```

The default local PostgreSQL values are:

```text
ARCADEIQ_POSTGRES_DB=arcadeiq
ARCADEIQ_POSTGRES_USER=arcadeiq
ARCADEIQ_POSTGRES_PASSWORD=arcadeiq_dev_password
ARCADEIQ_DATABASE_URL=postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq
VITE_API_BASE_URL=http://localhost:8000/api
```

## 2. Start PostgreSQL

### Option A: Installed PostgreSQL

```powershell
psql -U postgres -d postgres -c "CREATE ROLE arcadeiq LOGIN PASSWORD 'arcadeiq_dev_password';"
createdb -U postgres --owner arcadeiq arcadeiq
```

If the role or database already exists, keep the existing objects and make sure the password matches `ARCADEIQ_DATABASE_URL`.

### Option B: Docker PostgreSQL

```powershell
docker compose --env-file .env up -d postgres
```

The Docker path uses the `pgvector/pgvector:pg16` image so the local database is ready for future vector search work.

## 3. Install Backend Dependencies

If you run the backend in Docker:

```powershell
docker compose --env-file .env up -d postgres backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

If you run the backend directly on Windows, use a Python virtual environment:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 4. Run Migrations and Seed Data

From the repository root:

```powershell
.\scripts\seed-backend.ps1
```

This runs:

- `alembic upgrade head`
- `python -m app.scripts.seed`

## 5. Start the API

```powershell
.\scripts\start-backend.ps1
```

Open:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/api/health
```

Games endpoint:

```text
http://localhost:8000/api/games
```

## 6. Start the Frontend

In another terminal:

```powershell
.\scripts\start-frontend.ps1
```

Open:

```text
http://localhost:5173
```

The frontend tries the backend API first. If the backend is offline, it falls back to local mock catalog data so the UI can still be demonstrated.

## Deployment Note

Docker is for local development. For a public web deployment, use a managed PostgreSQL provider such as Supabase, Neon, Railway, or Azure Database for PostgreSQL. The public frontend should talk to the backend API, and only the backend should connect to the database.
