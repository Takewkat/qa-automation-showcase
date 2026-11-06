---
name: add-api-scenario
description: Add one API scenario to api-tests - docs row, spec, run, traceability. Use for "add an API scenario", "new API test", "/add-api-scenario GROUP ID scenario".
---

`$ARGUMENTS` = `<GROUP> <ID> "<scenario>"`, for example `WFL WFL-008 "close is refused from TO_APPROVE"`.

Follow `api-tests/AGENTS.md`, "Add a scenario", in order; stop at the first failure.

1. Row in the GROUP section of `api-tests/docs/test-scenarios.md` (seven columns; ask for what the request does not give) and the ID in its grid cell.
2. File: the topic file under `api-tests/tests/<group>/` with the same precondition, else a copy of `tests/_template/template.spec.ts.example`.
3. Test: title `"<ID> <scenario>"`, tags `{ tag: ["@<group folder>", "@<layer>"] }`, preconditions through fixtures, calls through endpoint classes with `company`, a negative case passes the expected status last. A matrix is a `ROWS` table.
4. `npx playwright test -c api-tests -g <ID>`, then `npm run traceability`.
5. Report: files touched, the Playwright result line, the `api-tests:` traceability line.
