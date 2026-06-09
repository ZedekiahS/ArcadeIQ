# ArcadeIQ Migration Plan

This plan moves ArcadeIQ from a copied course project into a personally maintained and deployable AI/data product.

## Phase 1: Public Repository Baseline

Goal: make the repository safe and understandable.

- Add a professional README.
- Remove school-hosted database assumptions from app configuration.
- Move database settings to `ARCADEIQ_DB_*` environment variables.
- Ignore local secrets, generated JavaScript, `node_modules`, temporary Office files, and personal-looking seed user data.
- Keep the legacy code intact enough to preserve project history.

Status: in progress.

## Phase 2: Personal SQL Server Deployment

Goal: run the existing application without the school server.

- Create a personal SQL Server database named `ArcadeIQ`.
- Create a personal app login/user named `ArcadeIQApp`.
- Apply the legacy SQL migrations or rebuild a clean schema from them.
- Load safe seed data from `data/gamedata.csv` and `data/reviews.csv`.
- Create a sanitized replacement for `data/userdata.csv`.
- Document local setup steps.

Setup entry point:

- [Local SQL Server Setup](local-sqlserver-setup.md)

Recommended local options:

- SQL Server Developer Edition
- SQL Server in Docker
- Azure SQL for a cloud-hosted demo

## Phase 3: Legacy Stabilization

Goal: make the current Java and SQL system easier to reason about.

- Fix visible text encoding issues in the Java UI.
- Replace old package/window names with ArcadeIQ naming.
- Add scripts for local database setup.
- Add screenshots and ER diagram exports.
- Consolidate duplicate or superseded stored procedure migrations.
- Add smoke tests for the data population scripts.

## Phase 4: Backend API Layer

Goal: stop having the UI call stored procedures directly.

- Introduce a backend API using Spring Boot, FastAPI, or Node.js.
- Move database access into service/repository modules.
- Expose stable endpoints for games, users, reviews, purchases, bundles, and developer analytics.
- Keep the Java Swing UI as legacy, or replace it with a web frontend.

Recommended direction for portfolio value:

- FastAPI or Spring Boot backend
- React or Next.js frontend
- SQL Server first, PostgreSQL later if AI features need it

## Phase 5: AI Feature MVP

Goal: add one AI feature that clearly improves the product.

First AI feature:

- Natural-language game search
- Input: "Find cheap multiplayer survival games with good reviews"
- Output: structured filters such as tags, max price, review requirement, date range, developer, and publisher
- Database action: query the existing game list endpoint or stored procedure

Second AI feature:

- Review summarization
- Summarize player feedback for a selected game
- Produce pros, cons, sentiment, and common themes

Third AI feature:

- Developer insights
- Explain revenue, review trends, and tag/category opportunities

## Phase 6: Long-Term Database Decision

Do not migrate to MySQL by default. The current project is SQL Server-specific, and MySQL would require a large rewrite without directly supporting the AI roadmap.

Preferred options:

- **Stay on SQL Server** if the goal is to preserve and polish the original database system.
- **Move to PostgreSQL** if the goal is stronger AI/search/analytics support, especially with embeddings and pgvector.

Decision rule:

- Use SQL Server for the first personal deployment.
- Revisit PostgreSQL when the backend API and first AI MVP are working.
