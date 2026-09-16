# 80-game catalog expansion

## Scope

The product demo catalog grew from 24 to 80 games. The separate synthetic AI evaluation fixtures remain unchanged because they test search boundaries rather than provide product content.

`catalog/demo-catalog.json` is now the canonical sample source. The React demo maps it to the public `Game` contract, the bilingual layer reads its paired English and Chinese summaries, the artwork resolver reads its title/slug pairs, and the FastAPI seed adapter translates the same records to database field names. Docker copies this shared source into the backend image.

The original 24 records retain their existing values. The added 56 records use titles, prices, release years, developers, publishers, and tag candidates from the repository's existing sample CSV. Ratings, review counts, revenue, and ownership are deterministic portfolio-demo values rather than live storefront measurements. The interface continues to label estimates and sample behavior.

## Artwork and provenance

All 80 demo games have a local 460 by 215 JPEG. The 56 added images were matched by exact normalized title against the official Steam store search API and then downloaded from the `header_image` URL returned by the official app-details API. The complete app ID, local filename, byte count, and retrieval URL table is recorded in [game-artwork-sources.md](game-artwork-sources.md).

## Checks

- Canonical catalog: exactly 80 sequential IDs, 80 unique names, and complete Chinese summaries and artwork metadata.
- Artwork: 80 readable JPEG files, each 460 by 215 pixels.
- Frontend targeted checks: 7 bilingual-content tests and 17 affected player/developer browsing tests passed.
- Frontend production build passed with the shared catalog imported from the repository root.
- Backend seed checks: 3 tests passed, including exact count, sequential IDs, unique names, tags, ratings, and review counts.
- Backend unit suite: 77 tests passed and 4 PostgreSQL suites skipped when no explicit test database was supplied.
- Docker Compose configuration validation passed. Docker Desktop was not running locally, so an image build was not executed here; CI supplies PostgreSQL for the integration suites.

The four README screenshots were refreshed from the 80-game demo in English and Chinese. Earlier verification records remain historical evidence of their capture dates.
