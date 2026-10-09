# Review: version and reality check, round 2 (2026-10-09)

Method: `npm view` for every pin; scratch installs and smoke tests (scratchpad, deleted after). Local Node is v25.0.0 (nvm has only v25); Node 24.21.0 obtained via the `node@24.21.0` npm package for a second run. Spine and project not modified.

## Verdict
All 15 pins match the registry today and every committed technology exists and works together; the only real issues are the dev machine's Node 25 (outside Vitest's engines range) and a missing CSS type shim under TS 7.

## Evidence
| Check | Result |
| --- | --- |
| (1) Pins vs registry | Match: TypeScript 7.0.2, Express 5.3.0 (the prior drift is fixed), better-sqlite3 13.0.3, @types/better-sqlite3 9.6.0, @types/node 24.19.1 (exists; latest is 26.6.4, 24.x line is deliberate), tsx 4.23.15, Vite 8.3.4, plugin-react 6.1.2, React/DOM 19.3.0, @heroui/react and styles 3.2.6, Tailwind and @tailwindcss/vite 4.3.3, Vitest 5.0.3. Node 24.21.0 verified earlier (latest LTS). |
| (2) better-sqlite3 13.0.3 | engines `node >=22`, dep node-addon-api ^8. Tarball ships N-API prebuilds (darwin-arm64/x64, linux-arm64/x64, linuxmusl-arm64/x64, win32-arm64/x64), no node-gyp step on install. Opened a file db, created table, insert, select, transaction, `journal_mode=DELETE`, `synchronous=FULL`: passes on Node 25.0.0 and Node 24.21.0 (via tsx). N-API means one binary works across Node majors. |
| (3) @types/better-sqlite3 9.6.0 | Only depends on `@types/node: *`. `tsc` 7.0.2 strict, `skipLibCheck: false`, nodenext, compiled the smoke file using `Database`, `.pragma`, `.prepare().run()/.all()`, `.transaction()` with no errors. Note: the package is on its latest tag but 13.0.3 is major 13 vs types 9.x; compatible in practice for the API used. |
| (4) HeroUI v3 | `@heroui/react` 3.2.6 exports `Card`, `Button`, `Skeleton` (compound: `Card.Root/Header/Title/Description/Content/Footer`, `Skeleton.Root`). No `HeroUIProvider`; only `I18nProvider`, `RouterProvider`, `ToastProvider` exist, all optional. "Needs no provider" holds. A Vite 8 + plugin-react 6.1.2 + @tailwindcss/vite 4.3.3 build rendering Card/Button/Skeleton succeeded (1753 modules). |
| (5) TS 7.0.2 compat | Vitest 5.0.3 ran a test under TS 7.0.2 on Node 25 and 24.21.0; tsx 4.23.15 (esbuild ~0.28, engines >=18) ran TS on both; Vite 8.3.4 build passes. Vitest peers vite ^6.4/7/8 and @types/node ^22 or >=24 satisfied. Vite and Vitest do not peer on `typescript`. |
| Express 5.3.0 | Installs; engines >=18; @types/express resolved. |

## Findings
- F1 MEDIUM: Dev machine runs Node v25.0.0 (odd, non-LTS). Vitest 5.0.3 engines are `^22.12 || ^24 || >=26`, so Node 25 is explicitly unsupported (npm EBADENGINE warning; tests still ran). The spine's `engines >=24` admits 25, so it permits an unsupported combination. Fix: engines `^24` plus `.nvmrc` 24.21.0, or document that the builder must use Node 24.
- F2 LOW: Under TS 7.0.2, `import './app.css'` fails with TS2882 (side-effect import has no type declarations). The frontend tsconfig needs `"types": ["vite/client"]` (or a `*.css` declaration). Not in the spine; add as a one-line build note to avoid a first-story surprise.
- F3 LOW: Stack omits HeroUI required peers: react-aria-components ^1.21.1, react-aria ^3.52.1, @react-aria/ssr ^3.10.1, @react-aria/utils ^3.34.1, @internationalized/date ^3.12.4 (npm 11 auto-installs them, older npm may not), plus @types/react, @types/react-dom, @types/express (needed under TS strict). The spine's "Tailwind CSS 4 is required" is correct (peer >=4); the `@import "@heroui/styles"` CSS step is also unstated.
- F4 INFO: @types/better-sqlite3 9.6.0 is a major behind the library (13.0.3). It is the newest published tag and compiled cleanly for the API used, so keep, but re-check if new 13.x APIs are adopted.
- F5 INFO: Deferred fallback for TypeScript 7 ("downgrade to 5.x if friction") is now evidence-backed: no friction found in Vitest, tsx, Vite, or better-sqlite3 types; only F2.
