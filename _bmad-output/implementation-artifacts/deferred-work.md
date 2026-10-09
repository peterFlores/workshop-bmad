- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-backend-get-api-quote.md`
  summary: Add a smoke test for `backend/src/main.ts` env defaults and adapter wiring.
  evidence: No test touches `main.ts`; a wrong default URL or timeout would only show at runtime (low severity, thin wiring).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-frontend-scaffold-and-first-quote.md`
  summary: Visually verify in a browser that the card padding (40px / 24px) and 20px radius override HeroUI's Card defaults, and the 2 s load and layout at 1280px and 390px.
  evidence: Unit tests run in jsdom and cannot observe class-merge or layout; the implementer did not run the dev servers (maybe-false, medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-new-quote-button-with-loading-state-and-fade.md`
  summary: Verify in a real browser that the 250 ms fade-in actually plays, that the card height stays stable between short and long quotes, and the accent focus ring, 12px radius and 1280px/390px layouts.
  evidence: Unit tests run in jsdom with css:false and cannot see CSS transitions or layout (maybe-false, medium).
