# api-tests: rules

Stack: TypeScript on the Playwright test runner (`request` fixture), ajv contract validation from `spec/job-offer-swagger.yml`, Hono reference stub in `stub/`.
Run: `npm test` (`TEST_ENV=local`: Playwright starts the stub as `webServer`); `TEST_ENV=staging npm test` targets that row of `config/environments.ts` and starts nothing; `API_BASE_URL=https://host/api/v1 npm test` for an ad-hoc target.

## Paths

- `spec/job-offer-swagger.yml` the contract, verbatim; `src/generated/schema.d.ts` its types (`npm run gen:types`, committed).
- `src/client.ts` `OPERATIONS` table from the spec and the `JobOfferApi` facade: one method per operation, returns an `ApiCall`.
- `src/contract.ts` `expectCall(call, status)`: asserts the status, validates the body against the spec, returns it typed.
- `src/fixtures.ts` `test` with `companyId`, `api`, `otherApi`, `anonApi`, `offers` (factory with teardown), `configure`.
- `src/payloads.ts` request builders; `src/workflow.ts` `advance()` for preconditions; `src/expected-paths.ts` the oracle.
- `stub/` `server.ts`, `app.ts`, `state-machine.ts`, `store.ts`, `validation.ts`. A means to run the suite, not a deliverable.
- `tests/<group>/*.spec.ts` one folder per business area; `tests/_template/` the file to copy.
- `docs/test-scenarios.md` the table the brief asks for, plus rationale and assumptions; `docs/evolving.md` how a new state enters.

## Critical rules

1. A spec reads a response only through `expectCall()`; never `request`, `.json()`, `.status()`. Checked by eslint and the pre-write hook.
2. `src/` and `tests/` never import `stub/`; `stub/` never imports `src/`. Checked by eslint and the hook.
3. Every `test()` title starts with its scenario ID (`TEN-001 ...`) and the ID is a row of `docs/test-scenarios.md`. Checked by eslint and `npm run traceability`.
4. Every test runs in its own company (`companyId` fixture, a fresh UUID); no shared or hardcoded ids. Checked by `harness-reviewer`.
5. Expected states come from `src/expected-paths.ts`, written from the spec; never from the stub. Checked by rule 2 and the reviewer.
6. Offers are created through the `offers` factory so teardown knows them. Checked by the reviewer.

## Add a scenario (bottom up; skipping a step gives the error in brackets)

1. Add the row to `docs/test-scenarios.md`, next ID of its group, all seven columns [`traceability: test XXX-000 is not in docs`].
2. New payload shape: a builder in `src/payloads.ts`. New precondition state: `offers.createIn(status, flags)` [a second copy of setup: reviewer Major].
3. New `test()` in the topic file that shares the precondition, or a new file from `tests/_template/template.spec.ts.example`; title `XXX-000 <scenario>` [eslint: "A test title starts with its scenario ID"].
4. A matrix is a `const ROWS` table and one `test()` per row in a `for` loop [`max-lines`: 60 per spec].
5. `npx playwright test -g XXX-000`, then `npm run verify` from the root.

`/add-api-scenario` runs this list.

## Reference architecture

Copy from `tests/workflow/`: the matrices, the gate test and the oracle are the model for everything else.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `no schema for 418 on POST /job-offers` | status not documented for that operation | assert a documented status; if the spec is wrong, say so in `docs/test-scenarios.md`, do not special-case |
| `expectCall: POST /job-offers expected 201, received 422 {...}` | payload fails validation | read `fieldErrors` in the message; fix the builder, not the assertion |
| eslint `no-restricted-imports` on `stub/` | oracle independence | put the expected value in `src/expected-paths.ts` |
| `webServer` timeout | port 8080 busy or the stub crashed | `npm run stub` alone shows the error |
| `Test has unknown parameter "offers"` | spec imports `test` from `@playwright/test` | import `test` from `@api/fixtures` |
