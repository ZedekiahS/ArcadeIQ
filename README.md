# ArcadeIQ

ArcadeIQ is a game-discovery portfolio application demonstrating full-stack development, account isolation, persistence, error handling, and AI integration. It originated as a group course project using Java Swing and SQL Server; the modern application uses React, FastAPI, and PostgreSQL.

The current refactor focuses on a reproducible demonstration of reliable software behavior. A fixed-data browser demo and an authenticated API mode make the storage boundary explicit. The modern app does not depend on the original school-hosted database server.

## Project Goals

- Demonstrate a complete login, save, and reload workflow with isolated account data.
- Make API failures visible and retryable, with automated regression coverage.
- Keep data access and identity behavior understandable as the interface evolves.
- Preserve natural-language search and insight interfaces for further AI work.
- Retain the original database coursework as project history.

## Current Features

Modern web prototype:

- Natural-language game search with a local rules parser and an optional DeepSeek provider.
- Game detail intelligence panels for review signals, player recommendations, and developer opportunity.
- Registration and login with bearer-token ownership for API collections; browser-only storage in explicit demo mode.
- User collections for saving games into separate lists such as a default shortlist, wishlists, or research folders.
- Collection intelligence summaries for saved games, including average price, rating, visible revenue, and top tags.

Legacy database application:

- Player and developer registration/login with bcrypt password hashing.
- Game browsing with filters for name, reviews, tags, developers, publishers, price, and release date.
- Game detail views with developers, publishers, tags, pricing, release date, and reviews.
- Player inventory and game purchasing with balance checks.
- Review creation and review browsing.
- Developer game management, including add, edit, delete, tag updates, developer links, and publisher links.
- Bundle creation, bundle linking, bundle viewing, and bundle purchasing.
- Game folders for organizing favorite or owned games.
- Voucher creation and redemption.
- Steam game scraping pipeline for generating seed data.
- CSV-based population scripts for games, users, and reviews.

## Tech Stack

- **Database:** Microsoft SQL Server
- **Modern product database:** PostgreSQL with pgvector-ready local development
- **Database logic:** SQL migrations, stored procedures, views, table-valued parameters, transactions
- **Web frontend:** React, TypeScript, Vite
- **Backend API:** FastAPI, SQLAlchemy, Alembic
- **Desktop UI:** Java Swing
- **Authentication:** PBKDF2 password hashing and signed bearer tokens in the modern API; bcrypt in the legacy application
- **Data ingestion:** TypeScript, Node.js, `mssql`, PapaParse
- **Web scraping:** Playwright, TypeScript
- **Seed data:** CSV files

## Repository Structure

```text
ArcadeIQ/
  data/                 CSV seed data for users, games, and reviews
  demo/                 Static browser demo that runs without dependencies
  docs/                 Architecture notes and modernization plan
  backend/              FastAPI backend for the modern web app
  frontend/             React + TypeScript web app prototype
  migrations/           SQL Server schema, stored procedures, views, and grants
  PopulationScripts/    TypeScript scripts for loading CSV data into SQL Server
  UI/                   Java Swing desktop application
  Views/                Additional SQL view definitions
  WebScrape/            Playwright scraper for Steam game data
  ER.vsdx               Entity relationship diagram
```

## Documentation

- [Architecture](docs/architecture.md)
- [Local PostgreSQL Setup](docs/local-postgres-setup.md)
- [Local SQL Server Setup](docs/local-sqlserver-setup.md)
- [Migration Plan](docs/migration-plan.md)
- [Legacy SQL Migrations](migrations/README.md)
- [Frontend modes and configuration](frontend/README.md)
- [Backend authentication and tests](backend/README.md)
- [Collection reliability verification](docs/verification/collections-2026-09-14.md)

## Local Demo

ArcadeIQ includes a lightweight browser demo that runs without SQL Server:

```powershell
.\scripts\start-demo.ps1
```

Then open `http://localhost:4173`.

This earlier static prototype is retained for reference. Use the React frontend below to demonstrate the current account and collection behavior. Sample insight text is not a summary of live review evidence.

## Web Frontend

The current web application lives in `frontend/`:

```powershell
.\scripts\start-frontend.ps1
```

Open [demo mode](http://localhost:5173/?mode=demo), which is also the default.

| Mode | Data source | Collection storage |
| --- | --- | --- |
| `?mode=demo` | Bundled catalog and local search/insight logic; no backend requests | This browser only; no server guest account |
| `?mode=api` | FastAPI/PostgreSQL | Signed-in account; failures remain errors and can be retried |

API mode never substitutes local samples or browser saves after a failed request. Demo data and account data are separate.

To configure the frontend, copy `frontend/.env.example` to `frontend/.env.local` if you do not already have a local file:

```env
VITE_DATA_MODE=demo
VITE_API_BASE_URL=http://localhost:8000/api
```

The URL mode takes precedence over `VITE_DATA_MODE`. Restart Vite after changing its environment, or rebuild for a static preview. The repository root `.env` configures the backend; this frontend loads its own environment from `frontend/`. See the [frontend guide](frontend/README.md).

## Backend API

The modern backend lives in `backend/` and exposes the first API surface for the web app:

```powershell
.\scripts\start-backend.ps1
```

After PostgreSQL is running, apply migrations and seed demo data:

```powershell
.\scripts\seed-backend.ps1
```

Then open `http://localhost:8000/docs`.

Open [API mode](http://localhost:5173/?mode=api), then register or sign in. All collection and saved-game endpoints, including collection insights, require an active account's bearer token. Their owner is derived from that token; client-supplied owner fields are rejected. The old anonymous `/api/users/session` endpoint has been removed without deleting existing guest records.

## Verification

Install development dependencies and run the backend suite from the repository root:

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m unittest discover -s backend/tests -t backend
```

The default suite runs without a database connection. To include real PostgreSQL persistence and isolation checks, set a local test URL explicitly:

```powershell
$env:ARCADEIQ_TEST_DATABASE_URL="postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq"
python -m unittest discover -s backend/tests -t backend
```

Each database test creates and removes only its own UUID-named schema. The suite does not use existing application tables. See [backend test details](backend/README.md#test).

From `frontend/`:

```powershell
npm ci
npm test
npm run build
```

The CI workflow runs the backend suite with a PostgreSQL service and runs frontend tests before building. AI-provider calls are disabled during these checks.

## Legacy Database Overview

The database models the core entities of a game marketplace:

- `User` and `DevUser` for player and developer accounts
- `Game` for game catalog entries
- `Developer`, `Producer`, `Develops`, and `Produces` for studio and publisher relationships
- `Tag` and `HasTag` for game classification
- `Reviews` for player ratings and written feedback
- `UserHasGame` for ownership and inventory
- `Bundle` and `InBundle` for grouped purchases
- `Folder` and `FavoriteGame` for user-curated collections
- `Voucher` for redemption-based ownership

Most workflows are implemented through stored procedures, including game search, user registration, authentication lookup, purchasing, review creation, bundle purchase, folder management, and developer analytics.

## AI Roadmap

The backend already supports natural-language intent parsing with local rules and an optional DeepSeek provider. When configured, provider output is normalized into the same search contract; the configured rules fallback handles disabled/unavailable providers. Game and collection insight endpoints remain available, with collection insights now protected by account ownership.

The current insight panels derive their text from catalog metadata and aggregate statistics. They do not yet summarize review source text. Future AI work should add inspectable review evidence and evaluate parser/provider behavior while preserving the search and insight interfaces. The collection reliability refactor does not call a paid provider or claim a live-provider evaluation.

Configure AI only through the backend environment; see [the backend provider guide](backend/README.md#optional-ai-provider). Provider secrets never belong in `VITE_*` variables.

## Refactor Roadmap

- Establish and preserve automated checks for the current application.
- Complete trustworthy account collections, persistence, and explicit failure handling.
- Improve title search and result selection next.
- Split larger interface/data modules around verified behavior.
- Extend AI with traceable evidence and reproducible evaluation.

## Security Notes

This repository should not contain real database passwords, private keys, or production credentials. Runtime secrets should be provided through environment variables or local configuration files that are excluded from Git.

The Java UI and TypeScript population scripts now use the `ARCADEIQ_DB_*` environment variables shown in `.env.example`.

## Status

ArcadeIQ is a portfolio application under focused refactoring. The current work targets reliable account and collection behavior, with documented checks and retained AI integration points. Deployment and live-provider validation are separate from this iteration.
