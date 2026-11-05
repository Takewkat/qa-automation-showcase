# api-tests: rules

Stack: TypeScript on the Playwright test runner (`request` fixture), ajv contract validation from `spec/job-offer-swagger.yml`, Hono reference stub in `stub/`.
Run: `npm test` on `TEST_ENV=local`, Playwright starts the stub as `webServer`. `TEST_ENV=staging npm test` targets that row of `config/environments.ts` and starts nothing. `API_BASE_URL=https://host/api/v1 npm test` for an ad-hoc target.
Rules: the table "Rules, each with its check" in the root `AGENTS.md`. Below: the paths, the checklist, the errors.

## Paths

| Path | Holds |
|---|---|
| `spec/job-offer-swagger.yml`, `src/generated/schema.d.ts` | the contract, verbatim, and its types (`npm run gen:types`, committed) |
| `src/client.ts` | `OPERATIONS` table from the spec and the `JobOfferApi` facade: one method per operation, asserts its success status or `{ expect: <status> }`, validates the body, returns it typed |
| `src/contract.ts` | `validate(operation, status, body)`: the response schema by path, method and status from the spec, ajv. Called by the facade, never by a spec |
| `src/fixtures.ts` | `test` with `companyId`, `api`, `otherApi`, `anonApi`, `offers` (factory; teardown withdraws and deletes, warns on a leftover), `configure` |
| `src/payloads.ts` | request builders |
| `src/workflow.ts` | `advance()` drives an offer to a status. Specs never call it, they use `offers.createIn(status, flags)` |
| `src/expected-paths.ts` | the oracle, written from the spec |
| `stub/` | `server.ts`, `app.ts`, `state-machine.ts`, `store.ts`, `validation.ts`. A means to run the suite, not a deliverable |
| `tests/<group>/*.spec.ts`, `tests/_template/` | one folder per business area, the file to copy. Model: `tests/workflow/` (matrices, gate test, oracle) |
| `docs/test-scenarios.md` | the table the brief asks for, plus rationale and assumptions |
| `docs/evolving.md` | how a new state enters |

## Add a scenario (bottom up; skipping a step gives the error in brackets)

1. Add the row to `docs/test-scenarios.md`, next ID of its group, all seven columns [`api-tests: test XXX-000 is not in docs/test-scenarios.md`].
2. New payload shape: a builder in `src/payloads.ts`. New precondition state: `offers.createIn(status, flags)` [`harness-reviewer` Major: a second copy of setup].
3. New `test()` in the topic file that shares the precondition, or a new file from `tests/_template/template.spec.ts.example`. Title `XXX-000 <scenario>` [`A test title starts with its scenario ID, for example "WFL-001 ..."`].
4. A matrix is a `const ROWS` table and one `test()` per row in a `for` loop [`max-lines`: `Maximum allowed is 60`].
5. From the root: `npx playwright test -c api-tests -g XXX-000`, then `npm run traceability`. `/verify` is the done gate.

`/add-api-scenario` runs this list.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `no schema for 418 on POST /job-offers` | status not documented for that operation | assert a documented status. If the spec is wrong, say so in `docs/test-scenarios.md`, never special-case |
| `POST /job-offers: expected 201, received 422 {...}` | payload fails validation | read `fieldErrors` in the message. Fix the builder, not the assertion |
| `Tests and src never import stub/: the oracle stays independent` | oracle independence | put the expected value in `src/expected-paths.ts` |
| `webServer` timeout | port 8080 busy or the stub crashed | `npm run stub` alone shows the error |
| `Test has unknown parameter "offers"` | spec imports `test` from `@playwright/test` | import `test` from `@api/fixtures` |
