# Collection Reliability Verification — 2026-09-14

Scope: modern account authentication, collection ownership, persistence, truthful failures, and retained AI behavior. Results include local automated checks and a browser walkthrough; this is not a deployment.

## Baseline

Before implementation, the existing backend suite passed all 46 tests and the frontend production build passed. The newly added regression tests exposed behavior that the original suite did not cover.

## Reproduction Before the Fix

New HTTP route tests expected `401` for all nine collection/saved-game endpoints without a bearer token. All nine instead accessed the database; a blocking mock converted those accesses into `500` responses. The removed anonymous guest-session endpoint also accessed the database, producing ten failing subcases.

The real PostgreSQL test confirmed the consequence: `GET /api/saved-games?userId=player-a` and the corresponding insights request returned `200` without authentication. Anonymous delete requests returned `204`. Test users, collections, and saved games existed only inside isolated test schemas. Requests containing a forged body owner were also accepted before the schema contract changed.

## Results After the Fix

- **53 backend tests passed**, including six PostgreSQL integration tests.
- Without `ARCADEIQ_TEST_DATABASE_URL`, **47 tests passed** and the PostgreSQL class was explicitly skipped.
- All nine endpoints reject missing/invalid/expired tokens before accessing the database.
- Real-database checks cover register/login, save, reload through a new request/session, repeated-save idempotence, account isolation across reads/writes/deletes/insights, rejected body owners, ignored legacy query owners, and inactive/expired account sessions.
- Existing AI search fallback, intent, game-insight, and collection-insight tests passed. No paid AI provider was called.

The tests used Python 3.12.7 and the repository's existing local PostgreSQL connection. Each integration test created a unique `arcadeiq_test_<uuid>` schema, applied the real SQLAlchemy models including PostgreSQL arrays, and used a new database session for each HTTP request. Cleanup dropped only the schema created by that test. A post-run check found **zero remaining `arcadeiq_test_%` schemas**. Existing application tables and data were not used or changed.

## Reproduce

From the repository root with the backend virtual environment active:

```powershell
python -m pip install -r backend/requirements-dev.txt
$env:ARCADEIQ_TEST_DATABASE_URL="postgresql+psycopg://arcadeiq:arcadeiq_dev_password@localhost:5432/arcadeiq"
python -m unittest discover -s backend/tests -t backend -v
```

The test URL must use `postgresql+psycopg` and a loopback host, with no query parameters. Its database user must be able to create schemas. Omitting the variable skips the integration class instead of automatically connecting to the application database.

The CI configuration now provisions a PostgreSQL service and enables the same suite. This note records local execution; it does not claim that the changed GitHub Actions workflow has run remotely.

## Frontend Regression Coverage

Final verification: **41 tests passed across five frontend test files** and **`npm run build` passed** (TypeScript and Vite production build). The final backend rerun also passed all 53 tests, including the six PostgreSQL integration tests. `git diff --check` passed.

Frontend tests exercise API failures without local writes, explicit mode and token isolation, failed or expired account checks, duplicate login/save requests, delayed responses after account changes, refresh persistence, partial create-and-save success, and delayed AI insights. Demo storage read failures and malformed JSON now reject rather than report empty data or overwrite it. Six added storage regressions failed before that correction and passed afterwards.

## Browser Walkthrough

Using the actual React frontend and FastAPI application with an isolated PostgreSQL schema and synthetic accounts, the following were observed:

- Demo save survives a page reload; switching to API mode does not inherit the demo collection.
- Account A can sign in, save a game, and recover that saved game after a full page reload.
- Signing out immediately clears account collections and collection intelligence. Account B starts with its own empty collection.
- Natural-language rules search, game intelligence, collection intelligence, and the Developer view remain functional.
- After stopping only the test API server, a save displays an error beside the save control, keeps the saved count at zero, and offers reload. It never reports a local save as API success.
- Reloading while the API is unavailable keeps API mode, displays account/catalog retry controls, and explains that the saved sign-in is retained.

The walkthrough used local ports 4188 and 8017. Its two games and accounts existed only in one `arcadeiq_browser_<uuid>` schema. That schema was removed after the check; the final query found zero remaining browser or integration test schemas. No existing application data was changed. Live DeepSeek requests and mobile layout were not evaluated in this pass.
