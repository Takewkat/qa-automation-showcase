# api-tests: rules

Stack: TypeScript on the Playwright runner (`request` fixture), ajv contract check from `spec/job-offer-swagger.yml`, faker, a reference stub on `node:http` and zod in `stub/` (its own workspace).
Run: `npm test` on `TEST_ENV=local` starts the stub; `TEST_ENV=staging npm test` targets that row and starts nothing; `API_BASE_URL=https://host/api/v1 npm test` for an ad-hoc target.
Rules: the table in the root `AGENTS.md`. Below: the paths, the checklist, the errors.

## Paths (aliases `@job-offer/*` = `src/*`, `@shared/*` = `../shared/*`)

| Path | Holds |
|---|---|
| `spec/job-offer-swagger.yml`, `src/generated/schema.d.ts` | the contract, verbatim, and its types (`npm run gen:types`, committed) |
| `shared/api/api.ts`, `contract.ts` | the generic base of an endpoint, shared with e2e-tests: `getUrl`, `request`, `checkStatusCode`, `checkSchema`, `getResponseBody`; `send` runs the four. `Contract` checks a response against the spec; a service that sets `undefined` checks the status only |
| `src/api/job-offer-api.ts`, `types.ts` | the service over that base: spec file, `X-Company-Id`; the spec's models by name (`JobOffer`, `ErrorResponse`, `ValidationError`, ...) |
| `src/api/<resource>/<action>.ts`, `index.ts` | one class per endpoint: `path`, `method`, `correctStatusCode`, one typed method; `get<ErrorResponse>(id, 404)` asserts that status and types the body |
| `src/enum/job-offer.enum.ts` | `WorkflowFlags`, `JOB_OFFER_STATUSES`, `ERROR_CODES` |
| `src/oracle.ts` | expected values from the spec: valid actions, editable, deletable and withdrawable statuses, the 8 happy paths, the invalid pairs |
| `src/test-data/factories.ts`, `job-offers.ts` | faker generators; builders with overrides (`completeOffer`, `incompleteOffer`, `compensation`, `salary`); `malformed()` for a body the types forbid |
| `src/utils/workflow.ts`, `src/cleanup/` | `advance()` moves an offer to a status, `configure()` sets flags; `cleanupJobOffers()` withdraws, deletes, closes what is live |
| `src/fixtures/` | `company`, `otherCompany`, `anonymous`, `malformedHeader`, `offers`, `otherOffers`, `configure`; `offers.factory.ts`; `fixtures.ts` exports `test` |
| `stub/` | a means to run the suite, not a deliverable. `http/` the adapter (`router.ts`, `request.ts` parsing and guards, `errors.ts` the spec's error bodies, `app.ts` the routes), `domain/` the rules (`state-machine.ts`, `schemas.ts` the request shapes), `store/memory.ts`; `server.ts` starts it. `domain/` imports nothing of the other two, `store/` nothing of `http/` |
| `tests/<group>/*.spec.ts`, `tests/_template/` | one folder per business area, its name is the feature tag; the file to copy. Model: `tests/workflow/` |
| `docs/test-scenarios.md` | the grid (operation by layer), the priority levels, the scenario tables, rationale, assumptions |

## Add a scenario (bottom up; in brackets, the error when a step is skipped)

1. Row in `docs/test-scenarios.md`, next ID of its group, its Priority from the levels table, and the ID in its grid cell [`test XXX-000 is not in docs/test-scenarios.md`].
2. New payload: a builder in `src/test-data/job-offers.ts`; new random value: a generator in `factories.ts`. New precondition state: `offers.createIn(status, body?, flags?)`. New endpoint: one class in `src/api/<resource>/`, one export line.
3. `test()` in the topic file that shares the precondition, or a new file from `tests/_template/`. Title `XXX-000 <scenario>`, tags `{ tag: ["@<folder>", "@<layer>", "@<priority>"] }` on the `test()` call, the priority tag a copy of the row; calls through endpoint classes with `company`; a negative case passes the expected status last and names the error type [`A test title starts with its scenario ID`, `carries ...; expected @<folder>, one of ... and one of @p1, @p2, @p3`, `carries @p2; docs say P1`].
4. A matrix is a `const ROWS` table and one `test()` per row [`max-lines`].
5. `npx playwright test -c api-tests -g XXX-000`, then `npm run traceability`; `/verify` is the done gate.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `no schema for 500 on POST /job-offers` | the expected, and received, status is not documented for that operation | assert a documented status; if the spec is wrong, say so in `docs/test-scenarios.md` |
| `POST /job-offers: expected 201, received 422 {...}` | payload fails validation | read `fieldErrors`; fix the builder, not the assertion |
| `the oracle stays independent` | a spec or `src/` imports `stub/` | put the expected value in `src/oracle.ts` |
| `"OFR-001 ..." carries @offers; expected @offers, one of ... and one of @p1, @p2, @p3` | no layer or priority tag, two, or not the folder's tag | one layer and one priority per test; two things proved is two tests under one ID |
| `"TEN-005 ..." carries @p2; docs say P1` | the priority tag and the docs row disagree | the row decides; copy its Priority cell to the tag |
| `webServer` timeout | port 8080 busy (`lsof -i :8080`) or the stub crashed | `npm run stub` alone shows the error; outside CI a running stub is reused, old code included |
| `Test has unknown parameter "offers"` | `test` imported from `@playwright/test` | import from `@job-offer/fixtures/fixtures` |
