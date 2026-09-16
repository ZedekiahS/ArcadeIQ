# Live Search Contract Evaluation — 2026-09-15

The real DeepSeek integration responds successfully, but it does not yet consistently implement ArcadeIQ's product search conventions. On the 31 nonblank queries in this pass, rules satisfied both the checked intent fields and ordered results in **30/31** cases; the DeepSeek integration did so in **24/31**. These are small, deliberately selected contract sets, not a general model benchmark.

## Why More Games Matter

The original regression fixture has seven games whose review counts are all 100. A rating threshold, review requirement, or ordering error can still return the same lone matching game. A new independent boundary fixture adds **16 synthetic games and 10 queries**. Together, the two separate catalogs contain 23 test records and 32 queries, including one blank input. The interface's 24-game demo catalog is separate from these test datasets.

The boundary catalog includes free and paid games, prices of 19.99/20/20.01, equal prices with different names, zero reviews despite a high rating, ratings of 4.39/4.4/4.9, different review/revenue rankings, similar titles, and literal `%`/`_` characters. Names and companies explicitly identify the records as fixtures. They are not new market data.

## Observed Results

| Dataset and path | Queries scored | Intent contract passed | Ordered results passed | Both passed |
| --- | ---: | ---: | ---: | ---: |
| Original contract — rules | 22 | 22 | 22 | 22 |
| Original contract — DeepSeek integration | 21 | 17 | 20 | 17 |
| Boundary catalog — rules | 10 | 9 | 9 | 9 |
| Boundary catalog — DeepSeek integration | 10 | 7 | 9 | 7 |

The original set's blank query uses rules without a provider call, and is excluded from the DeepSeek row. All **31 provider requests returned usable responses**, with **zero observed fallbacks** and no early stop. This single run does not establish a future failure rate. Controlled error/fallback coverage remains in the automated tests and [earlier API walkthrough](api-delivery-2026-09-15.md).

On the same 31 nonblank cases, intent resolution had a median of **0.745 ms for rules** and **1,088.490 ms for DeepSeek**. The nearest-rank p95 observations were 9.525 ms and 1,326.281 ms respectively. Timing includes provider network/normalization for the live path and excludes SQL execution, browser rendering, and user interaction. This is one pass without load testing or repeated latency sampling.

Machine-readable evidence, including each actual intent, mismatch and result list:

- [Original contract run](../evaluations/search-contract-live-2026-09-15.json)
- [Expanded boundary run](../evaluations/search-boundaries-live-2026-09-15.json)

## Findings and Next Changes

1. **Product thresholds are missing from the provider prompt.** The rules interpret `cheap` as a 35-dollar ceiling and `highly rated` as rating at least 4.4 with reviews. The provider prompt does not state these conventions. For `Find cheap multiplayer FPS games with good reviews`, the live intent had no price ceiling and returned the 120-dollar fixture. For high-rating queries, it chose 4.0 or 4.5. These are product-contract mismatches, not proof that the model misunderstands ordinary language. The next change should state the conventions explicitly and retain independently authored boundary expectations.
2. **A small catalog masked a rating error.** The original story query still returned Celeste when the model chose 4.5 instead of 4.4. In the expanded Chinese case, a 4.0 threshold returned a 4.39-rated distractor that should be excluded. The intent and result scores now expose the difference.
3. **Rules can contaminate a useful model interpretation.** Rules currently treat `free` as a title fragment. The live integrated intent correctly has `maxPrice: 0`, but still contains `titleQuery: free` because the application fills a missing provider title from rules. That result happens to match this fixture's free title, so the result check passes while the intent check fails. The next parser change should distinguish recognized price language from a literal title before applying the title guard. This pass deliberately preserves the observed baseline instead of editing expectations to pass.
4. **Review eligibility can be hidden by ranking.** The provider's `most reviews` query returned the expected top three while leaving `hasReviews: false`. This is recorded as an intent mismatch even though all three returned records have reviews.

Rules remain the default. The evidence does not support enabling AI for every search or claiming it improves these contract sets. The integration can express the free-price constraint that rules miss, but the title guard prevents treating that as an unqualified end-to-end win. The next iteration should address these specific seams and evaluate additional phrasing that was not used to tune the prompt.

## Method and Configuration

Both paths use the same actual tags/titles from each fixture catalog and the production `resolve_search_intent` function, normalization and `apply_intent_filters` SQL query builder. SQL executes against PostgreSQL 18.4 in a fresh `arcadeiq_eval_<uuid>` schema. This evaluates live provider HTTP plus application parsing and real SQL execution; it is not another browser/API-server walkthrough.

The original fixture checks only its explicitly listed expected fields; the new boundary cases specify the full intent. Tags are compared as sets because their SQL semantics are AND conditions. Result IDs are compared in order. A matching empty result alone is not a passing intent. The original set contains 15 English queries, six Chinese/mixed queries, and one blank; the boundary set adds seven English and three Chinese queries.

The evaluator requests `deepseek-flash` from `https://api.deepseek.com`, with the existing eight-second timeout, JSON output, `temperature: 0`, thinking disabled and a 1,024-output-token cap. The configured local model name was older; `--model deepseek-flash` overrides it for this run without changing the private `.env`. Only test query text and catalog tags are sent; no account, collection, or database credentials are included in prompts. Token usage and actual billing were not collected, and no exact cost is claimed.

The semantic prompt and rule parser were left unchanged during this baseline. The request envelope now explicitly bounds output and disables thinking for this short intent task. The default model and example configuration use the currently documented model name. These choices follow the official [model documentation](https://api-docs.deepseek.com/quick_start/pricing/), [thinking control](https://api-docs.deepseek.com/guides/thinking_mode/) and [JSON output guidance](https://api-docs.deepseek.com/guides/json_mode/), checked on 2026-09-15. The response's underlying model version is not recorded, so this report identifies the requested API model only.

## Reproduce

From `backend/`, after installing dependencies, set an explicit loopback `ARCADEIQ_TEST_DATABASE_URL`. The user must be able to create schemas; existing application tables are never used. Choose fresh output names, because reports are never overwritten.

```powershell
# No provider requests; still exercises real PostgreSQL.
python -m app.scripts.evaluate_search --output ../docs/evaluations/search-rules-new.json

# Explicit paid opt-in; the backend reads DEEPSEEK_API_KEY from the local environment.
python -m app.scripts.evaluate_search --live --model deepseek-flash --max-calls 21 --output ../docs/evaluations/search-contract-new.json
python -m app.scripts.evaluate_search --live --model deepseek-flash --max-calls 10 --fixture ../tests/fixtures/search-evaluation-boundaries.json --output ../docs/evaluations/search-boundaries-new.json
```

The script makes no automatic retries. It stops paid attempts on authentication/configuration/balance/rate-limit errors or three consecutive provider failures, then finishes the rules baseline. Blank bypasses do not reset the provider-failure counter. Fallbacks and unexecuted cases are separate from model successes. A successful process exit means evidence was produced, not that the model met every contract; inspect `both_pass` and the per-case differences.

## Verification and Limits

**78 backend tests passed**, including the existing real PostgreSQL integration suites and 11 new evaluator tests covering scoring, fallback attribution, request limits, stopping behavior, and configuration isolation. The evaluator tests prohibit network calls, even if a real key is configured. Both rules-only smoke runs and both live runs completed. Every evaluation schema was removed; a final database query found no evaluation or integration-test schemas remaining.

The datasets are small, selected for known behavior and edge cases, and are not held out. The boundary expectations were written before live responses were observed. The model's performance on unseen phrasing, negation, multi-turn requests, personal recommendations, review-text analysis and large catalogs is not established. See the [engineering case study](../case-study.md) for how this evidence informs the refactor.
