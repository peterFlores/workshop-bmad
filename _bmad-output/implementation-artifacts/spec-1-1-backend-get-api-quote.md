---
title: 'Backend GET /api/quote'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
baseline_commit: '9f85d93667883efc7a06b2956d06978b805a2cd9'
review_loop_iteration: 0
story_key: '1-1-backend-get-api-quote'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has no code. The page needs one stable, well-shaped source of random quotes, and upstream failures must be reported predictably.

**Approach:** Scaffold the npm workspaces root and the `backend` workspace only (the frontend workspace is Story 1.2). Build a hexagonal Express 5 service exposing `GET /api/quote`, proxying `https://dummyjson.com/quotes/random` through a `QuoteSource` port, with errors mapped at the HTTP edge.

## Boundaries & Constraints

**Always:**
- Root `package.json` declares `"workspaces": ["backend", "frontend"]` (per AC) and `engines.node >=24`. Decision: the not-yet-existing `frontend` entry is kept, because npm resolves workspace entries as globs and a missing directory matches nothing, so `npm install` still works. Fallback if install fails on it: declare `["backend"]` only and let Story 1.2 add `frontend`.
- Dependency rule inward only: `service` and the port never import Express, `fetch`, or adapters. Only `adapters/dummyjson` knows URL, timeout, and wire format; it throws `UpstreamError` for every failure, including timeout.
- `Quote = { id: number; quote: string; author: string }`, passed through byte-for-byte (Title Case such as `That'S` preserved).
- Env read once in `main.ts`: `PORT` 3001, `UPSTREAM_URL` dummyjson default, `UPSTREAM_TIMEOUT_MS` 5000.
- Strict TDD: each test file is written and seen failing before its implementation. Tests never touch the network.

**Never:** Add routes other than `GET /api/quote`; add CORS middleware; add caching, auth, logging libraries, or persistence; transform quote text; implement any frontend code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Success | Source resolves a quote | 200, `{ id, quote, author }`, no envelope; a repeated quote is fine | N/A |
| Upstream extras | Upstream JSON has extra fields | Only `id`, `quote`, `author` returned | N/A |
| Upstream failure | fetch rejects, non-2xx, invalid JSON, or missing field | Adapter throws `UpstreamError` | HTTP 502 `{ "error": string }` |
| Timeout | No response within `UPSTREAM_TIMEOUT_MS` | Request aborted, `UpstreamError` | HTTP 502 `{ "error": string }` |
| Other error | Source rejects with a non-`UpstreamError` | HTTP 500 `{ "error": string }` | Process keeps serving |
| Other route | Any path other than `GET /api/quote` | Not served by an app route | No CORS headers present |

</frozen-after-approval>

## Code Map

Nothing exists to reuse; every file below is new.

- `package.json` -- root: private, workspaces, `engines.node >=24`, shared devDependencies
- `tsconfig.base.json` -- strict, ESM, `erasableSyntaxOnly`, `allowImportingTsExtensions`, `noEmit`
- `.gitignore` -- excludes `node_modules` and `dist`
- `backend/package.json` -- `"type": "module"`, scripts `dev` (`node --watch src/main.ts`) and `test` (`vitest run`); deps `express@5.2.1`; devDeps `typescript@7.0.2`, `vitest@5.0.3`, `@types/node@24`, `@types/express@5`
- `backend/tsconfig.json`, `backend/vitest.config.ts` -- extend base; Vitest node environment
- `backend/src/domain/quote.ts` -- `Quote`; `upstream-error.ts` -- `UpstreamError`; `quote-source.ts` -- port `QuoteSource.getRandom()`
- `backend/src/service/get-random-quote.ts` -- `getRandomQuote(source)`
- `backend/src/adapters/dummyjson/dummyjson-quote-source.ts` -- `createDummyJsonQuoteSource({ url, timeoutMs, fetch? })`
- `backend/src/http/app.ts` -- `createApp(source)`: the single route plus error-mapping middleware
- `backend/src/main.ts` -- composition root: env, wiring, `listen`
- Tests colocated: `get-random-quote.test.ts`, `dummyjson-quote-source.test.ts`, `app.test.ts`

## Tasks & Acceptance

**Execution:**
- [x] `.gitignore` -- ignore `node_modules`, `dist` -- keeps installs and build output out of git
- [x] `package.json`, `tsconfig.base.json`, `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts` -- scaffold, install, confirm `npm test -w backend` runs -- toolchain before tests
- [x] `backend/src/domain/*.ts` -- define `Quote`, `UpstreamError`, `QuoteSource` -- shared vocabulary, no test needed (types and a bare class)
- [x] `backend/src/service/get-random-quote.test.ts` then `get-random-quote.ts` -- fake source returns the Walt Disney quote unchanged -- service contract
- [x] `backend/src/adapters/dummyjson/dummyjson-quote-source.test.ts` then implementation -- stubbed `fetch`: one call to the URL, field stripping, byte-exact text, timeout via abort, reject/non-2xx/bad JSON/missing field all yield `UpstreamError` -- the only wire-aware code
- [x] `backend/src/http/app.test.ts` then `app.ts` -- fake source on an ephemeral port: 200 shape, repeated quote, 502, 500 then next request OK, unknown route not 200, no CORS header -- HTTP edge
- [x] `backend/src/main.ts` -- read env once, wire adapter, service, and app, listen on `PORT` -- composition root

**Acceptance Criteria:**
- Given no code, when scaffolded, then root declares workspaces `backend` and `frontend` and `engines.node >=24`; `backend/` holds `src/{domain,service,adapters,http}` and `main.ts` with TypeScript and Vitest; `npm run dev -w backend` serves on 3001 (or `PORT`) and `npm test -w backend` runs Vitest
- Given the domain layer, when defined, then `Quote` has exactly `id`, `quote`, `author`, `UpstreamError` is a distinct class, the port exists, and `service` and the port import no Express, `fetch`, or adapter
- Given a fake source resolving `{ id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: "Walt Disney" }`, when the service is called, then it returns it unchanged
- Given a stubbed `fetch` with extra fields, when `getRandom()` is called, then it requests `UPSTREAM_URL` once without auth and returns only `id`, `quote`, `author`, with `quote` byte-for-byte
- Given a stubbed `fetch` that never responds within `UPSTREAM_TIMEOUT_MS`, when called, then the request is aborted and `UpstreamError` is thrown
- Given `fetch` rejects, returns non-2xx, invalid JSON, or lacks a field, when called, then `UpstreamError` is thrown and no raw error escapes
- Given the HTTP layer with a fake source, when `GET /api/quote` is requested, then 200 with the bare quote body; a source rejecting `UpstreamError` gives 502 and any other error gives 500, both `{ "error": string }`, and the process keeps running
- Given the backend running, when any other route is requested, then no other endpoint exists and no CORS middleware is registered
- Given the full suite, when run, then it passes offline without contacting dummyjson.com, with env defaults documented in `main.ts`

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| listen callback ignores error (EADDRINUSE logs "listening") | low | patch | main.ts:13 logs unconditionally; Express 5 passes the bind error to the callback. |
| Unknown route / non-GET returns default HTML 404 | medium | patch | AD-3 forbids HTML error pages; app.ts has no catch-all. |
| Unknown-route test asserts only not 200 | low | patch | app.test.ts would pass on a 500; pin 404 and body. |
| Adapter wrong-type / null body untested | medium | patch | Only missing-field cases exist; guard loosening passes all tests. |
| No typecheck script | low | patch | `npm test` strips types; spec Verification relies on tsc. |
| main.ts env defaults / wiring untested | low | defer | Thin wiring; covered by manual run or later e2e. |
| Env values not validated (NaN / empty) | low | rejected | Only reachable by misconfiguring env; fix adds guard complexity. |
| headersSent guard in error handler | false | rejected | Response is written once after the await; headers cannot be sent earlier. |
| Undrained body on non-2xx, no body size cap | low | rejected | Negligible for a demo; fix adds complexity. |
| Empty-string / non-integer id accepted | low | rejected | Spec does not require it; fix adds validation rules. |
| Test teardown keep-alive, CORS on other paths, timeout test hang | low | rejected | Tests pass reliably; fixes are nice-to-have. |
| `frontend` workspace entry may break npm install | false | rejected | Implementer ran npm install successfully with frontend absent. |
| Service layer is a pass-through | false | rejected | Intentional hexagonal seam per AD-1. |
| Cache-Control, helmet, graceful shutdown, health, README, CI, .gitignore extras | low | rejected | Out of scope for the demo's intent; README lands in Story 2.2. |
| Code Map mentions root shared devDependencies, none exist | low | rejected | Fix would edit this build's spec; harmless. |

## Design Notes

`dev` uses Node 24 native type stripping (`node --watch src/main.ts`), so no runner dependency is needed. This requires `.ts` import suffixes and `erasableSyntaxOnly` (no enums or parameter properties). HTTP tests listen on port 0 and use global `fetch`, avoiding a supertest dependency. If TypeScript 7 causes tooling friction, fall back to the latest 5.x, as the architecture allows.

## Verification

**Commands:**
- `npm install` -- expected: succeeds with `frontend` absent
- `npm test -w backend` -- expected: all tests pass, no network
- `npx tsc --noEmit -p backend` -- expected: no type errors
- `npm run dev -w backend`, then `curl localhost:3001/api/quote` -- expected: JSON quote or 502 JSON error
