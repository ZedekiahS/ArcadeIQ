# Bilingual UI verification — 2026-09-15

## Scope

The header now provides English and Simplified Chinese controls. The saved language preference takes priority over browser language; switching remains usable when browser storage is unavailable. The document language and page title follow the selection.

Search controls, account and collection flows, save menus, status messages, known errors, tags, the 24 bundled game summaries, and recognized demo/rule insight templates have both languages. Game titles, developer names, custom collection names, canonical tags and API fields remain unchanged. Prices remain USD, explicitly labelled in Chinese. Unrecognized external content, including DeepSeek output, retains its original text and a source/original-content indication rather than initiating a translation request.

Chinese search presets use the same canonical filters as their English equivalents. The frontend and backend parsers share 22 contract fixtures, including Chinese budget, ranking, review, and developer-analysis examples.

The actual-demo UI regression uncovered repeated collection-insight updates during the compound create-and-save operation. Collection insights now wait until the mutation settles, with stale insight clearing handled at data changes. Language switching does not trigger catalog, game-insight, or collection-insight requests.

## Executed checks

- `npm test`: **93 tests passed across 10 files**, including content translation, language preference, blocked storage, custom draft and selection preservation, save/remount behavior, request counts, canonical filters, error recovery text, and existing account/search/collection contracts.
- `npm run build`: **passed**, including TypeScript and Vite production bundling.
- Backend: `.venv\Scripts\python.exe -m unittest tests.test_ai_search tests.test_search_intent tests.test_search_titles tests.test_search_routes` reported **25 tests, OK**.
- Browser inspection of the local demo confirmed Chinese and English rendering, Chinese story search results, language persistence after reload, and unchanged selection after switching language.
- Both languages were inspected at a 375px viewport override. The document's client and content widths were equal at **360px**, accounting for the scrollbar. Expanded filters and diagnostics fit; native disclosure keyboard behavior remained usable. The temporary override was reset after inspection.
- `git diff --check`: passed.

The header switch and Chinese typography retain the existing dark gaming presentation. The requested `ui-ux-pro-max` skill informed label wrapping and narrow-screen checks.

These checks used demo data and automated test adapters. No paid AI request, live PostgreSQL write, GitHub upload, or deployment was performed. The changes remain local and uncommitted; this record does not claim live-provider translation or an exhaustive accessibility audit.
