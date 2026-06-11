# ArcadeIQ

ArcadeIQ is a database-backed game intelligence platform built around game discovery, player reviews, purchases, developer tools, and analytics. The project started as a SQL Server database application and is now being rebuilt as a personally deployed AI/data product.

The project no longer depends on the original school-hosted database server. The current refactor is moving ArcadeIQ toward self-managed local and cloud deployments, with AI-assisted search, review summarization, player preference insights, and developer-facing recommendations.

## Project Goals

- Model a real game marketplace with users, games, developers, publishers, tags, reviews, bundles, folders, purchases, and vouchers.
- Centralize core business behavior in SQL Server stored procedures, views, constraints, and transactions.
- Provide a desktop UI for player and developer workflows.
- Use scraped and seeded data to populate the database.
- Evolve the project toward AI-powered discovery and analytics.
- Replace course-project infrastructure with personally controlled deployment infrastructure.

## Current Features

Modern web prototype:

- Natural-language game search backed by a FastAPI rules parser with an AI-provider fallback shape.
- Game detail intelligence panels for review signals, player recommendations, and developer opportunity.
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
- **Authentication:** bcrypt password hashing
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

## Local Demo

ArcadeIQ includes a lightweight browser demo that runs without SQL Server:

```powershell
.\scripts\start-demo.ps1
```

Then open `http://localhost:4173`.

The demo shows the intended product direction: natural-language game search, AI-style review intelligence, and developer-facing insights. It is a front-end prototype while the personal SQL Server deployment is being stabilized.

## Web Frontend

The future ArcadeIQ product surface lives in `frontend/`:

```powershell
.\scripts\start-frontend.ps1
```

Then open `http://localhost:5173`.

The frontend is a React + TypeScript app that can use the FastAPI/PostgreSQL backend and falls back to local mock data when the backend is unavailable. It supports natural search, game insights, collection-based saved games, and collection intelligence panels.

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

The frontend reads `VITE_API_BASE_URL` and falls back to local mock catalog data if the backend is unavailable.

## Database Overview

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

ArcadeIQ is being repositioned as an AI-enhanced game intelligence platform. Planned AI features include:

- **Natural-language game search:** Convert user requests like "Find cheap multiplayer survival games with good reviews" into structured database filters.
- **Review summarization:** Generate concise summaries of player sentiment, common praise, common complaints, and overall recommendation signals.
- **Developer copilot:** Help developers understand revenue, reviews, tags, and player behavior for their games.
- **Data quality assistant:** Detect missing metadata, duplicate games, malformed prices, suspicious dates, and inconsistent publisher/developer records.
- **Recommendation engine:** Suggest games based on inventory, tags, reviews, price preferences, and player behavior.

## Refactor Roadmap

- Replace hardcoded database configuration with environment-based settings.
- Clean up legacy naming from the original course project.
- Add clearer build and run instructions for the Java UI and TypeScript scripts.
- Organize database migrations into a cleaner migration strategy.
- Add screenshots and architecture diagrams.
- Introduce a backend API layer to separate UI concerns from database calls.
- Add AI-powered search and review intelligence as the first production-style AI features.
- Move from the legacy school-hosted SQL Server environment to personal local and cloud deployments.

## Security Notes

This repository should not contain real database passwords, private keys, or production credentials. Runtime secrets should be provided through environment variables or local configuration files that are excluded from Git.

The Java UI and TypeScript population scripts now use the `ARCADEIQ_DB_*` environment variables shown in `.env.example`.

## Status

ArcadeIQ is currently in refactor mode. The existing codebase demonstrates the database model and application workflows, while the next phase focuses on personal deployment, documentation, configuration cleanup, AI feature design, and a more modern application architecture.
