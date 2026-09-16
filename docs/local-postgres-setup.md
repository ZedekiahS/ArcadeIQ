# Local PostgreSQL Setup

This guide runs the modern Game Discovery Lens backend with PostgreSQL. This is the recommended database path for the web app and future AI features.

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
GDL_POSTGRES_DB=gdl
GDL_POSTGRES_USER=gdl
GDL_POSTGRES_PASSWORD=gdl_dev_password
GDL_DATABASE_URL=postgresql+psycopg://gdl:gdl_dev_password@localhost:5432/gdl
```

Frontend settings are separate: copy `frontend/.env.example` to `frontend/.env.local` if you need a different `VITE_DATA_MODE` or `VITE_API_BASE_URL`. The Vite project does not read the repository root `.env`.

## 2. Start PostgreSQL

### Option A: Installed PostgreSQL

```powershell
psql -U postgres -d postgres -c "CREATE ROLE gdl LOGIN PASSWORD 'gdl_dev_password';"
createdb -U postgres --owner gdl gdl
```

If the role or database already exists, keep the existing objects and make sure the password matches `GDL_DATABASE_URL`.

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
http://localhost:5173/?mode=api
```

API mode uses FastAPI and PostgreSQL. Register or sign in before saving to account collections. API errors stay visible and never become local save successes. For a fixed-data demonstration without the backend, open `http://localhost:5173/?mode=demo`; this is also the default mode and saves only in the browser. See [frontend configuration](../frontend/README.md).

## Deployment Note

Docker is for local development. For a public web deployment, use a managed PostgreSQL provider such as Supabase, Neon, Railway, or Azure Database for PostgreSQL. The public frontend should talk to the backend API, and only the backend should connect to the database.
