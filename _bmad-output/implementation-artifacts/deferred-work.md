- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-backend-get-api-quote.md`
  summary: Add a smoke test for `backend/src/main.ts` env defaults and adapter wiring.
  evidence: No test touches `main.ts`; a wrong default URL or timeout would only show at runtime (low severity, thin wiring).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-frontend-scaffold-and-first-quote.md`
  summary: Visually verify in a browser that the card padding (40px / 24px) and 20px radius override HeroUI's Card defaults, and the 2 s load and layout at 1280px and 390px.
  evidence: Unit tests run in jsdom and cannot observe class-merge or layout; the implementer did not run the dev servers (maybe-false, medium).
