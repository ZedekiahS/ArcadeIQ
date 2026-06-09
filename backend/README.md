# ArcadeIQ Backend

FastAPI backend for the modern ArcadeIQ web app.

## Run Locally

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
