# Random Quote Generator

Express backend plus a React page that shows a random quote. Local demo only.

## Run

Requires Node.js 24 or newer.

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
