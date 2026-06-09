# ArcadeIQ Architecture

ArcadeIQ is being modernized from a course-era SQL Server desktop application into a personally deployed game intelligence platform.

## Current Legacy Architecture

```text
Java Swing UI
    |
    | JDBC stored procedure calls
    v
SQL Server database
    |
    | tables, views, stored procedures, grants
    v
Marketplace data model

TypeScript population scripts
    |
    | CSV import through mssql
    v
SQL Server database

Playwright scraper
    |
    | Steam data export
    v
CSV seed data
```

The legacy system keeps most business behavior in SQL Server stored procedures. The Java UI calls those procedures directly through JDBC. The TypeScript population scripts load games, users, and reviews from CSV data.

## Core Domains

- **Identity:** player users, developer users, bcrypt password hashes
- **Catalog:** games, tags, developers, publishers
- **Commerce:** purchases, bundles, vouchers, user balances
- **Community:** reviews and ratings
- **Collections:** user folders and favorite games
- **Developer tools:** game editing, bundle management, revenue lookup
- **Data ingestion:** Steam scraping and CSV population

## Target Architecture

```text
React or Next.js frontend
    |
    | HTTP API
    v
Backend API
    |
    | typed service layer
    v
Database
    |
    | normalized schema, migrations, seed data
    v
Game intelligence data model

AI service layer
    |
    | structured extraction, summaries, recommendations
    v
Search, review intelligence, developer insights
```

The first modernization step is not to rewrite everything at once. The initial goal is to make the current project safe to publish, locally deployable, and clearly documented. After that, the backend API can be introduced between the UI and the database.

## Database Direction

The current schema is SQL Server/T-SQL heavy. It uses stored procedures, table-valued parameters, `GO` batch separators, `THROW`, `bit`, `money`, and SQL Server-specific grants.

Short term:

- Keep SQL Server as the legacy database target.
- Run it locally or in a personally controlled cloud environment.
- Keep migrations as historical database documentation.

Long term:

- Consider PostgreSQL if AI features require vector search, embedding storage, or deeper analytics.
- Avoid an immediate MySQL migration because it would require rewriting much of the T-SQL surface without adding much AI/product value.

## AI Integration Points

- **Natural-language game search:** Convert user text into structured filters for tags, price, release date, publisher, developer, and review availability.
- **Review summarization:** Summarize player feedback into sentiment, praise, complaints, and recommendation signals.
- **Developer copilot:** Explain revenue, review trends, catalog gaps, and tag performance.
- **Data quality assistant:** Detect duplicate games, malformed dates, missing metadata, suspicious prices, and inconsistent publisher/developer records.
- **Recommendation engine:** Recommend games from player inventory, preferred tags, reviews, and price behavior.

## Modernization Principles

- Keep the legacy project understandable before rewriting it.
- Replace hardcoded infrastructure with environment variables.
- Prefer personal local/cloud deployments over school-hosted resources.
- Add AI only where it improves an existing workflow.
- Keep database changes reproducible through migrations or documented schema scripts.
