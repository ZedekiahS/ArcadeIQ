# Search Contract Fixes and Live Rerun — 2026-09-16

The search repair addresses the concrete mismatches from the [first live evaluation](ai-evaluation-2026-09-15.md): missing price/rating conventions, review eligibility, and a rules title guard that treated `free` as a title fragment. A new pass against the same real provider and PostgreSQL met both checked intent and ordered-result expectations in **31/31 nonblank integration cases**, compared with **24/31** before the repair. The baseline reports remain unchanged.

These scores describe the complete search integration: prompt, provider request, normalization, deterministic product constraints, title guard, and SQL execution. They are not the model's original/raw accuracy and do not demonstrate that AI improves on rules.

## Implemented Contract

| Query condition outside a protected title | Resulting behavior |
| --- | --- |
| `free`, `free-to-play`, `free to play`, `免费` | Zero-price ceiling and no literal title condition from the price phrase. Free remains zero even when a budget is also supplied. |
| `cheap`, `deal`, `便宜` | US$35 default ceiling and price-ascending order. An explicit budget replaces the default ceiling and retains that ordering. |
| `highly rated`, `top rated`, `高评分` | Rating at least 4.4, a positive review count, and rating-descending order. |
| Review conditions such as `good reviews`, `most reviews`, `有评价` | A positive review count; no minimum rating solely from a review condition. |
| Full known titles or quoted phrases containing `Free`, `FPS`, or `Highly Rated` | The title is separated before its internal words can become price, genre, rating, or review conditions. |

Price ceilings are inclusive. An absent price condition remains `maxPrice: null`; ranking by cheapest/most expensive does not introduce the cheap default.

The frontend rules parser and backend rules parser implement these semantics. The provider prompt now states the conventions and includes catalog titles as data. After provider normalization, `apply_product_constraints` applies recognized price, rating, and review conditions to text with known/quoted titles removed. The rules title guard remains available, but recognized free-price language no longer leaks into its title fragment. Existing response source labels and configured fallback behavior are retained.

Implementation: [backend rules](../../backend/app/services/search_intent.py), [provider boundary](../../backend/app/services/ai_search.py), and [frontend rules](../../frontend/src/lib/search.ts).

## Live Comparison on the Existing Queries

“Both” requires every checked intent field and the ordered result IDs to pass. The original contract checks its explicitly listed expected fields; boundary cases specify the full intent. Tags are compared as sets, while result ID order is strict.

| Dataset and path | Before: both passed | After: both passed |
| --- | ---: | ---: |
| Original contract — rules | 22/22 | 22/22 |
| Original contract — DeepSeek integration | 17/21 | 21/21 |
| Boundary catalog — rules | 9/10 | 10/10 |
| Boundary catalog — DeepSeek integration | 7/10 | 10/10 |

The blank original-contract query bypasses the provider and remains a rules success. Excluding it, rules improved from 30/31 to 31/31 and the DeepSeek integration from 24/31 to 31/31. All 31 post-fix provider requests returned usable responses with **zero observed fallbacks**, no skipped calls, and no early stop. This single pass does not establish a future success rate.

Evidence is preserved in separate files:

- Before: [original contract](../evaluations/search-contract-live-2026-09-15.json) and [boundary catalog](../evaluations/search-boundaries-live-2026-09-15.json).
- After: [original contract](../evaluations/search-contract-fixed-2026-09-15.json) and [boundary catalog](../evaluations/search-boundaries-fixed-2026-09-15.json).

The post-fix runs requested `deepseek-flash`, an eight-second timeout, a 1,024-output-token cap, thinking disabled, and no evaluator retries. They used the production resolver and SQL builder against isolated PostgreSQL schemas, not a browser/API-server walkthrough. Each report records that its schema was removed. Token usage, billing, and the underlying response model version were not collected. The `base_commit` is `91243f3`, the checkout base while the repair was in the working tree, rather than a standalone identifier of the repaired source.

## Independent Follow-up and Expectation Correction

The [follow-up fixture](../../tests/fixtures/search-evaluation-unseen.json) contains **18 synthetic games and eight new query formulations**. It reuses the 16 boundary records and adds a free game without “free” in its title (`Fixture Open Arena`) and a paid title containing rating vocabulary (`Fixture Highly Rated`). This tests whether apparent success depends on title words. Queries and complete expectations were formulated separately from the repair implementation before inspecting its outputs. The selected queries still target known contract categories; the file's `unseen` name does not make this a general held-out benchmark.

The [original follow-up run](../evaluations/search-unseen-fixed-2026-09-15.json) records **7/8 for rules and 7/8 for the DeepSeek integration**. All eight provider calls succeeded with no fallback. Its sole mismatch was case 3, `Show cheap FPS games under 20 dollars`:

| Item | Original authored expectation | Recorded output, both paths |
| --- | --- | --- |
| Ceiling | 20 | 20 |
| Sort | `sortBy: null` (default name order) | `sortBy: price`, `sortDirection: asc` |
| Ordered game IDs | `[102, 103, 101, 117]` | `[101, 117, 102, 103]` |

The expected sort was an authoring error. The implementation at the pre-repair commit `91243f3` and its existing search tests already defined cheap as price-ascending order; an explicit budget changes the ceiling, not that sort. The fixture now records the correction and expects the recorded price order.

A separate [offline rescore](../evaluations/search-unseen-rescored-2026-09-16.json) applies that corrected expectation to the same recorded outputs, yielding **8/8 for each path**. It does not make another provider call, rerun SQL, or replace the original 7/8 report. The three post-fix live runs made 39 provider calls in total: 31 existing-query calls and eight follow-up calls. Rescoring adds zero calls. The correction is reported separately from the unchanged 31-query comparison.

## Verification and Limits

- **86 backend tests passed** against a real local PostgreSQL environment, with no skips, failures, or errors; unittest execution took 7.422 seconds. This includes the new independent PostgreSQL search test, which executes all eight follow-up cases as subtests.
- The final full frontend run passed **158/158 tests across 15 files** in 44.18 seconds, including the eight follow-up fixture cases. The subsequent **TypeScript/Vite production build passed** in 11.27 seconds. This final run supersedes the earlier 150-test full run and 65-test search-focused check.
- Controlled provider tests cover contradictory provider price/rating/review values and retained fallback behavior without live calls. The live reports exercise the actual provider and real SQL separately from those automated tests.
- In the demo developer page, both `免费FPS` and `Find free-to-play FPS games` returned only Aimlabs. The visible parsed intent showed `titleQuery: null`, `maxPrice: 0`, and the FPS tag; the source label identified demo rules without an AI call. The zero-price chip displayed `仅免费` / `Free only` in the respective interface languages. This browser check used sample data, separate from the live-provider/PostgreSQL evaluation.
- All evaluation and integration-test schemas were absent in the final database cleanup check.

The sets are small, intentionally selected, and overlap the behavior being repaired. A passing integration score can result from deterministic enforcement even if the raw model response differed; the report records the final intent, not a raw-model benchmark. Negation, arbitrary phrasing, large catalogs, repeated-run variance, load, review-text evidence, and personalized recommendation quality remain unestablished. Rules remain the default search path.
