- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-backend-get-api-quote.md`
  summary: Add a smoke test for `backend/src/main.ts` env defaults and adapter wiring.
  evidence: No test touches `main.ts`; a wrong default URL or timeout would only show at runtime (low severity, thin wiring).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-frontend-scaffold-and-first-quote.md`
  summary: Visually verify in a browser that the card padding (40px / 24px) and 20px radius override HeroUI's Card defaults, and the 2 s load and layout at 1280px and 390px.
  evidence: Unit tests run in jsdom and cannot observe class-merge or layout; the implementer did not run the dev servers (maybe-false, medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-new-quote-button-with-loading-state-and-fade.md`
  summary: Verify in a real browser that the 250 ms fade-in actually plays, that the card height stays stable between short and long quotes, and the accent focus ring, 12px radius and 1280px/390px layouts.
  evidence: Unit tests run in jsdom with css:false and cannot see CSS transitions or layout (maybe-false, medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-error-state-with-retry-announcements-and-run-documentation.md`
  summary: Run the README "Verifying in a browser" checklist: error state color and message, stable card height across loading/quote/error, retry flow, and the 1280px/390px layouts.
  evidence: jsdom with css:false cannot observe layout, color or motion (maybe-false, medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-quote-history-that-survives-restarts.md`
  summary: Update the 7 failing `frontend/src/pages/quote-page.test.tsx` tests and add tests for history routes, the sqlite store, `parseQuote`, and `useHistory`.
  evidence: Tests were skipped on purpose for this run; the History card and its `/api/history` fetches break the old stubs, call counts, and the no-heading assertion.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-quote-history-that-survives-restarts.md`
  summary: Decide a history size cap or pagination (unverified, medium if real).
  evidence: `GET /api/history` returns every row and the UI renders all of them; the PRD lists "no size cap" as an assumption to confirm.
