---
name: add-api-scenario
description: Add one API scenario to api-tests - docs row, spec, run, traceability, a capped review loop. Use for "add an API scenario", "new API test", "/add-api-scenario GROUP ID scenario".
---

`$ARGUMENTS` = `<GROUP> <ID> "<scenario>"`, for example `LST LST-003 "a status filter lists only the offers in that status"`.

Follow `api-tests/AGENTS.md`, "Add a scenario", in order; stop at the first failure before step 5, the only loop.

1. Row in the GROUP section of `api-tests/docs/test-scenarios.md` (seven columns, the Priority from the levels table; ask for what the request does not give) and the ID in its grid cell; the counts of the first line follow.
2. File: the topic file in the folder of the group's tests (`LST` is `listing/`) with the same precondition and room under the 60-line budget, else a copy of `tests/_template/template.spec.ts.example` named after the topic.
3. Test: title `"<ID> <scenario>"`, tags `{ tag: ["@<folder>", "@<layer>", "@<priority>"] }`, preconditions through fixtures, calls through endpoint classes with `company`, a negative case passes the expected status last. A matrix is a `ROWS` table.
4. `npx playwright test -c api-tests -g <ID>`, then `npm run traceability`.
5. Review loop, at most 3 rounds: agent `harness-reviewer` on the diff, `/triage api` first when the run is red. Fix only `test` rows and Critical or Major findings, then step 4 again. Done when the run is green and the reviewer ends `0 critical, 0 major`. Hand back on any other row, or after round 3.
6. Report: files touched, the Playwright result line, the `api-tests:` traceability line, the rounds used and the last reviewer line.
