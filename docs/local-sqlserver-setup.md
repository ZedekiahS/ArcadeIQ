# Local SQL Server Setup

This guide sets up ArcadeIQ on a personally controlled SQL Server instance. The project no longer uses the original school-hosted database server.

## Option A: Docker SQL Server

Prerequisites:

- Docker Desktop
- SQL Server command-line tools (`sqlcmd`) available on PATH

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set strong local passwords:

```text
ARCADEIQ_DB_SERVER=localhost
ARCADEIQ_DB_PORT=1433
ARCADEIQ_DB_NAME=ArcadeIQ
ARCADEIQ_DB_USER=ArcadeIQApp
ARCADEIQ_DB_PASSWORD=<app-user-password>
ARCADEIQ_SA_PASSWORD=<strong-sa-password>
```

Start SQL Server:

```powershell
docker compose --env-file .env up -d sqlserver
```

Create the database and app user:

```powershell
sqlcmd -S localhost,1433 -U sa -P "<strong-sa-password>" -C `
  -i scripts/sqlserver/create-local-database.sql `
  -v DB_NAME="ArcadeIQ" APP_LOGIN="ArcadeIQApp" APP_PASSWORD="<app-user-password>"
```

Apply the legacy migrations:

```powershell
.\scripts\run-sqlserver-migrations.ps1 `
  -Server "localhost,1433" `
  -Database "ArcadeIQ" `
  -User "sa" `
  -Password "<strong-sa-password>"
```

## Option B: Existing Local SQL Server

If you already have SQL Server Developer Edition installed locally, skip Docker and run the same `sqlcmd` and migration commands against your local instance.

Example:

```powershell
sqlcmd -S localhost -U sa -P "<sa-password>" -C `
  -i scripts/sqlserver/create-local-database.sql `
  -v DB_NAME="ArcadeIQ" APP_LOGIN="ArcadeIQApp" APP_PASSWORD="<app-user-password>"
```

## App Environment Variables

The Java UI and TypeScript population scripts read these values:

```text
ARCADEIQ_DB_SERVER=localhost
ARCADEIQ_DB_PORT=1433
ARCADEIQ_DB_NAME=ArcadeIQ
ARCADEIQ_DB_USER=ArcadeIQApp
ARCADEIQ_DB_PASSWORD=<app-user-password>
ARCADEIQ_DB_ENCRYPT=false
ARCADEIQ_DB_TRUST_CERT=true
```

## Seed Data

The repository includes game and review CSV data. The original user seed CSV is intentionally ignored because it contains personal-looking sample fields.

After the schema is created, use `PopulationScripts` to load data:

```powershell
cd PopulationScripts
npm ci
npx tsc
node main.js
```

## Legacy Migration Caveat

The current `migrations/` directory preserves the original course-project migration history. These files may need cleanup before they behave like a clean production Flyway history. If a migration fails, treat that as part of the legacy stabilization phase:

- Identify the failing migration.
- Check whether a later migration supersedes it.
- Decide whether to patch the legacy migration runner path or create a clean baseline schema.

The recommended near-term goal is to create a working local SQL Server baseline. The recommended long-term goal is to consolidate the schema into a cleaner migration set.
