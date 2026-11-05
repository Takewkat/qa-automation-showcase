---
name: add-api-scenario
description: Add one API scenario to api-tests - docs row, spec from the template, run it, check traceability. Use for "add an API scenario", "new API test", "/add-api-scenario GROUP ID scenario".
---

Arguments: `$ARGUMENTS` = `<GROUP> <ID> "<scenario>"`, for example `WFL WFL-008 "close is refused from TO_APPROVE"`.

Follow `api-tests/AGENTS.md`, "Add a scenario", in this order and stop at the first failure:

1. Append the row to the GROUP section of `api-tests/docs/test-scenarios.md`: ID, scenario, preconditions, request, expected status, expected result, priority. Ask for any column the request does not give.
2. Choose the file: an existing topic file under `api-tests/tests/<group>/` when the precondition is the same, else a new file copied from `api-tests/tests/_template/template.spec.ts.example`.
3. Write the test: title `"<ID> <scenario>"`, preconditions through fixtures (`offers`, `configure`), calls through endpoint classes with the `company` fixture, a negative case passes the expected status last. A matrix is a `ROWS` table.
4. From the repo root: `npx playwright test -c api-tests -g <ID>`, then `npm run traceability`. `/verify` is the done gate.
5. Report: files touched, the Playwright result line, the `api-tests:` traceability line.
