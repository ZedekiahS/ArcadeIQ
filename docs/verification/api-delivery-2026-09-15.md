# API Workflow and Delivery Verification — 2026-09-15

This pass checks the current bilingual player/developer interface against the real local FastAPI application and PostgreSQL. It also prepares the accumulated search, module, and UI changes for GitHub. This is local acceptance evidence, not a public deployment or a live DeepSeek quality evaluation.

## Environment and Isolation

- Actual React application served at `http://127.0.0.1:4188`; API at `http://localhost:8000/api`.
- PostgreSQL 18.4, accessed through the application's SQLAlchemy/psycopg stack.
- A fresh UUID-named `arcadeiq_browser_<uuid>` schema, selected through process-local `PGOPTIONS`, received Alembic migrations `0001` through `0004`, the 24 bundled seed games, and one synthetic player account.
- The API process allowed the exact frontend origin through CORS. Existing application tables and accounts were not used.
- A loopback HTTP provider stub at port 8021 exercised the actual DeepSeek adapter with a test-only credential. The real provider key and URL were overridden only in the test process.

## Browser Acceptance Results

| Scenario | Observed result |
| --- | --- |
| Enter `?mode=api#player` | API mode remains visible; recommendations load from PostgreSQL before any search. |
| Sign in | The synthetic player can sign in through the actual login form; account collections become available. |
| Search `Hades` | The API returns one matching game. With a valid controlled provider response, `source` is `deepseek` and the expanded search explanation identifies DeepSeek parsing. |
| Save and refresh | Hades saves into the default collection. A database read confirms one saved row. A full browser reload restores the signed-in account and Hades from the API. |
| Stop API, attempt another save | Saving Stardew Valley reports that success cannot be confirmed and offers collection reload. The visible saved count stays at one; a database read still contains only Hades. No demo fallback occurs. |
| Reload while disconnected | The page keeps API mode, retains the stored sign-in for retry, and exposes account and catalog recovery controls. |
| Restart API and retry | Account verification and catalog reload recover without entering credentials again. Hades returns. A subsequent Celeste save succeeds; the database contains exactly Hades and Celeste. |
| Provider returns HTTP 503 | The actual adapter falls back to rules. `Celeste` still returns HTTP 200 with `source: rules`; the UI explicitly says no AI interpretation was used. |
| Insight provenance | Game insights say backend rules and metadata, with no review text analyzed. Expanded collection insights identify the rules engine and catalog estimates. |
| Sign out and reload | Account identity, collections, and collection insights disappear; saving requires login. Reload remains signed out. Anonymous `/auth/me`, `/collections`, and `/saved-games` calls return HTTP 401. |

Logout clears the browser session; it does not revoke a previously issued bearer token on the server. Tokens remain subject to expiry and the active-account check. The acceptance result does not imply server-side token revocation.

Evidence screenshots: [failed API save](../screenshots/api-save-failure.png) and [rules fallback and collection provenance](../screenshots/api-rules-fallback.png). The displayed account is synthetic. No password, token, or real account information is included.

## Automated Verification

- **67 backend tests passed**, zero failures, errors, or skips, with `ARCADEIQ_TEST_DATABASE_URL` enabled. This includes six collection PostgreSQL tests and one search PostgreSQL test that runs all 22 shared contract cases as subtests. Unittest execution took 6.737 seconds.
- **124 frontend tests passed across 15 files**. They cover the API/demo contracts, storage failures, stale responses, account and collection state, search, bilingual content, navigation, player recommendations, and developer overview.
- **Production build passed**: TypeScript followed by Vite.
- `git diff --check` passed.

To repeat the automated checks, follow the commands in the [root README](../../README.md#verification). PostgreSQL tests require an explicit local URL and create their own isolated schemas. Automated provider tests use controlled responses; no paid provider call is required.

To repeat the browser scenarios, use a disposable local schema/database, run all migrations, seed the catalog, create a synthetic account, and configure the exact frontend CORS origin. Use API mode, exercise the table above, and interrupt only the API process started for the check. For the provider cases, configure a local chat-completions stub first to return a valid title intent and then HTTP 503, with fallback enabled. Keep the real provider configuration unchanged.

## Cleanup and Presentation

The acceptance API and provider stub were stopped, and only the schema created for this walkthrough was dropped. A final query found no remaining `arcadeiq_browser_%`, `arcadeiq_test_%`, or `arcadeiq_search_test_%` schemas. The preview was returned to the Chinese demo developer overview with no test account signed in.

The README and architecture guide now describe the current module boundaries and product flow. Four full-page demo screenshots capture the player and developer views in [Chinese](../screenshots/player-zh.png) / [English](../screenshots/player-en.png), including the [Chinese research overview](../screenshots/developer-zh.png) and [English research overview](../screenshots/developer-en.png).

Remote CI status is recorded by the GitHub Actions run associated with the pushed commit; local results above do not stand in for a remote run. Live DeepSeek response quality, real market data, and public deployment were not evaluated in this pass.
