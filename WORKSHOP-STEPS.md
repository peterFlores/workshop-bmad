# Workshop Steps: Random Quote Generator

Two parts: **Part 1** is the preparation done before the workshop (baseline app). **Part 2** is what to run live during the workshop (add SQLite persistence).

Input idea: [INPUT.md](INPUT.md). Planning artifacts live in `_bmad-output/planning-artifacts/`.

## Part 1: Before the workshop (baseline app)

Goal: a backend with one endpoint plus a React page (HeroUI) that shows a random quote.

| # | Step | Skill | Output | Status |
|---|------|-------|--------|--------|
| 1 | Create the PRD | `bmad-prd` | `_bmad-output/planning-artifacts/prds/prd-workshop-bmad-2026-10-08/prd.md` | Done |
| 2 | Define the UX (look and behavior) | `bmad-ux` | `_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/` (`DESIGN.md`, `EXPERIENCE.md`) | Done |
| 3 | Define the architecture | `bmad-architecture` | `_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md` | Done |
| 4 | Break the work into epics and stories | `bmad-create-epics-and-stories` | `_bmad-output/planning-artifacts/epics.md` | Done |
| 5 | Plan the sprint | `bmad-sprint-planning` | `_bmad-output/implementation-artifacts/sprint-status.yaml` | Done |
| 6 | Build the stories | `bmad-build` | Working backend and frontend | Next |
| 7 | Review and verify | `bmad-code-review` | Triaged findings | Pending |
| 8 | Smoke test | manual | Run backend and frontend, click "New quote" | Pending |

Tip: commit after each step so you can reset to a clean baseline before the workshop.

## Part 2: During the workshop (live)

Goal: show how a new spec lands on an existing product by adding SQLite persistence to the backend.

| # | Step | Skill | What to say or show |
|---|------|-------|---------------------|
| 1 | Show the baseline app running | manual | One endpoint, one page, a new quote on every click |
| 2 | Update the PRD with the new requirement (persist quotes in SQLite) | `bmad-prd` (Update intent) | The PRD changes first; decisions land in the memlog |
| 3 | Update the architecture (SQLite, storage layer) | `bmad-architecture` (update) | Only the affected decisions change |
| 4 | Update the UX if the page changes (optional) | `bmad-ux` | Skip if the page does not change |
| 5 | Create the new epic and stories | `bmad-create-epics-and-stories` | Small, ordered stories |
| 6 | Refresh the sprint plan | `bmad-sprint-planning` | New stories appear in the sprint status |
| 7 | Implement the stories | `bmad-build` | Tests first, then code |
| 8 | Review the change | `bmad-code-review` | Independent reviewers, triaged findings |
| 9 | Walk through the change | `bmad-walkthrough` | What changed, what to look at, how to test |
| 10 | Demo the result | manual | Quotes now persist across restarts |

Fallback: if live generation runs long, keep a branch with the finished SQLite change and switch to it.
