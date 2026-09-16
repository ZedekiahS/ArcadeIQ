# ArcadeIQ: Making a Game-Discovery Application Reliable

ArcadeIQ began as group coursework built with Java Swing and SQL Server. This case study covers the subsequent React/TypeScript, FastAPI, and PostgreSQL refactor. The original application remains as project history; its group authorship is distinct from the modern implementation described here.

The goal is a portfolio application with inspectable engineering decisions: predictable search, account-owned collections, honest failure states, and bounded AI integration. The web application runs independently of the original school database.

## Three Changes with Observable Consequences

**1. Saving belongs to the authenticated account.** Before the ownership correction, requests could read saved games using a supplied `userId` without authentication. Regression tests reproduced that behavior against an isolated PostgreSQL schema. Collection and saved-game routes now derive ownership from the bearer token, reject forged body-owner fields, and hide another account's collections.

Persistence also needs an honest failure path. In the browser acceptance check, stopping the API during a save produced a visible failure and a reload action. It preserved API mode and the existing saved count. Restarting the API allowed recovery, and refreshing restored the account's saved games. [Ownership and persistence evidence](verification/collections-2026-09-14.md) documents the reproductions and fixes.

**2. A search result must answer the current request.** Previously, `Celeste` and an unknown title both produced unrestricted intents with an implicit price ceiling. Decimal budgets could also lose precision. The refactor introduced nullable literal title and budget constraints, combined with tags, rating, and review eligibility. SQL escapes `%` and `_` in title searches.

Correct parsing is only part of correctness: a slow earlier request must not overwrite a newer search or manual filter. Discovery and detail hooks guard response order and selected-game identity. Account and collection hooks apply equivalent session guards. These boundaries keep delayed results from restoring stale selections or another session's data. [Search verification](verification/search-2026-09-14.md) records the triggering failures and regression coverage.

**3. Entering as a player starts with discovery.** An earlier screen opened with a prefilled second-most-expensive FPS query. The homepage now offers player and developer perspectives: recommendations for players, a catalog overview for developers, and search on demand. The perspectives do not change account permissions. English/Chinese presentation preserves canonical identifiers, user-written collection names, and provider text. Page composition, navigation, translations, and data adapters have separate responsibilities in the [architecture](architecture.md).

## AI with a Testable Boundary

The optional DeepSeek provider translates a query into a normalized search intent. SQLAlchemy constructs the database filters and ranking. Responses identify `deepseek` or `rules`; provider failures follow the configured fallback policy. Normalization validates structure and supported values, but does not establish that the interpretation matches the user's request.

A small catalog can hide that distinction. Treating “free” as a title fragment might accidentally return the only free game. The separate [boundary fixture](../tests/fixtures/search-evaluation-boundaries.json) adds 16 synthetic games and 10 manually specified queries, including a paid “Fixture Freeport,” prices of $19.99/$20/$20.01, tied prices, zero reviews with a high rating, and similar titles. Expected intents and ordered game IDs expose semantic and execution mistakes separately. These are test records, not market data.

The [AI evaluation record](verification/ai-evaluation-2026-09-15.md) reports measured provider behavior and limitations. Automated tests, isolated PostgreSQL checks, browser failure exercises, and build checks provide complementary evidence. This remains a portfolio demonstration: current insights summarize catalog metadata, live market accuracy is unverified, and logout clears the browser session without server-side token revocation.
