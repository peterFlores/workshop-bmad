# Review: version and reality check (2026-10-09)

Method: `npm view <pkg> version` against the registry, nodejs.org dist index, Node 24 sqlite docs. Spine not modified.

## Verdict
Pins were genuinely sourced (memlog cites registry/dist index) and all but Express still match the registry; the spine is stale on persistence (NFR-5, Deferred says "no persistence") and has a few unconfirmed claims.

## Pin spot-check
| Package | Spine | Registry 2026-10-09 | Status |
| --- | --- | --- | --- |
| Node LTS Krypton | 24.21.0 | 24.21.0 latest LTS (2026-09-07); v26.11.1 exists, not LTS | OK |
| TypeScript | 7.0.2 | latest 7.0.2; next 7.1.0-dev | OK (see F4) |
| Express | 5.2.1 | **5.3.0** | DRIFT |
| Vite | 8.3.4 | 8.3.4; engines ^20.19 or >=22.12 | OK |
| @vitejs/plugin-react | 6.1.2 | 6.1.2 | OK |
| React / DOM | 19.3.0 | 19.3.0 | OK |
| @heroui/react, styles | 3.2.6 | 3.2.6; peers react>=19, tailwindcss>=4, react-aria-components ^1.21.1, react-aria ^3.52.1, @internationalized/date | OK, peers undocumented |
| Tailwind, @tailwindcss/vite | 4.3.3 | 4.3.3 | OK |
| Vitest | 5.0.3 | 5.0.3; engines ^22.12 or ^24 or >=26 | OK |

Not pinned but needed: @types/node (latest 26.x; use 24.x line to match runtime, e.g. 24.19.1), @types/express 5.0.6, a TS runner for backend dev (tsx 4.23.15) or Node native type stripping. Spine gives `npm run dev -w backend` without saying how TS runs; unconfirmed.

## Findings
- F1 HIGH: Spine contradicts PRD NFR-5. `binds` stops at NFR-4, "Backend stateless; no persistence" convention, Deferred "persistence not needed", and no history/favorites FRs in the map. Needs a new AD (storage behind a port, same hexagonal pattern), env var (e.g. DB path), structural seed (`adapters/sqlite` or similar), and test strategy (in-memory / temp file) for AD-7.
- F2 MEDIUM: Express 5.2.1 is stale; registry latest is 5.3.0. Re-pin or state "caret ^5.2". Memlog says 5.2.1 "npm registry" so it was likely accurate at authoring (2026-10-08) and moved since; confirm changelog before bumping.
- F3 MEDIUM: Unverified claims. HeroUI v3 "no provider" and the `Card`, `Button`, `Skeleton` component names come from "web sources" in memlog, not from the package; Vitest 5 and Vite 8 plugin/Node compatibility not cross-checked (engines do match Node 24). Check HeroUI docs/exports before the story relies on them. Peer deps (react-aria-components etc.) should be listed in Stack.
- F4 MEDIUM: TypeScript 7.0.2 (native compiler line) is bleeding edge. Deferred already hedges with a 5.x fallback, but tooling compat (Vitest 5, Vite 8, tsx, @types) was not confirmed. Also `typescript` 7.1.0-dev nightly is published daily; do not float.
- F5 LOW: Memlog claims "Node LTS" only; Node 26 is Current (not LTS as of today), so staying on 24 is right. Local machine runs Node v25.0.0 (non-LTS, odd release), which violates `engines >=24` spirit only mildly but differs from the pin; use `.nvmrc`/`engines` `^24`.

## Embedded persistence options (Node 24, TypeScript)
| Option | Version / stability | Notes |
| --- | --- | --- |
| `node:sqlite` (built in) | Node 24.21.0 docs: Stability 1.2 Release candidate (added v22.5.0; no `--experimental-sqlite` flag needed since 22.13/23.4; still may print an ExperimentalWarning on some versions, verify locally). | Zero dependencies, synchronous `DatabaseSync`, ships typed in @types/node (use 24.x). Not yet "stable" (2), API could still shift, but RC means near-final. Best fit for a local demo. |
| better-sqlite3 | 13.0.3 (npm latest; engines node >=22; dep node-addon-api ^8); @types/better-sqlite3 9.6.0 | Mature, sync API, native addon: needs prebuilt binary or toolchain (install friction risk for workshop machines). Types are a separate package. |
| JSON file | n/a (fs) | Simplest, no deps; needs atomic write (write temp + rename) and serialization of concurrent writes; fine for history/favorites at demo scale; no queries. Libraries: lowdb 7.0.1 (ESM, small). |
| node-sqlite3-wasm | 0.8.60 | Pure WASM, no native build; niche, low adoption. Not needed. |

Recommendation: put a `FavoritesRepository`/`HistoryRepository` port in `domain` (consistent with AD-1). Default adapter `node:sqlite` (zero install friction, one file path env var); keep JSON-file adapter as the fallback if RC status is judged too risky, since the port makes the swap cheap. Choose better-sqlite3 only if API stability outweighs the native-build risk.
Caveat: node:sqlite RC status comes from the live Node 24 docs; confirm that `import { DatabaseSync } from 'node:sqlite'` runs without flags on the pinned 24.21.0 in a spike test.
