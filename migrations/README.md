# Legacy SQL Server Migrations

This directory contains the original SQL Server migration history from the project now presented as Game Discovery Lens.

These files are kept for continuity and documentation while the project is being refactored into a personally deployed game intelligence platform.

## Current Role

- Preserve the original schema evolution.
- Document tables, relationships, stored procedures, views, and grants.
- Support local SQL Server reconstruction during the first modernization phase.

## Important Notes

- The migrations are SQL Server/T-SQL specific.
- They include stored procedures, table-valued parameters, grants, `GO` batch separators, and other SQL Server conventions.
- The migrations retain the legacy `ArcadeIQApp` principal so the recorded sequence remains replayable. It is a technical compatibility identifier, not the current product brand.
- Some migration names and versions reflect the original course project history and may need cleanup before production-style Flyway usage.

## Refactor Direction

Short term:

- Keep these files as legacy migrations.
- Use them to rebuild a personal SQL Server database.
- Add setup notes once the local database path is confirmed.

Long term:

- Consolidate the schema into a clean baseline migration.
- Split seed data from schema migrations.
- Decide whether to stay on SQL Server or move to PostgreSQL for AI/search features.
