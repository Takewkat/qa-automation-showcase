# 0006 Test design on two axes: feature by layer

Context: the author's suites at Hublo were designed on a grid per feature: `@happy-path`, `@validation-error` (missing or null field, empty payload, negative, zero), `@error-case` (401, 403, 404 per resource), plus feature tags. Read per endpoint, the grid shows a documented status nobody tests as an empty cell. Laid on it, the first cut of this suite had 401 on 3 of 10 operations.

Decision: every `test()` carries its folder tag and exactly one layer tag; `npm run traceability` fails otherwise. `test-scenarios.md` opens with the grid: one row per operation, its documented statuses, the scenario IDs per layer; a status is in a cell or in "Left out" with a reason. Three layers as at Hublo: 409 and 400 `INVALID_TRANSITION` are error cases, 422 `INCOMPLETE_OFFER` and a `reject` without reason are validation errors. A test that proves two things is two tests under one ID.

Consequences: `--grep @error-case` runs a layer; a new operation is a row of the grid before it is a test; a boundary comes in pairs (`amount` -1 refused, 0 accepted).
