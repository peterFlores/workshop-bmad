# Random Quote Generator

Express backend plus a React page that shows a random quote. Local demo only.

## Run

Requires Node.js 24 (see `.nvmrc`; `engines` is `^24`). No database server is needed: history is stored in a single SQLite file.

```sh
npm install
npm run dev -w backend    # API on http://localhost:3001
npm run dev -w frontend   # app on http://localhost:5173
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to the backend.

## Environment variables (backend)

| Variable | Default |
| --- | --- |
| `PORT` | `3001` |
| `UPSTREAM_URL` | `https://dummyjson.com/quotes/random` |
| `UPSTREAM_TIMEOUT_MS` | `5000` |
| `DATA_FILE` | `backend/data/quotes.db` (resolved from the backend package root) |

## Data

The quote history is stored in a single SQLite file at `DATA_FILE`, so it survives restarting the app. No database server is needed. The file is created on first start and is gitignored.

To reset the demo, stop the backend and delete the file at `DATA_FILE`; it is recreated empty on the next start. If the file is corrupt or locked, the backend exits with an error and does not modify or delete it.

## Favorites API

- `GET /api/favorites` returns `Quote[]`, newest favorite first.
- `PUT /api/favorites/:id` takes a `Quote` body whose `id` must equal the path id (else 400). A repeat PUT keeps the first snapshot. Returns 204.
- `DELETE /api/favorites/:id` returns 204. For a favorite it removes the favorite and every history row of that quote; otherwise nothing changes.

## Tests

```sh
npm test -w backend
npm test -w frontend
```

## Verifying in a browser

Automated tests run in jsdom and cannot check layout, color, or motion. Check these by hand:

- Card padding (24px on phones, 40px from 640px) and 20px card radius
- Fade-in between quotes
- Stable card height across loading, quote, and error states
- Accent focus ring on the button
- 12px button radius
- Error state: stop the backend, click the button; the message and "Try again" appear, then restart the backend and retry
- Layouts at 1280px and 390px, and with OS reduced motion on
