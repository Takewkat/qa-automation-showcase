# api-tests: rules

Stack: TypeScript on the Playwright test runner (`request` fixture), ajv contract validation from `spec/job-offer-swagger.yml`, faker for random data, reference stub on `node:http` and zod in `stub/` (its own workspace).
Run: `npm test` on `TEST_ENV=local`, Playwright starts the stub as `webServer`. `TEST_ENV=staging npm test` targets that row of `config/environments.ts` and starts nothing. `API_BASE_URL=https://host/api/v1 npm test` for an ad-hoc target.
Rules: the table "Rules, each with its check" in the root `AGENTS.md`. Below: the paths, the checklist, the errors.

## Paths (import alias `@job-offer/*` = `src/*`)

| Path | Holds |
|---|---|
| `spec/job-offer-swagger.yml`, `src/generated/schema.d.ts` | the contract, verbatim, and its types (`npm run gen:types`, committed) |
| `src/api/common/api.ts`, `contract.ts` | the generic base of any endpoint, no job offer in it: `getUrl()`, `request()`, `checkStatusCode()`, `checkSchema()`, `getResponseBody()`, `send()` runs the four; `Contract` checks a response against a spec file |
| `src/api/job-offer-api.ts`, `types.ts` | the Job Offer service over that base: its spec file, the `X-Company-Id` header of the company; the models of the spec under their own names: `JobOffer`, `CreateJobOfferRequest`, `ErrorResponse`, `ValidationError`... |
| `src/api/<resource>/<action>.ts`, `index.ts` | one class per endpoint: `path`, `method`, `correctStatusCode`, one typed method. `new GetJobOffer(company).get<ErrorResponse>(id, 404)` asserts that status instead of the success one and types the body |
| `src/enum/job-offer.enum.ts` | `WorkflowFlags`, `JOB_OFFER_STATUSES`, `ERROR_CODES`; the status and action unions are `JobOfferStatus` and `TransitionAction` of `src/api/types.ts` |
| `src/oracle.ts` | expected values written from the spec: valid actions, editable, deletable and withdrawable statuses, the 8 happy paths, the invalid pairs |
| `src/test-data/factories.ts`, `job-offers.ts` | the generators (faker): company id, unknown offer id, title, city; request builders with overrides |
| `src/utils/workflow.ts` | `advance()` moves an offer to a status, `configure()` sets flags on the company |
| `src/cleanup/job-offers.cleanup.ts` | `cleanupJobOffers()`: withdraw, delete, close what is live; what it kept goes to the report, what failed to stderr |
| `src/fixtures/` | `job-offers.fixtures.ts`: `company`, `otherCompany`, `anonymous`, `malformedHeader`, `offers`, `otherOffers`, `configure`; `offers.factory.ts`; `fixtures.ts` chains them and exports `test` |
| `stub/` | `server.ts`, `router.ts`, `app.ts`, `state-machine.ts`, `store.ts`, `validation.ts`, its own `package.json` (zod). A means to run the suite, not a deliverable |
| `tests/<group>/*.spec.ts`, `tests/_template/` | one folder per business area, the file to copy. Model: `tests/workflow/` (matrices, gate test, oracle) |
| `docs/` | `test-scenarios.md` the table the brief asks for, plus rationale and assumptions; `evolving.md` how a new state enters |

## Add a scenario (bottom up; skipping a step gives the error in brackets)

1. Add the row to `docs/test-scenarios.md`, next ID of its group, all seven columns [`api-tests: test XXX-000 is not in docs/test-scenarios.md`].
2. New payload shape: a builder in `src/test-data/job-offers.ts`; a new random value: a generator in `src/test-data/factories.ts`, never `node:crypto` in a spec. New precondition state: `offers.createIn(status, flags)` [`harness-reviewer` Major: a second copy of setup]. New endpoint: one class in `src/api/<resource>/`, one export line in `src/api/index.ts`.
3. New `test()` in the topic file that shares the precondition, or a new file from `tests/_template/template.spec.ts.example`. Title `XXX-000 <scenario>`; calls go through endpoint classes with the `company` fixture, a negative case passes the expected status last and names the error type [`A test title starts with its scenario ID, for example "WFL-001 ..."`].
4. A matrix is a `const ROWS` table and one `test()` per row in a `for` loop [`max-lines`: `Maximum allowed is 60`].
5. From the root: `npx playwright test -c api-tests -g XXX-000`, then `npm run traceability`. `/verify` is the done gate.

`/add-api-scenario` runs this list.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `no schema for 500 on POST /job-offers` | the test expected, and the server answered, a status the spec does not document for that operation | assert a documented status. If the spec is wrong, say so in `docs/test-scenarios.md`, never special-case |
| `POST /job-offers: expected 201, received 422 {...}` | payload fails validation | read `fieldErrors` in the message. Fix the builder, not the assertion |
| `Tests and src never import stub/: the oracle stays independent` | oracle independence | put the expected value in `src/oracle.ts` |
| `webServer` timeout | port 8080 busy or the stub crashed | `npm run stub` alone shows the error |
| `Test has unknown parameter "offers"` | spec imports `test` from `@playwright/test` | import `test` from `@job-offer/fixtures/fixtures` |
