# ArcadeIQ Frontend

React + TypeScript portfolio application with explicit fixed-data and API modes.

## Run

From `frontend/`:

```powershell
npm ci
npm run dev
```

Open [the demo](http://localhost:5173/?mode=demo). Demo is the default when no mode is configured.

## Data Modes

| Mode | Data and saves | Accounts and AI |
| --- | --- | --- |
| `?mode=demo` | Bundled catalog; collections and saves stay in this browser. No backend requests. | No server account is created. Search and insight panels use local sample/rule logic. |
| `?mode=api` | FastAPI catalog and PostgreSQL saves. API failures are shown and can be retried. | Register or sign in to access account collections. Search uses the backend rules or configured AI provider. |

API mode never changes a failed API request into a local save or sample-data success. Account collections and browser-demo collections are separate. Switching modes loads the page again. Invalid or expired authentication requires signing in again.

To set the default mode or a different API URL, copy `.env.example` to `.env.local` in this directory and edit it:

```env
VITE_DATA_MODE=demo
VITE_API_BASE_URL=http://localhost:8000/api
```

`?mode=demo` and `?mode=api` override `VITE_DATA_MODE`. These are application data modes, independent of Vite's development/production build modes. Restart the development server after changing environment files; rebuild to update a static bundle. This Vite project loads its environment from `frontend/`, so the repository root `.env` configures the backend, not these frontend settings. See [Vite's environment documentation](https://vite.dev/guide/env-and-mode).

Use [the backend setup instructions](../backend/README.md) before opening [API mode](http://localhost:5173/?mode=api). AI provider keys belong only in the backend environment. The existing search provider and game/collection insight interfaces are retained; the collection reliability tests do not call a paid provider.

## Verify

```powershell
npm test
npm run build
```

Tests exercise data-mode separation, API error handling, and account/collection state behavior. The production build checks TypeScript and bundles the application. GitHub Actions runs both commands.
