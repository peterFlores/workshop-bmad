- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-backend-get-api-quote.md`
  summary: Add a smoke test for `backend/src/main.ts` env defaults and adapter wiring.
  evidence: No test touches `main.ts`; a wrong default URL or timeout would only show at runtime (low severity, thin wiring).
